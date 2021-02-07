package compress

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/webability-go/xamboo/utils"

	"github.com/webability-go/xamboo/components/host"
)

var Component = &Compress{}

type Compress struct{}

func (auth *Compress) NeedHandler() bool {
	return true
}

func (auth *Compress) Handler(handler http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

		hw, ok := w.(host.HostWriter)
		if !ok {
			fmt.Println("Compress component: ERROR DETECTED: the writer is not a HostWriter or the Listener/Host is not set (and that should not happen)", r, w)
			http.Error(w, "Compress component: Writer error", http.StatusInternalServerError)
			return
		}
		host := hw.GetHost()
		if host == nil {
			fmt.Println("Compress component: ERROR DETECTED: there is no HOST (and that should not happen)", r, w)
			http.Error(w, "Compress component: Writer error (see logs for more info)", http.StatusInternalServerError)
			return
		}

		// module not activated OR client not accepting gzip => normal server
		// If upgrade asked => web socket, do not compress
		// TODO(phil) Adds deflate too as compressor https://github.com/gorilla/handlers/blob/master/compress.go
		if !host.GZip.Enabled || !strings.Contains(r.Header.Get("Accept-Encoding"), "gzip") || r.Header.Get("Upgrade") != "" {
			handler.ServeHTTP(w, r) // normal serve
			return
		}

		gzip := utils.GzipFileCandidate(host.GZip.Files, r.URL.Path)

		gw := writer{writer: hw, gzip: gzip}
		handler.ServeHTTP(&gw, r)

		gw.Close()

		//		fmt.Println("Size before compress: ", gw.length)
	}
}
