package assets

import (
	"github.com/webability-go/xcore"
)

// Servers must be compliant with the interface Server-
// Object returned by the server with GetService function must return an object compliant with Service interface

type Engine interface {
	NeedInstance() bool
	GetInstance(Hostname string, PagesDir string, P string, i Identity) EngineInstance
	Run(ctx *Context, e interface{}) interface{}
}

type EngineInstance interface {
	NeedLanguage() bool
	NeedTemplate() bool
	Run(ctx *Context, template *xcore.XTemplate, language *xcore.XLanguage, e interface{}) interface{}
}
