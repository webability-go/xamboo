package host

import (
	"net"
	"net/http"
	"strings"

	"github.com/webability-go/xamboo/config"
	"github.com/webability-go/xamboo/loggers"
)

func Handler(handler http.HandlerFunc) http.HandlerFunc {

	return func(w http.ResponseWriter, r *http.Request) {
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
		if listenerdef != nil && hostdef != nil {
			lg := loggers.GetHostLogger(hostdef.Name, "sys")

			hw := writer{writer: w, host: hostdef, listener: listenerdef} // is a HostWriter
			if hostdef.Debug {
				lg.Println("C[host] Host found, debug enabled. We are going to serve the handler:", hostdef.Name)
			}
			handler.ServeHTTP(&hw, r)
			if hostdef.Debug {
				lg.Println("C[host] We have served the handler:", hostdef.Name)
			}
		} else {
			// ERROR: NO LISTENER/HOST DEFINED
			slg := loggers.GetCoreLogger("errors")
			slg.Println("C[host] No host or site found:", host, port, r.URL)
			http.Error(w, "Error, no site found", http.StatusNotImplemented)
		}
	}
}
