package error

import (
	"net/http"

	"github.com/webability-go/xamboo/components/host"
	"github.com/webability-go/xamboo/config"
	"github.com/webability-go/xamboo/loggers"
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

		slg := loggers.GetCoreLogger("errors")

		hw, ok := w.(host.HostWriter)
		if !ok {
			slg.Println("C[error]: Critical error: the writer is not a HostWriter (and that should not happen)", r, w)
			http.Error(w, "C[error]: Writer error (see logs for more info)", http.StatusInternalServerError)
			return
		}
		host := hw.GetHost()
		if host == nil {
			slg.Println("C[error]: Critical error: there is no HOST in the host writer (and that should not happen)", r, w)
			http.Error(w, "C[error]: Writer error (see logs for more info)", http.StatusInternalServerError)
			return
		}

		lg := loggers.GetHostLogger(host.Name, "sys")
		if host.Debug {
			lg.Println("C[error]: We are going to verify the fileserver, enabled:", host.Error.Enabled)
		}

		if host.Error.Enabled {
			http.Error(w, "404 Not Found", http.StatusNotFound)
			return
		}

		if host.Debug {
			lg.Println("C[error]: No Error activated. We are going to serve the handler.")
		}
		handler.ServeHTTP(w, r)
		if host.Debug {
			lg.Println("C[error]: We have served the handler.")
		}
	}
}
