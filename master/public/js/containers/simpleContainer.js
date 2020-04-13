
/*
    simpleContainer.js, WAJAF, the WebAbility(r) Javascript Application Framework
    Contains simple interchangeable zones controlled by code
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

/* Known params.attributes of container:
   * type, id, haslistener
   * left, top, anchorleft, anchortop, width, height
   * display           default display: ''
   * style
   * classname         default class: simple
   * classnamezone     default class: simplezone
*/

/* Known params.attributes of zone:
   * id, application, params
   * style
   * classname         default class: %container.classnamezone
*/

// register into WA
WA.Containers.simpleContainer = function(fatherNode, domID, code, listener)
{
  var self = this;
  WA.Containers.simpleContainer.sourceconstructor.call(this, fatherNode, domID, code, 'div', { classname:'simple' }, listener);

  this.zoneactive = null;
  this.addEvent('resize', this.resize);  // resize is default resize
  this.addEvent('postresize', this.postresize);  // resize is default resize

  /* SYSTEM METHODS */

  // official create zone, should NOT be called by user, use newZone instead
  this.createZone = createZone;
  function createZone(domID, code, listener)
  {
    var ldomID = WA.parseID(domID, self.xdomID);
    if (!ldomID)
      throw 'Error: the zone id is not valid in simpleContainer.createZone: id=' + domID;
    // check the zone does not exists YET !
    if (self.zones[ldomID[2]])
      throw 'Error: the zone already exists in simpleContainer.createZone: id=' + ldomID[2];

    // 1. call event create, can we create ?
    if (!self.callEvent('create', {id:ldomID[2]}))
      return null;

    var z = new WA.Containers.simpleContainer.simpleZone(self, ldomID[3], code, listener);
    self.zones[ldomID[2]] = z;

    self.callEvent('postcreate', {id:ldomID[2]});
    if (self.state == 5)
      z.propagate('start');
    // we activate 1rst zone we create
    if (self.zoneactive == null && WA.sizeof(self.zones) == 1)
      self.activateZone(ldomID[2]);
    return z;
  }

  this.destroyZone = destroyZone;
  function destroyZone(domID)
  {
    var ldomID = WA.parseID(domID, self.xdomID);
    if (!ldomID)
      throw 'Error: the zone id is not valid in simpleContainer.destroyZone: id=' + domID;
    // check the zone must exists YET !
    if (!self.zones[ldomID[2]])
      throw 'Error: the zone does not exists in simpleContainer.destroyZone: id=' + ldomID[2];

    // 2. call event destroy
    if (!self.callEvent('predestroy', {id:ldomID[2]}) )
      return;

    if (self.zoneactive == ldomID[2])
      self.activateZone(null);

    self.app.destroyTree(ldomID[2]);
//    self.zones[ldomID[2]].destroy();
    delete self.zones[ldomID[2]];
    self.callEvent('postdestroy', {id:ldomID[2]});
  }

  // fast to true to not touch the DOM elements to destroy fastly the structure
  this.destroy = destroy;
  function destroy(fast)
  {
    WA.Containers.simpleContainer.source.destroy.call(self, fast);
    self.zoneactive = null;
    self = null;
  }

  /* USER CALLABLE METHODS */

  this.newZone = newZone;
  function newZone(id, classname, style)
  {
    var code = {};
    code.tag = 'zone';
    code.attributes = {id: id, classname:classname, style:style};
    self.app.createTree(self, code);
  }

  this.showZone = showZone;
  function showZone(domID)
  {
    self.activateZone(domID);
  }

  this.hideZone = hideZone;
  function hideZone(domID)
  {
    var ldomID = WA.parseID(domID, self.xdomID);
    if (!ldomID)
      throw 'Error: the zone id is not valid in simpleContainer.hideZone: id=' + domID;
    if (!self.zones[ldomID[2]] || ldomID[2] != self.zoneactive) // other zone active
      return;
    self.activateZone(null);
  }

  this.deleteZone = deleteZone;
  function deleteZone(domID)
  {
    destroyZone(domID);
  }

  // activate a specific zone by id. If id == -1 or any no existing zone, all zones are hidden
  this.activateZone = activateZone;
  function activateZone(domID)
  {
    var ldomID = WA.parseID(domID, self.xdomID);
    if (ldomID && ldomID[2] == self.zoneactive) // same zone active
      return;

    // 1. call event hide/show
    var result = true;
    if (ldomID)
      result &= self.callEvent('show', {id:ldomID[2]});
    if (self.zoneactive != null)
      result &= self.callEvent('hide', {id:self.zones[self.zoneactive].xdomID[2]});
    if (!result)
      return;
    // first hide actual
    if (self.zoneactive != null)
    {
      self.zones[self.zoneactive].hide();
      self.callEvent('posthide', {id:self.zones[self.zoneactive].xdomID[2]});
      self.zoneactive = null;
    }
    if (!ldomID)
      return;
    // then show the specified zone
    self.zones[ldomID[2]].show(); // already call local resize
    self.zoneactive = ldomID[2];
    self.callEvent('postshow', {id:ldomID[2]});
  }

  this.getValues = getValues;
  function getValues()
  {
    return {active:self.zoneactive};
  }

  this.setValues = setValues;
  function setValues(values)
  {
    self.activateZone(values.active);
  }

}

// Add basic container code
WA.extend(WA.Containers.simpleContainer, WA.Managers.wa4gl._container);

WA.Containers.simpleContainer.simpleZone = function(father, domID, code, listener)
{
  WA.Containers.simpleContainer.simpleZone.sourceconstructor.call(this, father, domID, code, 'div', { classname:'zone' }, listener);
}

// Add basic zone code
WA.extend(WA.Containers.simpleContainer.simpleZone, WA.Managers.wa4gl._zone);

