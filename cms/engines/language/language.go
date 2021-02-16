package language

import (
	"errors"
	"net/http"
	"time"

	"github.com/webability-go/xcore/v2"

	"github.com/webability-go/xamboo/cms/context"
	"github.com/webability-go/xamboo/cms/engines/assets"
	"github.com/webability-go/xamboo/cms/identity"
	"github.com/webability-go/xamboo/utils"
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

func (re *LanguageEngine) GetInstance(Hostname string, PagesDir string, P string, i identity.Identity) assets.EngineInstance {

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

func (se *LanguageEngine) Run(ctx *context.Context, s interface{}) interface{} {
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
func (p *LanguageEngineInstance) Run(ctx *context.Context, template *xcore.XTemplate, language *xcore.XLanguage, e interface{}) interface{} {

	cdata, _ := LanguageCache.Get(p.FilePath)
	if cdata != nil {
		return cdata.(*xcore.XLanguage)
	}

	if utils.FileExists(p.FilePath) {
		// load the language data
		data, err := xcore.NewXLanguageFromXMLFile(p.FilePath)
		if err != nil {
			errortext := "Error loading language: " + p.FilePath + " " + err.Error()
			ctx.Code = http.StatusInternalServerError
			ctx.LoggerError.Println(errortext)
			return errors.New(errortext)
		}
		LanguageCache.Set(p.FilePath, data)
		return data
	}
	return nil
}
