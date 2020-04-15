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
		"/js/system/core.js",
		"/js/managers/eventManager.js",
		"/js/managers/ajaxManager.js",
		"/js/managers/ondemandManager.js",
		"/js/managers/ddManager.js",
		"/js/managers/soundManager.js",
		"/js/managers/animManager.js",
		"/js/managers/helpManager.js",
		"/js/managers/wa4glManager.js",
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
