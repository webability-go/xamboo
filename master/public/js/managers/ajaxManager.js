
/*
    ajaxManager.js, WAJAF, the WebAbility(r) Javascript Application Framework
    Contains the Manager singleton to manage ajax requests
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

WA.Managers.ajax = new function()
{
  var self = this;
  this.requests = [];
  this.listener = null;
  this.stateFeedBack = null; // no feedback by default
  this.timeoutabort = 0;     // automatic browser ajax control

  this.setListener = setListener;
  function setListener(listener)
  {
    self.listener = listener;
  }

  this.addStateFeedback = addStateFeedback;
  function addStateFeedback(statefeedback, timeoutabort)
  {
    self.statefeedback = statefeedback;
    if (timeoutabort)
      self.timeoutabort = timeoutabort;
  }

  this.setTimeout = setTimeout;
  function setTimeout(timeoutabort)
  {
    self.timeoutabort = timeoutabort;
  }

  function callNotify(event)
  {
    if (self.listener)
    {
      self.listener(event);
    }
  }

  this.createRequest = createRequest;
  function createRequest(url, method, data, feedback, dosend)
  {
    callNotify('create');
    var r = new WA.Managers.ajax.Request(url, method, data, feedback, dosend, self.listener, self.statefeedback, self.timeoutabort);
    if (r)
    {
      self.requests.push(r);
    }
    return r;
  }

  this.createPeriodicRequest = createPeriodicRequest;
  function createPeriodicRequest(period, times, url, method, data, feedback, dosend)
  {
    callNotify('create');
    var r = new WA.Managers.ajax.Request(url, method, data, feedback, dosend, self.listener, self.statefeedback, self.timeoutabort);
    if (r)
    {
      self.requests.push(r);
      r.setPeriodic(period, times);
    }
    return r;
  }

  this.destroyRequest = destroyRequest;
  function destroyRequest(r)
  {
    for (var i=0, l=self.requests.length; i < l; i++)
    {
      if (self.requests[i] == r)
      {
        self.requests[i].destroy();
        self.requests.splice(i, 1);
        callNotify('destroy');
        break;
      }
    }
  }

  function destroy()
  {
    for (var i=0, l=self.requests.length; i < l; i++)
      self.requests[i].destroy();
    self.listener = null;
    delete self.requests;
    self = null;
  }

  WA.Managers.event.registerFlush(destroy);
}();

WA.Managers.ajax.Request = function(url, method, data, feedback, autosend, listener, statefeedback, timeoutabort)
{
  var self = this;
  // parameters
  this.url = url;
  this.method = method.toUpperCase();
  this.data = data;
  this.feedback = feedback;
  this.autosend = autosend;
  // special parameters
  this.period = 0;
  this.times = 0;
  this.statefeedback = statefeedback;    // consider waiting, error and abort feedbacks
  this.timeoutabort = timeoutabort;      // time out to abort, no default, let it to the ajax autocontrol.
  // working attributes
  this.request = null;
  this.parameters = null;
  this.timer = null;
  this.timerabort = null;
  this.state = 0;               // 0 = nothing, 1 = sent and waiting, 2 = finished, 3 = error
  this.listener = listener;

  try { this.request = new XMLHttpRequest(); }
  catch(e)
  { try { this.request = new ActiveXObject('Msxml2.XMLHTTP.3.0'); }
    catch(e)
    { try { this.request = new ActiveXObject('Msxml2.XMLHTTP'); }
      catch(e)
      { try { this.request = new ActiveXObject('Microsoft.XMLHTTP'); }
        catch(e)
        { alert(WA.i18n.getMessage('ajax.notsupported')); }
      }
    }
  }

  function callNotify(event, data)
  {
    if (self.listener)
    {
      self.listener(event, data);
    }
  }

  // Special parameters
  this.setPeriodic = setPeriodic;
  function setPeriodic(period, times)
  {
    self.period = period;
    self.times = times;
  }

  this.addStateFeedback = addStateFeedback;
  function addStateFeedback(statefeedback, timeoutabort)
  {
    self.statefeedback = statefeedback;
    if (timeoutabort != undefined && timeoutabort != null)
      self.timeoutabort = timeoutabort;
  }

  this.setTimeoutAbort = setTimeoutAbort;
  function setTimeoutAbort(timeoutabort)
  {
    self.timeoutabort = timeoutabort;
  }

  // Parameters for POST/GET send
  this.addParameter = addParameter;
  function addParameter(id, value)
  {
    if (self.parameters === null)
      self.parameters = {};
    self.parameters[id] = value;
  }

  this.getParameters = getParameters;
  function getParameters()
  {
    return self.parameters;
  }

  this.clearParameters = clearParameters;
  function clearParameters()
  {
    self.parameters = null;
  }

  function buildParametersPost()
  {
    var data = self.data || '';
    for (i in self.parameters)
      data += (data.length > 0?'&':'') + encodeURIComponent(i) + '=' + encodeURIComponent(self.parameters[i]);
    return data;
  }

  function buildParameters()
  {
    var data = self.data || '';
    for (i in self.parameters)
      data += (data.length > 0?'&':'') + escape(i) + '=' + escape(self.parameters[i]);
    return data;
  }

  // Ajax control
  function headers()
  {
    self.request.setRequestHeader('X-Requested-With', 'WAJAF::Ajax - WebAbility(r) v6');
    if (self.method == 'POST' || self.method == 'PUT')
    {
      self.request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    }
/*
      Files: multipart/form-data:
      
      if (self.request.overrideMimeType)
        self.request.setRequestHeader('Connection', 'close');
*/
//    self.request.setRequestHeader('Method', self.method + ' ' + self.url + ' HTTP/1.1');
  }

  this.send = send;
  function send(form)
  {
    if (self.timer)
      self.timer = null;
    if (self.request.readyState != 0 && self.request.readyState != 4) // still doing something
      return;

    self.request.onreadystatechange = process;
    if (self.timeoutabort)
      self.timerabort = setTimeout( function() { timeabort(); }, self.timeoutabort );
    try
    {
      var url = self.url;
      if (self.method == 'GET')
      {
        var parameters = buildParameters();
        if (parameters.length > 0)
          url += (url.match(/\?/) ? '&' : '?') + parameters;
      }
      self.request.open(self.method, url, true);
      if (!form)
        headers();
      callNotify('start');
      if (self.method == 'POST')
      {
        if (!!form)
        {
          self.request.send(form);
        }
        else
        {
          var parameters = buildParametersPost();
          self.request.send(parameters);
        }
      }
      else if (self.method == 'PUT')
        self.request.send(WA.JSON.encode(self.parameters));
      else
        self.request.send(null);
      self.state = 1;
      WA.debug.log(WA.i18n.getMessage('ajax.send')+url, 2);
    }
    catch (e)
    {
      WA.debug.log(WA.i18n.getMessage('ajax.errorcreation')+url, 1);
      self.state = 3;
      processError(1, e);
    }
  }

  function process()
  {
    try
    {
      if (self.request.readyState == 4)
      {
        if (self.request.status == 200)
        {
          WA.debug.log(WA.i18n.getMessage('ajax.received')+self.url, 2);
          if (self.timerabort)
          {
            clearTimeout(self.timerabort);
            self.timerabort = null;
          }
          callNotify('stop');
          if (self.feedback)
          {
            self.feedback(self.request);
          }
          self.state = 2;
        }
        else
        {
          WA.debug.log(WA.i18n.getMessage('ajax.errorreception')+self.url, 1);
          self.state = 3;
          // we call error feedback, or alert
          processError(3, WA.i18n.getMessage('ajax.error')+self.request.status+':\n' + self.request.statusText, self.request);
        }
        self.request.onreadystatechange = WA.nothing;  // IE6 CANNOT assign null !!!
        var state = checkPeriod();
        if (!state)
          setTimeout( function() { WA.Managers.ajax.destroyRequest(self); }, 1);
      }
      else
      {
        waiting();
      }
    }
    catch(e)
    {
      WA.debug.log(WA.i18n.getMessage('ajax.fatalerror')+self.url+' '+e, 1);
      self.state = 3;
      processError(2, e);
    }
  }

  function checkPeriod()
  {
    if (self.period)
    {
      if (--self.times > 0)
      {
        self.timer = setTimeout( function() { self.send(); }, self.period);
        return true;
      }
    }
    return false;
  }

  function waiting()
  {
    // dispatcher for user events like "loading...", "making request", "sending information" based on readyState , etc ?
    // could also use a setInterval to periodically call this function to know how is going the call
    if (self.statefeedback)
      self.statefeedback('wait', self.request.readyState, '');
  }

  // any error
  // type = 1: error sending, 2: error during process, 3: error state != 200, 4: timeout forced
  function processError(type, error, request)
  {
    WA.debug.log(error, 1);

    if (self.statefeedback)
      self.statefeedback('error', type, error, request);

    throw error;
/*
    callNotify('error', type);
    if (typeof error == 'object')
      error = error.message;
    // abort and call feedback error
*/
    // Default behaviour is to be silent on error
//    else
//      alert('Error: '+type+', '+error);
  }

  // we abort after a given timeout
  function doabort()
  {
    if (self.timer)
    {
      clearTimeout(self.timer);
      self.timer = null;
    }
    self.request.abort();
    self.request.onreadystatechange = WA.nothing;
    if (!checkPeriod())
      setTimeout( function() { WA.Managers.ajax.destroyRequest(self); }, 1);
  }

  // timeout abort
  function timeabort()
  {
    self.timerabort = null;
    callNotify('abortbytimeout');
    doabort();
  }

  // Manual abort
  this.abort = abort;
  function abort()
  {
    if (self.timerabort)
    {
      clearTimeout(self.timerabort);
      self.timerabort = null;
    }
    callNotify('abortbyuser');
    doabort();
  }

  this.destroy = destroy;
  function destroy()
  {
    self.period = 0;
    self.times = 0;
    if (self.timerabort)
    {
      clearTimeout(self.timerabort);
      self.timerabort = null;
    }
    if (self.timer)
    {
      clearTimeout(self.timer);
      self.timer = null;
    }
    if (self.state == 1 || self.state == 3)
    {
      doabort();
    }
    self.request.onreadystatechange = WA.nothing;
    self.clearParameters();
    delete self.request;
    self.statefeedback = null;
    self.feedback = null;
    self = null;
  }

  if (autosend)
    this.send();
}

WA.i18n.setEntry('ajax.notsupported', 'XMLHttpRequest is not supported. AJAX will not be available.');
WA.i18n.setEntry('ajax.send', 'Sending AJAX request to: ');
WA.i18n.setEntry('ajax.errorcreation', 'Error creating AJAX request to: ');
WA.i18n.setEntry('ajax.received', 'AJAX answer received from: ');
WA.i18n.setEntry('ajax.errorreception', 'Error during AJAX reception from: ');
WA.i18n.setEntry('ajax.fatalerror', 'Fatal error during AJAX reception from: ');
WA.i18n.setEntry('ajax.error', 'Error: ');
