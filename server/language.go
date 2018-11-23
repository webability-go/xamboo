package server

import (
//  "fmt"
//  "github.com/webability-go/xconfig"
  "github.com/webability-go/xamboo/utils"
//  "github.com/webability-go/xamboo/config"
)

type Language struct {
  PagesDir string
}

type LanguageStream struct {
  FilePath string
}

func (p *Language) GetData(P string, i Identity) *LanguageStream {
  // build File Path:
  filepath := p.PagesDir + P + "/" + P + i.Stringify() + ".language"
  if utils.FileExists(filepath) {
    // load the page instance
    data := &LanguageStream{
      FilePath: filepath,
    }
    return data
  }
  
  return nil
}

func (p *LanguageStream) Run() string {  // e *core.Engine
  
  return "ESTAS EJECUTANDO LANGUAGE DE LA PAGINA: " + p.FilePath
  
}
