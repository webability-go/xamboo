package redirect

import (
	"net/http"

	"github.com/webability-go/xamboo/server/assets"
)

var Engine = &RedirectEngine{}

type RedirectEngine struct{}

func (re *RedirectEngine) NeedInstance() bool {
	// The redirect engine does not need any more data than the .page itself
	return false
}

func (re *RedirectEngine) GetInstance(Hostname string, PagesDir string, P string, i assets.Identity) assets.EngineInstance {
	// The redirect engine does not need any more data than the .page itself
	return nil
}

func (re *RedirectEngine) Run(ctx *assets.Context, s interface{}) interface{} {
	if ctx.IsMainPage {
		if url, _ := ctx.MainPageparams.GetString("redirecturl"); url != "" {
			// Call the redirect mecanism
			code, _ := ctx.MainPageparams.GetInt("redirectcode")
			if code != http.StatusMovedPermanently && code != http.StatusFound && code != http.StatusTemporaryRedirect && code != http.StatusPermanentRedirect {
				code = http.StatusPermanentRedirect
			}
			http.Redirect(ctx.Writer, ctx.Request, url, code)
			return ""
		}
	}
	ctx.LoggerError.Println("Please specify redirecturl and redirectcode in .page")
	return "Please specify redirecturl and redirectcode in .page"
}
