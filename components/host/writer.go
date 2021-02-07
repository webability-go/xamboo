package host

import (
	"bufio"
	"fmt"
	"net"
	"net/http"

	"github.com/webability-go/xamboo/assets"
)

// Structures to wrap writer and log stats
type HostWriter interface {
	http.ResponseWriter
	http.Hijacker
	SetListener(l *assets.Listener)
	SetHost(h *assets.Host)
	GetListener() *assets.Listener
	GetHost() *assets.Host
}

type writer struct {
	writer http.ResponseWriter

	wroteHeader bool
	listener    *assets.Listener
	host        *assets.Host
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

func (w *writer) SetListener(l *assets.Listener) {
	w.listener = l
}

func (w *writer) SetHost(h *assets.Host) {
	w.host = h
}

func (w *writer) GetListener() *assets.Listener {
	return w.listener
}

func (w *writer) GetHost() *assets.Host {
	return w.host
}

// Makes the hijack function visible for gorilla websockets
func (w *writer) Hijack() (net.Conn, *bufio.ReadWriter, error) {
	if hj, ok := w.writer.(http.Hijacker); ok {
		return hj.Hijack()
	}
	return nil, nil, fmt.Errorf("http.Hijacker interface is not supported in HostWriter") // should not happen
}
