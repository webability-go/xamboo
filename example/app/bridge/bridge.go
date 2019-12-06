package bridge

import (
	"errors"
	"fmt"
	"plugin"

	"github.com/webability-go/xamboo/engine/context"
	"github.com/webability-go/xcore"
)

/* This package declare all the available functions of the app to be able to call them. */
/* Include this package when you want to call the app */

var linked bool = false

var GetPageData func(*context.Context, *xcore.XTemplate, *xcore.XLanguage, interface{}) string

func Start(lib *plugin.Plugin) error {
	if linked {
		return nil
	}

	fmt.Println("Linking the app plugin to mapped functions")

	fct, err := lib.Lookup("GetPageData")
	if err != nil {
		fmt.Println(err)
		return errors.New("ERROR: THE APPLICATION LIBRARY DOES NOT CONTAIN GETPAGEDATA FUNCTION")
	}
	GetPageData = fct.(func(*context.Context, *xcore.XTemplate, *xcore.XLanguage, interface{}) string)
	linked = true
	return nil
}
