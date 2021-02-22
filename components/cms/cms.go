package cms

import (
	"fmt"
	"net/http"

	"github.com/webability-go/xamboo/cms"

	"github.com/webability-go/xamboo/components/host"
	"github.com/webability-go/xamboo/config"
)

var Component = &CMS{}

type CMS struct{}

func (cm *CMS) Start() {
	cms.Start()
}

func (cm *CMS) StartHost(host *config.Host) {
}

func (cm *CMS) NeedHandler() bool {
	return true
}

func (cm *CMS) Handler(handler http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

		hw, ok := w.(host.HostWriter)
		if !ok {
			fmt.Println("CMS component: ERROR DETECTED: the writer is not a HostWriter or the Listener/Host is not set (and that should not happen)", r, w)
			http.Error(w, "CMS component: Writer error", http.StatusInternalServerError)
			return
		}
		listener := hw.GetListener()
		host := hw.GetHost()
		if listener == nil || host == nil {
			fmt.Println("CMS component: ERROR DETECTED: there is no HOST/LISTENER (and that should not happen)", r, w)
			http.Error(w, "CMS component: Writer error (see logs for more info)", http.StatusInternalServerError)
			return
		}

		if host.CMS.Enabled {

			// IS it a static file to server ? (No dynamic CMS config available)
			pagesdir, _ := host.CMS.Config.GetString("pagesdir")
			// SPLIT URI - QUERY to call the engine
			cmsserver := &cms.CMS{
				Method:        r.Method,
				Page:          r.URL.Path,
				Listener:      listener,
				Host:          host,
				PagesDir:      pagesdir,
				Code:          http.StatusOK,
				Recursivity:   map[string]int{},
				GZipCandidate: false,
			}
			cmsserver.ServeHTTP(w, r)
			return
		}

		handler.ServeHTTP(w, r)
	}
}
