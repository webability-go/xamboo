
/*
    floatingContainer.js, WAJAF, the WebAbility(r) Javascript Application Framework
    Contains container to control moveable zones
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

function floating(id, iddd, feedback, fC)
{
  // we use a trick for functions since 'this' is caller when it is called from events callbacks and not this real object !
  var self = this;
  this.uid = '';
  this.uiddd = '';
  this.isok = false;
  this.statusdd = false;
  this.systemleft = 0;
  this.systemtop = 0;
  this.originleft = 0;
  this.origintop = 0;
  this.clickx = 0;
  this.clicky = 0;
  this.feedback = feedback;
  this.dragcontainer = null;
  this.fC = fC;

  this.getID = getID;
  function getID()
  {
    return this.uid;
  }

  this.startdrag = startdrag;
  function startdrag(e)
  {
    if (!self.isok)
      return false;
    focus(e);
    self.statusdd = true;
    self.clickx = WA.browser.getCursorX(e);
    self.clicky = WA.browser.getCursorY(e);
    self.originleft = parseInt(WA.toDOM(self.uid).style.left);
    self.origintop = parseInt(WA.toDOM(self.uid).style.top);

    // we create a division to drag on top
    var container = document.createElement('div');
    container.id = self.uid + '_drag';
    // take the size of the screen with a minimum size (NS calculates bad the real size for 2 pixels!)
    container.style.visibility = 'visible';
    container.style.position = 'absolute';
    container.style.width = (self.fC.width - (WA.browser.isNS()?2:0))+'px';
    container.style.height = (self.fC.height - (WA.browser.isNS()?2:0))+'px';
    container.style.left = '0px';
    container.style.top = '0px';
    container.style.border = '2px Solid #FF0000';
    container.style.backgroundColor = '#EEEE00';
    container.style.opacity = 0.2;
    container.style.filter = "alpha(opacity: 20)";
    container.style.cursor = 'pointer';
    container.style.overflow='hidden';
    container.style.zIndex = WA.browser.getNextZIndex();
    container.onmousemove = move;
    container.onmouseup = stopdrag;
    self.dragcontainer = container;
    document.body.appendChild(container);
    WA.toDOM(self.uid+'_drag').focus();

    return true;
  }

  this.stopdrag = stopdrag;
  function stopdrag(e)
  {
    if (!self.isok)
      return false;

    // we destroy the drag division
    self.dragcontainer.onmousemove = null;
    self.dragcontainer.onmouseup = null;
    document.body.removeChild(WA.toDOM(self.uid+'_drag'));
    self.dragcontainer = null;

    self.originleft = parseInt(WA.toDOM(self.uid).style.left);
    self.origintop = parseInt(WA.toDOM(self.uid).style.top);
    self.statusdd = false;
    if (self.feedback)
      self.feedback(self);

    return true;
  }

  this.move = move;
  function move(e)
  {
    if (!self.isok)
      return false;
    if (self.statusdd)
    {
      WA.toDOM(self.uid).style.left = self.originleft+(WA.browser.getCursorX(e)-self.clickx)+'px';
      WA.toDOM(self.uid).style.top = self.origintop+(WA.browser.getCursorY(e)-self.clicky)+'px';
      return true;
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
    self.originleft = parseInt(WA.toDOM(self.uid).style.left);
    self.origintop = parseInt(WA.toDOM(self.uid).style.top);
    if (self.feedback)
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

  this.unload = unload;
  function unload()
  {
    // MAYBE WE CAN CALL THE FEEDBACK TO SAY WE ARE UNLOADING ? (to do)

    // desactive floating
    self.isok = false;

    // unregister anything of the floating
    var interfase = WA.toDOM(self.uiddd);
    if (typeof self.uiddd == 'object')
    {
      for (var i = 0, l = interfase.length; i < l; i++)
      {
        interfase[i].onmousemove = null;
        interfase[i].onmousedown = null;
        interfase[i].onmouseup = null;
        interfase[i].onmouseout = null;
      }
    }
    else
    {
      interfase.onmousemove = null;
      interfase.onmousedown = null;
      interfase.onmouseup = null;
      interfase.onmouseout = null;
    }
    WA.toDOM(self.uid).onmousedown = null;
    if (self.feedback)
      self.feedback = null;
    // remove memory leak
    self = null;
  }

  this.uid = id;
  this.uiddd = iddd;
  if (WA.toDOM(this.uid) == null || WA.toDOM(this.uiddd) == null)
  {
    alert('Could not find the element ' + this.uid + ' or ' + this.uiddd);
    return false;
  }

  this.systemleft = parseInt(WA.toDOM(this.uid).style.left);
  this.systemtop = parseInt(WA.toDOM(this.uid).style.top);

  var interfase = WA.toDOM(this.uiddd);
  if (typeof self.uiddd == 'object')
  {
    for (var i = 0, l = interfase.length; i < l; i++)
    {
      interfase[i].onmousemove = move;
      interfase[i].onmousedown = startdrag;
      interfase[i].onmouseup = stopdrag;
      interfase[i].onmouseout = move;
    }
  }
  else
  {
    interfase.onmousemove = move;
    interfase.onmousedown = startdrag;
    interfase.onmouseup = stopdrag;
    interfase.onmouseout = move;
  }
  WA.toDOM(this.uid).onmousedown = focus;

  this.isok = true;

  return this;
}

/* The floating Container is a division-nav-sized that lock windows in it with a overflow: hidden */
/* The floating Container have a list of windows accesible to switch windows  on the left */

function floatingContainer(domID, params, feedback, _4glNode)
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
  this.floatings = new Array();
  this.id = id;     // if desktop with id exists, take it and ignore mins, or create a window nav desktop
  this.mode = mode || ''; // mode = "jail" if the floatings cannot go outside, "hide" if can go outside without resize, and "resize" if can go outside and resize the desktop
  this.minwidth = minwidth;   // minimum size of desktop
  this.minheight = minheight; // minimum size of desktop
  this.width = 0;
  this.height = 0;
  this.container = null;
  this.selector = selector;       // true to use the control planel, false for no

  // ===========================================================
  // PRIVATE FUNCTIONS

  // ===========================================================
  // PUBLIC FUNCTIONS

  // register a division that can be dragged and droped
  // id is the id of the division
  // iddd is the id of the drag-drop zone (td, layer or full division maybe)
  this.register = register;
  function register(id, iddd, feedback)
  {
    var fnode = WA.toDOM(id);
    if (fnode == null || WA.toDOM(iddd) == null) // there is no floating to register !
      return null;

    var f = new floating(id, iddd, feedback, self);
    try
    {
      // we keep old father
      f.oldParent = fnode.parentNode;
      // we move to our new container
      self.container.appendChild(WA.toDOM(id));
      self.floatings.push(f);
    }
    catch (e)
    {
      f.unload();
      e.printStackTrace();
    }

    // We must put the floating as child of our container !
    return f;
  }

  this.unregister = unregister;
  function unregister(id)
  {
    var f = null;
    for (var i=0, l=self.floatings.length; i < l; i++)
    {
      if (self.floatings[i].getID() == id)
      {
        f = self.floatings[i];
        break;
      }
    }
    if (f)
    {
      f.unload();
      f.oldParent.appendChild(WA.toDOM(f.getID()));
      self.floatings.splice(i, 1);
    }
  }

  // Put each division on original place
  this.restart = restart;
  function restart()
  {
    for (var i=0, l=self.floatings.length; i < l; i++)
    {
      self.floatings[i].restart();
    }
  }

  // put division on a new position by program
  this.setPosition = setPosition;
  function setPosition(id, left, top)
  {
    for (var i=0, l=self.floatings.length; i < l; i++)
    {
      if (self.floatings[i].getID() == id)
      {
        self.floatings[i].setPosition(left, top);
      }
    }
  }

  this.getWidth = getWidth;
  function getWidth()
  {
    return self.width;
  }

  this.getHeight = getHeight;
  function getHeight()
  {
    return self.height;
  }

  this.selectormouseover = selectormouseover;
  function selectormouseover(id)
  {
    // we create the list of windows
    //  -> [ onclick item of window => window set focus, then close the list ]

    // we attach the list to the container

    // we listen the list: on mouse out ==> close it


  }

  // thsi function reserve a slot to be minimized, and send back the coords of the slot
  this.reserveSlot = reserveSlot;
  function reserveSlot(id)
  {
    return [30,200,80,20];
  }

  this.resize = resize;
  function resize()
  {
    var w = WA.browser.getClientWidth() - (WA.browser.isNS()?2:0);
    var h = WA.browser.getClientHeight() - (WA.browser.isNS()?2:0);
    w = max(w, minwidth);
    h = max(h, minheight);
    self.width = w;
    self.height = h;
    self.container.style.width = w+'px';
    self.container.style.height = h+'px';
  }

  // TEMPORAL
  this.show = show;
  function show(id)
  {
    for (var i=0, l=self.floatings.length; i < l; i++)
    {
      WA.toDOM(id).innerHTML += " "+self.floatings[i].getID();
    }
  }

  // search for id:
  var container = WA.toDOM(id);
  if (!container)
  {
    // create a full window container
    container = document.createElement("div");
    container.id = self.id;

    // take the size of the screen with a minimum size (NS calculates bad the real size for 2 pixels!)
    var w = WA.browser.getClientWidth() - (WA.browser.isNS()?2:0);
    var h = WA.browser.getClientHeight() - (WA.browser.isNS()?2:0);
    w = max(w, minwidth);
    h = max(h, minheight);
    self.width = w;
    self.height = h;

    container.style.visibility = 'hidden';
    container.style.position = 'absolute';
    container.style.width = w+'px';
    container.style.height = h+'px';
    container.style.left = '0px';
    container.style.top = '0px';
    container.style.border = '1px Solid #677788';
    if (this.mode == 'jail' || this.mode == 'hide')
      container.style.overflow='hidden';
    else
      container.style.overflow='scroll';

    document.body.appendChild(container);
    window.onresize = this.resize;
  }

  this.container = container;

  if (self.selector == true)
  {
    // create the left-bottom button and properties
    selector = document.createElement("div");
    selector.id = this.id+'_selector';
    selector.style.position = 'absolute';
    selector.style.width = '13px';
    selector.style.height = '13px';
    selector.style.left = '0px';
    selector.style.top = (h-15)+'px';
    selector.style.border='1px Solid black';
    selector.style.backgroundColor='#880000';
    selector.style.color='white';
    selector.style.visibility='visible';
    selector.style.display='inline';
    selector.style.overflow='hidden';
    selector.style.textAlign='center';
    selector.onmouseover = this.selectormouseover;
    container.appendChild(selector);
    WA.browser.setInnerHTML(selector, '<b>*</b>');
  }
}

// Needed aliases
WA.Containers.floatingContainer = floatingContainer;
