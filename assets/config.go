package assets

import (
	"plugin"

	"github.com/webability-go/xconfig"
)

type JComponent struct {
	Name    string `json:"name"`
	Source  string `json:"source"`
	Library string `json:"library"`
	// Status is 0 = nothing new, 1 = new, 2 = changed, 3 = deleted
	Status int
}

type JEngine struct {
	Name    string `json:"name"`
	Source  string `json:"source"`
	Library string `json:"library"`
	// Status is 0 = nothing new, 1 = new, 2 = changed, 3 = deleted
	Status int
}

type Log struct {
	Enabled bool   `json:"enabled"`
	Pages   string `json:"pages"`
	Errors  string `json:"errors"`
	Sys     string `json:"sys"`
	Stats   string `json:"stats"`
	Status  int
}

type Listener struct {
	Name         string `json:"name"`
	IP           string `json:"ip"`
	Port         string `json:"port"`
	Protocol     string `json:"protocol"`
	ReadTimeOut  int    `json:"readtimeout"`
	WriteTimeOut int    `json:"writetimeout"`
	HeaderSize   int    `json:"headersize"`
	Log          Log    `json:"log"`
	Status       int
}

type Host struct {
	Name         string   `json:"name"`
	Listeners    []string `json:"listeners"`
	HostNames    []string `json:"hostnames"`
	Cert         string   `json:"cert"`
	PrivateKey   string   `json:"key"`
	ConfigFile   []string `json:"config"`
	StaticPath   string   `json:"static"`
	Origin       Origin   `json:"origin"`
	Redirect     Redirect `json:"redirect"`
	Auth         Auth     `json:"auth"`
	Minify       Minify   `json:"minify"`
	GZip         GZip     `json:"gzip"`
	Browser      Browser  `json:"browser"`
	Log          Log      `json:"log"`
	Config       *xconfig.XConfig
	Plugins      map[string]*plugin.Plugin
	Applications map[string]Application
	Status       int
}
