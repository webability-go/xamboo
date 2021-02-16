package auth

import (
	"crypto/subtle"
	"fmt"
	"net/http"

	"github.com/webability-go/xamboo/components/host"
)

var Component = &Auth{}

type Auth struct{}

func (auth *Auth) Start() {
}

func (auth *Auth) NeedHandler() bool {
	return true
}

func (auth *Auth) Handler(handler http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

		hw, ok := w.(host.HostWriter)
		if !ok {
			fmt.Println("Auth component: ERROR DETECTED: the writer is not a HostWriter or the Listener/Host is not set (and that should not happen)", r, w)
			http.Error(w, "Auth component: Writer error (see logs for more info)", http.StatusInternalServerError)
			return
		}
		host := hw.GetHost()
		if host == nil {
			fmt.Println("Auth component: ERROR DETECTED: there is no HOST (and that should not happen)", r, w)
			http.Error(w, "Auth component: Writer error (see logs for more info)", http.StatusInternalServerError)
			return
		}

		// check AUTH
		if host.Auth.Enabled {
			user, pass, ok := r.BasicAuth()
			if !ok || subtle.ConstantTimeCompare([]byte(user), []byte(host.Auth.User)) != 1 || subtle.ConstantTimeCompare([]byte(pass), []byte(host.Auth.Pass)) != 1 {
				w.Header().Set("WWW-Authenticate", `Basic realm="`+host.Auth.Realm+`"`)
				w.WriteHeader(401)
				w.Write([]byte("Unauthorised.\n"))
				return
			}
		}

		handler.ServeHTTP(w, r)
	}
}
