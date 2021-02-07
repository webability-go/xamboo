package xamboo

import (
	"crypto/tls"
	"log"
	"net/http"
	"time"

	"github.com/webability-go/xamboo/assets"
	"github.com/webability-go/xamboo/config"
	"github.com/webability-go/xamboo/logger"
	"github.com/webability-go/xamboo/utils"

	"github.com/webability-go/xamboo/components"
	"github.com/webability-go/xamboo/components/host"
	"github.com/webability-go/xamboo/components/stat"
	"github.com/webability-go/xamboo/engines"
)

func Run(file string) error {

	// Load the language if needed for messages

	// Link the engines
	assets.EngineWrapper = wrapper
	assets.EngineWrapperString = wrapperstring

	// Load the config
	err := config.Config.Load(file)
	if err != nil {
		log.Println("Error parsing Config File: ", file, err)
		return err
	}
	config.Config.Version = VERSION

	logger.Start()
	stat.Start()
	components.Link(config.Config.Components)
	engines.Link(config.Config.Engines)

	//	var handler = StatLoggerWrapper(mainHandler)

	// The encapsilation system works as follow:
	// EXTERNAL LAYER:
	//   The main listener/host dispatcher. Will create a core writer to link the listener and host to the request.
	// COMPONENT LAYERS:
	//   Every component will test if it is available on the host, and call it if yes.
	// SERVER LAYER:
	//   Will finally call the server layer to resolve the page or file.

	var handler = serverHandler
	// build Handlers
	for _, componentid := range components.ComponentsOrder {
		if components.Components[componentid].NeedHandler() {
			handler = components.Components[componentid].Handler(handler)
		}
	}
	handler = host.Handler(handler)

	http.HandleFunc("/", handler)

	// build the different servers
	xlogger := logger.GetCoreLogger("sys")
	for _, l := range config.Config.Listeners {
		xlogger.Println("Scanning Listener: L[" + l.Name + "]")
		go func(listener assets.Listener) {

			llogger := logger.GetListenerLogger(listener.Name, "sys")

			xlogger.Println("Launching Listener: L[" + listener.Name + "]")
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
				tlsConfig.MaxVersion = tls.VersionTLS13
				tlsConfig.Certificates = make([]tls.Certificate, numcertificates)
				i := 0
				var certerror error
				for _, host := range config.Config.Hosts {
					if utils.SearchInArray(listener.Name, host.Listeners) {
						tlsConfig.Certificates[i], certerror = tls.LoadX509KeyPair(host.Cert, host.PrivateKey)
						if certerror != nil {
							llogger.Fatal(certerror)
						}
						xlogger.Println("Link Host H[" + host.Name + "] to L[" + listener.Name + "] Done")
						i++
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

	finish := make(chan bool)
	<-finish // never finish by itself for now (OS will take care of this)
	return nil
}
