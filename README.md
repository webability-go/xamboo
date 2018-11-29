@UTF-8

Xamboo for GO v0
=============================

Xamboo is the result of over 15 years of manufacturing engineering frameworks, originally written for PHP 7+ and now ported to GO 1.8+

It is a very high quality framework for CMS, made in GO 1.8 or higher, fully object-oriented and strong to distribute code into Web portals with heavy load and REST APIs optimization.

Xamboo is freeware, and uses several other freeware components (XConfig)

Xamboo is an engine to build applications that distribute any type of code to the client:
It is completely independent of the generated code, i.e. you can send HTML, XHTML, XML, SGML, javascript, JS, JSON, WAP, PDF, etc.

Xamboo works on sites currently distributing more than **60 millions web pages monthly**, (that's near 500 pages per second on peak hour) it serves regular sites, and GRAPH-APIs / REST APIs to APP-mobiles.


TO DO
=======================
- creates a fake SSH key cert for examples to put in examples dir
- simple code server injector
- implement nested [[BOX in simple code metalanguage injector
- Pass params (from url or from page call) into context, server call and wrapper
- language server compiler + injector
- template server compiler + injector
- library server/runner for GO pre-compile page with pipe data interchange
- Caches generator
- cache autocheck vs original file on HD
- page library and snippets PHP-compatible code ? (check go call PHP with pipe data interchange)
- page library and snippets JS-compatible code ? (check go call NODE with pipe data interchange)
- support for files (images, js, etc)


Version Changes Control
=======================

V0.0.3 - 2018-??-??
-----------------------
> Branch "late-night" added to github

> Uses XConfig 0.0.3
- [[URLPARAMS]] metalanguage parser and injector implemented
- [[URLPARAM,id]] metalanguage parser and injector implemented
- [[VAR,id]] metalanguage parser and injector implemented
- [[PARAM,id]] metalanguage parser and injector implemented
- [[SYSPARAM,id]] metalanguage parser and injector implemented
- [[PAGEPARAM,id]] metalanguage parser and injector implemented
- [[LOCALPAGEPARAM,id]] metalanguage parser and injector implemented
- [[INSTANCEPARAM,id]] metalanguage parser and injector implemented
- [[LOCALINSTANCEPARAM,id]] metalanguage parser and injector implemented
- Nested blocks implemented into compiler, injector pending
- Constants added for meta language orders

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





