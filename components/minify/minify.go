package minify

import (
	"fmt"
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
)

var Component = &Minify{}

type Minify struct{}

func (min *Minify) Start() {
}

func (min *Minify) NeedHandler() bool {
	return true
}

func (min *Minify) Handler(handler http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

		hw, ok := w.(host.HostWriter)
		if !ok {
			fmt.Println("Minify component: ERROR DETECTED: the writer is not a HostWriter or the Listener/Host is not set (and that should not happen)", r, w)
			http.Error(w, "Minify component: Writer error", http.StatusInternalServerError)
			return
		}
		host := hw.GetHost()
		if host == nil {
			fmt.Println("Minify component: ERROR DETECTED: there is no HOST (and that should not happen)", r, w)
			http.Error(w, "Minify component: Writer error (see logs for more info)", http.StatusInternalServerError)
			return
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

			mrw := m.ResponseWriter(w, r)
			mw := writer{writer: hw, minifyWriter: mrw}

			handler.ServeHTTP(&mw, r)

			mrw.Close()

			hw.SetParam("bytestominify", mw.length)

		} else {
			handler.ServeHTTP(w, r)
		}
	}
}
