package assets

import (
	"fmt"

	"github.com/webability-go/xconfig"

	"github.com/webability-go/xamboo/server/assets"
)

// The context containers file is {resourcesdir}/containers.conf
type Context struct {
	ID     string
	Path   string
	Config *xconfig.XConfig
}

type Container struct {
	Name     string
	Path     string
	LogFile  string
	Config   *xconfig.XConfig
	Contexts []*Context
}

type ContainersList interface {
	fmt.Stringer   // please implement String()
	fmt.GoStringer // Please implement GoString()

	Load(ctx *assets.Context, id string, contextfile string)
	UpsertContainer(containerid string, newid string, path string) *Container
	UpsertContext(containerid string, contextid string, newid string, path string) *Context

	GetContainersList() []*Container
	GetContainer(containerid string) *Container
	GetContext(containerid string, contextid string) *Context

	// save only the list of containers ~/resources/contextscontainers.conf
	SaveContainers(ctx *assets.Context)
	// save only the container contexts config ~/config/contexts.conf
	SaveContainer(ctx *assets.Context, containerid string)
	// save only the context config ~/config/ID.conf
	SaveContext(ctx *assets.Context, containerid string, contextid string)
}

func (c *Container) String() string {
	s := "CONTAINER: " + fmt.Sprintf("%v\n", *c)
	return s
}

func (c *Container) GoString() string {
	s := "#CONTAINER: " + fmt.Sprintf("%#v\n", *c)
	return s
}

func (c *Context) String() string {
	s := "CONTEXT: " + fmt.Sprintf("%v\n", *c)
	return s
}

func (c *Context) GoString() string {
	s := "#CONTEXT: " + fmt.Sprintf("%#v\n", *c)
	return s
}
