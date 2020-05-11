package main

import (
	"fmt"

	"github.com/webability-go/xamboo/server/config"

	"github.com/webability-go/xmodules/context"

	_ "github.com/webability-go/xmodules/client"
	_ "github.com/webability-go/xmodules/clientlink"
	_ "github.com/webability-go/xmodules/clientp18n"
	_ "github.com/webability-go/xmodules/clientsecurity"
	_ "github.com/webability-go/xmodules/country"
	_ "github.com/webability-go/xmodules/ingredient"
	_ "github.com/webability-go/xmodules/material"
	_ "github.com/webability-go/xmodules/metric"
	_ "github.com/webability-go/xmodules/stat"
	_ "github.com/webability-go/xmodules/suggestions"
	_ "github.com/webability-go/xmodules/translation"
	_ "github.com/webability-go/xmodules/usda"
	_ "github.com/webability-go/xmodules/user"
	_ "github.com/webability-go/xmodules/userlink"
	//	_ "github.com/webability-go/xmodules/usermenu"
	_ "github.com/webability-go/xmodules/wiki"
)

const (
	VERSION           = "1.0.0"
	CONTEXTCONFIGFILE = "./master/config/contexts.conf"
)

var (
	ContextContainer *context.Container
)

func init() {
	fmt.Println("Master APP Main SO library initialized, VERSION =", VERSION)

	ContextContainer = context.Create(CONTEXTCONFIGFILE)
}

func Start(h config.Host) {
	fmt.Println("Master APP Main SO library Started, HOST =", h.Name)

}

func GetContextConfigFile() string {
	return CONTEXTCONFIGFILE
}

func GetCompiledModules() *context.Modules {
	return context.ModulesList
}

func GetContextContainer() *context.Container {
	return ContextContainer
}
