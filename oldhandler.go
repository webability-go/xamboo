package xamboo

import (
	"bufio"
	"compress/gzip"
	"crypto/subtle"
	"fmt"
	"net"
	"net/http"
	"strings"
	"sync"

	"github.com/webability-go/xamboo/components/stat"
	"github.com/webability-go/xamboo/config"
	"github.com/webability-go/xamboo/utils"
)

var zippers = sync.Pool{New: func() interface{} {
	return gzip.NewWriter(nil)
}}

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
	return nil, nil, fmt.Errorf("http.Hijacker interface is not supported") // should not happen
}

func StatLoggerWrapper(handler http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		req := stat.CreateRequestStat(r.Host+r.URL.Path, r.Method, r.Proto, 0, 0, 0, r.RemoteAddr)

		cw := CoreWriter{ResponseWriter: w, RequestStat: req}

		handler.ServeHTTP(&cw, r)
		if cw.GZip {
			// IF a gzip writer has been declared during the write, then we close it and put it back to the pool
			defer zippers.Put(cw.GZipWriter)
			defer cw.GZipWriter.Close()
		}

		req.UpdateStat(cw.status, cw.length)
		req.End()
	}
}

// certificadtes from config
func mainHandler(w http.ResponseWriter, r *http.Request) {

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
		cw, ok := w.(*CoreWriter)
		if ok && cw.RequestStat != nil {
			cw.RequestStat.Hostname = hostdef.Name
		} else {
			fmt.Println("ERROR DETECTED: the writer is not a CoreWriter or the RequestStat is not set (and that should not happen)", r, w)
			http.Error(w, "Writer error", http.StatusInternalServerError)
			return
		}

		// check Redirect
		if hostdef.Redirect.Enabled {
			// verify url contains protocol and domain, or redirect to
			if (hostdef.Redirect.Scheme == "https" && r.TLS == nil) || r.Host != hostdef.Redirect.Host {
				// rebuild the whole URL
				url := "https://" + hostdef.Redirect.Host + r.URL.Path
				code := http.StatusPermanentRedirect
				http.Redirect(w, r, url, code)
				return
			}
		}
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

		// IS it a static file to server ? (No dynamic CMS config available)
		pagesdir, _ := hostdef.Config.GetString("pagesdir")
		mustservefile := false
		if pagesdir == "" {
			mustservefile = true
		}

		// 2 conditions: 1. Has an extension, 2. exists on file directory for this site
		pospoint := strings.Index(r.URL.Path, ".")
		posdoublepoint := strings.Index(r.URL.Path, "..")
		if mustservefile || (pospoint >= 0 && posdoublepoint < 0 && len(hostdef.StaticPath) > 0 && utils.FileExists(hostdef.StaticPath+r.URL.Path)) {

			// verify filetype and mimes if auth to gzip
			if gzipcandidate && utils.GzipFileCandidate(hostdef.GZip.Files, r.URL.Path) {
				w.Header().Set("Content-Encoding", "gzip")
				w.(*CoreWriter).CreateGZiper()
			}
			http.FileServer(http.Dir(hostdef.StaticPath)).ServeHTTP(w, r)
			return
		}

		// Check Origin
		if hostdef.Origin.Enabled {
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
