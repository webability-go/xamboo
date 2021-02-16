package host

import (
	"bufio"
	"fmt"
	"net"
	"net/http"

	"github.com/webability-go/xconfig"

	"github.com/webability-go/xamboo/config"
)

// Structures to wrap writer and log stats
type HostWriter interface {
	http.ResponseWriter
	http.Hijacker
	SetListener(l *config.Listener)
	SetHost(h *config.Host)
	GetListener() *config.Listener
	GetHost() *config.Host
	GetParams() *xconfig.XConfig
	SetParam(id string, value interface{})
}

type writer struct {
	writer http.ResponseWriter

	wroteHeader bool
	listener    *config.Listener
	host        *config.Host
	params      *xconfig.XConfig
}

func (w *writer) Header() http.Header {
	return w.writer.Header()
}

func (w *writer) WriteHeader(statusCode int) {
	w.wroteHeader = true
	w.writer.WriteHeader(statusCode)
}

func (w *writer) Write(b []byte) (int, error) {
	if !w.wroteHeader {
		w.WriteHeader(http.StatusOK)
	}

	return w.writer.Write(b)
}

func (w *writer) SetListener(l *config.Listener) {
	w.listener = l
}

func (w *writer) SetHost(h *config.Host) {
	w.host = h
}

func (w *writer) GetListener() *config.Listener {
	return w.listener
}

func (w *writer) GetHost() *config.Host {
	return w.host
}

// Makes the hijack function visible for gorilla websockets
func (w *writer) Hijack() (net.Conn, *bufio.ReadWriter, error) {
	if hj, ok := w.writer.(http.Hijacker); ok {
		return hj.Hijack()
	}
	return nil, nil, fmt.Errorf("http.Hijacker interface is not supported in HostWriter") // should not happen
}

func (w *writer) GetParams() *xconfig.XConfig {
	return w.params
}

func (w *writer) SetParam(id string, value interface{}) {
	if w.params == nil {
		w.params = xconfig.New()
	}
	w.params.Set(id, value)
}
