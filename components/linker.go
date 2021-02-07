package components

import (
	"plugin"

	"github.com/webability-go/xamboo/assets"
	"github.com/webability-go/xamboo/components/auth"
	"github.com/webability-go/xamboo/components/browser"
	"github.com/webability-go/xamboo/components/compress"
	"github.com/webability-go/xamboo/components/minify"
	"github.com/webability-go/xamboo/components/origin"
	"github.com/webability-go/xamboo/components/redirect"
	"github.com/webability-go/xamboo/components/stat"
	"github.com/webability-go/xamboo/logger"
)

var Components = map[string]assets.Component{}
var ComponentsOrder = []string{}

// LinkComponents will call all the server components and link them with the system ready to use to link with the handler
// Link the components.
// NOTE THE ORDER IS VERY VERY IMPORTANT
func Link(components []assets.JComponent) {
	xlogger := logger.GetCoreLogger("sys")
	xlogger.Println("Build Components Containers native and external")
	Components["stat"] = stat.Component
	Components["auth"] = auth.Component
	Components["browser"] = browser.Component
	Components["compress"] = compress.Component
	Components["minify"] = minify.Component
	Components["redirect"] = redirect.Component
	Components["origin"] = origin.Component
	xloggererror := logger.GetCoreLogger("errors")
	for _, component := range components {
		if component.Source == "built-in" {
			if Components[component.Name] == nil {
				xloggererror.Println("Build in component not known:", component.Name)
				continue
			}
			ComponentsOrder = append(ComponentsOrder, component.Name)
			continue
		}

		// TODO(phil) Recompile the engine if not exists (*Plugin)

		lib, err := plugin.Open(component.Library)
		if err != nil {
			xloggererror.Println("Error loading engine library:", component.Library, err)
			continue
		}

		componentlink, err := lib.Lookup("Component")
		if err != nil {
			xloggererror.Println("Error linking component main interface Component:", err)
			continue
		}

		interf, ok := componentlink.(assets.Component)
		if !ok {
			xloggererror.Println("Error linking component main interface Component, is not of type assets.Component.")
			continue
		}
		Components[component.Name] = interf
		ComponentsOrder = append(ComponentsOrder, component.Name)
	}
	// reverse order
	for i, j := 0, len(ComponentsOrder)-1; i < j; i, j = i+1, j-1 {
		ComponentsOrder[i], ComponentsOrder[j] = ComponentsOrder[j], ComponentsOrder[i]
	}
}
