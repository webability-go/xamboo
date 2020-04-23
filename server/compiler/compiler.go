package compiler

import (
	"fmt"
	"log"
	"os/exec"

	"github.com/webability-go/xamboo/server/logger"
	"github.com/webability-go/xamboo/server/utils"
)

type Worker struct {
	version     int
	ready       chan bool
	Subscribers []chan bool
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
}

type Pile struct {
	Workers map[string]*Worker
}

var CPile Pile

func (p *Pile) CreateCompiler(path string, plugin string, version int, logger *log.Logger) *Worker {

	// we have to check we are not "already" compiling this code. In this case, we just wait it ends instead of launch another compiler
	w := &Worker{ready: make(chan bool), version: version}
	p.Workers[path] = w
	go w.Compile(path, plugin, version, logger)
	return w
}

func (w *Worker) Compile(path string, plugin string, version int, logger *log.Logger) {

	if version > 0 {
		plugin = plugin + fmt.Sprintf(".%d", version)
	}

	logger.Println("Recompiling:", path, version)

	cmd := exec.Command("go", "build", "-buildmode=plugin", "-o", plugin, path)
	cmd.Stdout = logger.Writer()
	cmd.Stderr = logger.Writer()
	err := cmd.Run()
	if err != nil {
		logger.Println("Error running go build:", err)
	}
	w.ready <- true
	w.Broadcast()
}

func PleaseCompile(path string, plugin string, version int, logger *log.Logger) (int, error) {

	newversion := 0
	if worker, ok := CPile.Workers[path]; ok {
		newversion = worker.version
		readychannel := worker.Subscribe()
		<-readychannel
	} else {
		// 1. Creates a channel, send message to supervisor, wait for response
		newversion = searchNextFreeVersion(plugin, version)
		worker := CPile.CreateCompiler(path, plugin, newversion, logger)
		<-worker.ready
		// destroys the Worker
		delete(CPile.Workers, path)
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
