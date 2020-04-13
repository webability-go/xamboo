
/*
    codeElement.js, WAJAF, the WebAbility(r) Javascript Application Framework
    Contains mecanism to load Javascript into script tag
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

/* Known code.attributes of element:
   none. The code element is a special node to add javascript code to the document.
*/

WA.Elements.codeElement = function(domNodeFather, domID, code, listener)
{
  var self = this;
  WA.Elements.codeElement.sourceconstructor.call(this, domNodeFather, domID, code, 'script', null, listener);

  this.domNode.setAttribute('type', 'text/javascript');
  document.getElementsByTagName('head')[0].appendChild(this.domNode);
  if (this.code.data)
    this.domNode.text = this.code.data;

  this.destroy = destroy;
  function destroy(fast)
  {
    document.getElementsByTagName('head')[0].removeChild(this.domNode);
    WA.Elements.codeElement.source.destroy.call(self, fast);
    self = null;
  }
}

// Add basic element code
WA.extend(WA.Elements.codeElement, WA.Managers.wa4gl._element);
