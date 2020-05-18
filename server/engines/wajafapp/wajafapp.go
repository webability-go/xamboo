package wajafapp

import (
	"encoding/json"
	"encoding/xml"
	"fmt"
	"os"
	"plugin"
	"strings"
	//  "time"

	"github.com/webability-go/wajaf"
	"github.com/webability-go/xcore/v2"

	"github.com/webability-go/xamboo/server/assets"
	"github.com/webability-go/xamboo/server/compiler"
	"github.com/webability-go/xamboo/server/utils"
)

// no limits, no timeout (it's part of the code itself)
// Will cache *Plugin objects
var LibraryCache = xcore.NewXCache("library", 0, 0)

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

func (re *LibraryEngine) GetInstance(Hostname string, PagesDir string, P string, i assets.Identity) assets.EngineInstance {

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

func (se *LibraryEngine) Run(ctx *assets.Context, s interface{}) interface{} {
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
func (p *LibraryEngineInstance) Run(ctx *assets.Context, template *xcore.XTemplate, language *xcore.XLanguage, e interface{}) interface{} {

	// verify if the code is compiled.
	// IF THERE IS A NEW VERSION; CALL THE COMPILER THREAD (ONLY ONE) THAT WILL COMPILE THE CODE AND UPDATE THE CACHE MAP TO THE NEW VERSION.
	// BE CAREFULL OF MEMORY OVERLOAD FOR NEW VERSION HOT LOADED (hotload = any flag in config ? authorized/not authorized, # authorized, send alerts, monitor etc)
	var lib *assets.Plugin
	var err error

	// If the plugin is not loaded, load it (equivalent of cache for other types of server)
	// verify if the code is loaded in memory
	cdata, _ := LibraryCache.Get(p.SourcePath)
	if cdata != nil {
		lib = cdata.(*assets.Plugin)
	} else {
		lib = &assets.Plugin{
			SourcePath:  p.SourcePath,
			PluginPath:  p.PluginPath,
			PluginVPath: p.PluginPath + ".1",
			Version:     0, // will be 1 at first compile
			Messages:    p.PluginPath + " does not exist. Let's compile.\n",
			Status:      0,
		}
	}

	mustcompile := true
	if !utils.FileExists(lib.SourcePath) {
		lib.Status = 2
		lib.Messages += "Error: " + lib.SourcePath + " Source file does not exists.\n"
		mustcompile = false
	} else {
		if utils.FileExists(lib.PluginVPath) {
			dp, _ := os.Stat(lib.PluginVPath)
			dptime := dp.ModTime()
			if utils.FileValidator(lib.SourcePath, dptime) {
				mustcompile = false
			}
		}
	}

	if mustcompile {
		lib.Status = 0
		err := compiler.PleaseCompile(ctx, lib)
		if err != nil {
			lib.Status = 2
			ctx.LoggerError.Println("ERROR: LIBRARY PAGE/BLOCK COULD NOT COMPILE", err)
			lib.Messages += "Error: " + lib.SourcePath + " cound not compile:\n" + fmt.Sprint(err)
		}
	}

	if lib.Status == 0 {
		lib.Lib, err = plugin.Open(lib.PluginVPath)
		if err != nil {
			lib.Status = 2
			ctx.LoggerError.Println("ERROR: LIBRARY PAGE/BLOCK COULD NOT LOAD", err)
			lib.Messages += "Error: " + lib.SourcePath + " cound not load:\n" + fmt.Sprint(err)
		} else {
			fct, err := lib.Lib.Lookup("Run")
			if err != nil {
				lib.Status = 2
				ctx.LoggerError.Println("ERROR: LIBRARY DOES NOT CONTAIN RUN FUNCTION", err)
				lib.Messages += "Error: " + lib.SourcePath + " does not contain Run function:\n" + fmt.Sprint(err)
			} else {
				ok := false
				lib.Run, ok = fct.(func(*assets.Context, *xcore.XTemplate, *xcore.XLanguage, interface{}) interface{})
				if !ok {
					lib.Status = 2
					ctx.LoggerError.Println("ERROR: LIBRARY DOES NOT CONTAIN A VALID STANDARD RUN FUNCTION", err)
					lib.Messages += "Error: " + lib.SourcePath + " does not contain a valid standard Run function:\n"
				} else {
					lib.Status = 1
				}
			}
		}
	}

	LibraryCache.Set(p.SourcePath, lib)

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
		ctx.LoggerError.Println("ERROR: WAJAF LIBRARY DOES NOT CONTAIN FUNCTION "+fctname+", Error: ", err)
		return "ERROR: WAJAF LIBRARY DOES NOT CONTAIN FUNCTION " + fctname + ", Error: " + fmt.Sprint(err)
	}

	xfct, ok := fct.(func(*assets.Context, *xcore.XTemplate, *xcore.XLanguage, interface{}) interface{})
	if !ok {
		ctx.LoggerError.Println("ERROR: WAJAF LIBRARY::"+fctname+" HAS NOT A VALID STANDARD DEFINITION, Error: ", err)
		return "ERROR: WAJAF LIBRARY::" + fctname + " HAS NOT A VALID STANDARD DEFINITION, Error: " + fmt.Sprint(err)
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
					ctx.LoggerError.Println("ERROR: UNMARSHALLING XML LIBRARY, Error: ", err)
					return "ERROR: UNMARSHALLING XML LIBRARY, Error: " + fmt.Sprint(err)
				}
				//				fmt.Printf("%#v", app)

				json, err := json.Marshal(app)
				if err != nil {
					ctx.LoggerError.Println("ERROR: MARSHALLING JSON LIBRARY, Error: ", err)
					return "ERROR: MARSHALLING JSON LIBRARY, Error: " + fmt.Sprint(err)
				}
				//				fmt.Printf("%#v", string(json))
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
				ctx.LoggerError.Println("ERROR: MARSHALLING JSON DATA, Error: ", err)
				return "ERROR: MARSHALLING JSON DATA, Error: " + fmt.Sprint(err)
			}
			return string(json)
		}
		// anything else: we just JSONify
		json, err := json.Marshal(x1)
		if err != nil {
			ctx.LoggerError.Println("ERROR: MARSHALLING JSON DATA, Error: ", err)
			return "ERROR: MARSHALLING JSON DATA, Error: " + fmt.Sprint(err)
		}
		return string(json)
	}

	return x1
}

/*
// context contains all the page context and history
// params are an array of strings (if page from outside) or a mapped array of data (inner pages)
func (p *LibraryEngineInstance) Run(ctx *assets.Context, template *xcore.XTemplate, language *xcore.XLanguage, e interface{}) interface{} {

	// verify if the code is compiled.
	// IF THERE IS A NEW VERSION; CALL THE COMPILER THREAD (ONLY ONE) THAT WILL COMPILE THE CODE AND UPDATE THE CACHE MAP TO THE NEW VERSION.
	// BE CAREFULL OF MEMORY OVERLOAD FOR NEW VERSION HOT LOADED (hotload = any flag in config ? authorized/not authorized, # authorized, send alerts, monitor etc)
	var lib *plugin.Plugin
	var err error

	// If the plugin is not loaded, load it (equivalent of cache for other types of server)
	// verify if the code is loaded in memory
	cdata, invalid := LibraryCache.Get(p.SourcePath)
	if cdata != nil {
		lib = cdata.(*plugin.Plugin)
	} else {
		// Check if HOT reload authorized
		if !invalid {
			lib, err = plugin.Open(p.PluginPath)
			if err != nil {
				invalid = true
			}
		}

		if invalid {
			// get back version number && error
			version, err := 0, nil // compiler.PleaseCompile(p.SourcePath, p.PluginPath, 0, ctx.LoggerError)
			if err != nil {
				ctx.LoggerError.Println("ERROR: LIBRARY PAGE/BLOCK COULD NOT COMPILE", err)
				return "ERROR: LIBRARY PAGE/BLOCK COULD NOT COMPILE, Error: " + fmt.Sprint(err)
			}

			// try to reload new library (hot load)
			// works or fail
			if version > 0 {
				p.PluginPath = p.PluginPath + fmt.Sprintf(".%d", version)
			}

			lib, err = plugin.Open(p.PluginPath)
			if err != nil {
				ctx.LoggerError.Println("ERROR: LIBRARY PAGE/BLOCK COULD NOT LOAD", err)
				return "ERROR: LIBRARY PAGE/BLOCK COULD NOT LOAD, Error: " + fmt.Sprint(err)
			}
		}
		LibraryCache.Set(p.SourcePath, lib)
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

	fct, err := lib.Lookup(fctname)
	if err != nil {
		ctx.LoggerError.Println("ERROR: WAJAF LIBRARY DOES NOT CONTAIN FUNCTION "+fctname+", Error: ", err)
		return "ERROR: WAJAF LIBRARY DOES NOT CONTAIN FUNCTION " + fctname + ", Error: " + fmt.Sprint(err)
	}

	x1 := fct.(func(*assets.Context, *xcore.XTemplate, *xcore.XLanguage, interface{}) interface{})(ctx, template, language, e)

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
					ctx.LoggerError.Println("ERROR: UNMARSHALLING XML LIBRARY, Error: ", err)
					return "ERROR: UNMARSHALLING XML LIBRARY, Error: " + fmt.Sprint(err)
				}
				//				fmt.Printf("%#v", app)

				json, err := json.Marshal(app)
				if err != nil {
					ctx.LoggerError.Println("ERROR: MARSHALLING JSON LIBRARY, Error: ", err)
					return "ERROR: MARSHALLING JSON LIBRARY, Error: " + fmt.Sprint(err)
				}
				//				fmt.Printf("%#v", string(json))
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
				ctx.LoggerError.Println("ERROR: MARSHALLING JSON DATA, Error: ", err)
				return "ERROR: MARSHALLING JSON DATA, Error: " + fmt.Sprint(err)
			}
			return string(json)
		}
		// anything else: we just JSONify
		json, err := json.Marshal(x1)
		if err != nil {
			ctx.LoggerError.Println("ERROR: MARSHALLING JSON DATA, Error: ", err)
			return "ERROR: MARSHALLING JSON DATA, Error: " + fmt.Sprint(err)
		}
		return string(json)
	}

	return x1
}
*/
