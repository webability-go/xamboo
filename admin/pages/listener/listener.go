package main

import (
  "fmt"
  "time"
  "runtime"
  "encoding/json"

  "github.com/gorilla/websocket"

  "github.com/webability-go/xcore"

  "github.com/webability-go/xamboo/stat"
  "github.com/webability-go/xamboo/engine"
  "github.com/webability-go/xamboo/engine/context"
)

type listenerStream struct {
  Upgrader websocket.Upgrader
  Stream *websocket.Conn
  RequestStat *stat.RequestStat
}

/* This function is MANDATORY and is the point of call from the xamboo
   The enginecontext contains all what you need to link with the system
*/
func Run(ctx *context.Context, template *xcore.XTemplate, language *xcore.XLanguage, e interface{}) string {

  fmt.Println("Entering listener")
  // Note: the upgrader will hijack the writer, so we are responsible to actualize the stats
  ls := listenerStream{
    Upgrader: websocket.Upgrader{},
    RequestStat: ctx.Writer.(*engine.CoreWriter).RequestStat,
  }

  stream, err := ls.Upgrader.Upgrade(ctx.Writer, ctx.Request, nil)
  if err != nil {
    fmt.Println(err)
    return "ERROR UPGRADING STREAM: " + fmt.Sprint(err)
  }
  ls.Stream = stream
  ls.RequestStat.UpdateProtocol("WSS")
  
  fmt.Println("LISTENER START")
  
  defer stream.Close()

  go Read(ls)
  go Write(ls)

  for {
    time.Sleep(10*time.Second)
  }
  return "END STREAM CLOSED"
}

func Read(ls listenerStream) {
  for {
    _, message, err := ls.Stream.ReadMessage()
    if err != nil {
      fmt.Println("END STREAM IN READ: " + fmt.Sprint(err))
      break
    }
    fmt.Println("MESSAGE: " + fmt.Sprint(message))
    // if the client asks for "data", we send it a resume
    // err = stream.WriteMessage(websocket.TextMessage, []byte(statmsg))
  }
}

func Write(ls listenerStream) {
  last := time.Time{}
  for {
    // if no changes, do not send anything
    // if more than 10 seconds, send a pingpong
    // Write every second stat actualization

    // search for all the data > last
    min := len(stat.SystemStat.Requests)-10;
    if min < 0 { min = 0 }
    for _, x := range stat.SystemStat.Requests[min:] {
      if last.Before(x.Time) { last = x.Time }
    }
    
    var m runtime.MemStats
    runtime.ReadMemStats(&m)
    alloc := m.Alloc / 1024
    sys := m.Sys / 1024
    
    data := map[string]interface{}{
      "cpu": runtime.NumCPU(),
      "memalloc": alloc,
      "memsys": sys,
      "goroutines": runtime.NumGoroutine(),
      "reqtotal" : stat.SystemStat.RequestsTotal,
      "totalservedlength": stat.SystemStat.LengthServed,
      "totalservedrequests": stat.SystemStat.RequestsServed,
      "lastrequests": stat.SystemStat.Requests[min:],
      "last": last,
    }
    
    datajson, _ := json.Marshal(data)
    ls.RequestStat.UpdateStat(0, len(datajson))
    err := ls.Stream.WriteMessage(websocket.TextMessage, []byte(datajson))

    if err != nil {
      fmt.Println("END STREAM IN WRITE: " + fmt.Sprint(err))
      break
    }

    time.Sleep(1*time.Second) 
  }
}





