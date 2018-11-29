package core

import (
  "fmt"
  "strings"
  "os"
  "crypto/tls"
  "net"
  "net/http"
  "time"
  "log"
  "github.com/webability-go/xamboo/utils"
  "github.com/webability-go/xamboo/server"
)

const VERSION = "0.0.2"
var QT int

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
  } else {
    // search for the correct config
    host, port, _ = net.SplitHostPort(r.Host)
  }
  hostdef, listenerdef := Config.GetListener(host, port, secure)
  
  if listenerdef != nil {
    // SPLIT URI - QUERY to call the engine
    engine := &Engine {
      Method: r.Method,
      Page: r.URL.Path,
      Listener: listenerdef,
      Host: hostdef,
      QT: &QT,
    }
//  data = append(data, fmt.Sprintf("TLS: %s - %s - %s - %s - %s - %s\n", r.TLS.Version, r.TLS.NegotiatedProtocol, r.TLS.CipherSuite, "", "", "" ))

    

    engine.Start(w, r)
  }
  // ERROR: NO LISTENER DEFINED 
  
}

func printQT() {
  for {
    // pages served quantity
    // quantity of .page cache
    // quantity of .instance cache
    // quantity of .code cache
    fmt.Println(QT, server.PageCache.Count(), server.InstanceCache.Count(), server.CodeCache.Count())

    time.Sleep(5 * time.Second)
    
    
  }
}

func Run(file string) error {
  QT = 0;
  
  go printQT()

  // Load the config
  err := Config.Load(file)
  if err != nil {
      fmt.Println(err.Error())
      return err
  }
    
  logger := log.New(os.Stdout, "http: ", log.LstdFlags)
  logger.Println("Server is starting...")
  logger.Println(QT)

  finish := make(chan bool)
  
  http.HandleFunc("/", mainHandler)

  // build the different servers
  for _, l := range Config.Listeners {
    fmt.Println("Scanning Server " + l.Name)
    go func(listener Listener) {
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
        for _, host := range Config.Hosts {
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
        for _, host := range Config.Hosts {
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
        // VERIFICAR EL LISTEN AND SERVE POR DEFECTO SIN TLS; ESTA MAL IMPLEMENTADO
      
        logger.Fatal(http.ListenAndServe(listener.IP + ":" + listener.Port, nil))
      }
    }(l)
    
  }
  
  <-finish
  
/*
  numcertificates := 1
  
  t := log.Logger{}


  tlsConfig := &tls.Config{}
  tlsConfig.Certificates = make([]tls.Certificate, numcertificates)
  // go http server treats the 0'th key as a default fallback key
  tlsConfig.Certificates[0], err = tls.LoadX509KeyPair("/etc/letsencrypt/live/developers.webability.info/cert.pem", "/etc/letsencrypt/live/developers.webability.info/privkey.pem")
  if err != nil {
      t.Fatal(err)
  }
  tlsConfig.BuildNameToCertificate()

  http.HandleFunc("/", mainHandler)
  server := &http.Server{
      Addr: ":"+port,
      ReadTimeout:    120 * time.Second,
      WriteTimeout:   120 * time.Second,
      MaxHeaderBytes: 1 << 20,
      TLSConfig:      tlsConfig,
  }

  listener, err := tls.Listen("tcp", ":82", tlsConfig)
  if err != nil {
      t.Fatal(err)
  }
  log.Fatal(server.Serve(listener))
  */
  
  return nil
}

