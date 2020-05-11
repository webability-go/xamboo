package main

import (
	"encoding/xml"

	"github.com/webability-go/xcore/v2"
	"github.com/webability-go/xdominion"
	"github.com/webability-go/xdommask"

	"github.com/webability-go/xamboo/master/app/bridge"
	"github.com/webability-go/xamboo/server"
	"github.com/webability-go/xamboo/server/assets"
)

func Run(ctx *assets.Context, template *xcore.XTemplate, language *xcore.XLanguage, s interface{}) interface{} {

	ok := bridge.Setup(ctx, bridge.USER)
	if !ok {
		return ""
	}

	mask := getMask(ctx, s.(*server.Server)).Compile()
	xmlmask, _ := xml.Marshal(mask)
	params := &xcore.XDataset{
		"FORM": string(xmlmask),
		"#":    language,
	}
	return template.Execute(params)
}

func searchLog(s *server.Server, ctx *assets.Context, host string, app string) string {
	config := s.GetFullConfig()

	// Carga los APPs Libraries de cada Host config
	for _, h := range config.Hosts {
		for id, lib := range h.Plugins {
			if h.Name == host && id == app {
				ccf, _ := lib.Lookup("GetContextConfigFile")
				GetContextConfigFile := ccf.(func() string)
				configfile := GetContextConfigFile()

				bridge.Containers.Load(ctx, host+"_"+app, configfile)
				container := bridge.Containers.GetContainer(host + "_" + app)

				if container.Config == nil {
					return ""
				}
				// extract log file
				logfile, _ := container.Config.GetString("logcore")
				return logfile
			}
		}
	}

	return ""
}

func getMask(ctx *assets.Context, s *server.Server) *xdommask.Mask {

	host := ctx.Request.Form.Get("host")
	app := ctx.Request.Form.Get("app")

	// lets search for host::app config file to load it
	logfile := searchLog(s, ctx, host, app)

	// mode 1 is not used anymore
	mode := 1
	if logfile != "" {
		mode = 2
	}

	mask := xdommask.NewMask("formcontainer")

	if mode == 1 {
		mask.Mode = xdommask.INSERT
	} else {
		mask.Mode = xdommask.UPDATE
		mask.Key = host + "_" + app
	}
	mask.AuthModes = xdommask.INSERT | xdommask.UPDATE | xdommask.VIEW

	mask.AlertMessage = "##mask.errormessage##"
	mask.ServerMessage = "##mask.servermessage##"
	mask.InsertTitle = "##mask.titleinsert##"
	mask.UpdateTitle = "##mask.titleupdate##"
	mask.ViewTitle = "##mask.titleview##"

	// Host
	f1 := xdommask.NewTextField("host")
	f1.Title = "##host.title##"
	f1.AuthModes = xdommask.INSERT | xdommask.UPDATE | xdommask.VIEW
	//	f1.ReadOnlyModes = xdommask.INSERT | xdommask.UPDATE
	f1.ViewModes = xdommask.VIEW
	f1.Size = "200"
	f1.URLVariable = "host"
	f1.DefaultValue = host
	mask.AddField(f1)

	// App
	f2 := xdommask.NewTextField("app")
	f2.Title = "##app.title##"
	f2.AuthModes = xdommask.INSERT | xdommask.UPDATE | xdommask.VIEW
	//	f2.ReadOnlyModes = xdommask.INSERT | xdommask.UPDATE
	f2.ViewModes = xdommask.VIEW
	f2.Size = "200"
	f2.URLVariable = "app"
	f2.DefaultValue = app
	mask.AddField(f2)

	// Log
	f4 := xdommask.NewTextField("path")
	f4.Title = "##path.title##"
	f4.HelpDescription = "##path.help.description##"
	f4.NotNullModes = xdommask.INSERT | xdommask.UPDATE
	f4.AuthModes = xdommask.INSERT | xdommask.UPDATE | xdommask.VIEW
	f4.HelpModes = xdommask.INSERT | xdommask.UPDATE
	f4.ViewModes = xdommask.VIEW
	f4.StatusNotNull = "##path.status.notnull##"
	f4.MinLength = 4
	f4.MaxLength = 100
	f4.StatusTooShort = "##path.status.tooshort##"
	f4.URLVariable = "path"
	f4.DefaultValue = ""
	mask.AddField(f4)

	f7 := xdommask.NewButtonField("", "submit")
	f7.AuthModes = xdommask.INSERT | xdommask.UPDATE
	f7.TitleInsert = "##form.continue##"
	f7.TitleUpdate = "##form.continue##"
	mask.AddField(f7)

	f8 := xdommask.NewButtonField("", "reset")
	f8.AuthModes = xdommask.INSERT | xdommask.UPDATE
	f8.TitleInsert = "##form.reset##"
	f8.TitleUpdate = "##form.reset##"
	mask.AddField(f8)

	if mode == 2 {
		mask.GetRecord = func(mask *xdommask.Mask) *xdominion.XRecord {
			if logfile != "" {
				rec := xdominion.NewXRecord()
				subrec := xdominion.NewXRecord()
				subrec.Set("host", host)
				subrec.Set("app", app)
				subrec.Set("path", logfile)
				rec.Set(host+"_"+app, subrec)
				return rec
			}
			return nil
		}
	}

	return mask
}

func Formcontainer(ctx *assets.Context, template *xcore.XTemplate, language *xcore.XLanguage, s interface{}) interface{} {

	ok := bridge.Setup(ctx, bridge.USER)
	if !ok {
		return ""
	}

	//	key := ctx.Request.Form.Get("Key")
	mode := ctx.Request.Form.Get("Mode")

	host := ctx.Request.Form.Get("host")
	app := ctx.Request.Form.Get("app")
	path := ctx.Request.Form.Get("path")

	if mode == "1" || mode == "2" {
		// check params ok
		success := true
		messages := map[string]string{}
		messagetext := ""
		if host == "" {
			success = false
			messages["host"] = language.Get("error.name.wrong")
			messagetext += language.Get("error.name.wrong")
		}
		if app == "" {
			success = false
			messages["app"] = language.Get("error.name.wrong")
			messagetext += language.Get("error.name.wrong")
		}
		if path == "" {
			success = false
			messages["path"] = language.Get("error.path.missing")
			messagetext += language.Get("error.path.missing")
		}

		if success {
			// build container and write container
			// be sure we load the containers
			searchLog(s.(*server.Server), ctx, host, app)
			container := bridge.Containers.GetContainer(host + "_" + app)
			container.LogFile = path
			bridge.Containers.SaveContainer(ctx, host+"_"+app)

			messages["text"] = language.Get("success")
		} else {
			messages["text"] = messagetext
		}

		return map[string]interface{}{
			"success": success, "messages": messages, "popup": false,
		}
	}
	return map[string]interface{}{
		"success": false, "messages": "Mode not supported", "popup": false,
	}
}
