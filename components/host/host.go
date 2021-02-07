package host

import (
	"net"
	"net/http"
	"strings"

	"github.com/webability-go/xamboo/config"
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
			hw := writer{writer: w, host: hostdef, listener: listenerdef} // is a HostWriter
			handler.ServeHTTP(&hw, r)
		} else {
			// ERROR: NO LISTENER DEFINED
			http.Error(w, "Error, no site found", http.StatusNotImplemented)
		}
	}
}
