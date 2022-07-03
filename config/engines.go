package config

import (
	"encoding/json"
	//	"fmt"
	//	"plugin"
	//	"github.com/webability-go/xconfig"
)

type EngineList []Engine
type TEngineList []Engine

type Engine struct {
	Name        string `json:"name"`
	Source      string `json:"source"`
	Librarypath string `json:"librarypath"`
	Library     string `json:"library"`
	// Status is 0 = nothing new, 1 = new, 2 = changed, 3 = deleted
	Status int
}

func (ecl *EngineList) Exists(compec Engine) bool {
	for _, ec := range *ecl {
		if compec.Name == ec.Name {
			return true
		}
	}
	return false
}

func (ecl *EngineList) UnmarshalJSON(buf []byte) error {
	tecl := TEngineList{}
	json.Unmarshal(buf, &tecl)
	for _, x := range tecl {
		if !ecl.Exists(x) {
			*ecl = append(*ecl, x)
		}
	}
	return nil
}
