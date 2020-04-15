package main

import (
	"encoding/xml"

	"github.com/webability-go/wajaf"
	"github.com/webability-go/xconfig"
	"github.com/webability-go/xcore/v2"

	"github.com/webability-go/xamboo/server/assets"
)

func Run(ctx *assets.Context, template *xcore.XTemplate, language *xcore.XLanguage, e interface{}) interface{} {

	// If config already done, CANNOT call this page (error)
	installed, _ := ctx.Sysparams.GetBool("installed")
	if installed {
		return "Error: system already installed"
	}

	c := getConfig(ctx)
	// PAGE depends on COUNTRY variable (if already selected) or not
	// If not selected, call language, or call account

	//	bridge.EntityLog_LogStat(ctx)
	params := &xcore.XDataset{
		"LANGUAGE": ctx.Language,
		"SELECT":   getSelect(c),
		"FLAGS":    getCountries(c),
	}

	return template.Execute(params)
}

func getSelect(cfg *xconfig.XConfig) string {
	text := ""
	langs, _ := cfg.GetStringCollection("language")
	for _, l := range langs {
		idm := cfg.GetConfig(l)
		t, _ := idm.GetString("select")
		text += t + "<br/>"
	}
	return text
}

func getCountries(cfg *xconfig.XConfig) string {

	sc := wajaf.NewSeparatorContainer("")
	sc.SetAttribute("classname", "separatorinvisiblehorizontal")
	sc.SetAttribute("mode", "horizontal")
	sc.SetAttribute("auto", "yes")
	sc.SetAttribute("height", "*")
	sc.SetAttribute("style", "overflow: visible;")

	langs, _ := cfg.GetStringCollection("language")
	for _, l := range langs {
		idm := cfg.GetConfig(l)
		name, _ := idm.GetString("name")

		zone := sc.NewZone("", "")
		zone.SetAttribute("size", "*")
		zone.SetAttribute("style", "overflow: visible;")

		te := wajaf.NewTextElement("", name)
		te.SetAttribute("classname", "languagename")
		zone.AddChild(te)

		countries, _ := idm.GetStringCollection("countries")
		countriesname, _ := idm.GetStringCollection("countriesname")
		if len(countries) != len(countriesname) {
			return "Error: country file corrupted"
		}
		for i, iso := range countries {
			lname := countriesname[i]
			be := wajaf.NewButtonElement("", "submit")
			be.SetAttribute("classname", "flag")
			be.SetAttribute("style", "background-image: url(\"/skins/master/flags/"+iso+".gif\");")
			be.AddEvent("click", "function() { calllanguage(self, \""+l+"\", \""+iso+"\"); }")
			be.AddHelp("##language## "+lname+", ##country## "+iso, "##flag.title##", "##flag.description##")
			zone.AddChild(be)

			nte := wajaf.NewTextElement("", lname)
			nte.SetAttribute("classname", "flagtext")
			nte.AddEvent("onclick", "function() { calllanguage(self, \""+l+"\", \""+iso+"\"); }")
			nte.AddHelp("##language## "+lname+" ##country## "+iso, "##flag.title##", "##flag.description##")
			zone.AddChild(nte)
		}
	}

	text, _ := xml.Marshal(sc)

	return string(text)
}

func getConfig(ctx *assets.Context) *xconfig.XConfig {
	resourcesdir, _ := ctx.Sysparams.GetString("resourcesdir")
	lang := xconfig.New()
	lang.LoadFile(resourcesdir + "/languages/languages.conf")

	langs, _ := lang.GetStringCollection("language")
	for _, l := range langs {
		idm := xconfig.New()
		idm.LoadFile(resourcesdir + "/languages/countries." + l + ".conf")
		lang.Set(l, idm)
	}

	return lang
}
