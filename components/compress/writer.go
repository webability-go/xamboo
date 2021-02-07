package compress

import (
	"bufio"
	"compress/gzip"
	"fmt"
	"net"
	"net/http"
	"sync"

	"github.com/webability-go/xamboo/assets"
	"github.com/webability-go/xamboo/utils"

	"github.com/webability-go/xamboo/components/host"
)

var zippers = sync.Pool{New: func() interface{} {
	return gzip.NewWriter(nil)
}}

// must be a hostwriter
type writer struct {
	writer host.HostWriter

	wroteHeader bool
	length      int
	gzip        bool
	gzipWriter  *gzip.Writer
}

func (w *writer) Header() http.Header {
	return w.writer.Header()
}

func (w *writer) WriteHeader(status int) {

	w.wroteHeader = true

	if !w.gzip {
		contenttype := w.writer.Header().Get("Content-Type")
		host := w.writer.GetHost()
		// check mime type
		w.gzip = utils.GzipMimeCandidate(host.GZip.Mimes, contenttype)
	}

	if w.gzip {
		w.writer.Header().Del("Content-Length")           // very important or get a content length mismatch error with zipper
		w.writer.Header().Set("Content-Encoding", "gzip") // result is gzipped
		w.writer.Header().Add("Vary", "gzip")             // avoid caches corruption
		gz := zippers.Get().(*gzip.Writer)
		gz.Reset(w.writer)
		w.gzipWriter = gz
	}
	w.writer.WriteHeader(status)
}

func (w *writer) Write(b []byte) (int, error) {
	if !w.wroteHeader {
		w.WriteHeader(http.StatusOK) // nobody called it before ? Must be a 200
	}

	w.length += len(b)

	if w.gzip {
		i, e := w.gzipWriter.Write(b)
		return i, e
	}
	return w.writer.Write(b)
}

func (w *writer) Close() {
	if w.gzip {
		e := w.gzipWriter.Close()
		if e != nil {
			fmt.Println("Error closing zipper: ", e)
		}
		zippers.Put(w.gzipWriter)
	}
}

func (w *writer) SetListener(l *assets.Listener) {
	w.writer.SetListener(l)
}

func (w *writer) SetHost(h *assets.Host) {
	w.writer.SetHost(h)
}

func (w *writer) GetListener() *assets.Listener {
	return w.writer.GetListener()
}

func (w *writer) GetHost() *assets.Host {
	return w.writer.GetHost()
}

// Makes the hijack function visible for gorilla websockets
func (w *writer) Hijack() (net.Conn, *bufio.ReadWriter, error) {
	if hj, ok := w.writer.(http.Hijacker); ok {
		return hj.Hijack()
	}
	return nil, nil, fmt.Errorf("http.Hijacker interface is not supported in HostWriter") // should not happen
}
