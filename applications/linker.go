package applications

import (
	"os"
	"plugin"
	"strings"
	"sync"

	"github.com/webability-go/xcore/v2"

	"github.com/webability-go/xamboo/compiler"
	"github.com/webability-go/xamboo/components/host"
	"github.com/webability-go/xamboo/config"
	"github.com/webability-go/xamboo/loggers"
	"github.com/webability-go/xamboo/utils"
)

var Applications = map[string]Application{}
var ApplicationPlugin = map[string]*plugin.Plugin{}
var ApplicationCache = xcore.NewXCache("applications", 0, 0)
var mutex sync.RWMutex

func Link() {
	xlogger := loggers.GetCoreLogger("sys")
	xlogger.Println("Build Applications External")
	xloggererror := loggers.GetCoreLogger("errors")
	for hid, host := range config.Config.Hosts {
		for pid, application := range host.Plugins {

			var lib *compiler.Plugin
			appid := host.Name + "|" + application.Name

			// During the seek of the library, we lock the application for security. Very fast lock
			mutex.Lock()
			// If the plugin is not loaded, load it (equivalent of cache for other types of server)
			// verify if the code is loaded in memory
			cdata, _ := ApplicationCache.Get(appid)
			if cdata != nil {
				lib = cdata.(*compiler.Plugin)
			} else {
				// take path of library
				path := strings.ReplaceAll(application.Library, ".so", ".go")
				lib = &compiler.Plugin{
					SourcePath:  path,
					PluginPath:  application.Library,
					PluginVPath: application.Library + ".1",
					Version:     0, // will be 1 at first compile
					Messages:    "",
					Status:      0, // 0 = must compile or/and load (first creation of library)
					Libs:        map[string]*plugin.Plugin{},
				}
				ApplicationCache.Set(appid, lib)
			}
			mutex.Unlock()
			lib.Mutex.Lock()

			if !utils.FileExists(lib.SourcePath) {
				if lib.Status != 2 {
					lib.Status = 2
					errortext := "Error: " + lib.SourcePath + " Source file does not exists.\n"
					xloggererror.Println(errortext)
					lib.Messages += errortext
					ApplicationCache.Set(appid, lib)
				}
				lib.Mutex.Unlock()
				continue
			}

			mustcompile := true
			if utils.FileExists(lib.PluginVPath) {
				dp, _ := os.Stat(lib.PluginVPath)
				dptime := dp.ModTime()
				if utils.FileValidator(lib.SourcePath, dptime) {
					mustcompile = false
				}
			}

			if mustcompile {
				lib.Status = 0
				err := compiler.PleaseCompile(nil, lib)
				if err != nil {
					lib.Status = 2
					errortext := "Error: the GO code could not compile " + lib.SourcePath + "\n" + lib.Messages + "\n" + err.Error()
					xloggererror.Println(errortext)
					lib.Messages += errortext
					ApplicationCache.Set(appid, lib)
					lib.Mutex.Unlock()
					continue
				}
			}

			if lib.Status == 0 { // needs to load the plugin
				// Get GO BuildID to compare with in-memory GO BuildID and keep it with the library itself
				// if already exists in memory, set it as default, or load it
				buildid, err := utils.GetBuildId(lib.PluginVPath)
				if err != nil {
					errortext := "Error: the library .so does not have a build id " + lib.SourcePath + "\n" + err.Error()
					xloggererror.Println(errortext)
					lib.Messages += errortext
					ApplicationCache.Set(appid, lib)
					lib.Mutex.Unlock()
					continue
				}
				plg := lib.Libs[buildid]
				if plg != nil { // already exists and loaded
					lib.Lib = plg
				} else {
					lib.Lib, err = plugin.Open(lib.PluginVPath)
					if err != nil {
						lib.Status = 2
						errortext := "Error: the library .so could not load " + lib.SourcePath + "\n" + err.Error()
						xloggererror.Println(errortext)
						lib.Messages += errortext
						ApplicationCache.Set(appid, lib)
						lib.Mutex.Unlock()
						continue
					}
					lib.Libs[buildid] = lib.Lib
				}

				applicationlink, err := lib.Lib.Lookup("Application")
				if err != nil {
					xloggererror.Println("Error linking application main interface Application:", err)
					lib.Mutex.Unlock()
					continue
				}

				interf, ok := applicationlink.(Application)
				if !ok {
					xloggererror.Println("Error linking application main interface Application, is not of type application.Application.")
					lib.Mutex.Unlock()
					continue
				}
				interf.StartHost(host)
				Applications[appid] = interf
				ApplicationPlugin[appid] = lib.Lib
				config.Config.Hosts[hid].Plugins[pid].Id = appid
			}
			lib.Mutex.Unlock()
		}
	}
}

func LinkCalls() {
	xlogger := loggers.GetCoreLogger("sys")
	xlogger.Println("Build Applications External")
	xloggererror := loggers.GetCoreLogger("errors")
	for _, cfhost := range config.Config.Hosts {

		if len(cfhost.Log.Stats) > 6 {
			logdata := strings.Split(cfhost.Log.Stats, ":")
			if len(logdata) == 3 && logdata[0] == "call" {
				lib := GetApplicationPlugin(cfhost.Name + "|" + logdata[1])
				if lib == nil {
					xloggererror.Println("Error, the host application to call in the stat log does not exists: " + cfhost.Log.Stats)
					continue
				}
				ihook, err := lib.Lookup(logdata[2])
				hook, ok := ihook.(func(host.HostWriter))
				if err != nil || !ok {
					xloggererror.Println("Failed to find stat call function:", logdata[1], logdata[2], err)
					continue
				}
				loggers.SetHostHook(cfhost.Name, "stats", hook)
			}
		}
	}
}

func GetApplication(appid string) Application {
	return Applications[appid]
}

func GetApplicationPlugin(appid string) *plugin.Plugin {
	return ApplicationPlugin[appid]
}
