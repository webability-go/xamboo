package assets

import (
	"net/http"
)

type Component interface {
	NeedHandler() bool
	Handler(handler http.HandlerFunc) http.HandlerFunc
}

// Components:

type Origin struct {
	Enabled     bool     `json:"enabled"`
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
