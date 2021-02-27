package auth

import (
	"crypto/subtle"
	"net/http"

	"github.com/webability-go/xamboo/components/host"
	"github.com/webability-go/xamboo/config"
	"github.com/webability-go/xamboo/loggers"
)

var Component = &Auth{}

type Auth struct{}

func (auth *Auth) Start() {
}

func (auth *Auth) StartHost(host *config.Host) {
}

func (auth *Auth) NeedHandler() bool {
	return true
}

func (auth *Auth) Handler(handler http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

		slg := loggers.GetCoreLogger("errors")

		hw, ok := w.(host.HostWriter)
		if !ok {
			slg.Println("C[auth]: Critical error: the writer is not a HostWriter (and that should not happen)", r, w)
			http.Error(w, "C[auth]: Writer error (see logs for more info)", http.StatusInternalServerError)
			return
		}
		host := hw.GetHost()
		if host == nil {
			slg.Println("C[auth]: Critical error: there is no HOST in the host writer (and that should not happen)", r, w)
			http.Error(w, "C[auth]: Writer error (see logs for more info)", http.StatusInternalServerError)
			return
		}

		lg := loggers.GetHostLogger(host.Name, "sys")
		if host.Debug {
			lg.Println("C[auth]: We are going to verify the auth, enabled:", host.Auth.Enabled)
		}

		// check AUTH
		if host.Auth.Enabled {
			user, pass, ok := r.BasicAuth()
			if !ok || subtle.ConstantTimeCompare([]byte(user), []byte(host.Auth.User)) != 1 || subtle.ConstantTimeCompare([]byte(pass), []byte(host.Auth.Pass)) != 1 {
				if host.Debug {
					lg.Println("C[auth]: Auth required on:", host.Auth.Realm)
				}
				w.Header().Set("WWW-Authenticate", `Basic realm="`+host.Auth.Realm+`"`)
				w.WriteHeader(401)
				w.Write([]byte("Unauthorised.\n"))
				return
			}
		}

		if host.Debug {
			lg.Println("C[auth]: No auth required. We are going to serve the handler.")
		}

		handler.ServeHTTP(w, r)

		if host.Debug {
			lg.Println("C[auth]: We have served the handler.")
		}
	}
}
