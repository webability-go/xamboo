package server

import (
  "fmt"
  "sync"
  "time"
  "os"
)

type CacheEntry struct {
  mtime time.Time
  data interface{}
}

type Cache struct {
  mutex sync.Mutex
  id string
  maxitems int
  isfile bool
  expire time.Duration
  items map[string]*CacheEntry
}

/* Every cache has an ID and a flag to know if it's a cache vs a file. 
   If it's a cache vs a file, then the system will check the validity vs file date
*/

func NewCache(id string, maxitems int, isfile bool, expire time.Duration) *Cache {
  return &Cache{
    id: id,
    isfile: isfile,
    maxitems: maxitems,
    expire: expire,
    items: make(map[string]*CacheEntry),
  }
}

func (c *Cache)Set(key string, indata interface{}) {
  c.mutex.Lock()
  c.items[key] = &CacheEntry{mtime: time.Now(), data: indata}
  c.mutex.Unlock()
}

// second parameter is "invalid"
// if the object does not exist in memory, returns nil, false
// if the object does exist and is good, returns object, false
// if the object does exist and is invalid, returns nil, true
func (c *Cache)Get(key string) (interface{}, bool) {
  c.mutex.Lock()
  if x, ok := (*c).items[key]; ok {
    c.mutex.Unlock()
    if c.isfile {
      fi, err := os.Stat(key)
      if err != nil {
        // destroy the entry AND the used memory
        fmt.Println("Cache File Error and Invalid: " + key)
        return nil, true
      }
      mtime := fi.ModTime()
      if mtime.After(x.mtime) {
        // destroy the entry AND the used memory
        fmt.Println("Cache File Modified and Invalid: " + key)
        return nil, true
      }
    }
    // expired ?
        // destroy the entry AND the used memory
    
    return x.data, false
  }
	c.mutex.Unlock()
  return nil, false
}

func (c *Cache)Del(key string) {


}

func (c *Cache)Count() int {
  c.mutex.Lock()
  x := len(c.items)
  c.mutex.Unlock()
  return x
}
