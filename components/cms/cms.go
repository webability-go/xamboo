package cms

import (
	"net/http"

	"github.com/webability-go/xamboo/cms"

	"github.com/webability-go/xamboo/components/host"
	"github.com/webability-go/xamboo/config"
	"github.com/webability-go/xamboo/loggers"
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

		slg := loggers.GetCoreLogger("errors")

		hw, ok := w.(host.HostWriter)
		if !ok {
			slg.Println("C[cms]: Critical error: the writer is not a HostWriter (and that should not happen)", r, w)
			http.Error(w, "C[cms]: Writer error (see logs for more info)", http.StatusInternalServerError)
			return
		}
		listener := hw.GetListener()
		host := hw.GetHost()
		if listener == nil || host == nil {
			slg.Println("C[cms]: Critical error: there is no HOST in the host writer (and that should not happen)", r, w)
			http.Error(w, "C[cms]: Writer error (see logs for more info)", http.StatusInternalServerError)
			return
		}

		lg := loggers.GetHostLogger(host.Name, "sys")
		if host.Debug {
			lg.Println("C[cms]: We are going to verify the cms, enabled:", host.CMS.Enabled)
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
			if host.Debug {
				lg.Println("C[cms]: CMS Activated. We are going to serve the CMS specific handler.")
			}
			cmsserver.ServeHTTP(w, r)
			if host.Debug {
				lg.Println("C[cms]: We have served the handler.")
			}
			return
		}

		if host.Debug {
			lg.Println("C[cms]: No CMS. We are going to serve the handler.")
		}
		handler.ServeHTTP(w, r)
		if host.Debug {
			lg.Println("C[cms]: We have served the handler.")
		}
	}
}
