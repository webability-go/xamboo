
/*
    expandableContainer.js, WAJAF, the WebAbility(r) Javascript Application Framework
    Contains container to control a zone to open/close vertically
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
   * classname         default class: %container.classnamezone
   title               default: ''
   closed              default: no ; possible: no/yes
   display             default: ''
   classnameselector   default: classname || %container.classname
*/

// domID is string id of node. If WA.toDOM(domID) is null , then a new division is created
WA.Containers.expandableContainer = function(domNodeFather, domID, params, notify, _4glNode)
{
  var self = this;
  WA.Containers.expandableContainer.sourceconstructor.call(this, domNodeFather, domID, params, notify, _4glNode, { classname:'expandable', classnameselector:'expandableselector', classnamezone:'expandablezone' }, 'div');
  this.selectors = {};
  this.anim = !!WA.Managers.anim && this.params.attributes.anim!='no';

  // ========================================================================================
  // standard system functions

  this.start = start;
  function start()
  {
    if (!WA.Containers.expandableContainer.source.start.call(self))
      return;
    for (var i in self.selectors)
    {
      if (self.selectors.hasOwnProperty(i))
        self.selectors[i].start();
    }
  }

  this.resize = resize;
  function resize()
  {
    // default main container resize
    if (!WA.Containers.expandableContainer.source.resize.call(self))
      return;
    // resize selectors and zones if needed
    for (var i in self.selectors)
    {
      if (self.selectors.hasOwnProperty(i))
        self.selectors[i].resize();
    }
    for (var i in self.zones)
    {
      if (self.zones.hasOwnProperty(i))
        self.zones[i].resize();
    }
  }

  this.stop = stop;
  function stop()
  {
    if (!WA.Containers.expandableContainer.source.stop.call(self))
      return;
    for (var i in self.selectors)
    {
      if (self.selectors.hasOwnProperty(i))
        self.selectors[i].stop();
    }
  }

  // the zone is the domID itself. id is ignored. params may have 'classname'
  this.createZone = createZone;
  function createZone(id, params, notify, _4gl)
  {
    var ldomID = WA.parseID(id, self.xdomID);
    if (!ldomID)
      throw 'Error: the zone id is not valid in expandableContainer.createZone: id=' + domID;
    // check the zone does not exists YET !
    if (self.zones[ldomID[2]])
      throw 'Error: the zone already exists in expandableContainer.createZone: id=' + ldomID[2];

    if (!_4gl && self._4glNode)
    {
      // we create a 4GL Node (which should call again this method in 4GL Mode)
      if (!params.tag) params.tag = 'zone';
      if (!params.attributes) params.attributes = {};
      if (!params.attributes.id) params.attributes.id = ldomID[2];

      self._4glNode.createTree(self.xdomID[2], params);
      return null;
    }

    // 1. call event precreate, can we create ?
    if (!self._callNotify('precreate', {id:ldomID[2]}))
      return null;

    var s = new WA.Containers.expandableContainer.expandableSelector(self, ldomID[3] + '_selector', ldomID[2], params);
    self.selectors[ldomID[2]] = s;
    var z = new WA.Containers.expandableContainer.expandableZone(self, ldomID[3], params, notify);
    self.zones[ldomID[2]] = z;
    self._callNotify('postcreate', {id:ldomID[2]});
    if (self.running)
    {
      s.start();
      z.start();
    }
    return z;
  }

  this.showZone = showZone;
  function showZone(id)
  {
    var ldomID = WA.parseID(id, self.xdomID);

    if (!ldomID) // bad zone
      return;

    // 1. call event preshow
    if (!self._callNotify('preshow', {id:ldomID[2]}))
      return;

    self.selectors[ldomID[2]].show();
    self.zones[ldomID[2]].show();
    self._callNotify('postshow', {id:ldomID[2]});

    // anim zone show
  }

  this.hideZone = hideZone;
  function hideZone(id)
  {
    var ldomID = WA.parseID(id, self.xdomID);

    if (!ldomID) // bad zone
      return;

    // 1. call event prehide/show
    if (!self._callNotify('prehide', {id:ldomID[2]}))
      return;

    self.selectors[ldomID[2]].hide();
    self.zones[ldomID[2]].hide();
    self._callNotify('posthide', {id:ldomID[2]});

    // anim zone hide
  }

  this.activateZone = activateZone;
  function activateZone(id)
  {
    self.openZone(id);
  }

  this.openZone = openZone;
  function openZone(id)
  {
    var ldomID = WA.parseID(id, self.xdomID);

    if (!ldomID) // bad zone
      return;

    // 1. call event preshow
    if (!self._callNotify('preopen', {id:ldomID[2]}))
      return;

    self.selectors[ldomID[2]].open();
    self.zones[ldomID[2]].open();
    self._callNotify('postopen', {id:ldomID[2]});

    // anim zone open
    if (self.anim)
      WA.get(self.zones[ldomID[2]].domNode).openV(3000);
  }

  function zoneopened()
  {
    alert('opened');
  }

  this.closeZone = closeZone;
  function closeZone(id)
  {
    var ldomID = WA.parseID(id, self.xdomID);

    if (!ldomID) // bad zone
      return;

    // 1. call event preshow
    if (!self._callNotify('preclose', {id:ldomID[2]}))
      return;

    // anim zone close
    if (self.anim)
      WA.get(self.zones[ldomID[2]].domNode).closeV(10000);

    self.selectors[ldomID[2]].close();
    self.zones[ldomID[2]].close();
    self._callNotify('postclose', {id:ldomID[2]});

  }

  this.switchZone = switchZone;
  function switchZone(id)
  {
    var ldomID = WA.parseID(id, self.xdomID);

    if (!ldomID) // bad zone
      return;
    // 1. call event prehide/show
    if (self.zones[ldomID[2]].closed)
      self.openZone(ldomID[2]);
    else
      self.closeZone(ldomID[2]);
  }

  this.destroyZone = destroyZone;
  function destroyZone(id, _4gl)
  {
    if (!self.zones[id])
      return;

    if (!_4gl && self._4glNode)
    {
      self._4glNode.destroyNode(id);
      return;
    }

    // 2. call event predestroy
    if (!self._callNotify('predestroy', {id:id}) )
      return;

    self.zones[i].destroy();
    delete self.zones[i];
    self.selectors[i].destroy();
    delete self.selectors[i];

    self._callNotify('postdestroy', null);
  }

  this.destroy = destroy;
  function destroy(fast)
  {
    WA.Containers.expandableContainer.source.destroy.call(self, fast);
    delete self.selectors;

    self = null;
  }

  if (!_4glNode)
  {
    // we call all to setup things and start the node, since there is no 4gl node calling this.
    this.start();
    this.resize();
  }
}

// Add basic container code
WA.extend(WA.Containers.expandableContainer, WA.Managers.wa4gl._container);

// click the tab to select the zone !
// tab mode selector can be n, w, s, e, detach
WA.Containers.expandableContainer.expandableSelector = function(maincontainer, domID, domIDControl, params)
{
  var self = this;
  WA.Containers.expandableContainer.expandableSelector.sourceconstructor.call(this, maincontainer, domID, params, null, { classnameselector:maincontainer.classes.classnameselector }, 'div');
  this.domIDControl = domIDControl;
  this.domNode.style.position = 'relative';
  this.visible = this.params.attributes.display?this.params.attributes.display!='none':true;
  this.closed = this.params.attributes.closed?this.params.attributes.closed=='yes':false;
  this.domNode.className = this.classes.classnameselector + (this.closed?' close':' open');
  this.domNode.style.display = this.visible?'':'none';
  this.title = this.params.attributes.title!==undefined?this.params.attributes.title:'';
  WA.browser.setInnerHTML(this.domNode, this.title);

  this.setTitle = setTitle;
  function setTitle(title)
  {
    self.title = title;
    WA.browser.setInnerHTML(self.domNode, self.title);
  }

  this.paint = paint;
  function paint()
  {
    self.domNode.className = self.classes.classnameselector + (self.closed?' close':' open');
  }

  this.click = click;
  function click(e)
  {
    self.maincontainer.switchZone(self.domIDControl);
  }

  this.shortcut = shortcut;
  function shortcut(e, type)
  {
    self.maincontainer.switchZone(self.domIDControl);
    WA.browser.cancelEvent(e);
  }

  this.start = start;
  function start()
  {
    WA.Containers.expandableContainer.expandableSelector.source.start.call(this);
    WA.Managers.event.on('click', self.domNode, self.click, true);
    // we check if there is any shortcut
    if (self.params.attributes.shortcut != undefined)
      WA.Managers.event.key(self.params.attributes.shortcut, self.shortcut);
  }

  this.open = open;
  function open()
  {
    if (!self.closed)
      return;
    self.closed = false;
    self.paint();
  }

  this.close = close;
  function close()
  {
    if (self.closed)
      return;
    self.closed = true;
    self.paint();
  }

  this.stop = stop;
  function stop()
  {
    // we stop the key listener too if any
    if (self.params.attributes.shortcut != undefined)
      WA.Managers.event.keyoff(self.params.attributes.shortcut);
    WA.Managers.event.off('click', self.domNode, self.click, true);
    WA.Containers.expandableContainer.expandableSelector.source.stop.call(this);
  }

  this.destroy = destroy;
  function destroy(fast)
  {
    WA.Containers.expandableContainer.expandableSelector.source.destroy.call(self, fast);
    self = null;
  }

}

// selector is treated as a zone
WA.extend(WA.Containers.expandableContainer.expandableSelector, WA.Managers.wa4gl._zone);

WA.Containers.expandableContainer.expandableZone = function(maincontainer, domID, params, notify)
{
  var self = this;
  WA.Containers.expandableContainer.expandableZone.sourceconstructor.call(this, maincontainer, domID, params, notify, { classname:maincontainer.classes.classnamezone }, 'div');
  this.domNode.style.position = 'relative';
  this.visible = this.params.attributes.display?this.params.attributes.display!='none':true;
  this.closed = this.params.attributes.closed?this.params.attributes.closed=='yes':false;
  this.domNode.style.display = this.visible&&!this.closed?'':'none';
  if (this.params.attributes.size != undefined)
    this.domNode.style.height = this.params.attributes.size + 'px';

  this.show = show;
  function show()
  {
    if (self.visible)
      return;
    self.visible = true;
    if (!self.closed)
      self.domNode.style.display = '';
    self.resize();
  }

  this.open = open;
  function open()
  {
    if (!self.closed)
      return;
    self.closed = false;
    if (!self.visible)
      return;
    self.domNode.style.display = '';

    // Do we animate ?

    self.resize();
  }

  this.close = close;
  function close()
  {
    if (self.closed)
      return;
    self.closed = true;
    if (!self.visible)
      return;

    // Do we animate ?

    self.domNode.style.display = 'none';
  }

  this.resize = resize;
  function resize()
  {
    // cannot resize if not visible or not running
    if (!self.running || !self.visible || self.closed || !self.maincontainer.visible)
      return;
    self._callNotify('pleaseresize');
  }

  this.destroy = destroy;
  function destroy(fast)
  {
    WA.Containers.expandableContainer.expandableZone.source.destroy.call(self, fast);
    self = null;
  }

}

// Add basic zone code
WA.extend(WA.Containers.expandableContainer.expandableZone, WA.Managers.wa4gl._zone);

