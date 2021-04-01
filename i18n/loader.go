package i18n

import (
	// local filesystem
	"embed"

	"golang.org/x/text/language"

	"github.com/webability-go/xcore/v2"
)

//go:embed *.language
var repo embed.FS

var Language *xcore.XLanguage

// pre load English by default
func init() {
	data, _ := repo.ReadFile("system.en.language")
	Language, _ = xcore.NewXLanguageFromXMLString(string(data))
}

func Load(lang language.Tag) {
	data, err := repo.ReadFile("system." + lang.String() + ".language")
	// if nofile exists, do not change
	if err == nil {
		Language, _ = xcore.NewXLanguageFromXMLString(string(data))
	}
}

func Get(id string) string {
	return Language.Get(id)
}
