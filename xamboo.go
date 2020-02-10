package main

import (
	"flag"
	"fmt"
	"github.com/webability-go/xamboo/server"
)

const VERSION = "1.0.1"

func main() {
	// *** system Language !!! preload

	var file string
	flag.StringVar(&file, "config", "", "configuration file")
	flag.Parse()

	if file == "" {
		fmt.Println("The configuration file is missing as argument --config=file")
		return
	}

	err := server.Run(file)
	if err != nil {
		fmt.Println(err)
	}
}
