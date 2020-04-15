
/*
    barContainer.js, WAJAF, the WebAbility(r) Javascript Application Framework
    Contains container to control a buttons menu bar
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

function barButton(id, type, imageoff, imageoffover, imageon, imageonover, imagedisable, callback, callbackevents, manager)
{
  // we use a trick for functions since 'this' is NOT including 'var' !
  var self = this;
  this.myManager = manager;
  this.myCallback = callback;
  this.myCallbackevents = callbackevents;
  this.id = id;
  this.type = type;
  this.imageoff = imageoff;
  this.imageoffover = imageoffover;
  this.imageon = imageon;
  this.imageonover = imageonover;
  this.imagedisable = imagedisable;
  this.enabled = false;
  this.active = false;
  this.shown = true;

  this.off = off;
  function off()
  {
    if (self.type != 1)
      return;
    self.active = false;
    WA.toDOM(self.id).className = self.myManager.classoff;
    if (self.imageoff)
      WA.toDOM(self.id).src = self.imageoff;
  }

  this.on = on;
  function on()
  {
    if (self.type != 1)
      return;
    self.active = true;
    WA.toDOM(self.id).className = self.myManager.classon;
    if (self.imageon)
      WA.toDOM(self.id).src = self.imageon;
  }

  this.disable = disable;
  function disable()
  {
    if (self.type != 1)
      return;
    self.enabled = false;
    WA.toDOM(self.id).className = self.myManager.classdisable;
    if (self.imagedisable)
      WA.toDOM(self.id).src = self.imagedisable;
  }

  this.enable = enable;
  function enable()
  {
    if (self.type != 1)
      return;
    self.enabled = true;
    WA.toDOM(self.id).className = self.myManager.classoff;
    if (self.imageoff)
      WA.toDOM(self.id).src = self.imageoff;
  }

  this.hide = hide;
  function hide()
  {
    if (self.type != 1)
      return;
    WA.toDOM(self.id).style.visibility = 'hidden';
    self.shown = false;
  }

  this.show = show;
  function show()
  {
    if (self.type != 1)
      return;
    self.shown = true;
    WA.toDOM(self.id).style.visibility = 'visible';
  }

  this.click = click;
  function click()
  {
    self.myCallback();
  }

  this.over = over;
  function over()
  {
    if (self.active)
      WA.toDOM(self.id).className = self.myManager.classonover;
    else
      WA.toDOM(self.id).className = self.myManager.classoffover;
    if (self.myCallbackevents)
      self.myCallbackevents(self.id, 1);
  }

  this.out = out;
  function out()
  {
    if (self.active)
      WA.toDOM(self.id).className = self.myManager.classon;
    else
      WA.toDOM(self.id).className = self.myManager.classoff;
    if (self.myCallbackevents)
      self.myCallbackevents(self.id, 2);
  }

  this.build = build;
  function build()
  {
    if (self.type == 1)
    {
      return '<img id="'+self.id+'" src="'+self.imageoff+'" alt="" class="'+self.myManager.classoff+'" />'
    }
    else if (self.type == 2)
    {
      return '<img src="/pics/dot.gif" alt="" style="width: 1px; height: '+self.myManager.height+'px; background-color: #333333; margin-left: 5px; margin-right: 5px;" />';
    }
    else if (self.type == 3)
    {
      return '<img src="/pics/dot.gif" alt="" style="width: 30px; height: '+self.myManager.height+'px;" />';
    }
  }

  this.unregister = unregister;
  function unregister()
  {
    if (self.type != 1)
      return;
    dd = WA.toDOM(self.id);
    if (dd)
    {
      dd.onclick = null;
      dd.onmouseover = null;
      dd.onmouseout = null;
    }
  }

  this.register = register;
  function register()
  {
    if (self.type != 1)
      return;
    dd = WA.toDOM(self.id);
    if (dd)
    {
      dd.onclick = self.click;
      dd.onmouseover = self.over;
      dd.onmouseout = self.out;
    }
  }

  // Constructor
  return this;
}

function barContainer(domID, params, feedback, _4glNode)
{
  var self = this;
  this.domID = domID;
  this._4glNode = _4glNode;
  this.params = params;
  this.feedback = feedback;

  // the zone is the domID itself. id is ignored. params may have 'classname'
  this.createZone = createZone;
  function createZone(id, params)
  {
    if (params['classname'])
      self.domNode.className = params['classname'];
    return self;
  }

  // nothing to start
  this.start = start;
  function start()
  {
  }

  // nothing explicit to resize
  this.resize = resize;
  function resize()
  {
  }

  // nothing to save
  this.getvalues = getvalues;
  function getvalues()
  {
    return null;
  }

  // nothing to load
  this.setvalues = setvalues;
  function setvalues(values)
  {
  }

  // nothing to stop
  this.stop = stop;
  function stop()
  {
  }

  this.destroy = destroy;
  function destroy()
  {
    this.domID = null;
    this._4glNode = null;
    this.params = null;
    this.feedback = null;
    this.domNode = null;
  }






  var self = this;
  this.id = id;
  this.container = WA.toDOM(id);
  this.debug = false;
  this.buttons = new Array();
  this.classbar = '';
  this.classoff = '';
  this.classoffover = '';
  this.classon = '';
  this.classonover = '';
  this.classdisable = '';
  this.height = 15;
  this.built = false;
  this.shown = false;

  // **************************************************************************
  // PUBLIC METHODS
  // **************************************************************************

  this.registerButton = registerButton;
  function registerButton(id, type, imageoff, imageoveroff, imageon, imageoveron, imagedisable, callback, callbackevents)
  {
    var button = new barButton(id, type, imageoff, imageoveroff, imageon, imageoveron, imagedisable, callback, callbackevents, self);
    if (!button)
      return null;
    self.buttons[self.buttons.length] = button;
    return button;
  }

  this.allButtonOff = allButtonOff;
  function allButtonOff()
  {
    for (var i=0; i < self.buttons.length; i++)
      self.buttons[i].off();
  }

  this.buttonOff = buttonOff;
  function buttonOff(id)
  {
    for (var i=0; i < self.buttons.length; i++)
    {
      if (self.buttons[i].id == id)
        self.buttons[i].off();
    }
  }

  this.buttonOn = buttonOn;
  function buttonOn(id)
  {
    for (var i=0; i < self.buttons.length; i++)
    {
      if (self.buttons[i].id == id)
        self.buttons[i].on();
    }
  }

  this.buttonSwitch = buttonSwitch;
  function buttonSwitch(id)
  {
    for (var i=0; i < self.buttons.length; i++)
    {
      if (self.buttons[i].id == id)
      {
        if (self.buttons[i].active)
          self.buttons[i].off();
        else
          self.buttons[i].on();
      }
    }
  }

  this.buttonDisable = buttonDisable;
  function buttonDisable(id)
  {
    for (var i=0; i < self.buttons.length; i++)
    {
      if (self.buttons[i].id == id)
        self.buttons[i].disable();
    }
  }

  this.buttonEnable = buttonEnable;
  function buttonEnable(id)
  {
    for (var i=0; i < self.buttons.length; i++)
    {
      if (self.buttons[i].id == id)
        self.buttons[i].enable();
    }
  }

  this.buttonHide = buttonHide;
  function buttonHide(id)
  {
    for (var i=0; i < self.buttons.length; i++)
    {
      if (self.buttons[i].id == id)
        self.buttons[i].hide();
    }
  }

  this.buttonShow = buttonShow;
  function buttonShow(id)
  {
    for (var i=0; i < self.buttons.length; i++)
    {
      if (self.buttons[i].id == id)
        self.buttons[i].show();
    }
  }

  this.show = show;
  function show()
  {
    if (!self.built)
      self.build();
    if (self.container.style.display == 'none')
      self.container.style.display = '';
  }

  this.hide = hide;
  function hide()
  {
    self.container.style.display = 'none';
  }

  this.build = build;
  function build()
  {
    var txt = '<table cellpadding="1" cellspacing="0" border="0" class="'+self.classbar+'"><tr>';
    for (var i=0; i < self.buttons.length; i++)
    {
      txt += '<td>' + self.buttons[i].build() + '</td>';
    }
    txt += '</tr></table>';
    WA.browser.setInnerHTML(self.container, txt);
    for (var i=0; i < self.buttons.length; i++)
    {
      self.buttons[i].register();
    }
    self.built = true;
  }

  return this;
}

WA.Containers.barContainer = barContainer;
