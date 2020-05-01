package bridge

import (
	"net/http"
	"plugin"

	"github.com/webability-go/xamboo/server/assets"
)

/* This package declare all the available functions of the app to be able to call them. */
/* Include this package when you want to call the app */

const (
	// Must be NOT installed or error
	NOTINSTALLED = 1
	// Must be INSTALLED, DOES NOT MATTER IF THE USER IS OR NOT CONNECTED
	ANY = 2
	// Must be INSTALLED and THE USER MUST BE CONNECTED TO USE THE BRIDGE
	USER = 3
)

// Setup fabrica el enlace bridge-modulo SO listo para usar. Verifica luego enlace de funciones, verifica login clientes y usuarios, verifica idionas y deviles.
// Es la primera funcion que hay que llamar cuando se usa el bridge
func Setup(ctx *assets.Context, connection int) bool {

	// Ask for the plugins we need
	app, ok := ctx.Plugins["app"]
	if !ok {
		// 500 internal error
		http.Error(ctx.Writer, "Library xmodules/app is not available", http.StatusInternalServerError)
		return false
	}

	// Initialize the plugin (just in case)
	err := Start(ctx, app)
	if err != nil {
		// 500 internal error
		http.Error(ctx.Writer, "Library xmodules/app could not link with system", http.StatusInternalServerError)
		return false
	}

	installed, _ := ctx.Sysparams.GetBool("installed")
	switch connection {
	case NOTINSTALLED:
		if installed {
			http.Error(ctx.Writer, "Error: the system is already installed.", http.StatusUnauthorized)
			return false
		}
	case ANY:
		if !installed {
			http.Error(ctx.Writer, "Error: the system is not installed.", http.StatusUnauthorized)
			return false
		}
	case USER:
		if !installed {
			http.Error(ctx.Writer, "Error: the system is not installed.", http.StatusUnauthorized)
			return false
		}
		sessionid, _ := ctx.Sessionparams.GetString("sessionid")
		if sessionid == "" {
			http.Error(ctx.Writer, "Error: the user is not connected.", http.StatusUnauthorized)
			return false
		}
	}
	return true
}

var linked bool = false

func Start(ctx *assets.Context, lib *plugin.Plugin) error {
	if !linked {
		err := Link(lib)
		if err != nil {
			return err
		}
		linked = true
	}

	// Check if the client is connected
	if ctx != nil {
		VerifyLogin(ctx)
	}
	return nil
}

func Link(lib *plugin.Plugin) error {
	err := LinkSecurity(lib)
	if err != nil {
		return err
	}
	err = LinkContexts(lib)
	if err != nil {
		return err
	}
	return nil
}
