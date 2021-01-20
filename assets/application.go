package assets

import (
	"log"

	"golang.org/x/text/language"

	"github.com/webability-go/xconfig"
	"github.com/webability-go/xcore/v2"
	"github.com/webability-go/xdominion"
)

// Application must be compliant with the interface Application
// Applications ARE plugins

type Application interface {
	// standard APPs function
	StartHost(h Host)
	StartContext(ctx *Context)
	GetDatasourcesConfigFile() string
	GetDatasourceSet() DatasourceSet
	GetCompiledModules() ModuleSet
}

type ModuleSet interface {
	Register(m Module)
	Get(id string) Module
}

type Module interface {
	GetID() string
	GetVersion() string
	GetLanguages() map[language.Tag]string
	GetNeeds() []string // module[.version[+]]

	GetInstalledVersion(Datasource) string
	Setup(Datasource, string) ([]string, error)       // setup the module in the datasource (link tables definitions and others for first time)
	Synchronize(Datasource, string) ([]string, error) // build anything missing into the datasource (tables, logs, files, etc)
	StartContext(Datasource, *Context) error          // Called at any start of a new context
}

type DatasourceSet interface {
	SetDatasource(id string, ctx Datasource)
	GetDatasource(id string) Datasource
	GetDatasources() map[string]Datasource
	CreateDatasource(name string, config *xconfig.XConfig) (Datasource, error)
	TryDatasource(ctx *Context, defaultdatasourcename string) Datasource
}

// Datasource is a portable structure interface containing pointer to usefull functions used in any datasources of applications
// Since it's thread safe and based on maps and slices, it must be accessed through Get/Set functions with mutexes
// to avoid race conditions
// The is only ONE database by datasource, with a set of modules and tables into this database.
type Datasource interface {
	// general needed funcion
	GetName() string
	AddLanguage(lang language.Tag)
	GetLanguages() []language.Tag
	SetLog(id string, logger *log.Logger)
	GetLog(id string) *log.Logger
	GetLogs() map[string]*log.Logger
	Log(id string, messages ...interface{})
	SetDatabase(db *xdominion.XBase)
	GetDatabase() *xdominion.XBase
	SetTable(id string, table *xdominion.XTable)
	GetTable(id string) *xdominion.XTable
	GetTables() map[string]*xdominion.XTable
	SetCache(id string, cache *xcore.XCache)
	GetCache(id string) *xcore.XCache
	GetCaches() map[string]*xcore.XCache
	SetModule(moduleid string, moduleversion string)
	GetModule(moduleid string) string
	GetModules() map[string]string
	IsModuleAuthorized(id string) bool
	// Functions to clone the shell and build transactions
	CloneShell() Datasource
	StartTransaction() (*xdominion.XTransaction, error)
	GetTransaction() *xdominion.XTransaction
	Commit() error
	Rollback() error
}
