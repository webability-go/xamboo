package log

type LogConfig struct {
	Enabled     bool   `json:"enabled"`
	Pages       string `json:"pages"`
	PagesFormat string `json:"pagesformat"`
	Errors      string `json:"errors"`
	Sys         string `json:"sys"`
	Stats       string `json:"stats"`
	Status      int
}
