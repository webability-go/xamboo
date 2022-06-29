package library

import (
	"errors"
	"net/http"
	"os"
	"plugin"
	"sync"

	"github.com/webability-go/xcore/v2"

	"github.com/webability-go/xamboo/cms/context"
	"github.com/webability-go/xamboo/cms/engines/assets"
	"github.com/webability-go/xamboo/cms/identity"
	"github.com/webability-go/xamboo/compiler"
	"github.com/webability-go/xamboo/config"
	"github.com/webability-go/xamboo/utils"
)

// no limits, no timeout (it's part of the code itself)
// Will cache *Plugin objects
var LibraryCache = xcore.NewXCache("library", 0, 0)
var mutex sync.RWMutex

/*
func init() {
	LibraryCache.Validator = utils.FileValidator
}
*/

var Engine = &LibraryEngine{}

type LibraryEngine struct{}

func (re *LibraryEngine) NeedInstance() bool {
	// The simple engine does need instance and identity
	return true
}

func (re *LibraryEngine) GetInstance(Hostname string, PagesDir string, P string, i identity.Identity) assets.EngineInstance {

	// prefix := Hostname + "-"   // No prefix. A library always has the same BuildID if it's from the same code. IT just gives conflicts when various sites use the same code
	lastpath := utils.LastPath(P)
	SourcePath := PagesDir + P + "/" + lastpath + ".go"
	PluginPath := PagesDir + P + "/" + config.Config.PluginPrefix + Hostname + "-" + lastpath + ".so"

	if utils.FileExists(SourcePath) {
		data := &LibraryEngineInstance{
			SourcePath: SourcePath,
			PluginPath: PluginPath,
		}
		return data
	}
	return nil
}

func (se *LibraryEngine) Run(ctx *context.Context, s interface{}) interface{} {
	return nil
}

type LibraryEngineInstance struct {
	SourcePath string
	PluginPath string
}

func (p *LibraryEngineInstance) NeedLanguage() bool {
	return true
}

func (p *LibraryEngineInstance) NeedTemplate() bool {
	return true
}

// context contains all the page context and history
// params are an array of strings (if page from outside) or a mapped array of data (inner pages)
func (p *LibraryEngineInstance) Run(ctx *context.Context, template *xcore.XTemplate, language *xcore.XLanguage, e interface{}) interface{} {

	// IF THERE IS A NEW VERSION; CALL THE COMPILER THREAD (ONLY ONE) THAT WILL COMPILE THE CODE AND UPDATE THE CACHE MAP TO THE NEW VERSION.
	// verify if the code is compiled.
	// BE CAREFULL OF MEMORY OVERLOAD FOR NEW VERSION HOT LOADED (hotload = any flag in config ? authorized/not authorized, # authorized, send alerts, monitor etc)
	var lib *compiler.Plugin

	// During the seek of the library, we lock the engine for security. Very fast lock
	mutex.Lock()
	// If the plugin is not loaded, load it (equivalent of cache for other types of server)
	// verify if the code is loaded in memory
	cdata, _ := LibraryCache.Get(p.SourcePath)
	if cdata != nil {
		lib = cdata.(*compiler.Plugin)
	} else {
		lib = &compiler.Plugin{
			SourcePath:  p.SourcePath,
			PluginPath:  p.PluginPath,
			PluginVPath: p.PluginPath + ".1",
			Version:     0, // will be 1 at first compile
			Messages:    "",
			Status:      0, // 0 = must compile or/and load (first creation of library)
			Libs:        map[string]*plugin.Plugin{},
		}
		LibraryCache.Set(lib.SourcePath, lib)
	}
	mutex.Unlock()
	lib.Mutex.Lock()

	if !utils.FileExists(lib.SourcePath) {
		if lib.Status != 2 {
			lib.Status = 2
			errortext := "Error: " + lib.SourcePath + " Source file does not exists.\n"
			ctx.LoggerError.Println(errortext)
			lib.Messages += errortext
			LibraryCache.Set(lib.SourcePath, lib)
		}
		ctx.Code = http.StatusInternalServerError
		lib.Mutex.Unlock()
		return errors.New(lib.Messages)
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
		err := compiler.PleaseCompile(ctx, lib)
		if err != nil {
			lib.Status = 2
			errortext := "Error: the GO code could not compile " + lib.SourcePath + "\n" + err.Error()
			ctx.LoggerError.Println(errortext)
			lib.Messages += errortext
			LibraryCache.Set(lib.SourcePath, lib)
			ctx.Code = http.StatusInternalServerError
			lib.Mutex.Unlock()
			return errors.New(lib.Messages)
		}
	}

	if lib.Status == 0 { // needs to load the plugin
		// Get GO BuildID to compare with in-memory GO BuildID and keep it with the library itself
		// if already exists in memory, set it as default, or load it
		buildid, err := utils.GetBuildId(lib.PluginVPath)
		if err != nil {
			errortext := "Error: the library .so does not have a build id " + lib.SourcePath + "\n" + err.Error()
			ctx.LoggerError.Println(errortext)
			lib.Messages += errortext
			LibraryCache.Set(lib.SourcePath, lib)
			ctx.Code = http.StatusInternalServerError
			lib.Mutex.Unlock()
			return errors.New(lib.Messages)
		}
		plg := lib.Libs[buildid]
		if plg != nil { // already exists and loaded
			lib.Lib = plg
		} else {
			lib.Lib, err = plugin.Open(lib.PluginVPath)
			if err != nil {
				lib.Status = 2
				errortext := "Error: the library .so could not load " + lib.SourcePath + "\n" + err.Error()
				ctx.LoggerError.Println(errortext)
				lib.Messages += errortext
				LibraryCache.Set(lib.SourcePath, lib)
				ctx.Code = http.StatusInternalServerError
				lib.Mutex.Unlock()
				return errors.New(lib.Messages)
			}
			lib.Libs[buildid] = lib.Lib
		}

		fct, err := lib.Lib.Lookup("Run")
		if err != nil {
			lib.Status = 2
			errortext := "Error: the called library does not contain a Run function " + lib.SourcePath + "\n" + err.Error()
			ctx.LoggerError.Println(errortext)
			lib.Messages += errortext
			LibraryCache.Set(lib.SourcePath, lib)
			ctx.Code = http.StatusInternalServerError
			lib.Mutex.Unlock()
			return errors.New(lib.Messages)
		} else {
			ok := false
			lib.Run, ok = fct.(func(*context.Context, *xcore.XTemplate, *xcore.XLanguage, interface{}) interface{})
			if !ok {
				lib.Status = 2
				errortext := "Error: the called library does not contain a valid standard Run function " + lib.SourcePath + "\n"
				ctx.LoggerError.Println(errortext)
				lib.Messages += errortext
				LibraryCache.Set(lib.SourcePath, lib)
				ctx.Code = http.StatusInternalServerError
				lib.Mutex.Unlock()
				return errors.New(lib.Messages)
			} else {
				lib.Status = 1
			}
		}
	}
	lib.Mutex.Unlock()

	if lib.Status == 1 {
		return lib.Run(ctx, template, language, e)
	}
	// any error: return Messages
	ctx.Code = http.StatusInternalServerError
	return errors.New(lib.Messages)
}
