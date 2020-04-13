
/*
    hiddenfieldElement.js, WAJAF, the WebAbility(r) Javascript Application Framework
    Contains element to control a hidden field
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

WA.Elements.hiddenfieldElement = function(fatherNode, domID, code, listener)
{
  var self = this;
  WA.Elements.hiddenfieldElement.sourceconstructor.call(this, fatherNode, domID, code, 'div', { classname:'hidden' }, listener);

  this.formtype = 'field';
  this.record = (this.code.attributes.record&&this.code.attributes.record=='no'?false:true);
  this.editable = this.edition = true;  // it's a text field, so yes, and we always send it to the server

  this.status = 1; // status is always OK

  this.domNodeField = WA.createDomNode('input', domID+'_field', 'field');
  this.domNodeField.type = 'hidden';
  this.domNodeField.name = this.id;
  this.domNodeField.value = this.code.data || '';
  this.domNode.appendChild(this.domNodeField);

  // we link with the group. first father is the zone, second father is the group
  this.group = null;
  if (this.father.father.code.attributes.type == "groupContainer")
  {
    this.group = this.father.father;
    this.group.registerField(this);
  }

  // If we control some other fields
  this.synchronizer = null;
  this.synchronizeelements = [];

  this.setMode = setMode;
  function setMode(mode, keep)
  { }

  this.reset = reset;
  function reset()
  { }

  this.getValues = getValues;
  function getValues()
  {
    return self.domNodeField.value;
  }

  this.setValues = setValues;
  function setValues(values)
  {
    self.domNodeField.value = values;
  }

  this.destroy = destroy;
  function destroy(fast)
  {
    WA.Elements.hiddenfieldElement.source.destroy.call(self, fast);

    self.group = null;
    self.domNodeField = null;
    self = null;
  }
}

// Add basic element code
WA.extend(WA.Elements.hiddenfieldElement, WA.Managers.wa4gl._element);
