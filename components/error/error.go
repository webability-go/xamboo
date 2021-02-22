package error

import (
	"fmt"
	"net/http"

	"github.com/webability-go/xamboo/components/host"
	"github.com/webability-go/xamboo/config"
)

var Component = &Error{}

type Error struct{}

func (err *Error) Start() {
}

func (err *Error) StartHost(host *config.Host) {
}

func (err *Error) NeedHandler() bool {
	return true
}

func (err *Error) Handler(handler http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

		hw, ok := w.(host.HostWriter)
		if !ok {
			fmt.Println("FileServer component: ERROR DETECTED: the writer is not a HostWriter or the Listener/Host is not set (and that should not happen)", r, w)
			http.Error(w, "FileServer component: Writer error", http.StatusInternalServerError)
			return
		}
		host := hw.GetHost()
		if host == nil {
			fmt.Println("FileServer component: ERROR DETECTED: there is no HOST (and that should not happen)", r, w)
			http.Error(w, "FileServer component: Writer error (see logs for more info)", http.StatusInternalServerError)
			return
		}

		if host.FileServer.Enabled {
			http.Error(w, "404 Not Found", http.StatusNotFound)
			return
		}
		handler.ServeHTTP(w, r)
	}
}
