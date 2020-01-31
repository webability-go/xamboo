package utils

import (
	"os"
	"path/filepath"
	"strings"
	"time"
)

func SearchInArray(x string, array []string) bool {
	for _, s := range array {
		if s == x {
			return true
		}
	}
	return false
}

func FileExists(path string) bool {
	_, err := os.Stat(path) // exists AND readable, no perms problems, etc
	if err == nil {
		return true
	}
	return false
}

func FileValidator(key string, otime time.Time) bool {

	fi, err := os.Stat(key)
	if err != nil {
		// Does not exists anymore, invalid
		return false
	}
	mtime := fi.ModTime()
	if mtime.After(otime) {
		// file is newer, invalid
		return false
	}
	// All ok, valid
	return true
}

func LastPath(path string) string {
	xpath := strings.Split(path, "/")
	if len(xpath) == 0 {
		return ""
	}
	return xpath[len(xpath)-1]
}

func GzipFileCandidate(patterns []string, filename string) bool {
	for _, pattern := range patterns {
		name := filepath.Base(filename)
		matched, _ := filepath.Match(pattern, name)
		if matched {
			return true
		}
	}
	return false
}

func GzipMimeCandidate(patterns []string, mime string) bool {
	for _, pattern := range patterns {
		if strings.Contains(mime, pattern) {
			return true
		}
	}
	return false
}
