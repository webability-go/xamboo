# Xamboo for Go

## Introduction

Xamboo is the orchestration layer for APIs, microservices, and CMS modules into one cohesive platform for modern distributed architectures.

It orchestrates and manages:

-   APIs
-   Microservices
-   Web applications
-   Web pages
-   Full CMS systems
-   Administration backends

All as modular, dynamically compiled components working together under a unified engine.

Built in **Go (1.24+)**, Xamboo is designed for:

-   Large-scale content distribution
-   High-performance REST and Graph APIs
-   Modular service architectures
-   Multi-host and multi-site environments

Xamboo is:

-   Plugin-based  
-   Engine-driven  
-   Modular-first  
-   CMS-capable  
-   Multi-host ready  
-   Highly scalable  
-   MIT licensed

|                                                                                                                                                   |
|---------------------------------------------------------------------------------------------------------------------------------------------------|
| \# Architecture                                                                                                                                   |
| Incoming Request ↓ Listener (IP:Port) ↓ Host (Domain resolution) ↓ Components (Middleware chain) ↓ CMS Router ↓ Engine ↓ Page / Plugin ↓ Response |

# Key Features

## Core

-   Multi-site & virtual host support
-   Automatic plugin compilation (`go build --buildmode=plugin`)
-   Runtime page compilation
-   Hot configuration reload
-   Middleware-based architecture

## CMS

-   Directory-based page resolution
-   Version & language support
-   Meta-language injection
-   Template engine
-   Language engine
-   Library engine (Go plugins)

## Performance

-   500+ requests/sec production observed
-   3000+ requests/sec lab tested
-   TLS 1.2 / TLS 1.3
-   Gzip / Deflate compression
-   Code minification

## Security

-   Basic authentication
-   SQL injection heuristic protection
-   IP blacklist support
-   CORS origin control

------------------------------------------------------------------------

# Installation & Deployment Guide

## Overview

This chapter provides a complete, production-oriented guide to
installing and running a fully functional **Xamboo server environment**.

Xamboo is built around a modular runtime architecture that dynamically
compiles:

-   Engines  
-   Components  
-   Applications  
-   CMS pages  
-   XModules

Because Xamboo uses Go plugins (`--buildmode=plugin`), installation must
be performed on a **Unix/Linux environment**.

------------------------------------------------------------------------

## System Requirements

### Operating System

-   Linux (recommended)
-   Unix-based systems  
-   ❌ Windows is NOT supported (Go plugin limitation)

### Software Requirements

-   **Go 1.24+** (Go 1.26+ recommended)
-   Git
-   GNU Make (optional but recommended)
-   OpenSSL (if using HTTPS)

Verify Go installation:

``` bash
go version
```

------------------------------------------------------------------------

## Installation Architecture

A typical Xamboo installation may include:

    /home/sites/server
    │
    ├── xamboo-env (core runtime)
    ├── master      (optional administration UI)
    ├── admin       (optional XModules administration)
    └── your-sites  (your CMS projects)

Only `xamboo-env` is mandatory.  
`master` and `admin` are optional but highly recommended for development
and administration.

------------------------------------------------------------------------

# Step 1 — Create the Server Root Directory

``` bash
mkdir -p /home/sites/server
cd /home/sites/server
git init
```

------------------------------------------------------------------------

# Step 2 — Install the Xamboo Runtime Environment

``` bash
git pull https://github.com/webability-go/xamboo-env.git
```

------------------------------------------------------------------------

# Step 3 — (Optional) Install the Master Administration Interface

``` bash
mkdir master
cd master
git init
git pull https://github.com/webability-go/xamboo-master.git
cd ..
```

------------------------------------------------------------------------

# Step 4 — (Optional) Install the Admin Interface

``` bash
mkdir admin
cd admin
git init
git pull https://github.com/webability-go/xamboo-admin.git
cd ..
```

------------------------------------------------------------------------

# Step 5 — Configure the Server

Edit:

-   `mainconfig.json`
-   `listeners.json`
-   `hosts.json`

Example listener:

``` json
{
  "name": "server-http",
  "ip": "0.0.0.0",
  "port": "80",
  "protocol": "http",
  "readtimeout": 120,
  "writetimeout": 120,
  "headersize": 65536
}
```

Example host:

``` json
{
  "name": "mysite",
  "listeners": ["server-http"],
  "hostnames": ["example.com", "www.example.com"]
}
```

Ensure:

-   DNS points to the server IP
-   Firewall allows the configured ports

------------------------------------------------------------------------

## Linking Master & Admin

In `mainconfig.json`:

``` json
"include": [
  "master/config/hosts.json",
  "admin/config/hosts.json"
]
```

------------------------------------------------------------------------

# Step 6 — Download Dependencies

``` bash
go get -u
```

⚠ Do NOT run:

``` bash
go mod tidy
```

If accidentally executed, restore modules:

``` bash
go get master
go get admin
go get github.com/webability-go/wajaf
go get github.com/webability-go/xdominion
go get github.com/webability-go/xdommask
go get github.com/webability-go/xmodules
```

and follow the sys logs entries to know if you need to restore more modules for recompilation of the .so libraries 

------------------------------------------------------------------------

# Step 7 — Start the Server

``` bash
./start.sh
```

Or:

``` bash
go run xamboo.go --config=mainconfig.json
```

------------------------------------------------------------------------

# Step 8 — Build Production Binary (Optional)

``` bash
go build xamboo.go
```

Xamboo dynamically compiles plugins at runtime when needed.

------------------------------------------------------------------------

# Step 9 — Run as a Service (Recommended)

Example systemd service:

    [Unit]
    Description=Xamboo Server
    After=network.target

    [Service]
    WorkingDirectory=/home/sites/server
    ExecStart=/home/sites/server/xamboo --config=mainconfig.json
    Restart=always

    [Install]
    WantedBy=multi-user.target

There is a systemd directory into the main xamboo project, with example systemd file.


------------------------------------------------------------------------

# Summary of installation:

1.  Install Go  
2.  Clone xamboo-env  
3.  (Optional) Install master/admin  
4.  Configure JSON files  
5.  Run `go get -u`  
6.  Start server

Xamboo handles dynamic compilation automatically.

------------------------------------------------------------------------
------------------------------------------------------------------------
------------------------------------------------------------------------

# Configuration Files

## Overview

Xamboo is entirely driven by a JSON-based configuration system.

When starting the server, you must provide a configuration file:

``` bash
xamboo --config=./mainconfig.json
```

You may use absolute paths, but **relative paths are strongly
recommended** for portability.

All paths are resolved relative to the directory where Xamboo is
launched.

------------------------------------------------------------------------

# Configuration Philosophy

Xamboo’s configuration system is:

-   Modular
-   Composable
-   Merge-based
-   Multi-file capable
-   Environment-friendly

You can split configuration across multiple files and include them
dynamically.

------------------------------------------------------------------------

# Root Configuration Structure

``` json
{
  "pluginprefix": "prefix-",
  "log": {},
  "include": [],
  "listeners": [],
  "hosts": [],
  "components": [],
  "engines": []
}
```

Each section is optional within an individual file — but must exist at
least once across the full merged configuration.

------------------------------------------------------------------------

# Configuration Merging & Includes

Main configuration:

``` json
{
  "log": {},
  "include": [
    "site1/config.json",
    "site2/config.json"
  ],
  "components": [],
  "engines": []
}
```

Site configuration example:

``` json
{
  "comments": "site1/config.json",
  "listeners": [ <LISTENER1>, <LISTENER2> ],
  "hosts": [ <HOST1> ]
}
```

``` json
{
  "comments": "site2/config.json",
  "listeners": [ <LISTENER3> ],
  "hosts": [ <HOST2> ]
}
```

Xamboo concatenates sections of the same type when merging.
the result configuration would be (as interpreted by Xamboo):

``` json
{
  "log": {},
  "listeners": [ <LISTENER1>, <LISTENER2>, <LISTENER3> ],
  "hosts": [ <HOST1>, <HOST2> ],
  "components": [],
  "engines": []
}
```

------------------------------------------------------------------------

# 1. pluginprefix

``` json
"pluginprefix": "instanceA-"
```

The plugin prefix is appended to every compiled `.so` plugin.

This prevents naming collisions when running multiple Xamboo instances
on the same filesystem.

------------------------------------------------------------------------

# 2. log Section

``` json
{
  "log": {
    "enabled": true,
    "sys": "file:./logs/xamboo-sys.log",
    "pages": "file:./logs/pages.log",
    "pagesformat": "%requestid% %clientip% %method% %protocol% %code% %request% %duration%",
    "errors": "file:./logs/errors.log",
    "stats": "discard"
  }
}
```

The **log section** can be defined at three levels within the
configuration:

-   At the **root level** of the main configuration file (global log
    settings)
-   Inside each **listener**
-   Inside each **host**

Each level supports different log parameters.

------------------------------------------------------------------------

## Main (Root) Log

At the root level:

-   Only `"sys"` and `"errors"` logs are used.
-   The `"enabled"` parameter is ignored.

------------------------------------------------------------------------

## Listener Log

At the listener level:

-   Only the `"sys"` log is used.
-   The `"enabled"` parameter is ignored.

Listener logs typically capture low-level server events such as
connection handling and protocol activity.

------------------------------------------------------------------------

## Host Log

At the host level, the following parameters are supported:

-   `"enabled"` (true/false)
-   `"sys"`
-   `"pages"`
-   `"pagesformat"`
-   `"errors"`
-   `"stats"`

Any other entries are ignored.

Host-level logging is the most complete and configurable logging layer.

------------------------------------------------------------------------

# Log Types and Behavior

## `sys` Log

The `"sys"` log records normal operational events related to the
component.  
This includes:

-   HTTP server messages
-   TLS handshakes
-   Startup and shutdown events
-   Internal system notifications

------------------------------------------------------------------------

## `errors` Log

The `"errors"` log captures all runtime errors that occur within the
system, including:

-   Application errors
-   Component errors
-   Panics (including recovered panics)
-   Unexpected runtime failures

Note: A `404` response is **not** considered a system error and is
logged in the `"pages"` log instead.

------------------------------------------------------------------------

## `pages` Log

The `"pages"` log records every request handled by the host, including:

-   Page hits
-   Static file requests
-   Response codes
-   Performance metrics

This log is typically used for access logging and traffic analysis.

------------------------------------------------------------------------

## `stats` Log

The `"stats"` entry allows you to trigger a function call for every
processed request.

Instead of writing to a file, it can invoke a custom function from a
loaded plugin, passing the full request context.

This allows you to:

-   Send metrics to external systems
-   Integrate with monitoring platforms
-   Store statistics in databases
-   Implement custom analytics pipelines

The function receives the full request context and can log or process
data as needed.

------------------------------------------------------------------------

## Log targets:

-   file:path
-   stdout:
-   stderr:
-   discard
-   call:<plugin>:<function>

Custom stat callback example:

``` go
import "github.com/webability-go/xamboo/components/host"

func Log(hw *host.HostWriter) {
    // custom log logic
}
```

------------------------------------------------------------------------

## 3. `listeners` Section

The **listeners** section defines the network entry points of your
Xamboo server.

A listener is responsible for:

-   Binding to a specific **IP address**
-   Listening on a specific **port**
-   Handling a specific **protocol** (HTTP or HTTPS)
-   Managing connection timeouts
-   Handling low-level logging

Each listener runs as a dedicated server instance that accepts incoming
connections and forwards valid requests to the host resolution system.

------------------------------------------------------------------------

# General Structure

``` json
"listeners": [
  {
    "name": "NAME",
    "ip": "IP",
    "port": "PORT",
    "protocol": "PROTOCOL",
    "readtimeout": TIMEOUT,
    "writetimeout": TIMEOUT,
    "headersize": SIZE,
    "log": {
      "sys": "SYSLOG"
    }
  }
]
```

You may define multiple listeners in the array.

------------------------------------------------------------------------

# Parameter Reference

### `name`

A unique identifier for the listener.

-   Must be a string
-   Used internally and referenced by hosts
-   Example: `"server-http"`

------------------------------------------------------------------------

### `ip`

The IP address to bind.

-   If set to an empty string `""`, Xamboo listens on **all available
    network interfaces**
-   Can be a specific local or public IP
-   Example:
    -   `"0.0.0.0"` → all interfaces
    -   `"127.0.0.1"` → localhost only
    -   `"10.10.10.10"` → specific interface

------------------------------------------------------------------------

### `port`

The TCP port to listen on.

-   Must be a string
-   Common values:
    -   `"80"` → HTTP
    -   `"443"` → HTTPS
    -   `"8080"` → alternative HTTP

Ensure the port is open in your firewall configuration.

------------------------------------------------------------------------

### `protocol`

The communication protocol.

Currently supported:

-   `"http"`
-   `"https"`

When using `"https"`, TLS certificates must be configured at the **Host
level**.

------------------------------------------------------------------------

### `readtimeout`

Maximum duration (in seconds) allowed to read the full request.

-   Integer between `0` and `65535`
-   Recommended value: `120` seconds

Prevents slow client attacks and hanging connections.

------------------------------------------------------------------------

### `writetimeout`

Maximum duration (in seconds) allowed to write the response.

-   Integer between `0` and `65535`
-   Recommended value: `120` seconds

Prevents stalled responses from blocking the server.

------------------------------------------------------------------------

### `headersize`

Maximum allowed size (in bytes) for HTTP headers.

-   Integer between `4096` and `65535`
-   Recommended value: `65536`

Protects against oversized header attacks.

------------------------------------------------------------------------

### `log.sys`

Defines where system-level listener logs are written.

The `sys` log captures:

-   TLS handshake events
-   Connection open/close
-   Server startup/shutdown
-   Low-level protocol events

Example:

``` json
"log": {
  "sys": "file:./logs/listener-http-sys.log"
}
```

Log targets may be:

-   `file:path`
-   `stdout:`
-   `stderr:`
-   `discard`

------------------------------------------------------------------------

# Example: HTTP and HTTPS Listeners

Below is a production-ready example with both HTTP and HTTPS listeners:

``` json
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
      "sys": "file:./logs/listener-http-sys.log"
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
      "sys": "file:./logs/listener-https-sys.log"
    }
  }
]
```

------------------------------------------------------------------------

# How Listeners Interact with Hosts

Listeners do **not** serve content directly.

Instead:

1.  The listener accepts the incoming request.
2.  The request is matched against configured **hosts**.
3.  The host determines:
    -   Domain validity
    -   Enabled components
    -   CMS routing
    -   Engine execution

A single listener can serve multiple hosts.  
A single host can respond on multiple listeners.

This design allows:

-   HTTP → HTTPS redirection
-   Multi-domain hosting
-   Multi-port environments
-   Reverse proxy setups

------------------------------------------------------------------------

# Best Practices

-   Always define both HTTP and HTTPS listeners.
-   Use HTTPS in production.
-   Keep timeouts at reasonable values (120s recommended).
-   Set `headersize` high enough for modern headers but not excessive.
-   Log listener `sys` output separately for easier debugging.
-   Avoid binding to public IPs unnecessarily; prefer `0.0.0.0` behind a
    reverse proxy.

------------------------------------------------------------------------
## 4. `hosts` Section

A **Host** represents a virtual site that responds to requests received
through one or more listeners.

In practical terms, a Host is the equivalent of a website bound to one
or more domain names. It defines how requests are processed once they
are accepted by a listener.

Any host can:

-   Listen on one or multiple configured listeners  
-   Respond to one or multiple domain names  
-   Activate built-in or custom components  
-   Load external plugins  
-   Execute CMS pages and engines

Hosts are the **application-level orchestration layer** of Xamboo.

------------------------------------------------------------------------

# General Structure

``` json
"hosts": [
  {
    "name": "developers",
    "listeners": ["http", "https"],
    "hostnames": [
      "developers.webability.info",
      "www.webability.info",
      "webability.info",
      "webability.org"
    ],
    "cert": "./example/ssl/cert.pem",
    "key": "./example/ssl/privkey.pem",
    "plugins": [
      {
        "Name": "app",
        "Library": "./example/app/app.so"
      }
    ],

    "COMPONENT-NAME": { COMPONENT-CONFIG }
  }
]
```

Multiple hosts may be defined in the array.

------------------------------------------------------------------------

# Core Host Parameters

## `name`

A free string used as the internal identifier of the host.

-   Does not need to match a domain
-   Used for logging and internal reference
-   Must be unique within the configuration

------------------------------------------------------------------------

## `listeners`

Defines which previously declared listeners this host responds to.

``` json
"listeners": ["server-http", "server-https"]
```

Rules:

-   Listener names must exist in the `listeners` section
-   A host may respond to multiple listeners
-   Multiple hosts may share the same listener

------------------------------------------------------------------------

## `hostnames`

Defines the domain names that this host will respond to.

``` json
"hostnames": [
  "example.com",
  "www.example.com"
]
```

Important notes:

-   The incoming HTTP `Host` header must match one of these entries
-   DNS must point these domains to your server
-   If a request matches the listener but not a hostname, the host will
    not handle it

------------------------------------------------------------------------

## `cert` and `key` (TLS Configuration)

These parameters are required only if the host responds on an HTTPS
listener.

``` json
"cert": "./ssl/cert.pem",
"key": "./ssl/privkey.pem"
```

Requirements:

-   The certificate must include all declared hostnames
-   Paths should be relative to the server root
-   Only used for HTTPS listeners

------------------------------------------------------------------------

## `plugins`

Hosts may load external compiled Go plugins (`.so` files).

``` json
"plugins": [
  {
    "Name": "app",
    "Library": "./example/app/app.so"
  }
]
```

Plugins can provide:

-   Applications
-   Custom engines
-   Custom components
-   Business logic
-   XModules integration

Plugins must be compiled using:

``` bash
go build --buildmode=plugin
```

------------------------------------------------------------------------

# Host-Level Components

A Host may activate and configure components.

Components act as middleware layers that process requests before and
after CMS execution.

Example:

``` json
"log": {
  "enabled": true,
  "pages": "file:./logs/developers.log"
}
```

Each component can be enabled or disabled per host.

------------------------------------------------------------------------

# Built-in Components

The available built-in components are:

-   log — Logs system activity and request statistics
-   stat — Collects runtime and request statistics
-   redirect — Normalizes domain, scheme, and port
-   auth — Provides HTTP Basic Authentication
-   prot — Protects against SQL injection
-   compress — Compresses responses (gzip/deflate)
-   minify — Minifies HTML, CSS, JS, JSON, XML, SVG
-   origin — Handles CORS headers
-   fileserver — Serves static files
-   cms — Executes the Xamboo CMS system and engines
-   browser — CMS sub-module for device detection
-   error — Handles and serves 404 errors

The components are detailed lower in this document.

------------------------------------------------------------------------

# Request Lifecycle Within a Host

Once a request matches a host:

1.  TLS is negotiated (if HTTPS)
2.  Middleware components execute in configured order
3.  CMS resolves the requested page (if it is a page)
4.  The corresponding engine runs
5.  The response flows back through the middleware chain
6.  The final output is sent to the client

------------------------------------------------------------------------

# 5. Components

Components are **middleware modules** executed in a chain for every request handled by a Host. They are responsible for cross‑cutting concerns such as logging, statistics, canonical redirection, authentication, security checks, compression/minification, CORS, static files, CMS routing, and final error handling.

A component may:

-   Inspect or modify the request
-   Block or redirect execution
-   Transform the response
-   Log activity
-   Enforce security policies
-   Serve static content
-   Execute the CMS

A component can be:

- **Built-in**: shipped with Xamboo and referenced with `"source": "built-in"`
- **External**: compiled as a Go plugin (`.so`) and referenced with `"source": "extern"`

Xamboo executes components **in the exact order** defined in the global `components` array.  
⚠️ **Order is critical.** Changing the order can change behavior (for example, compressing before minifying, or running CMS before fileserver). Keep the default order unless you have a precise reason and understand the implications.

---

## 5.1 Definition and Loading of Components

### 5.1.1 Declaring the middleware chain

Components are declared globally in the root configuration:

```json
{
  "components": [
    { "name": "log",       "source": "built-in" },
    { "name": "stat",      "source": "built-in" },
    { "name": "redirect",  "source": "built-in" },
    { "name": "auth",      "source": "built-in" },
    { "name": "prot",      "source": "built-in" },
    { "name": "compress",  "source": "built-in" },
    { "name": "minify",    "source": "built-in" },
    { "name": "origin",    "source": "built-in" },
    { "name": "fileserver","source": "built-in" },
    { "name": "cms",       "source": "built-in" },
    { "name": "error",     "source": "built-in" },

    { "name": "myhandler", "source": "extern", "library": "./example/components/myhandler/myhandler.so" }
  ]
}
```

### 5.1.2 Built-in vs external components

**Built-in component**
```json
{ "name": "compress", "source": "built-in" }
```

**External component**
```json
{ "name": "mycomponent", "source": "extern", "library": "./path/to/your/mycomponent.so" }
```

External components must be compiled as Go plugins:

```bash
go build --buildmode=plugin
```

### 5.1.3 Replacing a built-in component

You can override a built-in component by providing an external component with the same operational purpose. Some common reasons may be:

- Implement authentication backed by a database or identity provider (replace `auth`)
- Add a stricter WAF/security gate (insert before `redirect` or before `cms`)
- Push logs to centralized systems (replace/extend `log` and/or `stats` callback)
- Better heuristic for system protection adding rate limits (replace `prot`)

---

## 5.2 Built-in Components (Detailed Reference)

The built-in components are configured **per host** (inside the `hosts` entries), even though they are loaded globally in the `components` array.

Each component typically supports:

- `enabled`: `true/false` (when applicable)
- A component-specific configuration block

Below are the official built-in components in recommended execution order.

---

### 5.2.1 `log`

The **log** component is the primary request and system logging facility at the host level. It can write to files/streams and can optionally call a custom function after each request to export metrics.

It provides up to four log channels:

- `sys`: internal messages for the host (startup/shutdown, internal notices)
- `errors`: runtime errors, panics, recovered panics, and failures
- `pages`: access log of requests (pages + static files)
- `stats`: optional output or callback executed for each request (advanced/custom metrics)

#### Configuration Example

```json
"hosts": [
  {
    "...": "...",
    "log": {
      "enabled": true,
      "pages": "file:./example/logs/developers.log",
      "pagesformat": "%requestid% %clientip% %method% %protocol% %code% %request% %duration% %bytesout% %bytestocompress% %bytestominify%",
      "errors": "file:./example/logs/developers-error.log",
      "sys": "file:./example/logs/developers-sys.log",
      "stats": "discard"
    }
  }
]
```

#### Parameters

- `enabled` *(bool)*  
  Enables/disables the host logging system.

- `pages` *(string)*  
  Destination for request access logs.

- `pagesformat` *(string)*  
  Format template for each request log line. Supported tokens include:

  - `%bytesout%` — bytes sent to the client (headers excluded)  
  - `%bytestocompress%` — size before compression  
  - `%bytestominify%` — size before minification  
  - `%clientip%`, `%clientport%`  
  - `%code%` — HTTP status code  
  - `%duration%` — processing time from request receipt to response ready  
  - `%hostid%`  
  - `%listenerid%`, `%listenerip%`, `%listenerport%`  
  - `%protocol%` — HTTP/HTTPS/WS/WSS  
  - `%method%` — GET/POST/PUT/HEAD/OPTIONS/DELETE/...  
  - `%request%` — full request line  
  - `%starttime%`, `%endtime%`  
  - `%requestid%` — unique internal request identifier  

  If a token has an empty value, it is replaced with `-`.

- `errors` *(string)*  
  Destination for errors. Note: a `404` is not a system error and is typically logged in `pages`.

- `sys` *(string)*  
  Destination for host system messages.

- `stats` *(string)*  
  Statistics destination. Can be:
  - `file:<path>` / `stdout:` / `stderr:` / `discard`
  - `call:<plugin>:<function>` to invoke a function in a loaded plugin on each request.

#### Behavior

- `pages` is written for every completed request (page hit and static hit).
- `errors` receives internal failures, panics (including recovered panics), and unexpected runtime issues.
- `stats` can be used to send metrics anywhere (DB, external monitoring, message queue) via a callback.

#### Custom stats callback

```go
import "github.com/webability-go/xamboo/components/host"

func Log(hw *host.HostWriter) {
    // hw contains RequestStat and Context
    // send metrics to your system
}
```

#### Best Practices

- Use separate files per host (`./logs/<host>-pages.log`, `./logs/<host>-errors.log`).
- Keep `pagesformat` consistent across environments for easier parsing.
- Use `stats` callback for Prometheus/Influx/ELK forwarding rather than mixing logic into request handlers.

---

### 5.2.2 `stat`

The **stat** component builds and stores request statistics used by the `log` component and by runtime monitoring tools (including the Master environment).

It collects and maintains:

- Global counters (lifetime requests served)
- Per-minute request rates
- Request breakdown by type/method
- Host and listener runtime measurements

#### Configuration

This component is **mandatory** and **cannot be disabled**.

#### Behavior

- Runs early in the chain to collect accurate timings and counters.
- Provides the data used by `%duration%`, `%bytesout%`, and other access log tokens.

#### Best Practices

- Keep `stat` immediately after `log` (default order).
- Do not attempt to disable it; rely on `log.enabled=false` if you want to reduce logging overhead, or do not need logging.

---

### 5.2.3 `redirect`

The **redirect** component ensures URL normalization by enforcing a single canonical scheme, domain, and port for a host.

In environments where a host may respond to:

- Multiple domain names (e.g., `example.com`, `www.example.com`)
- Multiple subdomains
- Different protocols (`http` and `https`)
- Different ports

the redirect component guarantees that all traffic is consolidated to one official URL.

This is essential for:

- SEO consistency (avoiding duplicate content)
- Security enforcement (forcing HTTPS)
- Domain normalization
- Port standardization
- Clean URL architecture

When enabled, the component compares the incoming request’s scheme, host, and port with the configured canonical values. If they do not match, the client is automatically redirected to the correct URL using an HTTP **301 (Moved Permanently)** status code.

#### Configuration Example

```json
"redirect": {
  "enabled": true,
  "scheme": "https",
  "host": "developers.webability.info:83"
}
```

#### Parameters

- `enabled` *(bool)* — Enables/disables canonical redirection.
- `scheme` *(string)* — Canonical scheme (`http` or `https`).
- `host` *(string)* — Canonical hostname, optionally with port (`domain` or `domain:port`).

#### Behavior

If a request arrives as:

```
http://webability.info/
```

and the configuration specifies:

```
scheme: https
host: developers.webability.info:83
```

the component returns a 301 redirect to:

```
https://developers.webability.info:83/
```

The redirect happens **before CMS execution** or any page rendering.

#### Best Practices

- Enforce HTTPS in production.
- Choose one canonical domain (with or without `www`) and redirect all variants.
- Keep `redirect` early in the chain to avoid wasted processing on non-canonical requests.

---

### 5.2.4 `auth`

The **auth** component enforces **HTTP Basic Authentication** at the host level. It is commonly used to protect:

- Administration interfaces (master/admin)
- Staging environments
- Private APIs or internal tools

#### Configuration Example

```json
"auth": {
  "enabled": true,
  "realm": "Xamboo Env test (xamboo/xamboo)",
  "user": "xamboo",
  "pass": "xamboo",
  "users": [
    { "enabled": true,
      "user": "name",
      "pass": "password"
    },
    { "enabled": false,
      "user": "name2",
      "pass": "password2"
    }
  ]
}
```

#### Parameters

- `enabled` *(bool)* — Enables/disables Basic Auth protection.
- `realm` *(string)* — Realm text displayed by the browser login prompt.
- `user` *(string)* — Expected username (master user).
- `pass` *(string)* — Expected password (master user).
- `users` *(array of user)* — Expected list of users, can be disabled or enabled.

Each user is:

- `enabled` *(bool)* — Enables/disables this user.
- `user` *(string)* — Expected username.
- `pass` *(string)* — Expected password.


#### Behavior

- If credentials are missing or incorrect, the component returns **401 Unauthorized** and triggers the browser login dialog.
- If correct, the request continues to the next component, creating the headers needed to the authentication of user.

#### Best Practices

- Use only for simple protection or internal environments.
- For production-grade authentication (DB users, OAuth/JWT, SSO), create a custom auth component and replace this one.
- Never store production credentials in a public repository; use environment-specific config files.

---

### 5.2.5 `prot`

The **prot** component implements a basic heuristic protection against SQL injection attempts. It scans incoming variables (GET/POST/PUT) and scores suspicious SQL keyword patterns. If the score exceeds a configured threshold, the request is blocked.

This is a **baseline protection layer**. It can be replaced with a more advanced/custom security component depending on your needs, for instance adding rate limits, IP protections, etc.

#### Configuration Example

```json
"prot": {
  "enabled": true,
  "sql": true,
  "ignore": ["var1", "var2"],
  "threshold": 3
}
```

#### Parameters

- `enabled` *(bool)* — Enables/disables the protection layer.
- `sql` *(bool)* — Enables SQL injection heuristics scanning.
- `ignore` *(array of strings)* — Variable names to exclude from scanning.
- `threshold` *(int)* — Score needed to trigger protection.

Guidance for `threshold`:
- `1` — very sensitive (high false-positive risk)
- `3` — balanced (recommended default)
- `5` — less sensitive (harder to trigger)

#### Behavior

- If an injection attempt is detected, the component returns **500** and logs details to the host error log.
- If not triggered, the request proceeds normally.

#### Best Practices

- Keep it enabled on public forms and API endpoints unless you have a stronger WAF.
- Tune `ignore` for fields that may legitimately contain SQL-like strings (advanced search boxes, query languages, graphQL).
- Consider replacing with a stronger component for enterprise security requirements.

---

### 5.2.6 `compress`

The **compress** component compresses responses (gzip or deflate) when the client supports it and the response matches configured MIME types and file patterns.

Compression reduces bandwidth usage and improves load times for text-based resources.

#### Configuration Example

```json
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
```

#### Parameters

- `enabled` *(bool)* — Enables/disables compression.
- `mimes` *(array of strings)* — Allowed MIME types to compress.
- `files` *(array of strings)* — Filename patterns (wildcards `*` and `?`) allowed for compression (primarily for fileserver outputs).

#### Behavior

Compression happens only if **all** conditions are met:

1. Client requests compression (`Accept-Encoding: gzip, deflate`).
2. The response MIME matches one of `mimes`.
3. If serving a static file, filename matches `files` patterns.

#### Best Practices

- Enable for HTML/CSS/JS/JSON/XML/SVG.
- Avoid compressing already-compressed formats (jpg, png, mp4, zip).
- Use with `minify` for best results (minify first, then compress).

---

### 5.2.7 `minify`

The **minify** component reduces the size of text-based responses by removing unnecessary whitespace and optimizing formatting. It is most effective for HTML, CSS, JavaScript, JSON, SVG, and XML.

#### Configuration Example

```json
"minify": {
  "enabled": true,
  "html": true,
  "css": true,
  "js": true,
  "json": true,
  "svg": true,
  "xml": true
}
```

#### Parameters

- `enabled` *(bool)* — Enables/disables minification.
- `html`, `css`, `js`, `json`, `svg`, `xml` *(bool)* — Enable/disable minification per output type.

#### Behavior

- Minification is applied based on detected MIME type of the response.
- If a type is disabled (e.g., `"js": false`), responses of that type are passed through unchanged.

#### Best Practices

- Keep enabled for production.
- Disable in development if you need human-readable output for debugging.
- Use together with `compress` for maximal reduction (minify → compress).

---

### 5.2.8 `origin`

The **origin** component manages CORS behavior for cross-origin API calls. It detects `OPTIONS` and `HEAD` preflight requests and responds with the appropriate headers based on configured rules.

Use this component when your host serves:

- REST APIs
- Cross-domain browser calls
- Microservices consumed by web frontends on a different domain

#### Configuration Example

```json
"origin": {
  "enabled": true,
  "maindomains": ["webability.info"],
  "default": "https://developers.webability.info",
  "methods": ["GET", "POST", "OPTIONS", "HEAD"],
  "headers": [
    "Accept", "Content-Type", "Content-Length", "Accept-Encoding",
    "X-CSRF-Token", "Authorization", "Origin", "X-Requested-With", "Method"
  ],
  "credentials": true
}
```

#### Parameters

- `enabled` *(bool)* — Enables/disables CORS handling.
- `maindomains` *(array of strings)* — Allowed main domains (used as a rule base).
- `default` *(string)* — Default allowed origin if none matches.
- `methods` *(array of strings)* — Allowed HTTP methods for CORS.
- `headers` *(array of strings)* — Allowed request headers.
- `credentials` *(bool)* — Whether to allow credentials (`Access-Control-Allow-Credentials`).

#### Behavior

- For preflight requests, responds with the computed CORS headers.
- For normal requests, adds CORS headers when appropriate.
- Does not replace application authentication; it only defines browser cross-origin permissions.

#### Best Practices

- Keep the allowed origins strict—avoid `*` in production for sensitive APIs.
- Explicitly include only the methods and headers you use.
- If you use cookies/Authorization headers, set `credentials: true` and ensure origins are explicit.

---

### 5.2.9 `fileserver`

The **fileserver** component serves static files from a configured directory.

It can run in two modes:

- **takeover = true**: the host becomes a pure static server.
- **takeover = false**: static files are served when they exist, otherwise the request falls through to CMS (ideal for websites with assets + pages).

#### Configuration Example

```json
"fileserver": {
  "enabled": true,
  "takeover": false,
  "static": "./example/repository/public/static"
}
```

#### Parameters

- `enabled` *(bool)* — Enables/disables static file serving.
- `takeover` *(bool)* — Full takeover mode.
- `static` *(string)* — Directory path containing static files.

#### Behavior

- If `takeover` is **true**:
  - Files are served if present.
  - If the file is missing, fileserver triggers 404.
  - No CMS fallback occurs.

- If `takeover` is **false**:
  - Files are served if present.
  - If missing, request continues to the next component (commonly `cms`).

#### Best Practices

- Use `takeover=false` for standard CMS sites (assets + pages).
- Keep static directories separate per host for clean deployments.
- Put fileserver before CMS (default order) so assets do not consume CMS routing time.

---

### 5.2.10 `cms`

The **cms** component activates the Xamboo Content Management System. When enabled, the CMS resolves URLs to API, microservices, websockets, pages, loads templates and languages, and executes the configured engines.

This component is the core of Xamboo’s page routing and rendering system.

#### Configuration Example

```json
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
      "comments": "context.Version becomes: computer, phone, tablet, tv, console, wearable, base"
    }
  }
}
```

#### Parameters

- `enabled` *(bool)* — Enables/disables the CMS handler.
- `config` *(array of strings)* — List of XConfig files (`key=value` pairs) used by CMS and by your code.
- `engines` *(object)* — Enables/disables engines available for pages calculation on this host.
- `browser` *(object)* — Browser/device detection sub-module.

##### `engines` options
Set unused engines to `false` to reduce feature surface and prevent unintended execution types.

##### `browser` sub-module
- `browser.enabled` *(bool)* — Enables device detection.
- `browser.useragent.enabled` *(bool)* — Enables User-Agent based classification.

Known versions (device classes) include:
- `pc` (or computer), `mobile`, `tablet`, `tv`, `console`, `wearable`, `base`

> The `base` version is used when device type is unknown.

#### CMS Configuration File (XConfig)

Why an extra file? Because CMS and application code often need a shared parameter store. The XConfig file is a simple `key=value` configuration used by engines and your business logic.

Example:

```ini
# Where the pages are located (relative preferred)
pagesdir=./example/application/pages/

# Home page and error pages
mainpage=home
errorpage=errors/page
errorblock=errors/block

# Default page version and language
version=base
language=en

# Whether pages accept URL path parameters by default
acceptpathparameters=yes
```

#### Behavior

- When CMS is enabled and matches a request to a page, it generates the response using templates, language resources, and engines.
- When CMS takes over, it typically becomes the final handler (no further components after CMS will run for successful page routing), except response modifiers already wrapping it in the chain (such as compress/minify).

#### Best Practices

- Keep `version=base` unless you intentionally manage multiple page versions.
- Be cautious with `acceptpathparameters`:
  - Avoid enabling it on the home page to prevent accidental routing collisions (icons/files mapping to `/`).
- Disable unused engines for a tighter security and maintenance profile.
- Keep your `pagesdir` relative for portability across environments.

---

### 5.2.11 `error`

The **error** component is the final fallback handler that returns a **404 Not Found** when no previous component has produced a response.

It is intentionally minimal. If you want branded error pages, JSON API errors, or structured error responses, you can replace it with a custom component.

#### Configuration Example

```json
"error": {
  "enabled": true
}
```

#### Parameters

- `enabled` *(bool)* — Enables/disables the default 404 handler.

#### Behavior

- If enabled and reached, it returns a 404 response.
- Often placed at the end of the chain to ensure every request has a deterministic outcome.

#### Best Practices

- Keep it enabled unless CMS or another handler fully guarantees 404 responses.
- Replace it for APIs to return JSON error envelopes rather than plain text.

---

## 5.3 Creating a Custom Component

To build your own component, you must export a public variable named `Component` that implements the `xamboo/components/assets.Component` interface:

```go
type Component interface {
    Start()
    NeedHandler() bool
    Handler(handler http.HandlerFunc) http.HandlerFunc
}
```

### Minimal Example (Custom 404 Component)

```go
package mycomponent

import (
    "net/http"
)

var Component = &MyComponent{}

type MyComponent struct{}

func (mc *MyComponent) Start() {
    // called once when the component is loaded for the first time
}

func (mc *MyComponent) NeedHandler() bool {
    return true
}

func (mc *MyComponent) Handler(next http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        http.Error(w, "404 Not Found", http.StatusNotFound)
    }
}
```

### Lifecycle Notes

- `Start()` is called once when the component is first loaded (similar to initialization).
- `NeedHandler()` must return `true` for the component to participate.
- `Handler()` wraps the next handler in the chain.

If your component supports `enabled=false` at the host level, your `Handler()` should pass through by calling `next(w, r)` when disabled.

---

## Recommended Default Order (Why it matters)

A typical safe order is:

1. `log` / `stat` (observe everything)
2. `redirect` (canonicalize early)
3. `auth` / `prot` (security gates early)
4. `compress` / `minify` (response optimizers wrap downstream handlers - performance optimization)
5. `origin` (CORS for APIs interoperability)
6. `fileserver` (serve static assets fast)
7. `cms` (full CMS routing and execution)
8. `error` (fallback)

This order ensures requests are normalized and protected before expensive routing, and responses are optimized consistently.
External components allow you to extend or replace any behavior while preserving the same middleware execution model.

------------------------------------------------------------------------

# 6. Engines

The **Engines** system is the execution core of the Xamboo CMS.  
While Components manage HTTP-level behavior (middleware, security, logging, compression, etc.), **Engines define how a page is interpreted and executed**.

The CMS manual comes in next chapter.

An engine determines:

- How a page file is processed
- Whether it requires compilation
- Whether it needs templates or language resources
- Whether it runs as pure content or as compiled Go code
- How it interacts with context and identity

Engines are the **page-type execution layer** of Xamboo.

---

# 6.1 Definition and Loading of Engines

## 6.1.1 Global Engine Declaration

Engines are declared globally in the root configuration:

```json
{
  "engines":
  [
    { "name": "redirect",  "source": "built-in" },
    { "name": "simple",    "source": "built-in" },
    { "name": "library",   "source": "built-in" },
    { "name": "template",  "source": "built-in" },
    { "name": "language",  "source": "built-in" },
    { "name": "wajafapp",  "source": "built-in" }
  ]
}
```

There are **6 built-in engines**, but you can register as many custom engines as needed.

Each engine represents a **page type handler**.

The host can define a new set of engines or restrict some engines with its own list of engines, if the array of engines are specified into the configuration of the host.
If there is no definition of engines, the global engines will be used.

---

## 6.1.2 Built-in vs External Engines

### Built-in Engine

```json
{ "name": "simple", "source": "built-in" }
```

### External Engine

```json
{ "name": "myengine", "source": "extern", "library": "./path/to/your/myengine.so" }
```

External engines must be compiled as Go plugins:

```bash
go build --buildmode=plugin
```

---

## 6.1.3 Why Create a Custom Engine?

You may develop a new engine when:

- You need a new page type
- You want a custom template language
- You want a new compilation logic
- You need to replace an existing built-in engine
- You want to integrate another rendering framework

---

# 6.2 Built-in Engines (Detailed Reference)

## 6.2.1 Redirect Engine

The **redirect engine** allows a page to redirect to another page with a specific HTTP status code.

Unlike the redirect component (which normalizes host/domain), this engine redirects at the **page level**.

Use cases:
- Legacy page migration
- URL restructuring
- SEO page forwarding

Best practice:
- Use 301 for permanent redirects
- Use 302 for temporary redirects

---

## 6.2.2 Simple Engine

The **simple engine** processes standard page files (HTML, JS, CSS) with parameter injection and business rule evaluation.

Best practice:
- Use for lightweight dynamic pages
- Move heavy logic to the library engine

---

## 6.2.3 Library Engine

The **library engine** compiles Go code pages as plugins and executes them dynamically.

Features:
- Auto recompilation when code changes
- Full Go power
- High performance

Best practice:
- Use for business logic
- Keep logic separate from templates

---

## 6.2.4 Template Engine

The **template engine** serves XCore v2 XTemplate pages and is mainly used for layouts.

Best practice:
- Keep templates presentation-only

---

## 6.2.5 Language Engine

The **language engine** manages XCore v2 XLanguage resources for multilingual support.

Best practice:
- Avoid hard-coded strings
- Keep translations separated

---

## 6.2.6 WajafApp Engine

The **WajafApp engine** integrates with:

github.com/webability-go/wajaf

It is designed to build administration interfaces and SPAs.

Best practice:
- Use only for admin systems

---

# 6.3 Building a Custom Engine

To build your own engine, you must export:

- Engine
- EngineInstance

Interfaces:

```go
type Engine interface {
    NeedInstance() bool
    GetInstance(Hostname string, PagesDir string, P string, i identity.Identity) EngineInstance
    Run(ctx *context.Context, e interface{}) interface{}
}

type EngineInstance interface {
    NeedLanguage() bool
    NeedTemplate() bool
    Run(ctx *context.Context, template *xcore.XTemplate, language *xcore.XLanguage, e interface{}) interface{}
}
```

Execution Flow:

1. Xamboo detects page type.
2. Calls NeedInstance().
3. If false → Run().
4. If true → GetInstance() then Instance.Run() with template/language loaded if needed.

---

# Summary

Engines define how CMS pages are executed.

They enable:
- Static rendering
- Go dynamic execution
- Templates
- Languages
- Admin SPA integration

------------------------------------------------------------------------

# Configuration Best Practices

-   Use relative paths
-   Use pluginprefix for multiple instances
-   Keep middleware ordered correctly
-   Separate site-specific configs
-   Monitor logs during startup

------------------------------------------------------------------------

# Summary

Xamboo’s configuration system is layered, extensible, and designed for
scalable multi-host environments.

------------------------------------------------------------------------
------------------------------------------------------------------------
------------------------------------------------------------------------
# CMS Reference (Full Manual)

Xamboo’s **CMS** is built on a very simple and powerful principle: **the directory structure on disk defines the URL space**.  
Each folder under `pagesdir` represents a route, and therefore a page (or a family of URLs) that the CMS can resolve and execute.

Example:

- If your pages repository contains a folder `./blog/`, then you can request:  
  `https://mysite.com/blog`

Xamboo is not a classic “file server” CMS. It does not treat URLs as files. Instead, it treats URLs as **pages**, described by **folders + definition files + engine execution**.

---

## Core considerations

- The CMS root directory is defined by the `pagesdir` parameter (in the CMS XConfig file).
- The **home page** is always a subdirectory defined by `mainpage`. Any files placed directly at the CMS root are ignored.
- You must create working error handlers as CMS pages:
  - `errorpage` (main error page)
  - `errorblock` (reusable error block)
  
These must exist as valid CMS pages and be resolvable by the CMS, otherwise error handling will be incomplete or inconsistent.

---

# 1. Pages

## 1.1 What is a page? (Engines, Instances, Languages, and Versions)

A CMS page represents either:

1. A **single URL**, for example:  
   `https://www.mysite.com/login`

2. A **group of URLs sharing the same root**, for example:  
   - `https://www.mysite.com/blog`  
   - `https://www.mysite.com/blog/channel1`  
   - `https://www.mysite.com/blog/article1`  
   - ...

In the second case, the root `/blog` corresponds to **one page**, and the remainder of the path is treated as **route parameters** (path parameters). The page code can use those parameters to decide what content to return.

---

### Engines (page execution types)

Every CMS page ultimately produces an output (HTML, JS, CSS, JSON, images, video, etc.). However, there are different ways to build that output. That is why Xamboo uses **Engines**.

Each page has a `type` that selects the engine that will build it. Examples include:

- redirect (page-level redirect)
- simple (meta-language + code files)
- template (XCore v2 XTemplate)
- language (XCore v2 XLanguage)
- library (Go plugin page)
- wajafapp (admin SPA/JSON engine)

> Built-in engines are documented in the Engines section. External engines may be added and referenced by their configured name.

---

### Versions and languages (Instances)

Pages may be served in multiple combinations of:

- **Version** (device/layout variant): `pc`, `mobile`, `tablet`, `base`, etc.
- **Language**: `en`, `es`, `fr`, etc.

Each combination is a **page instance**.

#### The classic explosion problem
If you have 5 versions and 10 languages, that is 50 potential combinations. Maintaining 50 fully duplicated pages is not realistic.

#### The Xamboo strategy
Xamboo encourages:

- A limited number of **templates** (often per version)
- A limited number of **language tables** (per language)
- Engines that combine them at runtime

Instead of maintaining 50 separate page implementations, you typically maintain:
- 5 templates
- 10 language files

And let the engine produce any of the 50 possible outputs.

---

## 1.2 Page resolution (Routing)

Xamboo first normalizes the requested URI path:

1. Keeps the leading `/`
2. Removes the trailing `/` (if any)
3. Splits into segments
4. Applies compatibility rules:
   - Converts routes to lowercase (to avoid issues on case-insensitive OSes)
   - Applies allowed-character constraints

### There is no “file” concept in the CMS
A URL like:

`/my-route/my-file.html`

is **not treated as a file** unless there is an actual folder named `my-file.html` inside the `my-route` folder.

If you want to serve real files, they must exist in the static repository (served by the `fileserver` component), otherwise a 404 is returned.

---

### SEO-friendly route rules

Xamboo routes are designed for SEO and clean indexing. Routes should use only:

- Letters A–Z / a–z (including accented letters and ñ if your filesystem supports them)
- Numbers 0–9
- Hyphen `-`
- Underscore `_`

Avoid using punctuation or special characters inside routes.

Capitalization is converted to lowercase for portability.

Examples:
- `/My-PagE/My-PatH` → repository folder: `my-page/my-path`
- `/ My-page / My-route` → repository folder with spaces (not recommended)

---

### The resolution algorithm

The CMS searches for a published page by walking backwards from the full path:

```
a. Locate the folder path exactly as it comes from the URI (protected against "..")
   a.1 If the folder does not exist → go to b
   a.2 If the folder exists:
       - look for the .page file inside
       - if missing → go to b
       - if present, verify status=published
           - if not published → go to b
           - if published → execute and return the page

b. Not found:
   - remove the last path segment and return to (a)
   - if no segments remain:
       - if home page accepts path parameters → serve home page
       - otherwise → error (404)
```

**In short:** the first published page found while trimming from the end is executed. Any remaining segments become **path parameters** if the page allows them.

The page-level parameter `acceptpathparameters` confirms whether extra segments may be accepted (and passed into the page), or whether a 404 should be returned.

---

## 1.3 The `.page` file: type, status, template and more

Every page folder must contain a `.page` file named after the folder.

Examples:

```
./home/home.page
./blog/channel/channel.page
```

The `.page` file is an XConfig file (`key=value` format).

### Mandatory parameters

```ini
# engine name used to build this page
type=simple

# visibility / role of this page
status=published
```

### Supported statuses

- `hidden` (default if missing): never visible, not callable externally, not usable internally
- `published`: visible from outside (main URL-invoked pages)
- `template`: template page, not visible from outside
- `block`: building block used by other pages
- `folder`: purely structural folder, no page execution

> Page behavior and additional parameters depend on the page type and status.

If you add an external engine, you will reference it using the engine name declared in the global Xamboo configuration (`"engines": [...]`).

---

## 1.4 Page instances (`.instance`)

For all page types **except redirect**, the page requires at least one `.instance` file.

Instance files contain parameters that may differ by version and language.

The default `language` and `version` are set in the CMS configuration file.  
If the system cannot resolve a language/version, it falls back to those defaults.

By default:
- Language is not automatically detected (you set it in code, or with a component)
- Version may be set from device type if the CMS browser sub-module is enabled

### Instance filename conventions

```
[page-name].[version].[language].instance
[page-name].[version].instance
[page-name].instance
```

The `[version].[language]` pair is called the **instance identity**.

### Instance resolution order

Xamboo searches for the first existing file in this order:

1. `[current-version].[current-language]`
2. `[current-version].[default-language]`
3. `[current-version]`
4. `[default-version].[current-language]`
5. `[default-version].[default-language]`
6. `<none>` → `[page-name].instance`

Example: current `fr`, default `en`, current version `mobile`, default `base`:

```
mypage.mobile.fr.instance
mypage.mobile.en.instance
mypage.mobile.instance
mypage.base.fr.instance
mypage.base.en.instance
mypage.instance
```

✅ **Strong recommendation:** always provide `mypage.instance`, even if empty.

Instance files can store:
- cache hints
- template injection values
- runtime configuration for Go pages
- feature flags

---

## 1.5 Page types and complementary files

### 1.5.1 Redirect Page (`type=redirect`)

A redirect page needs no instance. It requires two additional `.page` parameters:

```ini
type=redirect
status=published

redirecturl=/other-url
redirectcode=301
```

- `redirecturl` may be relative, absolute, or point to another domain
- `redirectcode` is typically `301` (permanent) or `302` (temporary)

✅ Best practices:
- redirect pages should be `published`
- avoid redirect chains

---

### 1.5.2 Simple Page (`type=simple`)

The simple page is the core CMS page type: output code (HTML/JS/CSS/JSON) plus meta-language keywords for dynamic injection.

Required files:
- `.page`
- one or more `.instance`
- one or more `.code`

Common `.page` parameters:
- `template=<page>` (wrap into template page)
- `acceptpathparameters=yes|no`

`.code` files follow the same identity resolution logic as `.instance` files.

The meta-language is documented in **CMS and Meta Language**.

---

### 1.5.3 Template Page (`type=template`)

A template page is based on `.template` files containing XCore v2 XTemplate data.

- should not be `published`
- used as layout/dispatch by other pages
- may have multiple `.template` variants by identity
- may have `.instance` for context parameters

---

### 1.5.4 Language Page (`type=language`)

A language page is based on `.language` files containing XCore v2 XLanguage data.

- should not be `published`
- used by other pages to inject translations
- may have multiple `.language` variants by identity
- may have `.instance` for context parameters

---

### 1.5.5 Library Page (`type=library`)

A library page is a single `.go` file compiled into a plugin. It must contain a `Run` function.

Optional companion files:
- `.template` variants
- `.language` variants
- `.instance` variants

Common `.page` parameters:
- `template=<page>`
- `acceptpathparameters=true` when handling multiple sub-URLs

---

### 1.5.6 WajafApp Page (`type=wajafapp`)

Similar to library pages, but designed for administration code using Wajaf.

- `.go` plugin
- must contain `Run` and optional event functions
- typically returns JSON structures

Common `.page` parameters:
- `template=<page>`
- `acceptpathparameters=true` (commonly mandatory)

---

# 2. CMS and Meta Language (Simple Pages)

The meta-language is a set of keywords written inside `.code` files. The engine replaces those keywords with values or execution results.

## 2.1 Comments `%-- ... --%`

Comments are removed during compilation:

```text
%-- This is a comment. It will not appear in the final code. --%

%--
This entire block will never be compiled or visible:
[[BOX,/box:
Anything here
BOX]]
--%
```

---

## 2.2 Language insertion `##id##`

`##id##` inserts a localized string from the `.language` file matching the client language (with fallback).

Example usage:

```html
<div style="background-color: blue;">
##welcome##<br />
<span onclick="alert('##hello##');" class="button">##clickme##!</span>
</div>
```

Default fallback language file (`mypage.language`):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<language id="mypage" lang="en">
  <entry id="welcome">Welcome to</entry>
  <entry id="clickme">Click me</entry>
</language>
```

French variant (`mypage.base.fr.language`):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<language id="mypage" lang="fr">
  <entry id="welcome">Bienvenue</entry>
  <entry id="clickme">Clique sur moi</entry>
</language>
```

Best practices:
- Keep keys consistent across languages
- Always provide the fallback `mypage.language`

---

## 2.3 Access to variables (system, page, instance, local)

### `[[URLPARAMS]]`
Reads all path parameters and writes them as a URL query string.
Requires `acceptpathparameters=yes` in `.page`.

### `[[URLPARAM,n]]`
Extracts the *n-th* (1-indexed) path parameter.
Requires `acceptpathparameters=yes`.

### `[[VAR,name]]`
Extracts a variable from:
- query string `?name=value`
- POST/PUT body variables

### `[[PARAM,name]]`
Extracts a local parameter passed when calling a page using `[[CALL,...]]`.

### `[[SYSPARAM,name]]`
Reads a system parameter from the CMS `.conf` (XConfig) file.

### `[[PAGEPARAM,name]]`
Reads a parameter from the `.page` of the main URL-invoked page.

### `[[LOCALPAGEPARAM,name]]`
Reads a parameter from the `.page` of the page currently being built (template/block/subpage).

### `[[INSTANCEPARAM,name]]`
Reads a parameter from the `.instance` of the main URL-invoked page.

### `[[LOCALINSTANCEPARAM,name]]`
Reads a parameter from the `.instance` of the page currently being built.

### `[[SESSIONPARAM,name]]`
Reads a session parameter (available in context/session for execution).

---

## 2.4 Resource inclusion

### `[[JS, ... ]]`
Includes a JavaScript file in headers only once.

### `[[CSS, ... ]]`
Includes a CSS file in headers only once.

---

## 2.5 Page composition

### `[[CALL,page(:params)?]]`
Calls a page, template, or block with optional parameters.
Called page can read them via `[[PARAM,...]]`.

### `[[BOX,/path: ... BOX]]`
Includes a template and encapsulates the inner content.
A box is a local mini-template applied to a snippet.

---

# 3. Library page

## 1. Introduction

A **Library Page** (`type=library`) is one of the most powerful page types in Xamboo.

Unlike a `simple` page (meta-language + .code files), a library page is written in **Go** and compiled as a plugin.  
It allows you to implement full business logic, dynamic routing, conditional rendering, and even internal CMS dispatching.

Library pages are ideal for:

- Complex business logic
- API endpoints
- Dynamic content generation
- Proxy behavior
- Conditional page delegation
- Integration with external services
- Advanced routing inside a single CMS page

---

## 2. Minimal Library Page Structure

A minimal library page requires:

```
/home
  home.page
  home.instance
  home.go
```

---

### 2.1 The `.page` file

```ini
type=library
status=published
acceptpathparameters=true
template=main/template   # optional
```

### Parameters explained

- `type=library` → tells Xamboo to use the library engine.
- `status=published` → page accessible via URL.
- `acceptpathparameters=true` → allow extra URI segments.
- `template=...` → optional template wrapping the result.

---

### 2.2 The `.instance` file

At minimum:

```
home.instance
```

Even if empty, it must exist.

Instance files may contain:

- configuration flags
- cache hints
- feature switches
- injected parameters

Always provide at least one fallback instance file.

---

## 3. Minimal Working Example

Below is a minimal library page implementation:

```go
package main

import (
	"github.com/webability-go/xcore/v2"

	"github.com/webability-go/xamboo/cms"
	"github.com/webability-go/xamboo/cms/context"
)

func Run(ctx *context.Context, template *xcore.XTemplate, language *xcore.XLanguage, e interface{}) interface{} {

	// Read the original URL path
	original := ctx.Request.URL.Path

	// Conditional delegation, example to call another page from this one by code
	if original == "/home" {
		return e.(*cms.CMS).Run("home/home", true, nil, "", "", "")
	}

	// Integrate parameters to inject into the templates (including the languages entries)
	params := &xcore.XDataset{
		"Param1": "´value of parameter1",
		"#": language,
	}

	// Default behavior: render template
	return template.Execute(nil)
}
```

---

## 4. Understanding the Run Function

The required exported function signature is:

```go
func Run(ctx *context.Context, template *xcore.XTemplate, language *xcore.XLanguage, e interface{}) interface{}
```

### Parameters explained

### ctx *context.Context
Contains:

- HTTP request
- HTTP response writer
- Session parameters
- Instance parameters
- Page parameters
- Version
- Language
- Return code

This is the main object you use to access runtime information.

---

### template *xcore.XTemplate

The resolved template (if configured in `.page`).

You can:

- Inject variables
- Execute template
- Ignore it entirely and return custom output

---

### language *xcore.XLanguage

The resolved language table for this page.

Use it to fetch translations manually if needed.

---

### e interface{}

The internal CMS engine reference.

In most cases:

```go
e.(*cms.CMS)
```

This allows you to:

- Run other pages
- Trigger internal routing
- Call blocks/templates programmatically

---

## 5. What the Example Does

```
original := ctx.Request.URL.Path
```

Reads the full requested path.

---

```
if original == "/home" {
	return e.(*cms.CMS).Run("home/home", true, nil, "", "", "")
}
```

If the exact path is `/home`, it delegates execution to another CMS page.

This demonstrates that:

- A library page can act as a router
- A library page can call another page internally
- You can build conditional routing logic

---

```
return template.Execute(nil)
```

If no special condition is met:

- Execute the associated template
- Return the rendered output

---

## 6. Return Values

A library page may return:

- string (HTML/JSON/etc.)
- []byte
- structured data
- error (supported in newer versions)
- anything supported by the engine

If returning an error, the CMS will trigger error handling.

---

## 7. Advanced Patterns

### 7.1 Acting as a Router

You can route internally:

```go
return e.(*cms.CMS).Run("blog/article", true, nil, "", "", "")
```

### 7.2 Serving JSON API

```go
ctx.Writer.Header().Set("Content-Type", "application/json")
return `{"status":"ok"}`
```

### 7.3 Using Path Parameters

If `acceptpathparameters=true`:

```go
params := ctx.URLParams
```

You can parse dynamic routes like:

```
/home/123/details
```

---

## 8. Best Practices

- Always include a fallback `.instance`
- Keep heavy logic in Go, not templates
- Avoid deep recursion (respect maxrecursion)
- Prefer internal CMS delegation instead of duplicating code
- Keep template logic presentation-only
- Return errors instead of silently failing

---

## 9. Compilation Notes

Library pages are compiled as Go plugins.

Xamboo automatically:

- Detects changes in `.go`
- Recompiles when needed
- Loads the plugin
- Caches it

Make sure:

- The package is `package main`
- The function `Run` is exported
- Dependencies are correct
- No global state causes race conditions

---

## 10. Minimal Checklist

To create a working library page:

1. Create folder `/home`
2. Add `home.page`
3. Add `home.instance`
4. Add `home.go`
5. Ensure `type=library`
6. Restart or reload configuration

---

## 11. Summary

A Library Page:

- Is a Go plugin .so
- Executes dynamic business logic
- Can delegate to other CMS pages
- Can serve HTML, JSON, or any content
- Integrates fully with templates and language tables
- Is the most powerful CMS page type in Xamboo

Use it when your page needs real backend intelligence, not just meta-language substitution.

## 12. Example of an API page code

```go
package main

import (
	"net/http"

	"github.com/webability-go/xamboo/cms/context"
	"github.com/webability-go/xcore/v2"
	"github.com/webability-go/xmodules/tools"
)

const ERROR_METHODNOTSUPPORTED = "Method not supported"

// Run function is MANDATORY and is the point of call from the xamboo
//
//	The enginecontext contains all what you need to link with the system
func Run(ctx *context.Context, template *xcore.XTemplate, xlanguage *xcore.XLanguage, e interface{}) interface{} {

	switch ctx.Request.Method {
	case "GET":
		return rGet(ctx, template, xlanguage, e)
	case "POST", "PUT":
		return rPost(ctx, template, xlanguage, e)
	case "DELETE":
		return rDelete(ctx, template, xlanguage, e)
	case "OPTIONS": // Ensure pre flight will answer correct headers
		return ""
	default:
	}
	// 501 not implemented
	http.Error(ctx.Writer, ERROR_METHODNOTSUPPORTED, http.StatusNotImplemented)
	return ERROR_METHODNOTSUPPORTED
}

func rGet(ctx *context.Context, template *xcore.XTemplate, xlanguage *xcore.XLanguage, e interface{}) interface{} {

    // Code business logic

	m["status"] = "ok"
	return tools.JSONEncode(m, true)
}

func rPost(ctx *context.Context, template *xcore.XTemplate, xlanguage *xcore.XLanguage, e interface{}) interface{} {

    // Code business logic

	m["status"] = "ok"
	return tools.JSONEncode(m, true)
}

func rDelete(ctx *context.Context, template *xcore.XTemplate, xlanguage *xcore.XLanguage, e interface{}) interface{} {

    // Code business logic

	m["status"] = "ok"
	return tools.JSONEncode(m, true)
}

```

## 13. Example of a service worker upgrade code

```go
package main

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/gorilla/websocket"

	"github.com/webability-go/xamboo/cms/context"
	"github.com/webability-go/xamboo/components/host"
	"github.com/webability-go/xamboo/components/stat"
	xcore "github.com/webability-go/xcore/v2"
)

type listenerStream struct {
	Id          int
	Upgrader    websocket.Upgrader
	Stream      *websocket.Conn
	RequestStat *stat.RequestStat

	fulldata bool
}

var counter = 1

/*
This function is MANDATORY and is the point of call from the xamboo
The enginecontext contains all what you need to link with the system
*/
func Run(ctx *context.Context, template *xcore.XTemplate, language *xcore.XLanguage, e interface{}) interface{} {

	fmt.Println("Entering listener")
	// Note: the upgrader will hijack the writer, so we are responsible to actualize the stats
	hw := ctx.Writer.(host.HostWriter)
	par := hw.GetParams()
	irs, _ := par.Get("requeststat")
	rs := irs.(*stat.RequestStat)
	ls := listenerStream{
		Id:          counter,
		Upgrader:    websocket.Upgrader{},
		RequestStat: rs,
		fulldata:    true,
	}
	counter++

	stream, err := ls.Upgrader.Upgrade(ctx.Writer, ctx.Request, nil)
	if err != nil {
		fmt.Println(err)
		return "ERROR UPGRADING STREAM: " + fmt.Sprint(err)
	}
	ls.Stream = stream
	ls.RequestStat.UpdateProtocol("WSS")

	fmt.Println("LISTENER START: ", ls.Id)

	defer stream.Close()

	cdone := make(chan bool)
	go Read(ls, cdone)
	go Write(ls, cdone)

	<-cdone
	<-cdone
	fmt.Println("LISTENER CLOSED: ", ls.Id)
	return "END STREAM CLOSED"
}

func Read(ls listenerStream, done chan bool) {
	for {
		_, message, err := ls.Stream.ReadMessage()
		if err != nil {
			fmt.Println("END STREAM IN READ: " + fmt.Sprint(err))
			break
		}

		fmt.Println("MESSAGE: " + fmt.Sprint(message))
		if strings.Contains(string(message), "F") {
			ls.fulldata = true
		}
		// if the client asks for "data", we send it a resume
		// err = stream.WriteMessage(websocket.TextMessage, []byte(statmsg))
	}
	done <- true
}

func Write(ls listenerStream, done chan bool) {
	last := time.Now()
	for {
		// if no changes, do not send anything
		// or send a pingpong

		// search for all the data > last
		newTime := time.Now()
		last = newTime

		data := make(map[string]interface{})
		data["timestamp"] = last.Unix()
		data["ping"] = "ping"

		datajson, _ := json.Marshal(data)
		ls.RequestStat.UpdateStat(0, len(datajson))
		err := ls.Stream.WriteMessage(websocket.TextMessage, []byte(datajson))

		if err != nil {
			fmt.Println("END STREAM IN WRITE: " + fmt.Sprint(err))
			break
		}

		time.Sleep(1 * time.Second)
	}
	done <- true
}


```


# 4. CMS Best Practices

- Always include a fallback instance: `mypage.instance`.
- Keep `version=base` unless you actively manage multiple versions.
- Enable browser/useragent only if you need device-specific versions.
- Avoid enabling `acceptpathparameters` on home unless you know exactly why.
- Keep static assets in `fileserver`, not in CMS routes.
- Do not put heavy business logic in `.code`—use `library` pages for complex logic.

---

# 5. Minimal Site Checklist

In your CMS XConfig (`.conf`) file:

- `pagesdir=...`
- `mainpage=...`
- `errorpage=...`
- `errorblock=...`
- `version=base`
- `language=en|es|...`
- `acceptpathparameters=yes|no` (as a routing strategy)

In your pages repository:

- `mainpage/` folder with valid `.page`, `.instance`, and code files.
- `errorpage/` and `errorblock/` folders implemented as real CMS pages.

---

# 5. Summary

Xamboo CMS is a **folder-driven CMS**:

- **Routes → folders**
- **Page definition → `.page`**
- **Variants → `.instance`**
- **Content → `.code`, `.template`, `.language`, `.go`**
- **Execution strategy → engine `type`**

This architecture makes Xamboo highly modular and scalable, well suited for multi-language, multi-device sites and strong business-rule integration.

------------------------------------------------------------------------

# Applications

Applications must export:

``` go
var Application assets.Application
```

Responsibilities:

-   Load XModules
-   Manage contexts
-   Handle datasources

------------------------------------------------------------------------

# XModules

The xmodules are under another project into the webability-go github.
Structured business modules:

-   User management
-   CRM
-   ERP
-   Ecommerce
-   Administration

------------------------------------------------------------------------

# Performance

-   500 req/sec production on 8 CPU server with 16 GB Memory with a simple postgres database
-   3000 req/sec lab on same server
-   Automatic plugin recompilation < 3 seconds with waiting queue
-   TLS 1.2 / 1.3 supported

------------------------------------------------------------------------

# License

MIT License
