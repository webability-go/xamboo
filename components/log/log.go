package log

import (
	"fmt"
	"net/http"
	"regexp"
	"strings"

	"github.com/webability-go/xamboo/components/host"
	"github.com/webability-go/xamboo/components/stat"
	"github.com/webability-go/xamboo/config"
	"github.com/webability-go/xamboo/loggers"
)

var Component = &Log{}

type Log struct{}

func (log *Log) Start() {
}

func (log *Log) StartHost(host *config.Host) {
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
		slg := loggers.GetCoreLogger("errors")

		hw, ok := w.(host.HostWriter)
		if !ok {
			slg.Println("C[log]: Critical error: the writer is not a HostWriter (and that should not happen)", r, w)
			http.Error(w, "C[log]: Writer error (see logs for more info)", http.StatusInternalServerError)
			return
		}
		hwhost := hw.GetHost()
		if hwhost == nil {
			slg.Println("C[log]: Critical error: there is no HOST in the host writer (and that should not happen)", r, w)
			http.Error(w, "C[log]: Writer error (see logs for more info)", http.StatusInternalServerError)
			return
		}

		lg := loggers.GetHostLogger(hwhost.Name, "sys")
		if hwhost.Debug {
			lg.Println("C[log]: We are going to serve the handler.")
		}

		handler.ServeHTTP(w, r)

		if hwhost.Debug {
			lg.Println("C[log]: We have served the handler, log enabled:", hwhost.Log.Enabled)
		}
		if hwhost.Log.Enabled {
			// Read the PARAMS
			// Read the loggers
			// Log the data
			p := hw.GetParams()
			ireq, _ := p.Get("requeststat")
			if ireq != nil {
				req, ok := ireq.(*stat.RequestStat)
				if ok {
					hlogger := loggers.GetHostLogger(req.Hostname, "pages")
					if hlogger != nil {
						hlogger.Println(BuildLogLine(hwhost.Log.PagesFormat, buildLogParams(hw)))
					}
					islogger := loggers.GetHostHook(req.Hostname, "stats")
					if islogger != nil {
						slogger, ok := islogger.(func(host.HostWriter))
						if ok {
							slogger(hw)
						}
					}
				}
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
		if id == "context" {
			continue
		}
		if id == "requeststat" {
			if p.Value != nil {
				req, ok := p.Value.(*stat.RequestStat)
				if ok {
					data["requestid"] = fmt.Sprint(req.Id)
					data["starttime"] = fmt.Sprint(req.StartTime)
					data["endtime"] = fmt.Sprint(req.Time)
					data["request"] = fmt.Sprint(req.Request)
					data["referer"] = fmt.Sprint(req.Referer)
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
