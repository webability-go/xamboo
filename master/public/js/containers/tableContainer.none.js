
/*
    tableContainer.js, WAJAF, the WebAbility(r) Javascript Application Framework
    Contains container to control a table
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

function tableContainer(domID, params, feedback, _4glNode)
{
  this.domNode = WA.toDOM(domID);
  if (!this.domNode)
    throw "Error in simpleContainer: there is no domNode with this id: "+domID;

  var self = this;
  this._4glNode = _4glNode;
  this.domID = domID;
  this.params = params;
  this.feedback = feedback;
  this.running = false;

  this.classname = params.attributes.classname?params.attributes.classname:'simple';

  // the zone is the domID itself. id is ignored. params may have 'classname' and replace the main container classname
  this.createZone = createZone;
  function createZone(id, params)
  {
    // the zone is the same container as main container, and change the id of the container for DOM reference
    self.domNode.id = id;
    if (params.attributes.classname != undefined)
      self.domNode.className = params.attributes.classname;
    else
      self.domNode.className = self.classname;
    return self;
  }

  this.start = start;
  function start()
  {
    self.running = true;
  }

  this.resize = resize;
  function resize()
  {
    // is automatically resized by external encapsulator (zone is same as container)
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

  this.stop = stop;
  function stop()
  {
    self.running = false;
  }

  this.destroy = destroy;
  function destroy()
  {
    if (self.running)
      self.stop();
    self.classname = null;
    self.feedback = null;
    self.params = null;
    self.domNode = null;
    self.domID = null;
    self._4glNode = null;
    self = null;
  }

}

WA.Containers.tableContainer = tableContainer;
