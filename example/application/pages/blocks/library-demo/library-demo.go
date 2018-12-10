package main

import (
//  "fmt"
  "github.com/webability-go/xcore"
  "github.com/webability-go/xamboo/engine/context"
  
  "github.com/webability-go/xamboo/example/app/bridge"
)

/* This function is MANDATORY and is the point of call from the xamboo 
   The enginecontext contains all what you need to link with the system
*/
func Run(ctx *context.Context, template *xcore.XTemplate, language *xcore.XLanguage, e interface{}) string {

  // Let's call out external app library (you should create a wrapper to your app so it's much easier to access funcions instead or writing all this code here)
  myappdata, ok := ctx.Plugins["app"];
  if !ok {
    return "ERROR: THE APPLICATION LIBRARY IS NOT AVAILABLE"
  }

  bridge.Start(myappdata)
  strdata := bridge.GetPageData(ctx, template, language, e)

  // Let's inject some vars into the template
  data := make(map[string]string)
  data["data1"] = "Data 1 for the template"
  data["dataapp"] = strdata
  
  return template.Execute(data)
}

