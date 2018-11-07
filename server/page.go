package server

import (
  "fmt"
  "github.com/webability-go/xconfig"
  "github.com/webability-go/xamboo/utils"
)

type Page struct {
  PagesDir string
  AcceptPathParameters bool
}

func (p *Page) GetInstance(P string) xconfig.XConfig {
  fmt.Println("Into server.Page " + P)
  
  // build File Path:
  filepath := p.PagesDir + P + "/" + P + ".page"
  fmt.Println("File to scan: " + filepath)
  if utils.FileExists(filepath) {
    // load the page instance
    data, _ := xconfig.Load(filepath)
    
    if data.Get("AcceptPathParameters") == nil {
      data.Set("AcceptPathParameters", p.AcceptPathParameters)
    }
    
    return *data
  }
  
  return nil
}
