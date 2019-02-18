package engine

import (
  "fmt"
  "strings"
  "net/http"
  
  "github.com/webability-go/xcore"
  "github.com/webability-go/xconfig"

  "github.com/webability-go/xamboo/config"
  "github.com/webability-go/xamboo/engine/context"
  "github.com/webability-go/xamboo/engine/servers"
)

/* The main engine structure
*/
type Engine struct {
  writer http.ResponseWriter
  reader *http.Request
  Method string
  Page string
  Listener *config.Listener
  Host *config.Host
  
  MainContext *context.Context
  Recursivity []string
}

func (e *Engine)Start(w http.ResponseWriter, r *http.Request) {
  r.ParseForm()
  e.writer = w
  e.reader = r

  page := e.Page
  // We clean the page, 
  // No prefix /
  if page[0] == '/' {
    page = page[1:]
  }

  // No ending /
  if len(page) > 0 && page[len(page)-1] == '/' {
    page = page[:len(page)-1]
    
    // WE DO NOT ACCEPT ENDING / SO MAKE AUTOMATICALLY A REDIRECT TO THE SAME PAGE WITHOUT A / AT THE END
    e.launchRedirect(page)
    return
  }
  
  if len(page) == 0 {
    page, _ = e.Host.Config.GetString("mainpage")
  }
  
  code := e.Run(page, false, nil, "", "", "").(string)
  
  // WRITE HERE THE WRITER WITH PAGECODE
  e.writer.Write([]byte(code))
}

// The main xamboo runner
// innerpage is false for the default page call, true when it's a subcall (inner call, with context)
func (e *Engine) Run(page string, innerpage bool, params *interface{}, version string, language string, method string) interface{} {
  // string to print to the page
  var data []string
//  fmt.Println("Engine-Run: " + page)

  // e.Page is the original page to scan
  // P is the scanned page
  P := page
  
  // Search the correct .page
  pd, _ := e.Host.Config.GetString("pagesdir")
  app, _ := e.Host.Config.GetBool("acceptpathparameters")
  pageserver := &servers.Page {
    PagesDir: pd,
    AcceptPathParameters: app,
  }
  
  var pagedata *xconfig.XConfig
  for {
    pagedata = pageserver.GetData(P)
    if pagedata != nil && e.isAvailable(innerpage, pagedata) {
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
    return e.launchError(innerpage, "Error 404: no page found .page for " + page)
  }

  var xParams []string
  if P != page {
    if app, _ := pagedata.GetBool("AcceptPathParameters"); !app {
      return e.launchError(innerpage, "Error 404: no page found with parameters")
    }
    xParams = strings.Split(page[len(P)+1:], "/")
  }
  
  if !innerpage {
    if x, _ := pagedata.Get("type"); x == "redirect" {
      // launch the redirect of the page
      if p1, _ := pagedata.GetString("Redirect"); p1 != "" {
        e.launchRedirect(p1)
      }
      return ""
    }
  }
  
  defversion, _ := e.Host.Config.GetString("version")
  versions := []string {defversion}
  if len(version) > 0 && version != defversion {
    versions = append(versions, version)
  }
  versions = append(versions, "")
  
  deflanguage, _ := e.Host.Config.GetString("language")
  languages := []string {deflanguage}
  if len(language) > 0 && language != deflanguage {
    languages = append(languages, language)
  }
  languages = append(languages, "")

  identities := []servers.Identity {}
  for _, v := range versions {
    for _, l := range languages {
      // we only care all empty or all with values (we dont want only lang or only version)
      identities = append(identities, servers.Identity{v, l} )
    }
  }
  
  instanceserver := &servers.Instance {
    PagesDir: pd,
  }

  var instancedata *xconfig.XConfig
  for _, n := range identities {
    instancedata = instanceserver.GetData(P, n)
    if instancedata != nil {
      break
    }
  }

  if instancedata == nil {
    return e.launchError(innerpage, "Error: the page/block has no instance")
  }
  
  // verify the possible recursion
  if e.verifyRecursion(P) {
    return e.launchError(innerpage, "Error: the page/block is recursive")
  }
  
  ctx := &context.Context{
    Request: e.reader,
    Writer: e.writer,
    LocalPage: page,
    LocalPageUsed: P,
    LocalURLparams: xParams,
    Sysparams: e.Host.Config,
    LocalPageparams: pagedata,
    LocalInstanceparams: instancedata,
    LocalEntryparams: params,
    Plugins: e.Host.Plugins,
  }
  if innerpage {
    ctx.MainPage = e.MainContext.MainPage
    ctx.MainPageUsed = e.MainContext.MainPageUsed
    ctx.MainURLparams = e.MainContext.MainURLparams
    ctx.MainPageparams = e.MainContext.MainPageparams
    ctx.MainInstanceparams = e.MainContext.MainInstanceparams
    ctx.Sessionparams = e.MainContext.Sessionparams
  } else {
    ctx.MainPage = page
    ctx.MainPageUsed = P
    ctx.MainURLparams = xParams
    ctx.MainPageparams = pagedata
    ctx.MainInstanceparams = instancedata
    ctx.Sessionparams = xconfig.New()
    e.MainContext = ctx
  }

//  e.pushContext(innerpage, page, P, instancedata, params, version, language)

  // Cache system disabled for now
  // if e.getCache() return cache
  
  // Resolve page code
  // 1. Build-in engines
  var xdata string
  tp, _ := pagedata.GetString("type")
  switch tp {
    case "simple":
      var codedata *servers.CodeStream
      codeserver := &servers.CodeServer {
        PagesDir: pd,
      }
      
      for _, n := range identities {
        codedata = codeserver.GetData(P, n)
        if codedata != nil {
          break
        }
      }
      
      if codedata == nil {
        return e.launchError(innerpage, "Error: the simple page/block has no code")
      }
      
      languagedata := e.loadLanguage(P, identities)

      xdata = codedata.Run(ctx, languagedata, e)

    case "library":
      libraryserver := &servers.LibraryServer {
        PagesDir: pd,
      }

      librarydata := libraryserver.GetData(P)
      if librarydata == nil {
        return e.launchError(innerpage, "Error: the library page/block has no code")
      }

      languagedata := e.loadLanguage(P, identities)
      templatedata := e.loadTemplate(P, identities)

      xdata = librarydata.Run(ctx, templatedata, languagedata, e)

    case "template":
      templatedata := e.loadTemplate(P, identities)
      if templatedata == nil {
        return e.launchError(innerpage, "Error: the template page/block has no code")
      }

      // SHOULD GET BACK THE OBJECT ITSELF, NOT ITS PRINT
      xdata = templatedata.Print()

    case "language":
      languagedata := e.loadLanguage(P, identities)
      if languagedata == nil {
        return e.launchError(innerpage, "Error: the language page/block has no code")
      }
      
      // SHOULD GET BACK THE OBJECT ITSELF, NOT ITS PRINT
      xdata = fmt.Sprint(languagedata)

    default:
      xdata = "THIS IS SOMETHING UNKNOWN FROM A PARALLEL UNIVERSE THAT SHOULD NOT HAPPEN"
  }
  
  // Cache system disabled for now
  // e.setCache()
  
  // check templates and get templates
  if x, _ := pagedata.GetString("template"); x != "" {
    fathertemplate := e.Run(x, true, params, version, language, method).(string);
//    if (is_array($text))
//    {
//      foreach($text as $k => $block)
//        $fathertemplate = str_replace("[[CONTENT,{$k}]]", $block, $fathertemplate);
//      $text = $fathertemplate;
//    }
//    else
    xdata = strings.Replace(fathertemplate, "[[CONTENT]]", xdata, -1);

  }

  data = append(data, xdata)
  
  // Cache system disabled for now
  // e.setFullCache()
/*
  data = append(data, "<hr><br>The Xamboo CMS Framework<br>")
  data = append(data, fmt.Sprintf("Original P: %s<br>", page))
  data = append(data, fmt.Sprintf("Method: %s<br>", e.Method))

  data = append(data, fmt.Sprintf("XParams: %v<br>", xParams))
  data = append(data, fmt.Sprintf("identity: %v<br>", identity))
  data = append(data, fmt.Sprintf(".page: %v<br>", pagedata))
  data = append(data, fmt.Sprintf(".instance: %v<br>", instancedata))

  data = append(data, fmt.Sprintf("Request Data: %s - %s - %s - %s - %s - %s<br>", e.reader.Method, e.reader.Host, e.reader.URL.Path, e.reader.Proto, e.reader.RemoteAddr, e.reader.RequestURI))
  if (e.reader.TLS != nil) {
    data = append(data, fmt.Sprintf("TLS: %s - %s - %s - %s - %s - %s<br>", e.reader.TLS.Version, e.reader.TLS.NegotiatedProtocol, e.reader.TLS.CipherSuite, "", "", "" ))
  }
*/
  return strings.Join(data, "")
}

func (e *Engine) loadTemplate(P string, identities []servers.Identity) *xcore.XTemplate {
  pd, _ := e.Host.Config.GetString("pagesdir")
  templateserver := &servers.TemplateServer {
    PagesDir: pd,
  }
  
  var templatedata *xcore.XTemplate
  for _, n := range identities {
    templatedata = templateserver.GetData(P, n)
    if templatedata != nil {
      return templatedata
    }
  }
  return nil
}

func (e *Engine) loadLanguage(P string, identities []servers.Identity) *xcore.XLanguage {
  pd, _ := e.Host.Config.GetString("pagesdir")
  languageserver := &servers.LanguageServer {
    PagesDir: pd,
  }

  var languagedata *xcore.XLanguage
  for _, n := range identities {
    languagedata = languageserver.GetData(P, n)
    if languagedata != nil {
      return languagedata
    }
  }
  return nil
}

func wrapper(e interface{}, page string, params *interface{}, version string, language string, method string) interface{} {
  return e.(*Engine).Run(page, true, params, version, language, method)
}

func wrapperstring(e interface{}, page string, params *interface{}, version string, language string, method string) string {
  return e.(*Engine).Run(page, true, params, version, language, method).(string)
}

func (e *Engine)launchError(innerpage bool, message string) string {
  // Call the error page
  
  
  
  if !innerpage {
    http.Error(e.writer, message, http.StatusNotFound)
    return ""
  }
  return message
}

func (e *Engine) launchRedirect(url string) {
  // Call the redirect mecanism
  http.Redirect(e.writer, e.reader, url, http.StatusMovedPermanently)
}

func (e *Engine) isAvailable(innerpage bool, p *xconfig.XConfig) bool {

  p1, _ := p.GetString("status")

  if p1 == "hidden" {
    return false
  }

  if p1 == "published" {
    return true
  }

  if innerpage && (p1 == "template" || p1 == "block") {
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


