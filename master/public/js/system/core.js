
/*
    core.js, WAJAF, the WebAbility(r) Javascript Application Framework
    Contains multi purpose functions, browser and WA objects
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

// WA is the main WAJAF Object that will contain anything else (except for the native JS object prototypes)
var WA = { version: '3.0.4',
           running: false };

WA.Function = {};
WA.Function.buildTransformer = function(prefct, postfct, scope)
{
  var self = this;
  if (!WA.isFunction(prefct) && !WA.isFunction(postfct))
    return this;
  return function()
    {
      var args = WA.isFunction(prefct)?prefct.apply(scope || self, arguments):arguments;
      var ret = self.apply(scope || self, args);
      return WA.isFunction(postfct)?postfct.apply(scope || self, [ret]):ret;
    }
}

// will call our fct before executing the main Function.
// fct accept the same parameters as main Function.
// if fct returns true, the main Function is executed, otherwise no.
WA.Function.buildFilter = function(fct, scope)
{
  var self = this;
  if (!WA.isFunction(fct))
    return this;
  return function()
    {
      return (fct.apply(scope || self, arguments) == true) ? self.apply(scope || self, arguments) : undefined;
    }
}

// Builds a callback function based on the main function scope with the specified parameters to be able to call it without parameters by another instance.
WA.Function.buildCompact = function(self)
{
  var args = Array.prototype.slice.call(arguments);
  args.shift();
  return function()
    {
      var arg2 = Array.prototype.slice.call(arguments);
      return self.apply(self, args.concat(arg2));
    }
}

WA.Function.delay = function(delay)
{
  var self = this;
  var args = [];
  for (var i = 1, l = arguments.length; i < l; args.push(arguments[i++]));
  var t = setTimeout(function() { return self.apply(self, args); }, delay);
  return t;
}

// String prototypes
WA.String = {};
WA.String.sprintf = function()
{
  var args = arguments[1];
  return arguments[0].replace(/\{([A-Za-z0-9\-_\.]+)\}/g, function(p0, p1){ return args[p1]; });
}

WA.String.escape = function(value)
{
  var newstr = (value != undefined && value != null) ? value : this;
  return newstr.replace(/("|'|\\)/g, "\\$1");
}

WA.String.padding = function(size, pad, value)
{
  if (!pad) pad = ' ';
  var newstr = new String((value != undefined && value != null) ? value : this);
  while (newstr.length < size)
  {
    newstr = pad + newstr;
  }
  return newstr;
}

WA.String.trim = function(value)
{
  var newstr = (value != undefined && value != null) ? value : this;
  return newstr.replace(/^(\s|&nbsp;)*|(\s|&nbsp;)*$/g, '');
};

// Array prototypes
WA.Array = {};
WA.Array.indexOf = function(val, field)
{
  for (var i = 0, l = this.length; i < l; i++)
  {
    if ((field && this[i][field] == val) || (!field && this[i] == val))
      return i;
  }
  return false;
}

WA.Array.remove = function(o, field)
{
  var index = this.indexOf(o, field);
  if(index != -1)
  {
    this.splice(index, 1);
  }
  return this;
}

// Date basic functions
WA.Date = {};
WA.Date.setNames = function(days, shortdays, months, shortmonths)
{
  WA.Date.days = days;
  WA.Date.shortdays = shortdays;
  WA.Date.months = months;
  WA.Date.shortmonths = shortmonths;
}

// english by default
WA.Date.setNames(
  ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
);

WA.Date.basicdays = [31,28,31,30,31,30,31,31,30,31,30,31];

WA.Date.isDate = function(year, month, day)
{
  var numdays = WA.Date.basicdays[month-1];
  return day>0 && !!numdays && (day<=numdays || day==29 && year%4==0 && (year%100!=0 || year%400==0) );
}

WA.Date.isTime = function(hour, min, sec)
{
  return hour>=0 && hour<=23 && min>=0 && min<=59 && sec>=0 && sec<=59;
}

WA.Date.isValid = function(year, month, day, hour, min, sec, ms)
{
  hour = hour || 0;
  min = min || 0;
  sec = sec || 0;
  ms = ms || 0;
  // no need to apply(this) for isDate and isTime, they are static funcions
  return WA.Date.isDate(year, month, day) && WA.Date.isTime(hour, min, sec) && ms >= 0 && ms <= 999;
}

WA.Date.isLeapYear = function(d)
{
  var year = d.getFullYear();
  return (year%4==0 && (year%100!=0 || year%400==0));
}

WA.Date.getOrdinalSuffix = function()
{
  switch (this.getDate())
  {
    case 1: case 21: case 31: return 'st';
    case 2: case 22:          return 'nd';
    case 3: case 23:          return 'rd';
    default:                  return 'th';
  }
}

WA.Date.getMaxMonthDays = function(d)
{
  var numdays = WA.Date.basicdays[d.getMonth()];
  if (numdays == 28 && WA.Date.isLeapYear(d))
  {
    numdays++;
  }
  return numdays;
}

WA.Date.getDayOfYear = function()
{
  var day = this.getDate();
  for (var i = 0; i <= this.getMonth()-1; i++)
    day += WA.Date.basicdays[i] + (i==1&&WA.Date.isLeapYear(this)?1:0);
  return day;
}

// adapted from http://www.merlyn.demon.co.uk/weekcalc.htm
WA.Date.getWeekOfYear = function()
{
  var ms1d = 86400000;
  var ms7d = 604800000;
  var DC3 = Date.UTC(this.getFullYear(), this.getMonth(), this.getDate() + 3) / ms1d;
  var AWN = Math.floor(DC3 / 7);
  var Wyr = (new Date(AWN * ms7d)).getUTCFullYear();
  return AWN - Math.floor(Date.UTC(Wyr, 0, 7) / ms7d) + 1;
}

WA.Date.getGMTOffset = function(colon)
{
  return (this.getTimezoneOffset() > 0 ? '-' : '+')
      + String.padding(2, '0', Math.floor(Math.abs(this.getTimezoneOffset()) / 60))
      + (colon ? ':' : '')
      + String.padding(2, '0', Math.abs(this.getTimezoneOffset() % 60));
}

// by extJS
WA.Date.getTimezone = function()
{
  return this.toString().replace(/^.* (?:\((.*)\)|([A-Z]{1,4})(?:[\-+][0-9]{4})?(?: -?\d+)?)$/, '$1$2').replace(/[^A-Z]/g, '');
}

// original idea of structure/pattern by extJS
WA.Date.grabformats = {
  j: "this.getDate()",                                           // day of the month, no leading 0
  d: "WA.String.padding(2, '0', this.getDate())",                // day of the month, leading 0, no need to call()
  D: "WA.Date.shortdays[this.getDay()]",                         // short name of day
  l: "WA.Date.days[this.getDay()]",                              // full name of day

  w: "this.getDay()",                                            // day of the week, 0 = sunday
  N: "(this.getDay()==0?7:this.getDay())",                       // ISO day of the week, 1 = monday
  S: "WA.Date.getOrdinalSuffix.call(this)",                      // english day of the week suffix

  z: "WA.Date.getDayOfYear.call(this)",                          // day of the year, 0 to 365

  W: "WA.String.padding(2, '0', WA.Date.getWeekOfYear.call(this))",  // ISO week of the year, leading 0, no need to call()

  n: "(this.getMonth() + 1)",                                    // number of month, 1 to 12, no leading 0
  m: "WA.String.padding(2, '0', this.getMonth() + 1)",           // number of month, 01 to 12, leading 0, no need to call()
  M: "WA.Date.shortmonths[this.getMonth()]",                     // short name of month
  F: "WA.Date.months[this.getMonth()]",                          // full name of month
  t: "WA.Date.getMaxMonthDays.call(this)",                       // number of days into the month

  L: "(WA.Date.isLeapYear(this) ? 1 : 0)",
  o: "(this.getFullYear() + (WA.Date.getWeekOfYear.call(this) == 1 && this.getMonth() > 0 ? +1 : (WA.Date.getWeekOfYear.call(this) >= 52 && this.getMonth() < 11 ? -1 : 0)))",
  Y: "this.getFullYear()",
  y: "('' + this.getFullYear()).substring(2, 4)",

  a: "(this.getHours() < 12 ? 'am' : 'pm')",
  A: "(this.getHours() < 12 ? 'AM' : 'PM')",
  g: "((this.getHours() % 12) ? this.getHours() % 12 : 12)",
  G: "this.getHours()",
  h: "WA.String.padding(2, '0', (this.getHours() % 12) ? this.getHours() % 12 : 12)",
  H: "WA.String.padding(2, '0', this.getHours())",

  i: "WA.String.padding(2, '0', this.getMinutes())",
  s: "WA.String.padding(2, '0', this.getSeconds())",
  u: "WA.String.padding(3, '0', this.getMilliseconds())",

  O: "WA.String.getGMTOffset.call(this)",
  P: "WA.String.getGMTOffset.call(this, true)",
  T: "WA.String.getTimezone.call(this)",
  Z: "(this.getTimezoneOffset() * -60)",
  c: "this.getUTCFullYear() + '-' + WA.String.padding(2, '0', this.getUTCMonth() + 1) + '-' + WA.String.padding(2, '0', this.getUTCDate()) + 'T' + "
        + "WA.String.padding(2, '0', this.getUTCHours()) + ':' + WA.String.padding(2, '0', this.getUTCMinutes()) + ':' + "
        + "WA.String.padding(2, '0', this.getUTCSeconds()) + WA.Date.getGMTOffset.call(this, true)",
  U: "Math.round(this.getTime() / 1000)"
};

WA.Date.format = function(d, str)
{
  var code = [];
  for (var i = 0, l = str.length; i < l; i++)
  {
    var c = str.charAt(i);
    if (c == '\\')
    {
      i++;
      // no need to call String.escape with an apply since we pass the caracter as parameter
      code.push("'" + WA.String.escape(str.charAt(i)) + "'");
    }
    else
    {
      WA.Date.grabformats[c]!=undefined?code.push(WA.Date.grabformats[c]):code.push("'" + WA.String.escape(c) + "'");
    }
  }

  var f = new Function('return ' + code.join('+') + ';');
  return f.call(d);
}

// Main WAJAF Object definition

WA.zIndex = 1;
WA.getNextZIndex = function()
{
  return WA.zIndex++;
}

WA.isDefined = function(val)
{
  return val !== undefined;
}

WA.isEmpty = function(val, blank)
{
  return val === undefined || val === null || ((WA.isArray(val) && !val.length)) || (!blank ? val === '' : false);
}

WA.isBool = function(val)
{
  return typeof val === 'boolean';
}

WA.isNumber = function(val)
{
  return typeof val === 'number' && isFinite(val);
}

WA.isString = function(val)
{
  return typeof val === 'string' || Object.prototype.toString.apply(val) === '[object String]';
}

WA.isArray = function(val)
{
  return Object.prototype.toString.apply(val) === '[object Array]';
}

WA.isObject = function(val)
{
  return typeof val == 'object';
}

WA.isFunction = function(val)
{
  return Object.prototype.toString.apply(val) === '[object Function]';
}

WA.isDate = function(val)
{
  return Object.prototype.toString.apply(val) === '[object Date]';
}

WA.isDOM = function(o)
{
  // be carefull: window is NOT a Node !
  return (o === window || (typeof Node === 'object' ? o instanceof Node : o !== null && typeof o === 'object' && typeof o.nodeType === 'number' && typeof o.nodeName === 'string' ));
}

WA.extend = function(collector, source)
{
  var f = function() {};
  f.prototype = source.prototype;
  collector.prototype = new f();
  collector.prototype.constructor = collector;
  collector.sourceconstructor = source;
  collector.source = source.prototype;
  return collector;
}

WA.clone = function(obj)
{
  // do better and faster pls
  return JSON.parse(JSON.stringify(obj));
  
  if (obj == undefined)
    return undefined;
  if (obj == null)
    return null;
  var cloned;
  if (WA.isArray(obj))
  {
    cloned = [];
    for (var i = 0, l = obj.length; i < l; i++)
    { 
      cloned.push(WA.clone(obj[i]));
    }
  }
  else if (WA.isObject(obj))
  {
    cloned = {};
    for (var i in obj)
    {
      if (!obj.hasOwnProperty(i))
        continue;
      if (WA.isObject(obj[i]))
        cloned[i] = WA.clone(obj[i]);
      else
        cloned[i] = obj[i];
    }
  }
  else
    cloned = obj;
  return cloned;
}

WA.sizeof = function(obj, strict)
{
  var c = 0;
  for (var i in obj)
    if (!WA.isFunction(obj[i]) && ((obj.hasOwnProperty(i) && strict) || !strict) ) c++;  // we count anything except functions
  return c;
}

// Will create a dom Node of specified type, and apply classname if defined
WA.createDomNode = function(type, id, classname)
{
  var domnode = document.createElement(type);
  if (id)
    domnode.id = id;
  if (classname !== null && classname != undefined)
    domnode.className = classname;
  return domnode;
}

WA.getDomNode = function(domID)
{
  if (arguments.length > 1)
  {
    var elements = [];
    for (var i = 0, l = arguments.length; i < l; i++)
      elements.push(WA.toDOM(arguments[i]));
    return elements;
  }
  if (WA.isString(domID))
    return document.getElementById(domID);
  return null;
}

WA.toDOM = function(n)
{
  if (WA.isDOM(n))
    return n;
  else if (WA.isString(n))
    return WA.getDomNode(n);
  return null;
}

WA.get = function(n)
{
  var self = this;
  var _nodes = [];
  // if multi is a string => search for NODE ID, or NODE CLASS or NODE ?
  if (WA.isString(n))
  {
    switch(n[0])
    {
      case '#': _nodes = [WA.getDomNode(n.substr(1))]; break;
      case '.':
        if (document.getElementsByClassName)
          _nodes = document.getElementsByClassName(n.substr(1));
        else
        {
          theclass = new RegExp('\\b'+n.substr(1)+'\\b');
          allnodes = this.getElementsByTagName('*');
          for (var i = 0, l = allnodes.length; i < l; i++)
            if (theclass.test(allnodes[i].className)) _nodes.push(allnodes[i]);
        }
        break;
      case '!': _nodes = Array.prototype.slice.call(document.getElementsByName(n.substr(1))); break;
      // anything else (start with a letter ?)
      default: _nodes = Array.prototype.slice.call(document.getElementsByTagName(n)); break;
    }
  }
  else if (WA.isDOM(n))
    _nodes = [n];

  // fast access to the first
  this.node = function () { return _nodes[0]; }

  // fast access to the nodes
  this.nodes = function() { return _nodes; }

  // content of the nodes
  this.text = function(t)
  {
    t = t.replace(/\&/g,"&amp;").replace(/\'/g,"&#39;").replace(/\"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    for (var i = 0, l = _nodes.length; i < l; i++) _nodes[i].innerHTML = t; return self;
  }
  this.html = function(t) { for (var i = 0, l = _nodes.length; i < l; i++) _nodes[i].innerHTML = t; return self; }
  this.append = function(t) { for (var i = 0, l = _nodes.length; i < l; i++) _nodes[i].innerHTML += t; return self; }

  // generic css
  this.css = function(p, v)
  {
    if (v === undefined)
      return _nodes[0]?_nodes[0].style[p]:undefined;
    for (var i = 0, l = _nodes.length; i < l; i++)
      _nodes[i].style[p] = v;
    return self;
  }

  // some most common CSS
  this.CSSwidth = function(v) { return self.css('width', v); }
  this.CSSheight = function(v) { return self.css('height', v); }
  this.CSSleft = function(v) { return self.css('left', v); }
  this.CSStop = function(v) { return self.css('top', v); }
  this.CSSmargin = function(v) { return self.css('margin', v); }
  this.CSSpadding = function(v) { return self.css('padding', v); }
  this.CSSborder = function(v) { return self.css('border', v); }
  this.CSScolor = function(v) { return self.css('color', v); }
  this.CSSbgcolor = function(v) { return self.css('backgroundColor', v); }
  this.CSSbg = function(v) { return self.css('background', v); }
  this.CSSfont = function(v) { return self.css('font', v); }
  this.CSSdisplay = function(v) { return self.css('display', v); }
  this.CSSopacity = function(v) { self.css('opacity', v/100); return self.css('filter', 'alpha(opacity: '+v+')'); }

  // some metrics
  this.width = function(v) { if (v === undefined) return _nodes[0]?WA.browser.getNodeWidth(_nodes[0]):null; else return self.css('width', WA.isNumber(v)?v+'px':v); }
  this.height = function(v) { if (v === undefined) return _nodes[0]?WA.browser.getNodeHeight(_nodes[0]):null; else return self.css('height', WA.isNumber(v)?v+'px':v); }
  this.left = function(v, n) { if (v === undefined) return _nodes[0]?(n===undefined?WA.browser.getNodeDocumentLeft(_nodes[0]):WA.browser.getNodeNodeLeft(_nodes[0], n)):null; else return self.css('left', WA.isNumber(v)?v+'px':v); }
  this.top = function(v, n) { if (v === undefined) return _nodes[0]?(n===undefined?WA.browser.getNodeDocumentTop(_nodes[0]):WA.browser.getNodeNodeTop(_nodes[0], n)):null; else return self.css('top', WA.isNumber(v)?v+'px':v); }

  // generic animation
  this.anim = function(s, f) { if (!WA.Managers.anim) return null; for (var i = 0, l = _nodes.length; i < l; i++) WA.Managers.anim.createSprite(_nodes[i], s, f); return self; }

  // some basic animations
  this.fadeIn = function(s, f) { if (!WA.Managers.anim) return null; for (var i = 0, l = _nodes.length; i < l; i++) WA.Managers.anim.fadeIn(_nodes[i], s, f); return self; }
  this.fadeOut = function(s, f) { if (!WA.Managers.anim) return null; for (var i = 0, l = _nodes.length; i < l; i++) WA.Managers.anim.fadeOut(_nodes[i], s, f); return self; }
  this.openV = function(s, f, h) { if (!WA.Managers.anim) return null; for (var i = 0, l = _nodes.length; i < l; i++) WA.Managers.anim.openV(_nodes[i], s, h, f); return self; }
  this.closeV = function(s, f, h) { if (!WA.Managers.anim) return null; for (var i = 0, l = _nodes.length; i < l; i++) WA.Managers.anim.closeV(_nodes[i], s, h, f); return self; }
  this.openH = function(s, f, w) { if (!WA.Managers.anim) return null; for (var i = 0, l = _nodes.length; i < l; i++) WA.Managers.anim.openH(_nodes[i], s, w, f); return self; }
  this.closeH = function(s, f, w) { if (!WA.Managers.anim) return null; for (var i = 0, l = _nodes.length; i < l; i++) WA.Managers.anim.closeH(_nodes[i], s, w, f); return self; }
  this.open = function(s, f, w, h) { if (!WA.Managers.anim) return null; for (var i = 0, l = _nodes.length; i < l; i++) WA.Managers.anim.open(_nodes[i], s, w, h, f); return self; }
  this.close = function(s, f, w, h) { if (!WA.Managers.anim) return null; for (var i = 0, l = _nodes.length; i < l; i++) WA.Managers.anim.close(_nodes[i], s, w, h, f); return self; }
  this.move = function(s, x, y, f, l, t) { if (!WA.Managers.anim) return null; for (var i = 0, lx = _nodes.length; i < lx; i++) WA.Managers.anim.move(_nodes[i], s, l, t, x, y, f); return self; }

  // generic mouse event binder
  this.on = function(e, f) { for (var i = 0, l = _nodes.length; i < l; i++) WA.Managers.event.on(e, _nodes[i], f, true); return self; }
  this.off = function(e, f) { for (var i = 0, l = _nodes.length; i < l; i++) WA.Managers.event.off(e, _nodes[i], f, true); return self; }

  // some most common events
  this.click = function(f) { return self.on('click', f); }
  this.dblclick = function(f) { return self.on('dblclick', f); }
  this.mouseover = function(f) { return self.on('mouseover', f); }
  this.mouseout = function(f) { return self.on('mouseout', f); }
  this.mousemove = function(f) { return self.on('mousemove', f); }
  this.mousedown = function(f) { return self.on('mousedown', f); }
  this.mouseup = function(f) { return self.on('mouseup', f); }
  this.keydown = function(f) { return self.on('keydown', f); }
  this.keyup = function(f) { return self.on('keyup', f); }

  return this;
}

WA.i18n = function() {}
WA.i18n.defaulti18n = {
  'json.error': 'The JSON code has been parsed with error, it cannot be built.\n',
  'json.unknown': 'The JSON core do not know what to do with this unknown type: '
};
WA.i18n.i18n = {};

WA.i18n.setEntry = function(id, message)
{
  WA.i18n.defaulti18n[id] = message;
}

WA.i18n.loadMessages = function(messages)
{
  for (var i in messages)
  {
    if (!WA.isString(messages[i]))     // we are only interested by strings
      continue;
    WA.i18n.i18n[i] = messages[i];
  }
}

WA.i18n.getMessage  = function(id)
{
  return WA.i18n.i18n[id] || WA.i18n.defaulti18n[id] || id;
}

// UTF-8 conversions, encoding
WA.UTF8 = function() {}

WA.UTF8.encode = function(value)
{
  if (WA.isObject(value))
  {
    var elements = {};
    for (var i in value)
    {
      if (!WA.isString(value[i]))   // we are only interested by strings
        continue;
      elements[i] = WA.UTF8.encode(value[i]);
    }
    return elements;
  }
  value = value.replace(/\r\n/g,'\n');
  var utf = '';
  for (var i = 0, l = value.length; i < l; i++)
  {
    var c = value.charCodeAt(i);
    if (c < 128)
    {
      utf += String.fromCharCode(c);
    }
    else if((c > 127) && (c < 2048))
    {
      utf += String.fromCharCode((c >> 6) | 192);
      utf += String.fromCharCode((c & 63) | 128);
    }
    else
    {
      utf += String.fromCharCode((c >> 12) | 224);
      utf += String.fromCharCode(((c >> 6) & 63) | 128);
      utf += String.fromCharCode((c & 63) | 128);
    }
  }
  return utf;
}

// public method for utf8 decoding
WA.UTF8.decode = function(value)
{
  var str = '';
  var i = 0;
  var c1 = c2 = c3 = 0;
  while ( i < value.length )
  {
    c1 = value.charCodeAt(i);
    if (c1 < 128)
    {
      str += String.fromCharCode(c1);
      i++;
    }
    else if((c1 > 191) && (c1 < 224))
    {
      c2 = value.charCodeAt(i+1);
      str += String.fromCharCode(((c1 & 31) << 6) | (c2 & 63));
      i += 2;
    }
    else
    {
      c2 = value.charCodeAt(i+1);
      c3 = value.charCodeAt(i+2);
      str += String.fromCharCode(((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
      i += 3;
    }
  }
  return str;
}

WA.Entities = function() {}

// In the same order of HTML4 official reference
WA.Entities.entities = {'&#160;' : '&nbsp;', '&#161;' : '&iexcl;', '&#162;' : '&cent;', '&#163;' : '&pound;',
                        '&#164;' : '&curren;', '&#165;' : '&yen;', '&#166;' : '&brvbar;', '&#167;' : '&sect;',
                        '&#168;' : '&uml;', '&#169;' : '&copy;', '&#170;' : '&ordf;', '&#171;' : '&laquo;',
                        '&#172;' : '&not;', '&#173;' : '&shy;', '&#174;' : '&reg;', '&#175;' : '&macr;',
                        '&#176;' : '&deg;', '&#177;' : '&plusmn;', '&#178;' : '&sup2;', '&#179;' : '&sup3;',

                        '&#180;' : '&acute;', '&#181;' : '&micro;', '&#182;' : '&para;', '&#183;' : '&middot;',
                        '&#184;' : '&cedil;', '&#185;' : '&sup1;', '&#186;' : '&ordm;', '&#187;' : '&raquo;',
                        '&#188;' : '&frac14;', '&#189;' : '&frac12;', '&#190;' : '&frac34;', '&#191;' : '&iquest;',
                        '&#192;' : '&Agrave;', '&#193;' : '&Aacute;', '&#194;' : '&Acirc;', '&#195;' : '&Atilde;',
                        '&#196;' : '&Auml;', '&#197;' : '&Aring;', '&#198;' : '&AElig;', '&#199;' : '&Ccedil;',
                        '&#200;' : '&Egrave;', '&#201;' : '&Eacute;', '&#202;' : '&Ecirc;', '&#203;' : '&Euml;',
                        '&#204;' : '&Igrave;', '&#205;' : '&Iacute;', '&#206;' : '&Icirc;', '&#207;' : '&Iuml;',
                        '&#208;' : '&ETH;', '&#209;' : '&Ntilde;', '&#210;' : '&Ograve;', '&#211;' : '&Oacute;',
                        '&#212;' : '&Ocirc;', '&#213;' : '&Otilde;', '&#214;' : '&Ouml;', '&#215;' : '&times;',
                        '&#216;' : '&Oslash;', '&#217;' : '&Ugrave;', '&#218;' : '&Uacute;', '&#219;' : '&Ucirc;',
                        '&#220;' : '&Uuml;', '&#221;' : '&Yacute;', '&#222;' : '&THORN;', '&#223;' : '&szlig;',

                        '&#224;' : '&agrave;', '&#225;' : '&aacute;', '&#226;' : '&acirc;', '&#227;' : '&atilde;',
                        '&#228;' : '&auml;', '&#229;' : '&aring;', '&#230;' : '&aelig;', '&#231;' : '&ccedil;',
                        '&#232;' : '&egrave;', '&#233;' : '&eacute;', '&#234;' : '&ecirc;', '&#235;' : '&euml;',
                        '&#236;' : '&igrave;', '&#237;' : '&iacute;', '&#238;' : '&icirc;', '&#239;' : '&iuml;',
                        '&#240;' : '&eth;', '&#241;' : '&ntilde;', '&#242;' : '&ograve;', '&#243;' : '&oacute;',
                        '&#244;' : '&ocirc;', '&#245;' : '&otilde;', '&#246;' : '&ouml;', '&#247;' : '&divide;',
                        '&#248;' : '&oslash;', '&#249;' : '&ugrave;', '&#250;' : '&uacute;', '&#251;' : '&ucirc;',
                        '&#252;' : '&uuml;', '&#253;' : '&yacute;', '&#254;' : '&thorn;', '&#255;' : '&yuml;',

                        '&#402;' : '&fnof;',

                        '&#913;' : '&Alpha;', '&#914;' : '&Beta;', '&#915;' : '&Gamma;', '&#916;' : '&Delta;',
                        '&#917;' : '&Epsilon;', '&#918;' : '&Zeta;', '&#919;' : '&Eta;', '&#920;' : '&Theta;',
                        '&#921;' : '&Iota;', '&#922;' : '&Kappa;', '&#923;' : '&Lambda;', '&#924;' : '&Mu;',
                        '&#925;' : '&Nu;', '&#926;' : '&Xi;', '&#927;' : '&Omicron;', '&#928;' : '&Pi;',
                        '&#929;' : '&Rho;', '&#931;' : '&Sigma;', '&#932;' : '&Tau;',
                        '&#933;' : '&Upsilon;', '&#934;' : '&Phi;', '&#935;' : '&Chi;', '&#936;' : '&Psi;',
                        '&#937;' : '&Omega;',

                        '&#945;' : '&alpha;', '&#946;' : '&beta;', '&#947;' : '&gamma;', '&#948;' : '&delta;',
                        '&#949;' : '&epsilon;', '&#950;' : '&zeta;', '&#951;' : '&eta;', '&#952;' : '&theta;',
                        '&#953;' : '&iota;', '&#954;' : '&kappa;', '&#955;' : '&lambda;', '&#956;' : '&mu;',
                        '&#957;' : '&nu;', '&#958;' : '&xi;', '&#959;' : '&omicron;', '&#960;' : '&pi;',
                        '&#961;' : '&rho;', '&#962;' : '&sigmaf;', '&#963;' : '&sigma;', '&#964;' : '&tau;',
                        '&#965;' : '&upsilon;', '&#966;' : '&phi;', '&#967;' : '&chi;', '&#968;' : '&psi;',
                        '&#969;' : '&omega;', '&#977;' : '&thetasym;', '&#978;' : '&upsih;', '&#982;' : '&piv;',

                        '&#8226;' : '&bull;', '&#8230;' : '&hellip;', '&#8242;' : '&prime;', '&#8243;' : '&Prime;',
                        '&#8254;' : '&oline;', '&#8260;' : '&frasl;', '&#8472;' : '&weierp;', '&#8465;' : '&image;',
                        '&#8476;' : '&real;', '&#8482;' : '&trade;', '&#8501;' : '&alefsym;',

                        '&#8592;' : '&larr;', '&#8593;' : '&uarr;', '&#8594;' : '&rarr;', '&#8595;' : '&darr;',
                        '&#8596;' : '&harr;', '&#8629;' : '&crarr;', '&#8656;' : '&lArr;', '&#8657;' : '&uArr;',
                        '&#8658;' : '&rArr;', '&#8659;' : '&dArr;', '&#8660;' : '&hArr;',

                        '&#8704;' : '&forall;', '&#8706;' : '&part;', '&#8707;' : '&exist;', '&#8709;' : '&empty;',
                        '&#8711;' : '&nabla;', '&#8712;' : '&isin;', '&#8713;' : '&notin;', '&#8715;' : '&ni;',
                        '&#8719;' : '&prod;', '&#8721;' : '&sum;', '&#8722;' : '&minus;', '&#8727;' : '&lowast;',
                        '&#8730;' : '&radic;', '&#8733;' : '&prop;', '&#8734;' : '&infin;', '&#8736;' : '&ang;',
                        '&#8743;' : '&and;', '&#8744;' : '&or;', '&#8745;' : '&cap;', '&#8746;' : '&cup;',
                        '&#8747;' : '&int;', '&#8756;' : '&there4;', '&#8764;' : '&sim;', '&#8773;' : '&cong;',
                        '&#8776;' : '&asymp;', '&#8800;' : '&ne;', '&#8801;' : '&equiv;', '&#8804;' : '&le;',
                        '&#8805;' : '&ge;', '&#8834;' : '&sub;', '&#8835;' : '&sup;', '&#8836;' : '&nsub;',
                        '&#8838;' : '&sube;', '&#8839;' : '&supe;', '&#8853;' : '&oplus;', '&#8855;' : '&otimes;',
                        '&#8869;' : '&perp;', '&#8901;' : '&sdot;',

                        '&#8968;' : '&lceil;', '&#8969;' : '&rceil;', '&#8970;' : '&lfloor;', '&#8971;' : '&rfloor;',
                        '&#9001;' : '&lang;', '&#9002;' : '&rang;', '&#9674;' : '&loz;', '&#9824;' : '&spades;',
                        '&#9827;' : '&clubs;', '&#9829;' : '&hearts;', '&#9830;' : '&diams;',

                        '&#34;' : '&quot;', '&#38;' : '&amp;', '&#60;' : '&lt;', '&#61;' : '&gt;',
                        '&#338;' : '&OElig;', '&#339;' : '&oelig;', '&#352;' : '&Scaron;', '&#353;' : '&scaron;',
                        '&#376;' : '&Yuml;', '&#710;' : '&circ;', '&#732;' : '&tilde;',

                        '&#8194;' : '&ensp;', '&#8195;' : '&emsp;', '&#8201;' : '&thinsp;', '&#8204;' : '&zwnj;',
                        '&#8205;' : '&zwj;', '&#8206;' : '&lrm;', '&#8207;' : '&rlm;', '&#8211;' : '&ndash;',
                        '&#8212;' : '&mdash;', '&#8216;' : '&lsquo;', '&#8217;' : '&rsquo;', '&#8218;' : '&sbquo;',
                        '&#8220;' : '&ldquo;', '&#8221;' : '&rdquo;', '&#8222;' : '&bdquo;', '&#8224;' : '&dagger;',
                        '&#8225;' : '&Dagger;', '&#8240;' : '&permil;', '&#8249;' : '&lsaquo;', '&#8250;' : '&rsaquo;',
                        '&#8364;' : '&euro;'
}

WA.Entities.rentities = null;

WA.Entities.encode = function(str, numeric)
{
  if (WA.isEmpty(str))
    return str;
  var enc = '', c = '';
  for (var i=0, l=str.length; i<l; i++)
  {
    c = str.charAt(i);
    if (c < ' ' || c > '~' || c == '"' || c == '&' || c == '<' || c == '>')
    {
      c = '&#' + c.charCodeAt() + ';';
      if (!numeric && WA.Entities.entities[c])
        c = WA.Entities.entities[c];
    }
    enc += c;
  }
  return enc;
}

WA.Entities.decode = function(str)
{
  if (WA.isEmpty(str))
    return str;

  ent = str.match(/&#[a-zA-Z0-9]{1,8};/g);
  if (ent == null)
    return str;

  // get the reverse array for fast access
  if (WA.Entities.rentities == null)
  {
    for (var i in WA.Entities.entities)
    {
      WA.Entities.rentities[WA.Entities.entities[i]] = i;
    }
  }

  for(var c='', n=0, i=0, l=ent.length; i<l; i++)
  {
    c = ent[i];
    // get the numeric entity
    if (WA.Entities.rentities[c])
      c = WA.Entities.rentities[c];
    if (c.substring(0,2) != '&#')
      continue;
    n = Math.parseInt(c.substring(2, c.length-1), 10);
    if(n >= -32768 && n <= 65535)
    {
      str = str.replace(c, String.fromCharCode(n));
    }
  }

  return str;
}

// DEBUG tool
// WA.debug is a singleton
// @message: string
// @level: integer
WA.debug = function() {}

WA.debug.console = null;
// level 1 is ALWAYS shown (error, break execution etc)
// max level to show: 1 = error, 2 = managers, 3 = wa4gl, 4 = user, by default: user
WA.debug.level = 4;

WA.debug.log = function(message, level)
{
  if (level != 1 && level < WA.debug.level)
    return;
  if (WA.debug.console && WA.debug.console.write)
    WA.debug.console.write(message+'<br />');
  else if (WA.debug.console)
    WA.debug.console.innerHTML += message+'<br />';
  else if (console && console.log)
    console.log(message);
  else if (window.console && window.console.firebug)
    window.console.log(message);
}

// json
WA.JSON = function() {}

WA.JSON.decode = function(json, execerror)
{
  var code = null;
  try
  {
    // 1. We parse the json code
    code = eval('(' + json + ')');
  }
  catch (e)
  {
    throw e;
  }
  if (code.debug)
  {
    WA.debug.log(code.system, 1);
    code = code.code;
  }
  if (execerror && code.error && !code.login)
  {
    WA.debug.log(code.messages, 1);
    code = null;
  }
  return code;
}

WA.JSON.encode = function(data)
{
  var json = '';
  if (WA.isArray(data))
  {
    json += '[';
    var item = 0;
    for (var i = 0, l = data.length; i < l; i++)
    {
      json += (item++?',':'') + WA.JSON.encode(data[i]);
    }
    json += ']';
  }
  else if (data === null)
  {
    json += 'null';
  }
  else if (!WA.isDefined(data))
  {
    json += 'undefined';
  }
  else if (WA.isNumber(data))
  {
    json += data;
  }
  else if (WA.isString(data))
  {
    json += '"' + (data.replace(/\\/g, "\\\\").replace(/"/g, "\\\"").replace(/\n/g, "\\n")) + '"';
  }
  else if (WA.isObject(data))
  {
    json += '{';
    var item=0;
    for (var i in data)
    {
      if (WA.isFunction(data[i]))   // we are not interested by functions
        continue;
      json += (item++?',':'')+'"'+i+'":'+WA.JSON.encode(data[i]);
    }
    json += '}';
  }
  else if (WA.isBool(data))
  {
    json += data?'true':'false';
  }
  else
  {
    if (WA.JSON.withalert)
      alert(WA.i18n.getMessage('json.unknown') + typeof data);
  }
  return json;
}

WA.browser = function()
{
  var agent = navigator.userAgent.toUpperCase();
  WA.browser.isCompat = (document.compatMode == 'CSS1Compat');
  WA.browser.isOpera = agent.indexOf('OPERA') > -1;
  WA.browser.isChrome = agent.indexOf('CHROME') > -1;
  WA.browser.isFirefox = agent.indexOf('FIREFOX') > -1;
  WA.browser.isFirebug = (WA.isDefined(window.console) && WA.isDefined(window.console.firebug));
  WA.browser.isSafari = !WA.browser.isChrome && agent.indexOf('SAFARI') > -1;
  WA.browser.isSafari2 = WA.browser.isSafari && agent.indexOf('APPLEWEBKIT/4') > -1;
  WA.browser.isSafari3 = WA.browser.isSafari && agent.indexOf('VERSION/3') > -1;
  WA.browser.isSafari4 = WA.browser.isSafari && agent.indexOf('VERSION/4') > -1;
  WA.browser.isMSIE = !WA.browser.isOpera && agent.indexOf('MSIE') > -1;
  WA.browser.isMSIE7 = WA.browser.isMSIE && agent.indexOf('MSIE 7') > -1;
  WA.browser.isMSIE8 = WA.browser.isMSIE && agent.indexOf('MSIE 8') > -1;
  WA.browser.isMSIE9 = WA.browser.isMSIE && agent.indexOf('MSIE 9') > -1;
  WA.browser.isMSIE6 = WA.browser.isMSIE && !WA.browser.isMSIE7 && !WA.browser.isMSIE8 && !WA.browser.isMSIE9;
  WA.browser.isWebKit = agent.indexOf('WEBKIT') > -1;
  WA.browser.isGecko = !WA.browser.isWebKit && agent.indexOf('GECKO') > -1;
  WA.browser.isGecko2 = WA.browser.isGecko && agent.indexOf('RV:1.8') > -1;
  WA.browser.isGecko3 = WA.browser.isGecko && agent.indexOf('RV:1.9') > -1;
  WA.browser.isLinux = agent.indexOf('LINUX') > -1;
  WA.browser.isWindows = !!agent.match(/WINDOWS|WIN32/);
  WA.browser.isMac = !!agent.match(/MACINTOSH|MAC OS X/);
  WA.browser.isAir = agent.indexOf('ADOBEAIR') > -1;
  WA.browser.isDom = document.getElementById && document.childNodes && document.createElement;
  WA.browser.isBoxModel = WA.browser.isMSIE && !WA.browser.isCompat;
  WA.browser.isSecure = (window.location.href.toUpperCase().indexOf('HTTPS') == 0);
  // DO WE NEED isFlash and isJava ?

  WA.browser.normalizedMouseButton = WA.browser.isMSIE ? {1:0, 2:2, 4:1} : (WA.browser.isSafari2 ? {1:0, 2:1, 3:2} : {0:0, 1:1, 2:2});

  // remove css image flicker
  if (WA.browser.isMSIE6)
    try { document.execCommand('BackgroundImageCache', false, true); } catch(e) {}
}

// ===================================
  // METRICS FUNCTIONS

  // get the size of the document. The document is the full usable html area
WA.browser.getDocumentWidth = function()
{
  if (WA.browser.isMSIE6)
    return document.body.scrollWidth;
  return document.documentElement.scrollWidth;
}

WA.browser.getDocumentHeight = function()
{
  if (WA.browser.isMSIE6)
    return document.body.scrollHeight;
  return document.documentElement.scrollHeight;
}

  // get the size of the window. The window is the browser visible area
WA.browser.getWindowWidth = function()
{
  if (!WA.browser.isMSIE)
    return window.innerWidth;

  if (document.documentElement && document.documentElement.clientWidth)
    return document.documentElement.clientWidth;

  if (document.body && document.body.clientWidth)
    return document.body.clientWidth;

  return 0;
}

WA.browser.getWindowHeight = function()
{
  if (!WA.browser.isMSIE)
    return window.innerHeight;

  if( document.documentElement && document.documentElement.clientHeight)
    return document.documentElement.clientHeight;

  if( document.body && document.body.clientHeight)
    return document.body.clientHeight;

  return 0;
}

  // get the size of the OS/screen
WA.browser.getScreenWidth = function()
{
  return screen.width;
}

WA.browser.getScreenHeight = function()
{
  return screen.height;
}

  // get the scroll of the window if the document is bigger than the window
WA.browser.getScrollLeft = function()
{
  if (WA.browser.isDom) // && (WA.browser.isMSIE7Sup || !WA.browser.isMSIE))
    return document.documentElement.scrollLeft;

  // ie6 and before
  if (document.body && document.body.scrollLeft)
    return document.body.scrollLeft;

  // others without dom
  if (typeof window.pageXOffset == 'number')
    return window.pageXOffset;

  return 0;
}

WA.browser.getScrollTop = function()
{
  // others without dom
  if (typeof window.pageYOffset == 'number')
    return window.pageYOffset;

  if (typeof window.scrollY == 'number')
    return window.scrollY;

  // should be supported by all browsers
  if (document.body && document.body.scrollTop)
    return document.body.scrollTop;
    
  // ie6 and before use BAD the documentelement on dom!
  if (WA.browser.isDom) // && (WA.browser.isMSIE7 || !WA.browser.isMSIE))
    return document.body.scrollTop;

  // ie6 and before


  return 0;
}

// get the maximum scroll available
WA.browser.getScrollWidth = function()
{
  return WA.browser.getDocumentWidth();
}

WA.browser.getScrollHeight = function()
{
  return WA.browser.getDocumentHeight();
}

  // get the left of a DOM element into the document
WA.browser.getNodeDocumentLeft = function(node)
{
  var l = node.offsetLeft;
  if (node.offsetParent != null)
    l += WA.browser.getNodeDocumentLeft(node.offsetParent) + WA.browser.getNodeBorderLeftWidth(node.offsetParent) + WA.browser.getNodeMarginLeftWidth(node.offsetParent);
  return l;
}

  // get the top of a DOM element into the document
WA.browser.getNodeDocumentTop = function(node)
{
  var t = node.offsetTop;
  if (node.offsetParent != null)
    t += WA.browser.getNodeDocumentTop(node.offsetParent) + WA.browser.getNodeBorderTopHeight(node.offsetParent) + WA.browser.getNodeMarginTopHeight(node.offsetParent);
  return t;
}

  // get the left of a DOM element into the referenced node. If referenced node is NOT into the fathers, then it will give the left in the document
WA.browser.getNodeNodeLeft = function(node, refnode)
{
  if (!node)
    return null;
  var l = node.offsetLeft;
  if (node.offsetParent != null && node.offsetParent != refnode)
    l += WA.browser.getNodeBorderLeftWidth(node.offsetParent) + WA.browser.getNodeNodeLeft(node.offsetParent, refnode);
  return l;
}

  // get the top of a DOM element into the referenced node. If referenced node is NOT into the fathers, then it will give the top in the document
WA.browser.getNodeNodeTop = function(node, refnode)
{
  if (!node)
    return null;
  var t = node.offsetTop;
  if (node.offsetParent != null && node.offsetParent != refnode)
    t += WA.browser.getNodeBorderTopHeight(node.offsetParent) + WA.browser.getNodeNodeTop(node.offsetParent, refnode);
  return t;
}

  // get the scroll of the node if the content is bigger than the node
WA.browser.getNodeScrollLeft = function(node)
{
  if (WA.browser.isDom) // && (WA.browser.isMSIE7 || !WA.browser.isMSIE))
    return node.scrollLeft;

  // others without dom
  if (typeof node.pageXOffset == 'number')
    return node.pageXOffset;

  return 0;
}

WA.browser.getNodeScrollTop = function(node)
{
  if (WA.browser.isDom) // && (WA.browser.isMSIE7 || !WA.browser.isMSIE))
    return node.scrollTop;

  // others without dom
  if (typeof node.pageYOffset == 'number')
    return node.pageYOffset;

  return 0;
}

WA.browser.getNodeTotalScrollTop = function(node)
{
  var t = WA.browser.getNodeScrollTop(node);
  if (node.offsetParent != null)
    t += WA.browser.getNodeTotalScrollTop(node.offsetParent);
  return t;
}

// get the maximum scroll available
WA.browser.getNodeScrollWidth = function(node)
{
  return WA.browser.getDocumentWidth();
}

WA.browser.getNodeScrollHeight = function(node)
{
  return WA.browser.getDocumentHeight();
}

/*
  About size and functions to get sizes:

     | margin | border | padding | content | padding | border | margin |
     |-------- extrawidth -------|- width -|
     |- externalwidth -|-------- innerwidth ---------|
              |----------------- offsetwidth -----------------|
     |--------------------------- outerwidth --------------------------|

  The external is the sum of left and right external
  The extra is the sum of left and right extra

  Same applies with height
*/

WA.browser.getNodeMarginLeftWidth = function(node)
{
  return WA.browser.isMSIE?parseInt(node.currentStyle.marginLeft, 10) || 0:parseInt(window.getComputedStyle(node, null).getPropertyValue('margin-left')) || 0;
}

WA.browser.getNodeMarginRightWidth = function(node)
{
  return WA.browser.isMSIE?parseInt(node.currentStyle.marginRight, 10) || 0:parseInt(window.getComputedStyle(node, null).getPropertyValue('margin-right')) || 0;
}

WA.browser.getNodeMarginWidth = function(node)
{
  return WA.browser.getNodeMarginLeftWidth(node) + WA.browser.getNodeMarginRightWidth(node);
}

WA.browser.getNodeMarginTopHeight = function(node)
{
  return WA.browser.isMSIE?parseInt(node.currentStyle.marginTop, 10) || 0:parseInt(window.getComputedStyle(node, null).getPropertyValue('margin-top')) || 0;
}

WA.browser.getNodeMarginBottomHeight = function(node)
{
  return WA.browser.isMSIE?parseInt(node.currentStyle.marginBottom, 10) || 0:parseInt(window.getComputedStyle(node, null).getPropertyValue('margin-bottom')) || 0;
}

WA.browser.getNodeMarginHeight = function(node)
{
  return WA.browser.getNodeMarginTopHeight(node) + WA.browser.getNodeMarginBottomHeight(node);
}

WA.browser.getNodeBorderLeftWidth = function(node)
{
  return WA.browser.isMSIE?parseInt(node.currentStyle.borderLeftWidth, 10) || 0:parseInt(window.getComputedStyle(node, null).getPropertyValue('border-left-width')) || 0;
}

WA.browser.getNodeBorderRightWidth = function(node)
{
  return WA.browser.isMSIE?parseInt(node.currentStyle.borderRightWidth, 10) || 0:parseInt(window.getComputedStyle(node, null).getPropertyValue('border-right-width')) || 0;
}

WA.browser.getNodeBorderWidth = function(node)
{
  return WA.browser.getNodeBorderLeftWidth(node) + WA.browser.getNodeBorderRightWidth(node);
}

WA.browser.getNodeBorderTopHeight = function(node)
{
  return WA.browser.isMSIE?parseInt(node.currentStyle.borderTopWidth, 10) || 0:parseInt(window.getComputedStyle(node, null).getPropertyValue('border-top-width')) || 0;
}

WA.browser.getNodeBorderBottomHeight = function(node)
{
  return WA.browser.isMSIE?parseInt(node.currentStyle.borderBottomWidth, 10) || 0:parseInt(window.getComputedStyle(node, null).getPropertyValue('border-bottom-width')) || 0;
}

WA.browser.getNodeBorderHeight = function(node)
{
  return WA.browser.getNodeBorderTopHeight(node) + WA.browser.getNodeBorderBottomHeight(node);
}

WA.browser.getNodePaddingLeftWidth = function(node)
{
  return WA.browser.isMSIE?parseInt(node.currentStyle.paddingLeft, 10) || 0:parseInt(window.getComputedStyle(node, null).getPropertyValue('padding-left')) || 0;
}

WA.browser.getNodePaddingRightWidth = function(node)
{
  return WA.browser.isMSIE?parseInt(node.currentStyle.paddingRight, 10) || 0:parseInt(window.getComputedStyle(node, null).getPropertyValue('padding-right')) || 0;
}

WA.browser.getNodePaddingWidth = function(node)
{
  return WA.browser.getNodePaddingLeftWidth(node) + WA.browser.getNodePaddingRightWidth(node);
}

WA.browser.getNodePaddingTopHeight = function(node)
{
  return WA.browser.isMSIE?parseInt(node.currentStyle.paddingTop, 10) || 0:parseInt(window.getComputedStyle(node, null).getPropertyValue('padding-top')) || 0;
}

WA.browser.getNodePaddingBottomHeight = function(node)
{
  return WA.browser.isMSIE?parseInt(node.currentStyle.paddingBottom, 10) || 0:parseInt(window.getComputedStyle(node, null).getPropertyValue('padding-bottom')) || 0;
}

WA.browser.getNodePaddingHeight = function(node)
{
  return WA.browser.getNodePaddingTopHeight(node) + WA.browser.getNodePaddingBottomHeight(node);
}

WA.browser.getNodeExternalLeftWidth = function(node)
{
  return WA.browser.getNodeMarginLeftWidth(node) + WA.browser.getNodeBorderLeftWidth(node);
}

WA.browser.getNodeExternalRightWidth = function(node)
{
  return WA.browser.getNodeMarginRightWidth(node) + WA.browser.getNodeBorderRightWidth(node);
}

WA.browser.getNodeExternalWidth = function(node)
{
  return WA.browser.getNodeExternalLeftWidth(node) + WA.browser.getNodeExternalRightWidth(node);
}

WA.browser.getNodeExternalTopHeight = function(node)
{
  return WA.browser.getNodeMarginTopHeight(node) + WA.browser.getNodeBorderTopHeight(node);
}

WA.browser.getNodeExternalBottomHeight = function(node)
{
  return WA.browser.getNodeMarginBottomHeight(node) + WA.browser.getNodeBorderBottomHeight(node);
}

WA.browser.getNodeExternalHeight = function(node)
{
  return WA.browser.getNodeExternalTopHeight(node) + WA.browser.getNodeExternalBottomHeight(node);
}

WA.browser.getNodeExtraLeftWidth = function(node)
{
  return WA.browser.getNodeMarginLeftWidth(node) + WA.browser.getNodeBorderLeftWidth(node) + WA.browser.getNodePaddingLeftWidth(node);
}

WA.browser.getNodeExtraRightWidth = function(node)
{
  return WA.browser.getNodeMarginRightWidth(node) + WA.browser.getNodeBorderRightWidth(node) + WA.browser.getNodePaddingRightWidth(node);
}

WA.browser.getNodeExtraWidth = function(node)
{
  return WA.browser.getNodeExtraLeftWidth(node) + WA.browser.getNodeExtraRightWidth(node);
}

WA.browser.getNodeExtraTopHeight = function(node)
{
  return WA.browser.getNodeMarginTopHeight(node) + WA.browser.getNodeBorderTopHeight(node) + WA.browser.getNodePaddingTopHeight(node);
}

WA.browser.getNodeExtraBottomHeight = function(node)
{
  return WA.browser.getNodeMarginBottomHeight(node) + WA.browser.getNodeBorderBottomHeight(node) + WA.browser.getNodePaddingBottomHeight(node);
}

WA.browser.getNodeExtraHeight = function(node)
{
  return WA.browser.getNodeExtraTopHeight(node) + WA.browser.getNodeExtraBottomHeight(node);
}

  // get the real size of a DOM element
WA.browser.getNodeWidth = function(node)
{
  return WA.browser.getNodeOffsetWidth(node) - WA.browser.getNodePaddingWidth(node) - WA.browser.getNodeBorderWidth(node);
}

WA.browser.getNodeHeight = function(node)
{
  return WA.browser.getNodeOffsetHeight(node) - WA.browser.getNodePaddingHeight(node) - WA.browser.getNodeBorderHeight(node);
}

WA.browser.getNodeInnerWidth = function(node)
{
  return WA.browser.getNodeOffsetWidth(node) - WA.browser.getNodeBorderWidth(node);
}

WA.browser.getNodeInnerHeight = function(node)
{
  return WA.browser.getNodeOffsetHeight(node) - WA.browser.getNodeBorderHeight(node);
}

WA.browser.getNodeOffsetWidth = function(node)
{
  return parseInt(node.offsetWidth, 10) || 0;
}

WA.browser.getNodeOffsetHeight = function(node)
{
  return parseInt(node.offsetHeight, 10) || 0;
}

WA.browser.getNodeOuterWidth = function(node)
{
  return WA.browser.getNodeOffsetWidth(node) + WA.browser.getNodeMarginWidth(node);
}

WA.browser.getNodeOuterHeight = function(node)
{
  return WA.browser.getNodeOffsetHeight(node) + WA.browser.getNodeMarginHeight(node);
}

// ===================================
// MOUSE FUNCTIONS

/*
  The mouse is not standard on all navigators.
  ie and safari does not map same clicks keys (left, center, right), we need corresponding table

  NOTE Than both mouse and keyboard events are mixed in the same event
*/

  // getCursorNode will return the DOM node in which the event happened
WA.browser.getCursorNode = function(e)
{
  var ev = e || window.event;
  if (ev.target) return ev.target;
  if (ev.srcElement) return ev.srcElement;
  return null;
}

  // returns the absolute position of the event in the document
WA.browser.getCursorDocumentX = function(e)
{
  var ev = e || window.event;
  return ev.pageX - (document.documentElement.clientLeft || 0);  // MSIE 7 has a weird 2 pixels offset for mouse coords !
}

  // returns the absolute position of the event in the document
WA.browser.getCursorDocumentY = function(e)
{
  var ev = e || window.event;
  return ev.pageY - (document.documentElement.clientTop || 0);  // MSIE 7 has a weird 2 pixels offset for mouse coords !
}

  // returns the absolute position of the event in the document
WA.browser.getTouchDocumentX = function(e)
{
  var ev = e || window.event;
  var touchobj = event.changedTouches[0];
  return touchobj.pageX;
}

  // returns the absolute position of the event in the document
WA.browser.getTouchDocumentY = function(e)
{
  var ev = e || window.event;
  var touchobj = event.changedTouches[0];
  return touchobj.pageY;
}

  // returns the absolute position of the event in the browserwindow
WA.browser.getCursorWindowX = function(e)
{
  var ev = e || window.event;
  return ev.clientX - (document.documentElement.clientLeft || 0);  // MSIE 7 has a weird 2 pixels offset for mouse coords !;
}

  // returns the absolute position of the event in the browserwindow
WA.browser.getCursorWindowY = function(e)
{
  var ev = e || window.event;
  return ev.clientY - (document.documentElement.clientLeft || 0);  // MSIE 7 has a weird 2 pixels offset for mouse coords !;
}

  // returns the absolute position of the event in the container based on the OFFSET metrix (i.e. with border included)
  // IF the function does not work on FIREFOX: DO NOT MODIFY the code,
  //     but add a position: relative to the container !
  // (note: FF and Safari, gets natural origin with border, IE and opera, without border :S)
WA.browser.getCursorOffsetX = function(e)
{
  var offset = 0;
  if (WA.browser.isMSIE || WA.browser.isOpera)
    offset = WA.browser.getNodeBorderLeftWidth(WA.browser.getCursorNode(e));

  var ev = e || window.event;
  if(typeof(ev.layerX) == 'number')
    return ev.layerX + offset;
  if(typeof(ev.offsetX) == 'number')
    return ev.offsetX + offset;
  return 0;
}

// returns the absolute position of the event in the container based on the OFFSET metrix (i.e. with border included)
// IF the function does not work on FIREFOX: DO NOT MODIFY the code,
//     but add a position: relative to the container !
WA.browser.getCursorOffsetY = function(e)
{
  var offset = 0;
  if (WA.browser.isMSIE || WA.browser.isOpera)
    offset = WA.browser.getNodeBorderTopHeight(WA.browser.getCursorNode(e));

  var ev = e || window.event;
  if(typeof(ev.layerY) == 'number')
    return ev.layerY + offset;
  if(typeof(ev.offsetY) == 'number')
    return ev.offsetY + offset;
  return 0;
}

// returns the absolute position of the event in the container based on the INNER metrix (i.e. without border included)
// IF the function does not work on FIREFOX: DO NOT MODIFY the code,
//     but add a position: relative to the container !
WA.browser.getCursorInnerX = function(e)
{
  var offset = 0;
  if (!WA.browser.isMSIE && !WA.browser.isOpera)
    offset = WA.browser.getNodeBorderLeftWidth(WA.browser.getCursorNode(e));

  var ev = e || window.event;
  if(typeof(ev.layerX) == 'number')
    return ev.layerX - offset;
  if(typeof(ev.offsetX) == 'number')
    return ev.offsetX - offset;
  return 0;
}

// returns the absolute position of the event in the container based on the INNER metrix (i.e. without border included)
// IF the function does not work on FIREFOX: DO NOT MODIFY the code,
//     but add a position: relative to the container !
WA.browser.getCursorInnerY = function(e)
{
  var offset = 0;
  if (!WA.browser.isMSIE && !WA.browser.isOpera)
    offset = WA.browser.getNodeBorderTopHeight(WA.browser.getCursorNode(e));

  var ev = e || window.event;
  if(typeof(ev.layerY) == 'number')
    return ev.layerY - offset;
  if(typeof(ev.offsetY) == 'number')
    return ev.offsetY - offset;
  return 0;
}

// click functions
WA.browser.getButtonClick = function(e)
{
  var ev = e || window.event;
  if (ev.type != 'click' && ev.type != 'dblclick')
    return false;
  var button = ev.button ? WA.browser.normalizedMouseButton[ev.button] : (ev.which ? ev.which-1 : 0);
  return button;
}

// click functions
WA.browser.getButtonPressed = function(e)
{
  var ev = e || window.event;
  if (ev.type != 'mousedown' && ev.type != 'mouseup')
    return false;
  var button = ev.button ? WA.browser.normalizedMouseButton[ev.button] : (ev.which ? ev.which-1 : false);
  return button;
}

WA.browser.getWheel = function(e)
{
  var ev = e || window.event;
  if (ev.type != 'DOMMouseScroll' && ev.type != 'mousewheel')
    return false;
  var delta = 0;
  if(ev.wheelDelta)
  {
    delta = ev.wheelDelta / 120;
  }
  else if (ev.detail)
  {
    delta = -ev.detail / 3;
  }
  return delta;
}

WA.browser.cancelEvent = function(e)
{
  var ev = e || window.event;
  if (!ev)
    return false;
  if (ev.stopPropagation)
    ev.stopPropagation();
  if (ev.preventDefault)
    ev.preventDefault();
  if (ev.stopEvent)
    ev.stopEvent();
  if (WA.browser.isMSIE) window.event.keyCode = 0;
  ev.cancel = true;
  ev.cancelBubble = true;
  ev.returnValue = false;
  return false;
}

// ===================================
// KEYBOARD FUNCTIONS

/*
  The keyboard is not standard on all navigators.
  known properties: shift, control, alt, keycode, charcode, navigation key
  navigation keys are: arrows, page up/down, insert, home, end, enter, tab escape

  NOTE Than both mouse and keyboard events are mixed in the same event
*/

// key functions
WA.browser.getKey = function(e)
{
  var ev = e || window.event;
  if (ev.type != 'keydown' && ev.type != 'keyup')
    return false;
  return ev.keyCode || ev.which;
}

WA.browser.getChar = function(e)
{
  var ev = e || window.event;
  if (ev.type != 'keypress')
    return false;
  return String.fromCharCode(ev.charCode ? ev.charCode : ev.keyCode);
}

WA.browser.ifShift = function(e)
{
  var ev = e || window.event;
  return ev.shiftKey;
}

WA.browser.ifCtrl = function(e)
{
  var ev = e || window.event;
  return ev.ctrlKey || ev.metaKey;
}

WA.browser.ifAlt = function(e)
{
  var ev = e || window.event;
  return ev.altKey;
}

  // any shift, control, alt
WA.browser.ifModifier = function(e)
{
  var ev = e || window.event;
  return (ev.altKey || ev.ctrlKey || ev.metaKey || ev.shiftKey) ? true : false;
}

  // any navigation keys: arrows, page up/down, home/end, escape, enter, tab
WA.browser.ifNavigation = function(e)
{
  var c = WA.browser.getKey(e);
  return ((c >= 33 && c <= 40) || c == 9 || c == 13 || c == 27) ? true : false;
}

  // f1 to f12
WA.browser.ifFunction = function(e)
{
  var c = WA.browser.getKey(e);
  return (c >= 112 && c <= 123) ? true : false;
}

// ===================================
// SELECTION FUNCTIONS

// select something in the document
WA.browser.getSelectionRange = function(node, selectionStart, selectionEnd)
{
  if (node.setSelectionRange)
  {
    node.focus();
    node.setSelectionRange(selectionStart, selectionEnd);
  }
  else if (node.createTextRange)
  {
    var range = node.createTextRange();
    range.collapse(true);
    range.moveEnd('character', selectionEnd);
    range.moveStart('character', selectionStart);
    range.select();
  }
}

// ===================================
// FILL FUNCTIONS

// fill an innerHTML
WA.browser.setInnerHTML = function(node, content)
{
  if (WA.browser.isGecko)
  {
    var rng = document.createRange();
    rng.setStartBefore(node);
    var htmlFrag = rng.createContextualFragment(content);
    while (node.hasChildNodes())
      node.removeChild(node.lastChild);
    node.appendChild(htmlFrag);
  }
  else
  {
    node.innerHTML = content;
  }
}

WA.render = function()
{}

WA.render.Integer = function(data, sep)
{
  if (!sep)
    return data;
  // we change the cast
  data = '' + data;
	var rgx = /(\d+)(\d{3})/;
	while (rgx.test(data))
	{
		data = data.replace(rgx, '$1' + sep + '$2');
	}
	return data;
}

WA.render.Fixed = function(data, fix, dec, sep)
{
  if (!WA.isNumber(fix)) fix=2;
  if (!dec) dex='.';
  if (!sep) sep = ',';
  data = data.toFixed(fix);
	data += '';
	x = data.split('.');
	x1 = x[0];
	x2 = x.length > 1 ? dec + x[1] : '';
	var rgx = /(\d+)(\d{3})/;
	while (rgx.test(x1))
	{
		x1 = x1.replace(rgx, '$1' + sep + '$2');
	}
	return x1 + x2;
}

WA.render.Money = function(data, symbol, fix, dec, sep)
{
  return symbol + WA.render.Fixed(data, fix, dec, sep);
}

WA.Managers = {};

// color transfer, function to instanciate
WA.RGB = function(color)
{
  var self = this; // for inner functions
  this.ok = false;

  if (color.charAt(0) == '#')
    color = color.substr(1,6);
  color = color.replace(/ /,'').toLowerCase();

  var htmlcolors =
  {
    black: '000000',
    silver: 'c0c0c0',
    gray: '808080',
    white: 'ffffff',
    maroon: '800000',
    red: 'ff0000',
    purple: '800080',
    fuchsia: 'ff00ff',
    green: '008000',
    lime: '00ff00',
    olive: '808000',
    yellow: 'ffff00',
    navy: '000080',
    blue: '0000ff',
    teal: '008080',
    aqua: '00ffff'
  };

  for (var name in htmlcolors)
  {
    if (WA.isString(htmlcolors[name]) && color == name)   // we are only interested by strings
    {
      this.name = color;
      color = htmlcolors[name];
    }
  }

  var rgb = /^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/.exec(color);
  if (rgb)
  {
    this.red = parseInt(rgb[1], 10);
    this.green = parseInt(rgb[2], 10);
    this.blue = parseInt(rgb[3], 10);
    this.ok = true;
  }
  else
  {
    rgb = /^(\w{2})(\w{2})(\w{2})$/.exec(color);
    if (rgb)
    {
      this.red = parseInt(rgb[1], 16);
      this.green = parseInt(rgb[2], 16);
      this.blue = parseInt(rgb[3], 16);
      this.ok = true;
    }
    else
    {
      rgb = /^(\w{1})(\w{1})(\w{1})$/.exec(color);
      if (rgb)
      {
        this.red = parseInt(rgb[1]+rgb[1], 16);
        this.green = parseInt(rgb[2]+rgb[2], 16);
        this.blue = parseInt(rgb[3]+rgb[3], 16);
        this.ok = true;
      }
    }
  }
  this.red = (this.red < 0 || isNaN(this.red)) ? 0 : ((this.red > 255) ? 255 : this.red);
  this.green = (this.green < 0 || isNaN(this.green)) ? 0 : ((this.green > 255) ? 255 : this.green);
  this.blue = (this.blue < 0 || isNaN(this.blue)) ? 0 : ((this.blue > 255) ? 255 : this.blue);

  this.toRGB = toRGB;
  function toRGB()
  {
    return 'rgb(' + self.red + ', ' + self.green + ', ' + self.blue + ')';
  }

  this.toHex = toHex;
  function toHex()
  {
    var red = self.red.toString(16);
    var green = self.green.toString(16);
    var blue = self.blue.toString(16);
    if (red.length == 1) red = '0' + red;
    if (green.length == 1) green = '0' + green;
    if (blue.length == 1) blue = '0' + blue;
    return '#' + red + green + blue;
  }
}

WA.start = function()
{
  WA.browser();
  WA.running = true;
}

WA.start();

// empty function for listeners assignement (IE bug mainly that does not accept null)
WA.nothing = function() {};
