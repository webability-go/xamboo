package simple

import (
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"
	"regexp"
	"strconv"
	"strings"

	"github.com/webability-go/xcore/v2"

	"github.com/webability-go/xamboo/cms/context"
	"github.com/webability-go/xamboo/cms/engines/assets"
	"github.com/webability-go/xamboo/cms/identity"
	"github.com/webability-go/xamboo/utils"
)

const (
	MetaString             = 0  // a simple string to integrate into the code
	MetaURLParams          = 1  // the full URL parameters list passed to the code runner [page]/value1/value2...
	MetaURLParam           = 2  // one param of the URL parameters list, index-1 based [page]/value1/value2...
	MetaURLVariable        = 3  // an URL variable coming through a query ?variable=value
	MetaParam              = 4  // Parameter passed to the page Run by code
	MetaSysParam           = 5  // System (site) parameter
	MetaPageParam          = 6  // Main page called parameters (into .page file)
	MetaLocalPageParam     = 7  // this page parameters (into .page file), same as Main page parameters if it's the external called page
	MetaInstanceParam      = 8  // Main page instance called parameters (into .instance file)
	MetaLocalInstanceParam = 9  // this page instance parameters (into .instance file), same as Main page instance parameters if it's the external called page
	MetaSessionParam       = 10 // Parameter into the session params
	MetaJS                 = 11 // Call a JS file to include into page headers
	MetaCSS                = 12 // Call a CSS file to include into page headers
	MetaCall               = 13 // Call a sub block to insert here
	MetaLanguage           = 14 // Insert a language entry
	MetaComment            = 15 // Comment, ignore it
	MetaBox                = 16 // Nested box with inner data

	MetaTemporaryBoxStart = 101 // Temporal nested box start tag
	MetaTemporaryBoxEnd   = 102 // Temporal nested box end tag

	MetaUnused = -1 // a "not used anymore" param to be freed
)

var CodeCache = xcore.NewXCache("code", 0, 0)

func init() {
	CodeCache.Validator = utils.FileValidator
}

var Engine = &SimpleEngine{}

type SimpleEngine struct{}

func (re *SimpleEngine) NeedInstance() bool {
	// The simple engine does need instance and identity
	return true
}

func (re *SimpleEngine) GetInstance(Hostname string, PagesDir string, P string, i identity.Identity) assets.EngineInstance {

	lastpath := utils.LastPath(P)
	filepath := PagesDir + P + "/" + lastpath + i.Stringify() + ".code"

	if utils.FileExists(filepath) {
		// load the page instance
		data := &SimpleEngineInstance{
			FilePath: filepath,
		}
		return data
	}
	return nil
}

func (se *SimpleEngine) Run(ctx *context.Context, s interface{}) interface{} {
	return nil
}

type SimpleEngineInstance struct {
	FilePath string
}

func (p *SimpleEngineInstance) NeedLanguage() bool {
	return true
}

func (p *SimpleEngineInstance) NeedTemplate() bool {
	return false
}

// context contains all the page context and history
// params are an array of strings (if page from outside) or a mapped array of data (inner pages)
func (p *SimpleEngineInstance) Run(ctx *context.Context, template *xcore.XTemplate, language *xcore.XLanguage, e interface{}) interface{} {

	var compiled CodeData
	cdata, _ := CodeCache.Get(p.FilePath)
	if cdata != nil {
		compiled = cdata.(CodeData)
	} else {
		data, err := ioutil.ReadFile(p.FilePath)
		if err != nil {
			errortext := "Error; .code file unavailable " + p.FilePath
			ctx.Code = http.StatusInternalServerError
			ctx.LoggerError.Println(errortext)
			return errors.New(errortext)
		}
		compiled = compileCode(string(data))
		CodeCache.Set(p.FilePath, compiled)
	}

	return compiled.Inject(ctx, language, e)
}

type CodeParam struct {
	paramtype int
	data1     string
	data2     string
	children  *CodeData
	params    *map[string]interface{}
}

type CodeData []CodeParam

func compileCode(data string) CodeData {
	// build, compile return result
	code :=
		`(?s)` + // . is multiline
			`\[\[(U)RLPARAMS\]\]` + // index based 1, ALL THE URL PARAMS [page]/value1/value2/value3
			`|\[\[(U)RLPARAM\,(.*?)\]\]` + // index based 2, One URL param, index-1 based
			`|\[\[(V)AR\,(.*?)\]\]` + // index based 4, URL variable from FORM(POST/PUT) or query string ?param1=value
			`|\[\[(P)ARAM\,(.*?)\]\]` + // index based 6,
			`|\[\[(S)YSPARAM\,(.*?)\]\]` + // index based 8
			`|\[\[(P)AGEPARAM\,(.*?)\]\]` + // index based 10
			`|\[\[(L)OCALPAGEPARAM\,(.*?)\]\]` + // index based 12
			`|\[\[(I)NSTANCEPARAM\,(.*?)\]\]` + // index based 14
			`|\[\[(L)OCALINSTANCEPARAM\,(.*?)\]\]` + // index based 16
			`|\[\[(SE)SSIONPARAM\,(.*?)\]\]` + // index based 18
			`|\[\[(J)S\,(.*?)\]\]` + // index based 20
			`|\[\[(C)SS\,(.*?)\]\]` + // index based 22
			`|\[\[(C)ALL\,(.*?)(\:(.*?)){0,1}\]\]` + // index based 24

			// ==== LANGUAGE INJECTION
			`|(#)#(.*?)##` + // index based 28

			// ==== COMENTS
			`|(%)--(.*?)--%\n?` + // index based 30

			// ==== NESTED BOXES
			`|\[\[(B)OX\,(.*?)\:` + // index based 32
			`|(B)OX\]\]` // index based 34

	codex := regexp.MustCompile(code)
	indexes := codex.FindAllStringIndex(data, -1)
	matches := codex.FindAllStringSubmatch(data, -1)

	var compiled CodeData
	pointer := 0
	for i, x := range indexes {
		if pointer != x[0] {
			compiled = append(compiled, *(&CodeParam{paramtype: MetaString, data1: data[pointer:x[0]]}))
		}

		param := &CodeParam{}
		if matches[i][1] == "U" {
			param.paramtype = MetaURLParams // all URL params string
		} else if matches[i][2] == "U" {
			param.paramtype = MetaURLParam // one URL entry param
			param.data1 = matches[i][3]
		} else if matches[i][4] == "V" {
			param.paramtype = MetaURLVariable // URL variable, PUT/POST, GET, ""
			param.data1 = matches[i][5]
		} else if matches[i][6] == "P" {
			param.paramtype = MetaParam // Entry Param
			param.data1 = matches[i][7]
		} else if matches[i][8] == "S" {
			param.paramtype = MetaSysParam // sysparam
			param.data1 = matches[i][9]
		} else if matches[i][10] == "P" {
			param.paramtype = MetaPageParam // pageparam
			param.data1 = matches[i][11]
		} else if matches[i][12] == "L" {
			param.paramtype = MetaLocalPageParam // local pageparam
			param.data1 = matches[i][13]
		} else if matches[i][14] == "I" {
			param.paramtype = MetaInstanceParam // instance param
			param.data1 = matches[i][15]
		} else if matches[i][16] == "L" {
			param.paramtype = MetaLocalInstanceParam // local instance param
			param.data1 = matches[i][17]
		} else if matches[i][18] == "SE" {
			param.paramtype = MetaSessionParam // session param
			param.data1 = matches[i][19]
		} else if matches[i][20] == "J" {
			param.paramtype = MetaJS // javascript call for header
			param.data1 = matches[i][21]
		} else if matches[i][22] == "C" {
			param.paramtype = MetaCSS // css call for header
			param.data1 = matches[i][23]
		} else if matches[i][24] == "C" {
			param.paramtype = MetaCall   // another block call
			param.data1 = matches[i][25] // block to call
			param.data2 = matches[i][27] // parameters
		} else if matches[i][28] == "#" {
			param.paramtype = MetaLanguage // language entry
			param.data1 = matches[i][29]
		} else if matches[i][30] == "%" {
			param.paramtype = MetaComment // comment
			param.data1 = matches[i][31]
		} else if matches[i][32] == "B" {
			param.paramtype = MetaTemporaryBoxStart // nested box, temporal value
			param.data1 = matches[i][33]
		} else if matches[i][34] == "B" {
			param.paramtype = MetaTemporaryBoxEnd // nested box end, temporal value, to be delete at end
		} else {
			param.paramtype = MetaUnused // unknown, will be removed
		}
		compiled = append(compiled, *param)
		pointer = x[1]
	}
	// end of data
	if pointer != len(data) {
		compiled = append(compiled, *(&CodeParam{paramtype: MetaString, data1: data[pointer:]}))
	}

	// second pass: all the nested boxes goes into a subset
	startpointers := []int{}
	for i, x := range compiled {
		if x.paramtype == MetaTemporaryBoxStart {
			startpointers = append(startpointers, i)
		} else if x.paramtype == MetaTemporaryBoxEnd {
			// we found the end of the nested box, lets create a nested param array from stacked startpointer up to i
			last := len(startpointers) - 1
			startpointer := startpointers[last]
			startpointers = startpointers[:last]

			var subset CodeData
			for ptr := startpointer + 1; ptr < i; ptr++ { // we ignore the BOX]] end param (we dont need it in the hierarchic structure)
				if compiled[ptr].paramtype != MetaUnused { // we just ignore params marked to be deleted
					subset = append(subset, compiled[ptr])
					compiled[ptr].paramtype = MetaUnused // marked to be deleted, traslated to a substructure
				}
			}
			compiled[startpointer].paramtype = MetaBox
			compiled[startpointer].children = &subset
			compiled[i].paramtype = MetaUnused // marked to be deleted, on need of end box
		}
	}

	// last pass: delete params marked to be deleted
	currentpointer := 0
	for i, x := range compiled {
		if x.paramtype != MetaUnused {
			if currentpointer != i {
				compiled[currentpointer] = x
			}
			currentpointer += 1
		}
	}
	compiled = compiled[:currentpointer]

	return compiled
}

func (c *CodeData) Inject(ctx *context.Context, language *xcore.XLanguage, e interface{}) string {
	// third pass: inject meta language
	var injected []string
	for _, v := range *c {
		switch v.paramtype {
		case MetaString: // included string from original code
			injected = append(injected, v.data1)
		case MetaURLParams: // URL Params
			injected = append(injected, strings.Join(ctx.MainURLparams, "/"))
		case MetaURLParam: // One URL Param
			i, err := strconv.Atoi(v.data1)
			if err == nil && i-1 >= 0 && i-1 < len(ctx.MainURLparams) {
				injected = append(injected, ctx.MainURLparams[i-1])
			}
		case MetaURLVariable: // URL Variable (POST/PUT then GET then "")
			// 1. search into POST/PUT (for already parsed by main engine Start call) then GET, or ""
			pm := ctx.Request.Form.Get(v.data1)
			injected = append(injected, pm)
		case MetaParam: // Entry (Run) Param
			if ctx.LocalEntryparams != nil { // params are set
				pm, ok := (ctx.LocalEntryparams).(map[string]interface{})[v.data1]
				if ok { // entry exists
					injected = append(injected, fmt.Sprint(pm))
				}
			}
		case MetaSysParam: // sys param
			pm, ok := ctx.Sysparams.Get(v.data1)
			if ok {
				injected = append(injected, fmt.Sprint(pm))
			}
		case MetaPageParam: // main page params
			pm, ok := ctx.MainPageparams.Get(v.data1)
			if ok {
				injected = append(injected, fmt.Sprint(pm))
			}
		case MetaLocalPageParam: // local page params
			pm, ok := ctx.LocalPageparams.Get(v.data1)
			if ok {
				injected = append(injected, fmt.Sprint(pm))
			}
		case MetaInstanceParam: // main instance params
			pm, ok := ctx.MainInstanceparams.Get(v.data1)
			if ok {
				injected = append(injected, fmt.Sprint(pm))
			}
		case MetaLocalInstanceParam: // local instance params
			pm, ok := ctx.LocalInstanceparams.Get(v.data1)
			if ok {
				injected = append(injected, fmt.Sprint(pm))
			}
		case MetaSessionParam: // sys param
			pm, ok := ctx.Sessionparams.Get(v.data1)
			if ok {
				injected = append(injected, fmt.Sprint(pm))
			}
		case MetaJS: // JS Call for Header
			// JS can be called (script src=) or inserted inline (script code)
			injected = append(injected, "JS CALL NOT IMPLEMENTED YET: "+v.data1)
		case MetaCSS: // CSS Call for Header
			// CSS can be called (link src=) or inserted inline (style code)
			injected = append(injected, "CSS CALL NOT IMPLEMENTED YET: "+v.data1)
		case MetaCall:
			// build the params

			injected = append(injected, context.EngineWrapperString(e, v.data1, nil, "", "", ""))
		case MetaLanguage:
			if language != nil {
				injected = append(injected, language.Get(v.data1))
			}
		case MetaComment:
			// nothing to do: comment ignored
		case MetaBox:
			innerdata := v.children.Inject(ctx, language, e)
			outerdata := context.EngineWrapperString(e, v.data1, nil, "", "", "")
			injected = append(injected, strings.Replace(outerdata, "[[CONTENT]]", innerdata, -1))
		default:
			injected = append(injected, "THE METALANGUAGE FROM OUTERSPACE IS NOT SUPPORTED: "+fmt.Sprint(v.paramtype)) // should NEVER happen
		}
	}
	// return the page string
	return strings.Join(injected, "")
}
