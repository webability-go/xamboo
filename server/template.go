package server

import (
//  "fmt"
  "github.com/webability-go/xcore"
  "github.com/webability-go/xamboo/utils"
)

var TemplateCache = NewCache()

type TemplateServer struct {
  PagesDir string
}

func (s *TemplateServer) GetData(P string, i Identity) *xcore.XTemplate {
  // build File Path:
  lastpath := utils.LastPath(P)
  filepath := s.PagesDir + P + "/" + lastpath + i.Stringify() + ".template"

  cdata := TemplateCache.Get(filepath)
  if cdata != nil {
    return cdata.(*xcore.XTemplate)
  }

  // verify against souce CHANGES
  
  if utils.FileExists(filepath) {
    // load the page instance
    data := xcore.NewTemplate()
    data.LoadFile(filepath)

    TemplateCache.Set(filepath, data)
    return data
  }
  
  return nil
}
