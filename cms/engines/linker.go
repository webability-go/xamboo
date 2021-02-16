package engines

import (
	"os"
	"plugin"
	"strings"
	"sync"

	"github.com/webability-go/xcore/v2"

	"github.com/webability-go/xamboo/cms/engines/assets"
	"github.com/webability-go/xamboo/cms/engines/language"
	"github.com/webability-go/xamboo/cms/engines/library"
	"github.com/webability-go/xamboo/cms/engines/redirect"
	"github.com/webability-go/xamboo/cms/engines/simple"
	"github.com/webability-go/xamboo/cms/engines/template"
	"github.com/webability-go/xamboo/cms/engines/wajafapp"
	"github.com/webability-go/xamboo/compiler"
	"github.com/webability-go/xamboo/config"
	"github.com/webability-go/xamboo/loggers"
	"github.com/webability-go/xamboo/utils"
)

var Engines = map[string]assets.Engine{}
var EngineCache = xcore.NewXCache("engine", 0, 0)
var mutex sync.RWMutex

func Link() {
	xlogger := loggers.GetCoreLogger("sys")
	xlogger.Println("Build Engines Containers native and external")
	xloggererror := loggers.GetCoreLogger("errors")
	for _, engine := range config.Config.Engines {
		if engine.Source == "built-in" {
			switch engine.Name {
			case "redirect":
				Engines["redirect"] = redirect.Engine
			case "simple":
				Engines["simple"] = simple.Engine
			case "language":
				Engines["language"] = language.Engine
			case "template":
				Engines["template"] = template.Engine
			case "library":
				Engines["library"] = library.Engine
			case "wajafapp":
				Engines["wajafapp"] = wajafapp.Engine
			default:

			}
			continue
		}

		var lib *compiler.Plugin

		// During the seek of the library, we lock the engine for security. Very fast lock
		mutex.Lock()
		// If the plugin is not loaded, load it (equivalent of cache for other types of server)
		// verify if the code is loaded in memory
		cdata, _ := EngineCache.Get(engine.Name)
		if cdata != nil {
			lib = cdata.(*compiler.Plugin)
		} else {
			// take path of library
			path := strings.ReplaceAll(engine.Library, ".so", ".go")
			lib = &compiler.Plugin{
				SourcePath:  path,
				PluginPath:  engine.Library,
				PluginVPath: engine.Library + ".1",
				Version:     0, // will be 1 at first compile
				Messages:    "",
				Status:      0, // 0 = must compile or/and load (first creation of library)
				Libs:        map[string]*plugin.Plugin{},
			}
			EngineCache.Set(engine.Name, lib)
		}
		mutex.Unlock()
		lib.Mutex.Lock()

		if !utils.FileExists(lib.SourcePath) {
			if lib.Status != 2 {
				lib.Status = 2
				errortext := "Error: " + lib.SourcePath + " Source file does not exists.\n"
				xloggererror.Println(errortext)
				lib.Messages += errortext
				EngineCache.Set(engine.Name, lib)
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
				EngineCache.Set(engine.Name, lib)
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
				EngineCache.Set(engine.Name, lib)
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
					EngineCache.Set(engine.Name, lib)
					lib.Mutex.Unlock()
					continue
				}
				lib.Libs[buildid] = lib.Lib
			}

			enginelink, err := lib.Lib.Lookup("Engine")
			if err != nil {
				xloggererror.Println("Error linking engine main interface Engine:", err)
				lib.Mutex.Unlock()
				continue
			}

			interf, ok := enginelink.(assets.Engine)
			if !ok {
				xloggererror.Println("Error linking engine main interface Engine, is not of type assets.Engine.")
				lib.Mutex.Unlock()
				continue
			}
			Engines[engine.Name] = interf
		}
		lib.Mutex.Unlock()
	}
}
