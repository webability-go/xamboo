
/*
    drawManager.js, WAJAF, the WebAbility(r) Javascript Application Framework
    Contains the Manager singleton to draw lines
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

WA.Managers.draw = new function()
{
  var self = this;
  this.drawings = {};

  this.line = line;
  function line(id, xstart, ystart, xend, yend, color, container)
  {
    var l = new _line(id, xstart, ystart, xend, yend, color, container);
    l.show();
    self.drawings[id] = l;
    return l;
  }

  this.erase = erase;
  function erase(id)
  {
    if (self.drawings[id])
    {
      self.drawings[id].destroy();
      delete self.drawings[id];
    }
  }

  function destroy()
  {
    for (var id in self.drawings)
      self.drawings[id].destroy();
    self.drawings = null;
    self = null;
  }

  WA.Managers.event.registerFlush(destroy);
}();

WA.Managers.draw.line = function(id, xstart, ystart, xend, yend, color, container)
{
  var self = this;
  this.id = id;
  this.xstart = xstart;
  this.ystart = ystart;
  this.xend = xend;
  this.yend = yend;
  this.color = color;
  if (WA.isString(container))
    container = $(container);
  if (!container)
    container = document.body;
  this.container = container;

  created = false;
  this.mainNode = null;
  nodes = [];

  function sign(x)
  {
    if (x<0)
      return -1;
    if (x>0)
      return 1;
    return 0;
  }

  function calculate()
  {
    self.mainNode = WA.createDomNode('div', self.id, '');
    self.mainNode.style.display = 'none';
    self.container.appendChild(self.mainNode);

    var dx = Math.abs(self.xend - self.xstart);
    var dy = Math.abs(self.yend - self.ystart);
    var sx = sign(self.xend - self.xstart);
    var sy = sign(self.yend - self.ystart);
    var lastx = 0, lasty = 0, l = 0, n = null;
    if (dx >= dy)
    {
      var lx = (dx+1) / (dy+1);
      for (var y = 0; y <= dy;  y++)
      {
        n = WA.createDomNode('div', null, null);
        n.style.position = 'absolute';
        n.style.backgroundColor = self.color;

        l = (Math.round(lx*(y+1)) - Math.round(lx*y));
        n.style.left = Math.round(self.xstart+sx*lx*y-(sx<0?l-1:0))+'px';
        n.style.top = (self.ystart+sy*y)+'px';
        n.style.width = l+'px';
        n.style.height = '1px';

        self.mainNode.appendChild(n);
        nodes.push(n);
        lastx = lastx + lx;
      }
    }
    else
    {
      var ly = (dy+1) / (dx+1);
      for (var x = 0; x <= dx;  x++)
      {
        n = WA.createDomNode('div', null, null);
        n.style.position = 'absolute';
        n.style.backgroundColor = self.color;

        l = (Math.round(ly*(x+1)) - Math.round(ly*x));
        n.style.left = (self.xstart+sx*x)+'px';
        n.style.top = Math.round(self.ystart+sy*ly*x-(sy<0?l-1:0))+'px';
        n.style.width = '1px';
        n.style.height = l+'px';

        self.mainNode.appendChild(n);
        nodes.push(n);
        lasty = lasty + ly;
      }
    }
    created = true;
  }

  this.show = show;
  function show()
  {
    if (!created)
      calculate();
    this.mainNode.style.display = '';
  }

  this.hide = hide;
  function hide()
  {
    if (!created)
      calculate();
    this.mainNode.style.display = 'none';
  }

  this.destroy = destroy;
  function destroy()
  {
    if (created)
      self.container.removeChild(self.mainNode);
    nodes = null;
    self.mainNode = null;
    self.container = null;
    self = null;
  }

}
