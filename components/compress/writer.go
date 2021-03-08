package compress

import (
	"bufio"
	"compress/flate"
	"compress/gzip"
	"fmt"
	"io"
	"net"
	"net/http"
	"sync"

	"github.com/webability-go/xconfig"

	"github.com/webability-go/xamboo/config"
	"github.com/webability-go/xamboo/utils"

	"github.com/webability-go/xamboo/components/host"
)

var zippers = sync.Pool{New: func() interface{} {
	z, _ := gzip.NewWriterLevel(nil, gzip.DefaultCompression)
	return z
}}

var flaters = sync.Pool{New: func() interface{} {
	z, _ := flate.NewWriter(nil, flate.DefaultCompression)
	return z
}}

// must be a hostwriter
type writer struct {
	writer host.HostWriter

	wroteHeader    bool
	length         int
	compress       bool
	encoding       string
	compressWriter io.WriteCloser
}

func (w *writer) Header() http.Header {
	return w.writer.Header()
}

func (w *writer) WriteHeader(status int) {

	w.wroteHeader = true

	// check status, it may NOT have body (Body for 2XX and 4XX)
	if status < 200 || (status >= 300 && status < 400) || (status >= 500) {
		w.compress = false
	} else {
		if !w.compress {
			contenttype := w.writer.Header().Get("Content-Type")
			host := w.writer.GetHost()
			// check mime type
			w.compress = utils.CompressMimeCandidate(host.Compress.Mimes, contenttype)
		}
	}

	if w.compress {
		w.writer.Header().Del("Content-Length")               // very important or get a content length mismatch error with zipper
		w.writer.Header().Set("Content-Encoding", w.encoding) // result is gzipped
		w.writer.Header().Add("Vary", w.encoding)             // avoid caches corruption
		switch w.encoding {
		case "gzip":
			gz := zippers.Get().(*gzip.Writer)
			gz.Reset(w.writer)
			w.compressWriter = gz
		case "deflate":
			fz := flaters.Get().(*flate.Writer)
			fz.Reset(w.writer)
			w.compressWriter = fz
		}
	}
	w.writer.WriteHeader(status)
}

func (w *writer) Write(b []byte) (int, error) {
	if !w.wroteHeader {
		w.WriteHeader(http.StatusOK) // nobody called it before ? Must be a 200
	}

	w.length += len(b)

	if w.compress {
		i, e := w.compressWriter.Write(b)
		return i, e
	}
	return w.writer.Write(b)
}

func (w *writer) Close() {
	if w.compress {
		e := w.compressWriter.Close()
		if e != nil {
			fmt.Println("Error closing zipper: ", e, w.length)
		}
		switch w.encoding {
		case "gzip":
			zippers.Put(w.compressWriter)
		case "deflate":
			flaters.Put(w.compressWriter)
		}
	}
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
