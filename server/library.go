package server

import (
  "fmt"
  "plugin"
//  "github.com/webability-go/xconfig"
  "github.com/webability-go/xcore"
  "github.com/webability-go/xamboo/utils"
  "github.com/webability-go/xamboo/enginecontext"
)

var LibraryCache = NewCache()

type LibraryServer struct {
  PagesDir string
}

type LibraryStream struct {
  FilePath string
  FilePlugin string
}

func (p *LibraryServer) GetData(P string) *LibraryStream {
  // build File Path:
  lastpath := utils.LastPath(P)
  filepath := p.PagesDir + P + "/" + lastpath + ".go"
  fileplugin := p.PagesDir + P + "/" + lastpath + ".so"

  if utils.FileExists(filepath) {
    data := &LibraryStream{
      FilePath: filepath,
      FilePlugin: fileplugin,
    }
    return data
  }
  
  return nil
}

func (p *LibraryStream) Run(ctx *enginecontext.Context, template *xcore.XTemplate, language *xcore.XLanguage, e interface{}) string {  // e *core.Engine
  
  // If the plugin is not loaded, load it (equivalent of cache for other types of server)
  
  // verify if the code is loaded in memory
  
  // verify if the code is compiled. 
  // IF THERE IS A NEW VERSION; CALL THE COMPILER THREAD (ONLY ONE) THAT WILL COMPILE THE CODE AND UPDATE THE CACHE MAP TO THE NEW VERSION.
  // BE CAREFULL OF MEMORY OVERLOAD FOR NEW VERSION HOT LOADED (hotload = any flag in config ? authorized/not authorized, # authorized, send alerts, monitor etc)
  
  // Check HOT reload
  
  
  fmt.Println(p.FilePlugin)
  lib, err := plugin.Open(p.FilePlugin)
  if err != nil {
    fmt.Println(err)
    return "ERROR: LIBRARY PAGE/BLOCK NOT LOADED"
  }
  fct, err := lib.Lookup("Run")
  
  fmt.Println("Calling library: " + p.FilePlugin)
  
  x1 := fct.(func(*enginecontext.Context, *xcore.XTemplate, *xcore.XLanguage, interface{}) string)(ctx, template, language, e)
  
  fmt.Println("End of call library: " + p.FilePlugin)
  fmt.Println("Returned data: " + x1)
  
  
  
  // loads the HOT LOAD
/*  
  fmt.Println(p.FilePlugin + ".2")
  lib, err = plugin.Open(p.FilePlugin + ".2")
  if err != nil {
    fmt.Println(err)
    return "ERROR: LIBRARY PAGE/BLOCK NOT LOADED V2"
  }
  fct, err = lib.Lookup("Run")
  
  x2 := fct.(func(*enginecontext.Context, *xcore.XTemplate, *xcore.XLanguage, interface{}) string)(ctx, template, language, e)
  */
  return x1
}
