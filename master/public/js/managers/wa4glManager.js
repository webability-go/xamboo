
/*
    wa4glManager.js, WAJAF, the WebAbility(r) Javascript Application Framework
    Contains the Manager singleton to manage the 4GL framework and applications
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

// ================================================================================================
// WA adjunctions for 4GL
// ================================================================================================

// WE OVERLOAD getDomeNode for 4GL
// The context is used ONLY if there is no '|' (pipe) into the element name.
// The context is used for all $, $N, $C, $E, $A
WA.context = '';
WA.contexthistory = [];

WA.pushContext = function(context)
{
  WA.contexthistory.push(WA.context);
  WA.context = context;
}

WA.popContext = function()
{
  WA.context = WA.contexthistory.pop();
}

WA.getDomNode = function(domID)
{
  if (arguments.length > 1)
  {
    var elements = [];
    for (var i = 0, l = arguments.length; i < l; i++)
      elements.push(getDomNode(arguments[i]));
    return elements;
  }
  if (typeof domID == 'string')
  {
    if (domID.indexOf('|')==-1)
      return document.getElementById(WA.context + domID) || document.getElementById(domID);
    return document.getElementById(domID);
  }
  return null;
}

WA.$A = function(ID)
{
  if (arguments.length > 1)
  {
    var elements = [];
    for (var i = 0, l = arguments.length; i < l; i++)
      elements.push(WA.$A(arguments[i]));
    return elements;
  }
  var node = WA.$N(ID);
  if (node)
    return node;
  return null;
}

WA.$N = function(ID)
{
  if (arguments.length > 1)
  {
    var elements = [];
    for (var i = 0, l = arguments.length; i < l; i++)
      elements.push(WA.$N(arguments[i]));
    return elements;
  }
  if (typeof ID == 'string')
  {
    if (ID.indexOf('|')==-1)
    {
      if (!WA.context)
        return null;
      var xID = WA.context.split('|');
      var nID = ID;
    }
    else
    {
      var xID = ID.split('|');
      var nID = xID[2];
    }
    var app = WA.Managers.wa4gl.getApplication(xID[0], xID[1]);
    if (!app)
      return null;
    return app.getNode(nID);
  }
  return null;
}

WA.is4GL = function(node)
{
  return node instanceof WA.Managers.wa4gl._4glnode;
}

// normalize and separate number from measure
WA.analize = function(m, nomax)
{
  if (m == 'auto' || m === undefined || m === null || m === '')
    return null;
  if (m == 'max')
    return nomax?null:m;
  m = '' + m;
//  var an = '[', value = 0, ms = null;
  var an = '', value = 0, ms = null;
  switch(m.charAt(0))
  {
/*
    case '!':
      an = m.charAt(0);
      value = m.substr(1);
      break;
*/
    case '*':
      an = m.charAt(0);
      m = m.substr(1);
    default:
      value = parseInt(m, 10) || 0;
      ms = /%|px|em/.exec(m) || 'px';
      break;
  }
  return [an, value, ms];
}

// metrics.width is undefined, deletes width and let it automatic.
//          "auto", same as undefined, will delete the width and let it automatic HTML
//          "max",
//          "nnpx", in pixels
//          "nn%", in %
//          "nnem", in em
// same with height
// if top AND anchortop AND left AND anchorleft are null, set the position to relative. Else it is absolute and calculated. If a value is missing, it is equivalent to 0.
WA.getCoords = function(domNode, metrics)
{
  var width = WA.analize(metrics.width);
  var height = WA.analize(metrics.height);
  var left = WA.analize(metrics.left, true);
  var top = WA.analize(metrics.top, true);
  var right = WA.analize(metrics.right, true);
  var bottom = WA.analize(metrics.bottom, true);
  var autoleft = autoright = autotop = autobottom = false;
  var realwidth = 0;

  var doneh = false;
  if (width == null)
  {
    domNode.style.width = '';
  }
  else if (width == 'max')
  {
    domNode.style.position = 'absolute';
    domNode.style.width = '';
    domNode.style.left = '0px';
    domNode.style.right = '0px';
    doneh = true;
  }
  else
  {
    // IE ERROR !
    if (WA.browser.isMSIE && domNode.nodeName == 'INPUT' && domNode.type == 'button')
      realwidth = WA.browser.getNodeOuterWidth(domNode);
    domNode.style.width = width[1] + width[2];
  }

  var donev = false;
  if (height == null)
  {
    domNode.style.height = '';
  }
  else if (height == 'max')
  {
    domNode.style.position = 'absolute';
    domNode.style.height = '';
    domNode.style.top = '0px';
    domNode.style.bottom = '0px';
    donev = true;
  }
  else
  {
    domNode.style.height = height[1] + height[2];
  }

  if (doneh && donev)
    return;

  if (!doneh && left != null)
  {
    if (left[0] == '*')
    {
      domNode.style.position = 'absolute';
      domNode.style.left = '50%';
      domNode.style.marginLeft = '-' + Math.ceil(WA.browser.getNodeOffsetWidth(domNode)/2) + 'px';
    }
    else
    {
      domNode.style.position = 'absolute';
      domNode.style.left = left[1] + left[2];
    }
    // we re-force width due to a BIG BUG in IE7 that extends element to the end of container if button
    // BUTTONS ON IE ARE WRONG WITH BORDER: width INCLUDES border !!!!!
    if (WA.browser.isMSIE && domNode.nodeName == 'INPUT' && domNode.type == 'button' && left[1] != 0)
      domNode.style.width = left[1] + left[2] + 'px';
  }
  else if (!doneh && left == null)
  {
    autoleft = true;
  }

  if (!doneh && right != null)
  {
    domNode.style.position = 'absolute';
    domNode.style.right = right[1] + right[2];
  }
  else if (!doneh && right == null)
  {
    autoright = true;
  }

  if (!donev && top != null)
  {
    if (top[0] == '*')
    {
      domNode.style.position = 'absolute';
      domNode.style.top = '50%';
      domNode.style.marginTop = '-' + Math.ceil(WA.browser.getNodeOffsetHeight(domNode)/2) + 'px';
    }
    else
    {
      domNode.style.position = 'absolute';
      domNode.style.top = top[1] + top[2];
    }
  }
  else if (!donev && top == null)
  {
    autotop = true;
  }

  if (!donev && bottom != null)
  {
    domNode.style.position = 'absolute';
    domNode.style.bottom = bottom[1] + bottom[2];
  }
  else if (!donev && bottom == null)
  {
    autobottom = true;
  }

  if (autoleft && autotop && autoright && autobottom)
  {
    domNode.style.position = 'relative';
    domNode.style.left = 'auto';
    domNode.style.top = 'auto';
    domNode.style.right = 'auto';
    domNode.style.bottom = 'auto';
  }
}


// ================================================================================================
// Preemptive check of libraries availability
// ================================================================================================
WA.Containers = {};
WA.Elements = {};
WA.libraries = {};
WA.librariescaller = [];
WA.librariescallernum = 0;

WA.startAvailability = function(app)
{
  WA.librariescaller.push(app);
  WA.librariescallernum++;
}

WA.checkAvailability = function(library)
{
  if (!WA.Containers[library] && !WA.Elements[library])
  {
    if (!WA.libraries[library])
    {
      WA.debug.log('WA.checkAvailability: library added to load: ' + library, 3);
      WA.libraries[library] = true;
    }
    return false;
  }
  return true;
}

WA.librariesLoaded = function()
{
  WA.debug.log('WA.librariesLoaded: all required libraries loaded<br />', 3);
  // all libraries should be loaded, we check it
  for (var i in WA.libraries)
  {
    if (!WA.isBool(WA.libraries[i]))   // we are only interested by booleans
      continue;
    if (!WA.Containers[i] && !WA.Elements[i])
      throw 'Error, the library '+i+' has not been loaded as expected.';
  }

  WA.libraries = {};
  for (var i = 0, l = WA.librariescaller.length; i < l; i++)
  {
    WA.librariescaller[i].availability = true;
    WA.librariescaller[i].start();
  }
  WA.librariescaller = [];
  WA.librariescallernum = 0;
}

WA.callLibraries = function()
{
  WA.librariescallernum--;
  if (WA.librariescallernum != 0)
    return;
  var num = 0;
  var t = '';
  for (var l in WA.libraries)
  {
    if (!WA.isBool(WA.libraries[l]))   // we are only interested by booleans
      continue;
    t += (num++?',':'') + l + '.js';
  }
  if (num > 0)
    WA.Managers.ondemand.loadJS(WA.Managers.wa4gl.urljs+'?js='+t+'&v='+WA.version, WA.librariesLoaded, true);
  else
  {
    WA.librariescaller = [];
    WA.librariescallernum = 0;
  }
}

// Parse a Node Descriptor ID under the format xx|yy|zz
WA.parseID = function(id, localid)
{
  if (!WA.isString(id))
    return null;
  var xid = null;
  if (id.indexOf('|') == -1)
  {
    if (WA.isArray(localid))
      xid = [localid[0], localid[1], id];
    else
      xid = ['', '', id];
  }
  else
  {
    xid = id.split('|');
    if (xid.length != 3)
      throw 'Error: the ID is not a Node Descriptor (xx|yy|zz) in WA.parseID: id='+id;
  }
  xid.push((xid[0]?xid[0]+'|':'') + (xid[1]?xid[1]+'|':'') + xid[2]);
  return xid;
}

// will call our fct with a fixed context
// fct accept the same parameters as main Function.
// if fct returns true, the main Function is executed, otherwise no.
Function.prototype.withContext = function(context)
{
  var self = this;
  return function()
    {
      WA.pushContext(context)
      var r = self.apply(self, arguments);
      WA.popContext();
    }
}

// get an object based on ID into the object, DEPRECATED
WA.getIndexById = function(array, index, field)
{
  alert('please use array.indexof');
}


// return object or undefined if not found
WA.getObjectById = function(obj, value, field)
{
  for (var i in obj)
  {
    if (!WA.isObject(obj[i]))   // we are only interested by objects
      continue;
    if (obj[i][field] == value)
      return obj[i];
  }
  return undefined;
}

// replace the keywords into the whole object template
WA.replaceTemplate = function(obj, rep)
{
  for (var i in obj)
  {
    if (WA.isArray(obj[i]))            // children mainly
    {
      for (var j = 0, l = obj[i].length; j < l; j++)
        WA.replaceTemplate(obj[i][j], rep);
    }
    else if (WA.isString(obj[i]))            // we are only interested by strings
      obj[i] = WA.String.sprintf(obj[i], rep);
    else if (WA.isObject(obj[i]))       // and sub objects
      WA.replaceTemplate(obj[i], rep);
  }
}

// extract the classes from the params with option to a default value
WA.getClasses = function(params, defaults)
{
  var c = {};
  for (var i in defaults)
  {
    if (!WA.isString(defaults[i]))   // we are only interested by string here
      continue;
    if (params[i] != undefined)
      c[i] = params[i];
    else
      c[i] = defaults[i];
  }
  return c;
}

// will analyse and apply the style to the node
WA.applyStyle = function(node, style)
{
  if (style.indexOf(';') == -1)
    return;
  var xstyle = style.split(';');
  for (var i = 0, l = xstyle.length; i < l; i++)
  {
    if (xstyle[i].indexOf(':') == -1)
      continue;
    var xorder = xstyle[i].split(':');
    xorder[0] = xorder[0].trim();
    xorder[1] = xorder[1].trim();
    var p = xorder[0].indexOf('-');
    if ( p != -1 )
    {
      xorder[0] = xorder[0].substring(0, p) + xorder[0].substring(p+1, p+2).toUpperCase() + xorder[0].substring(p+2);
    }
    node.style[xorder[0]] = xorder[1];
  }
}



// There are 2 links to hit the server:
// url is the server url to get applications and interchange datas
// urljs is the server url to get the javascript containers, elements and any other javascript needed

// Each application we load MUST have a UNIQUE CONSECUTIVE ID to assign the id's of dom nodes.
// An application ID has 2 parts: name|instanceid

// The globalerror is a listener that is called if any global error occurs in the 4GL (sent by the SERVER)

// the globallogin is a listener that is called if we need a login to the application (required by the SERVER)
// * When a login is required, the calling application is SUSPENDED until the user has connected (ACK by the SERVER)
//   and any new called applications are also suspended.
//   then the applications are RESUMED when the 4GL have the ACK from the server that the user is connected again

WA.Managers.wa4gl = new function()
{
  var self = this;
  this.url = '';
  this.urljs = '/js';
  this.prelib = '/';
  this.premethod = '/';
  this.codemethod = 'code';
  this.preformat = '/';
  this.format = 'json';
  this.applications = {};
  this.globalerror = null;
  this.globallogin = null;
  this.pendingapp = null;
  this.pendingparams = null;

  // ===========================================================
  // PUBLIC FUNCTIONS
  this.setURL = setURL;
  function setURL(url, urljs)
  {
    if (url)
      self.url = url;
    if (urljs)
      self.urljs = urljs;
    return;
  }

  this.setPath = setPath;
  function setPath(prelib, premethod, codemethod, preformat, format)
  {
    if (prelib)
      self.prelib = prelib;
    if (premethod)
      self.premethod = premethod;
    if (codemethod)
      self.codemethod = codemethod;
    if (preformat)
      self.preformat = preformat;
    if (format)
      self.format = format;
    return;
  }

  this.setGlobalError = setGlobalError;
  function setGlobalError(listener)
  {
    self.globalerror = listener;
  }

  this.callGlobalError = callGlobalError;
  function callGlobalError(error)
  {
    if (self.globalerror)
      self.globalerror(error);
  }

  this.setGlobalLogin = setGlobalLogin;
  function setGlobalLogin(listener)
  {
    self.globallogin = listener;
  }

  this.callGlobalLogin = callGlobalLogin;
  function callGlobalLogin(pendingapp, pendingparams)
  {
    self.pendingapp = pendingapp;
    self.pendingparams = pendingparams;
    if (self.globallogin)
      self.globallogin();
  }

  this.resumeApplication = resumeApplication;
  function resumeApplication()
  {
    if (self.pendingapp)
    {
      self.pendingapp.start(self.pendingparams);
      self.pendingapp = null;
    }
  }

  // ===========================================================
  // APPLICATION CONTROL FUNCTIONS
  // applicationID is the name of the application script as defined
  // mode is: 'full' = size to all screen, '' = stay already defined size
  this.startApplication = startApplication;
  function startApplication(domID, applicationID, instanceID, params, mode, listener)
  {
    if (self.applications[applicationID+'|'+instanceID])
      return self.applications[applicationID+'|'+instanceID].start(params);

    // we adjust to 4glNode if any
    if (WA.isString(domID))
    {
      var node = WA.toDOM(domID);
      if (!node)
        throw 'Error, the application must be into a container.';
      domID = node._4gl?node._4gl:node;
    }
    if (WA.is4GL(domID))
    {
      // it's an inner app
      var oldhelp = WA.Managers.help.getMode();
      WA.Managers.help.switchOff();
      domID.app.emptyNode(domID.domID);
      var fatherNode = domID;
    }
    else
    {
      // it's a new top level app
      var fatherNode = new WA.Managers.wa4gl._4glnode(null, domID, 'zone', null, null, null, null);
    }

    console.log(fatherNode);

    if (fatherNode.supertype != 'zone')
      throw 'The node to charge the application into is not a zone node.';
    // empty the node if needed !, destroy any app into the tree
    if (fatherNode.app)
    {
      fatherNode.app.emptyNode(fatherNode.domID);
      // destroy the application
      stopApplication()
      destroyApplication();
    }

    var app = new WA.Managers.wa4gl._4glapplication(fatherNode, applicationID, instanceID, mode, listener);
    if (app.domNode == null)
      throw 'Error, the application could not be launched.';

    self.applications[applicationID+'|'+instanceID] = app;
    app.start(params);

    if (WA.is4GL(domID))
    {
      WA.Managers.help.setMode(oldhelp);
    }

    return app;
  }

  this.stopApplication = stopApplication;
  function stopApplication(applicationID, instanceID)
  {
    if (!self.applications[applicationID+'|'+instanceID])
      return;
    self.applications[applicationID+'|'+instanceID].stop();
    return;
  }

  this.destroyApplication = destroyApplication;
  function destroyApplication(applicationID, instanceID)
  {
    console.log("DESTROY APPLICATION: ", applicationID, instanceID)
    if (!self.applications[applicationID+'|'+instanceID])
      return;
    self.applications[applicationID+'|'+instanceID].destroy();
    delete self.applications[applicationID+'|'+instanceID];
    return;
  }

  this.reloadApplication = reloadApplication;
  function reloadApplication(node, applicationID, instanceID, params)
  {
    destroyApplication(applicationID, instanceID);
    var newapp = startApplication(node, applicationID, instanceID, params, '');
    return newapp;
  }

  // ===========================================================
  // GENERAL PURPOSE FUNCTIONS
  this.getApplication = getApplication;
  function getApplication(applicationID, instanceID)
  {
    if (!self.applications[applicationID+'|'+instanceID])
      return null;
    return self.applications[applicationID+'|'+instanceID];
  }

  function destroy()
  {
    for (var i in self.applications)
    {
      if (!WA.isObject(self.applications[i]))    // we are only interested by objects
        continue;
      self.applications[i].destroy();
    }
    delete self.applications;
    self.globalerror = null;
    self.globallogin = null;
    self.pendingapp = null;
    self = null;
    return;
  }

  WA.Managers.event.registerFlush(destroy);
}();


// ================================================================================================
// NODE OBJECT
// ================================================================================================

// domID is always a 3 components ID (or 2 if application)
WA.Managers.wa4gl._4glnode = function(father, domID, supertype, code, type, classname, listener)
{
  this.app = null;
  this.domID = domID;
  this.xdomID = WA.parseID(domID);
  this.id = (this.xdomID?this.xdomID[2]:'');
  this.supertype = supertype;
  this.children = {};
  this._4gl = false;
  if (WA.is4GL(father))  // we are into 4GL. If there is no father, this is the application ROOT
  {
    father.appendChild(domID, this);
    this._4gl = true;
  }
  this.father = father;
  this.listener = listener;

  this.code = code;
  if (!this.code)
    this.code = {};
  if (!this.code.attributes)
    this.code.attributes = {};
  this.state = 0;     // 0 : nothing, 1 : loading, 2 = checking, 3 = building, 4 = starting, 5 = running, 6 = stopping, 7 = stopped, 10 = bad error. App uses all state, container, zones, elements only 0,4,5,6,7

  this.visible = (this.code.attributes.display)?this.code.attributes.display!='none':true;
  this.serverlistener = (this.code.attributes.haslistener==='yes');

  // set to the inner application if apply (only in zones)
  this.application = null;

  this.created = false;
  this.domNode = WA.toDOM(domID);
  if (!this.domNode)
  {
    this.domNode = WA.createDomNode(type, domID, classname);
    this.created = true;
    // this is due to a IE bug, the type of an input CANNOT be changed after the node is attached.
    // so we have to take in charge here. To set an input type, code.domtype must be set to the type
    if (code && code.domtype)
      this.domNode.type = code.domtype;
  }
  else
  {
    this.domNode.className = classname;
  }
  if (this.code.attributes.style)
    WA.applyStyle(this.domNode, this.code.attributes.style);
  this.domNode.style.display = this.visible?'':'none';

  // If there is no father (first APP), the app *must* take charge of domNode itself
  if (father && father.domNode != this.domNode.parentNode)
    father.domNode.appendChild(this.domNode);
  this.domNode._4gl = this;

  this.events = {};
  this.registerEvents();
}

WA.Managers.wa4gl._4glnode.prototype.appendChild = function(id, child)
{
  if (!this.children[id])
  {
    child.father = this;
    child.app = this.app;
    this.children[id] = child;
  }
}

WA.Managers.wa4gl._4glnode.prototype.removeChild = function(id)
{
  if (!this.children[id])
    return;
  this.children[id].father = null;
  delete this.children[id];
}

WA.Managers.wa4gl._4glnode.prototype.addEvent = function(type, fct)
{
  this.events[type] = fct;
}

WA.Managers.wa4gl._4glnode.prototype.removeEvent = function(type)
{
  delete this.events[type];
}

WA.Managers.wa4gl._4glnode.prototype.registerEvents = function()
{
  if (!this.code || !this.code.children)
    return;
  for (var i=0, l=this.code.children.length; i < l; i++)
  {
    if (this.code.children[i].tag == 'event')
    {
      var code = '';
      for (var j=0, m=this.code.children[i].children.length; j < m; j++)
      {
        if (this.code.children[i].children[j].tag == 'code')
          code += this.code.children[i].children[j].data;
      }
      eval('this.events[this.code.children[i].attributes.type] = '+code+';');
      // if the event is a JS event, we add it with on()
      if (this.code.children[i].attributes.type.substr(0,2) == 'on')
      {
        WA.Managers.event.on(this.code.children[i].attributes.type.substr(2), this.domNode, this.events[this.code.children[i].attributes.type], false);
      }
      if (this.code.children[i].attributes.type == 'globalerror')
      {
        WA.Managers.wa4gl.setGlobalError(this.events['globalerror']);
      }
      if (this.code.children[i].attributes.type == 'globallogin')
      {
        WA.Managers.wa4gl.setGlobalLogin(this.events['globallogin']);
      }
    }
  }
}

WA.Managers.wa4gl._4glnode.prototype.callEvent = function(type, params)
{
  var ct = WA.context;
  WA.context = this.app.prependID;
  var result = true;
  if (this.listener)
    this.listener.call(this, type, this.domID , params);
  if (this.events['all'])
  {
    result &= this.events['all'].call(this, type, this.domID, params);
  }
  if (this.events[type])
  {
    result &= this.events[type].call(this, params);
  }
  WA.context = ct;
  return result;
}

WA.Managers.wa4gl._4glnode.prototype.propagate = function(type, params)
{
  // no notifications if we try to start when it is starting, started or stopping
  if (type == 'start' && (this.state == 4 || this.state == 5 || this.state == 6))
    return false;
  // no notifications if we try to stop and we are not started
  if (type == 'stop' && this.state != 5)
    return false;

  var result = true;
  if (type == 'start')
    this.state = 4;
  if (type == 'stop')
    this.state = 6;
  result = this.callEvent(type, params?params:{id:this.xdomID[2]});
  if (this.application)
    this.application.propagate(type, params);
  else
  {
    for (var i in this.children)
    {
      result &= this.children[i].propagate(type, params);
    }
  }
  if (type == 'start')
    this.state = 5;
  if (type == 'stop')
    this.state = 7;
  this.callEvent('post'+type, params?params:{id:this.xdomID[2]});
  return result;
}

WA.Managers.wa4gl._4glnode.prototype.resize = function()
{
  if (this.state != 5 || !this.visible)
    return false;
  var ct = WA.context;
  WA.context = this.app.prependID;
  WA.getCoords(this.domNode, this.code.attributes);
  WA.context = ct;
  return true;
}

WA.Managers.wa4gl._4glnode.prototype.destroy = function(fast)
{
  // we must remove the APP from wa4gl
  if (this.application)
  {
    WA.Managers.wa4gl.destroyApplication(this.application.applicationID, this.application.instanceID);
  }
  else
  {
    for (var i in this.children)
    {
      if (this.children.hasOwnProperty(i))
        this.children[i].destroy(true);
    }
  }

  this.app.removeNode(this.xdomID[2]);
  this.father.removeChild(this.domID);

  this.domNode._4gl = null;
  if (this.created && !fast)
    this.domNode.parentNode.removeChild(this.domNode);
  this.domNode = null;
  this.events = null;
  this.code = null;
  this.listener = null;
  this.father = null;
  this.children = null;
  this.xdomID = null;
  this.domID = null;
}

// ================================================================================================
// APPLICATION OBJECT
// ================================================================================================

WA.Managers.wa4gl._4glapplication = function(fatherNode, applicationID, instanceID, mode, listener)
{
  var self = this;
  if (mode != 'full' && mode != 'jail')
    mode = 'jail';
  this.mode = mode;       // mode is 'full', 'jail' or 'free' if nothing
  WA.Managers.wa4gl._4glapplication.sourceconstructor.call(this, fatherNode, applicationID + '|' + instanceID + '|', 'application', null, 'div', 'application', listener);
  this.app = this;
  this.applicationID = applicationID;
  this.instanceID = instanceID;
  this.prependID = applicationID + '|' + instanceID + '|';    // prepend of ALL children node's ids
  this.params = null;     // default params to call the server
  this.actualmode = mode;

  // Application builder attributes
  this.counter = 1;         // to number missing id's
  this.uids = {};           // all the unique id's of the application, to access rapidly to the 4glnode, and detect if repeated id's
  this.availability = true; // true if we dont need any library
  // status of the application
  this.needlogin = false;
  this.timerlater = null;

  // ----------------------------------------------
  // mode switch
  // ----------------------------------------------
  this.switchMode = switchMode;
  function switchMode(mode)
  {
    if (mode == undefined)
    {
      mode = self.actualmode;
      if (mode == 'full')
        mode = '';
      else
        mode = 'full';
    }
    if (mode == 'full')
    {
      document.body.appendChild(self.domNode);
    }
    else
    {
      self.father.domNode.appendChild(self.domNode);
    }
    self.actualmode = mode;
  }

  // ----------------------------------------------
  // FRAMEWORK LOADER, private
  // ----------------------------------------------
  function getJSON(request)
  {
    var jsa = WA.JSON.withalert;
    WA.JSON.withalert = true;
    self.code = WA.JSON.decode(request.responseText);
    WA.JSON.withalert = jsa;

    if (self.code.error !== undefined && self.code.error === true)
    {
      if (self.code.login)
      {
        self.code = null;
        self.state = 0;
        WA.Managers.wa4gl.callGlobalLogin(self, self.params);
        return;
      }
      else
      {
        alert(self.code.message);
        throw self.code.message;
      }
    }
    // 2. Then we start to interprete the code and build the app !
    self.state = 2;
    self.start();
  }

  // ----------------------------------------------
  // APPLICATION CHECK
  // ----------------------------------------------
  function checkApp()
  {
    try
    {
      WA.startAvailability(self);
      if (!self.code.tag || self.code.tag != 'application')
        throw 'Error, the received code does is not a valid framework application';
      if (!self.code.attributes || !self.code.attributes.id)
        throw 'Error, the received code does not have an application id';
      if (self.code.attributes.id != self.applicationID)
        throw 'Error, the application id [' + self.applicationID + '] does not correspond to the id of the received code [' + self.code.attributes.id + ']';
      if (self.code.attributes.enforce != undefined)
      {
        var xobj = self.code.attributes.enforce.split(',');
        for (var i = 0, l = xobj.length; i < l; i++)
        {
          if (!WA.checkAvailability(xobj[i]))
            // we need to load something
            self.availability = false;
        }
      }

      // we build the main application node
      checkNodes(self.code)

      // we load the missing libraries if any
      WA.callLibraries();
    }
    catch (e)
    {
      self.state = 10; // bad error, we stop anything
      WA.debug.log(e, 1);
      throw e;
    }
  }

  function checkNodes(code, noid)
  {
    if (code.tag == undefined)
      throw 'Error: there is a node #' + counter + ' without tag. The application could not be build.';
    if (code.attributes == undefined)
      code.attributes = {};
    // auto resolve missing IDs (we dont need known named id if we dont use directly the node)
    if (!noid)
    {
      if (code.attributes.id == undefined)
        code.attributes.id = 'autonode_' + self.counter++;
      if (self.uids[code.attributes.id])
        throw 'Error: the unique id '+code.attributes.id+' is used more than one time in the application: '+self.applicationID + '|' + self.instanceID;
      // we stock node ID existance
      self.uids[code.attributes.id] = true;
    }

    if ( (code.tag == 'container' || code.tag == 'element') && !code.attributes.type)
      throw 'Error: the container or element with unique id '+code.attributes.id+' has no type in the application: '+self.applicationID + '|' + self.instanceID;
    if ( (code.tag == 'container' || code.tag == 'element') && !WA.checkAvailability(code.attributes.type) )
      self.availability = false;

    if (!code.children) // nothing to propagate
      return;
    // we propagate
    switch(code.tag)
    {
      case 'zone':
        // If it's an application, it will be called when this one starts
        if (code.attributes && code.attributes.application)
          break;
      case 'container':
      case 'application':
        for (var i=0, l=code.children.length; i < l; i++)
        {
          checkNodes(code.children[i], noid);
        }
        break;
      case 'template':
        for (var i=0, l=code.children.length; i < l; i++)
        {
          checkNodes(code.children[i], true); // true = do not create nodes ID if missing
        }
        break;
      default:
        // do nothing, we ignore elements in building, since they cant have children
        break;
    }
  }

  // ----------------------------------------------
  // APPLICATION BUILDER, CREATE ALL 4GL NODES, PRIVATE
  // ----------------------------------------------
  function buildApp()
  {
    try
    {
      if (self.code.children)
      {
        for (var i=0, l=self.code.children.length; i < l; i++)
        {
          // we create a 4glnode and link with appnode, then we return the new node
          buildTree(self, self.code.children[i]); // true: code has already been checked
        }
      }
      if (self.code.attributes.classname)
        self.domNode.className = self.code.attributes.classname;
    }
    catch (e)
    {
      self.state = 10; // bad error, we stop anything
      WA.debug.log(e, 1);
      throw e;
    }
  }

  // this function will receive a code node to parse into elements, zones, containers, app
  function buildTree(fatherNode, code)
  {
    switch(code.tag)
    {
      case 'container':
        if (!WA.Containers[code.attributes.type])
          throw 'Error, the container library has not been loaded: '+code.attributes.type;
        WA.debug.log('Creating Container: ' + code.attributes.type + ' with ID=' + code.attributes.id, 3);
        var node = new WA.Containers[code.attributes.type](fatherNode, self.prependID + code.attributes.id, code);
        break;
      case 'element':
        if (!WA.Elements[code.attributes.type])
          throw 'Error, the container library has not been loaded: '+code.attributes.type;
        WA.debug.log('Creating Element: ' + code.attributes.type + ' with ID=' + code.attributes.id, 3);
        var node = new WA.Elements[code.attributes.type](fatherNode, self.prependID + code.attributes.id, code);
        break;
      case 'zone':
        // creates the zone into our father
        WA.debug.log('Creating zone with ID=' + code.attributes.id, 3);
        var node = fatherNode.createZone(self.prependID + code.attributes.id, code);
        break;
      default:
        return;
    }

    self.uids[node.xdomID[2]] = node;
    if (code.tag == 'zone' && code.attributes.application)
    {
      var xapp = code.attributes.application.split('|');
      var newapp = WA.Managers.wa4gl.startApplication(node, xapp[0], xapp[1], code.attributes.params?code.attributes.params:'', '');
      node.application = newapp;
    }
    else
    {
      if (code.children)
      {
        for (var i=0, l=code.children.length; i < l; i++)
        {
          var n = buildTree(node, code.children[i]);
          if (node.state == 5)
          {
            n.propagate('start');
            n.propagate('resize');
          }
        }
      }
    }
    return node;
  }

  // ----------------------------------------------
  // NODES REMOVAL
  // ----------------------------------------------
  this.removeNode = removeNode;
  function removeNode(id)
  {
    delete self.uids[id];
  }

  // ----------------------------------------------
  // HOOKS TO BROWSER
  // ----------------------------------------------
  function onresize(e)
  {
    self.propagate('resize');
  }

  // ----------------------------------------------
  // APPLICATION STARTER, MAIN CONTROL, public
  // ----------------------------------------------
  this.start = start;
  function start(params)
  {
    WA.debug.log('start application, self = ', 3);
    WA.debug.log(self, 3);
    if (!self)
    {
      WA.debug.log('Critical error: self is null !!!' + params, 1);
      WA.debug.log(this, 1);
      WA.debug.log(this.domID + ' - ' + this.prependID + this.applicationID, 1)
      return;
    }
    WA.debug.log('app['+self.prependID+'].start: State=' + self.state, 3);
    WA.debug.log('entering state: ' + self.state, 3);

    // if we come from a timer or reenter here, we reinit the timer
    if (self.timerlater)
    {
      clearTimeout(self.timerlater);
      self.timerlater = null;
    }

    // we check if the app is already here, or loading:
    if (self.state == 0) // starting
    {
      self.state = 1;
      if (typeof params == 'object')
      {
        self.code = params;
        self.state = 2;
      }
      else
      {
        // 1. Request for the application
        self.params = params;

        var request = WA.Managers.ajax.createRequest(WA.Managers.wa4gl.url + WA.Managers.wa4gl.prelib + self.applicationID + WA.Managers.wa4gl.premethod + WA.Managers.wa4gl.codemethod + WA.Managers.wa4gl.preformat + WA.Managers.wa4gl.format, 'POST', params, getJSON, true);
        return;
      }
    }

    if (self.state == 1) // loading
    { // we just wait the app finish to load
      // level 2 is set by json reception
      // we should never arrive here.
      return;
    }
    if (self.state == 2) // check the availability of all nodes
    {
      checkApp();
      self.state = 3;
    }
    if (self.state == 3) // build the tree and nodes
    {
      // check libraries availability
      if (!self.availability)
      {
        // the answer for availability launch again start() if there is no error of loading
        return;
      }
      // we create all nodes, containers, elements, etc
      self.registerEvents(); // the app code is set, we calculate events
      buildApp();
      self.propagate('start'); // startApp propagation will set state to 4 then 5
    }
    if (self.state == 6) // stopping
    {
      // we just do nothing, we cannot start if we are stopping
    }
    if (self.state == 7) // stopped
    {
      self.propagate('start'); // startApp propagation will set state to 4 then 5
    }
    if (self.state == 4) // starting
    {
      // do nothing cannot start if already starting
    }
    if (self.state == 5)
    {
      // we ask for a full resize
      if (self.code && self.code.attributes && self.code.attributes.style)
        WA.applyStyle(self.domNode, self.code.attributes.style);
      self.propagate('resize');
      if (self.father.father)
        self.father.propagate('appstarted');
    }
    if (self.state == 10)
    {
      // we had a VERY BAD error and cannot parse or use the code
      throw 'Cannot build an application with previous error. please check the origin code.';
    }
  }

  this.stop = stop;
  function stop()
  {
    WA.debug.log('we are stopping ' + self.domID + ' ' + self.prependID, 3);
    // we should unlink all generated code and events
    // we call onstop
    if (self.state == 5)
      self.propagate('stop'); // startApp propagation will set state to 6 then 7
  }

  // ----------------------------------------------
  // TOOLS, PUBLIC
  // ----------------------------------------------
  // id can be: a 4gl Node
  //            a domNode
  //            a simple name string (same app)
  //            a full name string with |
  this.getNode = getNode;
  function getNode(id)
  {
    if (id instanceof WA.Managers.wa4gl._4glnode)
      return id;
    if (WA.isDOM(id))
      return id._4gl?id._4gl.app:null;
    if (WA.isString(id))
    {
      var xid = WA.parseID(id);
      if (!xid)
        return null;
      if (xid && xid[0]) // it's a string with |
      {
        var app = WA.Managers.wa4gl.getApplication(xid[0], xid[1]);
        if (!app)
          return null;
        if (app && app != self.app)
          return app.getNode(xid[2]);
      }
      if (self.uids[xid[2]])
        return self.uids[xid[2]];
    }
    return null;
  }

  this.createTree = createTree;
  function createTree(nodeFatherID, code)
  {
    var nodeFather = getNode(nodeFatherID);
    if (!nodeFather)
      return false;
    if (nodeFather.app != self)
      return nodeFather.app.createTree(nodeFather, code);
    checkNodes(code);
    var n = buildTree(nodeFather, code);
    // THE CREATEZONE OF THE CONTAINERS AUTO STARTS THE ZONES !!!!!!
    // BE CAREFULL, THE START WILL BE CALLED TWICE WITH THIS ONE
    if (self.state == 5)
    {
      n.propagate('start');
      nodeFather.propagate('resize');
    }
    return true;
  }

  this.destroyTree = destroyTree;
  function destroyTree(nodeID)
  {
    var node = getNode(nodeID);
    if (!node)
      return false;
    if (node.app != self)
      return node.app.destroyTree(node);
    var father = node.father;
    if (self.state == 5)
    {
      node.propagate('stop');
    }
    node.destroy(false);
    father.propagate('resize');
    return true;
  }

  this.emptyNode = emptyNode;
  function emptyNode(nodeID)
  {
    var node = getNode(nodeID);
    if (!node)
      return false;
    if (node.app != self)
      return node.app.emptyNode(node);
    for (var i in node.children)
    {
      if (node.children[i].supertype == "application")
      {
        WA.Managers.wa4gl.destroyApplication(node.children[i].applicationID, node.children[i].instanceID);
      }
      else
      {
        destroyTree(node.children[i]);
      }
    }
    return true;
  }









  this.cloneNode = cloneNode;
  function cloneNode(nodeID, newID)
  {
    var xid = WA.parseID(nodeID);
    if (xid[0])
    {
      var app = WA.Managers.wa4gl.getApplication(xid[0], xid[1]);
      return app.cloneNode(xid[2], newID);
    }
    if (self.uids[xid[2]])
    {
      return self.uids[xid[2]].clone(newID);
    }
    return null;
  }

  this.detachNode = detachNode;
  function detachNode(nodeID)
  {
    var xid = WA.parseID(nodeID);
    if (xid[0])
    {
      var app = WA.Managers.wa4gl.getApplication(xid[0], xid[1]);
      return app.detachNode(xid[2]);
    }
    if (self.uids[xid[2]])
    {
      // we detach the node from its father
// ********

      // we detach the node from the app
      var n = self.uids[xid[2]];
      delete self.uids[xid[2]];
      return n;
    }
    return null;
  }

  this.attachNode = attachNode;
  function attachNode(nodeID, node)  // nodeID is the new father, node is the detached node
  {
    var xid = WA.parseID(nodeID);
    if (xid[0])
    {
      var app = WA.Managers.wa4gl.getApplication(xid[0], xid[1]);
      return app.attachNode(xid[2], node);
    }
    // we attach the node to its new father
// ********
    // we attach the node to the app

    // we should call resize ?

    return node;
  }

  // ----------------------------------------------
  // DESTRUCTOR
  // ----------------------------------------------
  this.destroy = destroy;
  function destroy(fast)
  {
    WA.Managers.event.off('resize', window, onresize, false);
    WA.Managers.wa4gl._4glapplication.source.destroy.call(this, fast);
    self.timerlater = null;
    self.uids = null;
    self.params = null;
    self.app = null;
    self = null;
  }

  // ----------------------------------------------
  // CONSTRUCTOR
  // ----------------------------------------------
  switchMode(mode);
  WA.Managers.event.on('resize', window, onresize, false);
}

WA.extend(WA.Managers.wa4gl._4glapplication, WA.Managers.wa4gl._4glnode);


// ================================================================================================
// BASIC CONTAINER CLASS
// ================================================================================================
WA.Managers.wa4gl._container = function(nodeFather, domID, code, typeofnode, classes, listener)
{
  this.classes = WA.getClasses( code.attributes, classes );

  WA.Managers.wa4gl._container.sourceconstructor.call(this, nodeFather, domID, 'container', code, typeofnode, this.classes.classname, listener);

  this.zones = {};
  this.zonesorder = [];
}

WA.extend(WA.Managers.wa4gl._container, WA.Managers.wa4gl._4glnode);

// if haslistener attribute is set, this means the SERVER has a listener we have to call on every change
WA.Managers.wa4gl._container.prototype.responselistener = function(request)
{
  // the behaviour of response interpretation is unknown
}

WA.Managers.wa4gl._container.prototype.listener = function(order, params)
{
  if (!this.haslistener)
    return false;
  // send information to server based on mode
  var request = WA.Managers.ajax.createRequest(WA.Managers.wa4gl.url + WA.Managers.wa4gl.prelib + this._4glNode.application.applicationID + WA.Managers.wa4gl.premethod + this._4glNode.id + WA.Managers.wa4gl.preformat + WA.Managers.wa4gl.format, 'POST', 'Order='+order, this.responselistener, false);
  if (request)
  {
    for (var i in params)
    {
      if (params.hasOwnProperty(i))
        request.addParameter(i, params[i]);
    }
    request.send();
  }
  return true;
}

WA.Managers.wa4gl._container.prototype.show = function()
{
  if (this.visible)
    return false;
  if (!this.callEvent('preshow'))
    return false;
  this.domNode.style.display = '';
  this.visible = true;
  this.callEvent('postshow');
  this.father.propagate('resize');
  return true;
}

WA.Managers.wa4gl._container.prototype.hide = function()
{
  if (!this.visible)
    return false;
  if (!this.callEvent('prehide'))
    return false;
  this.visible = false;
  this.domNode.style.display = 'none';
  this.callEvent('posthide');
  this.father.propagate('resize');
  return true;
}

WA.Managers.wa4gl._container.prototype.setSize = function(w,h)
{
  if (!this.callEvent('presize'))
    return false;
  if (w !== null)
    this.code.attributes.width = w;
  if (h !== null)
    this.code.attributes.height = h;
  this.callEvent('postsize');
  this.father.propagate('resize');
  return true;
}

WA.Managers.wa4gl._container.prototype.setPosition = function(l,t)
{
  if (!this.callEvent('preposition'))
    return false;
  if (l !== null)
    this.code.attributes.left = l;
  if (t !== null)
    this.code.attributes.top = t;
  this.callEvent('postposition');
  this.father.propagate('resize');
  return true;
}

WA.Managers.wa4gl._container.prototype.resize = function()
{
  return WA.Managers.wa4gl._container.source.resize.call(this);
}

// This is a SYSTEM function, try to not use directly, use instead newZone
WA.Managers.wa4gl._container.prototype.createZone = function(domID, code, listener)
{
  // we let the extended class do anything, we do not know the behaviour of the zones
}

// This is a SYSTEM function, try to not use directly, use instead deleteZone
WA.Managers.wa4gl._container.prototype.destroyZone = function(id)
{
  // we let the extended class do anything, we do not know the behaviour of the zones
}


WA.Managers.wa4gl._container.prototype.newZone = function(id)
{
  // we let the extended class do anything, we do not know the behaviour of the zones
}

WA.Managers.wa4gl._container.prototype.showZone = function(id)
{
  // we let the extended class do anything, we do not know the behaviour of the zones
}

WA.Managers.wa4gl._container.prototype.hideZone = function(id)
{
  // we let the extended class do anything, we do not know the behaviour of the zones
}

WA.Managers.wa4gl._container.prototype.activateZone = function(id)
{
  // we let the extended class do anything, we do not know the behaviour of the zones
}

WA.Managers.wa4gl._container.prototype.openZone = function(id)
{
  // we let the extended class do anything, we do not know the behaviour of the zones
}

WA.Managers.wa4gl._container.prototype.closeZone = function(id)
{
  // we let the extended class do anything, we do not know the behaviour of the zones
}

WA.Managers.wa4gl._container.prototype.switchZone = function(id)
{
  // we let the extended class do anything, we do not know the behaviour of the zones
}

WA.Managers.wa4gl._container.prototype.deleteZone = function(id, _4gl)
{
  // we let the extended class do anything, we do not know the behaviour of the zones
}

WA.Managers.wa4gl._container.prototype.getValues = function()
{
  // we let the extended class do anything, we do not know the behaviour of the zones
  return null;
}

WA.Managers.wa4gl._container.prototype.setValues = function(values)
{
  // we let the extended class do anything, we do not know the behaviour of the zones
}

WA.Managers.wa4gl._container.prototype.destroy = function(fast)
{
  WA.Managers.wa4gl._container.source.destroy.call(this, fast);
  this.zones = null;
  this.zonesorder = null;
  this.classes = null;
}


// ================================================================================================
// BASIC ZONE CLASS
// ================================================================================================
WA.Managers.wa4gl._zone = function(nodeFather, domID, code, typeofnode, classes, listener)
{
  this.classes = WA.getClasses( code.attributes, classes );

  WA.Managers.wa4gl._zone.sourceconstructor.call(this, nodeFather, domID, 'zone', code, typeofnode, this.classes.classname, listener);

  // a zone should always be hidden by default, the main container will decide which one(s) will be visible
  // the 'display' parameter will be used by the container if used
  // this.visible = this.code.attributes.display?this.code.attributes.display!='none':true;
  this.visible = false;
  // hidden by default, the container will control this
  this.domNode.style.display = this.visible?'':'none';
}

WA.extend(WA.Managers.wa4gl._zone, WA.Managers.wa4gl._4glnode);

WA.Managers.wa4gl._zone.prototype.show = function()
{
  if (this.visible)
    return;
  this.visible = true;
  this.domNode.style.display = '';
  this.father.propagate('resize');
}

WA.Managers.wa4gl._zone.prototype.hide = function()
{
  if (!this.visible)
    return;
  this.visible = false;
  this.domNode.style.display = 'none';
  this.father.propagate('resize');
}

WA.Managers.wa4gl._zone.prototype.resize = function()
{
  return WA.Managers.wa4gl._zone.source.resize.call(this);
}

WA.Managers.wa4gl._zone.prototype.destroy = function(fast)
{
  WA.Managers.wa4gl._zone.source.destroy.call(this, fast);
  this.classes = null;
}


// ================================================================================================
// BASIC ELEMENT CLASS
// ================================================================================================
WA.Managers.wa4gl._element = function(nodeFather, domID, code, typeofnode, classes, listener)
{
  this.classes = WA.getClasses( code.attributes, classes );

  WA.Managers.wa4gl._element.sourceconstructor.call(this, nodeFather, domID, 'element', code, typeofnode, this.classes.classname, listener);

  this.visible = (code&&code.attributes&&code.attributes.display)?code.attributes.display!='none':true;

  if (code.attributes.style)
    WA.applyStyle(this.domNode, code.attributes.style);
  this.domNode.style.display = this.visible?'':'none';
}

WA.extend(WA.Managers.wa4gl._element, WA.Managers.wa4gl._4glnode);

WA.Managers.wa4gl._element.prototype.show = function()
{
  if (this.visible)
    return;
  if (!this.callEvent('preshow'))
    return;
  this.domNode.style.display = '';
  this.visible = true;
  this.callEvent('postshow');
  this.father.propagate('resize');
}

WA.Managers.wa4gl._element.prototype.hide = function()
{
  if (!this.visible)
    return;
  if (!this.callEvent('prehide'))
    return;
  this.visible = false;
  this.domNode.style.display = 'none';
  this.callEvent('posthide');
  this.father.propagate('resize');
}

WA.Managers.wa4gl._element.prototype.setSize = function(w,h)
{
  if (!this.callEvent('presize'))
    return;
  if (w !== null)
    this.code.attributes.width = w;
  if (h !== null)
    this.code.attributes.height = h;
  this.callEvent('postsize');
  this.father.propagate('resize');
}

WA.Managers.wa4gl._element.prototype.setPosition = function(l,t)
{
  if (!this.callEvent('preposition'))
    return;
  if (l !== null)
    this.code.attributes.left = l;
  if (t !== null)
    this.code.attributes.top = t;
  this.callEvent('postposition');
  this.father.propagate('resize');
}

WA.Managers.wa4gl._element.prototype.getValues = function()
{
  // we let the extended class do anything, we do not know the behaviour of the element
  return null;
}

WA.Managers.wa4gl._element.prototype.setValues = function(values)
{
  // we let the extended class do anything, we do not know the behaviour of the element
}

WA.Managers.wa4gl._element.prototype.resize = function()
{
  return WA.Managers.wa4gl._element.source.resize.call(this);
}

WA.Managers.wa4gl._element.prototype.destroy = function(fast)
{
  WA.Managers.wa4gl._element.source.destroy.call(this, fast);
  this.classes = null;
}



























































/*

WA.$C = WA.getiContainer = function(ID)
{
  if (arguments.length > 1)
  {
    var elements = [];
    for (var i = 0, l = arguments.length; i < l; i++)
      elements.push(WA.getiContainer(arguments[i]));
    return elements;
  }
  var node = WA.$N(ID);
  if (node)
    return node.icontainer;
  return null;
}

WA.$E = WA.getiElement = function(ID)
{
  if (arguments.length > 1)
  {
    var elements = [];
    for (var i = 0, l = arguments.length; i < l; i++)
      elements.push(WA.getiElement(arguments[i]));
    return elements;
  }
  var node = WA.$N(ID);
  if (node)
    return node.ielement;
  return null;
}

*/
