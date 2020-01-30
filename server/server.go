package server

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"regexp"

	"github.com/tdewolff/minify"
	"github.com/tdewolff/minify/css"
	"github.com/tdewolff/minify/html"
	"github.com/tdewolff/minify/js"
	"github.com/tdewolff/minify/json"
	"github.com/tdewolff/minify/svg"
	"github.com/tdewolff/minify/xml"

	"github.com/webability-go/xconfig"
	"github.com/webability-go/xcore"

	"github.com/webability-go/xamboo/server/utils"
	"github.com/webability-go/xamboo/server/config"
	"github.com/webability-go/xamboo/server/assets"
	"github.com/webability-go/xamboo/server/engines"
	"github.com/webability-go/xamboo/server/engines/redirect"
	"github.com/webability-go/xamboo/server/engines/simple"
	"github.com/webability-go/xamboo/server/engines/language"
	"github.com/webability-go/xamboo/server/engines/template"
	"github.com/webability-go/xamboo/server/engines/library"
)

var Engines = map[string]assets.Engine{}

func LinkEngines(engines []config.Engine) {
 	fmt.Println("Build Engines Containers native and external")
	Engines["redirect"] = redirect.Engine
  Engines["simple"] = simple.Engine
	Engines["language"] = language.Engine
	Engines["template"] = template.Engine
	Engines["library"] = library.Engine
  for _, engine := range engines {
		if engine.Source == "built-in" {
			continue
		}
	}
}

type Server struct {
	writer   http.ResponseWriter
	reader   *http.Request
	Method   string
	Page     string
	Listener *config.Listener
	Host     *config.Host

	MainContext *assets.Context
	Recursivity map[string]int
	GZipCandidate bool
}

func (s *Server) Start(w http.ResponseWriter, r *http.Request) {
	r.ParseForm()
	s.writer = w
	s.reader = r

	page := s.Page
	// We clean the page,
	// No prefix /
	if page[0] == '/' {
		page = page[1:]
	}

	// No ending /
	if len(page) > 0 && page[len(page)-1] == '/' {
		page = page[:len(page)-1]

		// WE DO NOT ACCEPT ENDING / SO MAKE AUTOMATICALLY A REDIRECT TO THE SAME PAGE WITHOUT A / AT THE END
		s.launchRedirect(page)
		return
	}

	if len(page) == 0 {
		page, _ = s.Host.Config.GetString("mainpage")
	}

	code := s.Run(page, false, nil, "", "", "").(string)

	// TODO(phil) check if returned code is string, else "print" it



  var instancedata *xconfig.XConfig = nil
	// Control content-type and gzip based on page calculation
	contenttype := s.writer.Header().Get("Content-Type")
	if contenttype == "" {
		if instancedata != nil {
			contenttype, _ = instancedata.GetString("content-type")
		}
		if contenttype == "" {
			contenttype = "text/html; charset=utf-8"
		}
	}
	s.writer.Header().Set("Content-Type", contenttype)



		// check config if we will minify before sending code
	  m := minify.New()
		m.AddFunc("text/css", css.Minify)
		m.AddFunc("text/html", html.Minify)
		m.AddFunc("image/svg+xml", svg.Minify)
		m.AddFuncRegexp(regexp.MustCompile("^(application|text)/(x-)?(java|ecma)script$"), js.Minify)
		m.AddFuncRegexp(regexp.MustCompile("[/+]json$"), json.Minify)
		m.AddFuncRegexp(regexp.MustCompile("[/+]xml$"), xml.Minify)
	  m.String("application/javascript", code)
	//	fmt.Println(err)



	// GZIPER based on content type?
	if s.MainContext != nil && s.MainContext.IsGZiped {
		s.writer.Header().Set("Content-Encoding", "gzip")
	} else {
		if s.GZipCandidate && utils.GzipMimeCandidate(s.Host.GZip.Mimes, contenttype) {
			s.writer.Header().Set("Content-Encoding", "gzip")
			s.writer.(*CoreWriter).CreateGZiper()
		}
	}

	s.writer.Write([]byte(code))
}

// The main xamboo runner
// innerpage is false for the default page call, true when it's a subcall (inner call, with context)
func (s *Server) Run(page string, innerpage bool, params *interface{}, version string, language string, method string) interface{} {

	// page is the original page to scan
	// P is the scanned page
	P := page

  // ==========================================================
	// Chapter 1: Search the correct .page
	// ==========================================================
	pagesdir, _ := s.Host.Config.GetString("pagesdir")
	acceptpathparameters, _ := s.Host.Config.GetBool("acceptpathparameters")
	pageserver := &engines.Page{
		PagesDir:             pagesdir,
		AcceptPathParameters: acceptpathparameters,
	}

	var pagedata *xconfig.XConfig
	for {
		pagedata = pageserver.GetData(P)
		if pagedata != nil && s.isAvailable(innerpage, pagedata) {
			break
		}
		// page not valid, we invalid it
		pagedata = nil

		// remove a level from the end
		path := strings.Split(P, "/")
		if len(path) <= 1 {
			break
		}
		path = path[0 : len(path)-1]
		P = strings.Join(path, "/")
	}

	fullpath := false
	if pagedata == nil {
		// last chance: main page accept parameters too ?
		P, _ = s.Host.Config.GetString("mainpage")
		pagedata = pageserver.GetData(P)
		if pagedata == nil || !s.isAvailable(innerpage, pagedata) {
			return s.launchError(innerpage, "Error 404: no page found .page for "+page)
		}
		fullpath = true
	}

	var xParams []string
	if P != page {
		if app, _ := pagedata.GetBool("acceptpathparameters"); !app {
			return s.launchError(innerpage, "Error 404: no page found with parameters")
		}
		if fullpath {
			xParams = strings.Split(page, "/")
		} else {
			xParams = strings.Split(page[len(P)+1:], "/")
		}
	}

	ctx := &assets.Context{
		Request:             s.reader,
		Writer:              s.writer,
		LocalPage:           page,
		LocalPageUsed:       P,
		LocalURLparams:      xParams,
		Sysparams:           s.Host.Config,
		LocalPageparams:     pagedata,
		LocalInstanceparams: nil,
		LocalEntryparams:    params,
		Plugins:             s.Host.Plugins,
	}
	if innerpage {
		ctx.IsMainPage = false
		ctx.MainPage = s.MainContext.MainPage
		ctx.MainPageUsed = s.MainContext.MainPageUsed
		ctx.MainURLparams = s.MainContext.MainURLparams
		ctx.MainPageparams = s.MainContext.MainPageparams
		ctx.MainInstanceparams = s.MainContext.MainInstanceparams
		ctx.Sessionparams = s.MainContext.Sessionparams
	} else {
		ctx.IsMainPage = true
		ctx.MainPage = page
		ctx.MainPageUsed = P
		ctx.MainURLparams = xParams
		ctx.MainPageparams = pagedata
		ctx.MainInstanceparams = nil
		ctx.Sessionparams = xconfig.New()
		s.MainContext = ctx
	}
	s.writer.(*CoreWriter).RequestStat.Context = ctx

	// 1. Build-in engines
	var xdata string
	tp, _ := pagedata.GetString("type")

	// homologation of servers
	// ===========================================================
	engine, ok := Engines[tp]
	if (!ok) {
		return s.launchError(innerpage, "Error: Server " + tp + " does not exist")
	}

	if !engine.NeedInstance() {
		// This engine does not need more than the .page itself.
		return engine.Run(ctx, s)
	}

	// ==========================================================
	// Chapter 2: Search the correct .instance with identities
	// ==========================================================

	defversion, _ := s.Host.Config.GetString("version")
	versions := []string{defversion}
	if len(version) > 0 && version != defversion {
		versions = append(versions, version)
	}
	versions = append(versions, "")

	deflanguage, _ := s.Host.Config.GetString("language")
	languages := []string{deflanguage}
	if len(language) > 0 && language != deflanguage {
		languages = append(languages, language)
	}
	languages = append(languages, "")

	identities := []assets.Identity{}
	for _, v := range versions {
		for _, l := range languages {
			// we only care all empty or all with values (we dont want only lang or only version)
			identities = append(identities, assets.Identity{v, l})
		}
	}

	instanceserver := &engines.Instance{
		PagesDir: pagesdir,
	}

	var instancedata *xconfig.XConfig
	for _, n := range identities {
		instancedata = instanceserver.GetData(P, n)
		if instancedata != nil {
			break
		}
	}

	if instancedata == nil {
		return s.launchError(innerpage, "Error: the page/block has no instance")
	}

	// verify the possible recursion
	if r, c := s.verifyRecursion(P, pagedata); r {
		return s.launchError(innerpage, "Error: the page/block is recursive: "+P+" after "+strconv.Itoa(c)+" times")
	}

	//  s.pushContext(innerpage, page, P, instancedata, params, version, language)

	// Cache system disabled for now
	// if s.getCache() return cache

	// ==========================================================
	// Chapter 3: Search the correct engine instance with identities
	// ==========================================================
  var engineinstance assets.EngineInstance
	for _, n := range identities {
		engineinstance = engine.GetInstance(s.Host.Name, pagesdir, P, n)
		if engineinstance != nil {
			break
		}
	}

	if engineinstance == nil {
		return s.launchError(innerpage, "Error: the engine could not find an instance to Run. Please verify the available instances.")
	}

  var templatedata *xcore.XTemplate = nil
	var languagedata *xcore.XLanguage = nil
  if engineinstance.NeedLanguage() {
		for _, n := range identities {
			languageinstance := Engines["language"].GetInstance(s.Host.Name, pagesdir, P, n)
			if languageinstance != nil {
				lang := languageinstance.Run(ctx, nil, nil, s)
				if lang != nil {
					languagedata = lang.(*xcore.XLanguage)
				}
			}
		}
	}
	if engineinstance.NeedTemplate() {
		for _, n := range identities {
			templateinstance := Engines["template"].GetInstance(s.Host.Name, pagesdir, P, n)
			if templateinstance != nil {
				temp := templateinstance.Run(ctx, nil, nil, s)
				if temp != nil {
					templatedata = temp.(*xcore.XTemplate)
				}
			}
		}
	}

	data := engineinstance.Run(ctx, templatedata, languagedata, s)
  if innerpage /* && xdata is not string */ {
		return data
	} else {
	  xdata = fmt.Sprint(data)
  }

	// Cache system disabled for now
	// s.setCache()

	// ==========================================================
	// Chapter 4: Template of the page
	// ==========================================================

	// check templates and get templates
	if x, _ := pagedata.GetString("template"); x != "" {
		fathertemplate := s.Run(x, true, params, version, language, method).(string)
		//    if (is_array($text))
		//    {
		//      foreach($text as $k => $block)
		//        $fathertemplate = str_replace("[[CONTENT,{$k}]]", $block, $fathertemplate);
		//      $text = $fathertemplate;
		//    }
		//    else
		xdata = strings.Replace(fathertemplate, "[[CONTENT]]", xdata, -1)
	}

  if (!innerpage)
	{
		// Control content-type and gzip based on page calculation
		contenttype := s.writer.Header().Get("Content-Type")
		if contenttype == "" {
			contenttype, _ = instancedata.GetString("content-type")
			if contenttype == "" {
				contenttype = "text/html; charset=utf-8"
			}
		}
		s.writer.Header().Set("Content-Type", contenttype)
	}

	// Cache system disabled for now
	// s.setFullCache()

	return xdata
}

func wrapper(s interface{}, page string, params *interface{}, version string, language string, method string) interface{} {
	return s.(*Server).Run(page, true, params, version, language, method)
}

func wrapperstring(s interface{}, page string, params *interface{}, version string, language string, method string) string {
	data := s.(*Server).Run(page, true, params, version, language, method)
	if sdata, ok := data.(string); ok {
		return sdata
	}
	return fmt.Sprint(data)
}

func (s *Server) launchError(innerpage bool, message string) string {
	// Call the error page
	// TODO(phil) we must call error page with 404

	if !innerpage {
		http.Error(s.writer, message, http.StatusNotFound)
		return ""
	}
	return message
}

func (s *Server) launchRedirect(url string) {
	// Call the redirect mecanism
	http.Redirect(s.writer, s.reader, url, http.StatusPermanentRedirect)
}

func (s *Server) isAvailable(innerpage bool, p *xconfig.XConfig) bool {

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
// We authorize up to 3 reentry in the same page before launching recursion (it may happen ?)
func (s *Server) verifyRecursion(page string, pagedata *xconfig.XConfig) (bool, int) {
	c, ok := s.Recursivity[page]
	max, _ := pagedata.GetInt("maxrecursion")
	if max <= 0 {
		max = 3
	}
	if !ok {
		s.Recursivity[page] = 1
	} else {
		if c+1 > max {
			return true, c + 1
		}
		s.Recursivity[page]++
	}
	return false, 0
}

func (s *Server) pushContext(context bool, originP string, P string, instancedata *xconfig.XConfig, params *interface{}, version string, language string) {

}
