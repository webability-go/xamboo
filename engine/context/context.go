package context

import (
  "net/http"
  "plugin"

  "github.com/webability-go/xconfig"

//  "github.com/webability-go/xamboo/config"
)

/* A wrapper to the code/engine (reentrant code)
   parameters:
   - engine pointer, (directly passed thought to the wrapper if needed)
   - Inner Page to call,
   - Parameters,
   - Language,
   - Version
   - Method (GET, POST, PUT, DELETE..)
*/
var EngineWrapperString func(interface{}, string, *interface{}, string, string, string) string
var EngineWrapper func(interface{}, string, *interface{}, string, string, string) interface{}

/* The context is needed to be transported between every call from the engine to the different pages servers
*/
type Context struct {
  Request *http.Request                    // The request (and all its data available: headers, variables, form, files, etc)
  Writer http.ResponseWriter               // The request (and all its data available: headers, variables, form, files, etc)
  MainPage string                          // The original page URL called from outside
  MainPageUsed string                      // The original real page called from outside (valid page found)
  MainURLparams []string                   // The original URL params based on main page
  LocalPage string                         // The local page called (same as Main if called from outside)
  LocalPageUsed string                     // The local real page to use (valid page found)
  LocalURLparams []string                  // The local URL params based on local page, if any
  Sysparams *xconfig.XConfig               // mandatory, site system params
  MainPageparams *xconfig.XConfig          // Original page params (real original .page file)
  MainInstanceparams *xconfig.XConfig      // Original instance params (real original .instance file)
  LocalPageparams *xconfig.XConfig         // Local real page params (.page file)
  LocalInstanceparams *xconfig.XConfig     // Local real page instance (.instance file)
  LocalEntryparams *interface{}            // Params of local page call (NIL if main original page)
  Plugins map[string]*plugin.Plugin        // Wrapper to all the pre-loaded plugins for the system compiled go code (plugins cannot load plugins)
}
