package components

import (
	"net/http"

	"github.com/webability-go/xamboo/config"
)

// Component interface: all the built-in and external components must respect this interface
type Component interface {
	// Start is called when the system starts. Only once at the beginning. .
	Start()
	// StartHost is called every time the host is started. The host is started when the system starts
	//   and also every time the configuration is reloaded: means when the component configuration may have changed
	StartHost(host *config.Host)
	// NeedHandler is called when the listener starts to know if the handler must be linked with the system.
	NeedHandler() bool
	// Hanger is the hander to link with the listener when needed
	Handler(handler http.HandlerFunc) http.HandlerFunc
}
