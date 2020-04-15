package main

import (
	"github.com/webability-go/xcore/v2"

	"github.com/webability-go/xamboo/master/app/bridge"
	"github.com/webability-go/xamboo/server/assets"
	"github.com/webability-go/xamboo/server/config"
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

	application := "true"
	userkey, _ := ctx.Sessionparams.GetString("userkey")
	if userkey == "" {
		userkey = "0"
		application = "false"
	}
	username, _ := ctx.Sessionparams.GetString("username")

	//	bridge.EntityLog_LogStat(ctx)
	params := &xcore.XDataset{
		"APPLICATION": application,
		"SOUND":       "1",
		"HELP":        "1",
		"USER":        username,
		"USERKEY":     userkey,
		"VERSION":     config.Config.Version,
		"#":           language,
	}

	return template.Execute(params)
}

func Formlogin(ctx *assets.Context, template *xcore.XTemplate, language *xcore.XLanguage, e interface{}) interface{} {

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
	userkey, _ := ctx.Sessionparams.GetString("userkey")
	username, _ := ctx.Sessionparams.GetString("username")
	var data map[string]interface{}
	if sessionid != "" {
		data = map[string]interface{}{
			"success":  true,
			"userkey":  userkey,
			"username": username,
			"help":     1,
			"sound":    1,
		}
	} else {
		data = map[string]interface{}{
			"success": false,
			"messages": map[string]string{
				"username": language.Get("login.wrong"),
			},
			"popup": false,
		}
	}
	return data
}

func Formpassword(ctx *assets.Context, template *xcore.XTemplate, language *xcore.XLanguage, e interface{}) interface{} {

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

	// send random id
	// ask for rid
	// if match, connect the user
	return "OK"
}
