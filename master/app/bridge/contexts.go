package bridge

import (
	"errors"
	"fmt"
	"plugin"

	cassets "github.com/webability-go/xamboo/master/app/assets"
)

var Containers cassets.ContainersList

func LinkContexts(lib *plugin.Plugin) error {

	obj, err := lib.Lookup("Containers")
	if err != nil {
		fmt.Println(err)
		return errors.New("ERROR: THE APPLICATION LIBRARY DOES NOT CONTAIN Containers OBJECT")
	}
	Containers = obj.(cassets.ContainersList)

	return nil
}
