package stat

import (
	"net/http"

	"github.com/webability-go/xamboo/components/host"
	"github.com/webability-go/xamboo/config"
	"github.com/webability-go/xamboo/loggers"
)

var Component = &Stat{}

type Stat struct{}

func (st *Stat) Start() {
	StartStat()
}

func (st *Stat) StartHost(host *config.Host) {
}

func (st *Stat) NeedHandler() bool {
	return true
}

func (st *Stat) Handler(handler http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

		slg := loggers.GetCoreLogger("errors")

		hw, ok := w.(host.HostWriter)
		if !ok {
			slg.Println("C[log]: Critical error: the writer is not a HostWriter (and that should not happen)", r, w)
			http.Error(w, "C[log]: Writer error (see logs for more info)", http.StatusInternalServerError)
			return
		}
		host := hw.GetHost()
		if host == nil {
			slg.Println("C[log]: Critical error: there is no HOST in the host writer (and that should not happen)", r, w)
			http.Error(w, "C[log]: Writer error (see logs for more info)", http.StatusInternalServerError)
			return
		}

		lg := loggers.GetHostLogger(host.Name, "sys")
		if host.Debug {
			lg.Println("C[stat]: We are going to create the statwriter.")
		}

		req := CreateRequestStat(r.Host+r.URL.Path, r.Method, r.Proto, 0, 0, 0, r.RemoteAddr)
		req.Hostname = host.Name
		sw := writer{writer: hw, RequestStat: req}
		hw.SetParam("RequestStat", req)

		if host.Debug {
			lg.Println("C[stat]: statwriter created, we are going to serve the handler.")
		}
		//		fmt.Println("PRE STAT HANDLER")
		handler.ServeHTTP(&sw, r)
		//		fmt.Println("POST STAT HANDLER: ", sw.status, sw.length, sw.lengthnotcompressed, sw.lengthnotminified)
		if host.Debug {
			lg.Println("C[stat]: We have served the handler. Stats will be updated and request ended.")
		}

		req.UpdateStat(sw.status, sw.length)
		req.End()
		// Send the final stats data to the Params of hostwriter
		hw.SetParam("RequestStat", req)
	}
}
