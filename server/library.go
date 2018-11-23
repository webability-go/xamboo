package server

import (
//  "fmt"
//  "github.com/webability-go/xconfig"
  "github.com/webability-go/xamboo/utils"
//  "github.com/webability-go/xamboo/config"
)

type Library struct {
  PagesDir string
}

type LibraryStream struct {
  FilePath string
}

func (p *Library) GetData(P string, i Identity) *LibraryStream {
  // build File Path:
  filepath := p.PagesDir + P + "/" + P + i.Stringify() + ".lib"
  if utils.FileExists(filepath) {
    // load the page instance
    data := &LibraryStream{
      FilePath: filepath,
    }
    return data
  }
  
  return nil
}

func (p *LibraryStream) Run() string {  // e *core.Engine
  
  return "ESTAS EJECUTANDO LIBRARY DE LA PAGINA: " + p.FilePath
  
}
