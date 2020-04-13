
/*
    helpManager.js, WAJAF, the WebAbility(r) Javascript Application Framework
    Contains the Manager singleton to manage any bubble contextual help on elements
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

// Help have 3 tags: title, summary and body. Over an element will display title always (like alt on image) after 1 second
// if help is on, will display help bubble after 2 seconds more.
// once in the help, click on the 'more' botton to have complete help or close the help

WA.Managers.help = new function()
{
  var self = this;

  // default values, read/write
  this.timeoutsummary = 600;
  this.timeoutcomplete = 4000;  // default timeout: 4 sec after showing help
  this.classalt = 'helpalt';
  this.templatealt = '{text}';
  this.classfull = 'helpfull';
  this.templatefull = '<u><b>{title}</b></u><br />{text}';
  this.soundshow = '/sounds/help_show.mp3';
  this.soundclose = '/sounds/help_close.mp3';

  // private working attributes
  this.helps = {};
  this.mode = 2;      // 0 = off, 1 = alt, 2 = complete help

  this.sound = WA.isDefined(WA.Managers.sound)?true:false;
  this.anim = WA.isDefined(WA.Managers.anim)?true:false;

  this.timersummary = null;
  this.timercomplete = null;

  this.show = false;
  this.domNodeAlt = null;
  this.domNode = null;
  this.opened = 0;    // 1 = alt, 2 = description
  this.x = 0;
  this.y = 0;
  this.actualid = null;

  // =============================== PRIVATE METHODS ===================================
  // alt help end of closing
  function endhidealt()
  {
    self.domNodeAlt.style.left = '-1000px';
    self.domNodeAlt.style.top = '-1000px';
  }

  // hide the alt help
  function hidealt()
  {
    if (self.anim)
      WA.Managers.anim.createSprite('helphidealt', self.domNodeAlt, endhidealt, {autostart:true,chain:[{type:'move',tinit:90,tend:0,time:100}]});
    else
      endhidealt();
    self.opened = 0;
    self.actualid = null;
  }

  // full help end of closing
  function endhide()
  {
    self.domNode.style.left = '-1000px';
    self.domNode.style.top = '-1000px';
  }

  // full help closing click
  function hide()
  {
    if (self.anim)
      WA.Managers.anim.createSprite('helphide', self.domNode, endhide, {autostart:true,chain:[{type:'move',tinit:90,tend:0,time:200}]});
    else
      endhide();
    if (self.sound)
      WA.Managers.sound.startSound('helpclose');
    self.opened = 0;
    self.actualid = null;
  }

  // full help listener for previous node click
  function previous()
  {
    // 1. seek previous VISIBLE
    var id = self.actualid = searchID(self.actualid, 2);
    // 2. get previous Xcenter and Ycenter
    self.x = WA.browser.getNodeNodeLeft(self.helps[id].node, null);
    self.y = WA.browser.getNodeNodeTop(self.helps[id].node, null);
    self.w = WA.browser.getNodeOuterWidth(self.helps[id].node);
    self.h = WA.browser.getNodeOuterHeight(self.helps[id].node);
    // 3. change coords
    position();
    // 4. change messages
    // set the texts using the templates
    WA.browser.setInnerHTML(self.domNodeAlt, self.templatealt.sprintf( { text:(self.helps[id].summary?self.helps[id].summary:self.helps[id].title) } ) );
    WA.browser.setInnerHTML(self.domNodetext, self.templatefull.sprintf( { title:self.helps[id].title, text:(self.helps[id].description?self.helps[id].description:self.helps[id].summary) } ) );
  }

  // full help listener for next node click
  function next()
  {
    // 1. seek next VISIBLE
    var id = self.actualid = searchID(self.actualid, 1);
    // 2. get next Xcenter and Ycenter
    self.x = WA.browser.getNodeNodeLeft(self.helps[id].node, null);
    self.y = WA.browser.getNodeNodeTop(self.helps[id].node, null);
    self.w = WA.browser.getNodeOuterWidth(self.helps[id].node);
    self.h = WA.browser.getNodeOuterHeight(self.helps[id].node);
    // 3. change coords
    position();
    // 4. change messages
    // set the texts using the templates
    WA.browser.setInnerHTML(self.domNodeAlt, self.templatealt.sprintf( { text:(self.helps[id].summary?self.helps[id].summary:self.helps[id].title) } ) );
    WA.browser.setInnerHTML(self.domNodetext, self.templatefull.sprintf( { title:self.helps[id].title, text:(self.helps[id].description?self.helps[id].description:self.helps[id].summary) } ) );
  }

  // creates all the help nodes
  function createNodes()
  {
    // Fast alt help
    self.domNodeAlt = WA.createDomNode('div', 'help_alt', 'helpalt');
    self.domNodeAlt.style.position = 'absolute';
    self.domNodeAlt.style.left = '-1000px';
    self.domNodeAlt.style.top = '-1000px';
    document.body.appendChild(self.domNodeAlt);

    // Full navigate help
    self.domNode = WA.createDomNode('div', 'help_full', 'helpfull');
    self.domNode.style.position = 'absolute';
    self.domNode.style.left = '-1000px';
    self.domNode.style.top = '-1000px';
    document.body.appendChild(self.domNode);

    // the box
    self.domNodeBox = WA.createDomNode('div', null, 'box');
    self.domNode.appendChild(self.domNodeBox);
    // then we create all the 10 images, + , X , and text area
    self.domNodetl = WA.createDomNode('div', null, 'tl');
    self.domNodeBox.appendChild(self.domNodetl);
    self.domNodet = WA.createDomNode('div', null, 't');
    self.domNodeBox.appendChild(self.domNodet);
    self.domNodetr = WA.createDomNode('div', null, 'tr');
    self.domNodeBox.appendChild(self.domNodetr);
    self.domNodel = WA.createDomNode('div', null, 'l');
    self.domNodeBox.appendChild(self.domNodel);
    self.domNoder = WA.createDomNode('div', null, 'r');
    self.domNodeBox.appendChild(self.domNoder);
    self.domNodebl = WA.createDomNode('div', null, 'bl');
    self.domNodeBox.appendChild(self.domNodebl);
    self.domNodeb = WA.createDomNode('div', null, 'b');
    self.domNodeBox.appendChild(self.domNodeb);
    self.domNodebr = WA.createDomNode('div', null, 'br');
    self.domNodeBox.appendChild(self.domNodebr);
    self.domNodeprevious = WA.createDomNode('div', null, 'previous');
    self.domNodeBox.appendChild(self.domNodeprevious);
    self.domNodenext = WA.createDomNode('div', null, 'next');
    self.domNodeBox.appendChild(self.domNodenext);
    self.domNodeclose = WA.createDomNode('div', null, 'close');
    self.domNodeBox.appendChild(self.domNodeclose);
    self.domNodetext = WA.createDomNode('div', null, 'text');
    self.domNodeBox.appendChild(self.domNodetext);

    self.domNodeCircle = WA.createDomNode('div', null, 'circle');
    self.domNode.appendChild(self.domNodeCircle);
    self.domNodePointer = WA.createDomNode('div', null, 'pointer');
    self.domNode.appendChild(self.domNodePointer);

    WA.Managers.event.on('click', self.domNodeclose, hide, true);
    WA.Managers.event.on('click', self.domNodeprevious, previous, true);
    WA.Managers.event.on('click', self.domNodenext, next, true);

    // we add the sound too
    if (self.sound)
    {
      WA.Managers.sound.addSound('helpshow', self.soundshow);
      WA.Managers.sound.addSound('helpclose', self.soundclose);
    }
  }

  // over any element to give help
  function over(e)
  {
    if (self.mode == 0)
      return;
    if (self.opened > 0)
      return;

    var id = self.actualid = WA.browser.getCursorNode(e).id;
    if (self.helps[id] != undefined && self.timersummary === null && self.timercomplete === null)
    {
      self.x = WA.browser.getCursorDocumentX(e);
      self.y = WA.browser.getCursorDocumentY(e);
      // set the texts using the templates
      WA.browser.setInnerHTML(self.domNodeAlt, self.templatealt.sprintf( { text:(self.helps[id].summary?self.helps[id].summary:self.helps[id].title) } ) );
      WA.browser.setInnerHTML(self.domNodetext, self.templatefull.sprintf( { title:self.helps[id].title, text:(self.helps[id].description?self.helps[id].description:self.helps[id].summary) } ) );
      // set timer to open help (not immediate)
      self.timersummary = setTimeout( function() { startalt(); }, self.timeoutsummary );
      if ( (self.helps[id].description || self.helps[id].summary) && self.mode == 2 )
        self.timercomplete = setTimeout( function() { start(); }, self.timeoutcomplete );
    }
  }

  // move on the element to show help
  function move(e)
  {
    if (self.opened == 1)
    {
      self.x = WA.browser.getCursorDocumentX(e);
      self.y = WA.browser.getCursorDocumentY(e);
      positionalt();
    }
  }

  // out of element to give help
  function out(e)
  {
    if (self.mode == 0)
      return;
    if (self.timersummary)
    {
      clearTimeout(self.timersummary);
      self.timersummary = null;
    }
    if (self.timercomplete)
    {
      clearTimeout(self.timercomplete);
      self.timercomplete = null;
    }
    if (self.opened == 1)
      hidealt();
  }

  function isvisible(id)
  {
    var node = self.helps[id].node;
    while (node != null)
    {
      if (node.style && node.style.display == 'none')
        return false;
      if (node.style && node.style.visibility == 'invisible')
        return false;
      node = node.parentNode;
    }
    return true;
  }

  // search next element to show for full help. type == 1: next, 2: previous
  function searchID(baseid, type)
  {
    var first = null;
    var previous = null;
    var next = false;
    for (var id in self.helps)
    {
      if (next)
      {
        if (isvisible(id))
          return id;
        else
          return searchID(id, type)
      }
      if (!first)
        first = id;
      if (id == baseid)
      {
        if (type == 2)
        {
          if (previous)
          {
            if (isvisible(previous))
              return previous;
            else
              return searchID(previous, type)
          }
        }
        else
          next = true;
      }
      previous = id;
    }
    if (next)
    {
      if (isvisible(first))
        return first;
      else
        return searchID(first, type)
    }
    if (isvisible(previous))
      return previous;
    return searchID(previous, type)
  }

  // show the alt help
  function positionalt()
  {
    // we have to center the circle on the mouse, then put the right link on the circle
    var xhalf = WA.browser.getWindowWidth() / 2;
    var yhalf = WA.browser.getWindowHeight() / 2;
    var sizex = WA.browser.getNodeOuterWidth(self.domNodeAlt);
    var sizey = WA.browser.getNodeOuterHeight(self.domNodeAlt);
    if (self.x < xhalf)
    {
      if (self.y < yhalf)
      {
        self.domNodeAlt.style.left = (self.x + 20) + 'px';
        self.domNodeAlt.style.top = (self.y + 20) + 'px';
      }
      else
      {
        self.domNodeAlt.style.left = (self.x + 20) + 'px';
        self.domNodeAlt.style.top = (self.y - sizey - 20) + 'px';
      }
    }
    else
    {
      if (self.y < yhalf)
      {
        self.domNodeAlt.style.left = (self.x - sizex - 20) + 'px';
        self.domNodeAlt.style.top = (self.y + 20) + 'px';
      }
      else
      {
        self.domNodeAlt.style.left = (self.x - sizex - 20) + 'px';
        self.domNodeAlt.style.top = (self.y - sizey - 20) + 'px';
      }
    }
    self.domNodeAlt.style.zIndex = WA.getNextZIndex();
  }

  // calculate the position of the help
  function position()
  {
    // we have to center the circle on the mouse, then put the right link on the circle
    var xwin = WA.browser.getDocumentWidth();
    var ywin = WA.browser.getDocumentHeight();
    var xhalf = xwin / 2;
    var yhalf = ywin / 2;

    if (self.x < xhalf)
    {
      if (self.y < yhalf)
      {
        self.domNodeCircle.className = 'circle clt';
        self.domNodePointer.className = 'pointer plt';
        self.domNodeBox.className = 'box blt';
      }
      else
      {
        self.domNodeCircle.className = 'circle clb';
        self.domNodePointer.className = 'pointer plb';
        self.domNodeBox.className = 'box blb';
      }
    }
    else
    {
      if (self.y < yhalf)
      {
        self.domNodeCircle.className = 'circle crt';
        self.domNodePointer.className = 'pointer prt';
        self.domNodeBox.className = 'box brt';
      }
      else
      {
        self.domNodeCircle.className = 'circle crb';
        self.domNodePointer.className = 'pointer prb';
        self.domNodeBox.className = 'box brb';
      }
    }
    // we center the help box on the circle center
    var cx = WA.browser.getNodeOuterWidth(self.domNodeCircle);
    var cy = WA.browser.getNodeOuterHeight(self.domNodeCircle);
    var posx = WA.browser.getNodeNodeLeft(self.domNodeCircle, self.domNode)+cx/2;
    var posy = WA.browser.getNodeNodeTop(self.domNodeCircle, self.domNode)+cy/2;
    // we adjust on the element based on the size of the circle and the element
    var ax = self.w / 2;
    var ay = self.h / 2;
    if (self.w > cx)
      ax = cx / 3;
    if (self.h > cy)
      ay = cy / 3;
    self.domNode.style.left = (self.x - posx + ax < 0 ? 0 : self.x - posx + ax) + 'px';
    self.domNode.style.top = (self.y - posy + ay < 0 ? 0 : self.y - posy + ay) + 'px';
    self.domNode.style.zIndex = WA.getNextZIndex();
  }

  // show the alt help
  function showalt()
  {
    self.opened = 1;
    if (self.anim)
    {
      self.domNode.style.opacity = 0;
      self.domNode.style.filter = 'alpha(opacity: 0)';
    }
    positionalt();
    if (self.anim)
      WA.Managers.anim.createSprite('helpshowalt', self.domNodeAlt, null, {autostart:true,chain:[{type:'move',tinit:0,tend:90,time:100}]});
  }

  // show the full help
  function show()
  {
    if (self.opened == 1)
    {
      var id = self.actualid;
      hidealt();
      self.actualid = id;
    }
    self.opened = 2;
    if (self.anim)
    {
      self.domNode.style.opacity = 0;
      self.domNode.style.filter = 'alpha(opacity: 0)';
    }
    self.x = WA.browser.getNodeNodeLeft(self.helps[id].node, null);
    self.y = WA.browser.getNodeNodeTop(self.helps[id].node, null);
    self.w = WA.browser.getNodeOuterWidth(self.helps[id].node);
    self.h = WA.browser.getNodeOuterHeight(self.helps[id].node);
    position();
    if (self.anim)
      WA.Managers.anim.createSprite('helpshow', self.domNode, null, {autostart:true,chain:[{type:'move',tinit:0,tend:90,time:200}]});
    if (self.sound)
      WA.Managers.sound.startSound('helpshow');
  }

  // start the alt help
  function startalt()
  {
    if (self.timersummary)
    {
      clearTimeout(self.timersummary);
      self.timersummary = null;
    }
    showalt();
  }

  // start the full help
  function start()
  {
    if (self.timercomplete)
    {
      clearTimeout(self.timercomplete);
      self.timercomplete = null;
    }
    show();
  }

  // =============================== PUBLIC METHODS ===================================
  this.addHelp = addHelp;
  function addHelp(node, messages)
  {
    var id = WA.isString(node)?node:node.id;
    var node = WA.isString(node)?WA.toDOM(node):node;
    if (WA.isEmpty(id) || WA.isEmpty(node))
      return false;

    if (self.domNode === null)
      createNodes();
    messages.id = id;
    messages.node = node;
    self.helps[id] = messages;
    WA.Managers.event.on('mouseover', node, over, true);
    WA.Managers.event.on('mousemove', node, move, true);
    WA.Managers.event.on('mouseout', node, out, true);
    return true;
  }

  // must be the SAME PARAMETERS as addListener
  this.removeHelp = removeHelp;
  function removeHelp(node)
  {
    if (!self)  // sometimes helpManager is destroyed before who use it
      return;
    var id = WA.isString(node)?node:node.id;
    var node = WA.isString(node)?WA.toDOM(node):node;
    if (WA.isEmpty(id) || WA.isEmpty(node) || !self.helps[id])
      return false;

    // be sure this help is CLOSED !!!!
    if (self.mode != 0) // we force close any existing help before changing
      self.switchOff();

    WA.Managers.event.off('mouseover', node, over, true);
    WA.Managers.event.off('mousemove', node, move, true);
    WA.Managers.event.off('mouseout', node, out, true);
    delete self.helps[id];
    return true;
  }

  // starts the full interactive mode
  this.startHelp = startHelp;
  function startHelp(id)
  {

  }

  this.switchOn = switchOn;
  function switchOn()
  {
    if (self.mode != 2) // we force close any existing help before changing
      self.switchOff();
    self.mode = 2;
  }

  this.switchAlt = switchAlt;
  function switchAlt()
  {
    if (self.mode != 1) // we force close any existing help before changing
      self.switchOff();
    self.mode = 1;
  }

  this.switchOff = switchOff;
  function switchOff()
  {
    if (self.timersummary)
    {
      clearTimeout(self.timersummary);
      self.timersummary = null;
    }
    if (self.timercomplete)
    {
      clearTimeout(self.timercomplete);
      self.timercomplete = null;
    }
    if (self.opened)
    {
      // we close anything
      endhidealt();
      endhide();
      self.opened = 0;
      self.actualid = null;
    }
    self.mode = 0;
  }

  this.getMode = getMode;
  function getMode()
  {
    return self.mode;
  }

  this.setMode = setMode;
  function setMode(mode)
  {
    if (mode == 0) self.switchOff();
    if (mode == 1) self.switchAlt();
    if (mode == 2) self.switchOn();
  }

  function destroy()
  {
    // switch off anything timers and hide things
    self.switchOff();

    WA.Managers.event.off('click', self.domNodeclose, hide, true);
    WA.Managers.event.off('click', self.domNodeprevious, previous, true);
    WA.Managers.event.off('click', self.domNodenext, next, true);

    self.domNodeAlt = null;
    self.domNode = null;
    self.domNodeBox = null;
    self.domNodetl = null;
    self.domNodet = null;
    self.domNodetr = null;
    self.domNodel = null;
    self.domNoder = null;
    self.domNodebl = null;
    self.domNodeb = null;
    self.domNodebr = null;
    self.domNodeprevious = null;
    self.domNodenext = null;
    self.domNodeclose = null;
    self.domNodetext = null;
    self.domNodeCircle = null;
    self.domNodePointer = null;
    delete self.helps;
    self = null;
  }

  WA.Managers.event.registerFlush(destroy);
}();

