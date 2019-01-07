package engine

import (
  "fmt"
  "strings"
  "os"
  "crypto/tls"
  "net"
  "bufio"
  "net/http"
  "plugin"
  "time"
  "log"

  "github.com/webability-go/xconfig"

  "github.com/webability-go/xamboo/utils"
  "github.com/webability-go/xamboo/config"
  "github.com/webability-go/xamboo/engine/context"
  "github.com/webability-go/xamboo/engine/servers"
  "github.com/webability-go/xamboo/compiler"
  "github.com/webability-go/xamboo/stat"
)

// Structures to wrap writer and log stats
type coreWriter struct {
  http.ResponseWriter
  http.Hijacker
  status int
  length int
}

func (cw *coreWriter) WriteHeader(status int) {
  cw.status = status
  cw.ResponseWriter.WriteHeader(status)
}

func (cw *coreWriter) Write(b []byte) (int, error) {
  if cw.status == 0 {
    cw.status = 200
  }
  n, err := cw.ResponseWriter.Write(b)
  cw.length += n
  return n, err
}

// Makes the hijack function visible for gorilla websockets
func (cw *coreWriter) Hijack() (net.Conn, *bufio.ReadWriter, error) {
	if hj, ok := cw.ResponseWriter.(http.Hijacker); ok {
		return hj.Hijack()
	}
	return nil, nil, fmt.Errorf("http.Hijacker interface is not supported")
}

func StatLoggerWrapper(handler http.HandlerFunc) http.HandlerFunc {
  return func(w http.ResponseWriter, r *http.Request) {
    start := time.Now()
    cw := coreWriter{ResponseWriter: w}
    
    handler.ServeHTTP(&cw, r)
    
    duration := time.Now().Sub(start)
    stat.AddStat("", cw.status, cw.length, duration)
    
/*
    Log(LogEntry{
      Host:       r.Host,
      RemoteAddr: r.RemoteAddr,
      Method:     r.Method,
      RequestURI: r.RequestURI,
      Proto:      r.Proto,
      Status:     sw.status,
      ContentLen: sw.length,
      UserAgent:  r.Header.Get("User-Agent"),
      Duration:   duration,
    })
*/
  }
}

// certificados desde la config
func mainHandler(w http.ResponseWriter, r *http.Request) {
//  fmt.Printf("Req: %s %s %s\n", r.RequestURI , r.Host, r.URL.Path)
//  fmt.Println(r.Header)
  fmt.Printf("Remote IP: %s\n", r.RemoteAddr)
  
  // CHECK THE REQUESTED VHOST: dispatch on the registered sites based on the config
  // 1. http, https, ftp, ftps, ws, wss ?
  // *** WHAT WILL WE SUPPORT ? (at least WS => CHECK TEST DONE)
  secure := false
  if (r.TLS != nil) {
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
    
    // IS it a static file to server ?
    // 2 conditions: 1. Has an extension, 2. exists on file directory for this site
    pospoint := strings.Index(r.URL.Path, ".")
    posdoublepoint := strings.Index(r.URL.Path, "..")
    if pospoint >= 0 && posdoublepoint < 0 && len(hostdef.StaticPath) > 0 && utils.FileExists(hostdef.StaticPath + r.URL.Path) {
      http.FileServer(http.Dir(hostdef.StaticPath)).ServeHTTP(w, r)
      return
    }
    
    // SPLIT URI - QUERY to call the engine
    engine := &Engine {
      Method: r.Method,
      Page: r.URL.Path,
      Listener: listenerdef,
      Host: hostdef,
      Plugins: make(map[string]*plugin.Plugin),
    }

    // creates user plugins
    plugins, _ := hostdef.Config.Get("plugin")
    if plugins != nil {
      c_plugins := plugins.(*xconfig.XConfig)
    
      for app, _ := range c_plugins.Parameters {
        plugindata, _ := c_plugins.Get(app)
        if plugindata != nil {
          c_plugindata := plugindata.(*xconfig.XConfig)
          
          fmt.Println(c_plugindata.Get("library"))
    
          p1, _ := c_plugindata.GetString("library")
          lib, err := plugin.Open(p1)
          if err != nil {
            fmt.Println("ERROR: USER PLUGIN APPLICATION COULD NOT LOAD: " + app)
            fmt.Println(err)
          } else {
            engine.Plugins[app] = lib
          }
        }
      }
    }

    engine.Start(w, r)
  } else {
    // ERROR: NO LISTENER DEFINED 
    http.Error(w, "Error, no site found", http.StatusNotImplemented)
  }
}

func Run(file string) error {

  servers.Start()
  go compiler.Supervisor()
  
  // Link the engines
  context.EngineWrapper = wrapper
  context.EngineWrapperString = wrapperstring

  // Load the config
  err := config.Config.Load(file)
  if err != nil {
      fmt.Println(err.Error())
      return err
  }
  
  // Setup loggers (put them in CONFIG)
  logger := log.New(os.Stdout, "http: ", log.LstdFlags)
  logger.Println("Server is starting...")

  http.HandleFunc("/", StatLoggerWrapper(mainHandler))

  finish := make(chan bool)

  // build the different servers
  for _, l := range config.Config.Listeners {
    fmt.Println("Scanning Server " + l.Name)
    go func(listener config.Listener) {
      fmt.Println("Launching Server " + listener.Name)
      server := &http.Server{
        Addr: ":"+listener.Port,
        ErrorLog: logger,
        ReadTimeout:    time.Duration(listener.ReadTimeOut) * time.Second,
        ReadHeaderTimeout: time.Duration(listener.ReadTimeOut) * time.Second,
        IdleTimeout: time.Duration(listener.ReadTimeOut) * time.Second,
        WriteTimeout:   time.Duration(listener.WriteTimeOut) * time.Second,
        MaxHeaderBytes: listener.HeaderSize,
      }
    
      // If the server is protocol HTTPS, we have to scan all the certificates for this listener
      if (listener.Protocol == "https") {
        numcertificates := 0
        // We search for all the hosts on this listener
        for _, host := range config.Config.Hosts {
          if utils.SearchInArray(listener.Name, host.Listeners) {
            numcertificates += 1
          }
        }

        tlsConfig := &tls.Config{
          CipherSuites: []uint16{
//              tls.TLS_RSA_WITH_RC4_128_SHA,
//              tls.TLS_RSA_WITH_3DES_EDE_CBC_SHA,
//              tls.TLS_RSA_WITH_AES_128_CBC_SHA,
//              tls.TLS_RSA_WITH_AES_256_CBC_SHA,
//              tls.TLS_RSA_WITH_AES_128_CBC_SHA256,
//              tls.TLS_RSA_WITH_AES_128_GCM_SHA256,
//              tls.TLS_RSA_WITH_AES_256_GCM_SHA384,
//              tls.TLS_ECDHE_ECDSA_WITH_RC4_128_SHA,
              tls.TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA,
              tls.TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA,
//              tls.TLS_ECDHE_RSA_WITH_RC4_128_SHA,
//              tls.TLS_ECDHE_RSA_WITH_3DES_EDE_CBC_SHA,
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
        for _, host := range config.Config.Hosts {
          if utils.SearchInArray(listener.Name, host.Listeners) {
            tlsConfig.Certificates[i], err = tls.LoadX509KeyPair(host.Cert, host.PrivateKey)
            if err != nil {
              logger.Fatal(err)
            }
            i += 1
          }
        }
        tlsConfig.BuildNameToCertificate()
        server.TLSConfig = tlsConfig

        xserver, err := tls.Listen("tcp", listener.IP + ":" + listener.Port, tlsConfig)
        if err != nil {
          logger.Fatal(err)
        }
        servererr := server.Serve(xserver)
        if servererr != nil {
          logger.Fatal(err)
        }
      } else {
        // *******************************************
        // VERIFICAR EL LISTEN AND SERVE POR DEFECTO SIN TLS; ESTA MAL IMPLEMENTADO: HAY QUE USAR EL HANDLER Y TIMEOUTS Y ETC
        logger.Fatal(http.ListenAndServe(listener.IP + ":" + listener.Port, nil))
      }
    }(l)
    
  }
  
  <-finish
  return nil
}

