package prot

import (
	"bytes"
	"io/ioutil"
	"net/http"
	"regexp"
	"strings"

	"github.com/webability-go/xamboo/components/host"
	"github.com/webability-go/xamboo/config"
	"github.com/webability-go/xamboo/loggers"
)

var Component = &Prot{}

type Prot struct{}

func (prot *Prot) Start() {
}

func (prot *Prot) StartHost(host *config.Host) {
}

func (prot *Prot) NeedHandler() bool {
	return true
}

func (prot *Prot) Handler(handler http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

		slg := loggers.GetCoreLogger("errors")

		hw, ok := w.(host.HostWriter)
		if !ok {
			slg.Println("C[prot]: Critical error: the writer is not a HostWriter (and that should not happen)", r, w)
			http.Error(w, "C[prot]: Writer error (see logs for more info)", http.StatusInternalServerError)
			return
		}
		host := hw.GetHost()
		if host == nil {
			slg.Println("C[prot]: Critical error: there is no HOST in the host writer (and that should not happen)", r, w)
			http.Error(w, "C[prot]: Writer error (see logs for more info)", http.StatusInternalServerError)
			return
		}

		lg := loggers.GetHostLogger(host.Name, "sys")
		if host.Debug {
			lg.Println("C[prot]: We are going to verify the SQL Injection Protector, enabled:", host.Prot.Enabled)
		}

		if host.Prot.Enabled {

			// IP blacklist
			if len(host.Prot.IPBlackList) > 0 {
				if ipmatch(r.RemoteAddr, host.Prot.IPBlackList) {
					slg.Println("C[prot]: IP BLACKLIST MATCH FOUND:", r)
					http.Error(w, "C[prot]: IP BLACKLIST MATCH FOUND by Xamboo Protection System", http.StatusInternalServerError)
					return
				}
			}

			// SQL injection
			if host.Prot.SQL {
				// Search into request specific keywords:
				// SELECT UPDATE DELETE INSERT COALESCE FROM TABLE ORDER GROUP WHERE /**/ AND OR
				syntax := `(?si)` + // . is multiline and case insensitive

					// keywords
					`\bselect\b` +
					`|\binsert\b` +
					`|\bupdate\b` +
					`|\bdelete\b` +
					`|\bcoalesce\b` +
					`|\bfrom\b` +
					`|\btable\b` +
					`|\bwhere\b` +
					`|\border\b` +
					`|\bgroup\b` +
					`|\blimit\b` +
					`|\bhaving\b` +
					`|\bjoin\b` +
					`|\band\b` +
					`|\bor\b` +
					`|\/\*\*\/`

				codex := regexp.MustCompile(syntax)

				ignored := map[string]bool{}
				for _, i := range host.Prot.Ignore {
					ignored[i] = true
				}

				cr := r.Clone(r.Context())
				body, err := ioutil.ReadAll(r.Body)
				if err != nil {
					http.Error(w, "C[prot]: Cannot read the body of request", http.StatusInternalServerError)
					return
				}
				// clone body
				r.Body = ioutil.NopCloser(bytes.NewReader(body))
				cr.Body = ioutil.NopCloser(bytes.NewReader(body))

				cr.ParseForm()
				nummatch := 0
				for p, v := range cr.Form {
					// ignore variables
					if ignored[p] {
						continue
					}
					data := strings.Join(v, " ")
					indexes := codex.FindAllStringIndex(data, -1)
					nummatch += len(indexes)
				}

				if nummatch >= host.Prot.Threshold { // threshold to have a real query
					slg.Println("C[prot]: SQL INJECTION MATCH FOUND:", r)
					http.Error(w, "C[prot]: SQL INJECTION MATCH FOUND by Xamboo Protection System", http.StatusInternalServerError)
					return
				}

			}
		}

		if host.Debug {
			lg.Println("C[Prot]: Protector not activated. We are going to serve the handler.")
		}
		handler.ServeHTTP(w, r)
		if host.Debug {
			lg.Println("C[Prot]: We have served the handler.")
		}
	}
}

func ipmatch(ip string, list []string) bool {
	// simple match of IPs
	for _, m := range list {
		if ip == m {
			return true
		}
		if len(ip) > len(m) && ip[:len(m)] == m {
			return true
		}
	}
	return false
}
