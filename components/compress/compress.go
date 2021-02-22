package compress

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/webability-go/xamboo/utils"

	"github.com/webability-go/xamboo/components/host"
	"github.com/webability-go/xamboo/config"
)

var Component = &Compress{}

type Compress struct{}

func (comp *Compress) Start() {
}

func (comp *Compress) StartHost(host *config.Host) {
}

func (comp *Compress) NeedHandler() bool {
	return true
}

func (comp *Compress) Handler(handler http.HandlerFunc) http.HandlerFunc {
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

		// module not activated OR client not accepting Compress => normal server
		// If upgrade asked => web socket, do not compress
		// TODO(phil) Adds deflate too as compressor https://github.com/gorilla/handlers/blob/master/compress.go
		if !host.Compress.Enabled || !strings.Contains(r.Header.Get("Accept-Encoding"), "gzip") || r.Header.Get("Upgrade") != "" {
			handler.ServeHTTP(w, r) // normal serve
			return
		}

		compress := utils.GzipFileCandidate(host.Compress.Files, r.URL.Path)

		gw := writer{writer: hw, compress: compress}
		handler.ServeHTTP(&gw, r)

		gw.Close()

		hw.SetParam("bytestocompress", gw.length)
	}
}
