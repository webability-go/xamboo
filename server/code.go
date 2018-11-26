package server

import (
  "io/ioutil"
  "regexp"
  "strings"
//  "fmt"
//  "github.com/webability-go/xconfig"
  "github.com/webability-go/xamboo/utils"
  "github.com/webability-go/xamboo/xcontext"
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
      `|\[\[(C)LIENTPARAM\,(.*?)\]\]`+                                                    // index based 10
      `|\[\[(P)AGEPARAM\,(.*?)\]\]`+                                                      // index based 12
      `|\[\[(L)OCALPAGEPARAM\,(.*?)\]\]`+                                                 // index based 14
      `|\[\[(I)NSTANCEPARAM\,(.*?)\]\]`+                                                  // index based 16
      `|\[\[(L)OCALINSTANCEPARAM\,(.*?)\]\]`+                                             // index based 18
      `|\[\[(V)AR\,(.*?)\]\]`+                                                            // index based 20
      `|\[\[(J)S\,(.*?)\]\]`+                                                             // index based 22
      `|\[\[(C)SS\,(.*?)\]\]`+                                                            // index based 24

      // ==== Level 10 meta code (no params, content)

      // ==== Level 11 meta code (params, content)
      `|\[\[(G)O(\,.*?){0,1}\:(.*?)GO\]\]`+                                               // index based 26
      `|\[\[(C)ALL\,(.*?)(\:(.*?)){0,1}\]\]`+                                             // index based 29

      // ==== LANGUAGE
      `|(#)#(.*?)##`+                                                                     // index based 32

      // ==== COMENTS
      `|(%)--(.*?)--%`+                                                                   // index based 34

      // ==== NESTED BOXES
      `|\[\[(B)OX\,(.*?)\:`+                                                              // index based 36
      `|(B)OX\]\]`                                                                        // index based 38

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
    } else if matches[i][10] == "C" {
      param.paramtype = 6  // clientparam
      param.data1 = matches[i][11]
    } else if matches[i][12] == "P" {
      param.paramtype = 7  // pageparam
      param.data1 = matches[i][13]
    } else if matches[i][14] == "L" {
      param.paramtype = 8  // local pageparam
      param.data1 = matches[i][15]
    } else if matches[i][16] == "I" {
      param.paramtype = 9  // instance param
      param.data1 = matches[i][17]
    } else if matches[i][18] == "L" {
      param.paramtype = 10  // local instance param
      param.data1 = matches[i][19]
    } else if matches[i][20] == "V" {
      param.paramtype = 11  // url variable
      param.data1 = matches[i][21]
    } else if matches[i][22] == "J" {
      param.paramtype = 12  // javascript call for header
      param.data1 = matches[i][23]
    } else if matches[i][24] == "C" {
      param.paramtype = 13  // css call for header
      param.data1 = matches[i][25]
    } else if matches[i][26] == "G" {
      param.paramtype = 14  // go function call
      param.data1 = matches[i][27]
      param.data2 = matches[i][28]
    } else if matches[i][29] == "C" {
      param.paramtype = 15  // another block call
      param.data1 = matches[i][30]
      param.data2 = matches[i][31]
    } else if matches[i][32] == "#" {
      param.paramtype = 16  // language
      param.data1 = matches[i][33]
    } else if matches[i][34] == "%" {
      param.paramtype = 17  // comment
      param.data1 = matches[i][35]
    } else if matches[i][36] == "B" {
      param.paramtype = 18  // nested box
      param.data1 = matches[i][37]
    } else if matches[i][38] == "B" {
      param.paramtype = 19  // nested box end
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

func (p *CodeStream) Run(ctx *xcontext.Context) string {

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
      case 0: injected = append(injected, v.data1)
      default: injected = append(injected, "METALANGUAGE")
    }
  }
  // return the page string
  return strings.Join(injected, "")
}
