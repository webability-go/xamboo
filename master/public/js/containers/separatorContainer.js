
/*
    separatorContainer.js, WAJAF, the WebAbility(r) Javascript Application Framework
    Contains the container to present multiple resizable zone separated by sizers, horizontal or vertical
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
   mode                default 'vertical'
   auto                default 'yes'
   * classname         default class: separatorvertical, separatorhorizontal
   * classnamezone     default class: separatorverticalzone, separatorhorizontalzone
*/

/* Known code.attributes of zone:
   * id, application, code
   * style
   * classname         default class: %container.classnamezone
   display             default: ''
   size                default: *
   classnameseparator  default: classname || %container.classname
*/

WA.Containers.separatorContainer = function(fatherNode, domID, code, listener)
{
  var self = this;
  // mode: true if "vertical", false if "horizontal". Any non existing value means vertical by default
  this.mode = (code&&code.attributes&&code.attributes.mode == 'horizontal'?false:true);
  var magic = this.mode?'vertical':'horizontal';

  WA.Containers.separatorContainer.sourceconstructor.call(this, fatherNode, domID, code, 'div', { classname:'separator'+magic }, listener);

  // auto: true if auto (==yes). Any non existing value means manual resize
  this.auto = (this.code.attributes.auto == 'yes');

  this.sizers = {};              // the array of sizers
  this.originalsizes = {};       // keeps the original sizes of zones when the user start dragging

  // working parameters
  this.lastsize = -1;            // inner size of the main container
  this.movingsizer = null;       // id of sizer we are dragging
  this.moved = false;            // true if any sizer has been used

  this.addEvent('resize', resize);
  this.addEvent('postresize', postresize);

  // ========================================================================================
  /* SYSTEM METHODS */
  function resize()
  {
    if (!WA.Containers.separatorContainer.source.resize.call(self))
      return;
    _resizeZones();
  }

  function postresize()
  {
    // we force height IF node is relative
    if (self.domNode.style.position == 'relative')
    {
      // zones ARE always absolute, we force the height

    }
  }


  // code.attributes are:
  // size = 'X' px : fixed or '*' : variable. If container is manual: ALL division have * as default size, but keep initial size with the parameter
  // if '*': we can specify sizemin = 'X' px and sizemax = 'Y' px.
  // classname = zone class or use classnamezone
  this.createZone = createZone;
  function createZone(domID, code, listener)
  {
    var ldomID = WA.parseID(domID, self.xdomID);
    if (!ldomID)
      throw 'Error: the zone id is not valid in separatorContainer.createZone: id=' + domID;
    // check the zone does not exists YET !
    if (self.zones[ldomID[2]])
      throw 'Error: the zone already exists in separatorContainer.createZone: id=' + ldomID[2];

    // 1. call event precreate, can we create ?
    if (!self.callEvent('precreate', {id:ldomID[2]}))
      return null;

    var s = new WA.Containers.separatorContainer.separatorSizer(self, ldomID[3]+'_separator', ldomID[2], code, WA.sizeof(self.sizers));
    if (self.zonesorder)
    self.sizers[ldomID[2]] = s;
    var z = new WA.Containers.separatorContainer.separatorZone(self, ldomID[3], code, listener);
    self.zones[ldomID[2]] = z;
    // if (code.attributes.before) add before this
    self.zonesorder.push(ldomID[2]);
    if (self.zonesorder.length == 1)
      s.hide();

    self.callEvent('postcreate', {id:ldomID[2]});
    if (self.state == 5)
    {
      s.propagate('start');
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
      throw 'Error: the zone id is not valid in simpleContainer.destroyZone: id=' + domID;
    // check the zone must exists YET !
    if (!self.zones[ldomID[2]])
      throw 'Error: the zone does not exists in simpleContainer.destroyZone: id=' + ldomID[2];

    // 2. call event predestroy
    if (!self.callEvent('predestroy', {id:ldomID[2]}) )
      return;

    self.zones[ldomID[2]].destroy();
    delete self.zones[ldomID[2]];
    self.sizers[ldomID[2]].destroy();
    delete self.sizers[ldomID[2]];

    self.callEvent('postdestroy', {id:ldomID[2]});

    /* we check if the sizers was the 1rst one to hide/show the next one */
    if (self.state == 5)
    {
      self.propagate('resize');
    }
  }

  this.destroy = destroy;
  function destroy(fast)
  {
    WA.Containers.separatorContainer.source.destroy.call(self, fast);
    self.sizers = null;
    self.originalsizes = null;
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
    var ldomID = WA.parseID(domID, self.xdomID);
    if (!ldomID) // bad zone
      return;

    // 1. call event preshow
    if (self.zones[ldomID[2]].visible) // already visible
      return;
    if (!self.callEvent('preshow', {id:ldomID[2]}))
      return;

    if (!self.auto)
      self.sizers[ldomID[2]].show();
    self.zones[ldomID[2]].show();
    self.callEvent('postshow', {id:ldomID[2]});
    if (self.state == 5)
    {
      self.propagate('resize');
    }
  }

  this.hideZone = hideZone;
  function hideZone(domID)
  {
    var ldomID = WA.parseID(domID, self.xdomID);
    if (!ldomID)
      return;

    if (!self.zones[ldomID[2]].visible) // already hidden
      return;
    // 1. call event prehide/show
    if (!self.callEvent('prehide', {id:ldomID[2]}))
      return;

    if (!self.auto)
      self.sizers[ldomID[2]].hide();
    self.zones[ldomID[2]].hide();
    self.callEvent('posthide', {id:ldomID[2]});

    if (self.state == 5)
    {
      self.propagate('resize');
    }
  }

  this.getValues = getValues;
  function getValues()
  {
    // return sizes
  }

  this.setValues = setValues;
  function setValues(values)
  {
  }


  // ===============================================================================
  // private functions
  // recalculate sizes of zones

  // different cases:
  // 1. the container is horizontal:
  // [zone 1][zone 2][zone 3]
  // if there is NO width: the width will be automatic (max) due to div properties
  // in *any* cases, take the real width before calculations.
  // if there is NO height, will calculate any widths, set widths, then in a second pass, will take all heights and adjust max height +/- outers to all divs and container div.
  // if there is a height, will take the real height to make calculations.
  // all inner zones are absolute

  // if the size is manual, will add the sizers. if the size of sizers is bigger than the container, will be pushed to the right. (visible/not visible will depends of the main container class

  // 2. the container is vertical:
  // [zone 1]
  // [zone 2]
  // [zone 3]
  // if there is no width: the width will be automatic both container and zones
  // if there is width: same. due to div properties.
  // if there is no height: all divs are relative and let the height automatic.
  // if there is height: same, but set the heights with values.

  // if the size is manual, will add the sizers ONLY if the size if fixed. if the size of sizers is bigger than the container, will be pushed to the bottom. (visible/not visible will depends of the main container class

  function _resizeZones()
  {
    // get the max size
    var max = self.mode?WA.browser.getNodeHeight(self.domNode):WA.browser.getNodeWidth(self.domNode);
    if (max <= 0) // something wrong, we cannot calculate sizes (i.e. container is hidden)
      return;

    // PASS 1: take fized size
    var id = null;
    var lastid = null;
    var realzones = [];
    var fixed = 0;
    for (var i=0, l=self.zonesorder.length; i<l; i++)
    {
      id = self.zonesorder[i];
      if (!self.zones[id].visible)
        continue;
      realzones.push(id);

      // sizer then zone
      if (self.sizers[id].visible) // sizers are always fixed size
        fixed += self.mode?WA.browser.getNodeOuterHeight(self.sizers[id].domNode):WA.browser.getNodeOuterWidth(self.sizers[id].domNode);

      fixed += self.mode?WA.browser.getNodeExtraHeight(self.zones[id].domNode):WA.browser.getNodeExtraWidth(self.zones[id].domNode);
      self.zones[id].newsize = 0;
    }

    if (self.auto)
    {
      // PASS 2: apply fixed zones
      var remain = max - fixed;
      var newlastsize = remain;
      var star = 0;
      for (var i=0, l=realzones.length; i<l; i++)
      {
        id = realzones[i];
        if (self.zones[id].isstar)
        {
          star ++;
          continue;
        }
        if (self.zones[id].isporc)
          var s = Math.floor(newlastsize / 100 * self.zones[id].sizedefault);
        else if (self.zones[id].ispx)
          var s = self.zones[id].sizedefault;

        if (s < remain)
        {
          self.zones[id].newsize = s;
          remain -= s;
        }
        else
        {
          self.zones[id].newsize = remain;
          remain = 0;
        }
      }
      // PASS 2 BIS setup the stars
      var s = Math.floor(remain / star);
      lastid = null;
      for (var i=0, l=realzones.length; i<l; i++)
      {
        id = realzones[i];
        if (!self.zones[id].isstar)
          continue;
        lastid = id;
        if (s < remain)
        {
          self.zones[id].newsize = s;
          remain -= s;
        }
        else
        {
          self.zones[id].newsize = remain;
          remain = 0;
        }
      }
      if (remain > 0 && lastid)
        self.zones[lastid].newsize += remain;
    }
    else
    {
      // SPECIAL PASS: NO SPACE: all shrinked
      if (fixed >= max) // all in 0 and container will surely have some overflow active (hidden or auto, depends on the user class)
      {
        for (var i=0, l=realzones.length; i<l; i++)
        {
          id = realzones[i];
          self.zones[id].newsize = 0;
        }
        var newlastsize = 0;
      }
      else
      {
        // PASS 2: apply new zones sizes if any
        var remain = max - fixed;
        var newlastsize = remain;
        for (var i=0, l=realzones.length; i<l; i++)
        {
          id = realzones[i];
          if (self.zones[id].size == null)
          {
            if (remain == 0)
            {
              self.zones[id].newsize = 0;
              continue;
            }
            if (self.zones[id].isporc)
              var s = Math.floor(remain / 100 * self.zones[id].sizedefault);
            else if (self.zones[id].ispx)
              var s = self.zones[id].sizedefault;
            else if (self.zones[id].isstar)
              var s = Math.floor(remain / l);
            else // error, unkown size
            {}

            if (s < remain)
            {
              self.zones[id].newsize = s;
              remain -= s;
            }
            else
            {
              self.zones[id].newsize = remain;
              remain = 0;
            }
          }
        }
        // PASS 2 BIS: RESIZE NOT NEW ZONES ON REMAINING SIZE
        if (self.lastsize == -1)
          self.lastsize = (remain==0?1:remain);
        var factor = remain / self.lastsize;
        lastid = null;
        for (var i=0, l=realzones.length; i<l; i++)
        {
          lastid = id = realzones[i];
          if (self.zones[id].size == null)
            continue;
          var s = Math.floor(self.zones[id].size * factor);
          if (s < remain)
          {
            self.zones[id].newsize = s;
            remain -= s;
          }
          else
          {
            self.zones[id].newsize = remain;
            remain = 0;
          }
        }
        if (remain > 0 && lastid)
          self.zones[lastid].newsize += remain;
      }
    }

    // PASS 3: apply to nodes
    var pos = 0;
    for (var i=0, l=realzones.length; i<l; i++)
    {
      id = realzones[i];
      if (self.sizers[id].visible) // always fixed
      {
        if (self.mode)
          self.sizers[id].domNode.style.top = pos + 'px';
        else
          self.sizers[id].domNode.style.left = pos + 'px';
        pos += self.mode?WA.browser.getNodeOuterHeight(self.sizers[id].domNode):WA.browser.getNodeOuterWidth(self.sizers[id].domNode);
      }

      if (l == 1) // only 1 zone, full screen
      {
        if (self.mode)
        {
          self.zones[id].domNode.style.top = '0px';
          self.zones[id].domNode.style.bottom = '0px';
        }
        else
        {
          self.zones[id].domNode.style.left = '0px';
          self.zones[id].domNode.style.right = '0px';
        }
      }
      else
      {
        if (i == l-1) // last zone, bottom/right positioned
        {
          if (self.mode)
            self.zones[id].domNode.style.bottom = '0px';
          else
            self.zones[id].domNode.style.right = '0px';
        }
        else
        {
          if (self.mode)
          {
            self.zones[id].domNode.style.bottom = '';
            self.zones[id].domNode.style.top = pos + 'px';
          }
          else
          {
            self.zones[id].domNode.style.right = '';
            self.zones[id].domNode.style.left = pos + 'px';
          }
        }
        if (self.mode)
          self.zones[id].domNode.style.height = self.zones[id].newsize + 'px';
        else
          self.zones[id].domNode.style.width = self.zones[id].newsize + 'px';
        pos += self.zones[id].newsize + (self.mode?WA.browser.getNodeExtraHeight(self.zones[id].domNode):WA.browser.getNodeExtraWidth(self.zones[id].domNode));
      }
      self.zones[id].size = self.zones[id].newsize;
    }
    self.lastsize = newlastsize;
    return;
  }



  // ================================================================
  // move divisions by program and mouse
  this.startdrag = startdrag;
  function startdrag(sizerID, event, group, object, zone, data)
  {
    self.moved = true;
    // we keep original sizes
    for (var i in self.sizers)
    {
      if (!self.sizers.hasOwnProperty(i))
        continue;
      if (!self.sizers[i].visible)
        continue;
      if (self.sizers[i].domID == sizerID)
        self.movingsizer = i;
    }
    for (var i in self.zones)
    {
      if (!self.zones.hasOwnProperty(i))
        continue;
      if (!self.zones[i].visible)
        continue;
      self.originalsizes[i] = self.zones[i].size;
    }
  }

  this.resizeZone = resizeZone;
  function resizeZone(zoneid, diff, down)
  {
    var newsize = self.originalsizes[self.zonesorder[zoneid]] - diff;
    var remain = 0;
    if (newsize < 0)
    {
      remain = newsize;
      if (down && zoneid > 0)
        remain = self.resizeZone(zoneid-1, -newsize, down);
      if (!down && zoneid < self.zonesorder.length-1)
        remain = self.resizeZone(zoneid+1, -newsize, down);
      newsize = 0;
    }
    else
    {
      // we put original sizes
      if (down && zoneid > 0)
        for (var i = 0; i < zoneid; i++) self.zones[self.zonesorder[i]].size = self.originalsizes[self.zonesorder[i]];
      if (!down && zoneid < self.zones.length-1)
        for (var i = zoneid+1; i < self.zonesorder.length; i++) self.zones[self.zonesorder[i]].size = self.originalsizes[self.zonesorder[i]];
    }
    self.zones[self.zonesorder[zoneid]].size = newsize;
    return remain;
  }

  this.drag = drag;
  function drag(event, group, object, zone, data)
  {
    // calculate all div sizes based on movement
    var remain = self.resizeZone(self.zonesorder.indexOf(self.movingsizer)-1, - (self.mode?data.yrelativejailed:data.xrelativejailed), true);
    self.resizeZone(self.zonesorder.indexOf(self.movingsizer), (self.mode?data.yrelativejailed:data.xrelativejailed) - remain, false);

    self.callEvent('drag');
    self.propagate('resize');
  }

  this.drop = drop;
  function drop(event, group, object, zone, data)
  {
    self.movingsizer = null;
    self.originalsizes = {};
  }

  this.pushright = pushright;
  function pushright(sep)
  {
    var found = false;
    for (var i in self.zones)
    {
      if (!self.zones.hasOwnProperty(i))
        continue;
      if (!self.zones[i].visible)
        continue;
      if (self.zones[i].type == 'separator' && self.zones[i].domID == sep)
      {
        found = true;
      }
      else if (found && self.zones[i].type != 'separator')
      {
        self.zones[i].width = 0;
      }
    }
  }

  this.pushleft = pushleft;
  function pushleft(sep)
  {
    for (var i in self.zones)
    {
      if (!self.zones.hasOwnProperty(i))
        continue;
      if (!self.zones[i].visible)
        continue;
      if (self.zones[i].type == 'separator' && self.zones[i].domID == sep)
        break;
      if (self.zones[i].type != 'separator')
        self.zones[i].width = 0;
    }
  }

}

// Add basic container code
WA.extend(WA.Containers.separatorContainer, WA.Managers.wa4gl._container);

WA.Containers.separatorContainer.separatorZone = function(father, domID, code, notify)
{
  var self = this;
  WA.Containers.separatorContainer.separatorZone.sourceconstructor.call(this, father, domID, code, 'div', { classname:'zone' });

  this.visible = this.code.attributes.display?this.code.attributes.display!='none':true;

  // zone definition size, never modified. If there is no size defined, we start with auto size
  this.sizedefault = parseFloat(this.code.attributes.size);
  if (isNaN(this.sizedefault))
    this.sizedefault = 0;

  // the real calculated size (always pixels)
  this.isporc = (typeof this.code.attributes.size == "string" && this.code.attributes.size.indexOf('%') >= 0);
  this.ispx =   ((typeof this.code.attributes.size == "string" && this.code.attributes.size.indexOf('%') < 0 && this.code.attributes.size.indexOf('*') < 0)
                  || typeof this.code.attributes.size == "number");
  this.isstar = ((typeof this.code.attributes.size == "string" && this.code.attributes.size.indexOf('*') >= 0) || this.code.attributes.size == undefined);
  this.size = null;      // final size in px
  this.newsize = null;   // temporary size during calculation in px
  this.domNode.style.display = this.visible?'':'none';

  // ========================================================================================
  this.removePosition = removePosition;
  function removePosition()
  {
    self.domNode.style.left = '';
    self.domNode.style.top = '';
    self.domNode.style.width = '';
    self.domNode.style.height = '';
  }

  // ========================================================================================
  // standard system functions

  this.destroy = destroy;
  function destroy(fast)
  {
    WA.Containers.separatorContainer.separatorZone.source.destroy.call(self, fast);
    self = null;
  }

}

// Add basic zone code
WA.extend(WA.Containers.separatorContainer.separatorZone, WA.Managers.wa4gl._zone);


WA.Containers.separatorContainer.separatorSizer = function(father, domID, domIDControl, code, position)
{
  var self = this;
  this.domIDControl = domIDControl;
  WA.Containers.separatorContainer.separatorSizer.sourceconstructor.call(this, father, domID, code, 'div', { classname:'sizer' });

  this.position = position;
  this.visible = this.code.attributes.display?this.code.attributes.display!='none':true;
  this.realvisible = this.visible&&!father.auto&&position!=0;
  this.domNode.style.display = this.realvisible?'':'none';

  // ========================================================================================
  // standard system functions
  this.addEvent('start', start);
  this.addEvent('stop', stop);

  function start()
  {
    WA.Managers.dd.registerGroup(self.domID, 'caller', true, self.father.domID, move);
    WA.Managers.dd.registerObject(self.domID, self.domID, self.domID, null);
  }

  function stop()
  {
    WA.Managers.dd.unregisterObject(self.domID);
    WA.Managers.dd.unregisterGroup(self.domID);
  }

  function move(event, group, object, zone, data)
  {
    if (event == 'start')
    {
      self.father.startdrag(self.domID, event, group, object, zone, data);
    }
    else if (event == 'drag' || event == 'drop')
    {
      self.father.drag(event, group, object, zone, data);
    }
    if (event == 'drop')
    {
      self.father.drop(event, group, object, zone, data);
    }
  }

  this.destroy = destroy;
  function destroy(fast)
  {
    WA.Containers.separatorContainer.separatorSizer.source.destroy.call(self, fast);
    self = null;
  }
}

// Add basic zone code
WA.extend(WA.Containers.separatorContainer.separatorSizer, WA.Managers.wa4gl._zone);
