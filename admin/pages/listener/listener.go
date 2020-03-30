package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"runtime"
	"strings"
	"time"

	"github.com/gorilla/websocket"

	"github.com/webability-go/xamboo/server"
	"github.com/webability-go/xamboo/server/assets"
	"github.com/webability-go/xamboo/server/stat"
	"github.com/webability-go/xcore/v2"
)

type listenerStream struct {
	Id          int
	Upgrader    websocket.Upgrader
	Stream      *websocket.Conn
	RequestStat *stat.RequestStat

	fulldata bool
}

var counter = 1

/* This function is MANDATORY and is the point of call from the xamboo
   The enginecontext contains all what you need to link with the system
*/
func Run(ctx *assets.Context, template *xcore.XTemplate, language *xcore.XLanguage, e interface{}) interface{} {

	fmt.Println("Entering listener")
	// Note: the upgrader will hijack the writer, so we are responsible to actualize the stats
	ls := listenerStream{
		Id:          counter,
		Upgrader:    websocket.Upgrader{},
		RequestStat: ctx.Writer.(*server.CoreWriter).RequestStat,
		fulldata:    true,
	}
	counter++

	stream, err := ls.Upgrader.Upgrade(ctx.Writer, ctx.Request, nil)
	if err != nil {
		fmt.Println(err)
		return "ERROR UPGRADING STREAM: " + fmt.Sprint(err)
	}
	ls.Stream = stream
	ls.RequestStat.UpdateProtocol("WSS")

	fmt.Println("LISTENER START: ", ls.Id)

	defer stream.Close()

	cdone := make(chan bool)
	go Read(ls, cdone)
	go Write(ls, cdone)

	<-cdone
	<-cdone
	fmt.Println("LISTENER CLOSED: ", ls.Id)
	return "END STREAM CLOSED"
}

func Read(ls listenerStream, done chan bool) {
	for {
		_, message, err := ls.Stream.ReadMessage()
		if err != nil {
			fmt.Println("END STREAM IN READ: " + fmt.Sprint(err))
			break
		}
		//    if message == "stat"

		fmt.Println("MESSAGE: " + fmt.Sprint(message))
		if strings.Contains(string(message), "F") {
			ls.fulldata = true
		}
		// if the client asks for "data", we send it a resume
		// err = stream.WriteMessage(websocket.TextMessage, []byte(statmsg))
	}
	done <- true
}

func Write(ls listenerStream, done chan bool) {
	last := time.Now()
	for {
		// if no changes, do not send anything
		// if more than 10 seconds, send a pingpong
		// Write every second stat actualization

		// search for all the data > last
		newreqs := []*stat.RequestStat{}
		newTime := time.Time{}
		num := 0
		for _, x := range stat.SystemStat.Requests {
			if last.Before(x.Time) {
				// we limit paquet size to 100 for security
				if num < 100 {
					newreqs = append(newreqs, x)
				}
				if newTime.Before(x.Time) {
					newTime = x.Time
				}
				num++
			}
		}
		last = newTime

		var m runtime.MemStats
		runtime.ReadMemStats(&m)
		loadavg, err := ioutil.ReadFile("/proc/loadavg")
		xloadavg := strings.Split(string(loadavg), " ")

		data := map[string]interface{}{
			"listenerid":          ls.Id,
			"goroutines":          runtime.NumGoroutine(),
			"memalloc":            m.Alloc,
			"memsys":              m.Sys,
			"reqtotal":            stat.SystemStat.RequestsTotal,
			"totalservedlength":   stat.SystemStat.LengthServed,
			"totalservedrequests": stat.SystemStat.RequestsTotal,
			"last":                last,
			"load1":               xloadavg[0],
			"load2":               xloadavg[1],
			"load3":               xloadavg[2],

			"lastrequests":    newreqs,
			"numlastrequests": num,
		}

		if ls.fulldata {
			data["starttime"] = stat.SystemStat.Start
			data["cpu"] = runtime.NumCPU()
			data["sysname"], _ = os.Hostname()
			ls.fulldata = false
		}

		datajson, _ := json.Marshal(data)
		ls.RequestStat.UpdateStat(0, len(datajson))
		err = ls.Stream.WriteMessage(websocket.TextMessage, []byte(datajson))

		if err != nil {
			fmt.Println("END STREAM IN WRITE: " + fmt.Sprint(err))
			break
		}

		time.Sleep(1 * time.Second)
	}
	done <- true
}
