
/*
    animManager.js, WAJAF, the WebAbility(r) Javascript Application Framework
    Contains the Manager singleton to manage animation and sprites
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

WA.Managers.anim = new function()
{
  var self = this;

  var counter = 1;   // for idless sprites, private
  this.sprites = {};
  this.animator = {};

  // script is {}
  // autostart: true/false
  // loop: true/false
  // chain: [] of {}:
  //    type: 'move', 'wait'
  //    metrics: xinit, xend, yinit, yend, winit, wend, hinit, hend, tinit, tend   => x,y: position, w,h: size, t: transparency,
  //             rinit, rend, ginit, gend, binit, bend, brinit, brend, bginit, bgend, bbinit, bbend   => red, green, blue & background
  //    time: time to do it in ms
  //    calculate: function to call instead of using position, size and transparency. will get back a metrics object
  // the sprite will be destroyed at the end of script except if loop = on
  this.createSprite = createSprite;
  function createSprite(id, domNode, callback, script)
  {
    if (!id)
      id = 'sprite'+(counter++);
    if (self.sprites[id])
      return self.sprites[id];

    WA.debug.log('animManager.createSprite('+id+')', 2);
    var sp = new WA.Managers.anim.Sprite(id, domNode, callback, script);
    self.sprites[id] = sp;
    return sp;
  }

  // animator is a persistant sprite with methods to animate, based on an animation image
  // animator is NOT destroyed at the end of animations
  this.createAnimator = createAnimator;
  function createAnimator(id, domNode, image, positions, animations, sounds, callback)
  {
    if (!id)
      id = 'animator'+(counter++);
    if (self.animator[id])
      return self.animator[id];

    WA.debug.log('animManager.createAnimator('+id+')', 2);
    var an = new WA.Managers.anim.Animator(id, domNode, image, positions, animations, sounds, callback);
    self.animator[id] = an;
    return an;
  }

  this.destroyAnimator = destroyAnimator;
  function destroyAnimator(id)
  {

  }

  this.fadein = this.fadeIn = fadein;
  function fadein(domNode, time, callback)
  {
    self.createSprite(domNode.id, domNode, callback, {autostart:true,loop:false,chain:[{type:'move',tinit:0,tend:100,time:time}]});
  }

  this.fadeout = this.fadeOut = fadeout;
  function fadeout(domNode, time, callback)
  {
    self.createSprite(domNode.id, domNode, callback, {autostart:true,loop:false,chain:[{type:'move',tinit:100,tend:0,time:time}]});
  }

  this.openV = openV;
  function openV(domNode, time, hend, callback)
  {
    // we compute hend in case of null or undefined
    if (!hend)
    {
      var d = WA.createDomNode('div', '', '');
      d.style.height = '1px'; // we protect IE bug of '0px' not recognized as totally closed
      d.style.width = '1px'; // we protect IE bug of '0px' not recognized as totally closed
      d.style.overflow = 'hidden';
      domNode.parentNode.insertBefore(d, domNode);
      d.appendChild(domNode);
      domNode.style.height = '';
      hend = WA.browser.getNodeHeight(domNode);
      d.parentNode.insertBefore(domNode, d);
      d.parentNode.removeChild(d);
    }
    self.createSprite(domNode.id, domNode, callback, {autostart:true,loop:false,chain:[{type:'move',hinit:WA.browser.isMSIE?1:0,hend:hend,time:time}]});
  }

  this.closeV = closeV;
  function closeV(domNode, time, hinit, callback)
  {
    // we compute hinit in case of null or undefined
    if (!hinit)
    {
      hinit = WA.browser.getNodeHeight(domNode);
    }
    self.createSprite(domNode.id, domNode, callback, {autostart:true,loop:false,chain:[{type:'move',hinit:hinit,hend:WA.browser.isMSIE?1:0,time:time}]});
  }

  this.openH = openH;
  function openH(domNode, time, wend, callback)
  {
    // we compute hend in case of null or undefined
    self.createSprite(domNode.id, domNode, callback, {autostart:true,loop:false,chain:[{type:'move',winit:WA.browser.isMSIE?1:0,wend:wend,time:time}]});
  }

  this.closeH = closeH;
  function closeH(domNode, time, winit, callback)
  {
    // we compute hend in case of null or undefined
    self.createSprite(domNode.id, domNode, callback, {autostart:true,loop:false,chain:[{type:'move',winit:winit,wend:WA.browser.isMSIE?1:0,time:time}]});
  }

  this.open = open;
  function open(domNode, time, wend, hend, callback)
  {
    // we compute hend in case of null or undefined
    self.createSprite(domNode.id, domNode, callback, {autostart:true,loop:false,chain:[{type:'move',winit:WA.browser.isMSIE?1:0,wend:wend,hinit:WA.browser.isMSIE?1:0,hend:hend,time:time}]});
  }

  this.close = close;
  function close(domNode, time, winit, hinit, callback)
  {
    // we compute hend in case of null or undefined
    self.createSprite(domNode.id, domNode, callback, {autostart:true,loop:false,chain:[{type:'move',winit:winit,wend:WA.browser.isMSIE?1:0,hinit:hinit,hend:WA.browser.isMSIE?1:0,time:time}]});
  }

  this.move = move;
  function move(domNode, time, xinit, yinit, xend, yend, callback)
  {
    // we compute hend in case of null or undefined
    self.createSprite(domNode.id, domNode, callback, {autostart:true,loop:false,chain:[{type:'move',xinit:xinit,xend:xend,yinit:yinit,yend:yend,time:time}]});
  }

  this.destroySprite = destroySprite;
  function destroySprite(id)
  {
    if (self.sprites[id])
    {
      WA.debug.log('animManager.destroySprite('+id+')', 2);
      self.sprites[id].destroy();
      delete self.sprites[id];
    }
  }

  // flush
  function destroy()
  {
    for (var i in self.sprites)
    {
      self.sprites[i].destroy();
      delete self.sprites[i];
    }
    delete self.sprites;
    self = null;
  }

  WA.Managers.event.registerFlush(destroy);
}();

// individual sprites to anim
WA.Managers.anim.Sprite = function(id, domNode, callback, script)
{
  var self = this;

  this.domNode = WA.toDOM(domNode);
  if (this.domNode == null)
    return;

  this.id = id;
  this.callback = callback;
  this.script = script;

  this.timer = null;
  this.starttime = null;
  this.pointer = 0;

  this.suspendedtime = 0;
  this.suspended = false;

  function _getHex(v)
  {
    if (v < 0 ) v = 0;
    if (v > 255) v = 255;
    var s = v.toString(16).toUpperCase();
    if (s.length < 2)
      s = '0' + s;
    return s;
  }

  this.start = start;
  function start()
  {
    self.starttime = new Date().getTime();
    self.pointer = 0;
    if (self.timer) // previous start
    {
      clearTimeout(self.timer);
      self.timer = null;
    }
    _anim();
  }

  this.suspend = suspend;
  function suspend()
  {
    // no timer ? it is not working so we do not suspend
    if (self.timer && !self.suspended)
    {
      self.suspendedtime = new Date().getTime();
      self.suspended = true;
      clearTimeout(self.timer);
      self.timer = null;
    }
  }

  this.resume = resume;
  function resume()
  {
    if (self.suspended)
    {
      var delta = new Date().getTime() - self.suspendedtime;
      self.starttime += delta;
      self.suspended = false;
      _anim();
    }
  }

  this.stop = stop;
  function stop()
  {
    if (self.timer) // previous start
    {
      clearTimeout(self.timer);
      self.timer = null;
    }
    // we destroy ourself
    setTimeout( function() { animManager.destroySprite(self.id); }, 1);
  }

  function _anim()
  {
    clearTimeout(self.timer);
    self.timer = null;

    var time = new Date().getTime();
    var diff = time - self.starttime;
    var order = self.script.chain[self.pointer];
    if (order.calculate)
      order = order.calculate(diff, order);
    if (diff > order.time)
    {
      if (order.type == 'move')
      {
        if (order.xend != undefined)
          self.domNode.style.left = order.xend + 'px';
        if (order.yend != undefined)
          self.domNode.style.top = order.yend + 'px';
        if (order.wend != undefined)
          self.domNode.style.width = order.wend + 'px';
        if (order.hend != undefined)
          self.domNode.style.height = order.hend + 'px';
        if (order.rend != undefined)
          self.domNode.style.color = '#' + _getHex(order.rend) + _getHex(order.gend) + _getHex(order.bend);
        if (order.brend != undefined)
          self.domNode.style.backgroundColor = '#' + _getHex(order.brend) + _getHex(order.bgend) + _getHex(order.bbend);
        if (order.tend != undefined)
        {
          self.domNode.style.opacity = order.tend/100;
          self.domNode.style.filter = 'alpha(opacity: '+order.tend+')';
        }
      }
      self.pointer++;
      if (!self.script.chain[self.pointer])
      {
        if (!self.script.loop)
        {
          if (self.callback)
            self.callback('end');
          WA.Managers.anim.destroySprite(self.id);
          return;
        }
        self.pointer = 0;
        if (self.callback)
          self.callback('loop');
      }
      self.starttime = new Date().getTime() - diff + order.time; // start new cycle synchronized on last one
      self.timer = setTimeout(_anim, 10);
    }
    else
    {
      if (order.type == 'wait')
      {
        self.timer = setTimeout(_anim, order.time - diff );
        return;
      }
      if (order.xend != undefined)
      {
        if (order.xinit === undefined || order.xinit === null)
          order.xinit = WA.browser.getNodeNodeLeft(self.domNode);
        var x = order.xinit + Math.ceil((order.xend-order.xinit)/order.time*diff);
        self.domNode.style.left = x + 'px';
      }
      if (order.yend != undefined)
      {
        if (order.yinit === undefined || order.yinit === null)
          order.yinit = WA.browser.getNodeTop(self.domNode);
        var y = order.yinit + Math.ceil((order.yend-order.yinit)/order.time*diff);
        self.domNode.style.top = y + 'px';
      }
      if (order.wend != undefined)
      {
        if (order.winit === undefined || order.winit === null)
          order.winit = WA.browser.getNodeWidth(self.domNode);
        var w = order.winit + Math.ceil((order.wend-order.winit)/order.time*diff);
        self.domNode.style.width = w + 'px';
      }
      if (order.hend != undefined)
      {
        if (order.hinit === undefined || order.hinit === null)
          order.hinit = WA.browser.getNodeHeight(self.domNode);
        var h = order.hinit + Math.ceil((order.hend-order.hinit)/order.time*diff);
        self.domNode.style.height = h + 'px';
      }
      if (order.rend != undefined || order.gend != undefined || order.bend != undefined)
      {
        if (!order.rinit || !order.ginit || !order.binit)
        {
          order.xinit = WA.browser.getNodeNodeLeft(self.domNode);
        }

        var r = order.rinit + Math.ceil((order.rend-order.rinit)/order.time*diff);
        var g = order.ginit + Math.ceil((order.gend-order.ginit)/order.time*diff);
        var b = order.binit + Math.ceil((order.bend-order.binit)/order.time*diff);
        self.domNode.style.color = '#' + _getHex(r) + _getHex(g) + _getHex(b);
      }
      if (order.brend != undefined || order.bgend != undefined || order.bbend != undefined)
      {
        if (!order.rinit || !order.ginit || !order.binit)
        {
          order.xinit = WA.browser.getNodeNodeLeft(self.domNode);
        }

        var br = order.brinit + Math.ceil((order.brend-order.brinit)/order.time*diff);
        var bg = order.bginit + Math.ceil((order.bgend-order.bginit)/order.time*diff);
        var bb = order.bbinit + Math.ceil((order.bbend-order.bbinit)/order.time*diff);
        self.domNode.style.backgroundColor = '#' + _getHex(br) + _getHex(bg) + _getHex(bb);
      }
      if (order.tend != undefined)
      {
        if (!order.tinit)
        {
          order.xinit = WA.browser.getNodeNodeLeft(self.domNode);
        }

        var t = order.tinit + Math.ceil((order.tend-order.tinit)/order.time*diff);
        self.domNode.style.opacity = t/100;
        self.domNode.style.filter = 'alpha(opacity: '+t+')';
      }
      self.timer = setTimeout(_anim, 10);
    }
  }

  this.destroy = destroy;
  function destroy()
  {
    // we set the node to its original position

    if (self.timer)
      clearTimeout(self.timer);
    self.timer = null;
    self.starttime = null;
    self.pointer = 0;
    self.id = null;
    self.callback = null;
    self.script = null;
    self.domNode = null;
    self = null;
  }

  if (script.autostart)
    this.start();
  return this;
}

// individual sprites to anim
// positions: {} of id:{}:
//   s : synchro start true/false (used to synchro with other anims)
//   x,y,w,h : coords on the image
//   t : time to wait before next
//   n : next id frame
//   r : random anims [id,id,id] to go if present
//   m : music/sound to start with this frame
// If you dont want default anim, just put a simple image with a high time and loop on itself
WA.Managers.anim.Animator = function(id, domNode, image, positions, animations, sounds, callback)
{
  var self = this;
  this.sound = !!WA.Managers.sound;

  this.domNode = WA.toDOM(domNode);
  if (this.domNode == null)
    return;

  this.id = id;
  this.image = image;
  this.positions = positions;
  this.animations = animations;
  this.sounds = sounds;
  this.callback = callback;

  // take the 1rst anim as the default one
  for (var i in animations)
  {
    this.defanim = i;
    break;
  }
  if (this.sound)
  {
    for (var i in sounds)
    {
      WA.Managers.sound.addSound('animator_'+id+'_'+i, sounds[i]);
    }
  }

  this.anim = this.defanim;
  this.frame = 0;
  this.factor = 1;
  this.timer = null;
  this.starttime = null;

  function setImage()
  {
    self.domNode.style.backgroundPosition = -self.positions[self.animations[self.anim][self.frame].f].x + 'px ' +
                                            -self.positions[self.animations[self.anim][self.frame].f].y + 'px';
    self.domNode.style.width = self.positions[self.animations[self.anim][self.frame].f].w + 'px';
    self.domNode.style.height = self.positions[self.animations[self.anim][self.frame].f].h + 'px';
    if (self.animations[self.anim][self.frame].m && self.sound)
    {
      WA.Managers.sound.startSound('animator_'+self.id+'_'+self.animations[self.anim][self.frame].m);
    }
    if (self.callback)
      self.callback(self.id, 'frame', self.anim, self.frame);
  }

  // set the default animation
  // If it is the current one, we switch it also
  this.setdefault = setdefault;
  function setdefault(id)
  {
    if (self.defanim == self.anim)
    {
      self.anim = id;
      self.frame = 0;
      self.factor = 1;
      setImage();
    }
    self.defanim = id;
    self.defframe = 0;
  }

  // main default animation
  this.start = start;
  function start()
  {
    self.starttime = new Date().getTime();
    self.frame = 0;
    self.factor = 1;
    if (self.timer) // previous start
    {
      clearTimeout(self.timer);
      self.timer = null;
    }
    setImage();
    _anim();
  }

  // start a special special animation
  // entry = id of the sub animation
  // loop = 1, 2, ...
  // synchro = true: when the main finish the loop, start this one, false: start immediatly
  this.startanim = startanim;
  function startanim(entry, factor, loop, synchro)
  {
    self.starttime = new Date().getTime();
    if (self.timer) // previous start
    {
      clearTimeout(self.timer);
      self.timer = null;
    }
    self.anim = entry;
    self.frame = 0;
    self.factor = factor;
    setImage();
    _anim();
  }

  // stop of the special animation, back to the main default one
  // restart = true: start main at beginning, false = main follow where it was
  this.stopanim = stopanim;
  function stopanim(restart)
  {
    self.starttime = new Date().getTime();
    if (self.timer) // previous start
    {
      clearTimeout(self.timer);
      self.timer = null;
    }
    self.anim = self.defanim;
    self.frame = 0;
    self.factor = 1;
    setImage();
    _anim();
  }

  this.stop = stop;
  function stop()
  {
    if (self.timer) // previous start
    {
      clearTimeout(self.timer);
      self.timer = null;
    }
  }

  function _anim()
  {
    if (self.timer)
    {
      clearTimeout(self.timer);
      self.timer = null;
    }

    var time = new Date().getTime();
    var diff = time - self.starttime;

    if (diff > self.animations[self.anim][self.frame].t / self.factor)
    {
      self.starttime += self.animations[self.anim][self.frame].t / self.factor;
      // change the frame
      if (++self.frame >= self.animations[self.anim].length)
        self.frame = 0;
      // paint the frame
      setImage();
    }

    self.timer = setTimeout(_anim, 10);
  }

  this.destroy = destroy;
  function destroy()
  {
    // we set the node to its original position

    if (self.timer)
      clearTimeout(self.timer);
    self.timer = null;
    self.starttime = null;
    self.pointer = 0;
    self.id = null;
    self.callback = null;
    self.script = null;
    self.domNode = null;
    self = null;
  }

  // prepare the domNode
  this.domNode.style.backgroundImage = 'url('+this.image+')';
  this.domNode.style.backgroundRepeat = 'no-repeat';
  start();
}

