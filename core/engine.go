package core

import (
  "fmt"
  "strings"
  "net/http"
  
  "github.com/webability-go/xconfig"
  "github.com/webability-go/xamboo/server"
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
  
  fmt.Println(e.Host.Config)
  if len(e.Page) == 0 {
    e.Page = e.Host.Config.Get("mainpage").(string)
  }
  
  // e.Page is the original page to scan
  // P is the scanned page

  P := e.Page
  pageserver := &server.Page {
    PagesDir: e.Host.Config.Get("pagesdir").(string),
    AcceptPathParameters: e.Host.Config.Get("acceptpathparameters").(bool),
  }
  
  // Search the page
  var pagedata xconfig.XConfig
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
    if pagedata["AcceptPathParameters"] != true {
      e.launchError(w, r)
      return
    }
    xParams = strings.Split(e.Page[len(P):], "/")
  }
  
  if e.Context == 0 {
    if pagedata["type"] == "redirect" {
      // launch the redirect of the page
      data = append(data, fmt.Sprintf("REDIRECT TO THE PAGE: %s\n", pagedata["Redirect"]))
      w.Write([]byte(strings.Join(data, "")))
      return
    }
  }
  
  // ===== CREATES THE PAGE IDENTITY =====
  /*
  skin = $this->base->SKIN?'.'.$this->base->SKIN:'';
  version = $version?$version:($page->defaultversion?$page->defaultversion:$this->base->Version);
  language = $language?$language:($page->defaultlanguage?$page->defaultlanguage:$this->base->Language);
  identities = array($skin . '.' . $version . '.' . $language => array('version' => $version, 'language' => $language));
  identities[$skin . '.' . $version . '.' . $this->base->DefaultLanguage] = array('version' => $version, 'language' => $this->base->DefaultLanguage);
  version2 = $page->defaultversion?$page->defaultversion:$this->base->Version;
  language2 = $page->defaultlanguage?$page->defaultlanguage:$this->base->Language;
  i2 = $skin . '.'.$version2 . '.' . $language2;
  i3 = $skin . '.'.$this->base->Version . '.' . $this->base->Language;
  i4 = $skin . '.'.$this->base->DefaultVersion . '.' . $this->base->DefaultLanguage;
  if (!isset($identities[$i2]))
    identities[$i2] = array('version' => $version2, 'language' => $language2);
  if (!isset($identities[$i3]))
    identities[$i3] = array('version' => $this->base->Version, 'language' => $this->base->Language);
  if (!isset($identities[$i4]))
    identities[$i4] = array('version' => $this->base->DefaultVersion, 'language' => $this->base->DefaultLanguage);
  identities[$skin] = array('version' => null, 'language' => null);
  if (skin)
  {
    i5 = '.'.$version . '.' . $language;
    i51 = '.'.$version . '.' . $this->base->DefaultLanguage;
    i6 = '.'.$version2 . '.' . $language2;
    i7 = '.'.$this->base->Version . '.' . $this->base->Language;
    i8 = '.'.$this->base->DefaultVersion . '.' . $this->base->DefaultLanguage;
    if (!isset($identities[$i5]))
      identities[$i5] = array('version' => $version, 'language' => $language);
    if (!isset($identities[$i51]))
      identities[$i51] = array('version' => $version, 'language' => $this->base->Language);
    if (!isset($identities[$i6]))
      identities[$i6] = array('version' => $version2, 'language' => $language2);
    if (!isset($identities[$i7]))
      identities[$i7] = array('version' => $this->base->Version, 'language' => $this->base->Language);
    if (!isset($identities[$i8]))
      identities[$i8] = array('version' => $this->base->DefaultVersion, 'language' => $this->base->DefaultLanguage);
    identities[''] = array('version' => null, 'language' => null);
  }
  */
  
  




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

func (e *Engine) isAvailable(p xconfig.XConfig) bool {
  if p["status"] == "hidden" {
    return false
  }
  
  if e.Context >= 1 && (p["status"] == "template" || p["status"] == "published" || p["status"] == "block") {
    return true
  }
    
  if p["status"] == "published" {
    return true
  }
    
  return false
}

