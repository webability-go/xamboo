package config

import (
	"encoding/json"
	"errors"
	"os"
	"plugin"

	"github.com/webability-go/xconfig"

	"github.com/webability-go/xamboo/assets"
	"github.com/webability-go/xamboo/utils"
)

type Listener struct {
	Name         string     `json:"name"`
	IP           string     `json:"ip"`
	Port         string     `json:"port"`
	Protocol     string     `json:"protocol"`
	ReadTimeOut  int        `json:"readtimeout"`
	WriteTimeOut int        `json:"writetimeout"`
	HeaderSize   int        `json:"headersize"`
	Log          assets.Log `json:"log"`
}

type Engine struct {
	Name    string `json:"name"`
	Source  string `json:"source"`
	Library string `json:"library"`
}

type Engines []Engine
type Hosts []assets.Host
type Listeners []Listener

type WEngines []Engine
type WHosts []assets.Host
type WListeners []Listener

type ConfigDef struct {
	Version   string
	File      string
	Listeners Listeners  `json:"listeners"`
	Hosts     Hosts      `json:"hosts"`
	Engines   Engines    `json:"engines"`
	Log       assets.Log `json:"log"`
	Include   []string   `json:"include"`
}

var Config = &ConfigDef{}

func EngineExists(ds []Engine, e Engine) bool {
	for _, dse := range ds {
		if dse.Name == e.Name {
			return true
		}
	}
	return false
}

func (cont *Engines) UnmarshalJSON(buf []byte) error {
	ar := WEngines{}
	json.Unmarshal(buf, &ar)
	for _, x := range ar {
		if !EngineExists(*cont, x) {
			*cont = append(*cont, x)
		}
	}
	return nil
}

func HostExists(ds []assets.Host, e assets.Host) bool {
	for _, dse := range ds {
		if dse.Name == e.Name {
			return true
		}
	}
	return false
}

func (cont *Hosts) UnmarshalJSON(buf []byte) error {
	ar := WHosts{}
	json.Unmarshal(buf, &ar)
	for _, x := range ar {
		if !HostExists(*cont, x) {
			*cont = append(*cont, x)
		}
	}
	return nil
}

func ListenerExists(ds []Listener, e Listener) bool {
	for _, dse := range ds {
		if dse.Name == e.Name {
			return true
		}
	}
	return false
}

func (cont *Listeners) UnmarshalJSON(buf []byte) error {
	ar := WListeners{}
	json.Unmarshal(buf, &ar)
	for _, x := range ar {
		if !ListenerExists(*cont, x) {
			*cont = append(*cont, x)
		}
	}
	return nil
}

// Then main xamboo runner
func (c *ConfigDef) Load(file string) error {

	c.File = file
	err := c.SysLoad(file)
	if err != nil {
		return err
	}

	// Parse the XConfig file
	if c.Hosts != nil {
		for i := range c.Hosts {
			if c.Hosts[i].ConfigFile != nil {
				lc := xconfig.New()
				// adapt this to multiple config files. They are all replaced by default, consider + on parameters to merge them
				for j := range c.Hosts[i].ConfigFile {
					lc.LoadFile(c.Hosts[i].ConfigFile[j])
				}
				c.Hosts[i].Config = lc

				// creates user plugins
				plugins, _ := c.Hosts[i].Config.Get("plugin")
				if plugins != nil {
					c.Hosts[i].Plugins = make(map[string]*plugin.Plugin)
					c.Hosts[i].Applications = make(map[string]assets.Application)
					c_plugins := plugins.(*xconfig.XConfig)
					for app := range c_plugins.Parameters {
						plugindata, _ := c_plugins.Get(app)
						if plugindata != nil {
							c_plugindata := plugindata.(*xconfig.XConfig)

							p1, _ := c_plugindata.GetString("library")
							lib, err := plugin.Open(p1)
							if err != nil {
								return err
							}

							// TODO(phil) Is not exists try to recompile (*Plugin)

							application, err := lib.Lookup("Application")
							if err != nil {
								return err
							}
							interf, ok := application.(assets.Application)
							if !ok {
								return errors.New("Error linking application main interface Application, is not of type assets.Application.")
							}

							c.Hosts[i].Plugins[app] = lib
							c.Hosts[i].Applications[app] = interf
							interf.StartHost(c.Hosts[i])
						}
					}
				}
			}
		}
	}

	return nil
}

func (c *ConfigDef) SysLoad(file string) error {

	configFile, err := os.Open(file)
	defer configFile.Close()
	if err != nil {
		return err
	}

	jsonParser := json.NewDecoder(configFile)
	if err = jsonParser.Decode(c); err != nil {
		return err
	}

	// Inludes ?
	if c.Include != nil && len(c.Include) > 0 {
		list := c.Include
		c.Include = nil
		for _, inc := range list {
			err := c.SysLoad(inc)
			if err != nil {
				return err
			}
		}
	}
	return nil
}

func (c *ConfigDef) SearchListener(name string) *Listener {
	for _, l := range c.Listeners {
		if l.Name == name {
			return &l
		}
	}
	return nil
}

func (c *ConfigDef) GetListener(host string, port string, secure bool) (*assets.Host, *Listener) {
	for _, h := range c.Hosts {
		if utils.SearchInArray(host, h.HostNames) {
			// search the actual active listener
			for _, l := range h.Listeners {
				ldata := c.SearchListener(l)
				if ldata != nil && ldata.Port == port {
					return &h, ldata
				}
			}
		}
	}
	return nil, nil
}
