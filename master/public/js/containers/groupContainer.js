
/*
    groupContainer.js, WAJAF, the WebAbility(r) Javascript Application Framework
    Contains container to control a capturable form
    (c) 2008-2012 Philippe Thomassigny

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

// groupContainer is used to get data and send data from server
// a group contains fields (*fieldElement)
// Buttons can be linked to a group to make group actions
// actions are: new, delete, load, save, next, previous, first, last, next X, previous X,
// Fields can be linked to a group to make filtering and ordering
// URL vars can be linked to a group to make filtering and ordering
// Session vars can be linked to a group to make filtering and ordering
// User vars can be linked to a group to make filtering and ordering
// group is controled by doAction
// Single record:
// clear, load, submit, delete,
// Operation result:
// onsuccess, onfailure (result from submit and delete)
// Navigation record:
// next, previous, last, first
// Multi record:
// ...
// A group container has 4 modes:
// 1 = insert, 2 = update, 3 = delete, 4 = view
// In mode 1: "clear" or "new" put the default values in each fields, others are emptied
// In mode 2,3,4: First display: use the dataset provided with the xml.
//                               if there is no dataset, ask to the server for the dataset for this key
//  next, prev, last, first etc: ask to the server for the dataset
//
// In mode 1: all fields are usable except the ones marked as "readonly", and the "delete use" are not visible
// In mode 2: all fields are usable except the ones marked as "readonly", and the "delete use" are not visible
// In mode 3: all fields are readonly except the ones marked as "delete use"
// In mode 4: all fields are readonly. The ones marked as "delete use" are not visible

/*
  The FORM is a container that will include fields (and any other things)
  It communicates with the server
  It sends and retreive the data by JSON

  The group is normally expandable and will take the size of the inner content.
  If we set a size , there should be a scroll into the inner zone.

  The mode is set at the container loading, and is STARTING mode, since the mode can mutate in time
  varmode/varorder are used to send data to the server
  currentkey *must* be set in mode 2,3,4

  starting the container:
  if there is not dataset, the container ask to the server the record to show and put something like "loading"

  start parameter: full, visual, none
    full: the fields are totally validated since the beginning with messages and classes
    visual: only state of fields colors are displayed
    none: all the fields are like ok at the beginning

  buttonaction:
  resolve the action with or without server based on what we need
  if the form has been modified, then we should ask for a validation before loosing the information

  should implement: preinsert, postinsert, preupdate, postupdate, predelete, postdelete events ?
*/

WA.Containers.groupContainer = function(fatherNode, domID, code, listener)
{
  var self = this;
  WA.Containers.groupContainer.sourceconstructor.call(this, fatherNode, domID, code, 'form', { classname:'group' }, listener);
  this.domNodeForm = this.domNode;
  this.domNode = WA.createDomNode('fieldset', null, null);
  this.domNodeForm.appendChild(this.domNode);

  this.zoneNotify = null;

  // mode variable to send to server
  this.varmode = this.code.attributes.varmode?this.code.attributes.varmode:'groupmode';
  // order variable to send to server
  this.varorder = this.code.attributes.varorder?this.code.attributes.varorder:'grouporder';
  // key variable to send to server
  this.varkey = this.code.attributes.varkey?this.code.attributes.varkey:'groupkey';
  // field variable to send to server
  this.varfield = this.code.attributes.varfield?this.code.attributes.varfield:'groupfield';
  // key of the current record on screen
  this.currentkey = this.code.attributes.key!=undefined?this.code.attributes.key:null;
  this.lastkey = null;

  // mode is 1: insert, 2: modif, 3: delete, 4: see (read only)
  this.mode = 0;    // no mode at start, pending
  this.defaultmode = this.code.attributes.mode?this.code.attributes.mode:1;
  this.status = 1;  // 1 = ok 2 = error
  this.authmodes = [];
  for (var i = 1; i < 5; i++)
  {
    this.authmodes[i] = (this.code.attributes.authmodes?this.code.attributes.authmodes.indexOf(''+i)!=-1:true);
  }

  this.actionlistener = null;
  this.fields = [];
  this.data = {};
  this.dataloaded = false;
  this.datatemporal = {};

  this.error = null;
  this.help = null;

  this.countload = 0;  // reach 3 => send error to user, the data cant be reach
  this.timemessage = 8000; // 8 seconds before degrading

  this.mainerroralert = 'Error: some fields are not valid. Check the red ones.';
  this.servererroralert = 'Error: there was a not specified error on the server.';
  this.title = ['','Insert','Update','Delete','View'];
  this.result = ['','Insert ok','Update ok','Delete ok'];

  for (var i = 0, l = code.children.length; i < l; i++)
  {
    if (code.children[i].tag == 'dataset' && code.children[i].data)
    {
      try
      {
        self.data = WA.JSON.decode(code.children[i].data);
        if (self.data[self.varkey] == self.currentkey)
          self.dataloaded = true;
      }
      catch (e)
      {
        WA.debug.log('Error on the dataset of groupContainer:', 1);
        WA.debug.log(e, 1);
        // what do we do if there is an error in the dataset ? error ? alert ? debug ?
      }
      continue;
    }
    if (code.children[i].tag == 'alertmessage')
      self.mainerroralert = code.children[i].data;
    if (code.children[i].tag == 'servermessage')
      self.servererroralert = code.children[i].data;
    if (code.children[i].tag == 'titleinsert')
      self.title[1] = code.children[i].data;
    if (code.children[i].tag == 'titleupdate')
      self.title[2] = code.children[i].data;
    if (code.children[i].tag == 'titledelete')
      self.title[3] = code.children[i].data;
    if (code.children[i].tag == 'titleview')
      self.title[4] = code.children[i].data;
    if (code.children[i].tag == 'insertok')
      self.result[1] = code.children[i].data;
    if (code.children[i].tag == 'updateok')
      self.result[2] = code.children[i].data;
    if (code.children[i].tag == 'deleteok')
      self.result[3] = code.children[i].data;
  }


  this.domNodeTitle = WA.createDomNode('div', domID+'_title', 'title');
  this.domNode.appendChild(this.domNodeTitle);

  this.domNodeMessage = WA.createDomNode('div', domID+'_message', 'message');
  this.domNode.appendChild(this.domNodeMessage);
  this.domNodeMessage.style.display = 'none';  // not shown by default

  this.domNodeLoading = WA.createDomNode('div', domID+'_loading', 'loading');
  this.domNode.appendChild(this.domNodeLoading);
  this.domNodeLoading.style.display = 'none';  // not shown by default

  this.addEvent('start', start);
  this.addEvent('poststart', poststart);
  this.addEvent('stop', stop);
  this.addEvent('resize', this.resize);
  this.addEvent('postresize', this.postresize);  // resize is default resize

  // ========================================================================================
  // local private methods
  
  function callListener(action)
  {
    if (self.actionlistener)
      self.actionlistener(action, self.mode, self.currentkey, self.data[self.currentkey]);
  }

  // Mode Controler
  function changeMode(newmode, keep)
  {
    if (newmode == self.mode || !self.authmodes[newmode])
      return;
    self.mode = newmode;

    for (var i=0, l=self.fields.length; i < l; i++)
    {
      self.fields[i].setMode(newmode, keep);
    }
    self.domNodeTitle.innerHTML = self.title[newmode];
    // remove messages, errors, etc
    callListener('mode');
  }

  // Data Controler
  function getData(r)
  {
    try
    {
      var data = WA.JSON.decode(r.responseText);
      if (data)
      {
        self.dataloaded = true;
        for (var i in data)
        {
          self.data[i] = data[i];
          self.currentkey = i;
        }
      }
      fillData();
      callListener('fill');
    }
    catch (e)
    {
      WA.debug.log('Error on the .getData of groupContainer:', 1);
      WA.debug.log(e, 1);
      WA.debug.log(r.responseText, 1);
      // we remove the "loading" stuff
      stopLoading();
    }
  }

  function startLoading()
  {
    self.domNodeLoading.style.display = '';
  }

  function stopLoading()
  {
    self.domNodeLoading.style.display = 'none';
  }

  function showMessage(message, success)
  {
    self.domNodeMessage.innerHTML = message;
    self.domNodeMessage.style.display = '';
    self.domNodeMessage.className = 'message ' + (success?'success':'failure');
//    setTimeout(hideMessage, self.timemessage);
  }

  function hideMessage()
  {
    self.domNodeMessage.style.display = 'none';
  }

  // any record change should call this
  function fillData()
  {
    // first check if the record already exists
    if (!self.dataloaded && self.data && self.data[self.currentkey])
    {
      self.dataloaded = true;
    }

    // if the record is NOT set yet, we have to call the server and reenter in this method when the data gets here
    if (!self.dataloaded)
    {
      if (self.countload++ > 3)
      {
        // We should ask to the client "retry ?"
        if (confirm(self.servererroralert))
        {
          self.countload = 0;
          fillData();
        }
        return;
      }

      // we put the "loading" stuff
      startLoading();

      // ask to the server the data
      var request = WA.Managers.ajax.createRequest(WA.Managers.wa4gl.url + WA.Managers.wa4gl.prelib + self.app.applicationID + WA.Managers.wa4gl.premethod + self.id + WA.Managers.wa4gl.preformat + WA.Managers.wa4gl.format, 'POST', self.varorder+'=getrecord'+'&'+self.varmode+'='+self.mode+'&'+self.varkey+'='+self.currentkey, getData, true);

      // we should capture errors and call fillData again on any error to continue the loading process try

      return;
    }

    for (var i=0, l=self.fields.length; i < l; i++)
    {
      // search the record into the data
      var value = null;
      if (self.fields[i].record && self.data[self.currentkey][self.fields[i].id] != undefined )
      {
        value = self.data[self.currentkey][self.fields[i].id];
        self.fields[i].setValues(value);
      }
    }

    // we remove the "loading" stuff if any
    stopLoading();
    checkStatus();
  }

  function checkStatus()
  {
    var globalstatus = 1; // ok by default

    // 1. get the global status
    for (var i=0, l=self.fields.length; i < l; i++)
    {
      // a field is: // 0 = neutral, 1 = ok, 2 = error, 3 = r/o, 4 = disabled
      if (self.fields[i].formtype == 'field' && self.fields[i].status == 2)
      {
        globalstatus = 2;
        break; // we dont need to know more, there is at least an error !
      }
      if (self.fields[i].formtype == 'field' && self.fields[i].modified)
        globalstatus = 3;
    }

    // set the buttons and controls
    for (var i=0, l=self.fields.length; i < l; i++)
    {
      if (self.fields[i].formtype == 'control')
      {
        // sent globalstatus to children, 1 = ok, 2 = error
        self.fields[i].setValues(globalstatus);
      }
    }
    self.status = globalstatus;
  }

  function checkClass()
  {
    switch (self.status)
    {
      case 2: // error
        self.domNodeForm.className = self.classes.classname + ' error';
        break;
      case 1: // ok
        self.domNodeForm.className = self.classes.classname + ' ok';
        break;
      case 3: // ok and modified
        self.domNodeForm.className = self.classes.classname + ' modified';
        break;
    }
  }

  // ========================================================================================
  // standard system functions

  function start()
  {
    WA.Managers.event.on('click', self.domNodeMessage, hideMessage, true);
  }

  function poststart()
  {
    changeMode(self.defaultmode);
    if (self.mode != 1 && !self.dataloaded)
    {
      self.countload = 0;
      fillData();
    }
    else
      checkStatus();
  }

  function stop()
  {
    WA.Managers.event.off('click', self.domNodeMessage, hideMessage, true);
  }

  // ========================================================================================
  // Zones system fct
  this.createZone = createZone;
  function createZone(domID, code, listener)
  {
    var ldomID = WA.parseID(domID, self.xdomID);
    if (!ldomID)
      throw 'Error: the zone id is not valid in groupContainer.createZone: id=' + domID;
    // check the zone does not exists YET !
    if (self.zones[ldomID[2]])
      throw 'Error: the zone already exists in groupContainer.createZone: id=' + ldomID[2];

    // 1. call event create, can we create ?
    if (!self.callEvent('create', {id:ldomID[2]}))
      return null;

    var z = new WA.Containers.groupContainer.groupZone(self, ldomID[3], code, listener);
    self.zones[ldomID[2]] = z;

    self.callEvent('postcreate', {id:ldomID[2]});
    if (self.state == 5)
      z.propagate('start');
    return z;
  }

  this.destroyZone = destroyZone;
  function destroyZone(id)
  {
    var ldomID = WA.parseID(domID, self.xdomID);
    if (!ldomID)
      throw 'Error: the zone id is not valid in groupContainer.destroyZone: id=' + domID;
    // check the zone must exists YET !
    if (!self.zones[ldomID[2]])
      throw 'Error: the zone does not exists in groupContainer.destroyZone: id=' + ldomID[2];

    // 2. call event destroy
    if (!self.callEvent('destroy', {id:ldomID[2]}) )
      return;

    self.zones[ldomID[2]].destroy();
    delete self.zones[ldomID[2]];
    self.callEvent('postdestroy', {id:ldomID[2]});
  }

  this.destroy = destroy;
  function destroy(fast)
  {
    WA.Containers.groupContainer.source.destroy.call(self, fast);

    self.domNodeForm = null;
    self.domNodeTitle = null;
    self.error = null;
    self.help = null;
    self.data = null;
    self.fields = null;
    self = null;
  }

  // ========================================================================================
  // User fct

  // ========================================================================================
  // specific container functions
  this.addListener = addListener;
  function addListener(listener)
  {
    // Send actions of the group to the listener
    self.actionlistener = listener;
    callListener('add');
  }

  // asked by children when there is status change
  this.pleaseCheck = pleaseCheck;
  function pleaseCheck()
  {
    checkStatus();
    checkClass();
  }

  this.registerField = registerField;
  function registerField(field)
  {
    self.fields.push(field);
    return self.mode;
  }

  this.unregisterField = unregisterField;
  function unregisterField(field)
  {
//    self.fields.push(field);
  }

  this.registerHelp = registerHelp;
  function registerHelp(help)
  {
    self.help = help;
  }

  this.unregisterHelp = unregisterHelp;
  function unregisterHelp()
  {
    self.help = null;
  }

  this.registerError = registerError;
  function registerError(error)
  {
    self.error = error;
  }

  this.unregisterError = unregisterError;
  function unregisterError()
  {
    self.error = null;
  }

  this.doAction = doAction;
  function doAction(action, param)
  {
    switch (action)
    {
      case 'insert':        // enter in insert mode.
        self.doInsert();
        break;
      case 'update':        // enter in modif mode of the current record. If there is no currentkey, sends an error ?
        self.doUpdate();
        break;
      case 'delete':        // enter in delete mode of the current record. If there is no currentkey, sends an error ?
        self.doDelete();
        break;
      case 'view':          // enter in view mode of the current record. If there is no currentkey, sends an error ?
        self.doView();
        break;
      case 'reset':         // clear or undo the changes
        self.doReset();
        break;
      case 'submit':
        self.doSubmit();
        break;
      case 'next':
        self.doNext();
        break;
      case 'previous':
        self.doPrevious();
        break;
      case 'last':
        self.doLast();
        break;
      case 'first':
        self.doFirst();
        break;
    }
  }

  this.doInsert = doInsert;
  function doInsert()
  {
    // we keep the current key for if we cancel the insert mode
    self.lastkey = self.currentkey;
    self.currentkey = null;
    changeMode(1);
    self.status = 1;
    pleaseCheck();
  }

  this.doUpdate = doUpdate;
  function doUpdate()
  {
    if (self.currentkey)
    {
      fillData();
      changeMode(2);
      self.countload = 0;
      self.status = 1;
      pleaseCheck();
    }
  }

  this.doDelete = doDelete;
  function doDelete()
  {
    if (self.currentkey)
    {
      fillData();
      changeMode(3);
      self.countload = 0;
      self.status = 1;
      pleaseCheck();
    }
  }

  this.doView = doView;
  function doView()
  {
    if (self.lastkey)
    {
      // we cancel a doInser
      self.currentkey = self.lastkey;
      self.lastkey = null;
    }
    if (self.currentkey)
    {
      changeMode(4);
      self.countload = 0;
      fillData();
    }
    else
    {
      changeMode(4);
      self.countload = 0;
      doFirst();
    }
  }

  this.doReset = doReset;
  function doReset()
  {
    // put the original values of the field
    for (var i=0, l=self.fields.length; i < l; i++)
    {
      self.fields[i].reset();
    }
  }

  this.getResult = getResult;
  function getResult(request)
  {
    try
    {
      var result = WA.JSON.decode( request.responseText );

      if (result && result.login) // nothing to do right now, asking for login
      {
        stopLoading();
        return;
      }
      if (result && result.success)
      {
        var rest = self.callEvent('success', result);
        self.status = 3;
        if (result.messages && result.messages.text)
          showMessage(result.messages.text, true);
        else
          showMessage(self.result[self.mode], true);
        if (self.mode == 1 || self.mode == 2)
        {
          // go to dataloaded = true and set the record based on the values of each fields
          // the record should be in a temporal record ready to apply with the primary key if any
          if (self.mode == 1 && result.key)
          {
            self.currentkey = result.key;
          }
          if (self.currentkey)
            self.data[self.currentkey] = self.datatemporal;
          changeMode(4, true);
        }
        else
        {
          // delete mode (only available for submit: 1,2,3)
          // If there is no view mode available, we just stay here ?
          if (self.authmodes[4] && rest)
          {
            // We refetch data for view ?
            changeMode(4);
            // we destroy the currentkey record
            delete(self.data[self.currentkey]);
            self.dataloaded = false;
            self.countload = 0;
            // but we keep the current key. If there is no record with this current key, the server should get back the nearest record
            fillData();
          }
        }
      }
      else
      {
        setMessages(result);
        self.callEvent('failure', result);
        self.status = 4;
        checkClass();
      }
    }
    catch (e)
    {
      WA.debug.log('Error on the .getResult of groupContainer:', 1);
      WA.debug.log(e, 1);
      WA.debug.log(request.responseText, 1);
    }

    // we remove the "loading" stuff
    stopLoading();
  }

  // basic group options
  this.doSubmit = doSubmit;
  function doSubmit()
  {
    if (self.mode == 4)
      return;

    // check all values are cool
    var result = true;
    for (var i=0, l=self.fields.length; i < l; i++)
    {
      if (self.fields[i].formtype == 'field')
      {
        if (self.fields[i].edition)
        {
          result &= ((self.fields[i].status==0 || self.fields[i].status==1)?true:false);
//          console.log('i = ' + i + ' status = ' + self.fields[i].status);
        }
      }
    }

    if (!result)
    {
      alert(self.mainerroralert);
      return;
    }

    // we put the "loading" stuff
    startLoading();

    // send information to server based on mode
    var request = WA.Managers.ajax.createRequest(WA.Managers.wa4gl.url + WA.Managers.wa4gl.prelib + self.app.applicationID + WA.Managers.wa4gl.premethod + self.id + WA.Managers.wa4gl.preformat + WA.Managers.wa4gl.format, 'POST', null, self.getResult, false);
    if (request)
    {
      self.datatemporal = {};
      for (var i=0, l=self.fields.length; i < l; i++)
      {
        if (self.fields[i].formtype != 'field')
          continue;
        if (!self.fields[i].editable || !self.fields[i].edition)
          continue;
        var values = self.fields[i].getValues();
        // if values is an array, please loop !
        if (typeof values == 'object' || typeof values == 'array')
        {
          for (var j in values)
          {
            request.addParameter(self.fields[i].id + '[' + j + ']', values[j]);
          }
        }
        else
          request.addParameter(self.fields[i].id, values);
        self.datatemporal[self.fields[i].id] = values;
      }
      if (self.mode != 1)
        request.addParameter(self.varkey, self.currentkey);
      request.addParameter(self.varmode, self.mode);
      request.addParameter(self.varorder, 'submit');
      // please communicate with JSON (transparent variable to notify to the server we need a JSON answer. aka dommask for instance)
      request.addParameter(self.id+'_JSON', 1);
      request.send();
    }
    else
    {
      alert('Error: request could not be created');
    }
  }

  this.doNext = doNext;
  function doNext()
  {
    // we put the "loading" stuff
    startLoading();
    self.dataloaded = false;

    // ask to the server the data
    var request = WA.Managers.ajax.createRequest(WA.Managers.wa4gl.url + WA.Managers.wa4gl.prelib + self.app.applicationID + WA.Managers.wa4gl.premethod + self.id + WA.Managers.wa4gl.preformat + WA.Managers.wa4gl.format, 'POST', self.varorder+'=next'+'&'+self.varmode+'='+self.mode+'&'+self.varkey+'='+self.currentkey, getData, true);
  }

  this.doPrevious = doPrevious;
  function doPrevious()
  {
    // we put the "loading" stuff
    startLoading();
    self.dataloaded = false;

    // ask to the server the data
    var request = WA.Managers.ajax.createRequest(WA.Managers.wa4gl.url + WA.Managers.wa4gl.prelib + self.app.applicationID + WA.Managers.wa4gl.premethod + self.id + WA.Managers.wa4gl.preformat + WA.Managers.wa4gl.format, 'POST', self.varorder+'=previous'+'&'+self.varmode+'='+self.mode+'&'+self.varkey+'='+self.currentkey, getData, true);
  }

  this.doFirst = doFirst;
  function doFirst()
  {
    // we put the "loading" stuff
    startLoading();
    self.dataloaded = false;

    // ask to the server the data
    var request = WA.Managers.ajax.createRequest(WA.Managers.wa4gl.url + WA.Managers.wa4gl.prelib + self.app.applicationID + WA.Managers.wa4gl.premethod + self.id + WA.Managers.wa4gl.preformat + WA.Managers.wa4gl.format, 'POST', self.varorder+'=first'+'&'+self.varmode+'='+self.mode+'&'+self.varkey+'='+self.currentkey, getData, true);
  }

  this.doLast = doLast;
  function doLast()
  {
    // we put the "loading" stuff
    startLoading();
    self.dataloaded = false;

    // ask to the server the data
    var request = WA.Managers.ajax.createRequest(WA.Managers.wa4gl.url + WA.Managers.wa4gl.prelib + self.app.applicationID + WA.Managers.wa4gl.premethod + self.id + WA.Managers.wa4gl.preformat + WA.Managers.wa4gl.format, 'POST', self.varorder+'=last'+'&'+self.varmode+'='+self.mode+'&'+self.varkey+'='+self.currentkey, getData, true);
  }

  this.setMessages = setMessages;
  function setMessages(params)
  {
    // 3 ways to put messages:
    // 1. is POPUP
    // 2. is any error domID
    // 3. is any field with its own error
    if (!params || !params.messages)
    {
      showMessage(self.servererroralert, false);
      return;
    }
    var popup = '';
    var html = '';
    if (params.messages.main)
    {
      popup += params.messages.main + '\n';
      html += params.messages.main + '<br />';
    }
    for (var i=0, l=self.fields.length; i < l; i++)
    {
      if (params.messages[self.fields[i].id] == undefined)
        continue;
      popup += params.messages[self.fields[i].id] + '\n';
      html += params.messages[self.fields[i].id] + '<br />';
      self.fields[i].setError(params.messages[self.fields[i].id]);
    }
    if (html)
      showMessage(html, false);
    if (params.popup)
      alert(popup);
  }

  this.getFieldValue = getFieldValue;
  function getFieldValue(fieldid)
  {
    for (var i=0, l=self.fields.length; i < l; i++)
    {
      if (self.fields[i].id == fieldid)
        return self.fields[i].getValues();
    }
    return null;
  }

  // check all the fields and the group
  this.change = change;
  function change()
  {
    self.status = 2;
    checkClass();

    // clear help, clear error
    self.clearError();

    // pass status to buttons
//    self.setStatus();
  }

  this.clearError = clearError;
  function clearError()
  {
    if (self.error)
    {
      self.error.setError('');
    }
  }

  this.getMode = getMode;
  function getMode()
  {
    return self.mode;
  }

}

// Add basic container code
WA.extend(WA.Containers.groupContainer, WA.Managers.wa4gl._container);

WA.Containers.groupContainer.groupZone = function(father, domID, code, listener)
{
  var self = this;
  WA.Containers.groupContainer.groupZone.sourceconstructor.call(this, father, domID, code, 'div', { classname:code.attributes.type }, listener);
  if (code.attributes.type != 'field')
  {
    this.domNode.style.display = '';
    this.visible = true;
  }

  // status = 0: default (blur neutral), 1: focus, 2: modified, 3: error
  this.setStatus = setStatus;
  function setStatus(status)
  {
    switch(status)
    {
      case 0:
        this.domNode.className = self.classes.classname;
        break;
      case 1:
        this.domNode.className = self.classes.classname + ' edition';
        break;
      case 2:
        this.domNode.className = self.classes.classname + ' modified';
        break;
      case 3:
        this.domNode.className = self.classes.classname + ' error';
        break;
    }

  }

  this.destroy = destroy;
  function destroy(fast)
  {
    WA.Containers.groupContainer.groupZone.source.destroy.call(self, fast);
    self = null;
  }
}

// Add basic zone code
WA.extend(WA.Containers.groupContainer.groupZone, WA.Managers.wa4gl._zone);

