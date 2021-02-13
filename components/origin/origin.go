package origin

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/webability-go/xamboo/components/host"
)

var Component = &Origin{}

type Origin struct{}

func (ori *Origin) Start() {
}

func (ori *Origin) NeedHandler() bool {
	return true
}

func (ori *Origin) Handler(handler http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

		hw, ok := w.(host.HostWriter)
		if !ok {
			fmt.Println("Origin component: ERROR DETECTED: the writer is not a HostWriter or the Listener/Host is not set (and that should not happen)", r, w)
			http.Error(w, "Origin component: Writer error", http.StatusInternalServerError)
			return
		}
		host := hw.GetHost()
		if host == nil {
			fmt.Println("Origin component: ERROR DETECTED: there is no HOST (and that should not happen)", r, w)
			http.Error(w, "Origin component: Writer error (see logs for more info)", http.StatusInternalServerError)
			return
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
		}

		handler.ServeHTTP(w, r)
	}
}
