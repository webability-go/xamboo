package main

import (
	"flag"
	"log"

	"github.com/webability-go/xamboo/server"
)

// VERSION oficial of the xamboo
const VERSION = "1.2.7"

func main() {
	// *** system Language !!! preload

	var file string
	flag.StringVar(&file, "config", "", "configuration file")
	flag.Parse()

	if file == "" {
		log.Fatalln("The configuration file is missing as argument --config=file")
		return
	}

	err := server.Run(file, VERSION)
	if err != nil {
		log.Println(err)
	}
}
