package wajafapp

import (
	"encoding/json"
	"encoding/xml"
	"errors"
	"net/http"
	"os"
	"plugin"
	"strings"

	"github.com/webability-go/wajaf"
	"github.com/webability-go/xcore/v2"

	"github.com/webability-go/xamboo/cms/context"
	"github.com/webability-go/xamboo/cms/engines/assets"
	"github.com/webability-go/xamboo/cms/identity"
	"github.com/webability-go/xamboo/compiler"
	"github.com/webability-go/xamboo/utils"
)

// no limits, no timeout (it's part of the code itself)
// Will cache *Plugin objects
var LibraryCache = xcore.NewXCache("wajafapp", 0, 0)

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

	prefix := Hostname + "-"
	lastpath := utils.LastPath(P)
	SourcePath := PagesDir + P + "/" + lastpath + ".go"
	PluginPath := PagesDir + P + "/" + prefix + lastpath + ".so"

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

	// verify if the code is compiled.
	// IF THERE IS A NEW VERSION; CALL THE COMPILER THREAD (ONLY ONE) THAT WILL COMPILE THE CODE AND UPDATE THE CACHE MAP TO THE NEW VERSION.
	// BE CAREFULL OF MEMORY OVERLOAD FOR NEW VERSION HOT LOADED (hotload = any flag in config ? authorized/not authorized, # authorized, send alerts, monitor etc)
	var lib *compiler.Plugin
	var err error

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
	}

	if !utils.FileExists(lib.SourcePath) {
		if lib.Status != 2 {
			lib.Status = 2
			errortext := "Error: " + lib.SourcePath + " Source file does not exists.\n"
			ctx.LoggerError.Println(errortext)
			lib.Messages += errortext
			LibraryCache.Set(lib.SourcePath, lib)
		}
		ctx.Code = http.StatusInternalServerError
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
			return errors.New(lib.Messages)
		} else {
			ok := false
			lib.Run, ok = fct.(func(*context.Context, *xcore.XTemplate, *xcore.XLanguage, interface{}) interface{})
			if !ok {
				lib.Status = 2
				errortext := "Error: the called library does not contain a valid standard Run function " + lib.SourcePath + "\n" + err.Error()
				ctx.LoggerError.Println(errortext)
				lib.Messages += errortext
				LibraryCache.Set(lib.SourcePath, lib)
				ctx.Code = http.StatusInternalServerError
				return errors.New(lib.Messages)
			} else {
				lib.Status = 1
			}
		}
		LibraryCache.Set(lib.SourcePath, lib)
	}

	if lib.Status != 1 {
		return lib.Messages
	}

	fctname := "Run"
	out := "string"
	// The function to call depends on the asked service
	if len(ctx.MainURLparams) > 0 {
		p1 := ctx.MainURLparams[0]
		if p1 != "code" {
			fctname = strings.Title(p1)
		}
	}
	if len(ctx.MainURLparams) > 1 {
		out = ctx.MainURLparams[1]
	}

	fct, err := lib.Lib.Lookup(fctname)
	if err != nil {
		errortext := "Error: the called library does not contain a function " + fctname + " in " + lib.SourcePath + "\n" + err.Error()
		ctx.LoggerError.Println(errortext)
		lib.Messages += errortext
		LibraryCache.Set(lib.SourcePath, lib)
		ctx.Code = http.StatusInternalServerError
		return errors.New(lib.Messages)
	}

	xfct, ok := fct.(func(*context.Context, *xcore.XTemplate, *xcore.XLanguage, interface{}) interface{})
	if !ok {
		errortext := "Error: the called library does not contain a valid standard function " + fctname + " in " + lib.SourcePath + "\n" + err.Error()
		ctx.LoggerError.Println(errortext)
		lib.Messages += errortext
		LibraryCache.Set(lib.SourcePath, lib)
		ctx.Code = http.StatusInternalServerError
		return errors.New(lib.Messages)
	}

	x1 := xfct(ctx, template, language, e)
	// The data to return depends on the type of asked data
	if out == "json" {
		// inject language
		strcode, ok := x1.(string)
		if ok {
			if strcode == "" {
				return ""
			}
			if language != nil {
				for id, lg := range language.GetEntries() {
					strcode = strings.ReplaceAll(strcode, "##"+id+"##", lg)
				}
			}

			if strcode[0] == '<' {

				app := wajaf.NewApplication("")
				err := xml.Unmarshal([]byte(strcode), app)
				if err != nil {
					errortext := "Error: unmarshalling the XML code in " + fctname + " in " + lib.SourcePath + "\n" + err.Error()
					ctx.LoggerError.Println(errortext)
					lib.Messages += errortext
					LibraryCache.Set(lib.SourcePath, lib)
					ctx.Code = http.StatusInternalServerError
					return errors.New(lib.Messages)
				}

				json, err := json.Marshal(app)
				if err != nil {
					errortext := "Error: marshalling the JSON code in " + fctname + " in " + lib.SourcePath + "\n" + err.Error()
					ctx.LoggerError.Println(errortext)
					lib.Messages += errortext
					LibraryCache.Set(lib.SourcePath, lib)
					ctx.Code = http.StatusInternalServerError
					return errors.New(lib.Messages)
				}
				return string(json)
			}
			if strcode[0] == '{' || strcode[0] == '[' {
				// JSON code already
				return strcode
			}
			// build a message
			data := map[string]string{
				"message": strcode,
			}
			json, err := json.Marshal(data)
			if err != nil {
				errortext := "Error: marshalling the JSON code in " + fctname + " in " + lib.SourcePath + "\n" + err.Error()
				ctx.LoggerError.Println(errortext)
				lib.Messages += errortext
				LibraryCache.Set(lib.SourcePath, lib)
				ctx.Code = http.StatusInternalServerError
				return errors.New(lib.Messages)
			}
			return string(json)
		}
		// anything else: we just JSONify
		json, err := json.Marshal(x1)
		if err != nil {
			errortext := "Error: marshalling the JSON code in " + fctname + " in " + lib.SourcePath + "\n" + err.Error()
			ctx.LoggerError.Println(errortext)
			lib.Messages += errortext
			LibraryCache.Set(lib.SourcePath, lib)
			ctx.Code = http.StatusInternalServerError
			return errors.New(lib.Messages)
		}
		return string(json)
	}

	return x1
}
