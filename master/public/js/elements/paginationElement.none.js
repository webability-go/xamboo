
/*
    paginationElement.js, WAJAF, the WebAbility(r) Javascript Application Framework
    Contains element to control a pagination of values
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

function paginationElement(domNodeFather, domID, params, notify, _4glNode)
{
  var self = this;
  this._4glNode = _4glNode;
  this.domNodeFather = domNodeFather;
  this.domID = domID;
  this.params = params;
  this.notify = notify;
  this.running = false;
  this.visible = true;

  this.classname = params.attributes.classname!==undefined?params.attributes.classname:'html';

  this.domNode = WA.createDomNode('div', domID, this.classname);
  if (params.attributes.display)
    this.domNode.style.display = params.attributes.display;
// HAY QUE EMPATAR EL DISPLAY CON EL VISIBLE !
  domNodeFather.appendChild(this.domNode);
  if (params.data)
    WA.browser.setInnerHTML(this.domNode, params.data);

  this.callNotify = callNotify;
  function callNotify(type, id)
  {
    var result = true;
    // no notifications if the app is not started
    if (self.notify && self.running)
      result = self.notify(type, self.domID, (id!=null?{id:id}:null));
    return result;
  }

  this.show = show;
  function show()
  {
    if (!self.callNotify('preshow', self.domID))
      return;
    self.domNode.style.display = '';
    self.visible = true;
    self.resize();
    self.callNotify('postshow', self.domID);
    // finaly ask for a general resize
    self.callNotify('resize', null);
  }

  this.hide = hide;
  function hide()
  {
    if (!self.callNotify('prehide', self.domID))
      return;
    self.visible = false;
    self.domNode.style.display = 'none';
    self.callNotify('posthide', self.domID);
  }

  this.setSize = setSize;
  function setSize(w,h)
  {
    if (w !== null)
      self.domNode.style.width = w + 'px';
    if (h !== null)
      self.domNode.style.height = h + 'px';
    self.resize();
    // finaly ask for a general resize
    self.callNotify('resize', null);
  }

  this.setPosition = setPosition;
  function setPosition(l,t)
  {
    if (l !== null)
      self.domNode.style.left = l + 'px';
    if (t !== null)
      self.domNode.style.top = t + 'px';
  }

  this.getvalues = getvalues;
  function getvalues()
  {
    return null;
  }

  this.setvalues = setvalues;
  function setvalues(values)
  {
  }

  this.start = start;
  function start()
  {
    self.running = true;
    self.resize();
  }

  this.resize = resize;
  function resize()
  {
    if (!self.running || !self.visible)
      return;
    self._4glNode.nodeResize(self.domNodeFather, self.domNode, self.params.attributes);
  }

  this.stop = stop;
  function stop()
  {
    self.running = false;
  }

  this.destroy = destroy;
  function destroy()
  {
    self.domNode = null;
    self.notify = notify;
    self.params = params;
    self.domNodeFather = domNodeFather;
    self = null;
  }
}

// Needed aliases
WA.Elements.paginationElement = paginationElement

