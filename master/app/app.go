package main

import (
	"fmt"

	"github.com/webability-go/xamboo/server/config"
)

const VERSION = "1.0.0"

func init() {
	fmt.Println("Master APP Main SO library initialized, VERSION =", VERSION)
}

func Start(h config.Host) {
	fmt.Println("Master APP Main SO library Started, HOST =", h.Name)
}
