package language

import (
	"time"

	"github.com/webability-go/xcore"

	"github.com/webability-go/xamboo/server/assets"
	"github.com/webability-go/xamboo/server/utils"
)

var LanguageCache = xcore.NewXCache("language", 0, 3600*time.Second)

func init() {
	LanguageCache.Validator = utils.FileValidator
}

var Engine = &LanguageEngine{}

type LanguageEngine struct{}

func (re *LanguageEngine) NeedInstance() bool {
	// The simple engine does need instance and identity
	return true
}

func (re *LanguageEngine) GetInstance(Hostname string, PagesDir string, P string, i assets.Identity) assets.EngineInstance {

	lastpath := utils.LastPath(P)
	filepath := PagesDir + P + "/" + lastpath + i.Stringify() + ".language"

	if utils.FileExists(filepath) {
		// load the page instance
		data := &LanguageEngineInstance{
			FilePath: filepath,
		}
		return data
	}
	return nil
}

func (se *LanguageEngine) Run(ctx *assets.Context, s interface{}) interface{} {
	return nil
}

type LanguageEngineInstance struct {
	FilePath string
}

func (p *LanguageEngineInstance) NeedLanguage() bool {
	return false
}

func (p *LanguageEngineInstance) NeedTemplate() bool {
	return false
}

// context contains all the page context and history
// params are an array of strings (if page from outside) or a mapped array of data (inner pages)
func (p *LanguageEngineInstance) Run(ctx *assets.Context, template *xcore.XTemplate, language *xcore.XLanguage, e interface{}) interface{} {

	cdata, _ := LanguageCache.Get(p.FilePath)
	if cdata != nil {
		return cdata.(*xcore.XLanguage)
	}

	if utils.FileExists(p.FilePath) {
		// load the language data
		data, err := xcore.NewXLanguageFromXMLFile(p.FilePath)
		if err != nil {
			return nil
		}

		LanguageCache.Set(p.FilePath, data)
		return data
	}
	return nil
}
