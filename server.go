package xamboo

import (
	"fmt"
	"net/http"
	"plugin"
	"regexp"
	"runtime/debug"
	"strconv"
	"strings"

	"github.com/tdewolff/minify"
	"github.com/tdewolff/minify/css"
	"github.com/tdewolff/minify/html"
	"github.com/tdewolff/minify/js"
	"github.com/tdewolff/minify/json"
	"github.com/tdewolff/minify/svg"
	"github.com/tdewolff/minify/xml"

	"github.com/webability-go/uasurfer"
	"github.com/webability-go/xconfig"
	"github.com/webability-go/xcore/v2"

	"github.com/webability-go/xamboo/assets"
	"github.com/webability-go/xamboo/config"
	"github.com/webability-go/xamboo/engines"
	"github.com/webability-go/xamboo/engines/language"
	"github.com/webability-go/xamboo/engines/library"
	"github.com/webability-go/xamboo/engines/redirect"
	"github.com/webability-go/xamboo/engines/simple"
	"github.com/webability-go/xamboo/engines/template"
	"github.com/webability-go/xamboo/engines/wajafapp"
	"github.com/webability-go/xamboo/logger"
	"github.com/webability-go/xamboo/utils"
)

var Engines = map[string]assets.Engine{}

func LinkEngines(engines []config.Engine) {
	xlogger := logger.GetCoreLogger("sys")
	xlogger.Println("Build Engines Containers native and external")
	Engines["redirect"] = redirect.Engine
	Engines["simple"] = simple.Engine
	Engines["language"] = language.Engine
	Engines["template"] = template.Engine
	Engines["library"] = library.Engine
	Engines["wajafapp"] = wajafapp.Engine
	xloggererror := logger.GetCoreLogger("errors")
	for _, engine := range engines {
		if engine.Source == "built-in" {
			continue
		}

		// TODO(phil) Recompile the engine if not exists (*Plugin)

		lib, err := plugin.Open(engine.Library)
		if err != nil {
			xloggererror.Println("Error loading engine library:", engine.Library, err)
			continue
		}

		enginelink, err := lib.Lookup("Engine")
		if err != nil {
			xloggererror.Println("Error linking engine main funcion Engine:", err)
			continue
		}

		interf, ok := enginelink.(assets.Engine)
		if !ok {
			xloggererror.Println("Error linking engine main funcion Engine, is not of type assets.Engine.")
			continue
		}
		Engines[engine.Name] = interf
	}
}

type Server struct {
	writer   http.ResponseWriter
	reader   *http.Request
	Method   string
	Page     string
	Listener *config.Listener
	Host     *assets.Host

	PagesDir      string
	Code          int
	MainContext   *assets.Context
	Recursivity   map[string]int
	GZipCandidate bool
}

func (s *Server) Start(w http.ResponseWriter, r *http.Request) {

	defer func() {
		if r := recover(); r != nil {
			hlogger := logger.GetHostLogger(s.Host.Name, "errors")
			hlogger.Println("Recovered in Server.Start", r, string(debug.Stack()))
			w.(*CoreWriter).RequestStat.Code = http.StatusInternalServerError
		}
	}()

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
		// WE DO NOT ACCEPT ENDING / SO MAKE AUTOMATICALLY A REDIRECT TO THE SAME PAGE WITHOUT A / AT THE END BUT STARTING WITH /
		// TODO(phil) should be an option
		page = "/" + page[:len(page)-1]
		s.launchRedirect(page)
		return
	}

	if len(page) == 0 {
		page, _ = s.Host.Config.GetString("mainpage")
	}

	code := s.Run(page, false, nil, "", "", "")

	// check if returned code is string, else "print" it
	scode, ok := code.(string)
	if !ok {
		scode = fmt.Sprint(code)
	}

	// Last pass: minify if necesary and gzip if necesary. Content type Should be set by the Run function, main page is always resolved to a content type
	contenttype := s.writer.Header().Get("Content-Type")

	if s.Host.Minify.Enabled {
		// check config if we will minify before sending code
		m := minify.New()
		if s.Host.Minify.CSS {
			m.AddFunc("text/css", css.Minify)
		}
		if s.Host.Minify.HTML {
			html.DefaultMinifier.KeepDocumentTags = true
			m.AddFunc("text/html", html.Minify)
		}
		if s.Host.Minify.SVG {
			m.AddFunc("image/svg+xml", svg.Minify)
		}
		if s.Host.Minify.JS {
			m.AddFuncRegexp(regexp.MustCompile("^(application|text)/(x-)?(java|ecma)script$"), js.Minify)
		}
		if s.Host.Minify.JSON {
			m.AddFuncRegexp(regexp.MustCompile("[/+]json$"), json.Minify)
		}
		if s.Host.Minify.XML {
			m.AddFuncRegexp(regexp.MustCompile("[/+]xml$"), xml.Minify)
		}
		newcode, err := m.String(contenttype, scode)
		if err != nil {
			elogger := logger.GetHostLogger(s.Host.Name, "errors")
			elogger.Println(err)
		} else {
			scode = newcode
		}
	}

	// GZIPER based on content type?
	if s.MainContext != nil && s.MainContext.IsGZiped {
		s.writer.Header().Set("Content-Encoding", "gzip")
	} else {
		if s.GZipCandidate && utils.GzipMimeCandidate(s.Host.GZip.Mimes, contenttype) {
			s.writer.Header().Set("Content-Encoding", "gzip")
			s.writer.(*CoreWriter).CreateGZiper()
		}
	}

	if s.Code != http.StatusOK {
		s.writer.(*CoreWriter).RequestStat.Code = s.Code
		s.writer.WriteHeader(s.Code)
	}
	s.writer.Write([]byte(scode))
}

// The main xamboo runner
// innerpage is false for the default page call, true when it's a subcall (inner call, with context)
func (s *Server) Run(page string, innerpage bool, params interface{}, version string, language string, method string) interface{} {

	// page is the original page to scan
	// P is the scanned page
	P := page

	// ==========================================================
	// Chapter 1: Search the correct .page
	// ==========================================================
	acceptpathparameters, _ := s.Host.Config.GetBool("acceptpathparameters")
	pageserver := &engines.Page{
		PagesDir:             s.PagesDir,
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
			return s.launchError(page, http.StatusNotFound, innerpage, "Error 404: no page found .page for "+page)
		}
		fullpath = true
	}
	var xParams []string
	if P != page {
		if app, _ := pagedata.GetBool("acceptpathparameters"); !app {
			return s.launchError(page, http.StatusNotFound, innerpage, "Error 404: no page found with parameters")
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
		Code:                http.StatusOK,
		LocalPage:           page,
		LocalPageUsed:       P,
		LocalURLparams:      xParams,
		LoggerError:         logger.GetHostLogger(s.Host.Name, "errors"),
		Sysparams:           s.Host.Config,
		LocalPageparams:     pagedata,
		LocalInstanceparams: nil,
		LocalEntryparams:    params,
		Plugins:             s.Host.Plugins,
	}
	if innerpage {
		ctx.IsMainPage = false
		ctx.Language = s.MainContext.Language
		ctx.Version = s.MainContext.Version
		ctx.MainPage = s.MainContext.MainPage
		ctx.MainPageUsed = s.MainContext.MainPageUsed
		ctx.MainURLparams = s.MainContext.MainURLparams
		ctx.MainPageparams = s.MainContext.MainPageparams
		ctx.MainInstanceparams = s.MainContext.MainInstanceparams
		ctx.Sessionparams = s.MainContext.Sessionparams
	} else {

		// If user agent enabled, we analyze version of page based on connected device
		defversion, _ := s.Host.Config.GetString("version")
		if s.Host.Browser.UserAgent.Enabled {
			defversion = s.analyzeUserAgent()
		}
		deflanguage, _ := s.Host.Config.GetString("language")
		ctx.Language = deflanguage
		ctx.Version = defversion
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
	noparse, _ := pagedata.GetBool("keeporiginalbody")
	if !noparse {
		s.reader.ParseForm()
	}

	// homologation of servers
	// ===========================================================
	engine, ok := Engines[tp]
	if !ok {
		return s.launchError(page, http.StatusNotFound, innerpage, "Error: Server "+tp+" does not exist")
	}

	if !engine.NeedInstance() {
		// This engine does not need more than the .page itself.
		data := engine.Run(ctx, s)
		dataerror, okerr := data.(error)
		if okerr {
			return s.launchError(page, ctx.Code, innerpage, dataerror.Error())
		}
		return data
	}

	// ==========================================================
	// Chapter 2: Search the correct .instance with identities
	// ==========================================================

	versions := []string{}
	if len(version) > 0 && version != ctx.Version {
		versions = append(versions, version)
	}
	if len(ctx.Version) > 0 && version != ctx.Version {
		versions = append(versions, ctx.Version)
	}
	versions = append(versions, "")

	languages := []string{}
	if len(language) > 0 && language != ctx.Language {
		languages = append(languages, language)
	}
	if len(ctx.Language) > 0 && language != ctx.Language {
		languages = append(languages, ctx.Language)
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
		PagesDir: s.PagesDir,
	}

	var instancedata *xconfig.XConfig
	for _, n := range identities {
		instancedata = instanceserver.GetData(P, n)
		if instancedata != nil {
			break
		}
	}

	if instancedata == nil {
		return s.launchError(page, http.StatusInternalServerError, innerpage, "Error: the page/block has no instance")
	}

	// verify the possible recursion
	if r, c := s.verifyRecursion(P, ctx.LocalPageparams); r {
		return s.launchError(page, http.StatusInternalServerError, innerpage, "Error: the page/block is recursive: "+P+" after "+strconv.Itoa(c)+" times")
	}

	//  s.pushContext(innerpage, page, P, instancedata, params, version, language)

	// Cache system disabled for now
	// if s.getCache() return cache

	// ==========================================================
	// Chapter 3: Search the correct engine instance with identities
	// ==========================================================
	var engineinstance assets.EngineInstance
	for _, n := range identities {
		engineinstance = engine.GetInstance(s.Host.Name, s.PagesDir, P, n)
		if engineinstance != nil {
			break
		}
	}

	if engineinstance == nil {
		return s.launchError(page, http.StatusInternalServerError, innerpage, "Error: the engine could not find an instance to Run. Please verify the available instances.")
	}

	var templatedata *xcore.XTemplate = nil
	var languagedata *xcore.XLanguage = nil
	if engineinstance.NeedLanguage() {
		for _, n := range identities {
			languageinstance := Engines["language"].GetInstance(s.Host.Name, s.PagesDir, P, n)
			if languageinstance != nil {
				lang := languageinstance.Run(ctx, nil, nil, s)
				if lang != nil {
					languagedata = lang.(*xcore.XLanguage)
					break
				}
			}
		}
	}
	if engineinstance.NeedTemplate() {
		for _, n := range identities {
			templateinstance := Engines["template"].GetInstance(s.Host.Name, s.PagesDir, P, n)
			if templateinstance != nil {
				temp := templateinstance.Run(ctx, nil, nil, s)
				if temp != nil {
					templatedata = temp.(*xcore.XTemplate)
					break
				}
			}
		}
	}

	// Call StartContext of each applications, only on main page
	if !innerpage {
		for _, app := range s.Host.Applications {
			app.StartContext(ctx)
		}
	}

	data := engineinstance.Run(ctx, templatedata, languagedata, s)
	// if data is an error, launch the error page (the error has already been generated and handled)
	dataerror, okerr := data.(error)
	if okerr {
		return s.launchError(page, ctx.Code, innerpage, dataerror.Error())
	}
	_, okstr := data.(string)
	if innerpage && !okstr { // If Data is not string so it may be any type of data for the caller. We will not incapsulate it into a template, even if asked
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
	if x, _ := ctx.LocalPageparams.GetString("template"); x != "" {
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

	if !innerpage {
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

func wrapper(s interface{}, page string, params interface{}, version string, language string, method string) interface{} {
	return s.(*Server).Run(page, true, params, version, language, method)
}

func wrapperstring(s interface{}, page string, params interface{}, version string, language string, method string) string {
	data := s.(*Server).Run(page, true, params, version, language, method)
	if sdata, ok := data.(string); ok {
		return sdata
	}
	return fmt.Sprint(data)
}

func (s *Server) launchError(page string, code int, innerpage bool, message string) interface{} {
	// error page or error block?
	// WE LOG THIS ERROR: this is some programmation error normally
	elogger := logger.GetHostLogger(s.Host.Name, "errors")

	errpage := ""
	if innerpage {
		errpage, _ = s.Host.Config.GetString("errorblock")
		if errpage == "" || errpage == page {
			msg := "The config parameter errorblock is pointing to a non existing page. Please verify"
			elogger.Println(msg, code, page, message)
			return msg
		}
	} else {
		s.Code = code
		errpage, _ = s.Host.Config.GetString("errorpage")
		if errpage == "" || errpage == page {
			s.writer.Header().Set("Content-Type", "text/plain; charset=utf-8")
			msg := "The config parameter errorpage is pointing to a non existing page. Please verify"
			elogger.Println(msg, code, page, message)
			return msg
		}
	}
	data := map[string]interface{}{
		"page":    page,
		"code":    code,
		"message": message,
	}
	elogger.Println(code, page, message)
	return s.Run(errpage, innerpage, data, "", "", "")
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

func (s *Server) analyzeUserAgent() string {

	devices := map[uasurfer.DeviceType]string{
		uasurfer.DeviceComputer: "pc",
		uasurfer.DevicePhone:    "mobile",
		uasurfer.DeviceTablet:   "tablet",
		uasurfer.DeviceTV:       "tv",
		uasurfer.DeviceConsole:  "console",
		uasurfer.DeviceWearable: "wearable",
		uasurfer.DeviceUnknown:  "base",
	}

	useragent := s.reader.UserAgent()
	// Detect if PC or Mobile
	ua := uasurfer.Parse(useragent)
	return devices[ua.DeviceType]
}

// GetFullConfig for admin functions. See how to protect this
// TODO(phi) protect GetFullConfig
func (s *Server) GetFullConfig() *config.ConfigDef {
	return config.Config
}
