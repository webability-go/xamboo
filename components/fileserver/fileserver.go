package fileserver

import (
	"net/http"
	"strings"

	"github.com/webability-go/xamboo/utils"

	"github.com/webability-go/xamboo/components/host"
	"github.com/webability-go/xamboo/config"
	"github.com/webability-go/xamboo/loggers"
)

var Component = &FileServer{}

type FileServer struct{}

func (fs *FileServer) Start() {
}

func (fs *FileServer) StartHost(host *config.Host) {
}

func (fs *FileServer) NeedHandler() bool {
	return true
}

func (fs *FileServer) Handler(handler http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

		slg := loggers.GetCoreLogger("errors")

		hw, ok := w.(host.HostWriter)
		if !ok {
			slg.Println("C[fileserver]: Critical error: the writer is not a HostWriter (and that should not happen)", r, w)
			http.Error(w, "C[fileserver]: Writer error (see logs for more info)", http.StatusInternalServerError)
			return
		}
		host := hw.GetHost()
		if host == nil {
			slg.Println("C[fileserver]: Critical error: there is no HOST in the host writer (and that should not happen)", r, w)
			http.Error(w, "C[fileserver]: Writer error (see logs for more info)", http.StatusInternalServerError)
			return
		}

		lg := loggers.GetHostLogger(host.Name, "sys")
		if host.Debug {
			lg.Println("C[fileserver]: We are going to verify the fileserver, enabled:", host.FileServer.Enabled)
		}

		if host.FileServer.Enabled {
			// 2 conditions: 1. Has an extension, 2. exists on file directory for this site
			pospoint := strings.Index(r.URL.Path, ".")
			posdoublepoint := strings.Index(r.URL.Path, "..")
			if host.FileServer.TakeOver || (pospoint >= 0 && posdoublepoint < 0 && len(host.FileServer.StaticPath) > 0 && utils.FileExists(host.FileServer.StaticPath+r.URL.Path)) {
				if host.Debug {
					lg.Println("C[fileserver]: Static file found or takeover. We are going to serve the file:", r.URL.Path)
				}
				http.FileServer(http.Dir(host.FileServer.StaticPath)).ServeHTTP(w, r)
				if host.Debug {
					lg.Println("C[fileserver]: File served.")
				}
				return
			}
		}

		if host.Debug {
			lg.Println("C[fileserver]: No static file. We are going to serve the handler.")
		}
		handler.ServeHTTP(w, r)
		if host.Debug {
			lg.Println("C[fileserver]: We have served the handler.")
		}
	}
}
