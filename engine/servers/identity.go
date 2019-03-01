package servers

import (
  "fmt"
  "os"
  "time"
)

type Identity struct {
  Version string
  Language string
}

func (i *Identity)Stringify() string {
  id := ""
  if len(i.Version) > 0 {
    id += "." + i.Version
  }
  if len(i.Language) > 0 {
    id += "." + i.Language
  }
  
  return id
}

func fileValidator(key string, otime time.Time) bool {

  fi, err := os.Stat(key)
  if err != nil {
    // Does not exists anymore, invalid
    return false
  }
  mtime := fi.ModTime()
  if mtime.After(otime) {
    // file is newer, invalid
    return false
  }
  // All ok, valid
  return true
}

func Start() {
  fmt.Println("Start Caches Validators for each engine/servers/*")
  PageCache.SetValidator(fileValidator)
  InstanceCache.SetValidator(fileValidator)
  CodeCache.SetValidator(fileValidator)
  TemplateCache.SetValidator(fileValidator)
  LanguageCache.SetValidator(fileValidator)
  LibraryCache.SetValidator(fileValidator)
}

