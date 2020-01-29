package main

import (
	//  "fmt"
	"bytes"
	"compress/gzip"

	"github.com/webability-go/xamboo/engine/context"
	"github.com/webability-go/xcore"
	//	"github.com/webability-go/xamboo/example/app/bridge"
)

/* This function is MANDATORY and is the point of call from the xamboo
   The enginecontext contains all what you need to link with the system
*/
func Run(ctx *context.Context, template *xcore.XTemplate, language *xcore.XLanguage, e interface{}) string {

	filetype := ctx.Request.Form.Get("type")
	switch filetype {
	case "html":
		ctx.Writer.Header().Set("Content-Type", "text/html")
		return "<h1>text HTML</h1>"
	case "css":
		ctx.Writer.Header().Set("Content-Type", "text/css")
		return "body { background-color: red; }"
	case "js":
		ctx.Writer.Header().Set("Content-Type", "application/javascript")
		return "alert('Hello world');"
	case "text":
		ctx.Writer.Header().Set("Content-Type", "text")
		return "Plain text.\n"
	case "gziphtml":
		ctx.Writer.Header().Set("Content-Type", "text/html")

		html := "<h1>This is a gziped content by library code and sent to the client already zipped. The xamboo must not gzip it again even with a text/html mime type</h1>"
		var b bytes.Buffer
		gz := gzip.NewWriter(&b)
		if _, err := gz.Write([]byte(html)); err != nil {
			return "ERROR GZIPING"
		}
		if err := gz.Close(); err != nil {
			return "ERROR GZIPING"
		}
		ctx.IsGZiped = true
		return string(b.Bytes())
	case "gzipjs":
		ctx.Writer.Header().Set("Content-Type", "application/javascript")

		html := "/* This is a gziped content by library code and sent to the client already zipped. The xamboo must add gzip headers even if it's not a gzip mime by config */\nalert('Hello world');\n"
		var b bytes.Buffer
		gz := gzip.NewWriter(&b)
		if _, err := gz.Write([]byte(html)); err != nil {
			return "ERROR GZIPING"
		}
		if err := gz.Close(); err != nil {
			return "ERROR GZIPING"
		}
		ctx.IsGZiped = true
		return string(b.Bytes())
	}

	return "Add ?type= to the url to get <b>html</b> page, <b>css</b> file, <b>js</b> file, plain <b>text</b> file from a library code. Only html and css should be compressed. Put <b>gziphtml</b> and <b>gzipjs</b> to get a gzip compressed file by page library, not by xamboo (native)"
}
