package main

import (
	"fmt"

	"github.com/webability-go/xcore/v2"

	"github.com/webability-go/xamboo/server"
	"github.com/webability-go/xamboo/server/assets"

	"github.com/webability-go/xamboo/master/app/bridge"

	"github.com/webability-go/xmodules/context"
)

func Run(ctx *assets.Context, template *xcore.XTemplate, language *xcore.XLanguage, s interface{}) interface{} {

	ok := bridge.Setup(ctx, bridge.USER)
	if !ok {
		return ""
	}

	data := generateData(ctx, s.(*server.Server))

	host := ctx.Request.Form.Get("host")
	app := ctx.Request.Form.Get("app")
	scontext := ctx.Request.Form.Get("context")
	module := ctx.Request.Form.Get("module")
	prefix := ctx.Request.Form.Get("prefix")

	params := &xcore.XDataset{
		"host":    host,
		"app":     app,
		"context": scontext,
		"module":  module,
		"prefix":  prefix,
		"DATA":    data,
		"#":       language,
	}
	return template.Execute(params)
}

func generateData(ctx *assets.Context, s *server.Server) string {

	host := ctx.Request.Form.Get("host")
	app := ctx.Request.Form.Get("app")
	scontext := ctx.Request.Form.Get("context")
	module := ctx.Request.Form.Get("module")
	prefix := ctx.Request.Form.Get("prefix")

	return "Host:<br/>" + host + "<br/>" +
		"APP:<br/>" + app + "<br/>" +
		"Context:<br/>" + scontext + "<br/>" +
		"Module:<br/>" + module + "<br/>" +
		"Prefix:<br/>" + prefix + "<br/>"
}

func Install(ctx *assets.Context, template *xcore.XTemplate, language *xcore.XLanguage, s interface{}) interface{} {

	ok := bridge.Setup(ctx, bridge.USER)
	if !ok {
		return ""
	}
	srv := s.(*server.Server)

	host := ctx.Request.Form.Get("host")
	app := ctx.Request.Form.Get("app")
	scontext := ctx.Request.Form.Get("context")
	module := ctx.Request.Form.Get("module")
	prefix := ctx.Request.Form.Get("prefix")

	// Get config to access things
	config := srv.GetFullConfig()

	// Extract the module interface from the APP Plugin
	for _, h := range config.Hosts {
		if h.Name != host {
			continue
		}
		for id, lib := range h.Plugins {
			if id != app {
				continue
			}

			cm, _ := lib.Lookup("GetCompiledModules")
			GetCompiledModules := cm.(func() *context.Modules)
			compiledmodules := GetCompiledModules()

			var moduledata context.ModuleDef = nil
			for _, cmodule := range *compiledmodules {
				if cmodule.GetID() == module {
					moduledata = cmodule
					break
				}
			}
			if moduledata == nil {
				continue
			}

			cc, _ := lib.Lookup("GetContextContainer")
			GetContextContainer := cc.(func() *context.Container)
			contextcontainer := GetContextContainer()

			contextdata := contextcontainer.GetContext(scontext)

			if contextdata == nil {
				continue
			}

			fmt.Println("MODULE AND CONTEXT FOUND:", moduledata, contextdata, prefix)
			// do install/update

			result, err := moduledata.Synchronize(contextdata, prefix)

			fmt.Println(err, result)
		}
	}

	return map[string]interface{}{
		"success": true, "messages": "Installed", "popup": false,
	}
}
