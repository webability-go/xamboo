package context

import (
	"log"
	"net/http"
	"plugin"

	"github.com/webability-go/xconfig"
)

// Context structure is needed to be transported between every call from the engine to the different page engines
type Context struct {
	Request             *http.Request             // The request (and all its data available: headers, variables, form, files, etc)
	Writer              http.ResponseWriter       // The request (and all its data available: headers, variables, form, files, etc)
	IsMainPage          bool                      // true it this page is the main page itself, false if any other page or blocks
	Code                int                       // return code
	Language            string                    // default system language by host. can be changed by code
	Version             string                    // default system version by host. can be changed by code
	MainPage            string                    // The original page URL called from outside
	MainPageUsed        string                    // The original real page called from outside (valid page found)
	MainURLparams       []string                  // The original URL params based on main page
	LocalPage           string                    // The local page called (same as Main if called from outside)
	LocalPageUsed       string                    // The local real page to use (valid page found)
	LocalURLparams      []string                  // The local URL params based on local page, if any
	LoggerError         *log.Logger               // The logger to log errors
	Sysparams           *xconfig.XConfig          // mandatory, site system params
	Sessionparams       *xconfig.XConfig          // Optional, for the programer to add any session data he needs.
	MainPageparams      *xconfig.XConfig          // Original page params (real original .page file)
	MainInstanceparams  *xconfig.XConfig          // Original instance params (real original .instance file)
	LocalPageparams     *xconfig.XConfig          // Local real page params (.page file)
	LocalInstanceparams *xconfig.XConfig          // Local real page instance (.instance file)
	LocalEntryparams    interface{}               // Params of local page call (NIL if main original page)
	Plugins             map[string]*plugin.Plugin // Wrapper to all the pre-loaded plugins for the system compiled go code (plugins cannot load plugins)
	IsGZiped            bool                      // set to true if the content of the code returned by a library is already gziped
}
