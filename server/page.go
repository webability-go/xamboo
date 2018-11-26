package server

import (
//  "fmt"
  "github.com/webability-go/xconfig"
  "github.com/webability-go/xamboo/utils"
)

var PageCache = NewCache()

type Page struct {
  PagesDir string
  AcceptPathParameters bool
}

func (p *Page) GetData(P string) *xconfig.XConfig {

  // build File Path:
  // separate last part
  lastpath := utils.LastPath(P)
  filepath := p.PagesDir + P + "/" + lastpath + ".page"
  
  cdata := PageCache.Get(filepath)
  if cdata != nil {
    return cdata.(*xconfig.XConfig)
  }

  // verify against souce CHANGES
  
  
  if utils.FileExists(filepath) {
    // load the page instance
    data := xconfig.New()
    data.LoadFile(filepath)
    
    if data.Get("AcceptPathParameters") == nil {
      data.Set("AcceptPathParameters", p.AcceptPathParameters)
    }
    
    PageCache.Set(filepath, data)
    return data
  }
  
  return nil
}
