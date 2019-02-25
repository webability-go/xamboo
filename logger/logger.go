package logger

import (
//  "fmt"
//  "flag"
  "log"
//  "plugin"
//  "encoding/json"

//  "github.com/webability-go/xconfig"
//  "github.com/webability-go/xamboo/utils"
)

type Logger struct {
  TypeOfLogger   string
  File           string
  Logger         *log.Logger
}

var Loggers map[string]*Logger

func Run() {

  Loggers = make(map[string]*Logger)

  // scan config
  // create each logger+
  
}

// Then main xamboo runner
func Create(typeoflogger string) *Logger {

  l := &Logger{}

  return l
}

