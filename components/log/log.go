package log

import (
	"fmt"
	"net/http"
	"regexp"
	"strings"

	"github.com/webability-go/xamboo/loggers"

	"github.com/webability-go/xamboo/components/host"
	"github.com/webability-go/xamboo/components/stat"
)

var Component = &Log{}

type Log struct{}

func (log *Log) Start() {
}

func (log *Log) ConfigEntry() string {
	return "log"
}

func (log *Log) UnmarshalConfig() error {

	return nil
}

func (log *Log) NeedHandler() bool {
	return true
}

func (log *Log) Handler(handler http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

		// LOG will take data from params of Host, set by other modules

		hw, ok := w.(host.HostWriter)
		if !ok {
			fmt.Println("Log component: ERROR DETECTED: the writer is not a HostWriter or the Listener/Host is not set (and that should not happen)", r, w)
			http.Error(w, "Log component: Writer error", http.StatusInternalServerError)
			return
		}
		host := hw.GetHost()
		if host == nil {
			fmt.Println("Log component: ERROR DETECTED: there is no HOST (and that should not happen)", r, w)
			http.Error(w, "Log component: Writer error (see logs for more info)", http.StatusInternalServerError)
			return
		}

		handler.ServeHTTP(w, r)

		if host.Log.Enabled {
			// Read the PARAMS
			// Read the loggers
			// Log the data
			p := hw.GetParams()
			ireq, _ := p.Get("requeststat")
			req := ireq.(*stat.RequestStat)

			hlogger := loggers.GetHostLogger(req.Hostname, "pages")
			if hlogger != nil {
				hlogger.Println(BuildLogLine(host.Log.PagesFormat, buildLogParams(hw)))
			}
			slogger := loggers.GetHostHook(req.Hostname, "stats")
			if slogger != nil && req.Context != nil {
				slogger(req.Context)
			}

		}

	}
}

func buildLogParams(hw host.HostWriter) map[string]string {

	data := map[string]string{}

	// 1. Standart params
	host := hw.GetHost()
	listener := hw.GetListener()
	params := hw.GetParams()

	for id, p := range params.Parameters {
		if id == "requeststat" {
			if p.Value != nil {
				req, ok := p.Value.(*stat.RequestStat)
				if ok {
					data["requestid"] = fmt.Sprint(req.Id)
					data["starttime"] = fmt.Sprint(req.StartTime)
					data["endtime"] = fmt.Sprint(req.Time)
					data["request"] = fmt.Sprint(req.Request)
					data["method"] = fmt.Sprint(req.Method)
					data["code"] = fmt.Sprint(req.Code)
					data["bytesout"] = fmt.Sprint(req.Length)
					data["duration"] = fmt.Sprint(req.Duration)
					data["clientip"] = fmt.Sprint(req.IP)
					data["clientport"] = fmt.Sprint(req.Port)
				}
			}
			continue
		}
		data[id] = fmt.Sprint(p.Value)
	}
	// Some other important data
	data["listenerid"] = listener.Name
	data["listenerip"] = listener.IP
	data["listenerport"] = listener.Port
	data["protocol"] = listener.Protocol
	data["hostid"] = host.Name

	return data
}

func BuildLogLine(format string, params map[string]string) string {

	line := format
	for id, val := range params {
		line = strings.ReplaceAll(line, "%"+id+"%", val)
	}
	// The %xx% not replaced should be replaced with -
	var re = regexp.MustCompile("%[a-z]+%")
	line = re.ReplaceAllLiteralString(line, "-")
	return line
}
