package core

import (
  "fmt"
  "flag"
  "os"
  "encoding/json"
  "github.com/gowebability/xamboo/utils"
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
  PagesDir string `json:"pagesdir"`
  MainPage string `json:"mainpage"`
  AcceptPathParameters bool `json:"acceptpathparameters"`
}

type ConfigDef struct {
    File string
    Listeners []Listener
    Hosts []Host
}

var Config = &ConfigDef{}

// Then main xamboo runner
func (c *ConfigDef) Load() error {
  flag.StringVar(&c.File, "config", "", "configuration file")
  flag.Parse()
  
  if c.File == "" {
    return nil
  }
  configFile, err := os.Open(c.File)
  defer configFile.Close()
  if err != nil {
    return err
  }

  jsonParser := json.NewDecoder(configFile)
  if err = jsonParser.Decode(c); err != nil {
    return err
  }

  // Load the configuration file
  fmt.Println("Config loaded " + c.File)
  fmt.Printf("%+v\n", c)
  return nil
}

func (c *ConfigDef) GetListener(host string, port string, secure bool) (*Host, *Listener) {

  for _, h := range c.Hosts {
    if utils.SearchInArray(host, h.HostNames) {
      // search the actual active listener
      
      
      
      
      return &h, &c.Listeners[0]
    }
  }
  return nil, nil
}
