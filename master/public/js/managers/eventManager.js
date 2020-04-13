
/*
    eventManager.js, WAJAF, the WebAbility(r) Javascript Application Framework
    Contains the Manager singleton to manage browser Events
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

WA.Managers.event = new function()
{
  // All the attributes are PRIVATE.
  var self = this;
  listenerid = 1;
  functionid = 1;
  events = {};
  beforeflushs = [];
  flushs = [];
  keys = [];
  this.keys = keys;
  specialkeys =
  {
    'esc': 27, 'escape': 27,
    'tab': 9, 'space': 32,
    'return': 13, 'enter': 13,
    'scrolllock': 145, 'capslock': 20, 'numlock': 144,
    'pause': 19, 'break': 19,
    'insert': 45, 'delete': 46, 'backspace': 8,
    'home': 36, 'end': 35, 'pageup': 33, 'pagedown': 34,
    'left': 37, 'up': 38, 'right': 39, 'down': 40,
    'f1': 112, 'f2': 113, 'f3': 114, 'f4': 115, 'f5': 116, 'f6': 117, 'f7': 118, 'f8': 119, 'f9': 120, 'f10': 121, 'f11': 122, 'f12': 123,
    '(shift)': 16, '(control)': 17, '(alt)': 18
    };

  // eventname: one of: mousedown, mouseup, click, dblclick, mousemove,
  // mouseover, mouseout, mousewheel,
  // keydown, keyup, keypress, load, unload, scroll,
  // focus, blur, change, submit, abort, error, reset, resize
  // eventnode: the id or the node itself
  // eventfunction: pointer to the function to execute when the event happens
  // eventcapture: true/false to notify if this event is greedy
  this.addListener = this.on = this.add = this.start = this.listen = this.attachEvent = this.registerEvent = addListener;
  function addListener(eventname, eventnode, eventfunction, eventcapture)
  {
    eventnode = WA.toDOM(eventnode);
    if (!eventnode) // no node found ?
      return false;
    WA.debug.log('eventManager.addListener('+eventname+', '+eventnode.id+')', 2);

    // link the UID to the node
    if (eventnode.listeneruid == undefined)
      eventnode.listeneruid = listenerid++;
    if (eventfunction.functionuid == undefined)
      eventfunction.functionuid = functionid++;

    if (events[eventnode.listeneruid] == undefined)
      events[eventnode.listeneruid] = {};
    if (events[eventnode.listeneruid][eventname] == undefined)
      events[eventnode.listeneruid][eventname] = {};

    // get the context from the ID of the node if any
    eventnode.context = WA.context;

    thefunction = function()
    {
      // support for 4GL
      if (WA.context != undefined)
      {
        var xid = oldcontext = null;
        if (this.id && this.id.indexOf('|') != -1)
        {
          xid = WA.parseID(this.id);
          oldcontext = WA.context = xid[0] + '|' + xid[1] + '|';
        }
      }
      var ret = eventfunction.apply(this, arguments);
      if (WA.context != undefined)
      {
        if (xid)
          WA.context = oldcontext;
      }
      return ret;
    }

    if (eventnode != window && eventname == 'load' && WA.browser.isMSIE) // special incompatible IE not firing onload event on images
    {
      thefunction = function(e)
      {
        if (this.readyState != 'complete' && this.readyState != 'loaded')
          return null;
        var xid = oldcontext = null;
        if (this.id && this.id.indexOf('|') != -1)
        {
          xid = WA.parseID(this.id);
          oldcontext = WA.context = xid[0] + '|' + xid[1] + '|';
        }
        var ret = eventfunction.apply(this, arguments);
        if (xid)
          WA.context = oldcontext;
        return ret;
      };
      eventnode.onreadystatechange = thefunction;
    }
    else if (eventnode.addEventListener)
    {
      if (eventname == 'mousewheel') // special incompatible mousewheel
        eventnode.addEventListener('DOMMouseScroll', thefunction, {passive:true});
      else
        eventnode.addEventListener(eventname, thefunction, eventcapture);
    }
    else if (eventnode.attachEvent)
    {
      eventnode.attachEvent('on' + eventname, thefunction);
    }
    else
    {
      eventnode['on' + eventname] = thefunction;
    }
    events[eventnode.listeneruid][eventname][eventfunction.functionuid] = [eventnode, thefunction, eventcapture];
    return true;
  }

  // must be the SAME PARAMETERS as addListener
  this.removeListener = this.off = this.remove = this.stop = this.detachEvent = removeListener;
  function removeListener(eventname, eventnode, eventfunction, eventcapture)
  {
    eventnode = WA.toDOM(eventnode);
    if (!eventnode) // no node found ?
      return;
    WA.debug.log('eventManager.removeListener('+eventname+', '+eventnode.id+')', 2);
    if (eventnode.listeneruid == undefined) // node not registered here
      return;
    if (eventfunction.functionuid == undefined) // function not registered here
      return;
    if (events[eventnode.listeneruid] == undefined) // already unregistered ?
      return;
    if (events[eventnode.listeneruid][eventname] == undefined) // already unregistered ?
      return;
    if (events[eventnode.listeneruid][eventname][eventfunction.functionuid] == undefined) // already unregistered ?
      return;

    if (eventname == 'load' && WA.browser.isMSIE) // special incompatible IE not firing onload event
    {
      eventnode.onreadystatechange = WA.nothing;
    }
    else if (eventnode.removeEventListener)
    {
      if (eventname == 'mousewheel')
      {
        eventnode.removeEventListener('DOMMouseScroll', events[eventnode.listeneruid][eventname][eventfunction.functionuid], {passive:true});
      }
      else
        eventnode.removeEventListener(eventname, events[eventnode.listeneruid][eventname][eventfunction.functionuid], eventcapture);
    }
    else if (eventnode.detachEvent)
    {
      eventnode.detachEvent('on' + eventname, events[eventnode.listeneruid][eventname][eventfunction.functionuid]);
    }
    else
    {
      eventnode['on' + eventname] = null;
    }
    delete events[eventnode.listeneruid][eventname][eventfunction.functionuid];
    // *********************************************
    // do we clean the 3 levels of the array ?
  }

  // key is 'modif[+modif]+key'
  // modif is 'shift', 'alt', 'control' or 'ctrl'
  // key is 0-9, a-z, !@#$%^&*()_-+=}{]["';?><,./`~
  // can be also: special keys, arrows, functions etc. see the array in the
  // function.

  this.addKey = this.key = addKey;
  function addKey(key, callback)
  {
    WA.debug.log('eventManager.addKey('+key+')', 2);
    var xkey = key.toLowerCase().split("+");
    for (var i = 0, l = xkey.length; i < l; i++)
    {
      if (xkey[i] == 'shift' || xkey[i] == 'control' || xkey[i] == 'ctrl' || xkey[i] == 'alt')
        continue;
      if (specialkeys[xkey[i]] != undefined)
        continue;
      // should be normal char, we take the 1rst one to be sure
      xkey[i] = xkey[i].charAt(0);
    }

    var data =
    {
      skey: key,
      key: xkey,
      callback: callback
    };
    keys.push(data);
  }

  this.removeKey = removeKey;
  function removeKey(key)
  {
    WA.debug.log('eventManager.removeKey('+key+')', 2);
    for (var i = 0, l=keys.length; i<l; i++)
      if (keys[i].skey == key)
        keys.splice(i, 1);
  }

  /* private method */
  function keycallbackdown(e)
  {
    keycallback(e,'down');
  }

  function keycallbackup(e)
  {
    keycallback(e,'up');
  }

  function keycallback(e,type)
  {
    var code = WA.browser.getKey(e);
    if (!code) // nothing to search
      return;
    var c = String.fromCharCode(code).toLowerCase();
    var shift = WA.browser.ifShift(e);
    var ctrl = WA.browser.ifCtrl(e);
    var alt = WA.browser.ifAlt(e);
    for ( var i = 0, l=keys.length; i < l; i++)
    {
      // check any keys combination if ok
      var isok = 0;
      for (var j = 0, m=keys[i]['key'].length; j < m; j++)
      {
        if (keys[i]['key'][j] == 'shift' && shift)
          isok++;
        else if (keys[i]['key'][j] == 'alt' && alt)
          isok++;
        else if (keys[i]['key'][j] == 'control' && ctrl)
          isok++;
        else if (specialkeys[keys[i]['key'][j]] == code)
          isok++;
        else if (keys[i]['key'][j] === c)
          isok++;
      }
      if (isok == keys[i]['key'].length)
      {
        keys[i]['callback'](e, keys[i]['skey'], type);
      }
    }
  }

  this.registerBeforeFlush = registerBeforeFlush;
  function registerBeforeFlush(functionflush)
  {
    beforeflushs.push(functionflush);
  }

  this.registerFlush = registerFlush;
  function registerFlush(functionflush)
  {
    flushs.push(functionflush);
  }

  this.unregisterBeforeFlush = unregisterBeforeFlush;
  function unregisterBeforeFlush(functionflush)
  {
    beforeflushs.remove(functionflush);
  }

  this.unregisterFlush = unregisterFlush;
  function unregisterFlush(functionflush)
  {
    flushs.remove(functionflush);
  }

  /* private method */
  function _beforeflush(e)
  {
    // then call all flush for other managers
    var result = '';
    for ( var i = 0, l = beforeflushs.length; i < l; i++)
    {
      result += beforeflushs[i](e);
    }
    if (result != '')
    {
      WA.browser.cancelEvent(e);   // for ie, ff, chrome, safari
      e.returnValue = result;      // for ie, ff
      return result;               // for ie
    }
  }

  function _flush(e)
  {
    // then call all flush for other managers
    for ( var i = 0, l = flushs.length; i < l; i++)
    {
      flushs[i](e);
      flushs[i] = null;
    }

    // no way to block unload on other browsers, se we destroy
    for (i in events)
    {
      for (j in events[i])
      {
        for (k in events[i][j])
        {
          if (events[i][j][k][0])
          {
            if (j == 'mousewheel')
            {
              events[i][j][k][0].removeEventListener('DOMMouseScroll', events[i][j][k][1], {passive:true});
            }
            else
              events[i][j][k][0].removeEventListener(j, events[i][j][k][1], events[i][j][k][2]);
          }
          else if (events[i][j][k][0].detachEvent)
          {
            events[i][j][k][0].detachEvent('on' + j, events[i][j][k][1]);
          }
          else
          {
            events[i][j][k][0]['on' + j] = null;
          }
        }
      }
    }

    // we stop listening unload and keypress
    delete events;
    delete beforeflushs;
    delete flushs;
    delete keys;
    self = null;
  }

  // we take control of unload. blocks unload only works on
  // IE, FF, CHROME and SAFARI with beforeunload / should check version of those
  this.addListener('beforeunload', window, _beforeflush, false);
  this.addListener('unload', window, _flush, false);
  // we listen the key binder
  this.addListener('keydown', document, keycallbackdown, false);
  this.addListener('keyup', document, keycallbackup, false);
}();


