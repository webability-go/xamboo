
Xamboo for GO v1
=============================

Xamboo is the result of over 15 years of manufacturing engineering frameworks, originally written for PHP 7+ and now ported to GO 1.14+

It is a very high quality framework for CMS, made in GO 1.14 or higher, fully object-oriented and strong to distribute code into Web portals with heavy load and REST APIs optimization.

Xamboo is freeware, and uses several other freeware components (XConfig, XCore, XDominion, WAJAF)

Xamboo is an engine to build applications that distribute any type of code to the client:
It is completely independent of the generated code, i.e. you can send HTML, XHTML, XML, SGML, javascript, JSON, PDF, images, videos, etc.

Xamboo works on sites currently distributing more than **90 millions web pages monthly**, (that's near 500 pages per second on peak hour) it serves regular sites, and GRAPH-APIs / REST APIs to APP-mobiles.

The Xamboo server works only on Unix systems, since it makes a heavy use of plugins (.so librairies) that are not compatible with windows.

INSTALATION AND COMPILATION
=============================

To install a working Xamboo system, we will use the xamboo-env project that will use the xamboo library.

You need GO 1.15 installed and working on your server.

Create a new directory for your Xamboo Server, for instance /home/sites/server

```
$ mkdir /home/sites/server
```

Go into your server directory and create a git:

```
$ cd /home/sites/server
$ git init
```

Then pull the last version of Xamboo Ready to use environment project for Xamboo Server.

```
$ git pull https://github.com/webability-go/xamboo-env.git
```

You may also add the master site for web administration of the Xamboo (optional):

```
$ mkdir /home/sites/server/master
$ cd /home/sites/server/master
$ git init
$ git pull https://github.com/webability-go/xamboo-master.git
$ cd ..
```

And also add the administration site for your application, installation and administration of the xmodules (optional):

```
$ mkdir /home/sites/server/admin
$ cd /home/sites/server/admin
$ git init
$ git pull https://github.com/webability-go/xamboo-admin.git
$ cd ..
```

You need to edit each .json files to adapt it to your own IP and ports
You can also link the master config.json to the mainconfig.json (commented lines)
You can also link the admin config.json to the mainconfig.json (commented lines)

Set the Listeners IP and Port so the service will work on your machine.
Set the Hosts domains so the service will resolve. Do not forget to add those domains to your DNS too.

Upgrade to the lastest versions, then run the xamboo with master, admin and examples

```
$ go get -u
$ start.sh
```


To build your own server:

Edit start.sh, json config files and change the config file path.

You can copy the example directory and change anything you need, or build from scratch.

The master site is not necessary to make the Xamboo to work. It's a helpfull tool to configure and install anything easier and edit the json config files.

The admin site is not necessary but is a good start to build your own administration system for your site if you need one.

Install the master site and install contexts with XModules for any site you need.

You can compile xamboo to an executable with:

```
go build xamboo.go
```

You do not need to recompile any component, engine, app or page any time you restart the server. The system compile things as needed. You may recompile anything before launching on a production site, for velocity, but it is not necessary. The xamboo will do automatically.

You will need the original code so the compiler is able to compile pages and libraries without problem at anytime. It will use the go.mod and go.sum retrieved with the Xamboo-env.

You may attach the xamboo to an OS/service, calling the start.sh


CONFIGURATION FILES
=============================

Starting the Xamboo, you need to pass a configuration JSON file to the application with --config=[config path]

You may use absolute paths, but it's very recommended to use only relative paths for portability. All the path you will use are relative to the directory where you launch your xamboo application.

The config file is a JSON object which have 6 main sections.
```
{
  "log": {},
  "include": [],
  "listeners": [],
  "hosts": [],
  "components": [],
  "engines": []
}
```

You may add other entries into each level for comments, they are just going to be ignored.
```
{
  "comments": "This comment entry will be ignored by the xamboo",
  "log-comments": "The logs are into the /var/log directory on my server",
  "log": {},
  "include-comments": "Each site has its own config file included",
  "not-included": ["site1/config.json", "site2/config.json"],
  "include": [],
  "listeners": [],
  "hosts": [],
  "components": [],
  "engines": []
}
```

Every entry is optional in each file, but you must have them at least once in the full configuration with included files.
For instance you may have only log and include section in the main config, and listeners, hosts and engines in the included file.

The final config will concatenate every section together.
For instance if in the config for site1 you have listener1 and listener2, and host1; and in the config for site2 you have listener3 and host2,
```
{
  "comments": "MAIN CONFIG",
  "log": {},
  "include": ["site1/config.json", "site2/config.json"],
  "components": [],
  "engines": []
}

{
  "comments": "site1/config.json",
  "listeners": [ <LISTENER1>, <LISTENER2> ],
  "hosts": [ <HOST1> ]
}

{
  "comments": "site2/config.json",
  "listeners": [ <LISTENER3> ],
  "hosts": [ <HOST2> ]
}
```

the result configuration would be (as interpreted by Xamboo):
```
{
  "log": {},
  "listeners": [ <LISTENER1>, <LISTENER2>, <LISTENER3> ],
  "hosts": [ <HOST1>, <HOST2> ]
  "components": [],
  "engines": []
}
```

1. "log" section
-----------------------------

The log section may contains the following parameters:

```
{
  "log": {
    "enabled": true,
    "sys": "file:./example/logs/xamboo-sys.log",
    "pages": "file:./example/logs/developers.log",
    "pagesformat": "%requestid% %clientip% %method% %protocol% %code% %request% %duration% %bytesout% %bytestocompress% %bytestominify%",
    "errors": "file:./example/logs/xamboo-error.log",
    "stats": "discard",
  },
  ...
}
```

The log section is present in the root of the config file (main log), and also into each of the hosts and listeners defined in "hosts" and "listeners" sections.

* Main log:

Only "sys" and "errors" logs are used, "enabled" is ignored

* Listener log:

Only "sys" log is used, "enabled" is ignored

* Host log:

"enabled" (true/false) parameter, and "sys", "pages", "pagesformat", "errors" and "stats" logs are used.

Any other entry is ignored.

---

The "sys" logs will log anything "normal" for the object, for instance all the http.net server messages from TLS , startup, shutdown, etc.
The "errors" logs will always receive any errors that may happen in the system, from main thread up to each hit on server (even panic errors and recovered errors.)
The "pages" logs will log any hit on any pages and files for the host.
Finally, the "stat" log will call any file or function at the same time as the "pages" log, but you are free to call a function with the whole context to log anything anywhere you need to.

Each log entry can be one of:

- file:<file>
- stdout:
- stderr:
- discard

The stat log can also be "call:<app plugin>:<entry function>".
The function will be called for each hit on the host, with the server context so you can log anything you want anywhere you want to.

The function must be publicly exported like this in your application plugin:

```
import "github.com/webability-go/xamboo/cms/context"

func Log(ctx *context.Context) {
	// do the log
}
```


2. "listeners" section
-----------------------------

The listener is the thread charged to listen to a specific IP:Port on the server, with some metrics and logs.

The general syntax is:

```
"listeners": [ <LISTENER1>, <LISTENER2>, ... ]

Each listener is:

  {
    "name": "NAME",
    "ip": "IP",
    "port": "PORT",
    "protocol": "PROTOCOL",
    "readtimeout": TIMEOUT,
    "writetimeout": TIMEOUT,
    "headersize": SIZE,
    "log": {
      "sys": "SYSLOG",
    }
  }
```

Where each parameter is:

- NAME: is the name of the listener (any string)
- IP: is the IP to listen to. If the IP is empty "", then the server will listen to all the available IPs on the server.
- PORT: is the port to listen to.
- PROTOCOL: is the protocol to listen to. For now, Xamboo knows http and https only.
- TIMEOUT: is a number between 0 and 65535, the time is in seconds. Recommended values are 120 seconds (2 minutes)
- SIZE: is a number between 4096 and 65535, the size is in bytes.
- the SYSLOG is explained in the log section.

Example of a working real listeners for HTTP and HTTPS:

```
"listeners": [
  {
    "name": "server-http",
    "ip": "10.10.10.10",
    "port": "80",
    "protocol": "http",
    "readtimeout": 120,
    "writetimeout": 120,
    "headersize": 65536,
    "log": {
      "sys": "file:./logs/listener-http-sys.log",
    }
  },
  {
    "name": "server-https",
    "ip": "10.10.10.10",
    "port": "443",
    "protocol": "https",
    "readtimeout": 120,
    "writetimeout": 120,
    "headersize": 65536,
    "log": {
      "sys": "file:./logs/listener-https-sys.log",
    }
  }
]
```

3. "hosts" section
-----------------------------

A Host is the equivalent to a site responding to requests on a Listener. The site is named with a (sub) domain name.
Any host can listen on any listener, and respond to any domain in the configuration.

A Host may have components activated, like compressed response, minify HTML/CSS/JS response, Basic Auth, Redirect, etc.

The components can be built-in or programmed.

The general syntax is:

```
"hosts": [
  {
    "name": "developers",
    "listeners": [ "http", "https" ],
    "hostnames": [ "developers.webability.info", "www.webability.info", "webability.info", "webability.org" ],
    "cert": "./example/ssl/cert.pem",
    "key": "./example/ssl/privkey.pem",
    "plugins": [
      { "Name":"app",
        "Library": "./example/app/app.so"
      }
    ],

    "COMPONENT-NAME": { COMPONENT-CONFIG }

  },
  ...
  ]
```

The Host as a name, which is a free string.
The Listeners section contains all the previously declared listeners in the config you want to respond for this host.
The hostnames section contains all the host names (domain names) that will answer to the requests.

The cert and key is the SSL certificate for the site, only if there is any listener on HTTPS protocol.
The cert should include all the hostname you declare for this site.

The plugins are the external .so libraries to load with the host. See the programmation section to build them.

The available built-in components are:

- log: will log the system statistics into the declared logs into the configuration.
- stat: will store all the system statistics and also the requests (used by log).
- redirect: will control the called domain and port, and redirect to the correct one if it is any other variant.
- auth: will control the access with a username and password for basic realm authorization to access site.
- compress: will compress the content as asked by the client (gzip or deflate) based on mime content
- minify: will minify the html, css, javascript, json, xml text files if authorized type of file or mime.
- origin: will set authorized headers for cros origin APIs based on rules.
- fileserver: will serve static files from a static directory.
- cms: will build the pages based on the Xamboo CMS. Have a browser sub module.
-- browser: will set the page version to the type of device.
- error: will serve a 404 error.

Each component can be enabled or disabled. See the following section.

4. Components
-----------------------------

4.1. Definition and loading the components
-----------------------------

The main components section follow the following structure:

```
{
  "components": [
    { "name": "log", "source": "built-in" },
    { "name": "stat", "source": "built-in" },
    { "name": "redirect", "source": "built-in" },
    { "name": "auth", "source": "built-in" },
    { "name": "compress", "source": "built-in" },
    { "name": "minify", "source": "built-in" },
    { "name": "origin", "source": "built-in" },
    { "name": "fileserver", "source": "built-in" },
    { "name": "cms", "source": "built-in" },
    { "name": "error", "source": "built-in" },
    { "name": "myhandler", "source": "extern", "library": "./example/components/myhandler/myhandler.so" }
  ],
  ...
}
```

A component is a plugin module (built-in or external) that is called as a middleware on the server handler.
The order of components is VERY IMPORTANT. Let them in this order unless you perfectly know what you are doing.

When you want to add a hand made component, the syntax is:

```
  { "name": "mycomponent", "source": "extern", "library": "./path/to/your/mycomponent.so" },
```

You may need to developp a new components for instance to replace a built-in one, or add new components.

For instance if you need a "auth" component based on a database for users, you may copy the library to your own directory and modify it to your needs, then call it as a extern library instead of the built-in one.

Another example would be a component to verify security and SQL injection and reject the request if it does not pass though the security system. This component could be inserted before the redirect component.

4.2. List of build-in components
-----------------------------

4.2.1. log
-----------------------------

The log configuration parameters are
```
"hosts": [
  {
    ...
    "log": {
      "enabled": true,
      "pages": "file:./example/logs/developers.log",
      "pagesformat": "%requestid% %clientip% %method% %protocol% %code% %request% %duration% %bytesout% %bytestocompress% %bytestominify%",
      "errors": "file:./example/logs/developers-error.log",
      "sys": "file:./example/logs/developers-sys.log",
      "stats": "discard"
    }
  },
  ...
  ]
```

enabled: true/false, to activate or de-activate the log system.

pages: the file or stream to send the statistics of requests.

pages-format: is the format to log the requests. The list of known parameters are:
- %bytesout%: The quantity of bytes sent to the client (header not included)
- %bytestocompress%: The quantity of bytes before compressing the data sent to the client
- %bytestominify%: The quantity of bytes before minifying the data sent to the client
- %clientip%: The client IP
- %clientport%: The client Port
- %code%: The return code (200, 404, etc)
- %duration%: The duration of the data calculation, from receiving the request up to send it to the client
- %hostid%: The ID of the host serving the request
- %listenerid%: The ID of the listener serving the request
- %listenerip%: The IP of the listener serving the request
- %listenerport%: The Port of the listener serving the request
- %protocol%: The requested protocol (HTTP, HTTPS, WS, WSS)
- %method%: The requested method (GET, POST, PUT, HEAD, OPTION, DELETE, ...)
- %request%: The full string request from the client
- %starttime%: The start time when the request has been received
- %endtime%: The end time when the request is finished to be calculated and sent to the client
- %requestid%": The Unique Internal ID of the request

If a parameter have an empty value, it is replace with a - (dash)

errors: the file or stream to send the errors happening in the system. Note: a 404 is not an error per se and will be logged into pages log.

sys: the file or stream to send the internal messages.

stat: the function to call when a request is done and executed in the listener/host.

The stat function is a public function from any of your loaded plugins.

The general syntax is:

```
import "github.com/webability-go/xamboo/cms/context"

func Log(ctx *context.Context) {
	// do the log
}
```

4.2.2. stat
-----------------------------

This component is used to build the request parameters and statictics so the log component can use it.

It cannot be disabled.

It will also store all the system stats like total request per minute, total lifetime requests served, quantity of requests by type,
system global stats.

It is used by the master environment to display all realtime statistics of the server.

4.2.3. redirect
-----------------------------

The redirect configuration parameters are
```
"hosts": [
  {
    ...
    "redirect": {
      "enabled": true,
      "scheme": "https",
      "host": "developers.webability.info:83"
    }
  },
  ...
  ]
```

enabled: true/false, to activate or de-activate the redirect component.

If the request does not correspond to the default configured scheme and host, the request will be automatically
redirected to the correct URL with a 301 status code.

4.2.4. auth
-----------------------------

The auth configuration parameters are
```
"hosts": [
  {
    ...
    "auth": {
      "enabled": true,
      "realm": "Xamboo Env test (xamboo/xamboo)",
      "user": "xamboo",
      "pass": "xamboo"
    }
  },
  ...
  ]
```

enabled: true/false, to activate or de-activate the auth component.

The realm is the title of the real that should be displayed on the user login form of the browser.

User and pass are the expected data to be captured to authorized the use of the host.

If the user and pass are wrong, the system returns a 401 unauthorized status.


4.2.5. compress
-----------------------------

The compress configuration parameters are
```
"hosts": [
  {
    ...

    "compress": {
      "enabled": true,
      "mimes": [
        "text/html",
        "text/css",
        "application/javascript"
      ],
      "files": [
        "*.ico",
        "*.css",
        "*.js",
        "*.html"
      ]
    }
  },
  ...
  ]
```

enabled: true/false, to activate or de-activate the compress component.

The component will listen to the request and compress the information to send back only if:
- The client ask for a compressed content (deflate or gzip)
- The information mime correspond to the authorized mimes to compress
- The requested file (fileserver type) correspond to the authorized extentions

mimes is the list of authorized mimes to compress. If the information is any other type of mime, it will not be compressed.

files is the list of filters on file names to compress. They are normal file names, with files joker (* and ?)


4.2.6. minify
-----------------------------

The minify configuration parameters are
```
"hosts": [
  {
    ...
    "minify": {
      "enabled": true,
      "html": true,
      "css": true,
      "js": true,
      "json": true,
      "svg": true,
      "xml": true
    }
  },
  ...
  ]
```

enabled: true/false, to activate or de-activate the minify component.

The component will minify the type of generated code (based on mime).
Activate or deactivate each type of information.


4.2.7. origin
-----------------------------

The origin configuration parameters are
```
"hosts": [
  {
    ...
    "origin": {
      "enabled": true,
      "maindomains": ["webability.info"],
      "default": "https://developers.webability.info",
      "methods": ["GET", "POST", "OPTIONS", "HEAD"],
      "headers": ["Accept", "Content-Type", "Content-Length", "Accept-Encoding", "X-CSRF-Token", "Authorization", "Origin", "X-Requested-With", "Method"],
      "credentials": true
    }
  },
  ...
  ]
```

enabled: true/false, to activate or de-activate the origin component.

The component will identify an OPTIONS or HEAD request and distribute the correct headers to authorize cross origin of requests.

You should use this component only when you program some REST API or so.


4.2.8. fileserver
-----------------------------

The fileserver configuration parameters are
```
"hosts": [
  {
    ...
    "fileserver": {
      "enabled": true,
      "takeover": false,
      "static": "./example/repository/public/static"
    }
  },
  ...
  ]
```

enabled: true/false, to activate or de-activate the fileserver component.

If the takeover is true, then the host will server only files. If a file does not exists, then the 404 is launched by the file server.

If the takeover is false, when a file does not exists, the next handler will be called. This is perfect to serve static files on a CMS or so.

The static directy is where the static files are.


4.2.9. cms
-----------------------------

The CMS is a full content mamagement system with meta language, to build powerfull dynamic sites, with business rules implemented directly into pages and code.

The full CMS manuals and references are below this manual.

The cms configuration parameters are
```
"hosts": [
  {
    ...
    "cms": {
      "enabled": true,
      "config": [
        "./example/application/config/example.conf"
      ],
      "engines": {
        "simple": true,
        "library": true,
        "template": true,
        "language": true,
        "wajafapp": true,
        "box": true
      },
      "browser": {
        "enabled": true,
        "useragent": {
          "enabled": true,
          "comments": "The context.Version will have one of: computer, phone, tablet, tv, console, wearable, base when the module is enabled"
        }
      }
    }
  },
  ...
  ]
```

enabled: true/false, to activate or de-activate the cms component.

CMS Configuration files
-----------------------------

Wait, why an extra configuration file?

The configuration file is a set of param-value pairs that will be used into the construction of the site by both the pages engines and your own code. This is a XConfig configuration file (see the github.com/webability-go/xconfig manuals) for the whole code parameters.

You may add as many as parameters you need for your code; the important ones for Xamboo are:

```
# The main example site configuration file

# Where the pages of our CMS is
# pagesdir can be relative to the xamboo run directory (prefered), or absolute
pagesdir=./example/application/pages/

# The main page to use for / (your home page) (must exists in the pages)
mainpage=home
errorpage=errors/page
errorblock=errors/block

#  The default version of the pages for this site. It is highly recommended to never change 'base' unless you perfectly know what you are doing (advanced configuration)
#  The host module "browser-useragent" will change the version based on the type of connected device to your site if activated.
version=base
#  The default language of the pages for this site. You may change with your local language
language=en

# If the pages of the site accept parameters as URL by default (like this: /the-page/param1/param2/param3 )
# MAIN PAGE SHOULD NEVER ACCEPT PARAMETERS unless you perfectly know what you do (calling icons, files, etc should get main page instead of a 404 for instance)
# boolean: yes/no, true/false, 0/1
acceptpathparameters=yes

```

engines: The authorized engines to be used by the CMS on this host.
You may deactivate any not used engine for pages calculation, setting the parameter to false.

browser: This is a sub component for the cms engine.

browser>enabled: true/false, to activate or de-activate the browser sub component.

browser>useragent: will be able to replace the browser type into the version of the page so you can build version of pages based on the type of browser.
Known types of browsers are:
- pc, mobile, tablet, tv, console, wearable, base

The base template is used if the type of browser is unknown.

Then CMS makes a full takeover on the handlers, so none of the following handlers will be called.


4.2.10. error
-----------------------------

The error component will only returns a 404 errors. You may want to build your own error component to personalize the returned data.

The error configuration parameters are
```
"hosts": [
  {
    ...
    "error": {
      "enabled": false
    }
  },
  ...
  ]
```

enabled: true/false, to activate or de-activate the error component.


4.3. Reference to build a new component
-----------------------------

To build your own component, you need a public exported variable called Component and it must meet the xamboo/components/assets.Component interface definition.

So it needs 3 functions to be callable by the components system:
```
type Component interface {
	Start()
	NeedHandler() bool
	Handler(handler http.HandlerFunc) http.HandlerFunc
}
```

For instance this is the simplest error system component:

```
package mycomponent

import (
	"net/http"
)

var Component = &MyComponent{}

type MyComponent struct{}

func (mc *MyComponent) Start() {
}

func (mc *MyComponent) NeedHandler() bool {
	return true
}

func (mc *MyComponent) Handler(handler http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
    http.Error(w, "404 Not Found", http.StatusNotFound)
  }
}
```

You may add as much as code you need before and after the handler call.

Start is called when the component is loaded for the first time by the system (like an init, but once the system is loaded).

NeedHandler must return true to be considered by the components system.

Finally the Handler function returns the handler that will encapsulate next handler in chain, and encapsulated by previous handler in chain.

If the handler is not enabled or activated by your configuration on the host, you need to directly call the handler parameter of Handler function.


5. "engines" section
-----------------------------

5.1. Definition and loading the engines
-----------------------------

The main engines section follow the following structure:

```
{
  "engines":
  [
    { "name": "redirect", "source": "built-in" },
    { "name": "simple", "source": "built-in" },
    { "name": "library", "source": "built-in" },
    { "name": "template", "source": "built-in" },
    { "name": "language", "source": "built-in" },
    { "name": "wajafapp", "source": "built-in" }
  ],
  ...
}
```

The engines are type of pages that can be called from the Xamboo server.
There are 6 build-in engines for standard type of pages, and you can add as many engines as you need. (See Engine section of this manual to know how to build them)

When you want to add a hand made external engine, the syntax is:

```
  { "name": "myengine", "source": "extern", "library": "./path/to/your/myengine.so" },
```

You may need to developp a new components for instance to replace a built-in one, or add new components.

For instance if you need a "auth" component based on a database for users, you may copy the library to your own directory and modify it to your needs, then call it as a extern library instead of the built-in one.

Another example would be a component to verify security and SQL injection and reject the request if it does not pass though the security system. This component could be inserted before the redirect component.

5.2. List of build-in engines
-----------------------------

5.2.1. redirect engine

5.2.2. simple engine

5.2.3. library engine

5.2.4. template engine

5.2.5. language engine

5.2.6. wajafapp engine


5.3. Reference to build a new engine
-----------------------------



CMS REFERENCE
=============================

The CMS code is contained into a directory that will contain a structure of directories and files that will follow the URLs called by the clients.

For instance, if your code container have a directory /blog/[some files] you may call from the web  https://mysite/blog

Some considerations:

- The root directory container is pointed by the 'pagesdir' config parameter.
- The home page is always a sub directory pointed by the 'mainpage' config parameter. The root directory files will be ignored.
- You need errorblock and errorpage directories created and working as a CMS page. They are pointed by 'errorblock' and 'errorpage' config parameters.

PAGES
=============================

1. What is a page: Engines, Instances, Languages and Versions.

A CMS page is one unique URL or a group of URLs with the same root. It corresponde to one library code into the server.

For example:

https://www.mysite.com/login   is a unique page for login on your site.

https://www.mysite.com/blog, https://www.mysite.com/blog/channel1, https://www.mysite.com/blog/article1, ...

are a group of URLs with a unique root https://www.mysite.com/blog

The code of the root will resolve which data to send to the client based on the URL.

This is considered a CMS page.

--

A CMS page will always output a some compatible code (call it HTML, JS, CSS, Image, Video etc.) but the way to achieve it may be very different, that's why there are several engines to build the page.

The built-in engines are decribed later in this document.

There can be template engines, GO code engines, file server engines, redirection engines, etc.
So evey page has a "type" of page which means which engine to use to build the page.

--

Every page may have a combination of versions and languages.
For example you may have your home page in spanish and english, for PC and for mobile.
You could obviously have your pages code N version * M languages, but that would be extremelly dificult to manage, so Xamboo hay many tools to only work with templates without languages, and tables of string in various languages to inject into the templates.

For instance, lets say you have 5 versions for pages:
- PC, mobile, print, smart watch and tablet.
An you have 10 languages to support:
- es, en, fr, jp, ar, pt, it, de, ru, cn

Instead of having 50 pages code ready to serve, you will only have 5 HTML templates and 10 languages XML files with compabible entries, and the engines will be in charge to build anything with that.

Every one of those 50 possible pages are called an instance.
You can have one instance per page, or have group of instances per page.
You may also define a set of parameters for each instance or group of instances.


2. Page resolution

Xamboo separates the path of the URI first. Leave the / at the beginning and removes the last /.

The notion of file does not exist in the framework. For example, /mi-ruta/mi-archivo.html is something not understood by the engine, unless there physically 'mi-file.html' folder within the 'my-route' folder in the root of the Web Site.
If you want to call a file as is, it must exists in the static repository, or a 404 will be returned.

Xamboo routes are manufactured to comply with the rules of SEO and search engine indexing.
Xamboo routes Xamboo accept only the following characters:

A-Z a-z letters, letters with accents and ñ, numbers 0-9, hyphen, underscore.

You can not include /, \, punctuation marks, etc. within routes (unless the OS supports it).

Capitalization is always converted to lowercase for compatibility with operating systems insensitive to uppercase / lowercase is Windows.

For example if you capture the URI path:
/My-PagE/My-PatH: looks at page repository folder "my-page/my-path"
/ My-page / My-route: look at page repository folder "/ my-page / my-route" with spaces

The pages of the framework are all in the repository pages. This repository is a folder defined in the config file of the host site.

Each page is a folder, which contains a number of files that make up the definition and code of the page.

Xamboo accepts a hierarchical structure of pages, i.e. folders within folders.

The route of the pages is the same route used in the URI to access this page.

* The search is performed as follows:

```
a. Locate the folder path directly as it comes from the URI. (with a protection of "..")
  a.1. If there is no folder, follow in step b.
  a.2. If the folder exists, check there inside the .page file.
    a.2.i. If not, continues in step b.
    a.2.ii. If the file exists, verify it with status 'published'
      a.2.ii.1. If not 'published', follows in step b.
      a.2.ii.2. If published, calculates and returns page.
b. Not Found page. Removes the last folder from URI
  b.1. There are still folders, continues in step a.
  b.2. No more folders, home page accept path parameters?
    b.2.1 No: terminate with an error
    b.2.2 Yes: serve home page.
```

In short, it is the first folder found on the route from the end to be executed. In other words, you can add whatever after the official route will be ignored and taken to the page found as a number of parameters.

The parameter "AcceptPathParameters" in the .page file will confirm to the system to accept parameters after the valid page (that will be passed to the page), or launch an error if the page is not valid.

Examples:
Repository Structure:

```
/ section
  => Real page with the file section.page published
/ section / subsection
  => Real page with the file subsection.page published
/ Section / subsection / sub-subsection
  => Actual page with sub-subsection.page file, unpublished

URI path to solve: / section / subsection / sub-sub / other-thing / one-extra-thing

The resolution first searches the / section / subsection / sub-sub / other-thing / one-way-extra, that does not exist.
Then, the resolution looks / section / subsection / sub-sub / other-thing that does not exist
Then, the resolution looks / section / subsection / sub-subsection, which exists but is not published
Finally, the resolution looks / section / subsection exists and is published
Executes and returns the actual page / section / subsection, only if AcceptPathParameters=true in .page file, or gives a 404.

The complement of the path is passed to the page and can be used as an array of parameters
In general, these parameters are words used for SEO, variables, names of items, etc.
```

3. .page file, type, status, template and others

The .page file must have the name of the directory where is it into.

For instance:

```
./home/home.page
./blog/channel/channel.page
```

Into the page directory, the first file to find is the .page file. If the file exists, it must contain parameters=vale entries, readable by a XConfig configuration file.

There are 2 mandatory parameters and others depend on the page type.

```
# type is the name of the engine to call, to build and resolve this page.
# redirect: used to redirect the page with a 301, 302 code
# simple: a simple page based on a metalanguage and output code
# template: a template to use with something else
# language: a language to use with something else
# library: a .go code, injected with a template and a language, build for native client code
# wajafapp: an administration page with a .go code, injected with a template and a language, build for JSON
type=simple

# status is:
# hidden: can never be seen (even if called from somewhere else), default value if no status
# published: can be seen from outside (main called page)
# template: it's a template, not visible from outside
# block: it's a building block to use in another page
# folder: it's a folder (no code, no nothing, just have sub pages)
status=published
```

The behaviour of the page and the other parameters will depend on the type and status.
See next chapter for information of each page type.

If you add an external engine, you will call it with the name of the engine as defined into the Xamboo configuration files, into the 'engines' entries.

4. Instances of a page

For all the types of pages except redirect, you will need a .instance file.
The instance files are a set of parameters defined for each version and languages if you need different behaviours based on those.

The default language and version are defined into the configuration file, into 'language' and 'verion' entries.

This means, if the system cannot resolve the client language or version of file to use, it will set them with those values.

By default, Xamboo will not resolve automatically the language (you must set it by code) and the version can be set to the device type, activating the CMS browser sub module.

You may build a component that can set those parameters automatically.

All the .instance files have the following name conventions:

[page-name].[version].[language].instance
[page-name].[version].instance
[page-name].instance

The page-name must be the same as the directory where the file is into

The set [version].[language] is called the identity of the instance.

Resolution of .instance file, will search, in order:
The first one found will be used:

```
[current-version].[current-language]
[current-version].[default-language]
[current-version]
[default-version].[current-language]
[default-version].[default-language]
<none>
```

For instance if your current language is fr, default language is en, current version if mobile and default version is base:
it will search, in order:

```
mypage.mobile.fr.instance
mypage.mobile.en.instance
mypage.mobile.instance
mypage.base.fr.instance
mypage.base.en.instance
mypage.instance
```

It is mandatory to always have at least one file available for the page to work.
Have always the last one available, even if empty, and create others only if really need.

You may put into this file caches parameters, parameters to inject into the code or template code, parameters to use into the .go libraries etc.

5. Type of pages and complementary files

  5.1 Redirect page

Redirect page:
- You will need 2 more parameters:

```
redirecturl=/other-url
# Moved permanently
redirectcode=301
```

- redirecturl can be relative, absolute or to another domain.
- redirectcode should be 301 or 302, but you may use any other code too.

A redirect page should always be published or it will not work (it's a redirect for your client browser, not for internal code creation)
A redirect page does not need other files.

  4.2 Simple Page

The simple page is the basic CMS page, with a mix of output code and meta language to inject and build the correct output.

A simple page will need one or more .instance files, and one or more .code files.

The .page may have 2 more parameters:
- template
- acceptpathparameters

The template is the page to call, to embed this page into it.

If your page will receive a "group of URLs", you may activate acceptpathparameters to 'on', 'true' or '1'

The .code files follow exactly the same resolution as the .instance files.

The reference of .code files is explained later in this manual in the "CMS AND META LANGUAGE" chapter


  4.3 Template Page

  4.4 Language Page

  4.5 Library Page

  4.6 WajafApp Page




ENGINES
=============================

1. Redirect page

2. Simple page

3. Library page

4. Template page

5. Language page

6. WajafApp page

7. User made Engines

An Engine must meet the assets.Engine and assets.EngineInstance interfaces to be used by the Xamboo.

An Engine is a plugin (go --buildmode=plugin) loadable by the Server.

When the system loads the engine, it will check the existence of the exported variable Engine, that must meet the assets.Engine interface.

The engine will work in 2 step.
  a. When the xamboo detect a page with the type of the engine, it will call the Engine.NeedInstance() function to know if the engines needs to build an instance to work (returns true/false).
    a.1 If the engine does not need an instance, the server will call Engine.Run() function to get the result of the calculated page.
    a.2 If the engine needs an instance, the server will call Engine.GetInstance() function to get the instance.
  b. When and instance is created it will call Instance.Run() function to get the result of the calculated page.

A page with instance may have as many instances as needed. Each instance normally have different parameters, most common parameters are language and type of connected device. Try to build instance only on 1 parameter or you will rapidly have a matrix of instances impossible to maintain.

It is common to have a unique code with different languages tables (.language files), or have different templates for PC and Mobile for instance.

The instance Run function will pass the template and language corresponding to the client parameters, i.e. language and version (generally the device) template

APPLICATION
=============================

An Application must meet the assets.Application interface to be used by the Xamboo.

An Application is a plugin (go --buildmode=plugin) loadable by the Server, called by a Host.

A Host can load more than one Application.
An Application can be called by more than one Host.

When the system loads the Application, it will check the existence of the exported variable Application, that must meet the assets.Application interface.

The Application is the entry point to load the XModules.

The applications will need to deal with the following objects:

1. CMS

2. DatasourceContainer

3. Datasource

4. ModuleContainer

5. Module

6. Context

7. Bridge


CMS AND META LANGUAGE
========================


Types of pages:
=======================

Simple Page (.code)
-----------------------

The type of the page in the .page file must be
type=simple

The code of the page is your native code (for instance HTML) and you can use a MetaLanguage to insert and use business rules into the construction of the page:

* Meta language for Simple Page:

- [[URLPARAMS]]
- [[URLPARAM,(.*?)]]
- [[VAR,(.*?)]]
- [[PARAM,(.*?)]]
- [[SYSPARAM,(.*?)]]
- [[PAGEPARAM,(.*?)]]
- [[LOCALPAGEPARAM,(.*?)]]
- [[INSTANCEPARAM,(.*?)]]
- [[LOCALINSTANCEPARAM,(.*?)]]
- [[JS,(.*?)]]
- [[CSS,(.*?)]]
- [[CALL,(.*?)(:(.*?)){0,1}]]
- ##   ##
- %--   --%
- [[BOX,(.*?):
- BOX]]



XMODULES
=============================

The XModules are all the modules that are build within the Xamboo applications and pages.

It is a normalized structure to call the methods and link the contexts with hosts and applications.

See the xmodules reference to see which ones are available and how to use them.


TO DO
=======================

- Make stats more persistent with file write before clean every X timer.
- Implement i18n and languages for messages.
- Implement deflate in compress component.

- simple code server injector, finish all supported code.

Extras:
- page library and snippets PHP-compatible code ? (check go call PHP with pipe data interchange, fastCGI).
- page library and snippets JS-compatible code ? (check go call NODE.JS with pipe data interchange).


Version Changes Control
=======================

v1.5.2 - 2021-02-24
-----------------------
- Bug corrected when overloading the new configuration
- Manual enchanced (page types, .page files, .instance files, .code files)

v1.5.1 - 2021-02-21
-----------------------
- The config system can now reload the hosts and component configuration without restarting the server.
  Configuration changes will apply inmediatly at reload and affect all the new requests.
- Manual enhanced with new changes
- Added function StartHost to Component interface, called when the host is started up (only once)
- List of components of Host is now a map[string]*ComponentDef to modify the components dynamically
- New GetHost function added to the config

v1.5.0 - 2021-02-15
-----------------------
- The components have been totally rebuilt to be 'built-in' or external plugins so the programmer can add as many as needed components.
- Every plugin can be enabled or disabled on each host.
- The built-in components are:
-- host: controls the dispatcher to call the correct Host as defined in the configuration (system component).
-- log: controls the loggers of pages, errors, sys, stat function call.
-- stat: controls the statistics component, from system to host.
-- redirect: controls the redirect mechanism on request headers.
-- auth: controls the browser realm authorization login.
-- compress: controls the gzip and deflate compression for response.
-- minify: controls the minification of the code (HTML, XML, CSS, JS, JSON, SVG).
-- origin: controls the cross origin headers (generally for APIs).
-- fileserver: controls the natural files server.
-- cms: controls the Xamboo CMS, wrapper to ./cms system.
--- browser: set the theme for pages calculation (is not a middleware, build in the CMS handler).
- The external plugins components must obey the assets/Component interface.
- All the config objects have been moved to assets (listener, engine, component, host..).
- The CMS has been moved to ./cms . The engines have been moved to ./cms/engines .
- The logs have now a format entry for pages log to define log format.
- Minify and Compress engines let trace of quantity of bytes minified or compressed into HostWriter so they can be logged.
- The plugins to load on sites are now into json config (Xamboo is the responsible to start and link plugins, not the CMS).
- The function GetBuildID has been moved to utils.
- The runner now link all the pieces of code based on configuration, the launch the listeners.
- The external engines are how automatically compiled if the .so is not present.
- The external components are how automatically compiled if the .so is not present.
- The external applications (hosts plugins)  are how automatically compiled if the .so is not present.
- Start() function added to the Component interface.
- Reference manual modified to be compliant with code.
- LICENCE file added.


v1.4.6 - 2021-01-19
-----------------------
- The function datasource.GetTransaction now returns the transaction or nil, so it is directly usable without a possible useless error.

v1.4.5 - 2021-01-17
-----------------------
- Support for database transactions added in datasource interface.
- Added Component structure in assets (not yet operational)
- Added status for structures, to control changes of sources, and hot config reload (not yet operational)

v1.4.4 - 2020-09-28
-----------------------
- Correction of a bug on the library engine using an no existing error while verifying the called library.

v1.4.3 - 2020-09-18
-----------------------
- Compiler supervisor and log removed because they are not used, creation of compiler pile dynamically when needed.
- Manual enhanced (config -- Host, and config -- Host config file).

v1.4.2 - 2020-08-22
-----------------------
- Race condition corrected on the compiler and library engine when 2 sites with different ID try to compile the same page (and finally breaks the page)
- Manual enhanced (Page resolution)

v1.4.1 - 2020-08-18
-----------------------
- Some bugs corrected to use the innerPage parameter correctly to pass the return Code.
- Manual enchanced (APPLICATION, MANUAL ENGINE)

v1.4.0 - 2020-08-12
-----------------------
- The context now have a Code attribute to pass the return code from an engine to the writer.
- The server now synchronize the returned code with the stat module so the correct returned code is logged.
- The engines can now return directly an error and the error will automatically be used to call error pages (available for library pages, wajafapp pages and any hand made extern engines).
- Engines has been adjusted to be able to return the error as an error (not a string).
- Manual enhanced (listeners config).

v1.3.7 - 2020-08-10
-----------------------
- Opened to TLS 1.3 (now support TLS 1.2 and TLS 1.3)
- Manual enhanced (engines config)

v1.3.6 - 2020-08-03
-----------------------
- Replace github.com/avct/uasurfer by github.com/webability-go/uasurfer (forked to correct an important bug: the original uasurfer does not recognize mobile bots as mobile devices and gives big problem on google search console for device recognition)
- Manual enhanced (logs)

v1.3.5 - 2020-07-28
-----------------------
- library and wajafapp engines enhanced to keep track of loaded plugins and avoid 'plugin already loaded' error
- Reference manual enhanced (config files introduction)

v1.3.4 - 2020-07-07
-----------------------
- Stat module now support the call to statistic function linked from plugin application declared in host plugins.
  The statistic function must be a func(*assets.Context) {} and publicly exported from the plugin

V1.3.3 - 2020-06-29
-----------------------
- Stat module now has a mutex to protect race condition on update/clean, and to avoid using memory white serving realtime stats on admin.

V1.3.2 - 2020-06-26
-----------------------
- Bug corrected on URL redirect when it ends with a /

V1.3.1 - 2020-05-25
-----------------------
- Some bugs corrected on assets and Applications, Modules, Datasources interfaces.

V1.3.0 - 2020-05-25
-----------------------
- Server code separated from master and environment code (project-usable code), so "xamboo" contains only the core code of server.
- Standarization of application plugins: It now needs StartHost and StartContext exportable functions and must be compliant to the new assets.Application interface
- Hosts definition structures are now in assets.

V1.2.9 - 2020-05-18
-----------------------
- Engines and config now keep track of compiled code with last compilation error, actual version number, for pages and apps
- Very basic redirect module implemented (check scheme and main domain)

V1.2.8 - 2020-05-13
-----------------------
- IP added into error logs and stat logs.
- Master/Index now put unique IDs for contexts/modules to avoid DOM ids conflicts while building the list of configured contexts.

V1.2.7 - 2020-05-10
-----------------------
- Version adjustment
- Master can now install compiled modules in Apps on each hosts, as databases and others. (early alpha version)

V1.2.6 - 2020-05-04
-----------------------
- runner error on RequestStat corrected
- Server funcion GetFullConfig added for Admin purposes
- Master index build with config elements (General, Listeners, Hosts, Engines)
- The APPs for the host must now export at least 4 standard functions for admin and control:
  * Start called for each host startup function,
  * GetContextConfigFile to get the path of the contexts config file,
  * GetCompiledModules to get the list of the compiled available Modules,
  * GetContextContainer to get the created contexts and container of contexts of the APP.

V1.2.5 - 2020-05-01
-----------------------
- Added contexts editor, contexts config file, contexts menu and templates into master/index.
- Added mutexes on code compiler to avoid pile racing.
- master APP enhanced with Setup function to link anything with pages so the page does not have to do it itself.
- master/js.go modified to try to preload first local javascript files, then search into resources container.
- Added protection against corrupt writer without RequestStat (? <= have to investigate why it happens some times: wrong requests, unfinished requests... etc)
- Enhanced master site with containers and contexts administration

V1.2.4 - 2020-04-26
-----------------------
- New wajaf version, with JS embedded in code, remove JS from master public

V1.2.3 - 2020-04-23
-----------------------
- Enhanced Master and Master app to work better (installation, use, index, bridged functions).
- Improvement in loggers, all logger now logs what they are supposed to log
- Stats are registering in stat logs correctly based on correct Host

V1.2.2 - 2020-04-18
-----------------------
- Added attribute PagesDir to server and support for base directory change for engines

V1.2.1 - 2020-04-18
-----------------------
- Added keyword "include": ["",""...] into config.json to merge various config files. Hosts, Listeners and Engines will be merged only with a different name of already loaded
- Master login/logout enhanced, password is md5 encoded

V1.2.0 - 2020-04-09
-----------------------
- Master site created (for tools installation, ready to use XModules and contexts, modules and dynamic libraries, security
- Master installation (template, language, account), main template, login, main index
- Master APP generated
- Wajaf JS added into public master code
- Version enhanced into config.Config object

V1.1.1 - 2020-03-29
-----------------------
- Uses now xconfig v0.4.0 and xcore v2*

V1.1.0 - 2020-03-25
-----------------------
- The form/body is parsed only if the parameter "keeporiginalbody" is not set. If the Xamboo is used as a proxy server, the body must not be parsed.
- New module UASurfer added to recognize the type of connected device (know values: pc, mobile, tablet, tv, console, wearable, base).
- config.json now support browser entries with useragent entry to activate the UASurfer module.
- The type of device is in the context.Version parameter if the module is activated, the pages can have version like {pageid}.<Version>.instance, .code, .language, .template
- Modules initialized (go init module)

V1.0.4 - 2020-03-12
-----------------------
- The error page can now set the correct content-type and is called upon error. The http.Error has been disabled (send only text) and the internal LaunchError has been correctly implemented.
- The server.Code has been added in the server structure. If the code is different of statusOK, then the error is managed as needed. All other headers are kept (content type, encoding, gziped, etc)
- The error code is now correctly send to the client browser (the error page was sent with code 200)

V1.0.3 - 2020-03-11
-----------------------
- Bug correction: the resolution of correct instance was broken and always selecting the last know instance
- The server now check the template and other pagedata variables based on the context object so the library code can change values into the object and the changes will be honoured.
- Racing for memory corrected in runner.go code (certerror added)

V1.0.2 - 2020-02-25
-----------------------
- Support for language and version added into the context, so the language or version can be changed dynamically page by page, by code
- Compiler is now thread safe (many asks, only first compile and broadcast to others it's ready to use)
- Some minor bugs corrected

V1.0.1 - 2020-02-10
-----------------------
- Bug corrected on the server that was returning a code without checking if it was string or not before processing

V1.0.0 - 2020-01-31
-----------------------
- All the code has been restructured so the whole code is into "server" directory. Server is the main code body and Engines are every type of pages (as it should be)
- All the engines has been homologated and the user can create his own engines (as plugins)
- The 4 main engines have been rewritten to meet Engine interface
- The Redirect engine has been added
- All library functions now return an interface{} as variable, not anymore a string (you may have to change all your libraries Run functions)
  This change is important since a library can return a data structure for another library, not necessarly a string.
- Code Minifier implemented with entry in congig/Host to enable or disable it, and which part are available to minify.
- Error management implemented (parameters errorpage and errorblock in site configuration)

V0.3.0 - 2020-01-29
-----------------------
- Implementation of recursivity security (launch an error after using 3 times the same page by default).
- Added parameter maxrecursion=<int> into .page files to change max authorized recursion of a page (for instance a template may be called many times).
- Added self signed SSL certificate for examples.
- Auth in config/Host replaces BasicAuth and is now a sub structure with User, Pass, Realm, and Enabled flag.
- GZip in config/Host is now a sub structure with Mimes, Files and Enabled flag.
- Logs in config/Host has now an Enabled flag.
- File server (on static directory) is know served after verifying Auth (error corrected).
- GZip correctly implemented with mime and file filter options. A library can now gzip a content and return already gzipped data to xamboo, which will only set the correct headers (context.IsGZiped new entry).
- Minify in config/Host added with enabled flag and rules to minify
- Minify code implemented in engine. (for test purposes, not yet fully implemented)

V0.2.0 - 2020-01-23
-----------------------
> Uses XConfig 0.1.0

> Uses XCore 0.2.3

- Added ability to GZip content, with a new flag on Host config ("gzip": true,) to authorize compressing the host.
- The client must support compressing too to fire this ability.
- Added ability to gzip from the library page too (based on context boolean variables CanGZip and GZiped) and return the gzip data instead of the uncompressed data (usefull if you cache the gziped data for instance)

V0.1.0 - 2019-12-06
-----------------------
> Uses XConfig 0.0.9

> Uses XCore 0.2.0

- Code modifications to meet new XCore build functions and Objects attributes
- Code formated before sending to github (gofmt -s)

V0.0.16 - 2019-06-19
-----------------------
> Uses XConfig 0.0.7

> Uses XCore 0.0.7

- Prefix added to the .so page libraries to avoid competitive problem of pages with same names between different sites. The unicity of the page is mandatory only on every site, but can be repeated between sites. The prefix is the config name of the host controller.
- Administration console again with all the requests viewable.
- Pause implemented (will close the websocket) and restart (will open again the websocket)
- bug corrected, the default site page could not receive parameters like other pages if AcceptPathParameters=yes

V0.0.15 - 2019-03-22
-----------------------
> Uses XConfig 0.0.7

> Uses XCore 0.0.7

- Administration console enhanced with served requests/second, filter of served pages, presentation, alive flag, IP/2min and requests/2min
- listener.go modified to not serve "too much information"
- Basic Auth implemented for simple username/pass/realm

V0.0.14 - 2019-03-06
-----------------------
> Uses XConfig 0.0.7

> Uses XCore 0.0.7

- Admin console enhanced with cpu load, uptime, dynamic data actualized, etc


V0.0.13 - 2019-03-01
-----------------------
> Uses XConfig 0.0.6

> Uses XCore 0.0.6

- Loggers implemented for xamboo, listeners, hosts


V0.0.12 - 2019-02-25
-----------------------
> Uses XConfig 0.0.6

> Uses XCore 0.0.6

- Added and modified origin on multidomains ([]string of authorized domains), defaultdomain/maindomain json config entry renamed to default/maindomains

V0.0.11 - 2019-02-18
-----------------------
> Uses XConfig 0.0.6

> Uses XCore 0.0.6

- admin javascript and presentation enhanced
- admin listener modified to send correctly WSS and ordered last requests
- Bug corrected on creation of SessionParams in engine context
- Application library loading moved to the Host config loader, to be loaded and started only once by host

V0.0.10 - 2019-02-15
-----------------------
> Uses XConfig 0.0.6

> Uses XCore 0.0.6

- Added SessionParams in engine context
- admin javascript and presentation enhanced
- Support for CORS - REST-API implemented from config file for host

V0.0.9 - 2019-01-31
-----------------------
> Uses XConfig 0.0.5

> Uses XCore 0.0.4

- Stats enhanced, now count memory, goroutines, CPUs, requests and length of data, alive time, and can be cleaned regularly (every minute)
- engine.CoreWriter enhanced and Public, so the upgrader to the WSS protocol can also count written bytes
- Admin and Admin Listener enhanced to show more accurate realtime data

V0.0.8 - 2019-01-21
-----------------------
> Uses XConfig 0.0.5

> Uses XCore 0.0.4

- CacheLibrary modified to have no timeout (.so are part of the code itself and cannot unload)
- admin/listener enhanced to get read and write independant on go threads
- admin console now receive and display last served pages and files (very basic interface)

V0.0.7 - 2019-01-06
-----------------------
> Uses XConfig 0.0.5

> Uses XCore 0.0.4

- Code modified to use new XDataset/XConfig with capabilities for XTemplate
- Function servers.Start added to call caches starters (file validator function added)
- Caches modified to use last version of XCore


V0.0.6 - 2018-12-21
-----------------------
> Uses XConfig 0.0.4

> Uses XCore 0.0.2

- Code modified to use xconfig.Get* with double variables return

V0.0.5 - 2018-12-17
-----------------------
> Uses XConfig 0.0.3

> Uses XCore 0.0.2

- Moved servers/cache.go to xcore
- Remasterization of all directories and place of code, more logical. "servers" and "context" are now into engine.
  "core" disappears, "config" is separated, creation of "log" and "stat" as intependant code. The core as itself is renamed "runner"

V0.0.4 - 2018-12-05
-----------------------
> Uses XConfig 0.0.3

> Uses XCore 0.0.1

- Added the pre-load for user application plugins, bridge and calls from library pages (.go compiled code)
- .Code regexp modified so a comment may have a new line at the end that will not reflect on the final code
- Support for static files added on each host. New config parameter "static" added in Host for filesystem path of static files
- Admin console enhanced
- Stat module created

V0.0.3 - 2018-12-04
-----------------------
> Branch "late-night" added to github

> Uses XConfig 0.0.3

> Uses XCore 0.0.1

- The servers auto-reload data from pages sources if there is any change into the code and invalid the cache
- The library server can (re)compile the .go page if needed and can hot-load the plugin library on the fly (beware to the memory use !)
- language page type implemented
- template page type implemented
- library page type implemented
- [[URLPARAMS]] metalanguage parser and injector implemented
- [[URLPARAM,id]] metalanguage parser and injector implemented
- [[VAR,id]] metalanguage parser and injector implemented
- [[PARAM,id]] metalanguage parser and injector implemented
- [[SYSPARAM,id]] metalanguage parser and injector implemented
- [[PAGEPARAM,id]] metalanguage parser and injector implemented
- [[LOCALPAGEPARAM,id]] metalanguage parser and injector implemented
- [[INSTANCEPARAM,id]] metalanguage parser and injector implemented
- [[LOCALINSTANCEPARAM,id]] metalanguage parser and injector implemented
- Nested blocks [[BOX...BOX]] metalanguage parser and injector implemented
- Constants added for meta language orders

V0.0.3 - 2018-??-??
-----------------------
> This version is working, examples are working, but the system is still incomplete

> Uses XConfig 0.0.3
- Added XCache to manage persistent memory caches


V0.0.2 - 2018-11-27
-----------------------
> This version is working, examples are working, but the system is still incomplete

> Uses XConfig 0.0.2
- Added Context in engine and local context to calculate pages
- Added engine wrapper to call from a server (engine callback for a sub-page)
- Added support for memory caches in servers (page, instance, code)
- ".code" compiler implemented for simple pages
- Added language, template, code, library, cache servers
- Added identity server to calculate the correct identity for each page object
- Creation of Context object to send to every engine instance/page to build
- Logger implemented (now directed to stdout)
- Added VERSION constant in core/core.go

V0.0.1 - 2018-11-06
-----------------------
> Uses XConfig 0.0.1
- First commit, still not fully working




Manual:
=======================

- If you want to help converting the manual from text into .md file, you are most welcome.
- Translations are also welcome
