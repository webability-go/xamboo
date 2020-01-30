package main

import (
	"fmt"

	"github.com/webability-go/xamboo/server/assets"
	"github.com/webability-go/xamboo/server/config"
	"github.com/webability-go/xcore"
)

const VERSION = "1.0.0"

func init() {
	fmt.Println("External APP Main SO library initialized, VERSION =", VERSION)

	// Load CONFIG

	// Start a database POOL

}

func Start(h config.Host) {
	fmt.Println("External APP Main SO library started (should start twice since there are 2 sites using it), HOST =", h.Name, "VERSION =", VERSION)

}

func GetPageData(ctx *assets.Context, template *xcore.XTemplate, language *xcore.XLanguage, e interface{}) string {
	fmt.Println("Distributes a page data called by a page library from app.go")

	return "This is the code of the external application after build all what you need into it. This is a shared library compiled as a plugin."
}
