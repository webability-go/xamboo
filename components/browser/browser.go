package browser

import (
	"net/http"
)

var Component = &Browser{}

type Browser struct{}

func (auth *Browser) NeedHandler() bool {
	return false
}

// No need of handler for Browser mode.
func (auth *Browser) Handler(handler http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		handler.ServeHTTP(w, r)
	}
}

// Build PRE Server Context
