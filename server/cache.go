package server

import (
  "sync"
)

type Cache struct {
  mutex sync.Mutex
  id string
  items map[string]interface{}
}

func NewCache() *Cache {
  x := &Cache{}
  x.items = make(map[string]interface{})
  return x
}

func (c *Cache)Set(key string, data interface{}) {
  c.mutex.Lock()
  c.items[key] = data
  c.mutex.Unlock()
}

func (c *Cache)Get(key string) interface{} {
  c.mutex.Lock()
  if x, ok := (*c).items[key]; ok {
    c.mutex.Unlock()
    return x
  }
	c.mutex.Unlock()
  return nil
}

func (c *Cache)Count() int {
  c.mutex.Lock()
  x := len(c.items)
  c.mutex.Unlock()
  return x
}

