
/*
    tabContainer.js, WAJAF, the WebAbility(r) Javascript Application Framework
    Contains container to control tabbed zones
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

/* Known code.attributes of container:
   * type, id, haslistener
   * left, top, anchorleft, anchortop, width, height
   * display           default display: ''
   * style
   * classname         default class: expandable
   * classnamezone     default class: expandablezone
*/

/* Known code.attributes of zone:
   * id, application, code
   * style
   * classname         default class: %container.classnameselectoropen
   title               default: ''
   display             default: ''
*/

WA.Containers.tabContainer = function(domNodeFather, domID, code, listener)
{
  var self = this;
  WA.Containers.tabContainer.sourceconstructor.call(this, domNodeFather, domID, code, 'div', { classname:'tab' }, listener);
  this.tabselectors = {};
  this.tabzones = {};
  this.zoneactive = this.code.attributes.startzone?this.code.attributes.startzone:null;
  this.selectoroffset = 0;
  this.selectorsize = 0;
  this.availablewidth = 0;
  this.list = false;
  this.changeorder = this.code.attributes.changeorder?this.code.attributes.changeorder!="no":true;

  this.hassound = !!WA.Managers.sound;
  this.soundopen = this.code.attributes.soundopen?this.code.attributes.soundopen:WA.Containers.tabContainer.soundopen;
  this.soundchange = this.code.attributes.soundchange?this.code.attributes.soundchange:WA.Containers.tabContainer.soundchange;
  this.soundclose = this.code.attributes.soundclose?this.code.attributes.soundclose:WA.Containers.tabContainer.soundclose;
  this.hasanim = !!WA.Managers.anim;
  this.hasdd = !!WA.Managers.dd;
  this.startPos = 0;

  // there will be 3 subcontainers: 1 for tabs, 1 for tabs list, 1 for zones
  // main selector
  this.domNodeSelector = document.createElement('div');
  this.domNodeSelector.className = 'selector';
  this.domNode.appendChild(this.domNodeSelector);

  // the move left/right tab & list selector
  this.domNodeLeft = document.createElement('div');
  this.domNodeLeft.className = 'left';
  this.domNodeLeft.style.display = 'none';
  this.domNodeSelector.appendChild(this.domNodeLeft);

  // tabs mover container
  this.domNodetabscontainer = document.createElement('div');
  this.domNodetabscontainer.className = 'selectorcontainer';
  this.domNodeSelector.appendChild(this.domNodetabscontainer);

  // the move left/right tab & list selector
  this.domNodeRight = document.createElement('div');
  this.domNodeRight.className = 'right';
  this.domNodeRight.style.display = 'none';
  this.domNodeSelector.appendChild(this.domNodeRight);

  this.domNodeSelect = document.createElement('div');
  this.domNodeSelect.className = 'select';
  this.domNodeSelector.appendChild(this.domNodeSelect);

  // tabs inner container, no classes for it
  this.domNodetabs = document.createElement('div');
  this.domNodetabs.style.position = 'relative';
  this.domNodetabscontainer.appendChild(this.domNodetabs);

  // the tabs list
  this.domNodeList = document.createElement('div');
  this.domNodeList.className = 'list';
  this.domNodeList.style.display = 'none';
  this.domNode.appendChild(this.domNodeList);

  // the main zones
  this.domNodeZones = document.createElement('div');
  this.domNodeZones.className = 'zones';
  this.domNode.appendChild(this.domNodeZones);

  this.addEvent('start', start);
  this.addEvent('resize', resize);
  this.addEvent('stop', stop);

  function resizeSelector()
  {
    // 1. extends selector to max available, we ignore padding
    var width = WA.browser.getNodeInnerWidth(self.domNode) - WA.browser.getNodeExternalWidth(self.domNodeSelector);
    if (width <= 0)
      return; // we do not calculate if width is still not OK

    // 2. draw each selector
    var pointer = 0;
    for (var i in self.tabselectors)
    {
      if (!self.tabselectors.hasOwnProperty(i))
        continue;

      self.tabselectors[i].resize();
      self.tabselectors[i].domNode.style.left = pointer + 'px';
      pointer += WA.browser.getNodeOuterWidth(self.tabselectors[i].domNode);
    }

    self.availablewidth = width - WA.browser.getNodeOuterWidth(self.domNodeSelect);
    if (pointer <= self.availablewidth)
    {
      self.domNodeLeft.style.display = 'none';
      self.domNodeRight.style.display = 'none';
      self.domNodetabscontainer.style.left = '0px';

      self.selectorsize = self.availablewidth;
    }
    else
    {
      self.domNodeLeft.style.display = '';
      self.domNodeRight.style.display = '';
      self.availablewidth -= WA.browser.getNodeOuterWidth(self.domNodeLeft) + WA.browser.getNodeOuterWidth(self.domNodeRight);
      self.selectorsize = pointer;
    }
    // check if selectoroffset is not out of bounds (specially afer a close tab)
    if (self.selectoroffset > self.selectorsize - self.availablewidth)
      self.selectoroffset = self.selectorsize - self.availablewidth;

    self.domNodetabscontainer.style.width = self.availablewidth + 'px';
    self.domNodetabs.style.left = -self.selectoroffset + 'px';
  }

  function resizeZone()
  {
    // put zones and selector at max possible size !
    if (self.code.attributes.height && self.code.attributes.height != 'auto')
    {
      var height = WA.browser.getNodeInnerHeight(self.domNode) - WA.browser.getNodeExtraHeight(self.domNodeZones) - WA.browser.getNodeOuterHeight(self.domNodeSelector);
      // IE6 ERROR !
      if (height >= 0)
        self.domNodeZones.style.height = height + 'px';
    }
    else
      self.domNodeZones.style.height = '';

    // we resize the active zone ?
//    if (self.zoneactive)
//    {
//      self.tabzones[self.zoneactive].resize();
//    }
  }

  function resizeList()
  {
    // 2. fill the selector before show
    self.domNodeList.innerHTML = '';
    for (var i in self.tabselectors)
    {
      var node = document.createElement('div');
      if (self.zoneactive == i)
        node.className = 'listelementselect';
      else
        node.className = 'listelement';
      node.innerHTML = self.tabselectors[i].title;
      node.onclick = self.tabselectors[i].click;
      self.domNodeList.appendChild(node);
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
    if (!WA.Containers.tabContainer.source.resize.call(self))
      return;
    // 1rst resize selector
    resizeSelector();
    // 2. get the position and place for zones based on selector type
    resizeZone();
    // 3. resize the list
    resizeList();
  }

  this.newZone = newZone;
  function newZone(id, title, classname, style, application, closeable, shortcut, params)
  {
    var code = {};
    code.tag = 'zone';
    code.attributes = {id: id, title:title, classname:classname, style:style, closeable:closeable,shortcut:shortcut,application:application,params:params};
    self.app.createTree(self, code);
  }

  // id is unique id, code are all needed parameters
  this.createZone = createZone;
  function createZone(id, code, notify)
  {
    var ldomID = WA.parseID(id, self.xdomID);
    if (!ldomID)
      throw 'Error: the zone id is not valid in tabContainer.createZone: id=' + domID;
    // check the zone does not exists YET !
    if (self.zones[ldomID[2]])
      throw 'Error: the zone already exists in tabContainer.createZone: id=' + ldomID[2];

    // 1. call event precreate, can we create ?
    if (!self.callEvent('precreate', {id:ldomID[2]}))
      return null;

    // the selector IS part of the 4glTree since it is asimilated to a zone, but NOT part of the app uids
    var s = new WA.Containers.tabContainer.tabSelector(self, ldomID[3] + '_selector', ldomID[2], code);
    self.tabselectors[ldomID[2]] = s;

    var z = new WA.Containers.tabContainer.tabZone(self, ldomID[3], code, notify);
    self.tabzones[ldomID[2]] = z;

    if (!self.zoneactive)
    {
      self.zoneactive = ldomID[2];
      s.select();
      z.show();
    }

    self.callEvent('postcreate', {id:ldomID[2]});
    if (self.state == 5)
    {
      s.propagate('start');
      z.propagate('start');
      self.resize();
      if (self.hassound)
        WA.Managers.sound.startSound('tabopen');
    }
    return z;
  }

  this.showZone = showZone;
  function showZone(id)
  {
    var ldomID = WA.parseID(id, self.xdomID);
    if (!ldomID)
      throw 'Error: the zone id is not valid in tabContainer.showZone: id=' + id;
    // check the zone does not exists YET !
    if (!self.tabzones[ldomID[2]])
      throw 'Error: the zone does not exists in tabContainer.showZone: id=' + ldomID[2];
    var result = true;
    result &= self.callEvent('preshow', ldomID[2]);
    if (self.zoneactive && ldomID[2] !== self.zoneactive)
      result &= self.callEvent('prehide', self.tabzones[self.zoneactive].xdomID[2]);
    if (!result)
      return;

    // first hide actual
    if (self.zoneactive && ldomID[2] !== self.zoneactive)
    {
      self.tabselectors[self.zoneactive].unselect();
      self.tabzones[self.zoneactive].hide();
      self.callEvent('posthide', self.tabzones[self.zoneactive].xdomID[2]);
       self.tabzones[self.zoneactive].propagate('blur');
      self.zoneactive = null;
    }

    // then show the specified zone
    self.tabselectors[ldomID[2]].select();
    self.tabzones[ldomID[2]].show();
    self.zoneactive = ldomID[2];
    self.callEvent('postshow', ldomID[2]);
    self.tabzones[ldomID[2]].propagate('focus');
    if (self.state == 5)
    {
      self.resize();
    }
  }

  this.activateZone = activateZone;
  function activateZone(id)
  {
    self.showZone(id);
  }

  this.destroyZone = destroyZone;
  function destroyZone(id)
  {
    var ldomID = WA.parseID(id, self.xdomID);
    if (!ldomID)
      throw 'Error: the zone id is not valid in tabContainer.showZone: id=' + id;
    // check the zone does not exists YET !
    if (!self.tabzones[ldomID[2]])
      throw 'Error: the zone does not exists in tabContainer.showZone: id=' + ldomID[2];

    // 2. call event predestroy
    if (!self.callEvent('predestroy', {id:ldomID[2]}) )
      return;

    var available = null;
    if (ldomID[2] == self.zoneactive)
    {
      var next = false;
      // take next available
      for (var i in self.tabzones)
      {
        if (i == self.zoneactive && available == null)
        {
          next = true;
          continue;
        }
        if (i == self.zoneactive)
          break;
        available = i;
        if (next)
          break;
      }
    }

    if (self.status == 5)
      self.tabselectors[ldomID[2]].propagate('stop');
    self.tabselectors[ldomID[2]].destroy(false);
    delete self.tabselectors[ldomID[2]];

    self.app.destroyTree(ldomID[2]);
    delete self.tabzones[ldomID[2]];

    if (ldomID[2] == self.zoneactive)
    {
      self.zoneactive = null;
      if (available)
        self.activateZone(available);
    }

    self.callEvent('postdestroy', {id:ldomID[2]});
    self.propagate('resize');
  }

  function start()
  {
    if (self.hasdd)
      WA.Managers.dd.registerGroup(self.domID, 'caller', true, self.domNodetabscontainer, null);

    if (self.hassound)
    {
      if (self.soundopen)
        WA.Managers.sound.addSound('tabopen', self.soundopen);
      if (self.soundchange)
        WA.Managers.sound.addSound('tabchange', self.soundchange);
      if (self.soundclose)
        WA.Managers.sound.addSound('tabclose', self.soundclose);
    }

    if (self.zoneactive && self.tabzones[self.zoneactive])
      self.activateZone(self.tabzones[self.zoneactive].domID);
    WA.Managers.event.on('click', self.domNodeLeft, self.clickleft, true);
    WA.Managers.event.on('click', self.domNodeRight, self.clickright, true);
    WA.Managers.event.on('click', self.domNodeSelect, self.clickselect, true);
    WA.Managers.event.on('mousedown', self.domNodeLeft, WA.browser.cancelEvent, true);
    WA.Managers.event.on('mousedown', self.domNodeRight, WA.browser.cancelEvent, true);
    WA.Managers.event.on('mousedown', self.domNodeSelect, WA.browser.cancelEvent, true);
    self.resize();
  }

  function stop()
  {
    WA.Managers.event.off('click', self.domNodeLeft, self.clickleft, true);
    WA.Managers.event.off('click', self.domNodeRight, self.clickright, true);
    WA.Managers.event.off('click', self.domNodeSelect, self.clickselect, true);
    WA.Managers.event.off('mousedown', self.domNodeLeft, WA.browser.cancelEvent, true);
    WA.Managers.event.off('mousedown', self.domNodeRight, WA.browser.cancelEvent, true);
    WA.Managers.event.off('mousedown', self.domNodeSelect, WA.browser.cancelEvent, true);
    for (var i = 0; i < self.tabselectors.length; i++)
    {
      self.tabselectors[i].stop();
    }
  }


  this.destroy = destroy;
  function destroy(fast)
  {
    self.tabselectors = null;
    self.tabzones = null;
    self.domNodeSelector = null;
    self.domNodeZones = null;
    self.domNodetabs = null;
    self.domNodeLeft = null;
    self.domNodeRight = null;
    self.domNodeZones = null;
    WA.Containers.tabContainer.source.destroy.call(self, fast);
    self = null;
  }

  this.setTitle = setTitle;
  function setTitle(id, title)
  {
    var ldomID = WA.parseID(id, self.xdomID);
    if (!ldomID)
      throw 'Error: the zone id is not valid in tabContainer.setTitle: id=' + id;
    // check the zone does not exists YET !
    if (!self.tabselectors[ldomID[2]])
      throw 'Error: the zone does not exists in tabContainer.setTitle: id=' + ldomID[2];

    self.tabselectors[ldomID[2]].setTitle(title);
    self.propagate('resize');
  }

  this.disableTab = disableTab;
  function disableTab(id)
  {
    var ldomID = WA.parseID(id, self.xdomID);
    if (!ldomID)
      throw 'Error: the zone id is not valid in tabContainer.showZone: id=' + id;
    // check the zone does not exists YET !
    if (!self.tabselectors[ldomID[2]])
      throw 'Error: the zone does not exists in tabContainer.showZone: id=' + ldomID[2];

    self.tabselectors[ldomID[2]].disable();
  }

  this.enableTab = enableTab;
  function enableTab(id)
  {
    var ldomID = WA.parseID(id, self.xdomID);
    if (!ldomID)
      throw 'Error: the zone id is not valid in tabContainer.showZone: id=' + id;
    // check the zone does not exists YET !
    if (!self.tabselectors[ldomID[2]])
      throw 'Error: the zone does not exists in tabContainer.showZone: id=' + ldomID[2];

    self.tabselectors[ldomID[2]].enable();
  }

  // **************************************************************************
  // PRIVATE METHODS
  // **************************************************************************
  this.moving = moving;
  function moving(order, tabid, metrics)
  {
    if (order == 'start')
    {
      var thetab = '';
      for (var i in self.tabselectors)
      {
        if (i + '_selector' == tabid)
          thetab = i;
      }
      self.tabselectors[thetab].domNode.style.zIndex = '2';
      self.startPos = self.selectoroffset + metrics.mainleftstart;
    }
    else if (order == 'drag')
    {
      var pointer = parseInt(self.startPos + metrics.xrelativejailed, 10);
      if (pointer < 0)
        pointer = 0;
      var previous = null;
      var next = null;
      var pnswitch = false;
      var thetab = '';
      var before = null;
      var after = null;
      // interchange the tabs if in limits
      for (var i in self.tabselectors)
      {
        if (i + '_selector' != tabid && !pnswitch)
        {
          previous = parseInt(self.tabselectors[i].domNode.style.left, 10);
          before = i;
        }
        if (i + '_selector' != tabid && pnswitch)
        {
          next = parseInt(self.tabselectors[i].domNode.style.left, 10);
          after = i;
          break;
        }
        if (i + '_selector' == tabid)
        {
          pnswitch = true;
          thetab = i;
        }
      }
      if (previous !== null && pointer <= previous)
      {
        var newtab1 = {};
        var newtab2 = {};
        for (var i in self.tabselectors)
        {
          if (i == thetab)
            continue;
          if (i == before)
          {
            newtab1[thetab] = self.tabselectors[thetab];
            newtab2[thetab] = self.tabzones[thetab];
          }
          newtab1[i] = self.tabselectors[i];
          newtab2[i] = self.tabzones[i];
        }
        self.tabselectors = newtab1;
        self.tabzones = newtab2;
        self.resize();
      }
      if (next !== null && pointer > next)
      {
        var newtab1 = {};
        var newtab2 = {};
        for (var i in self.tabselectors)
        {
          if (i == thetab)
            continue;
          newtab1[i] = self.tabselectors[i];
          newtab2[i] = self.tabzones[i];
          if (i == after)
          {
            newtab1[thetab] = self.tabselectors[thetab];
            newtab2[thetab] = self.tabzones[thetab];
          }
        }
        self.tabselectors = newtab1;
        self.tabzones = newtab2;
        self.resize();
      }
      self.tabselectors[thetab].domNode.style.left = (pointer) + 'px';
    }
    else if (order == 'drop')
    {
      // set the new order of tabs
      var thetab = '';
      for (var i in self.tabselectors)
      {
        if (i + '_selector' == tabid)
          thetab = i;
      }
      self.tabselectors[thetab].domNode.style.zIndex = '';
      self.resize();
    }
  }

  this.clickleft = clickleft;
  function clickleft(e)
  {
    if (self.selectoroffset == 0)
      return;
    if (self.selectoroffset > 100 )
      self.selectoroffset -= 100;
    else
      self.selectoroffset = 0;
    self.domNodetabs.style.left = -self.selectoroffset + 'px';
    return WA.browser.cancelEvent(e);
  }

  this.clickright = clickright;
  function clickright(e)
  {
    if (self.selectoroffset == self.selectorsize - self.availablewidth)
      return;
    if (self.selectoroffset < self.selectorsize - self.availablewidth - 100)
      self.selectoroffset += 100;
    else
      self.selectoroffset = self.selectorsize - self.availablewidth;
    self.domNodetabs.style.left = -self.selectoroffset + 'px';
    return WA.browser.cancelEvent(e);
  }

  this.clickselect = clickselect;
  function clickselect(e)
  {
    // 1. show or hide the selector
    if (self.list)
    {
      self.domNodeList.style.display = 'none';
      self.list = false;
    }
    else
    {
      self.domNodeList.style.display = '';
      self.list = true;
    }

    return WA.browser.cancelEvent(e);
  }

}

// Add basic container code
WA.extend(WA.Containers.tabContainer, WA.Managers.wa4gl._container);

WA.Containers.tabContainer.tabZone = function(maincontainer, domID, code, notify)
{
  var self = this;
  WA.Containers.tabContainer.tabZone.sourceconstructor.call(this, maincontainer, domID, code, 'div', { classname:'zone' }, notify);
//  this.visible = this.code.attributes.display?this.code.attributes.display!='none':true;
  maincontainer.domNodeZones.appendChild(this.domNode);

  this.resize = resize;
  function resize()
  {
    // cannot resize if not visible or not running
    if (!self.visible || !self.father.visible)
      return;
    if (self.father.code.attributes.height && self.father.code.attributes.height != 'auto')
    {
      var height = (WA.browser.getNodeInnerHeight(self.father.domNodeZones) - WA.browser.getNodeExtraHeight(self.domNode));

      // IE6 ERROR !
      if (height >= 0)
        self.domNode.style.height = height + 'px';
    }
    else
      self.domNode.style.height = '';

    // cannot resize if not visible or not running
    if (self.state != 5)
      return;
    // ask for an inner resize
    self.callEvent('pleaseresize');
  }

  this.destroy = destroy;
  function destroy(fast)
  {
    WA.Containers.tabContainer.tabZone.source.destroy.call(self, fast);
    self = null;
  }

}

// Add basic zone code
WA.extend(WA.Containers.tabContainer.tabZone, WA.Managers.wa4gl._zone);

// click the tab to select the zone !
// tab mode selector can be n, w, s, e, detach
WA.Containers.tabContainer.tabSelector = function(maincontainer, domID, domIDControl, code)
{
  var self = this;
  WA.Containers.tabContainer.tabSelector.sourceconstructor.call(this, maincontainer, domID, code, 'div', { classname:'taboff' }, null);
  this.domIDControl = domIDControl;

  this.enabled = true;
  this.active = false;
  this.moving = false;
  this.closeable = (code.attributes.closeable=='yes');
  this.title = code.attributes.title;

  // visible
  this.domNode.style.display = '';
  maincontainer.domNodetabs.appendChild(self.domNode);

  this.domNodeTitle = document.createElement('span');
  this.domNodeTitle.innerHTML = this.title;
  this.domNode.appendChild(this.domNodeTitle);

  this.domNodeMove = document.createElement('div');
  this.domNodeMove.id = this.domIDControl + '_move';
  this.domNodeMove.className = 'tabmove';
  this.domNodeMove.style.position = 'absolute';
  this.domNodeMove.style.display = 'none';
  this.domNode.appendChild(this.domNodeMove);

  this.domNodeClose = document.createElement('div');
  this.domNodeClose.className = 'tabclose';
  this.domNodeClose.style.position = 'absolute';
  this.domNodeClose.style.display = 'none';
  this.domNode.appendChild(this.domNodeClose);

  this.addEvent('start', start);
  this.addEvent('resize', resize);
  this.addEvent('stop', stop);

  function resize()
  {
    self.domNode.className = 'tab'+self.getType();

    self.domNodeTitle.innerHTML = self.title;
    if (self.closeable)
    {
      self.domNodeClose.style.display = '';
      self.domNodeClose.style.top = '0px';
      self.domNodeClose.style.right = '3px';
      self.domNode.style.paddingRight = '17px';
    }
    else
      self.domNodeClose.style.display = 'none';
      
    if (self.father.changeorder)
    {
      self.domNodeMove.style.display = '';
      self.domNodeMove.style.top = '0px';
      self.domNodeMove.style.right = self.closeable?'15px':'3px';
      self.domNode.style.paddingRight = self.closeable?'29px':'17px';
    }
    else
      self.domNodeMove.style.display = 'none';
  }

  this.setTitle = setTitle;
  function setTitle(title)
  {
    self.title = title;
    // we have to repaint all because of sizes of new title
    self.father.resize();
  }

  this.getType = getType;
  function getType()
  {
    if (!self.enabled)
      return 'disable';
    if (self.active)
      return 'on';
    return 'off';
  }

  this.click = click;
  function click(e)
  {
    if (!self.enabled)
    {
      return;
    }
    if (self.moving)
    {
      self.moving = false;
//      WA.browser.cancelEvent(e);
//      return;
    }
    if (self.father.hassound)
      WA.Managers.sound.startSound('tabchange');
    // call container change tab
    self.father.activateZone(self.domIDControl);
//    WA.browser.cancelEvent(e);
  }

  this.clickclose = clickclose;
  function clickclose(e)
  {
    if (self.moving)
    {
      self.moving = false;
//      WA.browser.cancelEvent(e);
//      return;
    }
    if (self.father.hassound)
      WA.Managers.sound.startSound('tabclose');
    // the call close if available
    setTimeout(function() { self.father.destroyZone(self.domIDControl); }, 0);
    WA.browser.cancelEvent(e);
  }

  this.shortcut = shortcut;
  function shortcut(e, type)
  {
    if (self.father.hassound)
      WA.Managers.sound.startSound('tabchange');
    self.father.activateZone(self.domIDControl);
    WA.browser.cancelEvent(e);
  }

  this.moving = moving;
  function moving(order, id1, id2, zone, metrics)
  {
    self.moving = true;
    self.father.moving(order, self.xdomID[2], metrics);
  }

  function start()
  {
    WA.Managers.event.on('mousedown', self.domNode, self.click, true);
    WA.Managers.event.on('click', self.domNodeClose, self.clickclose, true);
    // we check if there is any shortcut
    if (self.code.attributes.shortcut != undefined)
      WA.Managers.event.key(self.code.attributes.shortcut, self.shortcut);

    if (self.father.hasdd && self.father.changeorder)
      WA.Managers.dd.registerObject(self.father.domID, self.domNodeMove, self.domNode, moving, null);
  }

  this.select = select;
  function select()
  {
    self.active = true;
    resize();
  }

  this.unselect = unselect;
  function unselect()
  {
    self.active = false;
    resize();
  }

  this.enable = enable;
  function enable()
  {
    self.enabled = true;
    resize();
  }

  this.disable = disable;
  function disable()
  {
    self.enabled = false;
    resize();
  }

  this.enableClose = enableClose;
  function enableClose()
  {
    self.closeable = true;
    resize();
  }

  this.disableClose = disableClose;
  function disableClose()
  {
    self.closeable = false;
    resize();
  }

  function stop()
  {
    if (self.father.hasdd && self.father.changeorder)
      WA.Managers.dd.unregisterObject(self.father.domID, self.domNode);
    if (self.code.attributes.shortcut != undefined)
      WA.Managers.event.removeKey(self.code.attributes.shortcut);
    WA.Managers.event.off('mousedown', self.domNodeTitle, self.click, true);
    WA.Managers.event.off('click', self.domNodeClose, self.clickclose, true);
  }

  this.destroy = destroy;
  function destroy(fast)
  {
    self.domNodeTitle = null;
    self.domNodeClose = null;
    WA.Containers.tabContainer.tabSelector.source.destroy.call(self, fast);
    self = null;
  }

}

// Add basic zone code
WA.extend(WA.Containers.tabContainer.tabSelector, WA.Managers.wa4gl._zone);

// User may replace those with default system sounds for tab container
WA.Containers.tabContainer.soundopen = WA.Managers.sound.tabcontainersoundopen?WA.Managers.sound.tabcontainersoundopen:null;
WA.Containers.tabContainer.soundchange = WA.Managers.sound.tabcontainersoundchange?WA.Managers.sound.tabcontainersoundchange:null;
WA.Containers.tabContainer.soundclose = WA.Managers.sound.tabcontainersoundclose?WA.Managers.sound.tabcontainersoundclose:null;
