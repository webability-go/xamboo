package assets

import (
	"plugin"
	"sync"
	// "github.com/webability-go/xcore/v2"
	//	"github.com/webability-go/xmodules/context"
)

type Component struct {
	Mutex       sync.RWMutex
	SourcePath  string
	PluginPath  string
	PluginVPath string
	Version     int
	Messages    string
	Status      int // 0: not loaded/compile, 1: OK, 2: compile error (see messages)
	Lib         *plugin.Plugin
	Libs        map[string]*plugin.Plugin

	// Component config
	Config int
	// Hooks
	PreServer  int
	Server     int
	PostServer int
}
