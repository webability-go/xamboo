package config

import (
	"encoding/json"
	//	"fmt"
	//	"plugin"
	//	"github.com/webability-go/xconfig"
)

type ListenerList []Listener
type TListenerList []Listener

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

func (lcl *ListenerList) Exists(complc Listener) bool {
	for _, lc := range *lcl {
		if complc.Name == lc.Name {
			return true
		}
	}
	return false
}

func (lcl *ListenerList) UnmarshalJSON(buf []byte) error {
	tlcl := TListenerList{}
	json.Unmarshal(buf, &tlcl)
	for _, x := range tlcl {
		if !lcl.Exists(x) {
			*lcl = append(*lcl, x)
		}
	}
	return nil
}
