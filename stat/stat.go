package stat

import (
//  "fmt"
  "time"
  
  "github.com/webability-go/xamboo/config"
)

/*
This code keeps tracks and stats of the whole webserver and served pages and requests
*/

type RequestStat struct {
  Id       uint64
  Time     time.Time
  Request  string
  Method   string
  Code     int
  Length   int
  Duration time.Duration
}

type SiteStat struct {
  RequestsTotal  int                     // num requests total, anything included
  RequestsServed map[int]int             // by response code
  LengthServed   int                     // length total, anything included
  Requests       []*RequestStat          // the last minute requests
}

type Stat struct {
  RequestsTotal  int                     // num requests total, anything included
  LengthServed   int                     // length total, anything included
  RequestsServed map[int]int             // by response code
  Requests       []*RequestStat          // by microtime. keep last minute requests
  
  SitesStat      map[string]*SiteStat    // Every site stat. referenced by ID (from config)
}

var SystemStat = CreateStat()
var RequestCounter uint64

func CreateStat() *Stat {
  s := &Stat{
    RequestsTotal: 0,
    RequestsServed: make(map[int]int),
    LengthServed: 0,
    SitesStat: make(map[string]*SiteStat),
  }
  for _, host := range config.Config.Hosts {
    s.SitesStat[host.Name] = &SiteStat{
      RequestsServed: make(map[int]int),
    }
  }
  return s
}

func CreateRequestStat(request string, method string, code int, length int, duration time.Duration) *RequestStat {
  
  SystemStat.RequestsTotal ++
  SystemStat.LengthServed += length
  r := &RequestStat{
    Id: RequestCounter,
    Time: time.Now(),
    Request: request,
    Method: method,
    Code: code,
    Length: length,
    Duration: duration,
  } 
  RequestCounter++
  SystemStat.Requests = append(SystemStat.Requests, r)
  
  // Adding stat to the site:
  return r
}

func (r *RequestStat)UpdateStat(code int, length int, duration time.Duration) {
  r.Code = code
  r.Length = length
  SystemStat.LengthServed += length
  r.Duration = duration
}

