package config

import (
//	"fmt"
)

var overConfig = &ConfigDef{}

// Overload will load the new config and add, modify, remove hosts and components config
// - Listeners, engines and list of components are not supported for now
// - Certificates will NOT be reloaded if any change.for now
// - Plugins are not modified for now
// - Logs are not rebuild for now
// What is working:
// + changes of listeners of host ( if they are already loaded )
// + changes of hostnames
// + changes of every components config
// + changes of logs format
// What to do:
// * If new host and/or new certificates, rebuild Listener with certificates, restart listener
// * If new listener, start listener
// * If del listener, stop listener
// * If modif listener, stop/start listener
// LET THE ONGOING REQUESTS FINISH TO SERVER before restart ????
// * Load new plugins
// * Load new Engines
// * Load new components, rebuild encapsulate handlers on listeners
func OverLoad(file string) error {
	err := overConfig.Load(file)
	if err != nil {
		return err
	}

	overConfig.Version = Config.Version
	/*
		// Launch the system based on Config
		// Launch system wide Loggers
		loggers.StartSystem()
		// Link engines (load external apps and create linker matrix)
		engines.Link()
		// Link components and call Start to start them globally
		components.Link()
		// link Applications and call StartHost to start them on each Hosts
		applications.Link()
		// Launch remaining loggers: listeners, hosts (they may link to an application)
		loggers.Start()
		// Finally link the logs call for loggers
		applications.LinkCalls()
		// And call hosts starts for components
		components.StartHost()
	*/

	// The new config is here. lets compare and modify
	// for now just replace. Be carefull to not moduify unsupported data
	// copy the applications (plugins) to new ones
	for id, host := range overConfig.Hosts {
		oldhost := Config.GetHost(host.Name)
		if oldhost == nil { // new host, ignore
			continue
		}
		overConfig.Hosts[id].Plugins = oldhost.Plugins
	}

	Config.Hosts = overConfig.Hosts

	return nil
}
