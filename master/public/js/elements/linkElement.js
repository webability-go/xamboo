
/*
    linkElement.js, WAJAF, the WebAbility(r) Javascript Application Framework
    Contains element to control an HTML link element (<a>)
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

/* Known params.attributes of element:
   * type, id
   * left, top, anchorleft, anchortop, width, height
   * display           default display: ''
   * style
   * classname         default class: link
*/

WA.Elements.linkElement = function(fatherNode, domID, code, listener)
{
  var self = this;
  WA.Elements.linkElement.sourceconstructor.call(this, fatherNode, domID, code, 'a', { classname:'link' }, listener);

  if (this.code.data)
    WA.browser.setInnerHTML(this.domNode, this.code.data);

  this.addEvent('start', start);
  this.addEvent('stop', stop);

  // ========================================================================================
  // private functions

  function click(e)
  {
    self._callEvent('click', null);
  }

  // ========================================================================================
  // standard system functions

  function start()
  {
    WA.Managers.event.on('click', self.domNode, click, true);
  }

  function stop()
  {
    WA.Managers.event.off('click', self.domNode, click, true);
  }

  this.destroy = destroy;
  function destroy(fast)
  {
    WA.Elements.linkElement.source.destroy.call(self, fast);
    self = null;
  }
}

// Add basic element code
WA.extend(WA.Elements.linkElement, WA.Managers.wa4gl._element);
