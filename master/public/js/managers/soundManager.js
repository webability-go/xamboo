
/*
    soundManager.js, WAJAF, the WebAbility(r) Javascript Application Framework
    Contains the Manager singleton to manage sounds
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

    ---

    The flash manager soundManager2.swf is taken from:
    http://schillmania.com/projects/soundmanager2/

    Copyright (c) 2008, Scott Schiller. All rights reserved.
    Code licensed under the BSD License:
    http://schillmania.com/projects/soundmanager2/license.txt

    V2.95a.20090717
*/

WA.Managers.sound = new function()
{
  var self = this;
  this.sounds = {};
  this.volume = 100;
  this.on = true;
  
  this.sounds = {};
  
  this.hook = null;

  this.setHook = setHook;
  function setHook(hook)
  {
    self.hook = hook;
  }

  this.addSound = addSound;
  function addSound(soundID, soundlink, autoplay, whileloading, hook)
  {
    if (!soundlink)
      return;
    
    var s = new WA.Managers.sound.sound(self, soundID, soundlink, !!autoplay, whileloading?1:0, hook);
    self.sounds[soundID] = s;
    return s;
  }

  // must be the SAME PARAMETERS as addSound
  this.removeSound = removeSound;
  function removeSound(soundID)
  {
  }

  this.startSound = startSound;
  function startSound(soundID)
  {
    if (!self.sounds[soundID])
      return false;
    return self.sounds[soundID].start();
  }

  this.pauseSound = pauseSound;
  function pauseSound(soundID)
  {
    if (!self.sounds[soundID])
      return false;
    return self.sounds[soundID].pause();
  }

  this.stopSound = stopSound;
  function stopSound(soundID)
  {
    if (!self.sounds[soundID])
      return false;
    return self.sounds[soundID].stop();
  }

  // volume is 0 to 100%
  this.setVolume = setVolume;
  function setVolume(soundID, volume)
  {
    if (!self.sounds[soundID])
      return false;
    return self.sounds[soundID].volume(volume);
  }

  // volume is 0 to 100%
  this.setPan = setPan;
  function setPan(soundID, pan)
  {
    if (!self.sounds[soundID])
      return;
    return self.sounds[soundID].pan(pan);
  }

  // volume is 0 to 100%
  this.setGeneralVolume = setGeneralVolume;
  function setGeneralVolume(volume)
  {

  }

  // on is true/false to switch on/off the volume
  this.switchSound = switchSound;
  function switchSound(on)
  {
    self.on = on;
  }

  // flush
  function destroy()
  {
    delete self.sounds;
    delete self.soundqueue;
    self = null;
  }

  WA.Managers.event.registerFlush(destroy);

}();

WA.Managers.sound.sound = function(m, id, l, a, w, h)
{
  var self = this;
  this.manager = m;
  this.id = id;
  this.link = l;
  this.autoplay = a;
  this.whileloading = w;
  this.hook = h;
  this.node = null;

  this.create = create;
  function create(firstload)
  {
    var node = WA.createDomNode('audio', self.id, null);
    node.src = self.link;
    node.style.display = 'none';
    self.node = node;
    document.getElementsByTagName('body')[0].appendChild(node);
    if (self.autoplay)
      node.play();
  }

  this.callback = callback;
  function callback()
  {

  }

  this.start = start;
  function start()
  {
    self.node.play();
    return true;
  }

  this.pause = pause;
  function pause()
  {
    self.node.pause();
    return true;
  }

  this.stop = stop;
  function stop()
  {
    self.node.stop();
    return true;
  }

  this.volume = volume;
  function volume(v)
  {
    self.node.volume(v);
    return true;
  }

  this.pan = pan;
  function pan(p)
  {
    self.node.pan(p);
    return true;
  }

  create(true);
}

