package template

import (
	//  "fmt"
	"time"

	"github.com/webability-go/xcore/v2"

	"github.com/webability-go/xamboo/cms/context"
	"github.com/webability-go/xamboo/cms/engines/assets"
	"github.com/webability-go/xamboo/cms/identity"
	"github.com/webability-go/xamboo/utils"
)

var TemplateCache = xcore.NewXCache("template", 0, 3600*time.Second)

func init() {
	TemplateCache.Validator = utils.FileValidator
}

var Engine = &TemplateEngine{}

type TemplateEngine struct{}

func (re *TemplateEngine) NeedInstance() bool {
	// The simple engine does need instance and identity
	return true
}

func (re *TemplateEngine) GetInstance(Hostname string, PagesDir string, P string, i identity.Identity) assets.EngineInstance {

	lastpath := utils.LastPath(P)
	filepath := PagesDir + P + "/" + lastpath + i.Stringify() + ".template"

	if utils.FileExists(filepath) {
		// load the page instance
		data := &TemplateEngineInstance{
			FilePath: filepath,
		}
		return data
	}
	return nil
}

func (se *TemplateEngine) Run(ctx *context.Context, s interface{}) interface{} {
	return nil
}

type TemplateEngineInstance struct {
	FilePath string
}

func (p *TemplateEngineInstance) NeedLanguage() bool {
	return false
}

func (p *TemplateEngineInstance) NeedTemplate() bool {
	return false
}

// context contains all the page context and history
// params are an array of strings (if page from outside) or a mapped array of data (inner pages)
func (p *TemplateEngineInstance) Run(ctx *context.Context, template *xcore.XTemplate, language *xcore.XLanguage, e interface{}) interface{} {

	cdata, _ := TemplateCache.Get(p.FilePath)
	if cdata != nil {
		return cdata.(*xcore.XTemplate)
	}

	if utils.FileExists(p.FilePath) {
		// load the template data
		data := xcore.NewXTemplate()
		data.LoadFile(p.FilePath)

		TemplateCache.Set(p.FilePath, data)
		return data
	}
	return nil
}
