package server

import (
//  "fmt"
  "time"
  "github.com/webability-go/xcore"
  "github.com/webability-go/xamboo/utils"
)

var LanguageCache = NewCache("language", 0, true, 3600 * time.Second)

type LanguageServer struct {
  PagesDir string
}

func (s *LanguageServer) GetData(P string, i Identity) *xcore.XLanguage {
  // build File Path:
  lastpath := utils.LastPath(P)
  filepath := s.PagesDir + P + "/" + lastpath + i.Stringify() + ".language"

  cdata, _ := LanguageCache.Get(filepath)
  if cdata != nil {
    return cdata.(*xcore.XLanguage)
  }

  // verify against souce CHANGES
  
  if utils.FileExists(filepath) {
    // load the page instance
    data := xcore.NewLanguage()
    data.LoadFile(filepath)

    LanguageCache.Set(filepath, data)
    return data
  }
  
  return nil
}

