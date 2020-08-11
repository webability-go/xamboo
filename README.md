
Xamboo for GO v1
=============================

Xamboo is the result of over 15 years of manufacturing engineering frameworks, originally written for PHP 7+ and now ported to GO 1.14+

It is a very high quality framework for CMS, made in GO 1.14 or higher, fully object-oriented and strong to distribute code into Web portals with heavy load and REST APIs optimization.

Xamboo is freeware, and uses several other freeware components (XConfig, XCore, XDominion, WAJAF)

Xamboo is an engine to build applications that distribute any type of code to the client:
It is completely independent of the generated code, i.e. you can send HTML, XHTML, XML, SGML, javascript, JSON, PDF, images, videos, etc.

Xamboo works on sites currently distributing more than **60 millions web pages monthly**, (that's near 500 pages per second on peak hour) it serves regular sites, and GRAPH-APIs / REST APIs to APP-mobiles.

The Xamboo server works only on Unix systems, since it makes a heavy use of plugins (.so librairies) that are not compatible with windows.

INSTALATION AND COMPILATION
=============================

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

You may also add the master site for web administration of the Xamboo:

```
$ mkdir /home/sites/server/master
$ cd /home/sites/server/master
$ git init
$ git pull https://github.com/webability-go/xamboo-master.git
```

You need to edit each .json files to adapt it to your own IP and ports
You can also link the master config.json to the mainconfig.json (commented lines)

Set the Listeners IP and Port so the service will work on your machine.
Set the Hosts domains so the service will resolve. Do not forget to add those domains to your DNS too.

Run the xamboo with master and examples

```
$ start.sh
```


To build your own server:
Edit start.sh, json config files and change the config file path.

You can copy the example directory and change anything you need, or build from scratch.

The master site is not necessary to make the CMS work. It's a helpfull tool to configure and install anything easier and edit the json config files.

Install the master site and install contexts with XModules for any site you need.

You can compile xamboo to an executable with:
```
go build xamboo.go
```

You do not need to recompile any app and page any time you restart the server. The system compile things as needed. You may recompile anything before launching on a production site, for velocity.
You will need the original code so the compiler is able to compile pages and libraries without problem at anytime. It will use the go.mod and go.sum retrieved with the Xamboo-env.

You may attach the xamboo to an OS/service, calling the start.sh


CONFIGURATION FILES
=============================

Starting the Xamboo, you need to pass a configuration JSON file to the application with --config=[config path]

You may use absolute paths, but it's very recommended to use only relative paths for portability. All the path you will use are relative to the directory where you launch your xamboo application.

The config file is a JSON object which have 5 main sections.
```
{
  "log": {},
  "include": [],
  "listeners": [],
  "hosts": [],
  "engines": []
}
```

You may add other entries into each level for comments, they are going to be just ignored.
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
  "engines": []
}
```

1. "log" section

The log section contains the following parameters:

```
{
  "log": {
    "enabled": true,
    "sys": "file:./example/logs/xamboo-sys.log",
    "pages": "file:./example/logs/developers.log",
    "errors": "file:./example/logs/xamboo-error.log",
    "stats": "discard",
  },
  ...
}
```

The log section is present in the root of the config file (main log), and also into each of the hosts and listeners defined in "hosts" and "listeners" sections.

* Main log:

Only "sys" and "errors" logs are used

* Listener log:

Only "sys" log is used

* Host log:

"enabled" (true/false) parameter, and "sys", "pages", "errors" and "stats" logs are used.

Any other entry is ignored.

---

The "sys" logs will log anything "normal" for the object, for instance all the http.net server messages from TLS , startup, shutdown, etc.
The "errors" logs will always receive any errors that may happen in the system, from main thread up to each hit on server (even panic errors and recovered errors.)
The "pages" logs will log any hit on any pages and files for the host.
Finally, the "stat" log will call any file or function at the same time as the "pages" log, but you are free to call a function with the whole context to log anything you need to.

Each log entry can be one of:

- file:<file>
- stdout:
- stderr:
- discard

The stat log can also be "call:<app plugin>:<entry function>".
The function will be called for each hit on the host, with the server context so you can log anything you want anywhere you want to.

The function must be publicly exported like this:

```
import "github.com/webability-go/xamboo/assets"

func Log(ctx *assets.Context) {
	// do the log
}
```



2. "listeners" section

3. "hosts" section

4. "engines" section

The engines are type of pages that can be called from the Xamboo server.
There are 6 build-in engines for standard type of pages, and you can add as many engines as you need. (See Engine section of this manual to know how to build them)

The engines syntax is:

```
"engines":
[
  { "name": "redirect", "source": "built-in" },
  { "name": "simple", "source": "built-in" },
  { "name": "library", "source": "built-in" },
  { "name": "template", "source": "built-in" },
  { "name": "language", "source": "built-in" },
  { "name": "wajafapp", "source": "built-in" }
]
```

When you want to add a hand made engine, the syntax is:

```
  { "name": "myengine", "source": "extern", "library": "./path/to/your/myengine.so" },
```


ENGINES
=============================

1. Redirect page

2. Simple page

3. Library page

4. Template page

5. Language page

6. WajafApp page

7. User made Engines



TO DO
=======================
- Stats module: set mask %ip %h %l %s etc from config file
  Pages format log with template. If there is no format, the basic "{ip} {pr} {mt} {cd} {ur} {sz} {tm}" is used.
  Make stats more persistent with file write before clean every X timer
- Implement i18n and languages for messages.
- Moves the modules.so load to config.json, not anymore into site config.conf

- BasicAuth should support an app function entry to call to verify user (not only user/pass into config file)
- simple code server injector, finish all supported code
- xamboo local API to add/remove hosts, IPs, services ?
Maybe, analyze:
- Clone the server.Host and config, so each thread is free to modify server/host/listener variables if needed
Extras:
- page library and snippets PHP-compatible code ? (check go call PHP with pipe data interchange, fastCGI)
- page library and snippets JS-compatible code ? (check go call NODE with pipe data interchange)
- hot-reload config (change config dynamically without restarting)
- Modularize components (stat, rewrite, browser, fastCGI, auth, etc.) and implement with interceptors


Version Changes Control
=======================

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

Installation:
=======================


Configuration:
=======================


Running the examples:
=======================


Building your site:
=======================


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
