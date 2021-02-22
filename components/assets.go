package components

import (
	"net/http"

	"github.com/webability-go/xamboo/config"
)

type Component interface {
	Start()
	StartHost(host *config.Host)
	NeedHandler() bool
	Handler(handler http.HandlerFunc) http.HandlerFunc
}
