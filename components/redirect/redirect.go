package redirect

import (
	"fmt"
	"net/http"

	"github.com/webability-go/xamboo/components/host"
	"github.com/webability-go/xamboo/config"
)

var Component = &Redirect{}

type Redirect struct{}

func (red *Redirect) Start() {
}

func (red *Redirect) StartHost(host *config.Host) {
}

func (red *Redirect) NeedHandler() bool {
	return true
}

func (red *Redirect) Handler(handler http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

		hw, ok := w.(host.HostWriter)
		if !ok {
			fmt.Println("Redirect component: ERROR DETECTED: the writer is not a HostWriter or the Listener/Host is not set (and that should not happen)", r, w)
			http.Error(w, "Redirect component: Writer error", http.StatusInternalServerError)
			return
		}
		host := hw.GetHost()
		if host == nil {
			fmt.Println("Redirect component: ERROR DETECTED: there is no HOST (and that should not happen)", r, w)
			http.Error(w, "Redirect component: Writer error (see logs for more info)", http.StatusInternalServerError)
			return
		}

		// TODO(phil) adjust to any scheme

		// check Redirect
		if host.Redirect.Enabled {
			// verify url contains protocol and domain, or redirect to
			if (host.Redirect.Scheme == "https" && r.TLS == nil) || r.Host != host.Redirect.Host {
				// rebuild the whole URL
				url := "https://" + host.Redirect.Host + r.URL.Path
				code := http.StatusPermanentRedirect
				http.Redirect(w, r, url, code)
				return
			}
		}

		handler.ServeHTTP(w, r)
	}
}
