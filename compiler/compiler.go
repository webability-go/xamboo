package compiler

import (
	"fmt"
	"github.com/webability-go/xamboo/utils"
	"os/exec"
)

type Worker struct {
	ready chan bool
}

type Pile struct {
	Workers map[string]Worker
}

var CPile Pile

func (p *Pile) CreateCompiler(path string, plugin string, version int) *Worker {

	// we have to check we are not "already" compiling this code. In this case, we just wait it ends instead of launch another compiler
	//  fmt.Println("Creating the compiler for " + path)

	w := &Worker{ready: make(chan bool)}
	p.Workers[path] = *w
	go w.Compile(path, plugin, version)
	return w
}

func (w *Worker) Compile(path string, plugin string, version int) {

	//  fmt.Println("Compiling " + path)
	// go build -buildmode=plugin

	if version > 0 {
		plugin += fmt.Sprintf(".%d", version)
	}

	cmd := exec.Command("go", "build", "-buildmode=plugin", "-o", plugin, path)
	err := cmd.Run()

	if err != nil {
		fmt.Println(err)
	}
	//  fmt.Println("Finish Compiling " + path)

	w.ready <- true

}

func PleaseCompile(path string, plugin string, version int) (int, error) {

	// 1. Creates a channel, send message to supervisor, wait for response
	//  fmt.Println("PleaseCompile: " + path)
	newversion := searchNextFreeVersion(plugin, version)
	worker := CPile.CreateCompiler(path, plugin, newversion)
	<-worker.ready
	//  fmt.Println("Compiled: " + path)
	return newversion, nil
}

func searchNextFreeVersion(plugin string, version int) int {

	// search if version, version+1, version+2.... exists, return next available version
	var newversion int
	var newfile string
	for newversion = version; true; newversion += 1 {
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

	CPile.Workers = make(map[string]Worker)

	fmt.Println("Launching the compilation supervisor.")

	// put order in any .go and .so.xx,

	// listen to the things to compile and recompile
}

func Start() {
	// Supervisor will work until the xamboo is working.
	go Supervisor()
}
