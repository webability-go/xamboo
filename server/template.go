package server

import (
//  "fmt"
//  "github.com/webability-go/xconfig"
  "github.com/webability-go/xamboo/utils"
//  "github.com/webability-go/xamboo/config"
)

type Template struct {
  PagesDir string
}

type TemplateStream struct {
  FilePath string
}

func (p *Template) GetData(P string, i Identity) *TemplateStream {
  // build File Path:
  filepath := p.PagesDir + P + "/" + P + i.Stringify() + ".template"
  if utils.FileExists(filepath) {
    // load the page instance
    data := &TemplateStream{
      FilePath: filepath,
    }
    return data
  }
  
  return nil
}

func (p *TemplateStream) Run() string {  // e *core.Engine
  
  return "ESTAS EJECUTANDO TEMPLATE DE LA PAGINA: " + p.FilePath
  
}
