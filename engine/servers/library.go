package servers

import (
  "fmt"
  "plugin"
//  "time"

  "github.com/webability-go/xcore"

  "github.com/webability-go/xamboo/utils"
  "github.com/webability-go/xamboo/compiler"
  "github.com/webability-go/xamboo/engine/context"
)

// no limits, no timeout (it's part of the code itself)
var LibraryCache = xcore.NewXCache("library", 0, 0)  

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

func (p *LibraryStream) Run(ctx *context.Context, template *xcore.XTemplate, language *xcore.XLanguage, e interface{}) string {  // e *core.Engine
  
  // verify if the code is compiled. 
  // IF THERE IS A NEW VERSION; CALL THE COMPILER THREAD (ONLY ONE) THAT WILL COMPILE THE CODE AND UPDATE THE CACHE MAP TO THE NEW VERSION.
  // BE CAREFULL OF MEMORY OVERLOAD FOR NEW VERSION HOT LOADED (hotload = any flag in config ? authorized/not authorized, # authorized, send alerts, monitor etc)
  var lib *plugin.Plugin
  var err error

  // If the plugin is not loaded, load it (equivalent of cache for other types of server)
  // verify if the code is loaded in memory
  cdata, invalid := LibraryCache.Get(p.FilePath)
  if cdata != nil {
    lib = cdata.(*plugin.Plugin)
  } else {
    // Check if HOT reload authorized
    if !invalid {
      fmt.Println(p.FilePlugin)
      lib, err = plugin.Open(p.FilePlugin)
      if err != nil {
        fmt.Println(err)
        invalid = true
      }
    }

    if invalid {
      // get back version number && error
      version, err := compiler.PleaseCompile(p.FilePath, p.FilePlugin, 0)
      if (err != nil) {
        fmt.Println(err)
        return "ERROR: LIBRARY PAGE/BLOCK COULD NOT COMPILE"
      }
    
      // try to reload new library (hot load)
      // works or fail
      if version > 0 {
        p.FilePlugin = p.FilePlugin + fmt.Sprintf(".%d", version)
      }
      
      fmt.Println(version, p.FilePlugin)
      
      lib, err = plugin.Open(p.FilePlugin)
      if err != nil {
        fmt.Println(err)
        return "ERROR: LIBRARY PAGE/BLOCK COULD NOT LOAD"
      }
    }
    LibraryCache.Set(p.FilePath, lib)
  }
  
  fct, err := lib.Lookup("Run")
  if err != nil {
    fmt.Println(err)
    return "ERROR: LIBRARY DOES NOT CONTAIN RUN FUNCTION"
  }
  
//  fmt.Println(fct)
//  fmt.Println("Calling library: " + p.FilePlugin)
  
  x1 := fct.(func(*context.Context, *xcore.XTemplate, *xcore.XLanguage, interface{}) string)(ctx, template, language, e)
  
//  fmt.Println("End of call library: " + p.FilePlugin)
//  fmt.Println("Returned data: " + x1)
  
  
  
  // loads the HOT LOAD
/*  
  fmt.Println(p.FilePlugin + ".2")
  lib, err = plugin.Open(p.FilePlugin + ".2")
  if err != nil {
    fmt.Println(err)
    return "ERROR: LIBRARY PAGE/BLOCK NOT LOADED V2"
  }
  fct, err = lib.Lookup("Run")
  
  x2 := fct.(func(*context.Context, *xcore.XTemplate, *xcore.XLanguage, interface{}) string)(ctx, template, language, e)
  */
  return x1
}
