package origin

import (
	"net/http"
	"strings"

	"github.com/webability-go/xamboo/components/host"
	"github.com/webability-go/xamboo/config"
	"github.com/webability-go/xamboo/loggers"
)

var Component = &Origin{}

type Origin struct{}

func (ori *Origin) Start() {
}

func (ori *Origin) StartHost(host *config.Host) {
}

func (ori *Origin) NeedHandler() bool {
	return true
}

func (ori *Origin) Handler(handler http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

		slg := loggers.GetCoreLogger("errors")

		hw, ok := w.(host.HostWriter)
		if !ok {
			slg.Println("C[origin]: Critical error: the writer is not a HostWriter (and that should not happen)", r, w)
			http.Error(w, "C[origin]: Writer error (see logs for more info)", http.StatusInternalServerError)
			return
		}
		host := hw.GetHost()
		if host == nil {
			slg.Println("C[origin]: Critical error: there is no HOST in the host writer (and that should not happen)", r, w)
			http.Error(w, "C[origin]: Writer error (see logs for more info)", http.StatusInternalServerError)
			return
		}

		lg := loggers.GetHostLogger(host.Name, "sys")
		if host.Debug {
			lg.Println("C[origin]: We are going to verify the origin, enabled:", host.Origin.Enabled)
		}

		if host.Origin.Enabled {
			// origin MUST contain maindomain as ending string
			origin := r.Header.Get("Origin")
			candidate := true
			for _, d := range host.Origin.MainDomains {
				dlen := len(d)
				// 7 is http:// minimum lentgh added to the domain name
				if len(origin) > dlen+7 && origin[len(origin)-dlen:] == d {
					candidate = false
					break
				}
			}
			if candidate {
				origin = host.Origin.Default
			}

			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Methods", strings.Join(host.Origin.Methods, ", "))
			w.Header().Set("Access-Control-Allow-Headers", strings.Join(host.Origin.Headers, ", "))
			if host.Origin.Credentials {
				w.Header().Set("Access-Control-Allow-Credentials", "true")
			}
			if host.Debug {
				lg.Println("C[origin]: CORS headers set:", origin)
			}
		}

		if host.Debug {
			lg.Println("C[origin]: We are going to serve the handler.")
		}
		handler.ServeHTTP(w, r)
		if host.Debug {
			lg.Println("C[origin]: We have served the handler.")
		}
	}
}
