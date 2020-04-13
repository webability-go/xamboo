
/*
    ddManager.js, WAJAF, the WebAbility(r) Javascript Application Framework
    Contains the Manager singleton to manage drag and drop facilities
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

WA.Managers.dd = new function()
{
  var self = this;
  this.groups = {};
  this.dragging = false;    // true if dragging
  this.groupid = null;      // group id if dragging
  this.listener = null;

  this.setListener = setListener;
  function setListener(listener)
  {
    self.listener = listener;
  }

  this.setMode = setMode;
  function setMode(groupid, mode)
  {
    if (self.groups[groupid])
      return self.groups[groupid].setMode(mode);
    return false;
  }

  this.setJail = setJail;
  function setJail(groupid, jail)
  {
    if (self.groups[groupid])
      return self.groups[groupid].setJail(jail);
    return false;
  }

  function callNotify(event)
  {
    if (self.listener)
    {
      self.listener(event, self.groupid);
    }
  }

  // create a new draggable group (logical)
  // mode is: 'copy': will make a full html copy of object to move and destroy the copy at the end of move, will move the original at the end,
  //          'border': will show a border to move and destroy the border at the end of move, will move the original at the end,
  //          'object': will move the object directly,
  //          'caller': let all the control to the caller and pass orders to feedback (caller can do whatever it wants)
  // jail is: true/false. If true, the object cannot go outside the container, if no container, jail into document
  // feedback is a multipurpose function:
  // seed feedback for 'start', 'drag', and 'drop', and can ask 'asknode' for container main node to copy, or size for block move and jail.
  this.registerGroup = registerGroup;
  function registerGroup(groupid, mode, jail, container, feedback)
  {
    var g = new WA.Managers.dd.Group(groupid, mode, jail, container, feedback);
    if (g)
      self.groups[groupid] = g;
    return g;
  }

  // add the id to draggable objects
  // feedback replace group one if present
  this.registerObject = registerObject;
  function registerObject(groupid, domNode, domNodeMain, feedback, mode)
  {
    if (self.groups[groupid])
      return self.groups[groupid].registerObject(domNode, domNodeMain, feedback, mode);
    return false;
  }

  this.setObjectMode = setObjectMode;
  function setObjectMode(groupid, domNode, mode)
  {
    if (self.groups[groupid])
      return self.groups[groupid].setObjectMode(domNode, mode);
    return false;
  }

  // add the id to dropable zones
  // feedback replace group one if present
  this.registerZone = registerZone;
  function registerZone(groupid, domNode, feedback)
  {
    if (self.groups[groupid])
      return self.groups[groupid].registerZone(domNode, feedback);
    return false;
  }

  // add the id from dropable zones
  this.unregisterZone = unregisterZone;
  function unregisterZone(groupid, domNode)
  {
    if (!self)  // sometimes the manager can be unloaded before callers on page unload
      return;
    if (self.groups[groupid])
      return self.groups[groupid].unregisterZone(domNode);
    return false;
  }

  // remove the id from draggable objects
  this.unregisterObject = unregisterObject;
  function unregisterObject(groupid, domNode)
  {
    if (!self)  // sometimes the manager can be unloaded before callers on page unload
      return;
    if (self.groups[groupid])
      return self.groups[groupid].unregisterObject(domNode);
    return false;
  }

  this.unregisterGroup = unregisterGroup;
  function unregisterGroup(groupid)
  {
    if (!self)  // sometimes the manager can be unloaded before callers on page unload
      return;
    // destroy anything
    if (self.groups[groupid])
    {
      self.groups[groupid].destroy();
      delete self.groups[groupid];
      return true;
    }
    return false;
  }

  this.setDragging = setDragging;
  function setDragging(dragging)
  {
    self.dragging = dragging;
  }

  this.isDragging = isDragging;
  function isDragging()
  {
    return (self.dragging || self.groupid)?true:false;
  }

  function drag(e)
  {
    if (!self.dragging)
    {
      if (self.groupid)
      {
        callNotify('start');
        self.groups[self.groupid].start();
      }
      else
        return;
    }
    callNotify('drag');
    self.groups[self.groupid].drag(e);
  }

  function stop(e)
  {
    if (!self.groupid)
      return;
    callNotify('stop');
    self.groups[self.groupid].stop(e);
    self.dragging = false;
    self.groupid = null;
  }

  function destroy()
  {
    self.listener = null;
    for (var i in self.groups)
    {
      self.groups[i].destroy();
      delete self.groups[i];
    }
    // eventManager will take charge of off(mousemove & mouseup & all others)
    self = null;
  }

  WA.Managers.event.addListener('mousemove', document, drag, true);
  WA.Managers.event.addListener('mouseup', document, stop, true);
  WA.Managers.event.registerFlush(destroy);

}();

WA.Managers.dd.Group = function(groupid, mode, jail, container, feedback)
{
  var self = this;
  this.id = groupid;
  this.mode = mode;
  this.jail = jail;
  if (typeof container == 'string')
    container = WA.getDomNode(container);
  this.container = container;
  this.feedback = feedback;
  this.timeoutdrag = 300;     // time out to really start drag

  this.objects = {};
  this.zones = {};

  this.domNodeLink = null;    // node where the clik/drag happens (usually some child of mainNode
  this.domNodeMain = null;    // main node to copy/track/move
  this.domNodeDrag = null;    // the node we are actually dragging (can be mainNode or a copy of it or a special div/border node
  this.actualzone = null;

  // metrics object with all coords: all left and top moves with each drag call, others are constants
  // jail = the jail data or document
  // zone = the zone the node is into (only if)
  // node = the dragged node
  // drag/mouse: relative data

/*
  |    |     |-------|     |      |
  doc  jail  node

  zone: id of zone
  zone*: metrics data of zone INTO DOCUMENT, fixed data, may change over time if asked by "resize"
  jail*: metrics data of jail INTO DOCUMENT, fixed data, may change over time if asked by "resize"
  nodedocument*, nodejailed*, nodezone*: metrics of node into any containers
  startmousenode*, startmousezone*, startmousejail*, startmousedocument*: coords of mouse into all containers
  mousenode*, mousezone*, mousejail*, mousedocument*: coords of mouse into all containers
  mouserelativejail*, mouserelativedocument*
OJO: considerar scrollwidth si jail es overflow/scroll
*/

  this.metrics = {
                   nodewidth:0, nodeheight:0,                         // dragged node metrix
                   jailwidth:0, jailheight:0,                         // jail metrix if any jail, or the container
                   containerwidth:0, containerheight:0,               // the container metrix

                   nodeleftstart:0, nodetopstart:0,                   // FIXED DATA node start metrix into container
                   nodeleftstartdocument:0, nodetopstartdocument:0,   // FIXED DATA node start metrix into document

                   nodeleft:0, nodetop:0,                             // dragged node metrix into container
                   nodeleftdocument:0, nodetopdocument:0,             // dragged node metrix into document
                   scrollleft: 0, scrolltop: 0,                       //
                   jailleft:0, jailtop:0,                             // FIXED DATA, jail metrix if any jail

                   zone: 0,






                  mainoffsetwidth:0, mainoffsetheight:0,             // dragged node metrix
                  dragleft:0, dragtop:0,                             // dragged node position into container
                  dragdocumentleft:0, dragdocumenttop:0,             // dragged node position into document
                  xstartmouse:0, ystartmouse:0,                      // FIXED DATA start mouse document position
                  xstartjailed:0, ystartjailed:0,                    // FIXED DATA start jailed position (same as mouse if not jailed)
                  xmouse:0, ymouse:0,                                // mouse document position
                  xjailed:0, yjailed:0,                              // jailed position (same as mouse if not jailed)
                  xrelativemouse:0, yrelativemouse:0,                // relative x/y from mouse start
                  xrelativejailed:0, yrelativejailed:0               // relative jailed x/y from mouse start (same as mouse if not jailed)
                 };

  this.timer = null;          // timer to really start drag

  this.setMode = setMode;
  function setMode(mode)
  {
    if (WA.Managers.dd.isDragging())
      return false;
    self.mode = mode;
    return true;
  }

  this.setJail = setJail;
  function setJail(jail)
  {
    if (WA.Managers.dd.isDragging())
      return false;
    self.jail = jail;
    return true;
  }

  this.registerObject = registerObject;
  function registerObject(domNode, domNodeMain, feedback, mode)
  {
    if (typeof domNode == 'string')
      domNode = WA.getDomNode(domNode);
    if (!domNode)
      return false;
    if (typeof domNodeMain == 'string')
      domNodeMain = WA.getDomNode(domNodeMain);
    if (!domNodeMain)
      domNodeMain = domNode;
    self.objects[domNode.id] = { domID: domNode.id, domNode: domNode, domNodeMain: domNodeMain, mode: (mode?mode:self.mode), feedback: (feedback?feedback:self.feedback)};
    WA.Managers.event.on('mousedown', domNode, down, true);
    return true;
  }

  this.setObjectMode = setObjectMode;
  function setObjectMode(domNode, mode)
  {
    if (WA.Managers.dd.isDragging())
      return null;
    if (typeof domNode == 'string')
      domNode = WA.getDomNode(domNode);
    if (!domNode)
      return false;
    if (self.objects[domNode.id])
      self.objects[domNode.id].mode = (mode?mode:self.mode);
    return true;
  }

  this.registerZone = registerZone;
  function registerZone(domNode, feedback)
  {
    if (typeof domNode == 'string')
      domNode = WA.getDomNode(domNode);
    if (!domNode)
      return false;
    self.zones[domNode.id] = { domID: domNode.id, domNode: domNode, feedback: (feedback?feedback:self.feedback)};
    return true;
  }

  this.unregisterZone = unregisterZone;
  function unregisterZone(domNode)
  {
    if (typeof domNode == 'string')
      domNode = WA.getDomNode(domNode);
    if (!domNode)
      return false;
    if (self.zones[domNode.id])
      delete self.zones[domNode.id];
    return true;
  }

  this.unregisterObject = unregisterObject;
  function unregisterObject(domNode)
  {
    if (typeof domNode == 'string')
      domNode = WA.getDomNode(domNode);
    if (!domNode)
      return false;
    if (self.objects[domNode.id])
    {
      WA.Managers.event.off('mousedown', domNode, down, true);
      delete self.objects[domNode.id];
    }
    return true;
  }

  function clearmetrics()
  {
    for (i in self.metrics)
      self.metrics[i] = 0;
  }

  this.calcjail = calcjail;
  function calcjail()
  {
    if (self.jail)
    {
      self.metrics.jailleft = self.container?WA.browser.getNodeDocumentLeft(self.container) + WA.browser.getNodeBorderLeftWidth(self.container):0;
      self.metrics.jailtop = self.container?WA.browser.getNodeDocumentTop(self.container) + WA.browser.getNodeBorderTopHeight(self.container):0;
      self.metrics.jailwidth = self.container?WA.browser.getNodeInnerWidth(self.container):WA.browser.getDocumentWidth();
      self.metrics.jailheight = self.container?WA.browser.getNodeInnerHeight(self.container):WA.browser.getDocumentHeight();
      self.metrics.jailscrollleft = self.container.scrollLeft;
      self.metrics.jailscrolltop = WA.browser.getNodeTotalScrollTop(self.container);
    }
    else
    {
      self.metrics.jailleft = self.metrics.jailtop = 0;
      self.metrics.jailwidth = WA.browser.getDocumentWidth();
      self.metrics.jailheight = WA.browser.getDocumentHeight();
      self.metrics.jailscrollleft = 0;
      self.metrics.jailscrolltop = 0;
    }
  }

  this.calccontainer = calccontainer;
  function calccontainer()
  {
    if (self.jail)
    {
      self.metrics.jailleft = self.container?WA.browser.getNodeDocumentLeft(self.container) + WA.browser.getNodeBorderLeftWidth(self.container):0;
      self.metrics.jailtop = self.container?WA.browser.getNodeDocumentTop(self.container) + WA.browser.getNodeBorderTopHeight(self.container):0;
      self.metrics.jailwidth = self.container?WA.browser.getNodeInnerWidth(self.container):WA.browser.getDocumentWidth();
      self.metrics.jailheight = self.container?WA.browser.getNodeInnerHeight(self.container):WA.browser.getDocumentHeight();
    }
    else
    {
      self.metrics.jailleft = self.metrics.jailtop = 0;
      self.metrics.jailwidth = WA.browser.getDocumentWidth();
      self.metrics.jailheight = WA.browser.getDocumentHeight();
    }
  }

  // fill metrics with constants values
  function initmetrics()
  {
    calcjail();

    self.metrics.mainwidth = WA.browser.getNodeWidth(self.domNodeMain);
    self.metrics.mainheight = WA.browser.getNodeHeight(self.domNodeMain);
    self.metrics.mainoffsetwidth = WA.browser.getNodeOffsetWidth(self.domNodeMain);
    self.metrics.mainoffsetheight = WA.browser.getNodeOffsetHeight(self.domNodeMain);

    self.metrics.xstartjailed = self.metrics.xstartmouse - self.metrics.jailleft;
    self.metrics.ystartjailed = self.metrics.ystartmouse - self.metrics.jailtop;
  }

  function down(e)
  {
    if (WA.Managers.dd.isDragging())
      return null;

    clearmetrics();

    self.metrics.xstartmouse = WA.browser.getCursorDocumentX(e);
    self.metrics.ystartmouse = WA.browser.getCursorDocumentY(e);

    self.domNodeLink = WA.browser.getCursorNode(e);
    if (!self.objects[self.domNodeLink.id])
    {
      // search for parent nodes ??
      while (self.domNodeLink != null && self.domNodeLink != window.document)
      {
        self.domNodeLink = self.domNodeLink.parentNode;
        if (self.objects[self.domNodeLink.id])
          break;
      }
      if (!self.objects[self.domNodeLink.id])
        return null;
    }

    self.timer = setTimeout( function() { self.start(); }, self.timeoutdrag );
    WA.Managers.dd.groupid = self.id;

    return WA.browser.cancelEvent(e);
  }

  this.start = start;
  function start()
  {
    if (self.timer)
    {
      clearTimeout(self.timer);
      self.timer = null;
    }
    if (!self.domNodeLink)
      return;
    WA.Managers.dd.setDragging(true);
    // we get main node to drag
    self.domNodeMain = self.objects[self.domNodeLink.id].domNodeMain;
    // we get metrics of main node and container
    initmetrics();
    self.metrics.dragleft = self.metrics.mainleftstart = self.metrics.mainleft = WA.browser.getNodeNodeLeft(self.domNodeMain, self.container);
    self.metrics.dragtop = self.metrics.maintopstart = self.metrics.maintop = WA.browser.getNodeNodeTop(self.domNodeMain, self.container);
    self.metrics.dragdocumentleft = self.metrics.maindocumentleftstart = self.metrics.maindocumentleft = WA.browser.getNodeDocumentLeft(self.domNodeMain);
    self.metrics.dragdocumenttop = self.metrics.maindocumenttopstart = self.metrics.maindocumenttop = WA.browser.getNodeDocumentTop(self.domNodeMain);

    switch(self.objects[self.domNodeLink.id].mode)
    {
      case 'copy':
        // we make a full copy
        self.domNodeDrag = self.domNodeMain.cloneNode(true);
        self.domNodeDrag.className += ' dragged';
        // we get absolute coords and set them
        self.domNodeDrag.style.position = 'absolute';
        self.domNodeDrag.style.left = self.metrics.dragdocumentleft + 'px';
        self.domNodeDrag.style.top = self.metrics.dragdocumenttop + 'px';
        self.domNodeDrag.style.width = self.metrics.mainwidth + 'px';
        self.domNodeDrag.style.height = self.metrics.mainheight + 'px';
        // we append to the main document the DOM
        document.body.appendChild(self.domNodeDrag);
        break;
      case 'border':
        self.domNodeDrag = document.createElement('div');
        self.domNodeDrag.style.position = 'absolute';
        self.domNodeDrag.style.left = self.metrics.dragdocumentleft + 'px';
        self.domNodeDrag.style.top = self.metrics.dragdocumenttop + 'px';
        self.domNodeDrag.style.width = self.metrics.mainwidth + 'px';
        self.domNodeDrag.style.height = self.metrics.mainheight + 'px';
        self.domNodeDrag.style.border = '1px dotted #008800';
        self.domNodeDrag.style.backgroundColor = '#ffff88';
        self.domNodeDrag.style.opacity = 0.5;
        self.domNodeDrag.style.filter = "alpha(opacity: 50)";
        self.domNodeDrag.style.zIndex = self.domNodeMain.style.zIndex;
        // we append to the main document the DOM
        document.body.appendChild(self.domNodeDrag);
        break;
      case 'object':
        // we just link the object
        self.domNodeDrag = self.domNodeMain;
        break;
      case 'caller':
        break;
    }
    if (self.objects[self.domNodeLink.id].feedback)
    {
      self.actualzone = checkZone();
      self.objects[self.domNodeLink.id].feedback('start', self.id, self.domNodeLink.id, self.actualzone, self.metrics);
      if (self.actualzone)
        self.zones[self.actualzone].feedback('enterzone', self.id, self.domNodeLink.id, self.actualzone, self.metrics);
    }
  }

  function checkCoords(e)
  {
    self.metrics.xmouse = WA.browser.getCursorDocumentX(e);
    self.metrics.ymouse = WA.browser.getCursorDocumentY(e);
    self.metrics.xrelativemouse = self.metrics.xrelativejailed = self.metrics.xmouse - self.metrics.xstartmouse;
    self.metrics.yrelativemouse = self.metrics.yrelativejailed = self.metrics.ymouse - self.metrics.ystartmouse;

    self.metrics.dragleft = self.metrics.mainleftstart + self.metrics.xrelativemouse;
    self.metrics.dragtop = self.metrics.maintopstart + self.metrics.yrelativemouse;
    self.metrics.dragdocumentleft = self.metrics.maindocumentleftstart + self.metrics.xrelativemouse;
    self.metrics.dragdocumenttop = self.metrics.maindocumenttopstart + self.metrics.yrelativemouse;
    self.metrics.xjailed = self.metrics.xmouse - self.metrics.jailleft;
    self.metrics.yjailed = self.metrics.ymouse - self.metrics.jailtop;

    // check coords to move based on jail
    if (self.metrics.dragdocumentleft < self.metrics.jailleft)
    {
      var diff = self.metrics.jailleft - self.metrics.dragdocumentleft;
      self.metrics.dragdocumentleft += diff;
      self.metrics.dragleft += diff;
      self.metrics.xrelativejailed = self.metrics.jailleft - self.metrics.xstartmouse;
      self.metrics.xjailed = 0;
    }
    if (self.metrics.dragdocumenttop < self.metrics.jailtop)
    {
      var diff = self.metrics.jailtop - self.metrics.dragdocumenttop;
      self.metrics.dragdocumenttop += diff;
      self.metrics.dragtop += diff;
      self.metrics.yrelativejailed = self.metrics.jailtop - self.metrics.ystartmouse;
      self.metrics.yjailed = 0;
    }
    if (self.metrics.dragdocumentleft + self.metrics.mainoffsetwidth > self.metrics.jailleft + self.metrics.jailwidth)
    {
      var diff = self.metrics.dragdocumentleft + self.metrics.mainoffsetwidth - self.metrics.jailleft - self.metrics.jailwidth;
      self.metrics.dragdocumentleft -= diff;
      self.metrics.dragleft -= diff;
      self.metrics.xrelativejailed -= diff; // self.metrics.jailleft + self.metrics.jailwidth - self.metrics.dragleft - self.metrics.mainoffsetwidth;
      self.metrics.xjailed = self.metrics.jailwidth;
    }
    if (self.metrics.dragdocumenttop + self.metrics.mainoffsetheight > self.metrics.jailtop + self.metrics.jailheight)
    {
      var diff = self.metrics.dragdocumenttop + self.metrics.mainoffsetheight - self.metrics.jailtop - self.metrics.jailheight;
      self.metrics.dragdocumenttop -= diff;
      self.metrics.dragtop -= diff;
      self.metrics.yrelativejailed -= diff; //self.metrics.jailtop + self.metrics.jailheight - self.metrics.dragtop - self.metrics.mainoffsetheight;
      self.metrics.yjailed = self.metrics.jailheight;
    }
    if (self.domNodeDrag)
    {
      var abs = (self.objects[self.domNodeLink.id].mode == 'copy' || self.objects[self.domNodeLink.id].mode == 'border');
      self.domNodeDrag.style.left = (abs?self.metrics.dragdocumentleft:self.metrics.dragleft) + 'px';
      self.domNodeDrag.style.top = (abs?self.metrics.dragdocumenttop:self.metrics.dragtop) + 'px';
    }
  }

  // just check if any zone available
  function hasZones()
  {
    for (i in self.zones)
      return true;
    return false;
  }

  // get back the if of the zone where the mouse is, or null
  function checkZone()
  {
    for (i in self.zones)
    {
      var left = WA.browser.getNodeDocumentLeft(self.zones[i].domNode);
      var top = WA.browser.getNodeDocumentTop(self.zones[i].domNode);
      var right = left + WA.browser.getNodeInnerWidth(self.zones[i].domNode);
      var bottom = top + WA.browser.getNodeInnerHeight(self.zones[i].domNode);
      if (self.metrics.xmouse >= left && self.metrics.xmouse <= right && self.metrics.ymouse >= top && self.metrics.ymouse <= bottom)
      {
        return i;
      }
    }
    return null;
  }

  this.drag = drag;
  function drag(e)
  {
    if (!self.domNodeLink)
      return null;
    checkCoords(e);

    if (self.objects[self.domNodeLink.id].feedback)
    {
      var zone = checkZone();
      if (zone != self.actualzone && self.actualzone !== null)
        self.feedback('exitzone', self.id, self.domNodeLink.id, self.actualzone, self.metrics);
      self.objects[self.domNodeLink.id].feedback('drag', self.id, self.domNodeLink.id, zone, self.metrics);
      if (zone != self.actualzone && zone !== null)
        self.feedback('enterzone', self.id, self.domNodeLink.id, zone, self.metrics);
      self.actualzone = zone;
    }
    return WA.browser.cancelEvent(e);
  }

  this.stop = stop;
  function stop(e)
  {
    if (self.timer && self.domNodeLink)
    {
      clearTimeout(self.timer);
      self.timer = null;
      self.domNodeLink = null;
    }
    if (!self.domNodeLink)
      return null;
    checkCoords(e);

    // IF ZONES AND NOT INTO ZONES: DO NOT MOVE !
    var zone = checkZone();
    var move = true;
    if (hasZones() && !zone)
    {
      move = false;
      // back to original position ('object')
      if (self.objects[self.domNodeLink.id].mode == 'object')
      {
        self.domNodeMain.style.left = self.metrics.mainleftstart + 'px';
        self.domNodeMain.style.top = self.metrics.maintopstart + 'px';
      }
    }

    if (self.objects[self.domNodeLink.id].feedback)
    {
      if (zone != self.actualzone && self.actualzone !== null)
        self.feedback('exitzone', self.id, self.domNodeMain.id, self.actualzone, self.metrics);
      self.objects[self.domNodeLink.id].feedback('drop', self.id, self.domNodeMain.id, zone, self.metrics);
      if (zone != self.actualzone && zone !== null)
        self.feedback('enterzone', self.id, self.domNodeMain.id, zone, self.metrics);
      self.actualzone = zone;
    }

    // we move real object and destroy drag if copy of something
    if (self.objects[self.domNodeLink.id].mode == 'copy' || self.objects[self.domNodeLink.id].mode == 'border')
    {
      document.body.removeChild(self.domNodeDrag);
      if (move)
      {
        self.domNodeMain.style.left = self.metrics.dragleft + 'px';
        self.domNodeMain.style.top = self.metrics.dragtop + 'px';
      }
    }

    self.domNodeDrag = null;
    self.domNodeMain = null;
    self.domNodeLink = null;
    self.actualzone = null;
    return WA.browser.cancelEvent(e);
  }

  this.destroy = destroy;
  function destroy()
  {
    self.stop();       // just in case
    self.timer = null;
    self.container = null;
    self.feedback = null;
    for (var i in self.objects)
    {
      WA.Managers.event.off('mousedown', self.objects[i].domNode, down, true);
      delete self.objects[i];
    }
    delete self.objects;
    for (var i in self.zones)
      delete self.zones[i];
    delete self.zones;
    self.domNodeLink = null;
    self.domNodeMain = null;
    self.domNodeDrag = null;
    self.actualzone = null;
    delete self.metrics;
    self = null;
  }
}

