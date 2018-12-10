package stat

import (
//  "fmt"
  "time"
  
  "github.com/webability-go/xamboo/config"
)

/*
This code keeps tracks and stats of the whole webserver and served pages and requests
*/

type SiteStat struct {
  Requests       int
  RequestsServed map[int]int
}

type Stat struct {
  Requests       int             // Bit total, anything included
  LengthServed   int             // Bit total, anything included
  RequestsServed map[int]int     // by response code
  
  SitesStat      map[string]*SiteStat    // Every site stat. referenced by ID (from config)
}

var SystemStat = CreateStat()

func CreateStat() *Stat {
  s := &Stat{
    Requests: 0,
    RequestsServed: make(map[int]int),
    SitesStat: make(map[string]*SiteStat),
  }
  for _, host := range config.Config.Hosts {
    s.SitesStat[host.Name] = &SiteStat{
      RequestsServed: make(map[int]int),
    }
  }
  return s
}

func AddStat(id string, response int, length int, duration time.Duration) {
  
  SystemStat.Requests += 1
  SystemStat.LengthServed += length
  
  // Adding stat to the site:
  
}