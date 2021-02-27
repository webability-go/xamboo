package compress

import (
	"net/http"
	"strings"

	"github.com/webability-go/xamboo/utils"

	"github.com/webability-go/xamboo/components/host"
	"github.com/webability-go/xamboo/config"
	"github.com/webability-go/xamboo/loggers"
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

		slg := loggers.GetCoreLogger("errors")

		hw, ok := w.(host.HostWriter)
		if !ok {
			slg.Println("C[compress]: Critical error: the writer is not a HostWriter (and that should not happen)", r, w)
			http.Error(w, "C[compress]: Writer error (see logs for more info)", http.StatusInternalServerError)
			return
		}
		host := hw.GetHost()
		if host == nil {
			slg.Println("C[compress]: Critical error: there is no HOST in the host writer (and that should not happen)", r, w)
			http.Error(w, "C[compress]: Writer error (see logs for more info)", http.StatusInternalServerError)
			return
		}

		lg := loggers.GetHostLogger(host.Name, "sys")

		// module not activated OR client not accepting Compress => normal server
		// If upgrade asked => web socket, do not compress
		// TODO(phil) Adds deflate too as compressor https://github.com/gorilla/handlers/blob/master/compress.go
		if !host.Compress.Enabled || !strings.Contains(r.Header.Get("Accept-Encoding"), "gzip") || r.Header.Get("Upgrade") != "" {
			if host.Debug {
				lg.Println("C[compress]: No compression needed. We are going to serve the handler.")
			}
			handler.ServeHTTP(w, r) // normal serve
			if host.Debug {
				lg.Println("C[compress]: We have served the handler.")
			}
			return
		}

		compress := utils.GzipFileCandidate(host.Compress.Files, r.URL.Path)

		if host.Debug {
			lg.Println("C[compress]: We are going to create the compresswriter, then serve the handler.")
		}

		gw := writer{writer: hw, compress: compress}
		handler.ServeHTTP(&gw, r)

		gw.Close()

		hw.SetParam("bytestocompress", gw.length)

		if host.Debug {
			lg.Println("C[compress]: We have served the handler.")
		}
	}
}
