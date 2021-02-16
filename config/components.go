package config

import (
	"encoding/json"
	//	"fmt"
	//	"plugin"
	//	"github.com/webability-go/xconfig"
)

type ComponentList []Component
type TComponentList []Component

type Component struct {
	Name    string `json:"name"`
	Source  string `json:"source"`
	Library string `json:"library"`
	// Status is 0 = nothing new, 1 = new, 2 = changed, 3 = deleted
	Status int
}

func (ccl *ComponentList) Exists(compcc Component) bool {
	for _, cc := range *ccl {
		if compcc.Name == cc.Name {
			return true
		}
	}
	return false
}

func (ccl *ComponentList) UnmarshalJSON(buf []byte) error {
	tccl := TComponentList{}
	json.Unmarshal(buf, &tccl)
	for _, x := range tccl {
		if !ccl.Exists(x) {
			*ccl = append(*ccl, x)
		}
	}
	return nil
}
