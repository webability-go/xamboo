
/*
    textElement.js, WAJAF, the WebAbility(r) Javascript Application Framework
    Contains element to control an HTML text (span)
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
   * classname         default class: html
*/

WA.Elements.textElement = function(fatherNode, domID, code, listener)
{
  WA.Elements.textElement.sourceconstructor.call(this, fatherNode, domID, code, 'span', { classname:'text' }, listener);

  if (this.code.data)
    this.domNode.innerHTML = this.code.data;
}


// Add basic element code
WA.extend(WA.Elements.textElement, WA.Managers.wa4gl._element);
