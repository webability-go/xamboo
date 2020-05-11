package main

import (
	"encoding/xml"

	"github.com/webability-go/xconfig"
	"github.com/webability-go/xcore/v2"
	"github.com/webability-go/xdominion"
	"github.com/webability-go/xdommask"

	"github.com/webability-go/xamboo/server"
	"github.com/webability-go/xamboo/server/assets"

	cassets "github.com/webability-go/xamboo/master/app/assets"
	"github.com/webability-go/xamboo/master/app/bridge"
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

func searchContext(s *server.Server, ctx *assets.Context, host string, app string, contextid string) *cassets.Context {
	config := s.GetFullConfig()

	// Carga los APPs Libraries de cada Host config
	for _, h := range config.Hosts {
		for id, lib := range h.Plugins {
			if h.Name == host && id == app {
				ccf, _ := lib.Lookup("GetContextConfigFile")
				GetContextConfigFile := ccf.(func() string)
				configfile := GetContextConfigFile()
				bridge.Containers.Load(ctx, host+"_"+app, configfile)
				container := bridge.Containers.GetContext(host+"_"+app, contextid)
				return container
			}
		}
	}
	return nil
}

func getMask(ctx *assets.Context, s *server.Server) *xdommask.Mask {

	host := ctx.Request.Form.Get("host")
	app := ctx.Request.Form.Get("app")
	context := ctx.Request.Form.Get("context")

	// lets search for host::app config file to load it
	contextdata := searchContext(s, ctx, host, app, context)

	mode := 1
	if contextdata != nil {
		mode = 2
	}

	mask := xdommask.NewMask("formcontext")

	if mode == 1 {
		mask.Mode = xdommask.INSERT
	} else {
		mask.Mode = xdommask.UPDATE
		mask.Key = context
	}
	mask.AuthModes = xdommask.INSERT | xdommask.UPDATE | xdommask.VIEW
	mask.Variables["context"] = context

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

	// name
	f3 := xdommask.NewTextField("name")
	f3.Title = "##name.title##"
	f3.HelpDescription = "##name.help.description##"
	f3.NotNullModes = xdommask.INSERT | xdommask.UPDATE
	f3.AuthModes = xdommask.INSERT | xdommask.UPDATE | xdommask.VIEW
	f3.HelpModes = xdommask.INSERT | xdommask.UPDATE
	f3.ViewModes = xdommask.VIEW
	f3.StatusNotNull = "##name.status.notnull##"
	f3.Size = "200"
	f3.MinLength = 1
	f3.MaxLength = 20
	f3.URLVariable = "name"
	f3.Format = "^[a-z|A-Z|0-9]{1,20}$"
	f3.FormatJS = "^[a-z|A-Z|0-9]{1,20}$"
	f3.StatusBadFormat = "##name.status.badformat##"
	f3.DefaultValue = ""
	mask.AddField(f3)

	// path
	f4 := xdommask.NewTextField("path")
	f4.Title = "##path.title##"
	f4.HelpDescription = "##path.help.description##"
	f4.NotNullModes = xdommask.INSERT | xdommask.UPDATE
	f4.AuthModes = xdommask.INSERT | xdommask.UPDATE | xdommask.VIEW
	f4.HelpModes = xdommask.INSERT | xdommask.UPDATE
	f4.ViewModes = xdommask.VIEW
	f4.StatusNotNull = "##path.status.notnull##"
	f4.MinLength = 4
	f4.Size = "400"
	f4.StatusTooShort = "##path.status.tooshort##"
	f4.URLVariable = "path"
	f4.DefaultValue = ""
	mask.AddField(f4)

	// line to separate config fields
	/*
		context=xmodules

		# Module CONTEXT - databases & logs
		database.main.type=postgres
		database.main.username=root
		database.main.password=ptcgucm99
		database.main.database=xmodules
		database.main.server=localhost
		database.main.ssl=off

		# main log IS MANDATORY
		log.main.file=logs/xmodules-core.log

		# ==========================================================================
		# MODULOS AUTORIZADOS SOBRE ESTE CONTEXTO:

		module=context
		module=user
	*/
	// context name
	f11 := xdommask.NewTextField("contextname")
	f11.Title = "Nombre del contexto"
	f11.HelpDescription = "##name.help.description##"
	f11.NotNullModes = xdommask.INSERT | xdommask.UPDATE
	f11.AuthModes = xdommask.INSERT | xdommask.UPDATE | xdommask.VIEW
	f11.HelpModes = xdommask.INSERT | xdommask.UPDATE
	f11.ViewModes = xdommask.VIEW
	f11.StatusNotNull = "##name.status.notnull##"
	f11.Size = "200"
	f11.MinLength = 1
	f11.MaxLength = 20
	f11.URLVariable = "name"
	f11.Format = "^[a-z|A-Z|0-9]{1,20}$"
	f11.FormatJS = "^[a-z|A-Z|0-9]{1,20}$"
	f11.StatusBadFormat = "##name.status.badformat##"
	f11.DefaultValue = ""
	mask.AddField(f11)

	// database main type
	f12 := xdommask.NewTextField("dbmaintype")
	f12.Title = "Base de datos 'main': Tipo"
	f12.HelpDescription = "##name.help.description##"
	f12.NotNullModes = xdommask.INSERT | xdommask.UPDATE
	f12.AuthModes = xdommask.INSERT | xdommask.UPDATE | xdommask.VIEW
	f12.HelpModes = xdommask.INSERT | xdommask.UPDATE
	f12.ViewModes = xdommask.VIEW
	f12.StatusNotNull = "##name.status.notnull##"
	f12.Size = "200"
	f12.MinLength = 1
	f12.MaxLength = 20
	f12.URLVariable = "name"
	f12.Format = "^[a-z|A-Z|0-9]{1,20}$"
	f12.FormatJS = "^[a-z|A-Z|0-9]{1,20}$"
	f12.StatusBadFormat = "##name.status.badformat##"
	f12.DefaultValue = ""
	mask.AddField(f12)

	// database main username
	f13 := xdommask.NewTextField("dbmainusername")
	f13.Title = "Base de datos 'main': usuario"
	f13.HelpDescription = "##name.help.description##"
	f13.NotNullModes = xdommask.INSERT | xdommask.UPDATE
	f13.AuthModes = xdommask.INSERT | xdommask.UPDATE | xdommask.VIEW
	f13.HelpModes = xdommask.INSERT | xdommask.UPDATE
	f13.ViewModes = xdommask.VIEW
	f13.StatusNotNull = "##name.status.notnull##"
	f13.Size = "200"
	f13.MinLength = 1
	f13.MaxLength = 20
	f13.URLVariable = "name"
	f13.Format = "^[a-z|A-Z|0-9]{1,20}$"
	f13.FormatJS = "^[a-z|A-Z|0-9]{1,20}$"
	f13.StatusBadFormat = "##name.status.badformat##"
	f13.DefaultValue = ""
	mask.AddField(f13)

	// database main password
	f14 := xdommask.NewTextField("dbmainpassword")
	f14.Title = "Base de datos 'main': contrasena"
	f14.HelpDescription = "##name.help.description##"
	f14.NotNullModes = xdommask.INSERT | xdommask.UPDATE
	f14.AuthModes = xdommask.INSERT | xdommask.UPDATE | xdommask.VIEW
	f14.HelpModes = xdommask.INSERT | xdommask.UPDATE
	f14.ViewModes = xdommask.VIEW
	f14.StatusNotNull = "##name.status.notnull##"
	f14.Size = "200"
	f14.MinLength = 1
	f14.MaxLength = 20
	f14.URLVariable = "name"
	f14.Format = "^[a-z|A-Z|0-9]{1,20}$"
	f14.FormatJS = "^[a-z|A-Z|0-9]{1,20}$"
	f14.StatusBadFormat = "##name.status.badformat##"
	f14.DefaultValue = ""
	mask.AddField(f14)

	// database main database
	f15 := xdommask.NewTextField("dbmaindatabase")
	f15.Title = "Base de datos 'main': Nombre base de datos"
	f15.HelpDescription = "##name.help.description##"
	f15.NotNullModes = xdommask.INSERT | xdommask.UPDATE
	f15.AuthModes = xdommask.INSERT | xdommask.UPDATE | xdommask.VIEW
	f15.HelpModes = xdommask.INSERT | xdommask.UPDATE
	f15.ViewModes = xdommask.VIEW
	f15.StatusNotNull = "##name.status.notnull##"
	f15.Size = "200"
	f15.MinLength = 1
	f15.MaxLength = 20
	f15.URLVariable = "name"
	f15.Format = "^[a-z|A-Z|0-9]{1,20}$"
	f15.FormatJS = "^[a-z|A-Z|0-9]{1,20}$"
	f15.StatusBadFormat = "##name.status.badformat##"
	f15.DefaultValue = ""
	mask.AddField(f15)

	// database main server
	f16 := xdommask.NewTextField("dbmainserver")
	f16.Title = "Base de datos 'main': Servidor"
	f16.HelpDescription = "##name.help.description##"
	f16.NotNullModes = xdommask.INSERT | xdommask.UPDATE
	f16.AuthModes = xdommask.INSERT | xdommask.UPDATE | xdommask.VIEW
	f16.HelpModes = xdommask.INSERT | xdommask.UPDATE
	f16.ViewModes = xdommask.VIEW
	f16.StatusNotNull = "##name.status.notnull##"
	f16.Size = "200"
	f16.MinLength = 1
	f16.MaxLength = 20
	f16.URLVariable = "name"
	f16.Format = "^[a-z|A-Z|0-9]{1,20}$"
	f16.FormatJS = "^[a-z|A-Z|0-9]{1,20}$"
	f16.StatusBadFormat = "##name.status.badformat##"
	f16.DefaultValue = ""
	mask.AddField(f16)

	// database main ssl
	f17 := xdommask.NewTextField("dbmainssl")
	f17.Title = "Base de datos 'main': Usa SSL"
	f17.HelpDescription = "##name.help.description##"
	f17.NotNullModes = xdommask.INSERT | xdommask.UPDATE
	f17.AuthModes = xdommask.INSERT | xdommask.UPDATE | xdommask.VIEW
	f17.HelpModes = xdommask.INSERT | xdommask.UPDATE
	f17.ViewModes = xdommask.VIEW
	f17.StatusNotNull = "##name.status.notnull##"
	f17.Size = "200"
	f17.MinLength = 1
	f17.MaxLength = 20
	f17.URLVariable = "name"
	f17.Format = "^[a-z|A-Z|0-9]{1,20}$"
	f17.FormatJS = "^[a-z|A-Z|0-9]{1,20}$"
	f17.StatusBadFormat = "##name.status.badformat##"
	f17.DefaultValue = ""
	mask.AddField(f17)

	// main log
	f18 := xdommask.NewTextField("logmainfile")
	f18.Title = "Log 'main': archivo"
	f18.HelpDescription = "##name.help.description##"
	f18.NotNullModes = xdommask.INSERT | xdommask.UPDATE
	f18.AuthModes = xdommask.INSERT | xdommask.UPDATE | xdommask.VIEW
	f18.HelpModes = xdommask.INSERT | xdommask.UPDATE
	f18.ViewModes = xdommask.VIEW
	f18.StatusNotNull = "##name.status.notnull##"
	f18.Size = "200"
	f18.MinLength = 1
	f18.MaxLength = 20
	f18.URLVariable = "name"
	f18.Format = "^[a-z|A-Z|0-9]{1,20}$"
	f18.FormatJS = "^[a-z|A-Z|0-9]{1,20}$"
	f18.StatusBadFormat = "##name.status.badformat##"
	f18.DefaultValue = ""
	mask.AddField(f18)

	// modules
	// list of available modules, checkbox

	f19 := xdommask.NewTextField("xmodule")
	f19.Title = "XModule 'context'"
	f19.HelpDescription = "##name.help.description##"
	f19.NotNullModes = xdommask.INSERT | xdommask.UPDATE
	f19.AuthModes = xdommask.INSERT | xdommask.UPDATE | xdommask.VIEW
	f19.HelpModes = xdommask.INSERT | xdommask.UPDATE
	f19.ViewModes = xdommask.VIEW
	f19.StatusNotNull = "##name.status.notnull##"
	f19.Size = "200"
	f19.MinLength = 1
	f19.MaxLength = 20
	f19.URLVariable = "name"
	f19.Format = "^[a-z|A-Z|0-9]{1,20}$"
	f19.FormatJS = "^[a-z|A-Z|0-9]{1,20}$"
	f19.StatusBadFormat = "##name.status.badformat##"
	f19.DefaultValue = ""
	mask.AddField(f19)

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
			if contextdata != nil {
				rec := xdominion.NewXRecord()
				subrec := xdominion.NewXRecord()
				subrec.Set("host", host)
				subrec.Set("app", app)
				subrec.Set("name", contextdata.ID)
				subrec.Set("path", contextdata.Path)
				rec.Set(context, subrec)
				return rec
			}
			return nil
		}
	}

	return mask
}

func Formcontext(ctx *assets.Context, template *xcore.XTemplate, language *xcore.XLanguage, s interface{}) interface{} {

	ok := bridge.Setup(ctx, bridge.USER)
	if !ok {
		return ""
	}

	key := ctx.Request.Form.Get("Key")
	mode := ctx.Request.Form.Get("Mode")

	host := ctx.Request.Form.Get("host")
	app := ctx.Request.Form.Get("app")
	name := ctx.Request.Form.Get("name")
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
		if name == "" {
			success = false
			messages["name"] = language.Get("error.name.wrong")
			messagetext += language.Get("error.name.wrong")
		}
		if path == "" {
			success = false
			messages["path"] = language.Get("error.path.missing")
			messagetext += language.Get("error.path.missing")
		}

		if success {
			// write config file
			// Load context to load all config
			searchContext(s.(*server.Server), ctx, host, app, key)
			context := bridge.Containers.UpsertContext(host+"_"+app, key, name, path)
			bridge.Containers.SaveContainer(ctx, host+"_"+app)

			// All the parameters of context config file
			// adds/modify params
			if context.Config == nil {
				context.Config = xconfig.New()
			}

			bridge.Containers.SaveContext(ctx, host+"_"+app, name)

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
