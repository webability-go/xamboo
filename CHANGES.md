# TO DO

- I18N for all messages of the Xamboo
- Make HTTP protocol work on components, it serves only on http for now
- Finish the tests for gRPC and gRPCs

- Reload config: rebuild listeners, engines, apps, etc

- Make stats more persistent with file write before clean every X timer.
- Make stats=enabled/disabled, with level of stat = full, count, none
- simple code server injector, finish all supported code.

- Security component: adds max rate limit x IP
- Redirect component: set up redirect rules based on reg exp etc.

Extras:
- Check implementation of brotli compress (google one) https://github.com/google/brotli/tree/master/go/cbrotli
- page library and snippets PHP-compatible code ? (check go call PHP with pipe data interchange, fastCGI).
- page library and snippets JS-compatible code ? (check go call NODE.JS with pipe data interchange).

# Version Changes Control

v1.8.4 - 2026-02-26
-----------------------
- Brand new reference manual for the whole system , asisted with AI to redact and analyze the code and get a full comprehensive correct manual.
- I18N of messages into the language files implemented for more messages of the core.
- Separation of changes.md file (this file) from the manual.

v1.8.3 - 2024-10-09
-----------------------
- Remove the hostname from the .so library name to avoid conflict of same library betwen different VHosts

v1.8.2 - 2024-04-12
-----------------------
- Error corrected into config/config.go: when the config file had an error of reading/loading, the error was not reported (and system just panic sometimes after)

v1.8.1 - 2024-04-10
-----------------------
- go.mod and go.sum modidied for security and up-to-date libraries updates

v1.8.0 - 2024-04-08
-----------------------
- Added GetConfig() in Datasource Interface so the xmodules can use Datasource interface as standard without casting
- The various parts of xamboo-env, xamboo-master, xamboo-admin and xmodules have been modified to meet new normalized standard

v1.7.7 - 2023-03-16
-----------------------
- Documentation enhanced with some new entries

v1.7.6 - 2022-11-22
-----------------------
- Auth component now accept also a list of users, added to the master user/pass

v1.7.5 - 2022-08-31
-----------------------
- Bug corrected on Meta language [[SESSIONPARAM,*]]

v1.7.4 - 2022-08-31
-----------------------
- Meta language [[SESSIONPARAM,*]] added for the simple code engine of the CMS, to get the value of a session parameter.

v1.7.3 - 2022-08-19
-----------------------
- Server logger added for listener, the server logger will receive all the default http.server messages

v1.7.2 - 2022-08-01
-----------------------
- parameter %referer% added into pages logs for hosts

v1.7.1 - 2022-07-03
-----------------------
- Separation of librarypath and library for all plugins (components, engines and plugins), to have a better control of plugin prexif and version

v1.7.0 - 2022-06-29
-----------------------
- global pluginprefix parameter added to the configuration .json files. This parameter is needed when you run multiple instances of the xamboo based on the same directory/code, to compile and load all the .so plugins to avoid conflicts ( name as pluginpath + pluginprefix + "-" + hostame + "library.so." + serial )
- Compiler enhanced to better log compiled code with elapsed time, library, output errors.

v1.6.6 - 2021-12-02
-----------------------
- Remove for now the client disconnection channel listener that was causing problems of stability.

v1.6.5 - 2021-11-26
-----------------------
- Added a hook deferred function to host component, to recover any error on the request thread and also to detect client disconnection to log them.

v1.6.4 - 2021-11-24
-----------------------
- Added method RegisterModule to Datasource interface to avoid a bug when different applications are loaded with compiled modules optionally into them.

v1.6.3 - 2021-07-08
-----------------------
- Bug corrected in prot component: it was reading the form variables before the CMS and invalidating the keeporiginalbody page parameter of CMS.
- IP Blacklist added to the prot component

v1.6.2 - 2021-05-18
-----------------------
- New component "prot" added, to protect the code and query variables against SQL injection.
- In the CMS engines, the cached XTemplate is now cloned before injection into the engines to avoid racing problems between pages.

v1.6.1 - 2021-04-27
-----------------------
- The device resolution can now be replaced with the version of the programmer choice to call the correct templates. Add version=newversion into the cms configuration file.
  For instance tablet=pc (use the pc version if a tablet has been detected)

v1.6.0 - 2021-03-31
-----------------------
- Added constants PROTOCOL_HTTP and PROTOCOL_HTTPS into config.
- Internationalization of all messages, in english, french and spanish (partially translated).
- The Run function now accept the language as optional parameter for backyard compatibility. The language is a language.Tag type. Default language is EN.
- Loggers stream names are now into Constants STREAM_*.
- Bug corrected, the default version is now considered into the browser sub module of CMS for unknown devices (bots mainly).

v1.5.5 - 2021-03-08
-----------------------
- Change of logstat function definition, for log:stat:call:app:logstat it is now func(host.HostWriter).
- The stat component sets the RequestStat en the HostWriter params.
- The cms component sets the Context en the HostWriter params.
- The HostWriter should contain the requeststat and the context object in the parameters, if needed.
- The loggers Hook function is now an interface{} that should be a func(host.HostWriter) compatible function.
- Reference manual (this document) modified to meet the changes.

v1.5.4 - 2021-03-08
-----------------------
- deflate encoder implemented into compress component
- Manual enhanced with engines, pages, files.
- Error corrected in stat log assignment and set the correct Context object in the RequestStat object.

v1.5.3 - 2021-02-26
-----------------------
- new debug flag into host config. When the debug flag is set,, the path of the code will be traced and written into the host sys log.
  This is usefull when you developp your own components or you have a bug somewhere in the encapsulators.
- All the components were modified to implement the debug mode: host, log, stat, redirect, auth, compress, minify, origin, fileserver, cms, error.
- Main CMS server modified to verify if plugins are OK before calling them.
- Some errors corrected on stat component.
- Error struct created for error component on Hosts in config, and correction of component code to use the structure.
- Manual enhanced (built-in engines and external engines creation guide)
- Manual formatting

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
