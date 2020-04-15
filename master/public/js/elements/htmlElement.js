
/*
    htmlElement.js, WAJAF, the WebAbility(r) Javascript Application Framework
    Contains a simple division that can contain hand written HTML code
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
   * left, top, right, bottom, width, height
   * display           default display: ''
   * style
   * classname         default class: html
*/

WA.Elements.htmlElement = function(fatherNode, domID, code, listener)
{
  WA.Elements.htmlElement.sourceconstructor.call(this, fatherNode, domID, code, 'div', { classname:'html' }, listener);

  if (this.code.data)
    this.domNode.innerHTML = this.code.data;
  this.addEvent('resize', this.resize);
}

// Add basic element code
WA.extend(WA.Elements.htmlElement, WA.Managers.wa4gl._element);
