
/*
    buttonElement.js, WAJAF, the WebAbility(r) Javascript Application Framework
    Contains the control of a button element
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
   * type, id
   * left, top, bottom, right, width, height
   * display           default display: ''
   * style
   * classname         default class: button

   * value            string, content of the button
   * action           string, type of button
                      known actions: '' (empty string) simple button
                      Others: confirm, cancel, info, insert, update, delete, view, clear, reset, submit, previous, next, first, last
   * link             name of group container to register the element
   * status           default status of the button: '' or 'disabled'
*/

// A button has 2 states
// A button can be linked to a group to execute group operations
// status 1: normal off button, on, multistate (based on value)
// status 2: deactivated button
// each state is a class
// The clicked and over buttons are CSS pseudo classes.

WA.Elements.buttonElement = function(domNodeFather, domID, code, listener)
{
  var self = this;
  code.domtype = 'button'; // IE bug on input type, we force the type at the node creation
  WA.Elements.buttonElement.sourceconstructor.call(this, domNodeFather, domID, code, 'input', { classname:'button' }, listener);

  this.formtype = 'control';
  this.editable = false;
  this.edition = false;
  this.focus = false;
  this.record = false;

  this.defaulttitle = '';
  if (this.code.data)
    this.defaulttitle = this.code.data;
  this.title = ['','','',''];
  if (code.children)
  {
    for (var i = 0, l = code.children.length; i < l; i++)
    {
      switch (code.children[i].tag)
      {
        case 'titleinsert': self.title[1] = code.children[i].data; break;
        case 'titleupdate': self.title[2] = code.children[i].data; break;
        case 'titledelete': self.title[3] = code.children[i].data; break;
      }
    }
  }

//  this.domNode.type = 'button';
  this.domNode.value = self.defaulttitle;
  if (this.code.attributes.value != undefined)
    this.value = this.code.attributes.value;
  else
    this.value = null;

  if (this.code.attributes.action)
    this.action = this.code.attributes.action;
  else
    this.action = null;

  this.extra = this.code.attributes.extra?' '+this.code.attributes.extra:'';
  this.status = this.code.attributes.status=='disabled'?4:1; // 1 = normal, 2 = disabled as a form, 3 = modified, 4 = force disabled
  this.mode = 0;
  // Behaviour on modes
  this.isvisible = [];
  this.disabled = [];
  for (var i = 1; i < 5; i++)
  {
    this.isvisible[i] = (this.code.attributes.visible?this.code.attributes.visible.indexOf(''+i)!=-1:true);
    this.disabled[i] = (this.code.attributes.disabled?this.code.attributes.disabled.indexOf(''+i)!=-1:false);
  }

  // we link with the group. first father is the zone, second father is the group
  this.group = null;
  if (this.father.father.code.attributes.type == "groupContainer")
  {
    this.group = this.father.father;
    this.group.registerField(this);
  }
  else
    checkClass();

  this.addEvent('start', start);
  this.addEvent('stop', stop);
  this.addEvent('resize', this.resize);

  function click()
  {
    if (self.status == 2 && self.action == 'submit')
      return;

    self.callEvent('click', {value:self.value});
    if (self.group && self.action)
    {
      self.group.doAction(self.action);
    }
  }

  // called by the group linked
  this.checkClass = checkClass;
  function checkClass()
  {
    // status is 1 ok, 2 error, 3 modified
    var disabled = '';
    switch (self.status)
    {
      case 1: // neutral, working, ok
      case 3: // modified
        break;
      case 2: // disabled in a form context
        if (self.action == 'submit')
          disabled = ' disabled';
        break;
      case 4: // disabled forced
        disabled = ' disabled';
        break;
    }
    self.domNode.className = self.classes.classname + self.extra + disabled + (self.action?' '+self.action:'');
  }

  this.setMode = setMode;
  function setMode(mode, keep)
  {
    self.mode = mode;

    // Set all the data based on the mode
    if (!self.isvisible[mode])
    {
      self.hide();
      return;
    }
    self.show();
    if (self.disabled[mode])
    {
      self.status = 2;
    }
    self.domNode.value = self.title[self.mode]?self.title[self.mode]:self.defaulttitle;
    checkClass();
  }

  this.reset = reset;
  function reset()
  {}

  function start()
  {
    WA.Managers.event.on('click', self.domNode, click, false);
  }

  function stop()
  {
    WA.Managers.event.off('click', self.domNode, click, false);
  }

  this.getValues = getValues;
  function getValues()
  {
    return self.status;
  }

  this.setValues = setValues;
  function setValues(values)
  {
    self.status = values;
    self.checkClass();
  }

  this.destroy = destroy;
  function destroy(fast)
  {
    WA.Elements.buttonElement.source.destroy.call(self, fast);
    self = null;
  }

}

// Add basic element code
WA.extend(WA.Elements.buttonElement, WA.Managers.wa4gl._element);
