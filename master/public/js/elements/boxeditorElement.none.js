
/*
    boxeditorElement.js, WAJAF, the WebAbility(r) Javascript Application Framework
    Contains element to control a box model editor
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

function boxelement(container, uid, data)
{
  var self = this;
  this.container = container;
  this.uid = uid;
  this.data = data;
  this.inputs = {};
  this.outputs = {};
  this.params = {};

  this.selected = false;

  this.domNode = WA.createDomNode('div', uid, null);
  this.domNode.className = 'boxmain';
  this.domNode.style.position = 'absolute';
  this.domNode.style.left = '0px';
  this.domNode.style.top = '0px';
  this.domNode.style.width = '100px';
  this.domNode.style.height = '100px';
  container.domNode.appendChild(this.domNode);

  this.domNodeTitle = WA.createDomNode('div', uid+'_title', null);
  this.domNodeTitle.className = 'boxtitle';
  this.domNodeTitle.innerHTML = 'Matrix';
  this.domNode.appendChild(this.domNodeTitle);

  this.domNodeDestroy = WA.createDomNode('div', uid+'_destroy', null);
  this.domNodeDestroy.className = 'boxdestroy';
  this.domNodeDestroy.style.position = 'absolute';
  this.domNodeDestroy.style.left = '90px';
  this.domNodeDestroy.style.top = '0px';
  this.domNodeDestroy.style.width = '10px';
  this.domNodeDestroy.style.height = '10px';
  this.domNodeDestroy.innerHTML = 'X';
  this.domNode.appendChild(this.domNodeDestroy);

  this.domNodeResize = WA.createDomNode('div', uid+'_destroy', null);
  this.domNodeResize.className = 'boxresize';
  this.domNodeResize.style.position = 'absolute';
  this.domNodeResize.style.left = '90px';
  this.domNodeResize.style.top = '90px';
  this.domNodeResize.style.width = '10px';
  this.domNodeResize.style.height = '10px';
  this.domNodeResize.innerHTML = '*';
  this.domNode.appendChild(this.domNodeResize);

  this.setPosition = setPosition;
  function setPosition(x,y)
  {
    self.domNode.style.left = x+'px';
    self.domNode.style.top = y+'px';
  }

  this.setSize = setSize;
  function setSize(w,h)
  {
    self.domNode.style.width = w+'px';
    self.domNode.style.height = h+'px';
  }

  this.click = click;
  function click(e)
  {
    if (!WA.browser.ifShift(e))
      return;
    self.selected = !self.selected;
    if (self.selected)
    {
      self.domNode.className = 'boxmainselected';
    }
    else
    {
      self.domNode.className = 'boxmain';
    }
  }

  this.createInputs = createInputs;
  function createInputs()
  {
    var cnt = 10;
    for (var i in self.data.inputs)
    {
      var domNode = WA.createDomNode('div', uid+'_in_'+i, 'boxinput');
      domNode.style.position = 'absolute';
      domNode.style.left = '-10px';
      domNode.style.top = cnt+'px';
      domNode.style.width = '10px';
      domNode.style.height = '10px';
      self.domNode.appendChild(domNode);
      cnt += 20;
    }
  }

  this.createOutputs = createOutputs;
  function createOutputs()
  {
    var cnt = 10;
    for (var i in self.data.outputs)
    {
      var domNode = WA.createDomNode('div', uid+'_out_'+i, 'boxoutput');
      domNode.style.position = 'absolute';
      domNode.style.left = '100px';
      domNode.style.top = cnt+'px';
      domNode.style.width = '10px';
      domNode.style.height = '10px';
      self.domNode.appendChild(domNode);
      WA.Managers.dd.registerObject('boxeditor_lines', domNode, domNode);
      cnt += 20;
    }
  }

  this.createParams = createParams;
  function createParams()
  {
    var domNode = WA.createDomNode('div', uid+'_par', 'boxparam');
    domNode.style.position = 'absolute';
    domNode.style.left = '45px';
    domNode.style.top = '-10px';
    domNode.style.width = '10px';
    domNode.style.height = '10px';
    self.domNode.appendChild(domNode);
  }

  this.paint = paint;
  function paint()
  {
    // paint all the ins, outs, params around
  }

  this.createInputs();
  this.createOutputs();
  this.createParams();
  WA.Managers.dd.registerObject('boxeditor', this.domNodeTitle, this.domNode);
  WA.Managers.event.on('click', this.domNode, this.click, true);

}

function toolelement(container, uid, data)
{
  var self = this;
  this.container = container;
  this.uid = uid;
  this.data = data;

  this.domNode = WA.createDomNode('div', uid, null);
  this.domNode.style.border = '1px solid red';
  this.domNode.style.position = 'absolute';
  this.domNode.style.left = '0px';
  this.domNode.style.top = '0px';
  this.domNode.style.width = '100px';
  this.domNode.style.height = '100px';

  container.domNode.appendChild(this.domNode);

  WA.Managers.dd.registerObject('boxeditor', self.domNode, self.domNode, null);

  this.setPosition = setPosition;
  function setPosition(x,y)
  {
    self.domNode.style.left = x+'px';
    self.domNode.style.top = y+'px';
  }
}

function lineelement(container, uid)
{
  var self = this;
  this.container = container;
  this.uid = uid;

  // any line has 3 elements, 2 horizontal, 1 vertical
  this.domNodeH1 = WA.createDomNode('div', uid+'_h1', 'boxline');
  this.domNodeH1.style.position = 'absolute';
  this.domNodeH1.style.left = '0px';
  this.domNodeH1.style.top = '0px';
  this.domNodeH1.style.width = '10px';
  this.domNodeH1.style.height = '1px';
  container.domNode.appendChild(this.domNodeH1);

  // any line has 3 elements, 2 horizontal, 1 vertical
  this.domNodeV1 = WA.createDomNode('div', uid+'_v1', 'boxline');
  this.domNodeV1.style.position = 'absolute';
  this.domNodeV1.style.left = '0px';
  this.domNodeV1.style.top = '0px';
  this.domNodeV1.style.width = '1px';
  this.domNodeV1.style.height = '10px';
  container.domNode.appendChild(this.domNodeV1);

  // any line has 3 elements, 2 horizontal, 1 vertical
  this.domNodeH2 = WA.createDomNode('div', uid+'_h2', 'boxline');
  this.domNodeH2.style.position = 'absolute';
  this.domNodeH2.style.left = '0px';
  this.domNodeH2.style.top = '0px';
  this.domNodeH2.style.width = '10px';
  this.domNodeH2.style.height = '1px';
  container.domNode.appendChild(this.domNodeH2);

  this.setPositionStart = setPositionStart;
  function setPositionStart(x,y)
  {
    self.xstart = x;
    self.ystart = y;
  }

  this.setPositionEnd = setPositionEnd;
  function setPositionEnd(x,y)
  {
    WA.debug.explain(x+' '+y);
    self.xend = x;
    self.yend = y;
    self.paint();
  }

  this.paint = paint;
  function paint()
  {
    // calculate positions based on start, end
    self.domNodeH1.style.left = self.xstart+'px';
    self.domNodeH1.style.top = self.ystart+'px';
    if (self.xstart > self.xend)
    {
      self.domNodeH1.style.width = '10px';
      self.domNodeV1.style.left = (self.xstart+10)+'px'
      self.domNodeH2.style.left = self.xend+'px';
      self.domNodeH2.style.width = (self.xstart-self.xend+10)+'px';
    }
    else if (self.xend - self.xstart < 11)
    {
      self.domNodeH1.style.width = '10px';
      self.domNodeV1.style.left = (self.xstart+10)+'px'
      self.domNodeH2.style.left = self.xend+'px';
      self.domNodeH2.style.width = (self.xend-self.xstart)+'px';
    }
    else
    {
      var half = Math.floor( (self.xend - self.xstart) / 2);
      self.domNodeH1.style.width = half+'px';
      self.domNodeV1.style.left = (self.xstart + half)+'px'
      self.domNodeH2.style.left = (self.xstart + half)+'px';
      self.domNodeH2.style.width = half+'px';
    }
    if (self.ystart < self.yend)
      self.domNodeV1.style.top = (self.ystart)+'px';
    else
      self.domNodeV1.style.top = (self.yend)+'px';
    self.domNodeV1.style.height = Math.abs(self.yend - self.ystart)+'px';
    self.domNodeH2.style.top = self.yend+'px';
  }
}

function boxeditorElement(domNodeFather, domID, params, notify, _4glNode)
{
  var self = this;
  this._4glNode = _4glNode;
  this.domNodeFather = domNodeFather;
  this.domID = domID;
  this.params = params;
  this.notify = notify;
  this.running = false;
  this.visible = true;

  this.uid = params.attributes.uid;
  this.classname = params.attributes.classname!==undefined?params.attributes.classname:'html';

  this.boxesdef = {};
  this.toolsdef = {};
  this.linesdef = {};
  this.boxes = {};
  this.tools = {};
  this.lines = {};
  this.counter = 1;

  this.domNode = WA.createDomNode('div', domID, this.classname);
  this.domNode.style.width = '10000px';
  this.domNode.style.height = '10000px';
  if (params.attributes.display)
    this.domNode.style.display = params.attributes.display;
  domNodeFather.appendChild(this.domNode);

  this.notifyListener = notifyListener;
  function notifyListener(order, data)
  {
    var request = WA.Managers.ajax.createRequest(WA.Managers.wa4gl.url+'?P='+self._4glNode.application.appID + '.' + self._4glNode.id + '.json', 'POST', 'order='+order, self.getListener, false);
    request.addParameter('counter', self.counter);
    for (var i in data)
    {
      request.addParameter(i, data[i]);
    }
    request.send();
  }

  this.getListener = getListener;
  function getListener(r)
  {
    // all ok
  }

  // editor methods
  this.loadData = loadData;
  function loadData()
  {
    var request = WA.Managers.ajax.createRequest(WA.Managers.wa4gl.url+'?P='+self._4glNode.application.appID + '.' + self._4glNode.id + '.json', 'POST', 'order=load', self.getData, true);
    // we ask to the server the data we need
  }

  this.getData = getData;
  function getData(r)
  {
    var code = WA.JSON.decode(r.responseText);

    self.counter = code.counter;
    // we stock the data into memory:
    // Definition:
    // - box definition
    // - tools definition
    // - lines definition
    // Data:
    // - box elements
    for (var i in code.boxes)
    {
      self.newBox(code.boxes[i].type, code.boxes[i].x, code.boxes[i].y, code.boxes[i].id)
    }
    // - tools elements
    for (var i in code.tools)
    {
      self.newTool(code.tools[i].type, code.tools[i].x, code.tools[i].y, code.tools[i].id)
    }
    // - lines elements

  }

  this.newBox = newBox;
  function newBox(type, x, y, uid)
  {
    if (!uid)
    {
      uid = self.uid + self.counter++;
      self.notifyListener('newbox', {type:type,id:uid,x:x,y:y})
    }
    // copy the box definition to new box
    var b = new boxelement(self, uid, {inputs:{1:1,2:2},outputs:{1:1},params:{x:1}});
    b.setPosition(x,y);
    self.boxes[uid] = b;
  }

  this.newTool = newTool;
  function newTool(type, x, y, uid)
  {
    if (!uid)
    {
      uid = self.uid + self.counter++;
      self.notifyListener('newtool', {type:type,id:uid,x:x,y:y})
    }
    // copy the box definition to new box
    var t = new toolelement(self, uid);
    t.setPosition(x,y);
    self.tools[uid] = t;
  }

  this.click = click;
  function click(e)
  {
    // get local X,Y
    var x = WA.browser.getCursorInnerX(e);
    var y = WA.browser.getCursorInnerY(e);
    // adjust x,y to main node position

    // if shif, create new box as example
//    if (WA.browser.ifShift(e))
//      self.newBox(1, x, y);
    if (WA.browser.ifCtrl(e))
      self.newTool(1, x, y);
  }

  this.drag = drag;
  function drag(order, xxx, id, linkid, zone, metrics)
  {
    if (order == 'drop')
    {
      if (self.boxes[linkid])
        self.notifyListener('movebox', {id:linkid, x:metrics.dragleft, y:metrics.dragtop})
      if (self.tools[linkid])
        self.notifyListener('movetool', {id:linkid, x:metrics.dragleft, y:metrics.dragtop})
    }
  }

  this.dragline = dragline;
  function dragline(order, xxx, id, linkid, zone, metrics)
  {
    if (order == 'start')
    {
      // search for the connector to link
      // already lined ? redraw the line
      // not liner ? create new line
      self.line = new lineelement(self);
      self.line.setPositionStart(metrics.xstartjailed, metrics.ystartjailed);
      self.line.setPositionEnd(metrics.xstartjailed, metrics.ystartjailed);
    }
    if (order == 'drag')
    {
      // move the end of the line
      self.line.setPositionEnd(metrics.xjailed, metrics.yjailed);
    }
    if (order == 'drop')
    {
      alert('dropped');
      // link to another connector if connector, or just let it like this
    }
  }















  // Standard methods

  this.callNotify = callNotify;
  function callNotify(type, id)
  {
    var result = true;
    // no notifications if the app is not started
    if (self.notify && self.running)
      result = self.notify(type, self.domID, (id!=null?{id:id}:null));
    return result;
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

  this.getvalues = getvalues;
  function getvalues()
  {
    return null;
  }

  this.setvalues = setvalues;
  function setvalues(values)
  {
  }

  this.start = start;
  function start()
  {
    self.running = true;
    self.resize();
    self.loadData();


 // create a new draggable group (logical)
  // mode is: 'copy': will make a full html copy of object to move and destroy the copy at the end of move, will move the original at the end,
  //          'border': will show a border to move and destroy the border at the end of move, will move the original at the end,
  //          'object': will move the object directly,
  //          'caller': let all the control to the caller and pass orders to feedback (caller can do whatever it wants)
  // jail is: true/false. If true, the object canot go outside the conainer, and container MUST have a value
  // feedback is a multipurpose function:
  // seed feedback for 'start', 'drag', and 'drop', and can ask 'asknode' for container main node to copy, or size for block move and jail.
    WA.Managers.dd.registerGroup('boxeditor', 'object', true, self.domNode, self.drag);
    WA.Managers.dd.registerGroup('boxeditor_lines', 'caller', true, self.domNode, self.dragline);

    // listeners
    WA.Managers.event.on('click', self.domNode, self.click, true);
  }

  this.resize = resize;
  function resize()
  {
    if (!self.running || !self.visible)
      return;
    self._4glNode.nodeResize(self.domNodeFather, self.domNode, self.params.attributes);
  }

  this.stop = stop;
  function stop()
  {
    self.running = false;
  }

  this.destroy = destroy;
  function destroy()
  {
    self.domNode = null;
    self.notify = notify;
    self.params = params;
    self.domNodeFather = domNodeFather;
    self = null;
  }
}

// Needed aliases
WA.Elements.boxeditorElement = boxeditorElement

