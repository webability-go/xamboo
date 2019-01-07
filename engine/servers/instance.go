package servers

import (
//  "fmt"
  "time"

  "github.com/webability-go/xcore"
  "github.com/webability-go/xconfig"

  "github.com/webability-go/xamboo/utils"
)

var InstanceCache = xcore.NewXCache("instance", 0, 3600 * time.Second)

type Instance struct {
  PagesDir string
}

func (p *Instance) GetData(P string, i Identity) *xconfig.XConfig {
  // build File Path:
  lastpath := utils.LastPath(P)
  filepath := p.PagesDir + P + "/" + lastpath + i.Stringify() + ".instance"

  cdata, _ := InstanceCache.Get(filepath)
  if cdata != nil {
    return cdata.(*xconfig.XConfig)
  }

  // verify against souce CHANGES
  
  if utils.FileExists(filepath) {
    // load the page instance
    data := xconfig.New()
    data.LoadFile(filepath)
    
    InstanceCache.Set(filepath, data)
    return data
  }
  
  return nil
}
