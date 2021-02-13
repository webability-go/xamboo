package assets

import (
	"github.com/webability-go/xcore/v2"

	"github.com/webability-go/xamboo/cms/context"
	"github.com/webability-go/xamboo/cms/identity"
)

// Engines must be compliant with the interface Engine-
// Object returned by the engine with GetInstance function must return an object compliant with EngineInstance interface
// Engines ARE plugins if they are not the built-in ones

type Engine interface {
	NeedInstance() bool
	GetInstance(Hostname string, PagesDir string, P string, i identity.Identity) EngineInstance
	Run(ctx *context.Context, e interface{}) interface{}
}

type EngineInstance interface {
	NeedLanguage() bool
	NeedTemplate() bool
	Run(ctx *context.Context, template *xcore.XTemplate, language *xcore.XLanguage, e interface{}) interface{}
}
