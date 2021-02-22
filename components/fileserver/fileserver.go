package fileserver

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/webability-go/xamboo/utils"

	"github.com/webability-go/xamboo/components/host"
	"github.com/webability-go/xamboo/config"
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

		// LOG will take data from params of Host, set by other modules

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
			// 2 conditions: 1. Has an extension, 2. exists on file directory for this site
			pospoint := strings.Index(r.URL.Path, ".")
			posdoublepoint := strings.Index(r.URL.Path, "..")
			if host.FileServer.TakeOver || (pospoint >= 0 && posdoublepoint < 0 && len(host.FileServer.StaticPath) > 0 && utils.FileExists(host.FileServer.StaticPath+r.URL.Path)) {
				http.FileServer(http.Dir(host.FileServer.StaticPath)).ServeHTTP(w, r)
				return
			}
		}

		handler.ServeHTTP(w, r)
	}
}
