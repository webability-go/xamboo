package config

import (
	"encoding/json"
	"errors"
	"os"

	"github.com/webability-go/xconfig"

	"github.com/webability-go/xamboo/utils"
)

type ConfigDef struct {
	Version    string
	File       string
	Listeners  ListenerList  `json:"listeners"`
	Hosts      HostList      `json:"hosts"`
	Components ComponentList `json:"components"`
	Engines    EngineList    `json:"engines"`
	Log        Log           `json:"log"`
	Include    []string      `json:"include"`
}

var Config = &ConfigDef{}

// Then main xamboo runner
func (c *ConfigDef) Load(file string) error {

	c.File = file
	err := c.SysLoad(file)
	if err != nil {
		return err
	}

	// Build REMAINING and load missing data
	// External Components config & CMS config files
	if c.Hosts != nil {
		for i := range c.Hosts {
			if c.IsComponentLoaded("cms") && c.Hosts[i].CMS.Enabled {
				lc := xconfig.New()
				// adapt this to multiple config files. They are all replaced by default, consider + on parameters to merge them
				for j := range c.Hosts[i].CMS.ConfigFiles {
					lc.LoadFile(c.Hosts[i].CMS.ConfigFiles[j])
				}
				c.Hosts[i].CMS.Config = lc
			}

			c.Hosts[i].Components = map[string]ComponentDef{}
			var alldata map[string]interface{}
			err := json.Unmarshal(c.Hosts[i].Remaining, &alldata)
			if err != nil {
				return err
			}

			for _, component := range c.Components {
				if component.Source == "extern" {
					var cdata map[string]interface{}
					enabled := false
					if alldata[component.Name] != nil {
						cdata, ok := alldata[component.Name].(map[string]interface{})
						if !ok {
							return errors.New("Error: the external component configuration is not a map[string]interface{} in host " + c.Hosts[i].Name)
						}
						enabled, ok = cdata["enabled"].(bool)
						if !ok {
							return errors.New("Error: the external component configuration does not contain a boolean 'enabled' entry in host " + c.Hosts[i].Name)
						}
					}
					ec := ComponentDef{
						Name:    component.Name,
						Enabled: enabled,
						Status:  0,
						Params:  cdata,
					}
					c.Hosts[i].Components[component.Name] = ec
				}
			}
			c.Hosts[i].Remaining = nil
		}
	}
	return nil
}

func (c *ConfigDef) IsComponentLoaded(name string) bool {
	for _, component := range c.Components {
		if component.Name == name {
			return true
		}
	}
	return false
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

func (c *ConfigDef) GetListener(host string, port string, secure bool) (*Host, *Listener) {
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
