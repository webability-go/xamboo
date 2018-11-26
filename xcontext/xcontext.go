package xcontext

import (
  "github.com/webability-go/xconfig"
)

type Context struct {
  Sysparams *xconfig.XConfig
  Clientparams *xconfig.XConfig
  Pageparams *xconfig.XConfig
  Instanceparams *xconfig.XConfig
  LocalPageparams *xconfig.XConfig
  LocalInstanceparams *xconfig.XConfig
  Entryparams *xconfig.XConfig
  
  
}

