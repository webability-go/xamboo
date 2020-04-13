
/*
    ondemandManager.js, WAJAF, the WebAbility(r) Javascript Application Framework
    Contains the Files On Demand Manager
    (c) 2008-2010 Philippe Thomassigny

    This file is part of WAJAF

    WAJAF is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WAJAF is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with WAJAF.  If not, see <http://www.gnu.org/licenses/>.
*/

WA.Managers.ondemand = new function()
{
  var self = this;
  this.jsods = {};
  this.cssods = {};
  this.pods = {};

  this.message = 'Loading, please wait...';

  this.setMessage = setMessage;
  function setMessage(msg)
  {
    this.message = msg;
  }

  this.loadJS = loadJS;
  function loadJS(name, callback, force)   // will return true if the script is loaded and available, or false if still not available
  {
    // 1. search if the name is in queue
    if (self.jsods[name])
    { // 2. the name is in queue ? get back loading status
      return self.jsods[name].loaded;
    }
    // 3. the name is not in queue ? create it
    var j = new WA.Managers.ondemand._fod(1, name, callback, force);
    self.jsods[name] = j;
    // if the object has been created, we return it
    return j;
  }

  this.loadCSS = loadCSS;
  function loadCSS(name, callback, force)   // will return true if the script is loaded and available, or false if still not available
  {
    // 1. search if the name is in queue
    if (self.cssods[name])
    { // 2. the name is in queue ? get back loading status
      return self.cssods[name].loaded;
    }
    // 3. the name is not in queue ? create it
    var c = new WA.Managers.ondemand._fod(2, name, callback, force);
    self.cssods[name] = c;
    // if the object has been created, we return it
    return c;
  }

  this.loadPage = loadPage;
  function loadPage(container, name, js, css, callback, force)   // will return true if the script is loaded and available, or false if still not available
  {
    var id = WA.isString(container)?container:container.id;
    var node = WA.isString(container)?$(container):container;
    if (WA.isEmpty(id) || WA.isEmpty(node))
      return false;

    if (self.pods[id])
    { // 2. the name is in queue ? get back loading status
      return self.pods[id].loaded;
    }

    if (self.message != '')
      WA.browser.setInnerHTML(node, self.message);

    js = WA.isString(js) && !WA.isEmpty(js) ? [js] : (WA.isArray(js) && !WA.isEmpty(js) ? js : []);
    css = WA.isString(css) && !WA.isEmpty(css) ? [css] : (WA.isArray(css) && !WA.isEmpty(css) ? css : []);

    var p = new WA.Managers.ondemand._pod(node, name, js, css, callback, force);

    self.pods[id] = p;
    return p;
  }

  this.replacePage = replacePage;
  function replacePage(container, name, js, css, callback, force, clear)   // will return true if the script is loaded and available, or false if still not available
  {
    this.unload(container, clear);
    return this.loadPage(container, name, js, css, callback, force);
  }

  // only one unload method: css names cannot be the same as js names and cannot be the same id of container.
  this.unload = unload;
  function unload(name, clear)
  {
    var id = WA.isString(name)?name:name.id;
    if (WA.isEmpty(id))
      return false;

    if (self.jsods[id])
    {
      self.jsods[name].destroy();
      delete self.jsods[name];
      return true;
    }

    if (self.cssods[id])
    {
      self.cssods[name].destroy();
      delete self.cssods[name];
      return true;
    }

    if (self.pods[id])
    {
      self.pods[id].destroy(clear);
      delete self.pods[id];
      return true;
    }

    return false;
  }

  // flush
  function destroy()
  {
    for (var i in self.pods)
      self.pods[i].destroy(true);
    delete self.pods;
    for (var i in self.jsods)
      self.jsods[i].destroy();
    delete self.jsods;
    for (var i in self.cssods)
      self.cssods[i].destroy();
    delete self.cssods;
    self = null;
  }

  WA.Managers.event.registerFlush(destroy);
}();



WA.Managers.ondemand._fod = function(type, name, callback, force)
{
  var self = this;

  this.type = type;
  this.name = name;
  this.callback = callback;
  this.force = force;

  this.loaded = false;
  this.script = null;

  var errorcount = 0;
  var csscount = 0;

  function feedBack()
  {
    self.loaded = true;
    WA.Managers.event.off('load', self.script, feedBack, true);
    WA.Managers.event.off('error', self.script, feedBackError, true);
    if (self.callback)
      self.callback(self.name);
  }

  function feedBackError()
  {
    WA.Managers.event.off('load', self.script, feedBack, true);
    WA.Managers.event.off('error', self.script, feedBackError, true);
    self.script.parentNode.removeChild(self.script);
    self.script = null;
    self.loaded = false;

    errorcount++;
    if (errorcount > 2)
    {
      alert(WA.i18n.getMessage('ondemand.fatalerror')+self.name);
      WA.Managers.ondemand.unload(self.name);
      return;
    }
    // we try again 3 times
    start();
  }

  function scanCSS()
  {
    csscount++;
    if (csscount > 150) // 30 seconds
    {
      alert(WA.i18n.getMessage('ondemand.fatalerror')+self.name);
      // should we unload ? if the rules are really loaded, we dont know it and could destroy the screen
//      WA.Managers.ondemand.unload(self.name);
      return;
    }

    var found = false;
    for (var i=0, l=document.styleSheets.length; i < l; i++)
    {
      // Note: MSIE (as usual) do not use DOM standard and use its own properties to point nodes and rules
      if ( (!WA.browser.isMSIE && document.styleSheets[i].ownerNode == self.script ) || (WA.browser.isMSIE && document.styleSheets[i].owningElement == self.script) )
      {
        try // We need to use this try-catch because of the error in Firefox thrown when accessing cssRules not completely loaded
        {
          if ( (!WA.browser.isMSIE && document.styleSheets[i].cssRules && document.styleSheets[i].cssRules.length > 0 ) || (WA.browser.isMSIE && document.styleSheets[i].rules && document.styleSheets[i].rules.length > 0 ))
          {
            found = true;
            if (self.callback)
              self.callback(self.name);
          }
        }
        catch (e) { }
        break;
      }
    }
    if (!found)
      setTimeout(scanCSS, 200);
  }

  function start()
  {
    if (type == 1)
    {
      self.script = document.createElement('script');
      self.script.setAttribute('type', 'text/javascript');
    	if (this.force)
        self.script.setAttribute('src', self.name + (self.name.indexOf('?')!=-1?'&':'?') + new Date().getTime());
    	else
        self.script.setAttribute('src', self.name);
      document.getElementsByTagName('head')[0].appendChild(self.script);
      WA.Managers.event.on('load', self.script, feedBack, true);
      WA.Managers.event.on('error', self.script, feedBackError, true);
    }
    else if (type == 2)
    {
      self.script = document.createElement('link');
    	self.script.setAttribute('rel', 'stylesheet')
    	self.script.setAttribute('type','text/css');
    	if (this.force)
        self.script.setAttribute('href', self.name + (self.name.indexOf('?')!=-1?'&':'?') + new Date().getTime());
    	else
        self.script.setAttribute('href', self.name);
      document.getElementsByTagName('head')[0].appendChild(self.script);
      // how do we catch the ONLOAD of CSS ? is not supported by browsers :S
      // timeout/check content of node ?
      scanCSS();
    }
  }

  this.destroy = destroy;
  function destroy()
  {
    if (!self.loaded)
    {
      WA.Managers.event.off('load', self.script, feedBack, true);
      WA.Managers.event.off('error', self.script, feedBackError, true);
    }
    if (self.script)
    {
      self.script.parentNode.removeChild(self.script);
      self.script = null;
    }
    self.callback = null;
    self.name = '';
  }

  start();
}

WA.Managers.ondemand._pod = function(container, name, js, css, callback, force)
{
  var self = this;
  this.container = container;
  this.name = name;
  this.js = js;
  this.css = css;
  this.callback = callback;
  this.force = force;

  this.loaded = false;

  function feedBack(request)
  {
    WA.browser.setInnerHTML(self.container, request.responseText);
    self.loaded = true;
    // call all JS (after page request, to have all the dom available
		for (var i=0, l=self.js.length; i<l; i++)
      WA.Managers.ondemand.loadJS(self.js[i], self.callback, self.force);

    if (self.callback)
      self.callback(self.name);
  }

  this.destroy = destroy;
  function destroy(clear)
  {
    if (clear)
      WA.browser.setInnerHTML(self.container, '');
    // unset all JS and CSS
		for (var i=0, l=self.css.length; i<l; i++)
      WA.Managers.ondemand.unload(self.css[i]);
		for (var i=0, l=self.js.length; i<l; i++)
      WA.Managers.ondemand.unload(self.js[i]);
    delete self.css;
    delete self.js;
    self.container = null;
    self.callback = null;
    self = null;
  }


  // call all CSS (before HTML to build faster page)
	for (var i=0, l=css.length; i<l; i++)
    WA.Managers.ondemand.loadCSS(css[i], callback, force);

  // ask by AJAX
  var request = WA.Managers.ajax.createRequest(name, 'POST', null, feedBack, true, true);
}

WA.i18n.setEntry('ondemand.fatalerror', 'Error: the requested file could not be loaded: ');
