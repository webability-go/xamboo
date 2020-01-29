package main

import (
	"flag"
	"fmt"
	"github.com/webability-go/xamboo/engine"
)

const VERSION = "0.3.0"

func main() {
	// *** system Language !!! preload

	var file string
	flag.StringVar(&file, "config", "", "configuration file")
	flag.Parse()

	if file == "" {
		fmt.Println("The configuration file is missing as argument --config=file")
		return
	}

	err := engine.Run(file)
	if err != nil {
		fmt.Println(err)
	}
}
