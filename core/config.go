package core

import (
  "fmt"
//  "flag"
  "os"
  "encoding/json"
  "github.com/webability-go/xconfig"
  "github.com/webability-go/xamboo/utils"
)

type Listener struct {
  Name string `json:"name"`
  IP string `json:"ip"`
  Port string `json:"port"`
  Protocol string `json:"protocol"`
  ReadTimeOut int `json:"readtimeout"`
  WriteTimeOut int `json:"writetimeout"`
  HeaderSize int `json:"headersize"`
}

type Host struct {
  Name string `json:"name"`
  Listeners []string `json:"listeners"`
  HostNames []string `json:"hostnames"`
  Cert string `json:"cert"`
  PrivateKey string `json:"key"`
  ConfigFile []string `json:"config"`
  Config *xconfig.XConfig
}

type ConfigDef struct {
    File string
    Listeners []Listener
    Hosts []Host
}

var Config = &ConfigDef{}

// Then main xamboo runner
func (c *ConfigDef) Load(file string) error {

  c.File = file
  configFile, err := os.Open(file)
  defer configFile.Close()
  if err != nil {
    return err
  }

  jsonParser := json.NewDecoder(configFile)
  if err = jsonParser.Decode(c); err != nil {
    return err
  }

  // Parse the XConfig file
  if c.Hosts != nil {
    for i, _ := range c.Hosts {
      if c.Hosts[i].ConfigFile != nil {
        lc := xconfig.New()
        // adapt this to multiple config files. They are all replaced by default, consider + on parameters to merge them
        for j, _ := range c.Hosts[i].ConfigFile {
          lc.LoadFile(c.Hosts[i].ConfigFile[j])
        }
        c.Hosts[i].Config = lc
      }
    }
  }
  
  // Load the configuration file
  fmt.Println("Config loaded " + c.File)
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
