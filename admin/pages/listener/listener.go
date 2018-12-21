package main

import (
  "fmt"

  "github.com/gorilla/websocket"

  "github.com/webability-go/xcore"

  "github.com/webability-go/xamboo/stat"
  "github.com/webability-go/xamboo/engine/context"
)

var upgrader = websocket.Upgrader{} // use default options

/* This function is MANDATORY and is the point of call from the xamboo 
   The enginecontext contains all what you need to link with the system
*/
func Run(ctx *context.Context, template *xcore.XTemplate, language *xcore.XLanguage, e interface{}) string {

  fmt.Println("Entering listener")

  stream, err := upgrader.Upgrade(ctx.Writer, ctx.Request, nil)
  if err != nil {
    fmt.Println(err)
    return "ERROR UPGRADING STREAM: " + fmt.Sprint(err)
  }
  
  fmt.Println("LISTENER START")
  
  defer stream.Close()
  for {
    mt, message, err := stream.ReadMessage()
    if err != nil {
      return "END STREAM IN READ: " + fmt.Sprint(err)
    }
    // if the client asks for "data", we send it a resum
    if string(message) == "data" {
      statmsg := fmt.Sprintf("Stats: num: %d, bytes: %d", stat.SystemStat.Requests, stat.SystemStat.LengthServed)
      err = stream.WriteMessage(websocket.TextMessage, []byte(statmsg))
    }
    
    fmt.Println("recv: " + string(message))
    err = stream.WriteMessage(mt, message)
    if err != nil {
      return "END STREAM IN WRITE: " + fmt.Sprint(err)
    }
    // Write every second stat actualization
    statmsg := fmt.Sprintf("Stats: num: %d, bytes: %d", stat.SystemStat.Requests, stat.SystemStat.LengthServed)
    err = stream.WriteMessage(websocket.TextMessage, []byte(statmsg))
  }
  return "END STREAM CLOSED"
}

