package minify

import (
	"net/http"
	"regexp"

	"github.com/tdewolff/minify"
	"github.com/tdewolff/minify/css"
	"github.com/tdewolff/minify/html"
	"github.com/tdewolff/minify/js"
	"github.com/tdewolff/minify/json"
	"github.com/tdewolff/minify/svg"
	"github.com/tdewolff/minify/xml"

	"github.com/webability-go/xamboo/components/host"
	"github.com/webability-go/xamboo/config"
	"github.com/webability-go/xamboo/loggers"
)

var Component = &Minify{}

type Minify struct{}

func (min *Minify) Start() {
}

func (min *Minify) StartHost(host *config.Host) {
}

func (min *Minify) NeedHandler() bool {
	return true
}

func (min *Minify) Handler(handler http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		slg := loggers.GetCoreLogger("errors")

		hw, ok := w.(host.HostWriter)
		if !ok {
			slg.Println("C[minify]: Critical error: the writer is not a HostWriter (and that should not happen)", r, w)
			http.Error(w, "C[minify]: Writer error (see logs for more info)", http.StatusInternalServerError)
			return
		}
		host := hw.GetHost()
		if host == nil {
			slg.Println("C[minify]: Critical error: there is no HOST in the host writer (and that should not happen)", r, w)
			http.Error(w, "C[minify]: Writer error (see logs for more info)", http.StatusInternalServerError)
			return
		}

		lg := loggers.GetHostLogger(host.Name, "sys")
		if host.Debug {
			lg.Println("C[minify]: We are going to verify the minify, enabled:", host.Minify.Enabled)
		}

		if host.Minify.Enabled {
			m := minify.New()
			if host.Minify.CSS {
				m.AddFunc("text/css", css.Minify)
			}
			if host.Minify.HTML {
				html.DefaultMinifier.KeepDocumentTags = true
				m.AddFunc("text/html", html.Minify)
			}
			if host.Minify.SVG {
				m.AddFunc("image/svg+xml", svg.Minify)
			}
			if host.Minify.JS {
				m.AddFuncRegexp(regexp.MustCompile("^(application|text)/(x-)?(java|ecma)script$"), js.Minify)
			}
			if host.Minify.JSON {
				m.AddFuncRegexp(regexp.MustCompile("[/+]json$"), json.Minify)
			}
			if host.Minify.XML {
				m.AddFuncRegexp(regexp.MustCompile("[/+]xml$"), xml.Minify)
			}

			if host.Debug {
				lg.Println("C[minify]: We are going to create the minifywriter, then serve the handler.")
			}

			mrw := m.ResponseWriter(w, r)
			mw := writer{writer: hw, minifyWriter: mrw}

			handler.ServeHTTP(&mw, r)

			mrw.Close()

			hw.SetParam("bytestominify", mw.length)

			if host.Debug {
				lg.Println("C[minify]: We have served the handler.")
			}
			return
		}

		if host.Debug {
			lg.Println("C[minify]: No minifying needed. We are going to serve the handler.")
		}
		handler.ServeHTTP(w, r)
		if host.Debug {
			lg.Println("C[minify]: We have served the handler.")
		}
	}
}
