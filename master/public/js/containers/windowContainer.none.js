
/*
    windowContainer.js, WAJAF, the WebAbility(r) Javascript Application Framework
    Contains container to control windows zone
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

/* the window has the folowing properties:
   canclose = true/false
   canminimize = true/false
   canmaximize = true/false
   canresize = true/false
*/

/* fwindow = acronym for floating window, since window is reserved in js */
function fwindow(wContainer, fContainer, id, feedback)
{
  // we use a trick for functions since 'this' is NOT including 'var' !
  var self = this;
  this.uid = id;
  this.wContainer = wContainer;
  this.fContainer = fContainer;
  this.feedback = feedback;
  this.floating = null;

  this.isok = false;
  this.statusrs = false;
  this.systemleft = 0;
  this.systemtop = 0;
  this.systemwidth = 0;
  this.systemheight = 0;
  this.canresize = true;
  this.canminimize = true;
  this.canmaximize = true;
  this.canclose = true;

  this.statusdd = false;
  this.dragx = false;
  this.dragy = false;
  this.dragxinit = false;
  this.dragyinit = false;
  this.originleft = 0;
  this.origintop = 0;
  this.originwidth = 0;
  this.originheight = 0;
  this.origininnerwidth = 0;
  this.origininnerheight = 0;
  this.clickx = 0;
  this.clicky = 0;
  this.dragtype = '';

  this.dragcontainer = null;

  this.getID = getID;
  function getID()
  {
    return self.uid;
  }

  this.setURL = setURL;
  function setURL(innertype, url)
  {
    if (innertype == 1)
      WA.toDOM(self.uid+'_inner').src = url;
    else if (innertype == 2)
    {
      // call URL by ajax
      var a = new ajaxRequest(url, 'POST', null, self.ajaxCallBack, true, true);
    }
  }

  this.ajaxCallBack = ajaxCallBack;
  function ajaxCallBack(request)
  {
    WA.toDOM(self.uid+'_inner').innerHTML = request.responseText;
  }

  this.setTitle = setTitle;
  function setTitle(title)
  {
    WA.toDOM(self.uid+'_title').innerHTML = title;
  }

  this.startdragnw = startdragnw;
  function startdragnw(e)
  {
    self.dragtype = 'nw';
    self.dragx = true;
    self.dragy = true;
    self.dragxinit = true;
    self.dragyinit = true;
    startdrag(e);
  }

  this.startdragn = startdragn;
  function startdragn(e)
  {
    self.dragtype = 'n';
    self.dragx = false;
    self.dragy = true;
    self.dragxinit = false;
    self.dragyinit = true;
    startdrag(e);
  }

  this.startdragne = startdragne;
  function startdragne(e)
  {
    self.dragtype = 'ne';
    self.dragx = true;
    self.dragy = true;
    self.dragxinit = false;
    self.dragyinit = true;
    startdrag(e);
  }

  this.startdragw = startdragw;
  function startdragw(e)
  {
    self.dragtype = 'w';
    self.dragx = true;
    self.dragy = false;
    self.dragxinit = true;
    self.dragyinit = false;
    startdrag(e);
  }

  this.startdrage = startdrage;
  function startdrage(e)
  {
    self.dragtype = 'e';
    self.dragx = true;
    self.dragy = false;
    self.dragxinit = false;
    self.dragyinit = false;
    startdrag(e);
  }

  this.startdragsw = startdragsw;
  function startdragsw(e)
  {
    self.dragtype = 'sw';
    self.dragx = true;
    self.dragy = true;
    self.dragxinit = true;
    self.dragyinit = false;
    startdrag(e);
  }

  this.startdrags = startdrags;
  function startdrags(e)
  {
    self.dragtype = 's';
    self.dragx = false;
    self.dragy = true;
    self.dragxinit = false;
    self.dragyinit = false;
    startdrag(e);
  }

  this.startdragse = startdragse;
  function startdragse(e)
  {
    self.dragtype = 'se';
    self.dragx = true;
    self.dragy = true;
    self.dragxinit = false;
    self.dragyinit = false;
    startdrag(e);
  }

  this.startdrag = startdrag;
  function startdrag(e)
  {
    if (!self.isok)
      return false;

    self.focus(e);
    self.clickx = WA.browser.getCursorX(e);
    self.clicky = WA.browser.getCursorY(e);
    self.originleft = parseInt(WA.toDOM(self.uid).style.left, 10);
    self.origintop = parseInt(WA.toDOM(self.uid).style.top, 10);
    self.originwidth = parseInt(WA.toDOM(self.uid).style.width, 10);
    self.originheight = parseInt(WA.toDOM(self.uid).style.height, 10);
    self.origininnerheight = parseInt(WA.toDOM(self.uid+'_inner').style.height, 10);

    // we create a division to drag on top
    container = document.createElement('div');
    container.id = self.uid + '_drag';
    // take the size of the screen with a minimum size (NS calculates bad the real size for 2 pixels!)
    var w = WA.browser.getClientWidth() - (WA.browser.isNS()?4:0);
    var h = WA.browser.getClientHeight() - (WA.browser.isNS()?4:0);
    container.style.visibility = 'visible';
    container.style.position = 'absolute';
    container.style.width = w+'px';
    container.style.height = h+'px';
    container.style.left = '0px';
    container.style.top = '0px';
    container.style.border = '2px Solid #FF0000';
    container.style.backgroundColor = '#EEEE00';
    container.style.opacity = 0.2;
    container.style.filter = "alpha(opacity: 20)";
    container.style.cursor = WA.toDOM(self.uid+'_'+self.dragtype).style.cursor;
    container.style.overflow='hidden';
    container.style.zIndex = WA.browser.getNextZIndex();
    container.onmousemove = move;
    container.onmouseup = stopdrag;
    self.dragcontainer = container;
    document.body.appendChild(container);
    WA.toDOM(self.uid+'_drag').focus();

    self.statusdd = true;
    return true;
  }

  this.stopdrag = stopdrag;
  function stopdrag(e)
  {
    if (!self.isok)
      return null;

    // we destroy the drag division
    self.dragcontainer.onmousemove = null;
    self.dragcontainer.onmouseup = null;
    document.body.removeChild(WA.toDOM(self.uid+'_drag'));
    self.dragcontainer = null;

    self.statusdd = false;
    self.originleft = parseInt(WA.toDOM(self.uid).style.left, 10);
    self.origintop = parseInt(WA.toDOM(self.uid).style.top, 10);
    self.originwidth = parseInt(WA.toDOM(self.uid).style.width, 10);
    self.originheight = parseInt(WA.toDOM(self.uid).style.height, 10);
    self.origininnerheight = parseInt(WA.toDOM(self.uid+'_inner').style.height, 10);
    self.dragx = false;
    self.dragy = false;
    self.dragxinit = false;
    self.dragyinit = false;
    self.feedback(self);

    return false;
  }

  this.move = move;
  function move(e)
  {
    if (!self.isok)
      return false;
    if (self.statusdd)
    {
      if (self.dragx)
      {
        if (self.dragxinit)
          WA.toDOM(self.uid).style.width = self.originwidth-(WA.browser.getCursorX(e)-self.clickx)+'px';
        else
          WA.toDOM(self.uid).style.width = self.originwidth+(WA.browser.getCursorX(e)-self.clickx)+'px';
      }
      if (self.dragy)
      {
        if (self.dragyinit)
        {
          WA.toDOM(self.uid).style.height = self.originheight-(WA.browser.getCursorY(e)-self.clicky)+'px';
          // inner height must be modified, height=100% does not work !
          WA.toDOM(self.uid+'_inner').style.height = self.origininnerheight-(WA.browser.getCursorY(e)-self.clicky)+'px';
        }
        else
        {
          WA.toDOM(self.uid).style.height = self.originheight+(WA.browser.getCursorY(e)-self.clicky)+'px';
          // inner height must be modified, height=100% does not work !
          WA.toDOM(self.uid+'_inner').style.height = self.origininnerheight+(WA.browser.getCursorY(e)-self.clicky)+'px';
        }
      }
      if (self.dragxinit)
      {
        WA.toDOM(self.uid).style.left = self.originleft+(WA.browser.getCursorX(e)-self.clickx)+'px';
      }
      if (self.dragyinit)
      {
        WA.toDOM(self.uid).style.top = self.origintop+(WA.browser.getCursorY(e)-self.clicky)+'px';
      }
      return false;
    }
    return false;
  }

  this.restart = restart;
  function restart()
  {
    if (!self.isok)
      return false;
    WA.toDOM(self.uid).style.left = self.systemleft+'px';
    WA.toDOM(self.uid).style.top = self.systemtop+'px';
    self.originleft = parseInt(WA.toDOM(self.uid).style.left, 10);
    self.origintop = parseInt(WA.toDOM(self.uid).style.top, 10);
    self.feedback(self);
  }

  this.focus = focus;
  function focus(e)
  {
    if (!self.isok)
      return false;
    WA.toDOM(self.uid).style.zIndex = WA.browser.getNextZIndex();
  }

  this.setPosition = setPosition;
  function setPosition(left, top)
  {
    if (!self.isok)
      return false;
    WA.toDOM(self.uid).style.left = left+'px';
    WA.toDOM(self.uid).style.top = top+'px';
  }

  this.minimize = minimize;
  function minimize(e)
  {
    if (!self.isok)
      return false;

    // 1. add into the placeholder and ask size and position
    var newcoords = self.fContainer.reserveSlot(self.uid);

    // we save last coords
    self.lastleft = WA.toDOM(self.uid).style.left;
    self.lasttop = WA.toDOM(self.uid).style.top;
    self.lastwidth = WA.toDOM(self.uid).style.width;
    self.lastheight = WA.toDOM(self.uid).style.height;
    self.lastinnerheight = WA.toDOM(self.uid+'_inner').style.height;

    // 2. change the window to the new position
    WA.toDOM(self.uid).style.left = newcoords[0] + 'px';
    WA.toDOM(self.uid).style.top = newcoords[1] + 'px';
    WA.toDOM(self.uid).style.width = newcoords[2] + 'px';
    WA.toDOM(self.uid).style.height = newcoords[3] + 'px';
    WA.toDOM(self.uid+'_inner').style.height = '0px';
    WA.toDOM(self.uid+'_max').style.display = 'none';
    WA.toDOM(self.uid+'_restore').style.display = 'inline';
  }

  // maximize = take all the container, minus the 20 bottom pixels (bar of minimized and selector)
  this.maximize = maximize;
  function maximize(e)
  {
    if (!self.isok)
      return false;

    self.originheight = parseInt(WA.toDOM(self.uid).style.height, 10);
    self.origininnerheight = parseInt(WA.toDOM(self.uid+'_inner').style.height, 10);
    var delta = self.fContainer.getHeight() - self.originheight - 20;

    // we save last coords
    self.lastleft = WA.toDOM(self.uid).style.left;
    self.lasttop = WA.toDOM(self.uid).style.top;
    self.lastwidth = WA.toDOM(self.uid).style.width;
    self.lastheight = WA.toDOM(self.uid).style.height;
    self.lastinnerheight = WA.toDOM(self.uid+'_inner').style.height;

    WA.toDOM(self.uid).style.left = '0px';
    WA.toDOM(self.uid).style.top = '0px';
    WA.toDOM(self.uid).style.width = self.fContainer.getWidth()+'px';
    WA.toDOM(self.uid).style.height = (self.originheight + delta) + 'px';
    WA.toDOM(self.uid+'_inner').style.height = (self.origininnerheight + delta) + 'px';
    WA.toDOM(self.uid+'_max').style.display = 'none';
    WA.toDOM(self.uid+'_restore').style.display = 'inline';
  }

  // restore = put the window to last size/position
  this.restore = restore;
  function restore(e)
  {
    if (!self.isok)
      return false;

    WA.toDOM(self.uid).style.left = self.lastleft;
    WA.toDOM(self.uid).style.top = self.lasttop;
    WA.toDOM(self.uid).style.width = self.lastwidth;
    WA.toDOM(self.uid).style.height = self.lastheight;
    WA.toDOM(self.uid+'_inner').style.height = self.lastinnerheight;
    WA.toDOM(self.uid+'_max').style.display = 'inline';
    WA.toDOM(self.uid+'_restore').style.display = 'none';
  }

  this.registerSizeControls = registerSizeControls;
  function registerSizeControls()
  {
    if (!self.canresize)
      return;
    var dir = ['nw', 'n', 'ne', 'e', 'w', 'sw', 'se', 's'];
    for (i = 0, l = dir.length; i < l; i++)
    {
      var dd;
      dd = WA.toDOM(self.uid+'_'+dir[i]);
      if (dd)
      {
        dd.onmousemove = move;
        dd.onmousedown = eval('startdrag'+dir[i]);
        dd.onmouseup = stopdrag;
        dd.onmouseout = move;
      }
    }
  }

  this.registerButtons = registerButtons;
  function registerButtons()
  {
    if (self.canminimize)
    {
      dd = WA.toDOM(self.uid+'_min');
      if (dd)
      {
        dd.onclick = minimize;
      }
    }
    if (self.canmaximize)
    {
      dd = WA.toDOM(self.uid+'_max');
      if (dd)
      {
        dd.onclick = maximize;
      }
      dd = WA.toDOM(self.uid+'_restore');
      if (dd)
      {
        dd.onclick = restore;
      }
    }
    if (self.canclose)
    {
      dd = WA.toDOM(self.uid+'_close');
      if (dd)
      {
        dd.onclick = close;
      }
    }
  }

  this.unregisterSizeControls = unregisterSizeControls;
  function unregisterSizeControls()
  {
    if (!self.canresize)
      return;
    var dir = ['nw', 'n', 'ne', 'e', 'w', 'sw', 'se', 's'];
    for (i = 0, l = dir.length; i < l; i++)
    {
      var dd;
      dd = WA.toDOM(self.uid+'_'+dir[i]);
      if (dd)
      {
        dd.onmousemove = null;
        dd.onmousedown = null;
        dd.onmouseup = null;
        dd.onmouseout = null;
      }
    }
  }

  this.unregisterButtons = unregisterButtons;
  function unregisterButtons()
  {
    if (self.canminimize)
    {
      dd = WA.toDOM(self.uid+'_min');
      if (dd)
      {
        dd.onclick = null;
      }
    }
    if (self.canmaximize)
    {
      dd = WA.toDOM(self.uid+'_max');
      if (dd)
      {
         dd.onclick = null;
      }
    }
    if (self.canclose)
    {
      dd = WA.toDOM(self.uid+'_close');
      if (dd)
      {
        dd.onclick = null;
      }
    }
  }

  this.close = close;
  function close(e)
  {
    if (!self.isok)
      return false;

    self.wContainer.destroy(self.uid);
  }

  this.unload = unload;
  function unload()
  {
    // we shut-down the window
    self.isok = false;

    // we hide the window
    var wind = WA.toDOM(self.uid);
    wind.style.display='none';

    // we unlink all the listeners
    self.unregisterSizeControls();
    self.unregisterButtons();

    // we unlink from the floating container and (take back the window from container to the body parent)
    self.fContainer.unregister(self.uid);
    self.wContainer = null;
    self.fContainer = null;
    self.feedback = null;
    self.floating = null;

    // prevent memory leak
    self = null;
  }

  if (WA.toDOM(this.uid) == null)
    return false;

  this.systemleft = parseInt(WA.toDOM(this.uid).style.left, 10);
  this.systemtop = parseInt(WA.toDOM(this.uid).style.top, 10);
  this.systemwidth = parseInt(WA.toDOM(this.uid).style.width, 10);
  this.systemheight = parseInt(WA.toDOM(this.uid).style.height, 10);

  // register size controls
  registerSizeControls();

  // register 3 buttons
  registerButtons();

  // register floating container
  this.floating = fContainer.register(id,id+'_dd',feedback);

  // now the window is OK and working
  this.isok = true;

  return this;
}

/* Notes: */
/* The minimized windows are put on the bottom of the floating container */

function windowContainer(domNodeFather, domID, params, notify, _4glNode)
{
  var self = this;
  this.domID = domID;
  this._4glNode = _4glNode;
  this.params = params;
  this.feedback = feedback;

  // the zone is the domID itself. id is ignored. params may have 'classname'
  this.createZone = createZone;
  function createZone(id, params)
  {
    if (params['classname'])
      self.domNode.className = params['classname'];
    return self;
  }

  // nothing to start
  this.start = start;
  function start()
  {
  }

  // nothing explicit to resize
  this.resize = resize;
  function resize()
  {
  }

  // nothing to save
  this.getvalues = getvalues;
  function getvalues()
  {
    return null;
  }

  // nothing to load
  this.setvalues = setvalues;
  function setvalues(values)
  {
  }

  // nothing to stop
  this.stop = stop;
  function stop()
  {
  }

  this.destroy = destroy;
  function destroy()
  {
    this.domID = null;
    this._4glNode = null;
    this.params = null;
    this.feedback = null;
    this.domNode = null;
  }





  var self = this;
  this.fContainer = fContainer;    // floating container to attach this window container
  this.windows = new Array();
  this.widthminimized = 100;
  this.placeholder = new Array();  // if a window is minimized, takes a pointer into placeholder

  // ===========================================================
  // PRIVATE FUNCTIONS

  // register a window that can be dragged and droped, resized, closed, minimized etc
  // id is the id of the division
  // iddd is the id of the drag-drop zone (td, layer)
  this._register = _register;
  function _register(id, feedback)
  {
    var wind = new fwindow(self, self.fContainer, id, feedback);
    self.windows.push(wind);
    return wind;
  }

  this._unregister = _unregister;
  function _unregister(id)
  {
    var w = null;
    for (var i=0, l=self.windows.length; i < l; i++)
    {
      if (self.windows[i].getID() == id)
      {
        w = self.windows[i];
        break;
      }
    }
    if (w)
    {
      w.unload();
      self.windows.splice(i, 1);
    }
  }

  this._getNode = _getNode;
  function _getNode(node, id)
  {
    if (!node.hasChildNodes())
      return null;
    for (var i=0; i < node.childNodes.length; i++)
    {
      n = node.childNodes.item(i);
      if (n.getAttribute)
      {
        if (n.getAttribute("id") == id)
        {
          return n;
        }
      }
      if (n.hasChildNodes())
      {
        var ret = self._getNode(n, id);
        if (ret != null)
        {
          return ret;
        }
      }
    }
    return null;
  }

  // ===========================================================
  // PUBLIC FUNCTIONS

  this.create = create;
  function create(id, width, height, template, innertype, url, title, feedback)
  {
    // 1. we get the template
    var nodetemplate=document.getElementById(template);
    // 2. we duplicate template
    var win = nodetemplate.cloneNode(true);
    // 3. we change id's and register window in floating divisions
    win.setAttribute("id",id); // main id

    var dd = self._getNode(win, 'template_dd');
    if (!dd)
      return false;
    dd.setAttribute("id",id+'_dd'); // drad and drop bar

    // 4. We change other id's and register functions d&d, resize, open/close etc
    var dir = ['nw', 'n', 'ne', 'e', 'w', 'sw', 'se', 's', 'title', 'min', 'max', 'restore', 'close'];
    for (i = 0, l = dir.length; i < l; i++)
    {
      if (dd = self._getNode(win, 'template_'+dir[i]))
      {
        dd.setAttribute("id",id+'_'+dir[i]); // left up corner
      }
    }

    // 5. change style of window
    if (dd = self._getNode(win, 'template_inner'))
    {
      dd.setAttribute("id",id+'_inner'); // inner zone (generally to resize)
      var delta = height - parseInt(win.style.height, 10);
      dd.style.height = (parseInt(dd.style.height, 10) + delta) + 'px';
    }
    else
      alert('ERROR: There is no inner template !');

    win.style.width = width+'px';
    win.style.height = height+'px';
    win.style.left = '0px';
    win.style.top = '0px';

    // 6. append to document
    document.body.appendChild(win);

    // 7. create the window
    var wind = self._register(id, feedback);
    if (wind)
    {
      wind.setURL(innertype, url);
      wind.setTitle(title);

      // 8. and make ir visible !
      WA.toDOM(id).style.visibility = 'visible';
      WA.toDOM(id).style.display = 'inline';

      // 9. gain focus
      wind.focus(null);
    }

    return wind;
  }

  this.destroy = destroy;
  function destroy(id)
  {
    self._unregister(id);
    document.body.removeChild(WA.toDOM(id));
  }
}

// TODO:
// 2. minimize = put on the bottom
// 4. jail window if mode jail
// 5. save window position and size by id on ajax (feedback)
// 6. check autonumber windows , fixed id window, if can duplicate a window or just one of a type
//      (will focus it if only 1 instance of an id)
// 7. Remove combos on bottom windows, and an algorithm to know which windows are "top"

WA.Containers.windowContainer = windowContainer;
