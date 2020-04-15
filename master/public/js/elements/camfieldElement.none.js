
/*
    camfieldElement.js, WAJAF, the WebAbility(r) Javascript Application Framework
    Contains element to control a flash webcam to take people pictures
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

function camfieldElement(domNodefather, domID, params, feedback, _4glNode)
{
  var self = this;
  this._4glNode = _4glNode;
  this.domNodefather = domNodefather;
  this.domID = domID;
  this.params = params;
  this.feedback = feedback;

  this.domNode = WA.toDOM(domID);
  if (!this.domNode)
  {
    this.domNode = document.createElement('div');
    this.domNode.id = domID;
    this.domNode.style.zIndex = WA.browser.getNextZIndex();
    domNodefather.appendChild(this.domNode);
  }


  this.start = start;
  function start()
  {
    // nothing to do really
  }

  this.resize = resize;
  function resize()
  {
    self._4glNode.elementResize(self.domNodefather, self.domNode, self.params.attributes.leftalign, self.params.attributes.left, self.params.attributes.topalign, self.params.attributes.top);
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

  this.stop = stop;
  function stop()
  {
    // nothing to do really
  }

  this.destroy = destroy;
  function destroy()
  {
    self.domNode = null;
    self.classname = null;
    self.feedback = feedback;
    self.params = params;
    self.domID = domID;
    self.domNodefather = domNodefather;
    self = null;
  }

  this.resize();
}

WA.Elements.camfieldElement = camfieldElement;
