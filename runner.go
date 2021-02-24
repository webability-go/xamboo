package xamboo

import (
	"crypto/tls"
	"log"
	"net/http"
	"time"

	"github.com/webability-go/xamboo/applications"
	"github.com/webability-go/xamboo/cms/engines"
	"github.com/webability-go/xamboo/components"
	"github.com/webability-go/xamboo/components/host"
	"github.com/webability-go/xamboo/config"
	"github.com/webability-go/xamboo/loggers"
	"github.com/webability-go/xamboo/utils"
)

func Run(file string) error {

	// Load the language if needed for messages

	// Link the engines
	//	assets.EngineWrapper = cms.Wrapper
	//	assets.EngineWrapperString = cms.Wrapperstring

	// Load the config, FIRST PASS
	err := config.Config.Load(file)
	if err != nil {
		log.Println("Error parsing Config File: ", file, err)
		return err
	}
	config.Config.Version = VERSION
	// Launch the system based on Config
	// Launch system wide Loggers
	loggers.StartSystem()
	// Link engines (load external apps and create linker matrix)
	engines.Link()
	// Link components and call Start to start them globally
	components.Link()
	// link Applications and call StartHost to start them on each Hosts
	applications.Link()
	// Launch remaining loggers: listeners, hosts (they may link to an application)
	loggers.Start()
	// Finally link the logs call for loggers
	applications.LinkCalls()
	// And call hosts starts for components
	components.StartHost()

	// The encapsulation system works as follow (all the layers are in order in the main config file):
	// EXTERNAL LAYER:
	//   The main listener/host dispatcher. Will create a core writer to link the listener and host to the request.
	// COMPONENT LAYERS:
	//   Every component will test if it is available on the host, and call it if yes.
	// SERVER LAYER:
	//   Will call the server layer to resolve the page or file.
	// ERROR LAYER:
	//   Will finally call the error handler.

	handler := func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, "404 Not Found", http.StatusNotFound)
	}
	// build Handlers
	for _, componentid := range components.ComponentsOrder {
		if components.Components[componentid].NeedHandler() {
			handler = components.Components[componentid].Handler(handler)
		}
	}
	handler = host.Handler(handler)

	http.HandleFunc("/", handler)

	// build the different servers
	xlogger := loggers.GetCoreLogger("sys")
	for _, l := range config.Config.Listeners {
		xlogger.Println("Scanning Listener: L[" + l.Name + "]")
		go func(listener config.Listener) {

			llogger := loggers.GetListenerLogger(listener.Name, "sys")

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

func OverLoad() error {
	err := config.OverLoad(config.Config.File)
	if err != nil {
		return err
	}
	// restart Hosts
	components.StartHost()
	return nil
}
