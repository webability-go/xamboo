package stat

import (
	"bufio"
	"fmt"
	"net"
	"net/http"

	"github.com/webability-go/xconfig"

	"github.com/webability-go/xamboo/config"

	"github.com/webability-go/xamboo/components/host"
)

type writer struct {
	writer host.HostWriter

	wroteHeader bool

	status              int
	length              int
	lengthnotcompressed int
	lengthnotminified   int
	RequestStat         *RequestStat
}

func (w *writer) Header() http.Header {
	return w.writer.Header()
}

func (w *writer) WriteHeader(status int) {
	w.wroteHeader = true

	w.status = status
	w.writer.WriteHeader(status)
}

func (w *writer) Write(b []byte) (int, error) {

	if !w.wroteHeader {
		w.WriteHeader(http.StatusOK) // nobody called it before ? Must be a 200
	}

	var n int
	var err error
	n, err = w.writer.Write(b)
	w.length += n
	return n, err
}

func (w *writer) SetListener(l *config.Listener) {
	w.writer.SetListener(l)
}

func (w *writer) SetHost(h *config.Host) {
	w.writer.SetHost(h)
}

func (w *writer) GetListener() *config.Listener {
	return w.writer.GetListener()
}

func (w *writer) GetHost() *config.Host {
	return w.writer.GetHost()
}

// Makes the hijack function visible for gorilla websockets
func (w *writer) Hijack() (net.Conn, *bufio.ReadWriter, error) {
	if hj, ok := w.writer.(http.Hijacker); ok {
		return hj.Hijack()
	}
	return nil, nil, fmt.Errorf("http.Hijacker interface is not supported in HostWriter") // should not happen
}

func (w *writer) GetParams() *xconfig.XConfig {
	return w.writer.GetParams()
}

func (w *writer) SetParam(id string, value interface{}) {
	w.writer.SetParam(id, value)
}
