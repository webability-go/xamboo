package logger

import (
	"io"
	"io/ioutil"
	"log"
	"os"
	"strings"
	//  "plugin"
	//  "encoding/json"

	//  "github.com/webability-go/xconfig"
	//  "github.com/webability-go/xamboo/utils"

	"github.com/webability-go/xamboo/config"
)

type Logger struct {
	TypeOfLogger string
	File         string
	Logger       *log.Logger
}

var Loggers map[string]*Logger

func Start() {

	Loggers = make(map[string]*Logger)

	// scan config

	// 1. main loggers
	id := "X[sys]"
	Loggers[id] = Create(id, config.Config.Log.Sys, nil)
	id = "X[errors]"
	Loggers[id] = Create(id, config.Config.Log.Errors, Loggers["X[sys]"].Logger)

	// 2. listeners have loggers
	for _, l := range config.Config.Listeners {
		id = "L[" + l.Name + "][sys]"
		Loggers[id] = Create(id, l.Log.Sys, Loggers["X[sys]"].Logger)
	}

	// 3. hosts
	for _, h := range config.Config.Hosts {
		id = "H[" + h.Name + "][pages]"
		Loggers[id] = Create(id, h.Log.Pages, Loggers["X[sys]"].Logger)
		id = "H[" + h.Name + "][errors]"
		Loggers[id] = Create(id, h.Log.Errors, Loggers["X[sys]"].Logger)
		id = "H[" + h.Name + "][sys]"
		Loggers[id] = Create(id, h.Log.Sys, Loggers["X[sys]"].Logger)
		id = "H[" + h.Name + "][stats]"
		Loggers[id] = Create(id, h.Log.Stats, Loggers["X[sys]"].Logger)
	}
}

// Then main xamboo runner
func Create(id string, typeoflogger string, explain *log.Logger) *Logger {

	var writer io.Writer
	protocol := typeoflogger
	file := ""
	textexplain := "Link Log " + id + " to "
	var err error
	// scan typeoflogger
	switch typeoflogger {
	case "stdout:":
		writer = os.Stdout
		textexplain += "stdout:"
	case "stderr:":
		writer = os.Stderr
		textexplain += "stderr:"
	case "discard":
		writer = ioutil.Discard
		textexplain += "discard:"
	default:
		protocol = typeoflogger[:strings.Index(typeoflogger, ":")]
		if protocol == "file" {
			file = typeoflogger[strings.Index(typeoflogger, ":")+1:]

			textexplain += "file: " + file

			writer, err = os.OpenFile(file, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
			if err != nil {
				log.Fatalln("Failed to open log file:", id, file, err)
			}
		} else if protocol == "call" {
			// only stat on Host can use this one. Any other will be ignored
			writer = ioutil.Discard
			file = typeoflogger[strings.Index(typeoflogger, ":")+1:]

			textexplain += "call: " + file

		} else {
			log.Fatalln("Log protocol not known:", protocol)
		}
	}

	if explain != nil {
		explain.Println(textexplain)
	}

	nlogger := log.New(writer, id+": ", log.LstdFlags)
	l := &Logger{TypeOfLogger: protocol, File: file, Logger: nlogger}
	nlogger.Println("Logger starting...")
	return l
}

func GetCoreLogger(cat string) *log.Logger {
	return Loggers["X["+cat+"]"].Logger
}

func GetListenerLogger(id string, cat string) *log.Logger {
	return Loggers["L["+id+"]["+cat+"]"].Logger
}

func GetHostLogger(id string, cat string) *log.Logger {
	return Loggers["H["+id+"]["+cat+"]"].Logger
}
