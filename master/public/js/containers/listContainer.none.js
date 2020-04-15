
/*
    listContainer.js, WAJAF, the WebAbility(r) Javascript Application Framework
    Contains container to show list of zones
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

function listZone(maincontainer, domID, domNodeContainer, params, notify)
{
  var self = this;
  this.type = 'zone';
  this.maincontainer = maincontainer;
  this.domID = domID;
  this.params = params;
  this.notify = notify;
  this.running = false;
  this.visible = false;

  this.domNode = domNodeContainer;

  this.callNotify = callNotify;
  function callNotify(type)
  {
    var result = true;
    // no notifications if the app is not started
    if (self.notify && self.running)
      result = self.notify(type, self.domID, null);
    return result;
  }

  this.start = start;
  function start()
  {
    self.running = true;
  }

  this.stop = stop;
  function stop()
  {
    self.running = false;
  }

  this.resize = resize;
  function resize()
  {
    // cannot resize if not visible or not running
    if (!self.running || !self.visible || !self.maincontainer.visible)
      return;
    // we just get the max size of main container
//    self.domNode.style.width = (WA.browser.getNodeInnerWidth(self.maincontainer.domNode) - WA.browser.getNodeExternalWidth(self.domNode)) + 'px';
//    self.domNode.style.height = (WA.browser.getNodeInnerHeight(self.maincontainer.domNode) - WA.browser.getNodeExternalHeight(self.domNode)) + 'px';
  }

  this.show = show;
  function show()
  {
    self.visible = true;
    self.domNode.style.display = '';
  }

  this.hide = hide;
  function hide()
  {
    self.visible = false;
    self.domNode.style.display = 'none';
  }

  this.destroy = destroy;
  function destroy()
  {
    if (self.running)
      self.stop();
    self.domNode = null;
    self.params = null;
    self.notify = null;
    self.domID = null;
    self.maincontainer = null;
    self = null;
  }
}

function listContainer(domNodeFather, domID, params, notify, _4glNode)
{
  var self = this;
  this.type = 'container';
  this._4glNode = _4glNode;
  this.domNodeFather = domNodeFather;
  this.domID = domID;
  this.params = params;
  this.notify = notify;

  this.running = 0;
  this.visible = params.attributes.display?params.attributes.display!='none':true;
  this.columns = params.attributes.columns?params.attributes.columns:1;
  this.maxperpage = 0;      // no pagination per default, controlled by paginationElement
  this.zones = {};          // index for fast access
  this.trnodes = [];        // array of tr nodes
  this.trcount = 0;         // counter of created tr (unique id)
  this.tdnodes = [];        // array of available td's to fill
  this.tdcontent = [];      // array of linked content or null if empty
  this.tdcount = 0;         // counter of create td (unique id)
  this.templates = {};      // all the knows templates for this list
  this.data = {};           // all the data rows we can use for this list

  this.pagination = null;   // the pagination element
  this.order = null;        // the order element
  this.filter = null;       // the filter element

  this.locali = false;
  this.localid = null;

  this.classname = params.attributes.classname!=undefined?params.attributes.classname:'list';
  this.classnameline = params.attributes.classnameline!=undefined?params.attributes.classnameline:'listline';
  this.classnamezone = params.attributes.classnamezone!=undefined?params.attributes.classnamezone:'listzone';

  this.domNode = WA.toDOM(domID);
  if (!this.domNode)
  {
    this.domNode = WA.createDomNode('table', domID, this.classname);
    domNodeFather.appendChild(this.domNode);
    this.domNodetbody = WA.createDomNode('tbody', domID+'_tbody', null);
    this.domNode.appendChild(this.domNodetbody);
  }
  this.domNode.style.display = this.visible?'':'none';

  this.callNotify = callNotify;
  function callNotify(type, id)
  {
    var result = true;
    // no notifications if the app is not started
    if (self.notify && self.running)
      result = self.notify(type, self.domID, (id!=null?{id:id}:null));
    return result;
  }

  this.createLine = createLine;
  function createLine()
  {
    var domNodetr = WA.createDomNode('tr', domID+'_tr'+self.trcount, self.classnameline);
    self.domNodetbody.appendChild(domNodetr);
    self.trnodes[self.trcount] = domNodetr;
    for (var i = 0; i < self.columns; i++)
    {
      var domNodetd = WA.createDomNode('td', domID+'_td'+self.tdcount, self.classnamezone);
      domNodetr.appendChild(domNodetd);
      self.tdnodes[self.tdcount] = domNodetd;
      self.tdcontent[self.tdcount] = null;
      self.tdcount ++;
    }
    self.trcount ++;
  }

  this.getFreeTD = getFreeTD;
  function getFreeTD()
  {
    for (var i = 0; i < self.tdnodes.length; i++)
      if (self.tdnodes[i] && !self.tdcontent[i])
        return i;
    return false;
  }


  this.createZone = createZone;
  function createZone(domID, params, notify)
  {
    // 1. call event predestroy
    if (!self.callNotify('precreate', null))
      return null;

    if (!params.attributes.id)
      throw 'Error: the id is missing in the tree construction of '+domID;

    // we search the first free td
    var pointer = self.getFreeTD();
    if (pointer === false)
      this.createLine();
    var pointer = self.getFreeTD();
    var z = new listZone(this, domID, self.tdnodes[pointer], params, notify);

    self.zones[params.attributes.id] = z;
    self.tdcontent[pointer] = z;

    if (self.running)
    {
      z.start();
    }

    self.callNotify('postcreate', params.attributes.id);

    return z;
  }

  this.destroyZone = destroyZone;
  function destroyZone(id)
  {
/*
    var i = WA.getIndexById(self.zones, id, 'domID');
    if (i === false)
      return;

    // 1. call event predestroy
    if (!self.callNotify('predestroy', i))
      return;

    self.zones[i].destroy();
    self.zones.splice(i,1);
    if (self.activezone == i)
    {
      // next available zone must be activated
      if (self.zones[i] != undefined)
        self.activateZone(i);
      else if (i > 0) // or previous if it was last one
        self.activateZone(i-1);
      else // or nothing activated if no zones
        self.activezone = -1;
    }
    self.callNotify('postdestroy', null);
*/
  }

  this.show = show;
  function show()
  {
    if (!self.callNotify('preshow', self.domID))
      return;
    self.domNode.style.display = '';
    self.visible = true;
    self.resize();
    self.callNotify('postshow', self.domID);
    // finaly ask for a general resize
    self.callNotify('resize', null);
  }

  this.hide = hide;
  function hide()
  {
    if (!self.callNotify('prehide', self.domID))
      return;
    self.visible = false;
    self.domNode.style.display = 'none';
    self.callNotify('posthide', self.domID);
  }

  this.setSize = setSize;
  function setSize(w,h)
  {
    if (w !== null)
      self.domNode.style.width = w + 'px';
    if (h !== null)
      self.domNode.style.height = h + 'px';
    self.resize();
    // finaly ask for a general resize
    self.callNotify('resize', null);
  }

  this.setPosition = setPosition;
  function setPosition(l,t)
  {
    if (l !== null)
      self.domNode.style.left = l + 'px';
    if (t !== null)
      self.domNode.style.top = t + 'px';
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

  this.start = start;
  function start()
  {
    // we start all children
    for (var i in self.zones)
      self.zones[i].start();
    this.running = true;
    self.resize();

    // do we populate data from here ?
    if (self.data.row)
    {
      for (var i in self.data.row)
      {
        var myt = WA.clone(self.templates[self.data.row[i].template]);
        WA.replaceTemplate(myt, self.data.row[i]);
        myt.tag = 'zone';
        if (!myt.attributes)
          myt.attributes = {};
        myt.attributes.id = self.data.row[i].id;
        self._4glNode.newTree(self._4glNode, myt);
      }
    }

  }

  this.resize = resize;
  function resize()
  {
    if (!self.running || !self.visible)
      return;
    // 1. resize main container
    self._4glNode.nodeResize(self.domNodeFather, self.domNode, self.params.attributes);
    // 2. resize active zone
//    if (self.activezone != -1)
//      self.zones[self.activezone].resize();
  }

  this.stop = stop;
  function stop()
  {
    this.running = false;
//    for (var i = 0, l = self.zones.length; i < l; i++)
//      self.zones[i].stop();
  }

  this.destroy = destroy;
  function destroy()
  {
    if (self.running)
      self.stop();
    // destroy all zones
    self.domNode = null;
    self.zones = null;
    self.mainzone = null;
    self.notify = null;
    self.params = null;
    self.domID = null;
    self.domNodeFather = null;
    self._4glNode = null;
    self = null;
  }

  // get the templates if any
  this.parseTemplates = parseTemplates;
  function parseTemplates(params)
  {
    for (var i in params)
    {
      if (params[i].tag == 'template')
      {
        self.templates[params[i].attributes.name] = params[i];
      }
    }
  }

  this.parseData = parseData;
  function parseData(params)
  {
    for (var i in params)
    {
      if (params[i].tag == 'dataset')
      {
        self.data = WA.JSON.decode(params[i].data);
      }
    }

  }

  this.parseTemplates(params);
  this.parseData(params);
}

// Needed aliases
WA.Containers.listContainer = listContainer;

