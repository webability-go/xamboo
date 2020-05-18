// compiler is the code charged to compile no already compiled GO code in the xamboo server.
// It will use the xamboo go.mod environment and gopath to compile.
// It is thread safe and will compile only once even if there are more than one request at the same time
// It will keep the compiler results in Plugin object
package compiler

import (
	"fmt"
	"os/exec"
	"sync"

	"github.com/webability-go/xamboo/server/assets"
	"github.com/webability-go/xamboo/server/logger"
)

type Worker struct {
	ready       chan bool
	Subscribers []chan bool
}

func (w *Worker) Compile(ctx *assets.Context, plugin *assets.Plugin) {

	messages := "Recompiling: " + plugin.SourcePath + "\n"

	// Change version +1
	plugin.Version++
	plugin.PluginVPath = plugin.PluginPath + "." + fmt.Sprint(plugin.Version)

	cmd := exec.Command("go", "build", "-buildmode=plugin", "-o", plugin.PluginVPath, plugin.SourcePath)
	//	cmd.Stdout = ctx.LoggerError.Writer()
	//	cmd.Stderr = ctx.LoggerError.Writer()
	//	err := cmd.Run()
	out, err := cmd.CombinedOutput()
	if err != nil {
		messages += "Error running go build:\n" + fmt.Sprint(err)
	}
	messages += string(out)

	plugin.Messages += messages
	ctx.LoggerError.Println(messages)
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

var CPile Pile

func (p *Pile) createCompiler(ctx *assets.Context, plugin *assets.Plugin) *Worker {

	// we have to check we are not "already" compiling this code. In this case, we just wait it ends instead of launch another compiler
	w := &Worker{ready: make(chan bool), Subscribers: []chan bool{}}
	p.Workers[plugin.SourcePath] = w
	go w.Compile(ctx, plugin)
	return w
}

func (p *Pile) PleaseCompile(ctx *assets.Context, plugin *assets.Plugin) error {

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
	return nil
}

func PleaseCompile(ctx *assets.Context, plugin *assets.Plugin) error {
	return CPile.PleaseCompile(ctx, plugin)
}

/*
func OldPleaseCompile(path string, plugin string, version int, logger *log.Logger) (int, error) {

	newversion := 0
	CPile.mutex.RLock()
	if worker, ok := CPile.Workers[path]; ok {
		CPile.mutex.RUnlock()
		newversion = worker.version
		readychannel := worker.Subscribe()
		<-readychannel
	} else {
		// 1. Creates a channel, send message to supervisor, wait for response
		CPile.mutex.RUnlock()
		newversion = searchNextFreeVersion(plugin, version)
		worker := CPile.CreateCompiler(path, plugin, newversion, logger)
		<-worker.ready
		// destroys the Worker
		CPile.mutex.Lock()
		delete(CPile.Workers, path)
		CPile.mutex.Unlock()
	}
	return newversion, nil
}

func searchNextFreeVersion(plugin string, version int) int {

	// search if version, version+1, version+2.... exists, return next available version
	var newversion int
	var newfile string
	for newversion = version; true; newversion++ {
		if newversion > 0 {
			newfile = plugin + fmt.Sprintf(".%d", newversion)
		} else {
			newfile = plugin
		}
		if !utils.FileExists(newfile) {
			break
		}
	}
	return newversion
}
*/
func Supervisor() {

	CPile.Workers = make(map[string]*Worker)

	slogger := logger.GetCoreLogger("sys")
	slogger.Println("Launching the compilation supervisor.")

	// put order in any .go and .so.xx,

	// listen to the things to compile and recompile
}

func Start() {
	// Supervisor will work until the xamboo is working.
	go Supervisor()
}
