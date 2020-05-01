package main

import (
	"encoding/xml"
	"io/ioutil"

	"github.com/webability-go/xcore/v2"
	"github.com/webability-go/xdommask"

	"github.com/webability-go/xamboo/server/assets"

	"github.com/webability-go/xamboo/master/app/bridge"
)

func Run(ctx *assets.Context, template *xcore.XTemplate, language *xcore.XLanguage, e interface{}) interface{} {

	ok := bridge.Setup(ctx, bridge.NOTINSTALLED)
	if !ok {
		return ""
	}

	// PAGE depends on COUNTRY variable (if already selected) or not
	L := ctx.Request.Form.Get("LANGUAGE")
	C := ctx.Request.Form.Get("COUNTRY")
	// verify validity of L,C
	// TODO(phil)

	mask := getMask(L, C).Compile()
	xmlmask, _ := xml.Marshal(mask)
	params := &xcore.XDataset{
		"FORM": string(xmlmask),
		"#":    language,
	}
	return template.Execute(params)
}

func getMask(lang string, country string) *xdommask.Mask {

	mask := xdommask.NewMask("formaccount")
	mask.Mode = xdommask.INSERT
	mask.AuthModes = xdommask.INSERT | xdommask.VIEW
	mask.Variables["COUNTRY"] = country
	mask.Variables["LANGUAGE"] = lang

	mask.AlertMessage = "##mask.errormessage##"
	mask.ServerMessage = "##mask.servermessage##"
	mask.InsertTitle = "##mask.titleinsert##"
	mask.ViewTitle = "##mask.titleview##"

	mask.SuccessJS = `
function(params)
{
WA.$N('titleform').hide();
WA.$N('titleconfirmation').show();
WA.$N('continue').show();
WA.toDOM('install|single|step1').className = 'installstepdone';
WA.toDOM('install|single|step1').onclick = null;
WA.toDOM('install|single|step2').className = 'installstepdone';
WA.toDOM('install|single|step3').className = 'installstepactual';
}
`
	// serial
	f1 := xdommask.NewTextField("serial")
	f1.Title = "##serial.title##"
	f1.HelpDescription = "##serial.help.description##"
	f1.NotNullModes = xdommask.INSERT
	f1.AuthModes = xdommask.INSERT | xdommask.VIEW
	f1.HelpModes = xdommask.INSERT
	f1.ViewModes = xdommask.VIEW
	f1.StatusNotNull = "##serial.status.notnull##"
	f1.Size = "200"
	f1.MinLength = 20
	f1.MaxLength = 20
	f1.URLVariable = "serial"
	f1.Format = "^[a-z|A-Z|0-9]{20}$"
	f1.FormatJS = "^[a-z|A-Z|0-9]{20}$"
	f1.StatusBadFormat = "##serial.status.badformat##"
	f1.DefaultValue = "00000000000000000000"
	mask.AddField(f1)

	// username
	f4 := xdommask.NewTextField("username")
	f4.Title = "##username.title##"
	f4.HelpDescription = "##username.help.description##"
	f4.NotNullModes = xdommask.INSERT
	f4.AuthModes = xdommask.INSERT | xdommask.VIEW
	f4.HelpModes = xdommask.INSERT
	f4.ViewModes = xdommask.VIEW
	f4.StatusNotNull = "##username.status.notnull##"
	f4.MinLength = 4
	f4.MaxLength = 80
	f4.StatusTooShort = "##username.status.tooshort##"
	f4.URLVariable = "username"
	f4.DefaultValue = ""
	mask.AddField(f4)

	// password
	f5 := xdommask.NewPWField("password")
	f5.Title = "##password.title##"
	f5.HelpDescription = "##password.help.description##"
	f5.NotNullModes = xdommask.INSERT
	f5.AuthModes = xdommask.INSERT | xdommask.VIEW
	f5.HelpModes = xdommask.INSERT
	f5.ViewModes = xdommask.VIEW
	f5.StatusNotNull = "##password.status.notnull##"
	f5.MaxLength = 80
	f5.MinLength = 4
	f5.StatusTooShort = "##password.status.tooshort##"
	f5.URLVariable = "password"
	f5.DefaultValue = ""
	mask.AddField(f5)

	// email
	f6 := xdommask.NewMailField("email")
	f6.Title = "##email.title##"
	f6.HelpDescription = "##email.help.description##"
	f6.NotNullModes = xdommask.INSERT
	f6.AuthModes = xdommask.INSERT | xdommask.VIEW
	f6.HelpModes = xdommask.INSERT
	f6.ViewModes = xdommask.VIEW
	f6.StatusNotNull = "##email.status.notnull##"
	f6.MaxLength = 200 // chars
	f6.URLVariable = "email"
	f6.DefaultValue = ""
	mask.AddField(f6)

	f7 := xdommask.NewButtonField("", "submit")
	//	f7.Action = "submit"
	f7.AuthModes = xdommask.INSERT // insert
	f7.TitleInsert = "##form.continue##"
	mask.AddField(f7)

	f8 := xdommask.NewButtonField("", "reset")
	//	f8.Action = "reset"
	f8.AuthModes = xdommask.INSERT // insert + view
	f8.TitleInsert = "##form.reset##"
	mask.AddField(f8)

	return mask
}

func Formaccount(ctx *assets.Context, template *xcore.XTemplate, language *xcore.XLanguage, e interface{}) interface{} {

	ok := bridge.Setup(ctx, bridge.NOTINSTALLED)
	if !ok {
		return ""
	}

	L := ctx.Request.Form.Get("LANGUAGE")
	C := ctx.Request.Form.Get("COUNTRY")
	serial := ctx.Request.Form.Get("serial")
	username := ctx.Request.Form.Get("username")
	password := ctx.Request.Form.Get("password")
	email := ctx.Request.Form.Get("email")

	// check params ok
	success := true
	messages := map[string]string{}
	messagetext := ""
	if username == "" {
		success = false
		messages["username"] = language.Get("error.username.missing")
		messagetext += language.Get("error.username.missing")
	}
	if password == "" {
		success = false
		messages["password"] = language.Get("error.password.missing")
		messagetext += language.Get("error.password.missing")
	}
	if username != "" && username == password {
		success = false
		messages["password"] = language.Get("error.password.same")
		messagetext += language.Get("error.password.same")
	}

	if success {
		// write config file
		// simulate load of config file into Engine.Host.Config till next system restart
		generateConfig(ctx, L, C, serial, username, password, email)
		messages["text"] = language.Get("success")
	} else {

		messages["text"] = messagetext
	}

	return map[string]interface{}{
		"success": success, "messages": messages, "popup": false,
	}
}

func generateConfig(ctx *assets.Context, L string, C string, serial string, username string, password string, email string) {

	md5password := bridge.GetMD5Hash(password)

	local := "username=" + username + "\n"
	local += "password=" + md5password + "\n"
	local += "email=" + email + "\n"
	local += "language=" + L + "\n"
	local += "country=" + C + "\n"
	local += "serial=" + serial + "\n"
	local += "installed=yes\n"

	// write local
	resourcesdir, _ := ctx.Sysparams.GetString("resourcesdir")
	path := resourcesdir + "/local.conf"
	ioutil.WriteFile(path, []byte(local), 0644)

	// inject into Host.config
	ctx.Sysparams.LoadString(local)
}
