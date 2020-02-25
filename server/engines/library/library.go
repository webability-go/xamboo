package library

import (
	"fmt"
	"plugin"
	//  "time"

	"github.com/webability-go/xcore"

	"github.com/webability-go/xamboo/server/assets"
	"github.com/webability-go/xamboo/server/compiler"
	"github.com/webability-go/xamboo/server/utils"
)

// no limits, no timeout (it's part of the code itself)
var LibraryCache = xcore.NewXCache("library", 0, 0)

func init() {
	LibraryCache.Validator = utils.FileValidator
}

var Engine = &LibraryEngine{}

type LibraryEngine struct{}

func (re *LibraryEngine) NeedInstance() bool {
	// The simple engine does need instance and identity
	return true
}

func (re *LibraryEngine) GetInstance(Hostname string, PagesDir string, P string, i assets.Identity) assets.EngineInstance {

	prefix := Hostname + "-"
	lastpath := utils.LastPath(P)
	filepath := PagesDir + P + "/" + lastpath + ".go"
	fileplugin := PagesDir + P + "/" + prefix + lastpath + ".so"

	if utils.FileExists(filepath) {
		data := &LibraryEngineInstance{
			FilePath:   filepath,
			FilePlugin: fileplugin,
		}
		return data
	}
	return nil
}

func (se *LibraryEngine) Run(ctx *assets.Context, s interface{}) interface{} {
	return nil
}

type LibraryEngineInstance struct {
	FilePath   string
	FilePlugin string
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
	var lib *plugin.Plugin
	var err error

	// If the plugin is not loaded, load it (equivalent of cache for other types of server)
	// verify if the code is loaded in memory
	cdata, invalid := LibraryCache.Get(p.FilePath)
	if cdata != nil {
		lib = cdata.(*plugin.Plugin)
	} else {
		// Check if HOT reload authorized
		if !invalid {
			lib, err = plugin.Open(p.FilePlugin)
			if err != nil {
				invalid = true
			}
		}

		if invalid {
			// get back version number && error
			version, err := compiler.PleaseCompile(p.FilePath, p.FilePlugin, 0)
			if err != nil {
				fmt.Println("ERROR: LIBRARY PAGE/BLOCK COULD NOT COMPILE", err)
				return "ERROR: LIBRARY PAGE/BLOCK COULD NOT COMPILE, Error: " + fmt.Sprint(err)
			}

			// try to reload new library (hot load)
			// works or fail
			if version > 0 {
				p.FilePlugin = p.FilePlugin + fmt.Sprintf(".%d", version)
			}

			lib, err = plugin.Open(p.FilePlugin)
			if err != nil {
				fmt.Println("ERROR: LIBRARY PAGE/BLOCK COULD NOT LOAD", err)
				return "ERROR: LIBRARY PAGE/BLOCK COULD NOT LOAD, Error: " + fmt.Sprint(err)
			}
		}
		LibraryCache.Set(p.FilePath, lib)
	}

	fct, err := lib.Lookup("Run")
	if err != nil {
		fmt.Println("ERROR: LIBRARY DOES NOT CONTAIN RUN FUNCTION", err)
		return "ERROR: LIBRARY DOES NOT CONTAIN RUN FUNCTION, Error: " + fmt.Sprint(err)
	}

	x1 := fct.(func(*assets.Context, *xcore.XTemplate, *xcore.XLanguage, interface{}) interface{})(ctx, template, language, e)

	return x1
}
