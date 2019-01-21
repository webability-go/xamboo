package main

import (
  "fmt"
  "time"
  "encoding/json"

  "github.com/gorilla/websocket"

  "github.com/webability-go/xcore"

  "github.com/webability-go/xamboo/stat"
  "github.com/webability-go/xamboo/engine/context"
)

var upgrader = websocket.Upgrader{} // use default options
var stream *websocket.Conn

/* This function is MANDATORY and is the point of call from the xamboo
   The enginecontext contains all what you need to link with the system
*/
func Run(ctx *context.Context, template *xcore.XTemplate, language *xcore.XLanguage, e interface{}) string {

  fmt.Println("Entering listener")

  var err error
  stream, err = upgrader.Upgrade(ctx.Writer, ctx.Request, nil)
  if err != nil {
    fmt.Println(err)
    return "ERROR UPGRADING STREAM: " + fmt.Sprint(err)
  }
  
  fmt.Println("LISTENER START")
  
  defer stream.Close()

  go Read()
  go Write()

  for {
    time.Sleep(10*time.Second)
  }
  return "END STREAM CLOSED"
}

func Read() {
  for {
    _, message, err := stream.ReadMessage()
    if err != nil {
      fmt.Println("END STREAM IN READ: " + fmt.Sprint(err))
      break
    }
    fmt.Println("MESSAGE: " + fmt.Sprint(message))
    // if the client asks for "data", we send it a resume
    // err = stream.WriteMessage(websocket.TextMessage, []byte(statmsg))
  }
}

func Write() {
  var last uint64 = 0
  for {
    // if no changes, do not send anything
    // if more than 10 seconds, send a pingpong
    // Write every second stat actualization
    data := map[string]interface{}{
      "reqtotal" : stat.SystemStat.RequestsTotal,
      "lenserved": stat.SystemStat.LengthServed,
      "reqserved": stat.SystemStat.RequestsServed,
      "lastrequests": stat.SystemStat.Requests,
    }
    
    // put requests > last
    
    // last = max id request
    last ++

    datajson, _ := json.Marshal(data)
    err := stream.WriteMessage(websocket.TextMessage, []byte(datajson))

    if err != nil {
      fmt.Println("END STREAM IN WRITE: " + fmt.Sprint(err))
      break
    }

    time.Sleep(1*time.Second) 
  }
}





