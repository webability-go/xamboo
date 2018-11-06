package core

import (
  "fmt"
  "crypto/tls"
  "net"
  "net/http"
  "time"
  "log"
  "github.com/gowebability/xamboo/utils"
)

// certificados desde la config
func mainHandler(w http.ResponseWriter, r *http.Request) {
  fmt.Printf("Req: %s %s %s\n", r.RequestURI , r.Host, r.URL.Path)
//  fmt.Println(r.Header)
  
  // CHECK THE REQUESTED VHOST: dispatch on the registered sites based on the config
  // 1. http, https, ftp, ftps, ws, wss ?
  // *** WHAT WILL WE SUPPORT ? (at least WS => CHECK TEST DONE)
  secure := false
  if (r.TLS != nil) {
    secure = true
  }

  // search for the correct config
  host, port, _ := net.SplitHostPort(r.Host)
  hostdef, listenerdef := Config.GetListener(host, port, secure)
  
  if (listenerdef != nil) {
    // SPLIT URI - QUERY to call the engine
    engine := &Engine {
      Method: r.Method,
      Page: r.URL.Path,
      Context: 0,
      Listener: listenerdef,
      Host: hostdef,
    }
//  data = append(data, fmt.Sprintf("TLS: %s - %s - %s - %s - %s - %s\n", r.TLS.Version, r.TLS.NegotiatedProtocol, r.TLS.CipherSuite, "", "", "" ))

    

    engine.Run(w, r)
  }
  // ERROR: NO LISTENER DEFINED 
  
}

func Run() error {
  fmt.Println("Starting Server")
  
  // Load the config
  err := Config.Load()
  if err != nil {
      fmt.Println(err.Error())
      return err
  }
    
  t := log.Logger{}

  finish := make(chan bool)
  
  http.HandleFunc("/", mainHandler)

  // build the different servers
  for _, l := range Config.Listeners {
    fmt.Println("Scanning Server " + l.Name)
    go func(listener Listener) {
      fmt.Println("Launching Server " + listener.Name)
      server := &http.Server{
        Addr: ":"+listener.Port,
        ReadTimeout:    time.Duration(listener.ReadTimeOut) * time.Second,
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

        tlsConfig := &tls.Config{}
        tlsConfig.Certificates = make([]tls.Certificate, numcertificates)
        i := 0
        for _, host := range Config.Hosts {
          if utils.SearchInArray(listener.Name, host.Listeners) {
            tlsConfig.Certificates[i], err = tls.LoadX509KeyPair(host.Cert, host.PrivateKey)
            if err != nil {
                t.Fatal(err)
            }
            i += 1
          }
        }
        tlsConfig.BuildNameToCertificate()
        server.TLSConfig = tlsConfig
        
        xserver, err := tls.Listen("tcp", ":" + listener.Port, tlsConfig)
        if err != nil {
            t.Fatal(err)
        }
        log.Fatal(server.Serve(xserver))
      } else {
      
        // *******************************************
        // VERIFICAR EL LISTEN AND SERVE POR DEFECTO SIN TLS; ESTA MAL IMPLEMENTADO
      
        log.Fatal(http.ListenAndServe(":" + listener.Port, nil))
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

