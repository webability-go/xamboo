
/*
    widgetContainer.js, WAJAF, the WebAbility(r) Javascript Application Framework
    Contains container to control widget zones fixed to columns
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
   * classname         default class: expandable
   * classnamezone     default class: expandablezone
*/

/* Known params.attributes of zone:
   * id, application, params
   * style
   * classname         default class: %container.classnameselectoropen
   title               default: ''
   closed              default: no  possible: no/yes
   display             default: ''
*/

// domID is string id of node. If WA.toDOM(domID) is null , then a new division is created
// mode is auto/self.auto == 'no'
// notify is function to call if we move the size of zones

WA.Containers.widgetContainer = function(domNodeFather, domID, code, listener)
{
  var self = this;
  WA.Containers.widgetContainer.sourceconstructor.call(this, domNodeFather, domID, code, 'div', { classname:'widget' }, listener);

  this.zones = {};
  this.columnsmax = this.code.attributes.columns?code.attributes.columns:3;
  this.columns = [];

  this.moveable = (code.attributes.moveable==='yes');
  this.hasdd = !!WA.Managers.dd;
  this.movingzone = null;

  // the main zones
  this.domNodeZones = document.createElement('div');
  this.domNodeZones.id = 'checkit';
  this.domNodeZones.style.position = 'relative';
  this.domNodeZones.className = this.classes.classname + ' zones';
  this.domNode.appendChild(this.domNodeZones);

  this.addEvent('start', start);
  this.addEvent('resize', resize);
  this.addEvent('stop', stop);

  function resizeZoneContainer()
  {
    // 3 cases: null/auto, max or integer for height
    // if null/auto: the height depends of the content
    // if max: the height is fixed by default resize()
    // if integer: the height is fixed by default resize()




    if (self.code.attributes.height && self.code.attributes.height != 'auto')
    {
      // we should check ALSO the inner scroll if there is some
      var height = WA.browser.getNodeInnerHeight(self.domNode) - WA.browser.getNodeExtraHeight(self.domNodeZones);
      // IE6 ERROR !
      if (height >= 0)
      {
        self.domNodeZones.style.height = height + 'px';
      }
    }
    else
    {
      self.domNodeZones.style.height = '';
    }
  }

  function resizeColumnsWidth()
  {
    var totalwidth = 0;
    // Check if this works on ALL browsers ????
    if (self.domNodeZones.clientHeight < self.domNodeZones.scrollHeight)
      totalwidth = self.domNodeZones.clientWidth;
    else
      totalwidth = WA.browser.getNodeWidth(self.domNodeZones);
    var columnwidth = Math.floor(totalwidth / self.columnsmax);

    var pos = 0;
    for (var i = 0; i < self.columnsmax; i++)
    {
      self.columns[i].setLeft(pos);
      self.columns[i].setWidth(columnwidth);
      pos += columnwidth;
    }
  }

  function resizeZones()
  {
    for (var i in self.zones)
    {
      self.zones[i].resize();
    }

    return;
  }

  function resizeColumnsHeight()
  {
    var height = 0;
    for (var i = 0; i < self.columnsmax; i++)
    {
      self.columns[i].domNode.style.height = '';
      var thisheight = WA.browser.getNodeHeight(self.columns[i].domNode);
      if (thisheight > height)
        height = thisheight;
    }

    for (var i = 0; i < self.columnsmax; i++)
    {
      if (self.code.attributes.height && self.code.attributes.height != 'auto')
        if (self.code.attributes.height > height + WA.browser.getNodeExtraHeight(self.domNode) + WA.browser.getNodeExtraHeight(self.domNodeZones) + WA.browser.getNodeExtraHeight(self.columns[i].domNode))
          height = self.code.attributes.height - WA.browser.getNodeExtraHeight(self.domNode) - WA.browser.getNodeExtraHeight(self.domNodeZones) - WA.browser.getNodeExtraHeight(self.columns[i].domNode);
      self.columns[i].setHeight(height);
    }

    if (!self.code.attributes.height || (self.code.attributes.height && self.code.attributes.height == 'auto'))
    {
      height += WA.browser.getNodeExtraHeight(self.domNode) + WA.browser.getNodeExtraHeight(self.domNodeZones) + WA.browser.getNodeExtraHeight(self.columns[0].domNode);
      self.domNode.style.height = height + 'px';
      self.domNodeZones.style.height = height + 'px';
    }

  }


  // **************************************************************************
  // 4GL PUBLIC METHODS
  // **************************************************************************

  // official create zone
  this.resize = resize;
  function resize()
  {
    // default main container resize
    if (!WA.Containers.widgetContainer.source.resize.call(self))
      return;
    // 1. get the position and place for zones
    resizeZoneContainer();
    resizeColumnsWidth();
    resizeZones();
    resizeColumnsHeight();
  }

  // id is unique id, params are all needed parameters
  this.createZone = createZone;
  function createZone(id, params, notify, _4gl)
  {
    var ldomID = WA.parseID(id, self.xdomID);
    if (!ldomID)
      throw 'Error: the zone id is not valid in widgetContainer.createZone: id=' + domID;
    // check the zone does not exists YET !
    if (self.zones[ldomID[2]])
      throw 'Error: the zone already exists in widgetContainer.createZone: id=' + ldomID[2];

    if (!_4gl && self._4glNode)
    {
      // we create a 4GL Node (which should call again this method in 4GL Mode)
      if (!params.tag) params.tag = 'zone';
      if (!params.attributes) params.attributes = {};
      if (!params.attributes.id) params.attributes.id = ldomID[2];

      self._4glNode.createTree(self.xdomID[2], params);
      return;
    }

    // 1. call event precreate, can we create ?
    if (!self.callEvent('precreate', {id:ldomID[2]}))
      return null;

    var z = new WA.Containers.widgetContainer.widgetZone(self, ldomID[3], params, notify);
    self.zones[ldomID[2]] = z;

    self.callEvent('postcreate', {id:ldomID[2]});
    if (self.running)
    {
      z.start();
      self.resize();
    }
    return z;
  }

  this.showZone = showZone;
  function showZone(id)
  {
    var ldomID = WA.parseID(id, self.xdomID);
    if (!ldomID)
      throw 'Error: the zone id is not valid in widgetContainer.showZone: id=' + id;
    // check the zone does not exists YET !
    if (!self.zones[ldomID[2]])
      throw 'Error: the zone does not exists in widgetContainer.showZone: id=' + ldomID[2];

    if (!self.callEvent('preshow', ldomID[2]))
      return;

    // then show the specified zone
    self.zones[ldomID[2]].show();
    self.callEvent('postshow', ldomID[2]);
    if (self.running)
    {
      self.resize();
    }
  }

  this.activateZone = activateZone;
  function activateZone(id)
  {
    self.showZone(id);
  }

  this.hideZone = hideZone;
  function hideZone(id)
  {
    var ldomID = WA.parseID(id, self.xdomID);
    if (!ldomID)
      throw 'Error: the zone id is not valid in widgetContainer.showZone: id=' + id;
    // check the zone does not exists YET !
    if (!self.zones[ldomID[2]])
      throw 'Error: the zone does not exists in widgetContainer.showZone: id=' + ldomID[2];

    if (!self.callEvent('prehide', ldomID[2]))
      return;

    // then show the specified zone
    self.zones[ldomID[2]].hide();
    self.callEvent('posthide', ldomID[2]);
    if (self.running)
    {
      self.resize();
    }
  }

  this.destroyZone = destroyZone;
  function destroyZone(id, _4gl)
  {
    var ldomID = WA.parseID(id, self.xdomID);
    if (!ldomID)
      throw 'Error: the zone id is not valid in widgetContainer.showZone: id=' + id;
    // check the zone does not exists YET !
    if (!self.zones[ldomID[2]])
      throw 'Error: the zone does not exists in widgetContainer.showZone: id=' + ldomID[2];

    // 2. call event predestroy
    if (!self.callEvent('predestroy', {id:ldomID[2]}) )
      return;

    self.columns[self.zones[ldomID[2]].column].domNode.removeChild(self.zones[ldomID[2]].domNodeBox);
    self.zones[ldomID[2]].destroy();
    delete self.zones[ldomID[2]];

//    if (!_4gl && self._4glNode)
//      self._4glNode.destroyNode(ldomID[2]);
    self.callEvent('postdestroy', {id:ldomID[2]});
    self.resize();
  }

  this.start = start;
  function start()
  {
    // this is before the main start because it calls the children
    if (self.hasdd)
    {
      WA.Managers.dd.registerGroup(self.domID, 'object', true, self.domNode, self.movezone);
      for (var i = 0, l = self.columns.length; i < l; i++)
        WA.Managers.dd.registerZone(self.domID, self.columns[i].domNode, self.movezone);
    }

    self.resize();
  }

  this.destroy = destroy;
  function destroy()
  {
    this.domID = null;
    this._4glNode = null;
    this.params = null;
    this.notify = null;
    this.domNode = null;
    self = null;
  }

  // **************************************************************************
  // PRIVATE METHODS
  // **************************************************************************
  this.movezone = movezone;
  function movezone()
  {

  }

  function getcolumn(zone)
  {
    // find the column of the zone
    var column = null;
    for (var i = 0, l = self.columns.length; i < l; i++)
    {
      if (self.columns[i].domNode.id == zone)
      {
        column = i;
        break;
      }
    }

    // If we are out of columns we are not interested by the dragging recalculation
    return column;
  }

  this.moving = moving;
  function moving(order, widgetid, metrics, zone)
  {
    if (order == 'start')
    {
      var width = WA.browser.getNodeWidth(self.zones[widgetid].domNodeBox);
      var height = WA.browser.getNodeHeight(self.zones[widgetid].domNodeBox);
      self.zones[widgetid].domNodeBox.style.width = width + 'px';
      self.zones[widgetid].domNodeBox.style.height = height + 'px';
      self.zones[widgetid].domNodeBox.style.position = 'absolute';
      self.zones[widgetid].domNodeBox.style.zIndex = '2';
      // put a ghost frame where I was
      self.domNodeGhost = WA.createDomNode('div', domID+'_ghost', self.classes.classnamezone + 'ghost');
      self.zones[widgetid].domNodeBox.parentNode.insertBefore(self.domNodeGhost, self.zones[widgetid].domNodeBox);
      self.domNodeGhost.style.height = height + 'px';

      // prune to the main window
      self.domNode.appendChild(self.zones[widgetid].domNodeBox);

    }
    else if (order == 'drag')
    {
      var column = getcolumn(zone);
      if (column === null) // we are not interested into dragging outside the columns for calculation
        return;

      // calc the Y of the mouse in the column to prune the ghost where it goes
      var pointerY = metrics.dragtop;

      var before = null;
      var beforeY = null;
      for (var i in self.zones)
      {
        if (self.zones[i].column != column)
          continue;
        if (i == widgetid) // we dont want the one we are moving
          continue;

        var Ywidget = WA.browser.getNodeNodeTop(self.zones[i].domNodeBox, self.domNodeZones);
        if (pointerY > Ywidget)
          continue;
        if (before === null)
        {
          before = i;
          beforeY = Ywidget;
        }
        else
        {
          if (Ywidget >= beforeY)
            continue;
          before = i;
          beforeY = Ywidget;
        }
      }
      if (before === null)
      {
        // prune the ghost to the end of the column
        self.columns[column].domNode.appendChild(self.domNodeGhost);
        self.dragcolumn = column;
      }
      else
      {
        // prune before this node
        self.zones[before].domNodeBox.parentNode.insertBefore(self.domNodeGhost, self.zones[before].domNodeBox);
      }

      self.resize();
    }
    else if (order == 'drop')
    {
      // prune our node to the column where is the ghost
      self.domNodeGhost.parentNode.insertBefore(self.zones[widgetid].domNodeBox, self.domNodeGhost);
      self.zones[widgetid].column = self.dragcolumn;

      // destroy the ghost
      self.domNodeGhost.parentNode.removeChild(self.domNodeGhost);
      self.domNodeGhost = null;

      // set the default params
      self.zones[widgetid].domNodeBox.style.position = '';
      self.zones[widgetid].domNodeBox.style.width = '';
      self.zones[widgetid].domNodeBox.style.height = '';
      self.resize();
    }
  }

  this.createColumn = createColumn;
  function createColumn(num)
  {
    var c = new WA.Containers.widgetContainer.widgetColumn(self, self.domID+'_column_'+num, self.domNodeZones);
    return c;
  }

  // we finaly create the columns
  for (var i = 0; i < self.columnsmax; i++)
  {
    self.columns[i] = this.createColumn(i);
  }

  // create the clear:both div  (after the columns)
  this.domNodeClear = WA.createDomNode('div', null, null);
  this.domNodeClear.style.clear = 'both';
  this.domNodeZones.appendChild(this.domNodeClear);
}

// Add basic container code
WA.extend(WA.Containers.widgetContainer, WA.Managers.wa4gl._container);


WA.Containers.widgetContainer.widgetZone = function(maincontainer, domID, code, notify)
{
  var self = this;
  WA.Containers.widgetContainer.widgetZone.sourceconstructor.call(this, maincontainer, domID, code, 'div', { classname:'zone' }, notify);
  this.domNode.style.display = '';
  this.domNode.className += ' zone';
  this.visible = this.code.attributes.visible?this.code.attributes.visible!='no':true;
  this.opencloseable = (code.attributes.opencloseable=='yes');
  this.editable = (code.attributes.editable=='yes');
  this.closeable = (code.attributes.closeable=='yes');
  if(code.attributes.title == undefined)
    this.title = '';
    //this.title = code.attributes.title;

  this.column = code.attributes.column?code.attributes.column:0;
  this.statusopenclose = true;
  this.statuseditor = false;

  this.domNodeBox = WA.createDomNode('div', domID+'_box', this.classes.classname + ' ' + maincontainer.classes.classname + ' box');
  this.domNodeBox.style.display = this.visible?'':'none';

  maincontainer.columns[this.column].domNode.appendChild(this.domNodeBox);

  this.domNodeHeader = WA.createDomNode('div', domID+'_header', this.classes.classname + ' header');
  this.domNodeBox.appendChild(this.domNodeHeader);

  // create the box
  this.domNodeOpenClose = WA.createDomNode('div', domID+'_openclose', this.classes.classname + ' opened');
  this.domNodeOpenClose.style.styleFloat = 'left';
  this.domNodeOpenClose.style.cssFloat = 'left';
  this.domNodeOpenClose.style.display = this.opencloseable?'':'none';
//  this.domNodeOpenClose.innerHTML = '-';
  this.domNodeHeader.appendChild(this.domNodeOpenClose);

  this.domNodeTitle = WA.createDomNode('div', domID+'_title', this.classes.classname + ' title');
  this.domNodeTitle.style.styleFloat = 'left';
  this.domNodeTitle.style.cssFloat = 'left';
  this.domNodeTitle.style.position = 'relative';
  this.domNodeTitle.style.overflow = 'hidden';
  this.domNodeHeader.appendChild(this.domNodeTitle);
  WA.browser.setInnerHTML(this.domNodeTitle, this.title);

  this.domNodeClose = WA.createDomNode('div', domID+'_close', this.classes.classname + ' close');
  this.domNodeClose.style.styleFloat = 'right';
  this.domNodeClose.style.cssFloat = 'right';
  this.domNodeClose.style.display = this.closeable?'':'none';
//  this.domNodeClose.innerHTML = 'X';
  this.domNodeHeader.appendChild(this.domNodeClose);

  this.domNodeEditor = WA.createDomNode('div', domID+'_buttoneditor', this.classes.classname + ' editorclosed');
  this.domNodeEditor.style.styleFloat = 'right';
  this.domNodeEditor.style.cssFloat = 'right';
  this.domNodeEditor.style.display = this.editable?'':'none';
//  this.domNodeEditor.innerHTML = '#';
  this.domNodeHeader.appendChild(this.domNodeEditor);

  this.domNodeBox.appendChild(this.domNode);

  this.domNodeEditorContainer = null;

  this.addEvent('start', start);
//  this.addEvent('resize', resize);
  this.addEvent('stop', stop);

  this.resize = resize;
  function resize()
  {
    // cannot resize if not visible or not running
    if (!self.running || !self.visible || !self.father.visible)
      return;
    // ask for an inner resize
    self.callEvent('pleaseresize');
  }

  this.clickopenclose = clickopenclose;
  function clickopenclose(e)
  {
    self.statusopenclose = !self.statusopenclose;
    self.domNodeOpenClose.className = self.classes.classname + (self.statusopenclose?' opened':' closed');
    self.domNode.style.display = self.statusopenclose?'':'none';
  }

  this.clickclose = clickclose;
  function clickclose(e)
  {
    // the call close if available
    self.father.destroyZone(self.domID);
  }

  this.clickeditor = clickeditor;
  function clickeditor(e)
  {
    if (self.domNodeEditorContainer)
    {
      self.statuseditor = !self.statuseditor;
      self.domNodeEditor.className = self.classes.classname + (self.statuseditor?' editoropened':' editorclosed');
      self.domNodeEditorContainer.style.display = self.statuseditor?'':'none';
    }
  }

  this.moving = moving;
  function moving(order, id1, id2, zone, metrics)
  {
    self.moving = true;
    self.father.moving(order, self.xdomID[2], metrics, zone);
  }

  this.start = start;
  function start()
  {
    WA.Managers.event.on('click', self.domNodeOpenClose, self.clickopenclose, true);
    WA.Managers.event.on('click', self.domNodeClose, self.clickclose, true);
    WA.Managers.event.on('click', self.domNodeEditor, self.clickeditor, true);

    if (self.father.hasdd)
      WA.Managers.dd.registerObject(self.father.domID, self.domNodeTitle, self.domNodeBox, moving, null);

    // search for the EditorContainer if any
/*    var enode = maincontainer._4glNode.getNode(self.domID + '_editor');
    if (enode)
    {
      self.domNodeEditorContainer = enode.domNode;
      self.domNodeEditorContainer.style.display = 'none';
    }
*/
  }

  this.stop = stop;
  function stop()
  {
    WA.Managers.event.off('click', self.domNodeOpenClose, self.clickopenclose, true);
    WA.Managers.event.off('click', self.domNodeClose, self.clickclose, true);
    WA.Managers.event.off('click', self.domNodeEditor, self.clickeditor, true);

    if (self.father.hasdd)
      WA.Managers.dd.unregisterObject(self.father.domID, self.domNodeTitle, self.domNodeBox);
  }

  // no resize , resize is directly controled by the main container

  this.show = show;
  function show()
  {
    self.visible = true;
    self.domNodeBox.style.display = '';
    self.resize();
  }

  this.hide = hide;
  function hide()
  {
    self.visible = true;
    self.domNodeBox.style.display = 'none';
  }

  this.destroy = destroy;
  function destroy()
  {
    if (self.running > 0)
      self.stop();
    self.domNode = null;
    self.code = null;
    self.notify = null;
    self.domID = null;
    self.father = null;
    self = null;
  }
}

WA.extend(WA.Containers.widgetContainer.widgetZone, WA.Managers.wa4gl._zone);

WA.Containers.widgetContainer.widgetColumn = function(maincontainer, domID, domNodeFather)
{
  var self = this;
  this.maincontainer = maincontainer;
  this.domID = domID;
  this.domNodeFather = domNodeFather;

  this.domNode = WA.createDomNode('div', domID, maincontainer.classes.classname + ' column');
  this.domNode.style.position = 'absolute';
  this.domNode.style.top = '0px';
  domNodeFather.appendChild(this.domNode);

  this.setWidth = setWidth;
  function setWidth(w)
  {
    self.domNode.style.width = (w - WA.browser.getNodeExtraWidth(self.domNode)) + 'px';
  }

  this.setLeft = setLeft;
  function setLeft(l)
  {
    self.domNode.style.left = l + 'px';
  }

  this.setHeight = setHeight;
  function setHeight(h)
  {
    self.domNode.style.height = h + 'px';
  }

  this.destroy = destroy;
  function destroy()
  {
    if (self.running > 0)
      self.stop();
    self.domNode = null;
    self.code = null;
    self.notify = null;
    self.domID = null;
    self.father = null;
    self = null;
  }
}

