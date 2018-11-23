package server

import (
//  "fmt"
  "github.com/webability-go/xconfig"
  "github.com/webability-go/xamboo/utils"
)

type Instance struct {
  PagesDir string
}

func (p *Instance) GetData(P string, i Identity) *xconfig.XConfig {
  // build File Path:
  filepath := p.PagesDir + P + "/" + P + i.Stringify() + ".instance"
  if utils.FileExists(filepath) {
    // load the page instance
    data := xconfig.New()
    data.LoadFile(filepath)
    
    return data
  }
  
  return nil
}
