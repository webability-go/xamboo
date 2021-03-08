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

		// priority> first gzip, more reliable
		acceptencoding := []string{"gzip", "deflate"}
		encoding := ""
		for _, enc := range acceptencoding {
			if strings.Contains(r.Header.Get("Accept-Encoding"), enc) {
				encoding = enc
				break
			}
		}
		// module not activated OR client not accepting Compress => normal server
		// If upgrade asked => web socket, do not compress
		if !host.Compress.Enabled || encoding == "" || r.Header.Get("Upgrade") != "" {
			if host.Debug {
				lg.Println("C[compress]: No compression needed. We are going to serve the handler.")
			}
			handler.ServeHTTP(w, r) // normal serve
			if host.Debug {
				lg.Println("C[compress]: We have served the handler.")
			}
			return
		}

		compress := utils.CompressFileCandidate(host.Compress.Files, r.URL.Path)

		if host.Debug {
			lg.Println("C[compress]: We are going to create the compresswriter, then serve the handler, method:", encoding)
		}

		gw := writer{writer: hw, compress: compress, encoding: encoding}
		handler.ServeHTTP(&gw, r)

		gw.Close()

		hw.SetParam("bytestocompress", gw.length)

		if host.Debug {
			lg.Println("C[compress]: We have served the handler.")
		}
	}
}
