package engines

import (
	"github.com/webability-go/xconfig"
	"github.com/webability-go/xcore/v2"

	"github.com/webability-go/xamboo/utils"
)

var PageCache = xcore.NewXCache("page", 0, 0)

func init() {
	PageCache.Validator = utils.FileValidator
}

type Page struct {
	PagesDir             string
	AcceptPathParameters bool
}

func (p *Page) GetData(P string) *xconfig.XConfig {

	// build File Path:
	// separate last part
	lastpath := utils.LastPath(P)
	filepath := p.PagesDir + P + "/" + lastpath + ".page"

	cdata, _ := PageCache.Get(filepath)
	if cdata != nil {
		return cdata.(*xconfig.XConfig)
	}

	// verify against souce CHANGES

	if utils.FileExists(filepath) {
		// load the page instance
		data := xconfig.New()
		data.LoadFile(filepath)

		if _, ok := data.Get("AcceptPathParameters"); !ok {
			data.Set("AcceptPathParameters", p.AcceptPathParameters)
		}

		PageCache.Set(filepath, data)
		return data
	}

	return nil
}
