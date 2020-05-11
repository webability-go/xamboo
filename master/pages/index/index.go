package main

import (
	"fmt"
	"strings"

	"github.com/webability-go/xcore/v2"

	"github.com/webability-go/xamboo/server"
	"github.com/webability-go/xamboo/server/assets"
	"github.com/webability-go/xmodules/context"

	"github.com/webability-go/xamboo/master/app/bridge"
)

func Run(ctx *assets.Context, template *xcore.XTemplate, language *xcore.XLanguage, s interface{}) interface{} {

	ok := bridge.Setup(ctx, bridge.USER)
	if !ok {
		return ""
	}

	//	bridge.EntityLog_LogStat(ctx)
	params := &xcore.XDataset{
		"#": language,
	}

	return template.Execute(params)
}

func Menu(ctx *assets.Context, template *xcore.XTemplate, language *xcore.XLanguage, s interface{}) interface{} {

	ok := bridge.Setup(ctx, bridge.USER)
	if !ok {
		return ""
	}

	Order := ctx.Request.Form.Get("Order")

	if Order == "get" {
		return getMenu(ctx, s.(*server.Server), language)
	}
	if Order == "openclose" {

		//    $id = $this->base->HTTPRequest->getParameter('id');
		//    $status = $this->base->HTTPRequest->getParameter('status');
		//    $this->base->security->setParameter('mastertree', $id, $status=='true'?1:0);
	}

	return map[string]string{
		"status": "OK",
	}
}

func getMenu(ctx *assets.Context, s *server.Server, language *xcore.XLanguage) map[string]interface{} {

	rows := []interface{}{}

	config := s.GetFullConfig()

	// Config:
	optr := map[string]interface{}{
		"id":        "config",
		"template":  "config",
		"loadable":  false,
		"closeable": true,
		"closed":    true,
	}
	rows = append(rows, optr)

	//   listeners
	optr = map[string]interface{}{
		"id":        "listeners",
		"template":  "listeners",
		"father":    "config",
		"loadable":  false,
		"closeable": true,
		"closed":    true,
	}
	rows = append(rows, optr)
	for _, l := range config.Listeners {
		ip := "*"
		if l.IP != "" {
			ip = l.IP
		}
		opt := map[string]interface{}{
			"id":        "lis-" + l.Name,
			"lisid":     l.Name,
			"template":  "listener",
			"name":      l.Name + " [" + l.Protocol + "://" + ip + ":" + l.Port + "]",
			"father":    "listeners",
			"loadable":  false,
			"closeable": false,
		}
		rows = append(rows, opt)
	}

	//   Hosts
	optr = map[string]interface{}{
		"id":        "hosts",
		"template":  "hosts",
		"father":    "config",
		"loadable":  false,
		"closeable": true,
		"closed":    true,
	}
	rows = append(rows, optr)
	for _, h := range config.Hosts {
		hn := ""
		if len(h.HostNames) > 0 {
			hn = h.HostNames[0]
		}
		opt := map[string]interface{}{
			"id":        "hos-" + h.Name,
			"hosid":     h.Name,
			"template":  "host",
			"name":      h.Name + " [" + hn + "]",
			"father":    "hosts",
			"loadable":  false,
			"closeable": false,
		}
		rows = append(rows, opt)
	}

	//   Engines
	optr = map[string]interface{}{
		"id":        "engines",
		"template":  "engines",
		"father":    "config",
		"loadable":  false,
		"closeable": true,
		"closed":    true,
	}
	rows = append(rows, optr)
	for _, e := range config.Engines {
		opt := map[string]interface{}{
			"id":        "eng-" + e.Name,
			"engid":     e.Name,
			"template":  "engine",
			"name":      e.Name,
			"father":    "engines",
			"loadable":  false,
			"closeable": false,
		}
		rows = append(rows, opt)
	}

	// Containers de los hosts x APPs
	optr = map[string]interface{}{
		"id":        "containers",
		"template":  "containers",
		"loadable":  false,
		"closeable": true,
		"closed":    true,
	}
	rows = append(rows, optr)

	apps := map[string]int{}
	cnt := 1

	// Carga los APPs Libraries de cada Host config
	for _, h := range config.Hosts {
		for id, lib := range h.Plugins {

			ptr := fmt.Sprint(lib)
			num, ok := apps[ptr]
			if !ok {
				num = cnt
				apps[ptr] = cnt
				cnt++
			}

			opt := map[string]interface{}{
				"id":        "cnt-" + h.Name + "-" + id,
				"hostid":    h.Name,
				"appid":     id,
				"template":  "container",
				"name":      h.Name + "::" + id,
				"status":    "[#" + fmt.Sprint(num) + "]",
				"father":    "containers",
				"loadable":  false,
				"closeable": true,
				"closed":    true,
			}
			rows = append(rows, opt)

			// Contexts and its modules on each library. Taken from its CONFIG FILE (not running in memory: maybe still not lauched)
			ccf, _ := lib.Lookup("GetContextConfigFile")
			GetContextConfigFile := ccf.(func() string)
			configfile := GetContextConfigFile()

			cm, _ := lib.Lookup("GetCompiledModules")
			GetCompiledModules := cm.(func() *context.Modules)
			compiledmodules := GetCompiledModules()

			cc, _ := lib.Lookup("GetContextContainer")
			GetContextContainer := cc.(func() *context.Container)
			contextcontainer := GetContextContainer()

			// Lets load the configuration structure of the context
			bridge.Containers.Load(ctx, h.Name+"_"+id, configfile)
			container := bridge.Containers.GetContainer(h.Name + "_" + id)
			contexts := container.Contexts

			for _, context := range contexts {
				thiscontext := contextcontainer.GetContext(context.ID)
				icon := "context.png"
				if thiscontext == nil {
					icon = "context-notavailable.png"
				}

				opt := map[string]interface{}{
					"id":        "ctx-" + context.ID,
					"hostid":    h.Name,
					"appid":     id,
					"conid":     context.ID,
					"template":  "context",
					"icon":      icon,
					"name":      context.ID,
					"color":     "black",
					"father":    "cnt-" + h.Name + "-" + id,
					"loadable":  false,
					"closeable": false,
				}
				rows = append(rows, opt)

				if context.Config == nil {
					continue // nothing to scan: only config link exists
				}
				authorizedmodules, _ := context.Config.GetStringCollection("module")
				if len(authorizedmodules) == 0 && len(*compiledmodules) == 0 {
					continue // nothing to show
				}

				for _, authmod := range authorizedmodules {
					xauthmod := strings.Split(authmod, "|")
					modid := xauthmod[0]
					modprefix := ""
					if len(xauthmod) > 1 {
						modprefix = xauthmod[1]
					}

					// Verify if the module is compiled/installed for this DB
					modversion := ""
					installedversion := ""
					for _, mod := range *compiledmodules {
						if modid == mod.GetID() {
							modversion = mod.GetVersion()
							if thiscontext != nil {
								installedversion = mod.GetInstalledVersion(thiscontext)
							}
							break
						}
					}

					// Get version from module table to know installed version etc
					prefix := ""
					if modprefix != "" {
						prefix = "[" + modprefix + "]"
					}

					icon := "module.png"
					status := language.Get("OK")
					version := ""
					if modversion != "" {
						version = "v" + modversion
						if installedversion == "" {
							status = language.Get("NOTINSTALLED")
							icon = "module-installable.png" // not installed
						} else if modversion != installedversion {
							status = language.Get("UPGRADE")
							icon = "module-updatable.png" // have to update
						}
					} else {
						status = language.Get("NOTCOMPILE")
						icon = "module-notcompiled.png" // not compiled
					}

					opt := map[string]interface{}{
						"id":        "mod-" + context.ID + modprefix + modid,
						"icon":      icon,
						"hostid":    h.Name,
						"appid":     id,
						"conid":     context.ID,
						"modid":     modid,
						"modprefix": modprefix,
						"template":  "module",
						"name":      prefix + modid + " " + version,
						"color":     "black",
						"status":    status,
						"father":    "ctx-" + context.ID,
						"loadable":  false,
						"closeable": false,
					}
					rows = append(rows, opt)
				}

				// Now we add compiled modules not authorized
				for _, compmod := range *compiledmodules {
					found := false
					for _, authmod := range authorizedmodules {
						xauthmod := strings.Split(authmod, "|")
						if compmod.GetID() == xauthmod[0] {
							found = true
							break
						}
					}
					if found {
						continue
					}

					opt := map[string]interface{}{
						"id":        "mod-" + context.ID + compmod.GetID(),
						"hostid":    h.Name,
						"appid":     id,
						"modid":     compmod.GetID(),
						"modprefix": "",
						"template":  "module",
						"icon":      "module-noaction.png",
						"name":      compmod.GetID() + " " + compmod.GetVersion(),
						"color":     "black",
						"status":    "(NOT AUTHORIZED)",
						"father":    "ctx-" + context.ID,
						"loadable":  false,
						"closeable": false,
					}
					rows = append(rows, opt)
				}
			}
		}
	}

	return map[string]interface{}{
		"row": rows,
	}

}
