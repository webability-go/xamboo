package main

import (
	"encoding/xml"

	"github.com/webability-go/xcore/v2"
	"github.com/webability-go/xdominion"
	"github.com/webability-go/xdommask"

	"github.com/webability-go/xamboo/master/app/bridge"
	"github.com/webability-go/xamboo/server/assets"
)

func Run(ctx *assets.Context, template *xcore.XTemplate, language *xcore.XLanguage, e interface{}) interface{} {

	ok := bridge.Setup(ctx, bridge.USER)
	if !ok {
		return ""
	}

	mask := getMask(ctx).Compile()
	xmlmask, _ := xml.Marshal(mask)
	params := &xcore.XDataset{
		"FORM": string(xmlmask),
		"#":    language,
	}
	return template.Execute(params)
}

func getMask(ctx *assets.Context) *xdommask.Mask {

	container := ctx.Request.Form.Get("container")
	mode := 1
	if container != "" {
		mode = 2
	}

	mask := xdommask.NewMask("formcontainer")

	if mode == 1 {
		mask.Mode = xdommask.INSERT
	} else {
		mask.Mode = xdommask.UPDATE
		mask.Key = container
	}
	mask.AuthModes = xdommask.INSERT | xdommask.UPDATE | xdommask.VIEW

	mask.AlertMessage = "##mask.errormessage##"
	mask.ServerMessage = "##mask.servermessage##"
	mask.InsertTitle = "##mask.titleinsert##"
	mask.UpdateTitle = "##mask.titleupdate##"
	mask.ViewTitle = "##mask.titleview##"

	// name
	f1 := xdommask.NewTextField("name")
	f1.Title = "##name.title##"
	f1.HelpDescription = "##name.help.description##"
	f1.NotNullModes = xdommask.INSERT | xdommask.UPDATE
	f1.AuthModes = xdommask.INSERT | xdommask.UPDATE | xdommask.VIEW
	f1.HelpModes = xdommask.INSERT | xdommask.UPDATE
	f1.ViewModes = xdommask.VIEW
	f1.StatusNotNull = "##name.status.notnull##"
	f1.Size = "200"
	f1.MinLength = 1
	f1.MaxLength = 20
	f1.URLVariable = "name"
	f1.Format = "^[a-z|A-Z|0-9]{1,20}$"
	f1.FormatJS = "^[a-z|A-Z|0-9]{1,20}$"
	f1.StatusBadFormat = "##name.status.badformat##"
	f1.DefaultValue = ""
	mask.AddField(f1)

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
			bridge.Containers.Load(ctx)
			containerdata := bridge.Containers.GetContainer(container)
			if containerdata != nil {
				rec := xdominion.NewXRecord()
				subrec := xdominion.NewXRecord()
				subrec.Set("name", containerdata.Name)
				subrec.Set("path", containerdata.Path)
				rec.Set(container, subrec)
				return rec
			}
			return nil
		}
	}

	return mask
}

func Formcontainer(ctx *assets.Context, template *xcore.XTemplate, language *xcore.XLanguage, e interface{}) interface{} {

	ok := bridge.Setup(ctx, bridge.USER)
	if !ok {
		return ""
	}

	key := ctx.Request.Form.Get("Key")
	mode := ctx.Request.Form.Get("Mode")
	name := ctx.Request.Form.Get("name")
	path := ctx.Request.Form.Get("path")

	if mode == "1" || mode == "2" {
		// check params ok
		success := true
		messages := map[string]string{}
		messagetext := ""
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
			// simulate load of config file into Engine.Host.Config till next system restart
			bridge.Containers.Load(ctx)
			bridge.Containers.UpsertContainer(key, name, path)
			bridge.Containers.SaveContainers(ctx)
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
