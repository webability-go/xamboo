package components

import (
	"os"
	"plugin"
	"strings"
	"sync"

	"github.com/webability-go/xcore/v2"

	"github.com/webability-go/xamboo/compiler"
	"github.com/webability-go/xamboo/components/auth"
	"github.com/webability-go/xamboo/components/cms"
	"github.com/webability-go/xamboo/components/compress"
	"github.com/webability-go/xamboo/components/error"
	"github.com/webability-go/xamboo/components/fileserver"
	"github.com/webability-go/xamboo/components/log"
	"github.com/webability-go/xamboo/components/minify"
	"github.com/webability-go/xamboo/components/origin"
	"github.com/webability-go/xamboo/components/prot"
	"github.com/webability-go/xamboo/components/redirect"
	"github.com/webability-go/xamboo/components/stat"
	"github.com/webability-go/xamboo/config"
	"github.com/webability-go/xamboo/loggers"
	"github.com/webability-go/xamboo/utils"
)

var Components = map[string]Component{}
var ComponentsOrder = []string{}
var ComponentCache = xcore.NewXCache("component", 0, 0)
var mutex sync.RWMutex

// LinkComponents will call all the server components and link them with the system ready to use to link with the handler
// Link the components.
// NOTE THE ORDER IS VERY VERY IMPORTANT
func Link() {

	xlogger := loggers.GetCoreLogger("sys")
	xlogger.Println("Build Components Containers native and external")
	xloggererror := loggers.GetCoreLogger("errors")

	for _, component := range config.Config.Components {
		if component.Source == "built-in" {
			switch component.Name {
			case "log":
				Components["log"] = log.Component
				log.Component.Start()
			case "stat":
				Components["stat"] = stat.Component
				stat.Component.Start()
			case "auth":
				Components["auth"] = auth.Component
				auth.Component.Start()
			case "prot":
				Components["prot"] = prot.Component
				prot.Component.Start()
			case "compress":
				Components["compress"] = compress.Component
				compress.Component.Start()
			case "minify":
				Components["minify"] = minify.Component
				minify.Component.Start()
			case "redirect":
				Components["redirect"] = redirect.Component
				redirect.Component.Start()
			case "origin":
				Components["origin"] = origin.Component
				origin.Component.Start()
			case "fileserver":
				Components["fileserver"] = fileserver.Component
				fileserver.Component.Start()
			case "cms":
				Components["cms"] = cms.Component
				cms.Component.Start()
			case "error":
				Components["error"] = error.Component
				error.Component.Start()
			default:
				xloggererror.Println("Built-in component not known:", component.Name)
			}
			ComponentsOrder = append(ComponentsOrder, component.Name)
			continue
		}

		var lib *compiler.Plugin

		// During the seek of the library, we lock the engine for security. Very fast lock
		mutex.Lock()
		// If the plugin is not loaded, load it (equivalent of cache for other types of server)
		// verify if the code is loaded in memory
		cdata, _ := ComponentCache.Get(component.Name)
		if cdata != nil {
			lib = cdata.(*compiler.Plugin)
		} else {
			// take path of library
			path := strings.ReplaceAll(component.Library, ".so", ".go")
			lib = &compiler.Plugin{
				SourcePath:  path,
				PluginPath:  component.Library,
				PluginVPath: component.Library + ".1",
				Version:     0, // will be 1 at first compile
				Messages:    "",
				Status:      0, // 0 = must compile or/and load (first creation of library)
				Libs:        map[string]*plugin.Plugin{},
			}
			ComponentCache.Set(component.Name, lib)
		}
		mutex.Unlock()
		lib.Mutex.Lock()

		if !utils.FileExists(lib.SourcePath) {
			if lib.Status != 2 {
				lib.Status = 2
				errortext := "Error: " + lib.SourcePath + " Source file does not exists.\n"
				xloggererror.Println(errortext)
				lib.Messages += errortext
				ComponentCache.Set(component.Name, lib)
			}
			lib.Mutex.Unlock()
			continue
		}

		mustcompile := true
		if utils.FileExists(lib.PluginVPath) {
			dp, _ := os.Stat(lib.PluginVPath)
			dptime := dp.ModTime()
			if utils.FileValidator(lib.SourcePath, dptime) {
				mustcompile = false
			}
		}

		if mustcompile {
			lib.Status = 0
			err := compiler.PleaseCompile(nil, lib)

			if err != nil {
				lib.Status = 2
				errortext := "Error: the GO code could not compile " + lib.SourcePath + "\n" + lib.Messages + "\n" + err.Error()
				xloggererror.Println(errortext)
				lib.Messages += errortext
				ComponentCache.Set(component.Name, lib)
				lib.Mutex.Unlock()
				continue
			}
		}

		if lib.Status == 0 { // needs to load the plugin
			// Get GO BuildID to compare with in-memory GO BuildID and keep it with the library itself
			// if already exists in memory, set it as default, or load it
			buildid, err := utils.GetBuildId(lib.PluginVPath)
			if err != nil {
				errortext := "Error: the library .so does not have a build id " + lib.SourcePath + "\n" + err.Error()
				xloggererror.Println(errortext)
				lib.Messages += errortext
				ComponentCache.Set(component.Name, lib)
				lib.Mutex.Unlock()
				continue
			}
			plg := lib.Libs[buildid]
			if plg != nil { // already exists and loaded
				lib.Lib = plg
			} else {
				lib.Lib, err = plugin.Open(lib.PluginVPath)
				if err != nil {
					lib.Status = 2
					errortext := "Error: the library .so could not load " + lib.SourcePath + "\n" + err.Error()
					xloggererror.Println(errortext)
					lib.Messages += errortext
					ComponentCache.Set(component.Name, lib)
					lib.Mutex.Unlock()
					continue
				}
				lib.Libs[buildid] = lib.Lib
			}

			componentlink, err := lib.Lib.Lookup("Component")
			if err != nil {
				xloggererror.Println("Error linking engine main interface Component:", err)
				lib.Mutex.Unlock()
				continue
			}

			interf, ok := componentlink.(Component)
			if !ok {
				xloggererror.Println("Error linking engine main interface Component, is not of type assets.Component.")
				lib.Mutex.Unlock()
				continue
			}
			Components[component.Name] = interf
			interf.Start()
			ComponentsOrder = append(ComponentsOrder, component.Name)
		}
		lib.Mutex.Unlock()

	}
	// reverse order
	for i, j := 0, len(ComponentsOrder)-1; i < j; i, j = i+1, j-1 {
		ComponentsOrder[i], ComponentsOrder[j] = ComponentsOrder[j], ComponentsOrder[i]
	}
}

func StartHost() {
	for id := range config.Config.Hosts {

		// call Starts
		for _, componentid := range ComponentsOrder {
			Components[componentid].StartHost(&config.Config.Hosts[id])
		}
	}
}
