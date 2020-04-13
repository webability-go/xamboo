
/*
    dockContainer.js, WAJAF, the WebAbility(r) Javascript Application Framework
    Contains container to control an icon menu bar fisheye like
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

function dockSlot(idslot, size, manager)
{
  // we use a trick for functions since 'this' is NOT including 'var' !
  var self = this;
  this.myManager = manager;
  this.idslot = idslot;
  this.slot = WA.toDOM(idslot);
  this.size = size;

  this.getID = getID;
  function getID()
  {
    return self.idslot;
  }

  this.getX0 = getX0;
  function getX0()
  {
    var x = parseInt(self.slot.style.left);
    var w = parseInt(self.slot.style.width) / 2;
    return x + w;
  }

  this.getY0 = getY0;
  function getY0()
  {
    var y = parseInt(self.slot.style.top);
    var h = parseInt(self.slot.style.height) / 2;
    return y + h;
  }

  this.getWidth = getWidth;
  function getWidth()
  {
    return self.size;
  }

  this.getHeight = getHeight;
  function getHeight()
  {
    return self.size;
  }

  this.setPositionSize = setPositionSize;
  function setPositionSize(x,y,w,h)
  {
    self.slot.style.top = y+'px';
    self.slot.style.left = x+'px';
    self.slot.style.width = w+'px';
    self.slot.style.height = h+'px';
  }

  // Constructor
  return this;
}

function dockContainer(domID, params, feedback, _4glNode)
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
  this.debug = false;
  this.slots = new Array();
  this.iddock = iddock;
  this.dock = WA.toDOM(iddock);
  this.status = false;
  this.position = 0;
  this.total = 0;
  this.velocity = 0;
  this.frame = 50;

  // **************************************************************************
  // PUBLIC METHODS
  // **************************************************************************

  this.registerSlot = registerSlot;
  function registerSlot(idslot, size)
  {
    var slot = new dockSlot(idslot, size, self);
    if (!slot)
      return null;
    self.slots[self.slots.length] = slot;
    return slot;
  }

  this.setParams = setParams;
  function setParams(orientation, base, radius, movearea, speed, loop)
  {
    self.orientation = orientation;
    self.base = base;
    self.radius = radius;
    self.movearea = movearea;
    self.speed = speed;
    self.loop = loop;
  }

  this._calculateImages = _calculateImages;
  function _calculateImages(xC, yC)
  {
    var position = self.position;
    var size = 0;
    for (var i=0, l=self.slots.length; i < l; i++)
    {
      s = self.slots[i];

      // calculate the x,y,magnify of the slot
//      x0 = s.getX0();
//      y0 = s.getY0();
//      d = Math.sqrt((x0-xC)*(x0-xC)+(y0-yC)*(y0-yC));
      var factor = 1;
/*
      if (d < self.radius)
        factor = (self.radius - d)/self.radius * 2;

      WA.toDOM('debug1').value += ' - ' + d;
      WA.toDOM('debug2').value += ' - ' + factor;
*/
      s.setPositionSize(position, self.base-s.getHeight()*factor/2, s.getWidth() * factor, s.getHeight() * factor);

      position += s.getWidth()*factor;
      size += s.getWidth()*factor;
    }
    self.total = size;

    // do we move ?
    wd = WA.browser.getNodeInnerWidth(self.dock);
    if (xC > 0 && xC < self.movearea)
    {
      self.velocity = Math.ceil(self.speed * ((self.movearea - xC) / self.movearea));
      if (!self.move)
        self.move = setTimeout(self.moveRight, self.frame);
    }
    else if (xC < wd && xC > wd - self.movearea)
    {
      self.velocity = Math.ceil(self.speed * ((self.movearea - wd + xC) / self.movearea));
;
      if (!self.move)
        self.move = setTimeout(self.moveLeft, self.frame);
    }
    else
    {
      if (self.move)
      {
        clearTimeout(self.move);
        self.move = null;
      }
      self.velocity = 0;
    }
  }

  this.moveRight = moveRight;
  function moveRight()
  {
    if (self.position + self.velocity > 0)
      return;
    self.position += self.velocity;
    for (var i=0, l=self.slots.length; i < l; i++)
    {
      s = self.slots[i];
      s.slot.style.left = (parseInt(s.slot.style.left) + self.velocity) + 'px';
    }
    self.move = setTimeout(self.moveRight, self.frame);
  }

  this.moveLeft = moveLeft;
  function moveLeft()
  {
    wd = parseInt(self.dock.style.width);
    if (self.position + self.total - self.velocity < wd)
    {
      self.velocity = 0;
      return;
    }
    self.position -= self.velocity;
    for (var i=0, l=self.slots.length; i < l; i++)
    {
      s = self.slots[i];
      s.slot.style.left = (parseInt(s.slot.style.left) - self.velocity) + 'px';
    }
    self.move = setTimeout(self.moveLeft, self.frame);
  }

  this.cmousemove = cmousemove;
  function cmousemove(e)
  {
    var x = 0;
    var y = 0;
    if (WA.browser.getCursorNode(e) != self.dock)
    {
      x = WA.browser.getCursorOffsetX(e) + parseInt(WA.browser.getCursorNode(e).style.left);
      y = WA.browser.getCursorOffsetY(e) + parseInt(WA.browser.getCursorNode(e).style.top);
    }
    else
    {
      x = WA.browser.getCursorOffsetX(e);
      y = WA.browser.getCursorOffsetY(e);
    }

    self.status = true;
    self._calculateImages(x, y);
  }

  this.cmouseout = cmouseout;
  function cmouseout(e)
  {
    if (WA.browser.getCursorNode(e) != self.dock)
      return;

    if (self.move)
    {
      clearTimeout(self.move);
      self.move = null;
    }
    self.velocity = 0;
    self.status = false;
  }

  this.start = start;
  function start()
  {
    // listener
    self.dock.onmousemove = cmousemove;
    self.dock.onmouseout = cmouseout;
    self._calculateImages(-1000, -1000);

  }

  this.stop = stop;
  function stop()
  {
    self.dock.mouseover = null;
    self.dock.mouseout = null;
  }

  return this;
}

WA.Containers.dockContainer = dockContainer;
