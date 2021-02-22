package stat

import (
	"net/http"

	"github.com/webability-go/xamboo/components/host"
	"github.com/webability-go/xamboo/config"
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

		hostwriter := w.(host.HostWriter)
		hostdata := hostwriter.GetHost()

		hw := w.(host.HostWriter)

		req := CreateRequestStat(r.Host+r.URL.Path, r.Method, r.Proto, 0, 0, 0, r.RemoteAddr)
		req.Hostname = hostdata.Name
		sw := writer{writer: hw, RequestStat: req}
		hw.SetParam("RequestStat", req)

		//		fmt.Println("PRE STAT HANDLER")
		handler.ServeHTTP(&sw, r)
		//		fmt.Println("POST STAT HANDLER: ", sw.status, sw.length, sw.lengthnotcompressed, sw.lengthnotminified)

		req.UpdateStat(sw.status, sw.length)
		req.End()
		// Send the stats data to the Params of hostwriter
		hostwriter.SetParam("requeststat", req)

	}
}
