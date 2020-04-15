
/*
    gridContainer.js, WAJAF, the WebAbility(r) Javascript Application Framework
    Contains container to control a grid of zones
    (c) 2008-2017 Philippe Thomassigny

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

WA.Containers.gridContainer = function(fatherNode, domID, code, listener)
{
  var self = this;

  WA.Containers.gridContainer.sourceconstructor.call(this, fatherNode, domID, code, 'div', { classname:'grid' }, listener);

  this.classes = WA.getClasses( code.attributes,
    { classname:'grid',
      classnameheader:'grid-header', classnameheadercontent:'grid-header-content',
        classnameheadercolumn:'grid-header-column',
        classnameheadercolumntitle:'grid-header-column-title',
        classnameheadercolumnsizer:'grid-header-column-sizer',
      classnamebody:'grid-body', classnamebodycontent:'grid-body-content',
        classnamebodycolumn: 'grid-body-column',
        classnamebodycell:'grid-body-cell',
      classnamefooter:'grid-footer', classnamefootercontent:'grid-footercontent',
    } );

  this.haslistener = (code.attributes.haslistener==='yes');
  this.minload = code.attributes.minload?parseInt(code.attributes.minload, 10):50;
  this.params = code.attributes.params?'&'+code.attributes.params:'';
  
  this.columns = {};        // all the columns (zones)
  this.lines = [];          // all the lines of data

  this.data = null;         // all the loaded data
  this.total = -1;
  this.fullloaded = false;
  
  this.populatemin = 0;
  this.populatemax = this.minload-1;
  
  this.loading = false;
  this.toptoload = 0;
  this.lineheight = 0;
  this.offset = 0;
  this.firstfield = null;
  var currentcolumn = null;
  var currentline = null;

  // DOM
  this.domNode.className = this.classes.classname;

  // header division
  this.domNodeHeader = WA.createDomNode('div', domID+'_header', this.classes.classnameheader);
  this.domNode.appendChild(this.domNodeHeader);
  this.domNodeHeaderContent = WA.createDomNode('div', domID+'_headercontent', this.classes.classnameheadercontent);
  this.domNodeHeader.appendChild(this.domNodeHeaderContent);

  // body
  this.domNodeBody = WA.createDomNode('div', domID+'_body', this.classes.classnamebody);
  this.domNode.appendChild(this.domNodeBody);
  this.domNodeBodyContent = WA.createDomNode('div', domID+'_bodycontent', this.classes.classnamebodycontent);
  this.domNodeBody.appendChild(this.domNodeBodyContent);

  // footer
  this.domNodeFooter = WA.createDomNode('div', domID+'_footer', this.classes.classnamefooter);
  this.domNode.appendChild(this.domNodeFooter);
  this.domNodeFooterContent = WA.createDomNode('div', domID+'_footercontent', this.classes.classnamefootercontent);
  this.domNodeFooter.appendChild(this.domNodeFooterContent);
    
  this.footer = new WA.Containers.gridContainer.gridFooter(this, domID+'_footer', this.domNodeFooterContent);


/*
  this.selectable = (code.attributes.selectable==='yes');
  this.changes = (code.attributes.changes==='deferred');  // true = deferred on user click, false: online changes (if haslistener obviously)
  this.isselectable = this.selectable;   // global selectable indicator (row or any field selectable)
  this.iseditable = false;               // global editable indicator (any field editable)
  this.insertable = code.attributes.insertable=='yes'?true:false;
  this.deletable = code.attributes.deletable=='yes'?true:false;

  this.parameters = code.attributes.code!=undefined?code.attributes.code:'';   // code to send to sever with any request

  this.classes = WA.getClasses( code.attributes,
    { classname:'grid', classnameeditor:'grid-editor',
      classnameheader:'grid-header', classnameheadercontent:'grid-headercontent',
      classnamebody:'grid-body', classnamebodycontent:'grid-bodycontent',
      classnamefooter:'grid-footer', classnamefootercontent:'grid-footercontent',
      classnamecelltitle:'grid-celltitle', classnamecelltitleempty:'grid-celltitleempty',
      classnamecelltitleasc:'grid-celltitleasc', classnamecelltitledesc:'grid-celltitledesc', classnamecelltitlefiltered:'grid-celltitlefiltered',
      classnameline:'grid-line',classnamelineselected:'grid-lineselected',classnamelinenew:'grid-linenew',
classnamecellmodified:'grid-cellmodified',
      classnameviewicon:'grid-viewicon', classnameselecticon:'gridselecticon', classnameediticon:'grid-editicon',
      classnameselectclear:'grid-selectclear', classnameselectall:'gridselectall', classnameselectinverse:'grid-selectinverse',
      classnameeditnew:'grid-editnew', classnameeditsave:'grid-editsave', classnameeditdelete:'grid-editdelete'

    } );

  this.pagination = null;   // the pagination stuff
  this.maxperpage = 0;      // no pagination per default, controlled by paginationElement

  this.locali = false;
  this.localid = null;
*/

  this.addEvent('start', start);
  this.addEvent('stop', stop);
  this.addEvent('resize', resize);
  
  WA.Managers.event.on('mouseover', self.domNode, findcell, true);
  WA.Managers.event.on('click', self.domNode, click, true);
  WA.Managers.event.on('scroll', self.domNodeBody, scrollBody, true);

  function sendServer(order, code, feedback)
  {
    if (!self.haslistener)
      return;
    // send information to server based on mode
    var request = WA.Managers.ajax.createRequest(WA.Managers.wa4gl.url + WA.Managers.wa4gl.prelib + self.app.applicationID + WA.Managers.wa4gl.premethod + self.id + WA.Managers.wa4gl.preformat + WA.Managers.wa4gl.format, 'POST', 'Order='+order+(self.params?'&'+self.params:''), feedback, false);

    if (request)
    {
      for (var i in code)
      {
        request.addParameter(i, code[i]);
      }
      request.send();
    }
  }

  // each zone is a COLUMN
  this.createZone = createZone;
  function createZone(domID, code, notify)
  {
    var ldomID = WA.parseID(domID, self.xdomID);

    // 1. call event precreate
    if (!self.callEvent('precreate', {id:ldomID[2]}))
      return null;

    if (!code.attributes.id)
      throw 'Error: the id is missing in the tree construction of '+domID;

    if (!self.firstfield)
      self.firstfield = code.attributes.field;
    
    // we create the column itself
    var c = new WA.Containers.gridContainer.gridColumn(self, domID+'_column', self.domNodeHeaderContent, code, notify);
    self.columns[code.attributes.field] = c;
    var z = new WA.Containers.gridContainer.gridZone(self, domID, self.domNodeBodyContent, code, notify);
    self.zones[code.attributes.field] = z;

    self.callEvent('postcreate', {id:ldomID[2]});
    if (self.state == 5)
    {
      c.propagate('start');
      z.propagate('start');
      self.propagate('resize');
    }

    return z;
  }

  this.destroyZone = destroyZone;
  function destroyZone(id)
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
    delete self.zones[ldomID[2]];
    
    self.columns[ldomID[2]].destroy();
    delete self.columns[ldomID[2]];

    self.callEvent('postdestroy', {id:ldomID[2]});
  }

  this.activateZone = activateZone;
  function activateZone(id)
  {
  }

  this.showZone = showZone;
  function showZone(id)
  {
  }

  this.hideZone = hideZone;
  function hideZone(id)
  {
  }

  this.getValues = getValues;
  function getValues()
  {
    return null;
  }

  this.setValues = setValues;
  function setValues(values)
  {

  }
  
  function scrollBody(event)
  {
    if (!self.lineheight)
      return;
    var pos = self.domNodeBody.scrollTop;
    var line = Math.floor(pos / self.lineheight);
    self.populatemin = line;
    self.populatemax = line + self.minload - 1;
    fillData();
  }
  
  function getData(r)
  {
    self.loading = false;
    removeLoading();
    
    self.countload = 0;
    var code = WA.JSON.decode(r.responseText);

    if (code.row.length && !self.data)
    {
      self.data = code.row;
      self.total = code.total;
    }
    else
    {
      if (!self.data)
        self.data = [];
      for (var i in code.row)
      {
        self.data[parseInt(i, 10)] = code.row[i];
      }
    }
    if (self.total > 0)
      fillData();
  }

  function fillData()
  {
    // 2 levels: lines and data. 
    // If lines are not defined, try to define them and fill
    // if data is not set, try to load it (delayed)
    
    var mintoload = -1;
    var maxtoload = -1;
    var settoload = [];
    
    for (var i = self.populatemin; i <= self.populatemax; i++)
    {
      // we are at the end of the total lines, nothing more to do
      if (self.total != -1 && i >= self.total)
        break;
      // If the line has already been populated, nothing to do
      if (self.lines[i])
        continue;
      
      // If the data exists, just populate it
      if (self.data && self.data[i])
      {
        createLine(self.data[i], i);
        continue;
      }
      
      // creates the array to load
      if (mintoload == -1) mintoload = maxtoload = i;
      else if (maxtoload == i-1) maxtoload++;
      else
      { // new segment
        settoload.push([mintoload,maxtoload]);
        mintoload = maxtoload = i;
      }
    }
    if (mintoload != -1)
    {
      settoload.push([mintoload,maxtoload]);
      putLoading();
      // put "Loading...."
    }
    
    if (mintoload != -1 && !self.loading && self.serverlistener)
    {
      if (self.countload++ > 3)
      {
        console.log('Error getting the record from the server.');
        return;
      }

      self.loading = true;
      // ask to the server the data
      sendServer('get', {data:WA.JSON.encode(settoload)}, getData);
    }
    adjustHeight();
    self.footer.populate();
  }
  
  function createLine(data, index)
  {
    // desplazar esto
    var size = self.calculateWidth();
    self.domNodeBodyContent.style.width = size + 'px';

    // first cell of first line will set lineheight (very important !)
    var line = new WA.Containers.gridContainer.gridLine(self, self.domID+'_l-'+index, data, index);
    line.start();
    self.lines[index] = line;
    
    return line;
  }
  
  function adjustHeight()
  {
    if (!self.lineheight)
      return;
    
    // adjust the height of the container
    // based on data.total
    // get the height of a row
    for (var i in self.zones)
    {
      self.zones[i].domNode.style.height = (self.total * self.lineheight) + 'px';
    }
  }

  this.unpopulate = unpopulate;
  function unpopulate()
  {
    for (var i in self.lines)
      self.lines[i].destroy();
    for (var i in self.zones)
      WA.browser.setInnerHTML(self.zones[i].domNode, '');
//    WA.browser.setInnerHTML(self.domNodeBodyContent, '');
    self.linecount = 0;
    self.lines = [];
  }

  function putLoading()
  {
    
  }
  
  function removeLoading()
  {
    
  }
  
  
  function findcell(event)
  {
    // gets the target and hover the things
    
    var node = event.target;
    var column = node.column;
    var line = node.line;
    
    // change class
    if (currentcolumn)
    {
      self.zones[currentcolumn].sethover(false);
      self.columns[currentcolumn].sethover(false);
      currentcolumn = null;
    }

    // change class
    if (currentline)
    {
      self.lines[currentline].sethover(false);
      currentline = null;
    }

    if (column)
    {
      self.zones[column].sethover(true);
      self.columns[column].sethover(true);
      currentcolumn = column;
    }
    if (line)
    {
      self.lines[line].sethover(true);
      currentline = line;
    }
  }
  
  function click(event)
  {
    var node = event.target;
    var column = node.column;
    var line = node.line;

    // send data line
    self.propagate('click', {column:column,line:line,data:self.data[line]});
  }
  
  
  
  // ========================================================================================
  // system functions, called ONLY BY 4GL
  // constructor is called when creating the object.
  // start is called when the object is started, i.e. listeners activated.
  // resize is called when the object is transformed in any way.
  // stop is called when the object is stopped, i.e. listeners stopped.
  // destroy is called when the object is physically destroyed.

  this.start = start;
  function start()
  {
    self.countload = 0;
    fillData();
    self.footer.start();
  }

  this.reload = reload;
  function reload()
  {
    unpopulate();
    self.data = null;
    self.fullloaded = false;
    self.countload = 0;
    fillData();
  }

  this.resize = resize;
  function resize()
  {
    if (!WA.Containers.gridContainer.source.resize.call(self))
      return;

    // calculate width and height of nodes
    var size = 0;
    for (var i in self.zones)
    {
      // gets the real size: width CSS extras
      size += WA.browser.getNodeWidth(self.zones[i].domNode);
    }
    self.domNodeHeaderContent.style.width = size + 'px';
    self.domNodeBodyContent.style.width = size + 'px';

    var height = 0;
    if (self.lines[0])
    {
      height = self.total * WA.browser.getNodeHeight(self.lines[0].cells[self.firstfield]);
    }

    self.domNodeBodyContent.style.height = height + 'px';
  }

  this.stop = stop;
  function stop()
  {
    if (self.running != 1 && self.running != 2)
      return;
    self.running = 4;
    self.footer.stop();
    for (var i in self.columns)
      self.columns[i].stop();
    self.running = 0;
  }

  this.destroy = destroy;
  function destroy(fast)
  {
    if (self.running != 0)
      self.stop();

    // destroy all zones
    for (var i in self.columns)
      self.columns[i].destroy(fast);

    if (!fast)
      self.domNodeFather.removeChild(self.domNode);

    self.locali = null;
    self.localid = null;
    self.domNode = null;
    self.columns = null;
    self.templates = null;
    self.lines = null;
    self.data = null;
    self.notify = null;
    self.code = null;
    self.domID = null;
    self.xdomID = null;
    self.domNodeFather = null;
    self._4glNode = null;
    self = null;
  }


  // ================================================================
  // move divisions by program and mouse
  this.startdrag = startdrag;
  function startdrag(sizerID, size, event, group, object, zone, data)
  {

    self.movingsize = size;
    self.movingID = sizerID;
    //
  }

  this.drag = drag;
  function drag(event, group, object, zone, data)
  {
    // calculate all div sizes based on movement
    var remain = data.xrelativemouse;
    var size = self.movingsize + remain;
    self.columns[self.movingID].setSize(size);
    // resize the whole column
    self.resizecolumns();
  }

  this.drop = drop;
  function drop(event, group, object, zone, data)
  {
    self.movingsize = null;
    self.movingID = null;
  }

  this.resizecolumns = resizecolumns;
  function resizecolumns()
  {
    var finalsize = WA.browser.getNodeOuterWidth(self.columns[self.movingID].domNode);
    for (var i = 0; i < self.linecount; i++)
    {
      WA.toDOM(self.domID + '_line'+i+'_cell'+self.movingID).style.width = finalsize + 'px';
    }
    var size = self.calculateWidth();
    self.domNodeBodyContent.style.width = size + 'px';
  }





  
  
  
  
  
  
  
  
  
  
  
  
  
  function scroll(e)
  {
    var left = WA.browser.getNodeScrollLeft(self.domNodeBody);
    self.domNodeHeaderContent.style.left = -left + 'px';
  }

  this.calculateWidth = calculateWidth;
  function calculateWidth()
  {
    var size = 0;
    for (var i in self.columns)
    {
      size += WA.browser.getNodeOuterWidth(self.columns[i].domNode);
    }
    return size;
  }

  this.selectmask = selectmask;
  function selectmask(type)
  {
    for (var i in self.lines)
    {
      if (type == 'clear')
        self.lines[i].unselect();
      else if (type == 'all')
        self.lines[i].select();
      else
        self.lines[i].invert();
    }
  }

  this.newline = newline;
  function newline()
  {

  }

  this.deletemarkedlines = deletemarkedlines;
  function deletemarkedlines()
  {
    // 1. destroy the data

    for (var i=self.lines.length-1; i >= 0; i--)
    {
      if (self.lines[i].selected)
      {
        self.data.splice(self.lines[i].index,1);
        self.lines[i].destroy();
        self.lines.splice(i,1);
      }
    }
  }

  this.responsedeleted = responsedeleted;
  function responsedeleted(request)
  {
    var result = eval('(' + request.responseText + ')');
    if (result.success)
    {
      self.deletemarkedlines();
    }
    else
    {
      alert(result.message);
    }
  }

  this.deleteselected = deleteselected;
  function deleteselected()
  {
    var todelete = {};
    var item = 1;
    for (var i in self.lines)
    {
      if (self.lines[i].selected)
      {
        todelete['KEY_' + (item++)] = self.lines[i].key;
      }
    }
    self.sendServer('delete', todelete, self.responsedeleted)
  }

  this.saveall = saveall;
  function saveall()
  {

  }


  this.swap = swap;
  function swap(i, j)
  {
    var buf = self.data[i];
    self.data[i] = self.data[j];
    self.data[j] = buf;
  }

  this.compasc = compasc;
  function compasc(val1, val2)
  {
    if (val1 > val2)
      return 1;
    if (val1 < val2)
      return -1;
    return 0;
  }

  this.compdesc = compdesc;
  function compdesc(val1, val2)
  {
    if (val1 > val2)
      return -1;
    if (val1 < val2)
      return 1;
    return 0;
  }

  this.quickSort = quickSort;
  function quickSort(lo0, hi0, comp, field)
  {
    // local ONLY available if full data loaded !
    
    var lo = lo0;
    var hi = hi0;
    var value;

    if ( hi0 > lo0)
    {
      value = self.data[ Math.ceil((lo0 + hi0 ) / 2) ][field];
      while( lo <= hi )
      {
        while( ( lo < hi0 ) && ( comp(self.data[lo][field], value) == -1 ) )
          ++lo;

        while( ( hi > lo0 ) && ( comp(self.data[hi][field], value) == 1 ) )
          --hi;

        if( lo <= hi )
        {
          self.swap(lo, hi);
          ++lo;
          --hi;
        }
      }

      if( lo0 < hi )
        self.quickSort(lo0, hi, comp, field);
      if( lo < hi0 )
        self.quickSort( lo, hi0, comp, field);
    }
  }

  this.reorder = reorder;
  function reorder(field, asc)
  {
    for (var i in self.columns)
    {
      if (self.columns[i].id != field && self.columns[i].order != 0)
      {
        self.columns[i].order = 0;
        self.columns[i].setTitle();
      }
    }
    self.unpopulate();
    self.quickSort(0, self.data.length-1, (asc?self.compasc:self.compdesc), field);
    self.populate();
  }


  // get the templates if any
  function parseTemplates(code)
  {
    for (var i = 0, l = code.children.length; i < l; i++)
    {
      if (code.children[i].tag == 'template')
      {
        self.templates[code.children[i].attributes.name] = code[i];
      }
    }
  }

  function parseRenders(code)
  {
    for (var i = 0, l = code.children.length; i < l; i++)
    {
      if (code.children[i].tag == 'render')
      {
        self.renders[code.children[i].attributes.name] = code[i];
      }
    }
  }

  function parseData(code)
  {
    for (var i = 0, l = code.children.length; i < l; i++)
    {
      if (code.children[i].tag == 'dataset')
      {
        var data = WA.JSON.decode(code.children[i].data);
        self.data = data.row;
        if (data.total)
          self.total = data.total
        else
          self.total = self.data.length;
        if (data.fullloaded)
          self.fullloaded = data.fullloaded;
        else if (!self.haslistener)
          self.fullloaded = true;
      }
    }

  }
  
  parseTemplates(code);
  parseRenders(code);
  parseData(code);
}

// Add basic container code
WA.extend(WA.Containers.gridContainer, WA.Managers.wa4gl._container);


// The "columns" are the title of the zones which are the real columns
WA.Containers.gridContainer.gridColumn = function(father, domID, container, code, listener)
{
  var self = this;

  this.classname = code.attributes.classname!=undefined?code.attributes.classname:father.classes.classnameheadercolumn;

  WA.Containers.gridContainer.gridColumn.sourceconstructor.call(this, father, domID, code, 'div', { classname:this.classname }, listener);

  // DOM
  this.container = container;
  container.appendChild(this.domNode);
  this.domNode.style.width = (code.attributes.size?code.attributes.size:'300') + 'px';
  this.domNode.style.display = '';  // is visible 

  this.classnametitle = code.attributes.classnametitle!=undefined?code.attributes.classnametitle:father.classes.classnameheadercolumntitle;
  this.classnamesizer = code.attributes.classnamesizer!=undefined?code.attributes.classnamesizer:father.classes.classnameheadercolumnsizer;
  
  this.field = code.attributes.field;
  this.sizemin = code.attributes.sizemin?code.attributes.sizemin:0;
  this.sizemax = code.attributes.sizemax?code.attributes.sizemax:undefined;

/*  this.classnamecell = code.attributes.classnamecell!=undefined?code.attributes.classnamecell:container.classes.classnamecell;
  this.classnamezone = code.attributes.classnamezone!=undefined?code.attributes.classnamezone:container.classes.classnamezone;
  this.classnameasc = code.attributes.classnameasc!=undefined?code.attributes.classnameasc:container.classes.classnamecelltitleasc;
  this.classnamedesc = code.attributes.classnamedesc!=undefined?code.attributes.classnamedesc:container.classes.classnamecelltitledesc;
  this.classnamefiltered = code.attributes.classnamefiltered!=undefined?code.attributes.classnamefiltered:container.classes.classnamecelltitlefiltered;
  this.classnameempty = code.attributes.classnameempty!=undefined?code.attributes.classnameempty:container.classes.classnamecelltitleempty;
*/

  this.size = WA.browser.getNodeWidth(this.domNode);

  // selector, selector pannel, sizer, all hidden
  if (code.attributes.resizeable)
  {
    this.domNodeSizer = WA.createDomNode('div', domID+'_sizer', this.classnamesizer);
    this.domNode.appendChild(this.domNodeSizer);
  }
  else
    this.domNodeSizer = null;

  this.domNodeTitle = WA.createDomNode('div', domID+'_titletext', this.classnametitle);
  this.domNodeTitle.innerHTML = code.attributes.title;
  this.domNode.appendChild(this.domNodeTitle);

  this.setTitle = setTitle;
  function setTitle()
  {
    return;
    
    var title = self.code.attributes.title;
    switch(self.order)
    {
      case 1: title = '<div class="'+self.classnameasc+'" />' + title; break;
      case 2: title = '<div class="'+self.classnamedesc+'" />' + title; break;
      default: title = '<div class="'+self.classnameempty+'" />' + title; break;
    }
    if (self.filtered)
    {
      title = '<div class="'+self.classnamefiltered+'" />' + title;
    }

    WA.browser.setInnerHTML(self.domNodeTitle, title);
  }

  this.sethover = sethover;
  function sethover(flag)
  {
    self.domNode.className = self.classname + (flag?' hover':'');
  }
  
  this.setSize = setSize;
  function setSize(size)
  {
    return;
    
    
    if (size < self.sizemin)
      size = self.sizemin;
    if (self.sizemax != 0 && size > self.sizemax)
      size = self.sizemax;
    self.domNode.style.width = size + 'px';
    self.resize();
    self.size = size;
  }

  this.click = click;
  function click()
  {
    return;
    
    if (self.pleasenoclick)
    {
      self.pleasenoclick = false;
      return;
    }
    self.order ++;
    if (self.order > 2)
      self.order = 1;
    self.container.reorder(self.id, self.order==1?true:false);
    self.setTitle();
  }

  this.clicksizer = clicksizer;
  function clicksizer()
  {
    return;

    if (self.pleasenoclick)
    {
      self.pleasenoclick = false;
      return;
    }
  }

  this.move = move;
  function move(type, event, group, object, zone, data)
  {
    return;
    
    if (type == 'start')
    {
      self.pleasenoclick = true;
      var size = WA.browser.getNodeWidth(self.domNode);
      self.container.startdrag(self.id, size, event, group, object, zone, data);
    }
    else if (type == 'drag' || type == 'drop')
    {
      self.container.drag(event, group, object, zone, data);
    }
    if (type == 'drop')
    {
      self.container.drop(event, group, object, zone, data);
    }
  }

  this.start = start;
  function start()
  {
    return;
    
    
    WA.Managers.event.on('click', self.domNodeTitle, self.click, true);
    WA.Managers.event.on('click', self.domNodeSizer, self.clicksizer, true);

    if (self.sizeable)
    {
      WA.Managers.dd.registerGroup(self.domID+'_sizer', 'caller', false, null, self.move);
      WA.Managers.dd.registerObject(self.domID+'_sizer', self.domID+'_sizer', self.domID+'_sizer', null);
    }
  }

  this.stop = stop;
  function stop()
  {
    return;

    WA.Managers.dd.unregisterObject(self.domID+'_sizer');
    WA.Managers.dd.unregisterGroup(self.domID+'_sizer');
  }

  this.resize = resize;
  function resize()
  {
    // cannot resize if not visible or not running
    if (self.running != 2 || !self.visible || !self.container.visible)
      return;

    // repaint content
    var size = WA.browser.getNodeWidth(self.domNode);
    var disp = size - WA.browser.getNodeOuterWidth(self.domNodeSizer) - WA.browser.getNodeExtraWidth(self.domNodeTitle);
    self.domNodeTitle.width = disp + 'px';
    self.size = size;
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
    self.domNodeTitle = null;
    self.domNodeSizer = null;
    self.domNodeContainer = null;
    self.code = null;
    self.notify = null;
    self.xdomID = null;
    self.domID = null;
    self.container = null;
    self = null;
  }

  this.setTitle();
}

WA.extend(WA.Containers.gridContainer.gridColumn, WA.Managers.wa4gl._zone);



// each zone is a COLUMN
// the zone itself contains the EDITOR and is not visible when loaded
WA.Containers.gridContainer.gridZone = function(father, domID, container, code, listener)
{
  var self = this;
  
  this.classname = code.attributes.classname!=undefined?code.attributes.classname:father.classes.classnamebodycolumn;
  
  WA.Containers.gridContainer.gridZone.sourceconstructor.call(this, father, domID, code, 'div', { classname:this.classname }, listener);
  this.domNode.style.position = 'relative';
  
  this.field = code.attributes.field;
  this.classnamecell = father.classes.classnamebodycell;

  // DOM node container
  this.container = container;
  this.container.appendChild(this.domNode);
  this.domNode.style.width = code.attributes.size + 'px';
  this.domNode.style.display = '';

  this.sethover = sethover;
  function sethover(flag)
  {
    self.domNode.className = self.classname + (flag?' hover':'');
  }
  
  this.setData = setData;
  function setData(data)
  {
  }

  this.getData = getData;
  function getData()
  {
  }

  this.start = start;
  function start()
  {
  }

  this.stop = stop;
  function stop()
  {
  }

  this.destroy = destroy;
  function destroy()
  {
    WA.Containers.treeContainer.gridZone.source.destroy.call(self, fast);

    self.container = null;
    self = null;
  }
}

WA.extend(WA.Containers.gridContainer.gridZone, WA.Managers.wa4gl._zone);


// each line is a dataset of cells
WA.Containers.gridContainer.gridLine = function(father, domID, data, index)
{
  var self = this;
  this.father = father;
  this.domID = domID;
  this.data = data;
  this.index = index;
  
  this.cells = {};

  this.sethover = sethover;
  function sethover(flag)
  {
    for (var i in self.father.zones)
    {
      self.cells[i].className = self.father.zones[i].classnamecell + (flag?' hover':'');
    }
  }
  
  function createCell(father, content, data, c)
  {
    var domNodeCell = WA.createDomNode('div', self.domID+'_cell_'+father.field, father.classnamecell);
    domNodeCell.style.width = father.size + 'px';
    father.domNode.appendChild(domNodeCell);
    domNodeCell.column = c;
    domNodeCell.line = self.index;
    
    if (!self.father.lineheight)
      self.father.lineheight = WA.browser.getNodeOuterHeight(domNodeCell);
    
    // top should be index * lineheight
    domNodeCell.style.position = 'absolute';
    domNodeCell.style.left = '0';
    domNodeCell.style.top = (self.index * self.father.lineheight) + 'px';
    domNodeCell.style.width = '100%';

    // Considerar los TEMPLATES tambien
    
    if (father.render)
    {
      eval( 'var cdata = ' + father.render+'(father.format, content, data);' );
      WA.browser.setInnerHTML(domNodeCell, cdata);
    }
    else
      WA.browser.setInnerHTML(domNodeCell, content);

    return domNodeCell;
  }

  function populate()
  {
    for (var i in self.father.zones)
    {
      if (data[i] != undefined)
        self.cells[i] = createCell(self.father.zones[i], data[i], data, i);
      else
        self.cells[i] = createCell(self.father.zones[i], '', data, i);
    }
  }
  
  
  
  
  this.start = start;
  function start()
  {
    return;
    
    for (var i in self.cells)
      WA.Managers.event.on('click', self.cells[i], self.click, true);
    self.running = 2;
  }

  this.stop = stop;
  function stop()
  {
    return;
    
    self.running = 0;
    for (var i in self.cells)
      WA.Managers.event.off('click', self.cells[i], self.click, true);
  }

  this.select = select;
  function select()
  {
    return;
    
    if (self.selected)
      return;
    self.selected = true;
    self.domNode.className = self.container.classes.classnamelineselected;
  }

  this.unselect = unselect;
  function unselect()
  {
    return;
    
    if (!self.selected)
      return;
    self.selected = false;
    self.domNode.className = self.container.classes.classnameline;
  }

  this.invert = invert;
  function invert()
  {
    return;
    
    if (self.selected)
      self.unselect();
    else
      self.select();
  }

  this.click = click;
  function click(e)
  {
    return;

    // we get the cell where the click happened and we edit it if editable
    var order = '';
    if (self.container.mode == 'view')
    {
      self.container.callNotify('click', {key:self.key,column:this.column,data:self.data});
      return;
    }
    else if (self.container.mode == 'select')
    {
      // columna seleccionable ? linea seleccionable ?
      if (self.container.isselectable)
      {
        order = 'invert';

        // ********************************* STILL HAVE TO IMPLEMENT CELL SELECT ???

      }
    }
    else if (self.container.mode == 'edit')
    {
      var ctrl = WA.browser.ifCtrl(e);
      if (ctrl)
        order = 'invert'
      else
        order = 'edit';
    }

    if (order == 'invert')
      self.invert();
    else if (order == 'edit')
    {
        // show the edit container
      self.container.zones[this.column].show();
      var l = WA.browser.getNodeNodeLeft(this, self.container.domNodeBodyContent);
      var t = WA.browser.getNodeNodeTop(this, self.container.domNodeBodyContent);
      var w = WA.browser.getNodeWidth(this);
      self.container.zones[this.column].setPosition(l, t);
      self.container.zones[this.column].setSize(w, null);
      self.container.zones[this.column].setData(this.data);
      self.container.zones[this.column].setFocus();
      // implements the blur to get feedback when goes outside of this component
      self.container.zones[this.column].domNode.column = this.column;
      self.container.zones[this.column].domNode.cell = this;
      WA.Managers.event.on('blur', self.container.zones[this.column].domNode, self.blur, true);
    }

  }

  this.blur = blur;
  function blur()
  {
    return;
    
    var data = self.container.zones[this.column].getData();
    self.container.zones[this.column].hide();

    // we have to pass by RENDER
    WA.browser.setInnerHTML(this.cell, data);

    this.cell.data = data;
    this.cell = null;

    WA.Managers.event.off('blur', self.container.zones[this.column].domNode, self.blur, true);
    // we set the class to modified

    // we send SAVE to server if realtime

  }

  this.destroy = destroy;
  function destroy()
  {
    self.stop();

    self.domNode = null;
    self.father = null;
    self.data = null;
    self.domID = null;
    self.container = null;
    self.cells = null;
    self = null;
  }
  
  populate();
}

// the footer manage mode, submodes, pagination
// modes are view, select, edit
// in view mode, nothing really happens, more than mouse over on line and click = event
// in select mode:
//   grid selectable only: click on line select line, other click unselect line
//   grid AND cell selectable: click on cell select cell, other click select line, other click unselect all
//   cell selectable only: click on cell select cell, other click unselect cell
//   some footer buttons: select all, unselect all, select inverse
// in edit mode:
//   click on cell edit cell, if editable
//   if deferred, put the cell modified and add a button "save" and "undo"
//   if deferred, put the new line and add a button "save" and "undo"
// if the grid has pagination: put the "Page: 1..2..3.....x-1..x..x+1....n-2..n-1..n  goto [..]> "
// if the dataset is incomplete, reload each page against server and order against server and filter against server
WA.Containers.gridContainer.gridFooter = function(father, domID, container)
{
  var self = this;
 
  this.father = father;
  this.container = container;

  this.domNodeQuantityTitle = WA.createDomNode('div', domID+'_quantitytitle', 'quantity-title');
  this.domNodeQuantityTitle.innerHTML = 'Cantidad: ';
  this.container.appendChild(this.domNodeQuantityTitle);
  
  this.domNodeQuantity = WA.createDomNode('div', domID+'_quantity', 'quantity');
  this.container.appendChild(this.domNodeQuantity);
/*
  this.domID = domID;
  this.domNodeFather = domNodeFather;

  this.domNodeView = WA.createDomNode('div', domID+'_view');
  this.domNodeView.style.display = 'none';
  this.domNodeFather.appendChild(this.domNodeView);
  this.domNodeViewIcon = WA.createDomNode('img', domID+'_viewicon', container.classes.classnameviewicon);
//  this.domNodeViewIcon.src = '/pics/dot.png';
  this.domNodeView.appendChild(this.domNodeViewIcon);
  WA.browser.setInnerHTML(this.domNodeViewIcon, '&nbsp;');

  this.domNodeSelect = WA.createDomNode('div', domID+'_view');
  this.domNodeSelect.style.display = 'none';
  this.domNodeFather.appendChild(this.domNodeSelect);
  this.domNodeSelectIcon = WA.createDomNode('img', domID+'_selecticon', container.classes.classnameselecticon);
//  this.domNodeSelectIcon.src = '/pics/dot.png';
  this.domNodeSelect.appendChild(this.domNodeSelectIcon);
  this.domNodeSelectClear = WA.createDomNode('img', domID+'_selectclear', container.classes.classnameselectclear);
//  this.domNodeSelectClear.src = '/pics/dot.png';
  this.domNodeSelect.appendChild(this.domNodeSelectClear);
  this.domNodeSelectAll = WA.createDomNode('img', domID+'_selectall', container.classes.classnameselectall);
//  this.domNodeSelectAll.src = '/pics/dot.png';
  this.domNodeSelect.appendChild(this.domNodeSelectAll);
  this.domNodeSelectInverse = WA.createDomNode('img', domID+'_selectinverse', container.classes.classnameselectinverse);
//  this.domNodeSelectInverse.src = '/pics/dot.png';
  this.domNodeSelect.appendChild(this.domNodeSelectInverse);

  this.domNodeEdit = WA.createDomNode('div', domID+'_view');
  this.domNodeEdit.style.display = 'none';
  this.domNodeFather.appendChild(this.domNodeEdit);
  this.domNodeEditIcon = WA.createDomNode('img', domID+'_editicon', container.classes.classnameediticon);
//  this.domNodeEditIcon.src = '/pics/dot.png';
  this.domNodeEdit.appendChild(this.domNodeEditIcon);
  this.domNodeEditNew = WA.createDomNode('img', domID+'_editnew', container.classes.classnameeditnew);
//  this.domNodeEditNew.src = '/pics/dot.png';
  this.domNodeEditNew.style.display = (container.insertable?'':'none');
  this.domNodeEdit.appendChild(this.domNodeEditNew);
  this.domNodeEditDelete = WA.createDomNode('img', domID+'_editdelete', container.classes.classnameeditdelete);
//  this.domNodeEditDelete.src = '/pics/dot.png';
  this.domNodeEditDelete.style.display = (container.deletable?'':'none');
  this.domNodeEdit.appendChild(this.domNodeEditDelete);
  this.domNodeEditSave = WA.createDomNode('img', domID+'_editsave', container.classes.classnameeditsave);
//  this.domNodeEditSave.src = '/pics/dot.png';
  this.domNodeEditSave.style.display = (container.changes?'':'none');
  this.domNodeEdit.appendChild(this.domNodeEditSave);
*/

  this.setMode = setMode;
  function setMode()
  {
    self.domNodeView.style.display = 'none';
    self.domNodeSelect.style.display = 'none';
    self.domNodeEdit.style.display = 'none';
    if (self.container.mode == 'view')
      self.domNodeView.style.display = '';
    else if (self.container.mode == 'select')
      self.domNodeSelect.style.display = '';
    else if (self.container.mode == 'edit')
      self.domNodeEdit.style.display = '';

    // check various status of contained buttons
  }

  this.start = start;
  function start()
  {
    /*
    WA.Managers.event.on('click', self.domNodeViewIcon, self.clickviewicon, true);
    WA.Managers.event.on('click', self.domNodeSelectIcon, self.clickselecticon, true);
    WA.Managers.event.on('click', self.domNodeSelectClear, self.clickselectclear, true);
    WA.Managers.event.on('click', self.domNodeSelectAll, self.clickselectall, true);
    WA.Managers.event.on('click', self.domNodeSelectInverse, self.clickselectinverse, true);
    WA.Managers.event.on('click', self.domNodeEditIcon, self.clickediticon, true);
    WA.Managers.event.on('click', self.domNodeEditNew, self.clickeditnew, true);
    WA.Managers.event.on('click', self.domNodeEditDelete, self.clickeditdelete, true);
    WA.Managers.event.on('click', self.domNodeEditSave, self.clickeditsave, true);

    // add help too
    help(self.domNodeViewIcon, {title:'Estas en modo Ver. Click para cambiar el modo'});
    help(self.domNodeSelectIcon, {title:'Estas en modo Seleccionar. Click para cambiar el modo. (click en las lineas para seleccionar/deseleccionar)'});
    help(self.domNodeSelectClear, {title:'Deseleccionar todo'});
    help(self.domNodeSelectAll, {title:'Seleccionar todo'});
    help(self.domNodeSelectInverse, {title:'Invertir la seleccion'});
    help(self.domNodeEditIcon, {title:'Estas en modo Editar. Click para cambiar el modo'});
    help(self.domNodeEditNew, {title:'Insertar nuevo renglon'});
    help(self.domNodeEditDelete, {title:'Borrar los renglones seleccionados (shift-click en las lineas para seleccionar/deseleccionar)'});
    help(self.domNodeEditSave, {title:'Guardar los cambios realizados'});
*/
  }

  this.stop = stop;
  function stop()
  {
    WA.Managers.event.off('click', self.domNodeViewIcon, self.clickviewicon, true);
    WA.Managers.event.off('click', self.domNodeSelectIcon, self.clickselecticon, true);
    WA.Managers.event.off('click', self.domNodeSelectClear, self.clickselectclear, true);
    WA.Managers.event.off('click', self.domNodeSelectAll, self.clickselectall, true);
    WA.Managers.event.off('click', self.domNodeSelectInverse, self.clickselectinverse, true);
    WA.Managers.event.off('click', self.domNodeEditIcon, self.clickediticon, true);
    WA.Managers.event.off('click', self.domNodeEditNew, self.clickeditnew, true);
    WA.Managers.event.off('click', self.domNodeEditDelete, self.clickeditdelete, true);
    WA.Managers.event.off('click', self.domNodeEditSave, self.clickeditsave, true);
  }

  this.clickviewicon = clickviewicon;
  function clickviewicon()
  {
    if (self.container.isselectable)
      self.container.mode = 'select';
    else if (self.container.iseditable)
      self.container.mode = 'edit';
    self.setMode();
  }

  this.clickselecticon = clickselecticon;
  function clickselecticon()
  {
    if (self.container.iseditable)
      self.container.mode = 'edit';
    else
      self.container.mode = 'view';
    self.setMode();
  }

  this.clickselectclear = clickselectclear;
  function clickselectclear()
  {
    self.container.selectmask('clear');
  }

  this.clickselectall = clickselectall;
  function clickselectall()
  {
    self.container.selectmask('all');
  }

  this.clickselectinverse = clickselectinverse;
  function clickselectinverse()
  {
    self.container.selectmask('inverse');
  }

  this.clickediticon = clickediticon;
  function clickediticon()
  {
    self.container.mode = 'view';
    self.setMode();
  }

  this.clickeditnew = clickeditnew;
  function clickeditnew(e)
  {
    self.container.newline();
  }

  this.clickeditdelete = clickeditdelete;
  function clickeditdelete()
  {
    self.container.deleteselected();
  }

  this.clickeditsave = clickeditsave;
  function clickeditsave()
  {
    self.container.saveall();
  }
  
  this.populate = populate;
  function populate()
  {
    // agregar la cantidad total de renglones en el footer
    self.domNodeQuantity.innerHTML = self.father.total;
  }
}
