// compiler is the code charged to compile no already compiled GO code in the xamboo server.
// It will use the xamboo go.mod environment and gopath to compile.
// It is thread safe and will compile only once even if there are more than one request at the same time
// It will keep the compiler results in Plugin object
package compiler

import (
	"fmt"
	"os/exec"
	"sync"
	"time"

	"github.com/webability-go/xamboo/cms/context"
	"github.com/webability-go/xamboo/i18n"
)

type Worker struct {
	ready       chan bool
	Subscribers []chan bool
}

func (w *Worker) Compile(ctx *context.Context, plugin *Plugin) {

	// Change version +1
	plugin.Version++
	plugin.PluginVPath = plugin.PluginPath + "." + fmt.Sprint(plugin.Version)
	plugin.Error = nil

	messages := "Recompiling: " + plugin.SourcePath + ", library: " + plugin.PluginVPath + "."

	start := time.Now()
	cmd := exec.Command("go", "build", "-buildmode=plugin", "-o", plugin.PluginVPath, plugin.SourcePath)
	out, err := cmd.CombinedOutput()

	elapsed := time.Since(start)
	messages += " Compiled in " + fmt.Sprint(elapsed) + "\n"
	if err != nil {
		messages += fmt.Sprintf(i18n.Get("compiler.builderror"), err)
		plugin.Status = 2
		plugin.Error = err
	}
	messages += string(out)

	plugin.Messages += messages
	if ctx != nil {
		ctx.LoggerError.Println(messages)
	}
	w.ready <- true
	w.Broadcast()
}

func (w *Worker) Subscribe() chan bool {
	c := make(chan bool)
	w.Subscribers = append(w.Subscribers, c)
	return c
}

func (w *Worker) Broadcast() {
	for _, c := range w.Subscribers {
		c <- true
	}
	// clean Suscribers
	w.Subscribers = []chan bool{}
}

type Pile struct {
	mutex   sync.RWMutex
	Workers map[string]*Worker
}

var CPile *Pile

func (p *Pile) createCompiler(ctx *context.Context, plugin *Plugin) *Worker {

	// we have to check we are not "already" compiling this code. In this case, we just wait it ends instead of launch another compiler
	w := &Worker{ready: make(chan bool), Subscribers: []chan bool{}}
	p.Workers[plugin.SourcePath] = w
	go w.Compile(ctx, plugin)
	return w
}

func (p *Pile) PleaseCompile(ctx *context.Context, plugin *Plugin) error {

	p.mutex.Lock()
	worker, ok := p.Workers[plugin.SourcePath]
	if ok {
		readychannel := worker.Subscribe()
		p.mutex.Unlock()
		<-readychannel
	} else {
		// 1. Creates a channel, send message to supervisor, wait for response
		worker := p.createCompiler(ctx, plugin)
		p.mutex.Unlock()
		<-worker.ready
		// destroys the Worker once ready
		p.mutex.Lock()
		worker.Broadcast()
		// clean suscribers just in case some new between the ready and now
		delete(p.Workers, plugin.SourcePath)
		p.mutex.Unlock()
	}
	return plugin.Error
}

func PleaseCompile(ctx *context.Context, plugin *Plugin) error {
	if CPile == nil {
		CPile = &Pile{Workers: map[string]*Worker{}}
	}

	return CPile.PleaseCompile(ctx, plugin)
}
