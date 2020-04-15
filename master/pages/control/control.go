package main

import (
	"github.com/webability-go/xcore/v2"

	"github.com/webability-go/xamboo/master/app/bridge"
	"github.com/webability-go/xamboo/server/assets"
)

func Run(ctx *assets.Context, template *xcore.XTemplate, language *xcore.XLanguage, e interface{}) interface{} {

	// If config already done, CANNOT call this page (error)
	installed, _ := ctx.Sysparams.GetBool("installed")
	if !installed {
		return "Error: system not yet installed"
	}

	// Let's call out external app library (you should create a wrapper to your app so it's much easier to access funcions instead or writing all this code here)
	myappdata, ok := ctx.Plugins["app"]
	if !ok {
		return "ERROR: THE APPLICATION LIBRARY IS NOT AVAILABLE"
	}

	bridge.Start(myappdata)
	bridge.VerifyLogin(ctx)

	sessionid, _ := ctx.Sessionparams.GetString("sessionid")
	if sessionid == "" {
		return "ERROR: THE USER IS NOT LOGGED IN"
	}

	//	bridge.EntityLog_LogStat(ctx)
	params := &xcore.XDataset{}

	return template.Execute(params)
}
