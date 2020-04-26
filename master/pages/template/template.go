package main

import (
	"github.com/webability-go/xcore/v2"

	"github.com/webability-go/xamboo/server/assets"
)

func Run(ctx *assets.Context, template *xcore.XTemplate, language *xcore.XLanguage, e interface{}) interface{} {

	// Va a buscar los datos de la página
	// JS: core mandatory load for every page
	jss := []string{
		// WAJAF
		"/js?js=core.js",
		"/js?js=corebrowser.js",
		"/js?js=eventManager.js",
		"/js?js=ajaxManager.js",
		"/js?js=ondemandManager.js",
		"/js?js=ddManager.js",
		"/js?js=soundManager.js",
		"/js?js=animManager.js",
		"/js?js=helpManager.js",
		"/js?js=wa4glManager.js",
	}
	jsdata := ""
	for _, file := range jss {
		jsdata += "<script src=\"" + file + "\" /></script>\n"
	}

	//	bridge.EntityLog_LogStat(ctx)
	params := &xcore.XDataset{
		"LANGUAGE": ctx.Language,
		"JS":       jsdata,
	}

	return template.Execute(params)
}
