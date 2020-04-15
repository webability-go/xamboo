package bridge

import (
	"errors"
	"fmt"
	"plugin"

	"github.com/webability-go/xamboo/server/assets"
)

/* This package declare all the available functions of the app to be able to call them. */
/* Include this package when you want to call the app */

var linked bool = false

var VerifyLogin func(*assets.Context)

func Start(lib *plugin.Plugin) error {
	if linked {
		return nil
	}

	fmt.Println("Linking the app plugin to mapped functions")

	fct, err := lib.Lookup("VerifyLogin")
	if err != nil {
		fmt.Println(err)
		return errors.New("ERROR: THE APPLICATION LIBRARY DOES NOT CONTAIN VerifyLogin FUNCTION")
	}
	VerifyLogin = fct.(func(*assets.Context))
	linked = true
	return nil
}
