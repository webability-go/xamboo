package server

import (
  "io/ioutil"
  "regexp"
  "strings"
//  "fmt"
//  "github.com/webability-go/xconfig"
  "github.com/webability-go/xamboo/utils"
  "github.com/webability-go/xamboo/enginecontext"
)

var CodeCache = NewCache()

type Code struct {
  PagesDir string
}

type CodeStream struct {
  FilePath string
}

func (p *Code) GetData(P string, i Identity) *CodeStream {
  // build File Path:
  lastpath := utils.LastPath(P)
  filepath := p.PagesDir + P + "/" + lastpath + i.Stringify() + ".code"

  if utils.FileExists(filepath) {
    // load the page instance
    data := &CodeStream{
      FilePath: filepath,
    }
    return data
  }
  
  return nil
}

type Param struct {
  paramtype int
  data1 string
  data2 string
}

func compileCode(data string) []Param {
  // build, compile return result
  code := 
      // ==== Level 00 meta code (no param, no content)
      `\[\[(W)IDGETS\]\]`+                                                                // index based 1

      // ==== Level 01 meta code (params, no content)
      `|\[\[(P)ARAM\,(.*?)\]\]`+                                                          // index based 2
      `|\[\[(W)IDGETS\,(.*?)\]\]`+                                                        // index based 4
      `|\[\[(L)INK\,(.*?)\]\]`+                                                           // index based 6
      `|\[\[(S)YSPARAM\,(.*?)\]\]`+                                                       // index based 8
      `|\[\[(P)AGEPARAM\,(.*?)\]\]`+                                                      // index based 10
      `|\[\[(L)OCALPAGEPARAM\,(.*?)\]\]`+                                                 // index based 12
      `|\[\[(I)NSTANCEPARAM\,(.*?)\]\]`+                                                  // index based 14
      `|\[\[(L)OCALINSTANCEPARAM\,(.*?)\]\]`+                                             // index based 16
      `|\[\[(V)AR\,(.*?)\]\]`+                                                            // index based 18
      `|\[\[(J)S\,(.*?)\]\]`+                                                             // index based 20
      `|\[\[(C)SS\,(.*?)\]\]`+                                                            // index based 22

      // ==== Level 10 meta code (no params, content)

      // ==== Level 11 meta code (params, content)
      `|\[\[(G)O(\,.*?){0,1}\:(.*?)GO\]\]`+                                               // index based 24
      `|\[\[(C)ALL\,(.*?)(\:(.*?)){0,1}\]\]`+                                             // index based 27

      // ==== LANGUAGE
      `|(#)#(.*?)##`+                                                                     // index based 30

      // ==== COMENTS
      `|(%)--(.*?)--%`+                                                                   // index based 32

      // ==== NESTED BOXES
      `|\[\[(B)OX\,(.*?)\:`+                                                              // index based 34
      `|(B)OX\]\]`                                                                        // index based 36

  codex := regexp.MustCompile(code)
  indexes := codex.FindAllStringIndex(data, -1)
  matches := codex.FindAllStringSubmatch(data, -1)

  var compiled []Param
  pointer := 0
  for i, x := range indexes {
    compiled = append(compiled, *(&Param{paramtype: 0, data1: data[pointer:x[0]],}))
    
    param := &Param{}
    if matches[i][1] == "W" {
      param.paramtype = 1  // simple widget
    } else if matches[i][2] == "P" {
      param.paramtype = 2  // entry param
      param.data1 = matches[i][3]
    } else if matches[i][4] == "W" {
      param.paramtype = 3  // named widget
      param.data1 = matches[i][5]
    } else if matches[i][6] == "L" {
      param.paramtype = 4  // link
      param.data1 = matches[i][7]
    } else if matches[i][8] == "S" {
      param.paramtype = 5  // sysparam
      param.data1 = matches[i][9]
    } else if matches[i][10] == "P" {
      param.paramtype = 6  // pageparam
      param.data1 = matches[i][11]
    } else if matches[i][12] == "L" {
      param.paramtype = 7  // local pageparam
      param.data1 = matches[i][13]
    } else if matches[i][14] == "I" {
      param.paramtype = 8  // instance param
      param.data1 = matches[i][15]
    } else if matches[i][16] == "L" {
      param.paramtype = 9  // local instance param
      param.data1 = matches[i][17]
    } else if matches[i][18] == "V" {
      param.paramtype = 10  // url variable
      param.data1 = matches[i][19]
    } else if matches[i][20] == "J" {
      param.paramtype = 11  // javascript call for header
      param.data1 = matches[i][21]
    } else if matches[i][22] == "C" {
      param.paramtype = 12  // css call for header
      param.data1 = matches[i][23]
    } else if matches[i][24] == "G" {
      param.paramtype = 13  // go function call
      param.data1 = matches[i][25]
      param.data2 = matches[i][26]
    } else if matches[i][27] == "C" {
      param.paramtype = 14  // another block call
      param.data1 = matches[i][28]
      param.data2 = matches[i][29]
    } else if matches[i][30] == "#" {
      param.paramtype = 15  // language
      param.data1 = matches[i][31]
    } else if matches[i][32] == "%" {
      param.paramtype = 16  // comment
      param.data1 = matches[i][33]
    } else if matches[i][34] == "B" {
      param.paramtype = 17  // nested box
      param.data1 = matches[i][35]
    } else if matches[i][36] == "B" {
      param.paramtype = 18  // nested box end
    } else {
      param.paramtype = -1   // unknown
    }
    compiled = append(compiled, *param)
    pointer = x[1]
  }
  // end of data
  compiled = append(compiled, *(&Param{paramtype: 0, data1: data[pointer:],}))
  
  // second pass: all the nested boxes goes into a subset



  return compiled
}

// context contains all the page context and history
// params are an array of strings (if page from outside) or a mapped array of data (inner pages)
func (p *CodeStream) Run(ctx *enginecontext.Context, e interface{}) string {

  var compiled []Param
  cdata := CodeCache.Get(p.FilePath)
  if cdata != nil {
    compiled = cdata.([]Param)
  } else {

    data, err := ioutil.ReadFile(p.FilePath)
    if err != nil {
      return "ERROR; .CODE FILE UNAVAILABLE " + p.FilePath
    }
    compiled = compileCode(string(data))
    CodeCache.Set(p.FilePath, compiled)
  }

  // third pass: inject meta language
  var injected []string
  for _, v := range compiled {
    switch v.paramtype {
      case 0: // included string from original code
        injected = append(injected, v.data1)
      case 1: // anonym widget (direct sub-pages)
        injected = append(injected, "WIDGETS")
      case 2: // upper param passed
        pm := "PARAM PASSED FROM HIGHER LEVEL " + v.data1
        injected = append(injected, pm)
      case 3: // named widget
        injected = append(injected, v.data1)
      case 4: // link
        injected = append(injected, v.data1)
      case 5: // sys param
        pm := ctx.Sysparams.Get(v.data1).(string)
        injected = append(injected, pm)
      case 6: injected = append(injected, v.data1)
      case 7: injected = append(injected, v.data1)
      case 8: injected = append(injected, v.data1)
      case 9: injected = append(injected, v.data1)
      case 10: injected = append(injected, v.data1)
      case 11: injected = append(injected, v.data1)
      case 12: injected = append(injected, v.data1)
      case 13: injected = append(injected, v.data1)
      case 14: injected = append(injected, ctx.Engine(e, v.data1, true, nil, "", "", ""))
      case 15: injected = append(injected, v.data1)
      case 16: injected = append(injected, v.data1)
      case 17: injected = append(injected, v.data1)
      default: injected = append(injected, "METALANGUAGE NOT RECOGNIZED")
    }
  }
  // return the page string
  return strings.Join(injected, "")
}

