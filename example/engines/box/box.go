// package box is an engine for Xamboo.
// The engine will just returns a string with some data in a box in HTML format
package main

import (
	"github.com/webability-go/xcore/v2"

	"github.com/webability-go/xamboo/server/assets"
)

var Engine = BoxEngine{}

type BoxEngine struct{}

func (re *BoxEngine) NeedInstance() bool {

	return false
	// return true mean you will create the boxengineinstance and the result will be served through it
}

func (re *BoxEngine) GetInstance(Hostname string, PagesDir string, P string, i assets.Identity) assets.EngineInstance {

	data := &BoxEngineInstance{}
	return data
}

func (se *BoxEngine) Run(ctx *assets.Context, s interface{}) interface{} {

	return "<div style=\"border: 3px solid red;\">This is a code generated by the BOX engine from the engine itself<br />(only .page is necesary and NeedInstance must return false)</div>"
}

type BoxEngineInstance struct {
}

func (p *BoxEngineInstance) NeedLanguage() bool {
	return false
}

func (p *BoxEngineInstance) NeedTemplate() bool {
	return false
}

// context contains all the page context and history
// params are an array of strings (if page from outside) or a mapped array of data (inner pages)
func (p *BoxEngineInstance) Run(ctx *assets.Context, template *xcore.XTemplate, language *xcore.XLanguage, e interface{}) interface{} {

	return "<div style=\"border: 3px solid red;\">This is a code generated by the BOX engine as an instance<br />(You need .instance file and NeedInstance must return true)</div>"
}
