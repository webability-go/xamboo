package enginecontext

import (
  "github.com/webability-go/xconfig"
)

type EngineWrapper func(interface{}, string, bool, *interface{}, string, string, string) string

type Context struct {
  MainPage string                          // The original page called from outside
  LocalPage string                         // The official called local page (full URI)
  RealLocalPage string                     // The real local page we are building (existing .page valid page)
  Sysparams *xconfig.XConfig               // mandatory, site system params
  MainPageparams *xconfig.XConfig              // Original page params
  MainInstanceparams *xconfig.XConfig
  LocalPageparams *xconfig.XConfig
  LocalInstanceparams *xconfig.XConfig
  Entryparams *interface{}
  LocalEntryparams *interface{}
  Engine EngineWrapper
}

