package server

import (
//  "fmt"
//  "github.com/webability-go/xconfig"
  "github.com/webability-go/xamboo/utils"
//  "github.com/webability-go/xamboo/config"
)

type Code struct {
  PagesDir string
}

type CodeStream struct {
  FilePath string
}

func (p *Code) GetData(P string, i Identity) *CodeStream {
  // build File Path:
  filepath := p.PagesDir + P + "/" + P + i.Stringify() + ".code"
  if utils.FileExists(filepath) {
    // load the page instance
    data := &CodeStream{
      FilePath: filepath,
    }
    return data
  }
  
  return nil
}

func (p *CodeStream) Run() string { // e *core.Engine
  // check precompilers. load compiled or load source
    // open the file, 
    // load the file
  // run the macrolanguage
  
  
  
  return "ESTAS EJECUTANDO EL CODIGO DE LA PAGINA: " + p.FilePath
  
}
