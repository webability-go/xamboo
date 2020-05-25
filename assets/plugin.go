package assets

import (
	"plugin"

	"github.com/webability-go/xcore/v2"
	//	"github.com/webability-go/xmodules/context"
)

type Plugin struct {
	SourcePath  string
	PluginPath  string
	PluginVPath string
	Version     int
	Messages    string
	Status      int // 0: not loaded/compile, 1: OK, 2: compile error (see messages)
	Lib         *plugin.Plugin

	// standard libraries function (can be nil if not a page library)
	Run func(*Context, *xcore.XTemplate, *xcore.XLanguage, interface{}) interface{}
}
