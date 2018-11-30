package main

import (
  "fmt"
  "github.com/gorilla/websocket"
  "github.com/webability-go/xcore"
  "github.com/webability-go/xamboo/enginecontext"
)

var upgrader = websocket.Upgrader{} // use default options

/* This function is MANDATORY and is the point of call from the xamboo 
   The enginecontext contains all what you need to link with the system
*/
func Run(ctx *enginecontext.Context, template *xcore.XTemplate, language *xcore.XLanguage, e interface{}) string {
  stream, err := upgrader.Upgrade(ctx.Writer, ctx.Request, nil)
  if err != nil {
    return "ERROR UPGRADING STREAM: " + fmt.Sprint(err)
  }
  defer stream.Close()
  for {
    mt, message, err := stream.ReadMessage()
    if err != nil {
      return "END STREAM IN READ: " + fmt.Sprint(err)
    }
    fmt.Println("recv: " + string(message))
    err = stream.WriteMessage(mt, message)
    if err != nil {
      return "END STREAM IN WRITE: " + fmt.Sprint(err)
    }
  }
  return "END STREAM CLOSED"
}

