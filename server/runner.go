package server

import (
	"bufio"
	"compress/gzip"
	"crypto/subtle"
	"crypto/tls"
	"fmt"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/webability-go/xamboo/server/assets"
	"github.com/webability-go/xamboo/server/compiler"
	"github.com/webability-go/xamboo/server/config"
	//	"github.com/webability-go/xamboo/server/engines"
	"github.com/webability-go/xamboo/server/logger"
	"github.com/webability-go/xamboo/server/stat"
	"github.com/webability-go/xamboo/server/utils"
)

// Structures to wrap writer and log stats
type CoreWriter struct {
	http.ResponseWriter
	http.Hijacker
	status      int
	length      int
	zlength     int
	RequestStat *stat.RequestStat
	GZip        bool
	GZipWriter  *gzip.Writer
}

var zippers = sync.Pool{New: func() interface{} {
	return gzip.NewWriter(nil)
}}

func (cw *CoreWriter) CreateGZiper() {
	// If there is still not gzip writer, we create one based on cw WRITER
	// Get a Writer from the Pool
	gz := zippers.Get().(*gzip.Writer)
	gz.Reset(cw.ResponseWriter)
	cw.GZipWriter = gz
	cw.GZip = true
}

func (cw *CoreWriter) WriteHeader(status int) {
	cw.status = status
	cw.ResponseWriter.WriteHeader(status)
}

func (cw *CoreWriter) Write(b []byte) (int, error) {
	if cw.status == 0 {
		cw.status = 200
	}
	var n int
	var err error
	if cw.GZip {
		n, err = cw.GZipWriter.Write(b)
	} else {
		n, err = cw.ResponseWriter.Write(b)
	}
	cw.length += n
	return n, err
}

// Makes the hijack function visible for gorilla websockets
func (cw *CoreWriter) Hijack() (net.Conn, *bufio.ReadWriter, error) {
	if hj, ok := cw.ResponseWriter.(http.Hijacker); ok {
		return hj.Hijack()
	}
	return nil, nil, fmt.Errorf("http.Hijacker interface is not supported")
}

func StatLoggerWrapper(handler http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		req := stat.CreateRequestStat(r.Host+r.URL.Path, r.Method, r.Proto, 0, 0, 0, r.RemoteAddr)

		cw := CoreWriter{ResponseWriter: w, RequestStat: req}

		handler.ServeHTTP(&cw, r)
		if cw.GZip {
			// IF a gzip writer has been declared during the write, then we close it and put it back to the pool
			defer cw.GZipWriter.Close()
			defer zippers.Put(cw.GZipWriter)
		}

		req.UpdateStat(cw.status, cw.length)
		req.End()
	}
}

// certificados desde la config
func mainHandler(w http.ResponseWriter, r *http.Request) {

	//  fmt.Printf("Req: %s %s %s\n", r.RequestURI , r.Host, r.URL.Path)
	//  fmt.Println(r.Header)
	//  fmt.Printf("Remote IP: %s\n", r.RemoteAddr)

	// CHECK THE REQUESTED VHOST: dispatch on the registered sites based on the config
	// 1. http, https, ftp, ftps, ws, wss ?
	// *** WHAT WILL WE SUPPORT ? (at least WS => CHECK TEST DONE)
	secure := false
	if r.TLS != nil {
		secure = true
	}

	var host string
	var port string
	if poscolumn := strings.Index(r.Host, ":"); poscolumn < 0 {
		host = r.Host
		port = ""
		if r.TLS == nil {
			port = "80"
		} else {
			port = "443"
		}
	} else {
		// search for the correct config
		host, port, _ = net.SplitHostPort(r.Host)
	}
	hostdef, listenerdef := config.Config.GetListener(host, port, secure)

	if listenerdef != nil {

		// check AUTH
		if hostdef.Auth.Enabled {
			user, pass, ok := r.BasicAuth()
			if !ok || subtle.ConstantTimeCompare([]byte(user), []byte(hostdef.Auth.User)) != 1 || subtle.ConstantTimeCompare([]byte(pass), []byte(hostdef.Auth.Pass)) != 1 {
				w.Header().Set("WWW-Authenticate", `Basic realm="`+hostdef.Auth.Realm+`"`)
				w.WriteHeader(401)
				w.Write([]byte("Unauthorised.\n"))
				return
			}
		}

		// Check if gzip is available
		gzipcandidate := false
		if hostdef.GZip.Enabled {
			if strings.Contains(r.Header.Get("Accept-Encoding"), "gzip") {
				// type of data ok ?
				gzipcandidate = true
			}
		}

		// IS it a static file to server ?
		// 2 conditions: 1. Has an extension, 2. exists on file directory for this site
		pospoint := strings.Index(r.URL.Path, ".")
		posdoublepoint := strings.Index(r.URL.Path, "..")
		if pospoint >= 0 && posdoublepoint < 0 && len(hostdef.StaticPath) > 0 && utils.FileExists(hostdef.StaticPath+r.URL.Path) {

			// verify filetype and mimes if auth to gzip
			if gzipcandidate && utils.GzipFileCandidate(hostdef.GZip.Files, r.URL.Path) {
				w.Header().Set("Content-Encoding", "gzip")
				w.(*CoreWriter).CreateGZiper()
			}
			http.FileServer(http.Dir(hostdef.StaticPath)).ServeHTTP(w, r)
			return
		}

		// Check Origin
		if hostdef.Origin != nil {
			// origin MUST contain maindomain as ending string
			origin := r.Header.Get("Origin")
			candidate := true
			for _, d := range hostdef.Origin.MainDomains {
				dlen := len(d)
				// 7 is http:// minimum lentgh added to the domain name
				if len(origin) > dlen+7 && origin[len(origin)-dlen:] == d {
					candidate = false
					break
				}
			}
			if candidate {
				origin = hostdef.Origin.Default
			}

			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Methods", strings.Join(hostdef.Origin.Methods, ", "))
			w.Header().Set("Access-Control-Allow-Headers", strings.Join(hostdef.Origin.Headers, ", "))
			if hostdef.Origin.Credentials {
				w.Header().Set("Access-Control-Allow-Credentials", "true")
			}
		}

		// SPLIT URI - QUERY to call the engine
		pagesdir, _ := hostdef.Config.GetString("pagesdir")
		server := &Server{
			Method:        r.Method,
			Page:          r.URL.Path,
			Listener:      listenerdef,
			Host:          hostdef,
			PagesDir:      pagesdir,
			Code:          http.StatusOK,
			Recursivity:   map[string]int{},
			GZipCandidate: gzipcandidate,
		}
		server.Start(w, r)
	} else {
		// ERROR: NO LISTENER DEFINED
		http.Error(w, "Error, no site found", http.StatusNotImplemented)
	}
}

func Run(file string, version string) error {

	// Link the engines
	assets.EngineWrapper = wrapper
	assets.EngineWrapperString = wrapperstring

	// Load the config
	err := config.Config.Load(file)
	if err != nil {
		fmt.Println("ERROR EN CONFIG FILE: ", file, err.Error())
		return err
	}
	config.Config.Version = version

	logger.Start()

	compiler.Start()
	LinkEngines(config.Config.Engines)

	http.HandleFunc("/", StatLoggerWrapper(mainHandler))

	finish := make(chan bool)

	// build the different servers
	for _, l := range config.Config.Listeners {
		fmt.Println("Scanning Listener: L[" + l.Name + "]")
		go func(listener config.Listener) {

			llogger := logger.GetListenerLogger(listener.Name)

			fmt.Println("Launching Listener: L[" + listener.Name + "]")
			server := &http.Server{
				Addr:              ":" + listener.Port,
				ErrorLog:          llogger,
				ReadTimeout:       time.Duration(listener.ReadTimeOut) * time.Second,
				ReadHeaderTimeout: time.Duration(listener.ReadTimeOut) * time.Second,
				IdleTimeout:       time.Duration(listener.ReadTimeOut) * time.Second,
				WriteTimeout:      time.Duration(listener.WriteTimeOut) * time.Second,
				MaxHeaderBytes:    listener.HeaderSize,
			}

			// If the server is protocol HTTPS, we have to scan all the certificates for this listener
			if listener.Protocol == "https" {
				numcertificates := 0
				// We search for all the hosts on this listener
				for _, host := range config.Config.Hosts {
					if utils.SearchInArray(listener.Name, host.Listeners) {
						numcertificates++
					}
				}

				tlsConfig := &tls.Config{
					CipherSuites: []uint16{
						// obsolete tls options
						//              tls.TLS_RSA_WITH_RC4_128_SHA,
						//              tls.TLS_RSA_WITH_3DES_EDE_CBC_SHA,
						//              tls.TLS_RSA_WITH_AES_128_CBC_SHA,
						//              tls.TLS_RSA_WITH_AES_256_CBC_SHA,
						//              tls.TLS_RSA_WITH_AES_128_CBC_SHA256,
						//              tls.TLS_RSA_WITH_AES_128_GCM_SHA256,
						//              tls.TLS_RSA_WITH_AES_256_GCM_SHA384,
						//              tls.TLS_ECDHE_ECDSA_WITH_RC4_128_SHA,
						//              tls.TLS_ECDHE_RSA_WITH_RC4_128_SHA,
						//              tls.TLS_ECDHE_RSA_WITH_3DES_EDE_CBC_SHA,
						tls.TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA,
						tls.TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA,
						tls.TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA,
						tls.TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA,
						tls.TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA256,
						tls.TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA256,
						tls.TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,
						tls.TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256,
						tls.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,
						tls.TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384,
						tls.TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305,
						tls.TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305,
					},
				}
				tlsConfig.PreferServerCipherSuites = true
				tlsConfig.MinVersion = tls.VersionTLS12
				tlsConfig.MaxVersion = tls.VersionTLS12
				tlsConfig.Certificates = make([]tls.Certificate, numcertificates)
				i := 0
				var certerror error
				for _, host := range config.Config.Hosts {
					if utils.SearchInArray(listener.Name, host.Listeners) {
						tlsConfig.Certificates[i], certerror = tls.LoadX509KeyPair(host.Cert, host.PrivateKey)
						if certerror != nil {
							llogger.Fatal(certerror)
						}
						fmt.Println("Link Host H[" + host.Name + "] to L[" + listener.Name + "] Done")
						i += 1
					}
				}
				tlsConfig.BuildNameToCertificate()
				server.TLSConfig = tlsConfig

				xserver, err := tls.Listen("tcp", listener.IP+":"+listener.Port, tlsConfig)
				if err != nil {
					llogger.Fatal(err)
				}
				servererr := server.Serve(xserver)
				if servererr != nil {
					llogger.Fatal(err)
				}
			} else {
				// *******************************************
				// VERIFICAR EL LISTEN AND SERVE POR DEFECTO SIN TLS; ESTA MAL IMPLEMENTADO: HAY QUE USAR EL HANDLER Y TIMEOUTS Y ETC
				llogger.Fatal(http.ListenAndServe(listener.IP+":"+listener.Port, nil))
			}
		}(l)

	}

	<-finish
	return nil
}
