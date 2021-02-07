package engines

import (
	"plugin"

	"github.com/webability-go/xamboo/assets"
	"github.com/webability-go/xamboo/engines/language"
	"github.com/webability-go/xamboo/engines/library"
	"github.com/webability-go/xamboo/engines/redirect"
	"github.com/webability-go/xamboo/engines/simple"
	"github.com/webability-go/xamboo/engines/template"
	"github.com/webability-go/xamboo/engines/wajafapp"
	"github.com/webability-go/xamboo/logger"
)

var Engines = map[string]assets.Engine{}

func Link(engines []assets.JEngine) {
	xlogger := logger.GetCoreLogger("sys")
	xlogger.Println("Build Engines Containers native and external")
	Engines["redirect"] = redirect.Engine
	Engines["simple"] = simple.Engine
	Engines["language"] = language.Engine
	Engines["template"] = template.Engine
	Engines["library"] = library.Engine
	Engines["wajafapp"] = wajafapp.Engine
	xloggererror := logger.GetCoreLogger("errors")
	for _, engine := range engines {
		if engine.Source == "built-in" {
			continue
		}

		// TODO(phil) Recompile the engine if not exists (*Plugin)

		lib, err := plugin.Open(engine.Library)
		if err != nil {
			xloggererror.Println("Error loading engine library:", engine.Library, err)
			continue
		}

		enginelink, err := lib.Lookup("Engine")
		if err != nil {
			xloggererror.Println("Error linking engine main interface Engine:", err)
			continue
		}

		interf, ok := enginelink.(assets.Engine)
		if !ok {
			xloggererror.Println("Error linking engine main interface Engine, is not of type assets.Engine.")
			continue
		}
		Engines[engine.Name] = interf
	}
}
