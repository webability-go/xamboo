package assets

import (
	"plugin"

	"github.com/webability-go/xcore/v2"
)

type Plugin struct {
	SourcePath  string
	PluginPath  string
	PluginVPath string
	Version     int
	Messages    string
	Status      int // 0: not loaded/compile, 1: OK, 2: compile error (see messages)
	Lib         *plugin.Plugin

	// standard libraries function
	Run func(*Context, *xcore.XTemplate, *xcore.XLanguage, interface{}) interface{}

	// standard Engines function

	// standard APPs function

}
