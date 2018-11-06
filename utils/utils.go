package utils

import (
  "os"
)

func SearchInArray(x string, array []string) bool {
  for _, s := range array {
    if s == x {
      return true
    }
  }
  return false
}

func FileExists(path string) (bool) {
  _, err := os.Stat(path) // exists AND readable, no perms problems, etc
  if err == nil { return true }
  return false
}