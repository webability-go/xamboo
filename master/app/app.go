package main

import (
	"fmt"

	"github.com/webability-go/xamboo/server/config"

	_ "github.com/webability-go/xmodules/context"

	//	_ "github.com/webability-go/xmodules/admin"
	_ "github.com/webability-go/xmodules/translation"
	_ "github.com/webability-go/xmodules/user"
)

const VERSION = "1.0.0"

func init() {
	fmt.Println("Master APP Main SO library initialized, VERSION =", VERSION)
}

func Start(h config.Host) {
	fmt.Println("Master APP Main SO library Started, HOST =", h.Name)
}
