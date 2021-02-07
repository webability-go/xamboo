package stat

import (
	//	"fmt"
	"net/http"

	"github.com/webability-go/xamboo/components/host"
)

var Component = &Stat{}

type Stat struct{}

func (auth *Stat) NeedHandler() bool {
	return true
}

func (auth *Stat) Handler(handler http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

		hostdata := w.(host.HostWriter).GetHost()

		req := CreateRequestStat(r.Host+r.URL.Path, r.Method, r.Proto, 0, 0, 0, r.RemoteAddr)
		req.Hostname = hostdata.Name
		sw := writer{writer: w.(host.HostWriter), RequestStat: req}

		//		fmt.Println("PRE STAT HANDLER")
		handler.ServeHTTP(&sw, r)
		//		fmt.Println("POST STAT HANDLER: ", sw.status, sw.length, sw.lengthnotcompressed, sw.lengthnotminified)

		req.UpdateStat(sw.status, sw.length)
		req.End()
	}
}
