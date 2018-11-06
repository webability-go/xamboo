package core

import (
  "fmt"
  "strings"
  "net/http"
  
  "github.com/gowebability/xconfig"
  "github.com/gowebability/xamboo/server"
)

type Engine struct {
  Method string
  Page string
  Context int
  Listener *Listener
  Host *Host
}

// The main xamboo runner
func (e *Engine) Run(w http.ResponseWriter, r *http.Request) {
  var data []string

  if (e.Page[0] == '/') {
    e.Page = e.Page[1:]
  }
  if len(e.Page) == 0 {
    e.Page = e.Host.MainPage
  }
  
  // e.Page is the original page to scan
  // P is the scanned page

  P := e.Page
  pageserver := &server.Page {
    PagesDir: e.Host.PagesDir,
    AcceptPathParameters: e.Host.AcceptPathParameters,
  }
  
  // Search the page
  var pagedata *xconfig.XConfig
  for {
    pagedata = pageserver.GetInstance(P)
    if pagedata != nil && e.isAvailable(pagedata) {
      break
    }
    // page not valid, we invalid it
    pagedata = nil
    
    // remove a level from the end
    path := strings.Split(P, "/")
    if len(path) <= 1 { break }
    path = path[0:len(path)-1]
    P = strings.Join(path, "/")
  }

  if pagedata == nil {
    e.launchError(w, r)
    return
  }

  var xParams []string
  if P != e.Page {
    if (*pagedata)["AcceptPathParameters"] != true {
      e.launchError(w, r)
      return
    }
    xParams = strings.Split(e.Page[len(P):], "/")
  }
  
  if e.Context == 0 {
    if (*pagedata)["Type"] == "redirect" {
      // launch the redirect of the page
      data = append(data, fmt.Sprintf("REDIRECT TO THE PAGE: %s\n", (*pagedata)["Redirect"]))
      w.Write([]byte(strings.Join(data, "")))
      return
    }
  }
  
  data = append(data, fmt.Sprintf("XParams: %v\n", xParams))









  data = append(data, fmt.Sprintf("Original P: %s\n", e.Page))
  data = append(data, "The Xamboo CMS Framework\n")
  data = append(data, fmt.Sprintf("Method: %s\n", e.Method))
  
  data = append(data, fmt.Sprintf("Request Data: %s - %s - %s - %s - %s - %s\n", r.Method, r.Host, r.URL.Path, r.Proto, r.RemoteAddr, r.RequestURI))
  if (r.TLS != nil) {
    data = append(data, fmt.Sprintf("TLS: %s - %s - %s - %s - %s - %s\n", r.TLS.Version, r.TLS.NegotiatedProtocol, r.TLS.CipherSuite, "", "", "" ))
  }



  w.Write([]byte(strings.Join(data, "")))
}

func (e *Engine) launchError(w http.ResponseWriter, r *http.Request) {
  // Call the error page
  var data []string
  data = append(data, fmt.Sprintf("LAUNCH ERROR PAGE"))
  w.Write([]byte(strings.Join(data, "")))
}

func (e *Engine) isAvailable(p *xconfig.XConfig) bool {
  if (*p)["status"] == "hidden" {
    return false
  }
  
  if e.Context >= 1 && ((*p)["status"] == "template" || (*p)["status"] == "published" || (*p)["status"] == "block") {
    return true
  }
    
  if (*p)["status"] == "published" {
    return true
  }
    
  return false
}

