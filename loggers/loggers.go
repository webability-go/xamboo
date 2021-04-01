package loggers

import (
	"io"
	"io/ioutil"
	"log"
	"os"
	"strings"

	"github.com/webability-go/xamboo/config"
	"github.com/webability-go/xamboo/i18n"
)

const (
	PROTOCOL_STDOUT  = "stdout:"
	PROTOCOL_STDERR  = "stderr:"
	PROTOCOL_DISCARD = "discard"
	PROTOCOL_FILE    = "file"
	PROTOCOL_CALL    = "call"
)

type Logger struct {
	TypeOfLogger string
	File         string
	Logger       *log.Logger
	Hook         interface{}
}

var Loggers = map[string]*Logger{}

func StartSystem() {

	// 1. main loggers
	id := "X[sys]"
	Loggers[id] = Create(id, config.Config.Log.Sys, nil, nil)
	id = "X[errors]"
	Loggers[id] = Create(id, config.Config.Log.Errors, Loggers["X[sys]"].Logger, nil)
}

func Start() {

	// scan config
	id := ""

	// 2. listeners have loggers
	for _, l := range config.Config.Listeners {
		id = "L[" + l.Name + "][sys]"
		Loggers[id] = Create(id, l.Log.Sys, Loggers["X[sys]"].Logger, nil)
	}

	// 3. hosts
	for _, h := range config.Config.Hosts {
		id = "H[" + h.Name + "][pages]"
		Loggers[id] = Create(id, h.Log.Pages, Loggers["X[sys]"].Logger, &h)
		id = "H[" + h.Name + "][errors]"
		Loggers[id] = Create(id, h.Log.Errors, Loggers["X[sys]"].Logger, &h)
		id = "H[" + h.Name + "][sys]"
		Loggers[id] = Create(id, h.Log.Sys, Loggers["X[sys]"].Logger, &h)
		id = "H[" + h.Name + "][stats]"
		Loggers[id] = Create(id, h.Log.Stats, Loggers["X[sys]"].Logger, &h)
	}
}

// Then main xamboo runner
func Create(id string, typeoflogger string, explain *log.Logger, host *config.Host) *Logger {

	var writer io.Writer
	protocol := typeoflogger
	file := ""
	var err error
	// scan typeoflogger
	switch typeoflogger {
	case PROTOCOL_STDOUT:
		writer = os.Stdout
	case PROTOCOL_STDERR:
		writer = os.Stderr
	case PROTOCOL_DISCARD:
		writer = ioutil.Discard
	default:
		N := strings.Index(typeoflogger, ":")
		if N < 0 {
			log.Fatalf(i18n.Get("logger.protocolerror"), typeoflogger)
		}
		protocol = typeoflogger[:N]
		if protocol == PROTOCOL_FILE {
			file = typeoflogger[strings.Index(typeoflogger, ":")+1:]
			writer, err = os.OpenFile(file, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
			if err != nil {
				log.Fatalf(i18n.Get("logger.fileerror"), id, file, err)
			}
		} else if protocol == PROTOCOL_CALL {
			// only stat on Host can use this one. Any other will be ignored
			// Will be linked by the config and applications at start
			if host != nil {
				xlogger := strings.Split(typeoflogger, ":")
				if len(xlogger) == 3 {
					if err != nil {
						log.Fatalf(i18n.Get("logger.statcallnotfound"), xlogger[1], xlogger[2], err)
					} else {
						l := &Logger{TypeOfLogger: protocol, File: xlogger[1] + "." + xlogger[2], Hook: nil}
						return l
					}
				} else {
					log.Fatalf(i18n.Get("logger.statcalllinkerror"), typeoflogger)
				}
			}
		} else {
			log.Fatalf(i18n.Get("logger.protocolerror"), protocol)
		}
	}

	if explain != nil {
		explain.Printf(i18n.Get("logger.explain"), id, typeoflogger)
	}

	nlogger := log.New(writer, id+": ", log.LstdFlags)
	l := &Logger{TypeOfLogger: protocol, File: file, Logger: nlogger}
	nlogger.Printf(i18n.Get("logger.start"))
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

func GetHostHook(id string, cat string) interface{} {
	return Loggers["H["+id+"]["+cat+"]"].Hook
}

func SetHostHook(id string, cat string, h interface{}) {
	if Loggers["H["+id+"]["+cat+"]"] != nil {
		Loggers["H["+id+"]["+cat+"]"].Hook = h
	}
}
