package server

import (
//  "fmt"
  "github.com/webability-go/xconfig"
  "github.com/webability-go/xamboo/utils"
)

type Page struct {
  PagesDir string
  AcceptPathParameters bool
}

func (p *Page) GetData(P string) *xconfig.XConfig {
  // build File Path:
  filepath := p.PagesDir + P + "/" + P + ".page"
  if utils.FileExists(filepath) {
    // load the page instance
    data := xconfig.New()
    data.LoadFile(filepath)
    
    if data.Get("AcceptPathParameters") == nil {
      data.Set("AcceptPathParameters", p.AcceptPathParameters)
    }
    
    return data
  }
  
  return nil
}
