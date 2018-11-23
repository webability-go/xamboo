package core

import (
  "fmt"
  "strings"
  "net/http"
  
  "github.com/webability-go/xconfig"
  "github.com/webability-go/xamboo/server"
)

type Engine struct {
  writer http.ResponseWriter
  reader *http.Request
  Method string
  Page string
  Listener *Listener
  Host *Host
}

func (e *Engine) Start(w http.ResponseWriter, r *http.Request) {
  e.writer = w
  e.reader = r

  // No ending /
  if len(e.Page) > 0 && e.Page[len(e.Page)-1] == '/' {
    e.Page = e.Page[:len(e.Page)-1]
    
    // WE DO NOT ACCEPT ENDING / SO MAKE AUTOMATICALLY A REDIRECT TO THE SAME PAGE WITHOUT A / AT THE END
    e.launchRedirect(e.Page)
    return
  }
  
  // No prefix /
  if e.Page[0] == '/' {
    e.Page = e.Page[1:]
  }

  if len(e.Page) == 0 {
    e.Page = e.Host.Config.Get("mainpage").(string)
  }
  
  e.Run(e.Page, false, nil, "", "", "")
}

// The main xamboo runner
// context is false for the default page call
func (e *Engine) Run(page string, context bool, params *interface{}, version string, language string, method string) {
  // string to print to the page
  var data []string

  // e.Page is the original page to scan
  // P is the scanned page
  P := e.Page
  
  // Search the correct .page 
  pageserver := &server.Page {
    PagesDir: e.Host.Config.Get("pagesdir").(string),
    AcceptPathParameters: e.Host.Config.Get("acceptpathparameters").(bool),
  }
  
  var pagedata *xconfig.XConfig
  for {
    pagedata = pageserver.GetData(P)
    if pagedata != nil && e.isAvailable(context, pagedata) {
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
    e.launchError("Error 404: no page found")
    return
  }

  var xParams []string
  if P != e.Page {
    if pagedata.Get("AcceptPathParameters") != true {
      e.launchError("Error 404: no page found")
      return
    }
    xParams = strings.Split(e.Page[len(P)+1:], "/")
  }
  
  if !context {
    if pagedata.Get("type") == "redirect" {
      // launch the redirect of the page
      e.launchRedirect("REDIRECT TO THE PAGE: " + pagedata.Get("Redirect").(string))
      return
    }
  }
  
  defversion := e.Host.Config.Get("version").(string)
  versions := []string {defversion}
  if len(version) > 0 && version != defversion {
    versions = append(versions, version)
  }
  versions = append(versions, "")
  
  deflanguage := e.Host.Config.Get("language").(string)
  languages := []string {deflanguage}
  if len(language) > 0 && language != deflanguage {
    languages = append(languages, language)
  }
  languages = append(languages, "")

  identities := []server.Identity {}
  for _, v := range versions {
    for _, l := range languages {
      // we only care all empty or all with values (we dont want only lang or only version)
      identities = append(identities, server.Identity{v, l} )
    }
  }
  
  instanceserver := &server.Instance {
    PagesDir: e.Host.Config.Get("pagesdir").(string),
  }

  var instancedata *xconfig.XConfig
  var identity *server.Identity

  for _, n := range identities {
    instancedata = instanceserver.GetData(P, n)
    if instancedata != nil {
      identity = &n
      break
    }
  }

  if instancedata == nil {
    e.launchError("Error: the page/block has no instance")
    return
  }
  
  // verify the possible recursion
  if e.verifyRecursion(P) {
    e.launchError("Error: the page/block is recursive")
    return
  }
  
  e.pushContext(context, e.Page, P, instancedata, params, version, language)

  // Cache system disabled for now
  // if e.getCache() return cache
  
  // Resolve page code
  // 1. Build-in engines
  switch pagedata.Get("type") {
    case "simple":
      var codedata *server.CodeStream
      codeserver := &server.Code {
        PagesDir: e.Host.Config.Get("pagesdir").(string),
      }
      
      for _, n := range identities {
        codedata = codeserver.GetData(P, n)
        if codedata != nil {
          break
        }
      }
      
      xdata := codedata.Run()
      data = append(data, xdata)
    
    case "library":
    
    case "template":
    
    case "language":
    
  }
  
  
  
  // Cache system disabled for now
  // e.setCache()
  
  
  
  
  fmt.Println("Final working identity:")
  fmt.Println(identity)
  
  data = append(data, "\n\n===\nThe Xamboo CMS Framework\n")
  data = append(data, fmt.Sprintf("Original P: %s\n", e.Page))
  data = append(data, fmt.Sprintf("Method: %s\n", e.Method))

  data = append(data, fmt.Sprintf("XParams: %v\n", xParams))
  data = append(data, fmt.Sprintf("identity: %v\n", identity))
  data = append(data, fmt.Sprintf(".page: %v\n", pagedata))
  data = append(data, fmt.Sprintf(".instance: %v\n", instancedata))

  
  data = append(data, fmt.Sprintf("Request Data: %s - %s - %s - %s - %s - %s\n", e.reader.Method, e.reader.Host, e.reader.URL.Path, e.reader.Proto, e.reader.RemoteAddr, e.reader.RequestURI))
  if (e.reader.TLS != nil) {
    data = append(data, fmt.Sprintf("TLS: %s - %s - %s - %s - %s - %s\n", e.reader.TLS.Version, e.reader.TLS.NegotiatedProtocol, e.reader.TLS.CipherSuite, "", "", "" ))
  }

  e.writer.Write([]byte(strings.Join(data, "")))
}

func (e *Engine) launchError(message string) {
  // Call the error page
  var data []string
  data = append(data, fmt.Sprintf(message))
  e.writer.Write([]byte(strings.Join(data, "")))
}

func (e *Engine) launchRedirect(message string) {
  // Call the redirect mecanism
  var data []string
  data = append(data, fmt.Sprintf(message))
  e.writer.Write([]byte(strings.Join(data, "")))
}

func (e *Engine) isAvailable(context bool, p *xconfig.XConfig) bool {
  if p.Get("status") == "hidden" {
    return false
  }
  
  if context && (p.Get("status") == "template" || p.Get("status") == "published" || p.Get("status") == "block") {
    return true
  }
    
  if p.Get("status") == "published" {
    return true
  }
    
  return false
}

// return true if there is a recursion
func (e *Engine) verifyRecursion(page string) bool {
  return false
}

func (e *Engine) pushContext(context bool, originP string, P string, instancedata *xconfig.XConfig, params *interface{}, version string, language string) {

}


