package main

import (
  "github.com/webability-go/xcore"
  "github.com/webability-go/xamboo/enginecontext"
)

/* This function is MANDATORY and is the point of call from the xamboo 
   The enginecontext contains all what you need to link with the system
*/
func Run(ctx *enginecontext.Context, template *xcore.XTemplate, language *xcore.XLanguage, e interface{}) string {
  return "NEW V7 WITH SOME CHANGES"
}

