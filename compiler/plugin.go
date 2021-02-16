package compiler

import (
	"plugin"
	"sync"

	"github.com/webability-go/xcore/v2"

	"github.com/webability-go/xamboo/cms/context"
)

type Plugin struct {
	Mutex       sync.RWMutex
	SourcePath  string
	PluginPath  string
	PluginVPath string
	Version     int
	Messages    string
	Error       error
	Status      int // 0: not loaded/compile, 1: OK, 2: compile error (see messages)
	Lib         *plugin.Plugin
	Libs        map[string]*plugin.Plugin

	// standard libraries function (can be nil if not a page library)
	Run func(*context.Context, *xcore.XTemplate, *xcore.XLanguage, interface{}) interface{}
}
