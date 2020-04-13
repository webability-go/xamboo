
/*
    messageManager.js, WAJAF, the WebAbility(r) Javascript Application Framework
    Contains the Manager singleton to manage message queuing with server
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

WA.Managers.message = new function()
{
  var self = this;
  this.url = '';
  this.messagevar = 'Messages';
  this.timing = 1000;
  this.messages = {};

  this.queue = [];
  this.timer = null;
  this.lastframe = false;
  this.waiting = false;

  this.addListener = addListener;
  function addListener(messagename, messagefunction)
  {
    self.messages[messagename] = messagefunction;
  }

  // must be the SAME name as addListener
  this.removeListener = removeListener;
  function removeListener(messagename)
  {
    delete self.messages[messagename];
  }

  function prepareMessages()
  {
    var txt = self.messagevar+'='+WA.JSON.encode({lastframe:self.lastframe,queue:self.queue});
    self.empty();
    return txt;
  }

  function response(request)
  {
    self.waiting = false;

    var code = WA.JSON.decode(request.responseText);
    self.lastframe = code.frame;
    for (var i in code.queue)
    {
      // we ignore messages not included
      if (self.messages[code.queue[i].id])
      {
        self.messages[code.queue[i].id](code.queue[i]);
      }
    }
  }

  function sequence()
  {
    self.timer = setTimeout(sequence, self.timing);
    if (self.waiting)  // only 1 at a time !
      return;

    // we launch messages in queue if any, or empty to get messages
    var data = prepareMessages();
    self.waiting = true;
    self.request = WA.Managers.ajax.createRequest(self.url + '?' + new Date().getTime(), 'POST', data, response, true);
  }

  this.start = start;
  function start(clear)
  {
    if (clear)
      self.empty();
    sequence();
  }

  this.add = add;
  function add(message)
  {
    self.queue.push(message);
  }

  this.empty = empty;
  function empty()
  {
    if (self.queue.length > 0)
    {
      self.queue = [];
    }
  }

  this.stop = stop;
  function stop()
  {
    if (self.timer)
    {
      clearTimeout(self.timer);
      self.timer = null;
    }
  }

  function destroy()
  {
    stop();
    delete self.messages;
    delete self.queue;
    self = null;
  }

  WA.Managers.event.registerFlush(destroy);
}();

