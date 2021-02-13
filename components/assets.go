package components

import (
	"net/http"
)

type Component interface {
	Start()
	NeedHandler() bool
	Handler(handler http.HandlerFunc) http.HandlerFunc
}
