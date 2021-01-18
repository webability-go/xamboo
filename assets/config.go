package assets

import (
	"plugin"

	"github.com/webability-go/xconfig"
)

type OriginDef struct {
	MainDomains []string `json:"maindomains"`
	Default     string   `json:"default"`
	Methods     []string `json:"methods"`
	Headers     []string `json:"headers"`
	Credentials bool     `json:"credentials"`
}

type Redirect struct {
	Enabled bool   `json:"enabled"`
	Scheme  string `json:"scheme"`
	Host    string `json:"host"`
}

type Auth struct {
	Enabled bool   `json:"enabled"`
	Realm   string `json:"realm"`
	User    string `json:"user"`
	Pass    string `json:"pass"`
}

type Minify struct {
	Enabled bool `json:"enabled"`
	HTML    bool `json:"html"`
	CSS     bool `json:"css"`
	JS      bool `json:"js"`
	JSON    bool `json:"json"`
	SVG     bool `json:"svg"`
	XML     bool `json:"xml"`
}

type GZip struct {
	Enabled bool     `json:"enabled"`
	Mimes   []string `json:"mimes"`
	Files   []string `json:"files"`
}

type Browser struct {
	UserAgent UserAgent `json:"useragent"`
}

type UserAgent struct {
	Enabled bool     `json:"enabled"`
	Devices []string `json:"devices"`
}

type Log struct {
	Enabled bool   `json:"enabled"`
	Pages   string `json:"pages"`
	Errors  string `json:"errors"`
	Sys     string `json:"sys"`
	Stats   string `json:"stats"`
	Status  int
}

type Host struct {
	Name         string     `json:"name"`
	Listeners    []string   `json:"listeners"`
	HostNames    []string   `json:"hostnames"`
	Cert         string     `json:"cert"`
	PrivateKey   string     `json:"key"`
	ConfigFile   []string   `json:"config"`
	StaticPath   string     `json:"static"`
	Origin       *OriginDef `json:"origin"`
	Redirect     Redirect   `json:"redirect"`
	Auth         Auth       `json:"auth"`
	Minify       Minify     `json:"minify"`
	GZip         GZip       `json:"gzip"`
	Browser      Browser    `json:"browser"`
	Log          Log        `json:"log"`
	Config       *xconfig.XConfig
	Plugins      map[string]*plugin.Plugin
	Applications map[string]Application
	Status       int
}
