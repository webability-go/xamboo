package main

import (
  "fmt"
  
  "github.com/webability-go/xcore"
  "github.com/webability-go/xamboo/engine/context"
)

func Start() {
  fmt.Println("External APP Main SO library started")

  // Load CONFIG

  // Start a database POOL

}

func GetPageData(ctx *context.Context, template *xcore.XTemplate, language *xcore.XLanguage, e interface{}) string {
  fmt.Println("Distributes a page data called by a page library from app.go")

  return "This is the code of the external application after build all what you need into it. This is a shared library compiled as a plugin."
}

