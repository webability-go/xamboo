
/*
    treeContainer.js, WAJAF, the WebAbility(r) Javascript Application Framework
    Contains container to control a hierarchic closeable tree of values
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

WA.Containers.treeContainer = function(fatherNode, domID, code, listener)
{
  var self = this;
  WA.Containers.treeContainer.sourceconstructor.call(this, fatherNode, domID, code, 'ul', { classname:'tree' }, listener);

  this.templates = {};      // all the knows templates for this tree
  this.data = null;         // all the data rows we can use for this tree
  this.loaded = false;      // the data has been loaded in first instance
  this.countload = 0;       // how many time we try to load: >3 throw error

  this.addEvent('start', start);

  /* SYSTEM METHODS */

  this.createZone = createZone;
  function createZone(domID, code, listener)
  {
    var ldomID = WA.parseID(domID, self.xdomID);
    if (!ldomID)
      throw 'Error: the zone id is not valid in treeContainer.createZone: id=' + domID;
    // check the zone does not exists YET !
    if (self.zones[ldomID[2]])
      throw 'Error: the zone already exists in treeContainer.createZone: id=' + ldomID[2];

    // 1. call event precreate, can we create ?
    if (!self.callEvent('precreate', {id:ldomID[2]}))
      return null;

    var container = self.domNode;
    if (code.attributes.father != undefined)
    {
      code.level = self.zones[code.attributes.father].level + 1;
      container = self.zones[code.attributes.father].domNodeChildren;
    }
    var z = new WA.Containers.treeContainer.treeZone(self, ldomID[3], container, code, listener);
    self.zones[code.attributes.id] = z;

    self.callEvent('postcreate', {id:ldomID[2]});
    if (self.state == 5)
    {
      z.propagate('start');
      self.propagate('resize');
    }
    return z;
  }

  this.destroyZone = destroyZone;
  function destroyZone(domID)
  {
    var ldomID = WA.parseID(domID, self.xdomID);
    if (!ldomID)
      throw 'Error: the zone id is not valid in treeContainer.destroyZone: id=' + domID;
    // check the zone must exists YET !
    if (!self.zones[ldomID[2]])
      throw 'Error: the zone does not exists in treeContainer.destroyZone: id=' + ldomID[2];

    // 2. call event destroy
    if (!self.callEvent('predestroy', {id:ldomID[2]}) )
      return;

    self.app.destroyTree(ldomID[2]);
//    self.zones[ldomID[2]].destroy();
    delete self.zones[ldomID[2]];
    self.callEvent('postdestroy', {id:ldomID[2]});
  }

  this.switchzone = switchzone;
  function switchzone(id)
  {
    if (self.zones[id])
      self.zones[id].openclose();
  }

  // getvalues, setvalues, start, stop, resize and destroy are controlled by 4GL so no notifications are needed
  this.getValues = getValues;
  function getValues()
  {
    return null;
  }

  this.setValues = setValues;
  function setValues(values)
  {
  }

  function start()
  {
    self.countload = 0;
    fillData();
  }

  this.destroy = destroy;
  function destroy(fast)
  {
    WA.Containers.treeContainer.source.destroy.call(self, fast);
    // destroy all zones
    self.data = null;
    self.templates = null;
    self = null;
  }

  this.reload = reload;
  function reload()
  {
    if (self.state != 5)
      return;

    // destroy the existing stuff
    for (var i in self.zones)
    {
      self.destroyZone(i);
    }
    self.zones = {};          // Destroy all the zones
    // we should destroy also the 4GL tree
    self.domNode.innerHTML = '';

    self.loaded = false;
    self.countload = 0;
    fillData();
  }

  function getData(r)
  {
    self.data = WA.JSON.decode(r.responseText);
    self.loaded = true;
    fillData();
  }

  // any record change should call this
  this.fillData = fillData;
  function fillData(newdataset)
  {
    if (!newdataset && !self.loaded && self.serverlistener)
    {
      if (self.countload++ > 3)
      {
        alert('Error getting the record from the server.');
        return;
      }

      // ask to the server the data
      var request = WA.Managers.ajax.createRequest(WA.Managers.wa4gl.url + WA.Managers.wa4gl.prelib + self.app.applicationID + WA.Managers.wa4gl.premethod + self.id + WA.Managers.wa4gl.preformat + WA.Managers.wa4gl.format, 'POST', 'Order=get', getData, true);

      // we put the "loading"

      return;
    }
    
    var dataset = null;
    if (newdataset)
    {
      dataset = newdataset;
      if (self.data && self.data.row)
        self.data.row.concat(newdataset);
      else
      {
        if (!self.data) self.data = {};
        self.data.row = newdataset;
      }
    }
    else
    {
      if (self.data && self.data.row)
        dataset = self.data.row;
    }
    
    // do we populate data from here ?
    if (dataset)
    {
      for (var i = 0, l = dataset.length; i < l; i++)
      {
        var myt = WA.clone(self.templates[dataset[i].template]);
        WA.replaceTemplate(myt, dataset[i]);
        myt.tag = 'zone';
        if (!myt.attributes)
          myt.attributes = {};
        myt.attributes.id = dataset[i].id;
        myt.attributes.father = dataset[i].father;
        myt.attributes.closeable = dataset[i].closeable?'yes':'no';
        myt.attributes.closed = dataset[i].closed?'yes':'no';
        myt.attributes.loadable = dataset[i].loadable?'yes':'no';
        myt.attributes.loaded = dataset[i].loaded?'yes':'no';
        // create the tree
        self.app.createTree(self, myt);
      }
    }
  }

  // get the templates if any
  this.parseTemplates = parseTemplates;
  function parseTemplates(code)
  {
    for (var i = 0, l = code.children.length; i < l; i++)
    {
      if (code.children[i].tag == 'template')
      {
        self.templates[code.children[i].attributes.name] = code.children[i];
      }
    }
  }

  this.parseData = parseData;
  function parseData(code)
  {
    for (var i = 0, l = code.children.length; i < l; i++)
    {
      if (code.children[i].tag == 'dataset')
      {
        self.data = WA.JSON.decode(code.children[i].data);
        self.loaded = true;
      }
    }

  }

  this.parseTemplates(code);
  this.parseData(code);
}

// Add basic container code
WA.extend(WA.Containers.treeContainer, WA.Managers.wa4gl._container);


WA.Containers.treeContainer.treeZone = function(father, domID, container, code, listener)
{
  var self = this;
  WA.Containers.treeContainer.treeZone.sourceconstructor.call(this, father, domID, code, 'div', { classname:'zone' }, listener);
  this.domNode.style.position = 'relative';

  this.children = {};

  this.closeable = (code.attributes.closeable==='yes');
  this.closed = (code.attributes.closed==='yes');
  this.loadable = (code.attributes.loadable==='yes');
  this.loaded = (code.attributes.loaded==='yes');
  this.container = container;

  this.domNodeMain = WA.createDomNode('li', this.domID + '_li', 'zone');
  this.domNodeMain.style.position = 'relative';
//  this.domNode.style.marginLeft = '16px';
//  father.domNode.appendChild(self.domNodeMain);
  container.appendChild(this.domNodeMain);

  // if attributes.open: we create the +/-
  this.domIDOpenClose = this.domID + '_close';
  this.domNodeOpenClose = WA.createDomNode('div', this.domIDOpenClose, null);
//  this.domNodeOpenClose.style.position = 'relative';
//  this.domNodeOpenClose.style.marginLeft = '-16px';
  this.domNodeOpenClose.id = this.domIDOpenClose;
  // we select which class to add
  if (!this.closeable)
    this.domNodeOpenClose.className = 'treeleave';
  else
    this.domNodeOpenClose.className = this.closed?'treeclosed':'treeopened';
  this.domNodeOpenClose.style.position = 'absolute';
  this.domNodeOpenClose.style.left = '-16px';
  this.domNodeOpenClose.style.top = '0px';
  this.domNodeMain.appendChild(this.domNodeOpenClose);

  this.domNode.style.display = '';
  this.domNode.className = 'treedata';
//  this.domNode.style.position = 'absolute';
//  this.domNode.style.left = '16px';
  this.domNodeMain.appendChild(this.domNode);

  this.domNodeChildren = WA.createDomNode('ul', domID+'_children', null);
  this.domNodeChildren.className = 'treechildren';
  if (this.closed)
    this.domNodeChildren.style.display = 'none';
  this.domNodeMain.appendChild(this.domNodeChildren);

  this.addEvent('start', start);
  this.addEvent('stop', stop);

  this.childrenLoaded = childrenLoaded;
  function childrenLoaded(r)
  {
    var data = WA.JSON.decode(r.responseText);
    self.loaded = true;
    self.father.fillData(data.row);
  }

  this.loadChildren = loadChildren;
  function loadChildren()
  {
    // start an ajax request
    var request = WA.Managers.ajax.createRequest(WA.Managers.wa4gl.url + WA.Managers.wa4gl.prelib + self.father.app.applicationID + WA.Managers.wa4gl.premethod + self.father.id + WA.Managers.wa4gl.preformat + WA.Managers.wa4gl.format, 'POST', null, childrenLoaded, false);
    request.addParameter('Order', 'getchildren');
    request.addParameter('father', self.code.attributes.id);
    request.send();
  }

  function getResponse(request)
  {
//    alert(request.responseText);
  }

  this.sendServer = sendServer;
  function sendServer(order, code)
  {
    if (!self.father.serverlistener)
      return;
    // send information to server based on mode
    var request = WA.Managers.ajax.createRequest(WA.Managers.wa4gl.url + WA.Managers.wa4gl.prelib + self.father.app.applicationID + WA.Managers.wa4gl.premethod + self.father.id + WA.Managers.wa4gl.preformat + WA.Managers.wa4gl.format, 'POST', 'Order='+order, getResponse, false);
    if (request)
    {
      for (var i in code)
      {
        request.addParameter(i, code[i]);
      }
      request.send();
    }
  }

  this.openclose = openclose;
  function openclose(e)
  {
    if (!self.closeable)
      return;
    self.closed = !self.closed;
    if (self.closed)
      self.hide();
    else
      self.show();
    self.domNodeOpenClose.className = self.closed?'treeclosed':'treeopened';
    // we send to the server the status
    self.sendServer('openclose', {id:self.code.attributes.id,status:self.closed});
    self._callNotify('resize'); // resize us
    self._callNotify('pleaseresize'); // resize children
  
    if (self.loadable && !self.loaded && ((self.closeable && !self.closed) || !self.closeable) )
      loadChildren();
  }

  this._callNotify = _callNotify;
  function _callNotify(type)
  {
    var result = true;
    // no notifications if the app is not started
    if (self.notify && self.running)
      result = self.notify(type, self.domID, null);
    return result;
  }

  function start()
  {
    // link open close
    if (self.closeable)
      WA.Managers.event.on('click', self.domNodeOpenClose, self.openclose, true);

    // we go for the inner information if needed
    if (this.loadable && !this.loaded && ((this.closeable && !this.closed) || !this.closeable) )
    {
      self.loadChildren();
    }
  }

  function stop()
  {
    if (self.closeable)
      WA.Managers.event.off('click', self.domNodeOpenClose, self.openclose, true);
  }

  this.resize = resize;
  function resize()
  {
    // cannot resize if not visible or not running
    if (!self.running || !self.visible || !self.father.visible)
      return;
    // we just get the max size of main container
//    self.domNode.style.width = (WA.browser.getNodeInnerWidth(self.father.domNode) - WA.browser.getNodeExternalWidth(self.domNode)) + 'px';
//    self.domNode.style.height = (WA.browser.getNodeInnerHeight(self.father.domNode) - WA.browser.getNodeExternalHeight(self.domNode)) + 'px';
  }

  this.show = show;
  function show()
  {
    self.visible = true;
    self.domNodeChildren.style.display = '';
    self.resize();
  }

  this.hide = hide;
  function hide()
  {
    self.visible = false;
    self.domNodeChildren.style.display = 'none';
  }

  this.destroy = destroy;
  function destroy(fast)
  {
    WA.Containers.treeContainer.treeZone.source.destroy.call(self, fast);

    self.children = null;
    self.container = null;
    self.domNodeMain.parentNode.removeChild(self.domNodeMain);
    self.domNodeMain = null;
    self.domNodeOpenClose = null;
    self.domNodeChildren = null;
    self = null;
  }
}

WA.extend(WA.Containers.treeContainer.treeZone, WA.Managers.wa4gl._zone);
