package redirect

import (
	"net/http"

	"github.com/webability-go/xamboo/components/host"
	"github.com/webability-go/xamboo/config"
	"github.com/webability-go/xamboo/loggers"
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

		slg := loggers.GetCoreLogger("errors")

		hw, ok := w.(host.HostWriter)
		if !ok {
			slg.Println("C[redirect]: Critical error: the writer is not a HostWriter (and that should not happen)", r, w)
			http.Error(w, "C[redirect]: Writer error (see logs for more info)", http.StatusInternalServerError)
			return
		}
		host := hw.GetHost()
		if host == nil {
			slg.Println("C[redirect]: Critical error: there is no HOST in the host writer (and that should not happen)", r, w)
			http.Error(w, "C[redirect]: Writer error (see logs for more info)", http.StatusInternalServerError)
			return
		}

		lg := loggers.GetHostLogger(host.Name, "sys")
		if host.Debug {
			lg.Println("C[redirect]: We are going to verify the redirect, enabled:", host.Redirect.Enabled)
		}

		// check Redirect
		if host.Redirect.Enabled {
			// verify url contains protocol and domain, or redirect to
			if (host.Redirect.Scheme == "https" && r.TLS == nil) || r.Host != host.Redirect.Host {
				if host.Debug {
					lg.Println("C[redirect]: Redirect activated to:", "https://"+host.Redirect.Host+r.URL.Path)
				}
				// rebuild the whole URL
				url := "https://" + host.Redirect.Host + r.URL.Path
				code := http.StatusPermanentRedirect
				http.Redirect(w, r, url, code)
				return
			}
		}

		if host.Debug {
			lg.Println("C[redirect]: No redirect. We are going to serve the handler.")
		}

		handler.ServeHTTP(w, r)

		if host.Debug {
			lg.Println("C[redirect]: We have served the handler.")
		}
	}
}
