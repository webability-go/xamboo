package servers

import (
	//  "fmt"
	"time"

	"github.com/webability-go/xcore"

	"github.com/webability-go/xamboo/utils"
)

var TemplateCache = xcore.NewXCache("template", 0, 3600*time.Second)

type TemplateServer struct {
	PagesDir string
}

func (s *TemplateServer) GetData(P string, i Identity) *xcore.XTemplate {
	// build File Path:
	lastpath := utils.LastPath(P)
	filepath := s.PagesDir + P + "/" + lastpath + i.Stringify() + ".template"

	cdata, _ := TemplateCache.Get(filepath)
	if cdata != nil {
		return cdata.(*xcore.XTemplate)
	}

	// verify against souce CHANGES

	if utils.FileExists(filepath) {
		// load the page instance
		data := xcore.NewXTemplate()
		data.LoadFile(filepath)

		TemplateCache.Set(filepath, data)
		return data
	}

	return nil
}
