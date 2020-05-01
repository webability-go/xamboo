package bridge

import (
	"errors"
	"fmt"
	"plugin"

	//  "github.com/webability-go/xdominion"
	"github.com/webability-go/xamboo/server/assets"
)

var VerifyLogin func(*assets.Context)
var GetMD5Hash func(string) string
var CreateKey func(int, int) string

func LinkSecurity(lib *plugin.Plugin) error {

	fct, err := lib.Lookup("VerifyLogin")
	if err != nil {
		fmt.Println(err)
		return errors.New("ERROR: THE APPLICATION LIBRARY DOES NOT CONTAIN VerifyLogin FUNCTION")
	}
	VerifyLogin = fct.(func(*assets.Context))

	fct, err = lib.Lookup("GetMD5Hash")
	if err != nil {
		fmt.Println(err)
		return errors.New("ERROR: THE APPLICATION LIBRARY DOES NOT CONTAIN GetMD5Hash FUNCTION")
	}
	GetMD5Hash = fct.(func(text string) string)

	fct, err = lib.Lookup("CreateKey")
	if err != nil {
		fmt.Println(err)
		return errors.New("ERROR: THE APPLICATION LIBRARY DOES NOT CONTAIN CreateKey FUNCTION")
	}
	CreateKey = fct.(func(int, int) string)

	return nil
}
