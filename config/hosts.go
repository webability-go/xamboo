package config

import (
	"encoding/json"

	"github.com/webability-go/xconfig"
)

type HostList []Host
type THostList []Host

type Plugins []Plugin

type Plugin struct {
	Name    string
	Library string
	Id      string
}

type Host struct {
	Name       string   `json:"name"`
	Listeners  []string `json:"listeners"`
	HostNames  []string `json:"hostnames"`
	Cert       string   `json:"cert"`
	PrivateKey string   `json:"key"`
	Debug      bool     `json:"debug"`
	Plugins    Plugins  `json:"plugins"`
	Log        Log      `json:"log"`

	// Build after
	Status int

	// BUILT-IN Components
	Stat       Stat       `json:"stat"`
	Redirect   Redirect   `json:"redirect"`
	Auth       Auth       `json:"auth"`
	Prot       Prot       `json:"prot"`
	Compress   Compress   `json:"compress"`
	Minify     Minify     `json:"minify"`
	Origin     Origin     `json:"origin"`
	FileServer FileServer `json:"fileserver"`
	CMS        CMS        `json:"cms"`
	Error      Error      `json:"error"`
	// External components
	Remaining  []byte
	Components map[string]*ComponentDef
}
type THost Host

func (hcl *HostList) Exists(comphc Host) bool {
	for _, hc := range *hcl {
		if comphc.Name == hc.Name {
			return true
		}
	}
	return false
}

func (hcl *HostList) UnmarshalJSON(buf []byte) error {
	thcl := THostList{}
	err := json.Unmarshal(buf, &thcl)
	if err != nil {
		return err
	}
	for _, x := range thcl {
		if !hcl.Exists(x) {
			*hcl = append(*hcl, x)
		}
	}
	return nil
}

func (hc *Host) UnmarshalJSON(buf []byte) error {

	thc := THost{}
	err := json.Unmarshal(buf, &thc)
	if err != nil {
		return err
	}
	var nbuf = make([]byte, len(buf))
	copy(nbuf, buf)

	// assign all
	hc.Name = thc.Name
	hc.Listeners = thc.Listeners
	hc.HostNames = thc.HostNames
	hc.Cert = thc.Cert
	hc.PrivateKey = thc.PrivateKey
	hc.Debug = thc.Debug
	hc.Plugins = thc.Plugins
	hc.Log = thc.Log
	hc.Stat = thc.Stat
	hc.Redirect = thc.Redirect
	hc.Auth = thc.Auth
	hc.Prot = thc.Prot
	hc.Compress = thc.Compress
	hc.Minify = thc.Minify
	hc.Origin = thc.Origin
	hc.FileServer = thc.FileServer
	hc.CMS = thc.CMS
	hc.Remaining = nbuf

	return nil
}

// BUILD IN Components
type Stat struct {
	Enabled bool `json:"enabled"`
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

type Prot struct {
	Enabled   bool     `json:"enabled"`
	SQL       bool     `json:"sql"`
	Ignore    []string `json:"ignore"`
	Threshold int
}

type Compress struct {
	Enabled bool     `json:"enabled"`
	Mimes   []string `json:"mimes"`
	Files   []string `json:"files"`
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

type Origin struct {
	Enabled     bool     `json:"enabled"`
	MainDomains []string `json:"maindomains"`
	Default     string   `json:"default"`
	Methods     []string `json:"methods"`
	Headers     []string `json:"headers"`
	Credentials bool     `json:"credentials"`
}

type FileServer struct {
	Enabled    bool   `json:"enabled"`
	TakeOver   bool   `json:"takeover"`
	StaticPath string `json:"static"`
}

type CMS struct {
	Enabled     bool            `json:"enabled"`
	Engines     map[string]bool `json:"engines"`
	Browser     Browser         `json:"browser"`
	ConfigFiles []string        `json:"config"`
	Config      *xconfig.XConfig
}

type Error struct {
	Enabled bool `json:"enabled"`
}

type Browser struct {
	Enabled   bool      `json:"enabled"`
	UserAgent UserAgent `json:"useragent"`
}

type UserAgent struct {
	Enabled bool     `json:"enabled"`
	Devices []string `json:"devices"`
}

// EXTERNAL COMPONENTS

type ComponentDef struct {
	Name    string
	Enabled bool
	Status  int

	Params map[string]interface{}
	Config interface{}
}
