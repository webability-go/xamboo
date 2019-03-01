package logger

import (
  "fmt"
//  "flag"
  "os"
  "io"
  "io/ioutil"
  "log"
  "strings"
//  "plugin"
//  "encoding/json"

//  "github.com/webability-go/xconfig"
//  "github.com/webability-go/xamboo/utils"

  "github.com/webability-go/xamboo/config"
)

type Logger struct {
  TypeOfLogger   string
  File           string
  Logger         *log.Logger
}

var Loggers map[string]*Logger

func Start() {

  Loggers = make(map[string]*Logger)

  // scan config

  // 1. main loggers
  id := "X[sys]"
  Loggers[id] = Create(id, config.Config.Log.Sys)
  id = "X[errors]"
  Loggers[id] = Create(id, config.Config.Log.Errors)
  
  // 2. listeners have loggers
  for _, l := range config.Config.Listeners {
    id = "L["+l.Name+"][sys]"
    Loggers[id] = Create(id, l.Log.Sys)
  }
  
  // 3. hosts
  for _, h := range config.Config.Hosts {
    id = "H["+h.Name+"][pages]"
    Loggers[id] = Create(id, h.Log.Pages)
    id = "H["+h.Name+"][errors]"
    Loggers[id] = Create(id, h.Log.Errors)
    id = "H["+h.Name+"][sys]"
    Loggers[id] = Create(id, h.Log.Sys)
    id = "H["+h.Name+"][stats]"
    Loggers[id] = Create(id, h.Log.Stats)
  }
}

// Then main xamboo runner
func Create(id string, typeoflogger string) *Logger {

  var writer io.Writer
  protocol := typeoflogger
  file := ""
  var err error
  // scan typeoflogger
  switch typeoflogger {
    case "stdout:":
      writer = os.Stdout
    case "stderr:":
      writer = os.Stderr
    case "discard":
      writer = ioutil.Discard
    default:
      protocol = typeoflogger[:strings.Index(typeoflogger, ":")]
      if protocol == "file" {
        file = typeoflogger[strings.Index(typeoflogger, ":")+1:]
        
        fmt.Println("New log file: ", id, file)
        
        writer, err = os.OpenFile(file, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
        if err != nil {
          log.Fatalln("Failed to open log file:", err)
        }
      } else if protocol == "call" {
        // only stat on Host can use this one. Any other will be ignored
        writer = ioutil.Discard
        file = typeoflogger[strings.Index(typeoflogger, ":")+1:]
        
      } else {
        log.Fatalln("Log protocol not known:", protocol)
      }
  }
  
  nlogger := log.New(writer, id + ": ", log.LstdFlags)
  l := &Logger{TypeOfLogger: protocol, File: file, Logger: nlogger}
  nlogger.Println("Logger starting...")
  return l
}

func GetListenerLogger(id string) *log.Logger {
  return Loggers["L["+id+"][sys]"].Logger
}

func GetHostLogger(id string, cat string) *Logger {
  return Loggers["H["+id+"]["+cat+"]"]
}

