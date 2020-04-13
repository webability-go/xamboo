
/*
    mmcfieldElement.js, WAJAF, the WebAbility(r) Javascript Application Framework
    Contains element to control a field to upload multimedia files and associated images
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

WA.Elements.mmcfieldElement = function(fatherNode, domID, code, listener)
{
  var self = this;
  WA.Elements.mmcfieldElement.sourceconstructor.call(this, fatherNode, domID, code, 'div', { classname:'mmcfield' }, listener);

  this.id = this.code.attributes.id; // name of field, to use to send to the server

  // by default the field is part of the record, used by container
  this.formtype = 'field';
  this.record = (this.code.attributes.record&&this.code.attributes.record=='no'?false:true);
  this.editable = true;  // it's a text field, so yes

  this.status = 0; // 0 = neutral, 1 = ok, 2 = error, 3 = r/o, 4 = disabled
  this.edition = false;
  this.focus = false;

  this.mode = 0;
  // Behaviour on modes
  this.isvisible = [];
  this.info = [];
  this.disabled = [];
  this.readonly = [];
  this.notnull = [];
  this.help = [];
  for (var i = 1; i < 5; i++)
  {
    this.isvisible[i] = (this.code.attributes.visible?this.code.attributes.visible.indexOf(''+i)!=-1:true);
    this.info[i] = (this.code.attributes.info?this.code.attributes.info.indexOf(''+i)!=-1:false);
    this.disabled[i] = (this.code.attributes.disabled?this.code.attributes.disabled.indexOf(''+i)!=-1:false);
    this.readonly[i] = (this.code.attributes.readonly?this.code.attributes.readonly.indexOf(''+i)!=-1:false);
    this.notnull[i] = (this.code.attributes.notnull?this.code.attributes.notnull.indexOf(''+i)!=-1:false);
    this.help[i] = (this.code.attributes.helpmode?this.code.attributes.helpmode.indexOf(''+i)!=-1:false);
  }
  
  // image specific attributes
  this.loading = false;
  this.loadingimage = (this.code.attributes.loadingimage?this.code.attributes.loadingimage:'');

  // validity checks
  this.size = (this.code.attributes.size?this.code.attributes.size:'');
  // defaultvalue is the default for insert mode (code from the code, set below)
  // value is the value set in this mode by setValues, if we want to undo changes
  this.defaultvalue = this.value = '';
  this.path = (this.code.attributes.path?this.code.attributes.path:'');

  // errors on checks
  this.errorexternal = false;  // true when set manually an error
  this.errors = {};
  this.errormessages = {};
  this.firstview = true; // set to false when the field has been touched/modified. Used to know if we put the errors

  if (code.children)
  {
    for (var i = 0, l = code.children.length; i < l; i++)
    {
      switch (code.children[i].tag)
      {
        case 'defaultvalue': this.defaultvalue = code.children[i].data?code.children[i].data:''; break;
        case 'helpdescription': this.helpmessage = code.children[i].data; break;
        case 'statusnotnull': this.errormessages.statusnotnull = code.children[i].data; this.errors.statusnotnull = false; break;
        case 'statusbadformat': this.errormessages.statusbadformat = code.children[i].data; this.errors.statusbadformat = false; break;
        case 'statuscheck': this.errormessages.statuscheck = code.children[i].data; this.errors.statuscheck = false; break;
      }
    }
  }
  // NODES
  this.domNodeLabel = WA.createDomNode('label', domID+'_label', this.classes.classname + 'label');
  this.father.domNode.insertBefore(this.domNodeLabel, this.domNode);
  if (self.code.data)
    this.domNodeLabel.innerHTML = self.code.data;

  this.domNodeImage = WA.createDomNode('img', domID+'_image', '');
  this.domNodeImage.style = "float: left; max-width: 50; max-height: 50px; margin-right: 10px;";
  this.domNode.appendChild(this.domNodeImage);

  this.domNodeValue = WA.createDomNode('div', domID+'_value', 'value');
  this.domNode.appendChild(this.domNodeValue);

  this.domNodeFile = WA.createDomNode('input', domID+'_file', 'field');
  this.domNodeFile.type = (this.code.attributes.external?'text':'hidden');
  this.domNodeFile.name = this.id + '_file';
  this.domNode.appendChild(this.domNodeFile);

  this.domNodeField = WA.createDomNode('input', domID+'_field', 'field');
  this.domNodeField.type = 'file';
  this.domNodeField.name = this.id;
  // POR EL MOMENTO ES MONO IMAGE (EXTENDER CON DIV DE LO SUBIDO A MULTI IMAGE)
  //  this.domNodeField.multiple = true;
  this.domNodeField.accept = "image/x-png, image/gif, image/jpeg, image/jpg";
  if (this.size)
    this.domNodeField.style.width = this.size+'px';
  this.domNode.appendChild(this.domNodeField);

  this.domNodeDownload = WA.createDomNode('input', domID+'_download', 'field');
  this.domNodeDownload.type = 'hidden';
  this.domNodeDownload.name = this.id + '_download';
  this.domNode.appendChild(this.domNodeDownload);

  var br = WA.createDomNode('br');
  this.domNode.appendChild(br);
  
  this.domNodeDelete = WA.createDomNode('div', domID+'_delete', this.classes.classname + 'delete');
  this.domNodeDelete.innerHTML = (this.code.attributes.deletebutton?this.code.attributes.deletebutton:'[Delete]');
  this.domNode.appendChild(this.domNodeDelete);

  this.domNodeHelp = WA.createDomNode('p', domID+'_help', 'help');
  this.domNode.appendChild(this.domNodeHelp);
  if (self.helpmessage)
    this.domNodeHelp.innerHTML = self.helpmessage;

  this.domNodeError = WA.createDomNode('p', domID+'_error', 'error');
  this.domNode.appendChild(this.domNodeError);

  // responsive design based on container available size, is '', ' medium' or ' tiny'
  // Not activated for now
  this.sizemode = '';

  // we link with the group. first father is the zone, second father is the group
  // *********************************************
  // NOTE: THIS IS WRONG; THERE MAY BE MORE CONTAINERS INTO THE ZONES ETC
  // THE GROUP SHOULD BE SEARCH BY ID INTO THE 4GL TREE
  this.group = null;
  if (this.father.father.code.attributes.type == "groupContainer")
  {
    this.group = this.father.father;
    this.group.registerField(this);
  }

  // If we control some other fields
  this.synchronizer = null;
  this.synchronizeelements = [];

  this.addEvent('resize', resize);
  this.addEvent('start', start);
  this.addEvent('stop', stop);

  function resize()
  {
    WA.Elements.mmcfieldElement.source.resize.call(self);
    // size mode for responsive design, not activated for now
/*
    var RW = WA.browser.getNodeOuterWidth(self.father.domNode);
    var W1 = WA.browser.getNodeOuterWidth(self.domNodeField); // should be always fixed by CSS or code. We consider fields as fixed size always
    if (RW > W1*2 + 180 && self.sizemode != '')
      self.sizemode = '';
    else if (RW > W1 + 180 && self.sizemode != ' medium')
      self.sizemode = ' medium';
    else if (self.sizemode != ' tiny')
      self.sizemode = ' tiny';
    checkClass();
*/
  }

  this.registerSynchronize = registerSynchronize;
  function registerSynchronize(element)
  {
    self.synchronizeelements.push(element);
  }

  this.unregisterSynchronize = unregisterSynchronize;
  function unregisterSynchronize(element)
  {
    for (var i=0, l=self.synchronizeelements.length; i < l; i++)
    {
      if (self.synchronizeelements[i] == element)
      {
        self.synchronizeelements.splice(i, 1);
        break;
      }
    }
    return;
  }

  this.checkStatus = checkStatus;
  function checkStatus()
  {
    for (var i in self.errors)
      self.errors[i] = false;

    if (self.mode == 0 || !self.edition)
    {
      self.status = 0;
      self.domNodeError.innerHTML = '';
      return;
    }

    //  default = ok, status = 1 (ok), 2 (editing), 3 (error), 4 (r/o), 5 (disabled)
    if (self.synchronizer)
    {
      // we rebuild synchronizer
      self.synchronizer.checkStatus();
      self.status = self.synchronizer.status;
      return;
    }

    // we check anything based on the attributes of the field
    if (self.disabled[self.mode])
    {
      self.status = 4;
      return;
    }
    if (self.readonly[self.mode])
    {
      self.status = 3;
      return;
    }
    if (self.domNodeField.disabled == true)
      self.domNodeField.disabled == false;
    if (self.domNodeField.readOnly == true)
      self.domNodeField.readOnly == false;
    var value = self.domNodeFile.value;
    if (self.value != undefined && value == self.value && self.mode != 1)
    {
      self.status = 0;
      self.domNodeError.innerHTML = '';
      return;
    }
    self.status = 1;
    if (self.notnull[self.mode] && value == '')
    {
      self.status = 2;
      self.errors.statusnotnull = true;
    }
    if (self.errorexternal)
      self.status = 2;
    // user own checks
    if (self.code[0] != undefined && self.code[0].tag != undefined && self.code[0].tag == 'check')
      eval(self.code[0].data);
    
    console.log(self.errors);
  }

  this.checkClass = checkClass;
  function checkClass()
  {
    var extras = '';
    switch (self.status)
    {
      case 4: extras += ' disabled'; self.domNodeField.disabled = true; break;
      case 3: extras += ' readonly'; self.domNodeField.readOnly = true; break;
      case 2: extras += ' error'; if (self.group) self.father.setStatus(self.focus?1:(self.firstview?0:3)); break;
      case 1: extras += ' ok'; if (self.group) self.father.setStatus(self.focus?1:(self.firstview?0:2)); break;
      default: if (self.group) self.father.setStatus(self.focus?1:0); break;
    }
    if (self.focus)
      extras += ' edition';
    self.domNodeLabel.className = self.classes.classname + 'label' + extras + self.sizemode;
    self.domNode.className = self.classes.classname + extras + self.sizemode;
  }

  this.checkChildren = checkChildren;
  function checkChildren(onlylocal)
  {
    if (!onlylocal)
    {
      for (var i=0, l=self.synchronizeelements.length; i < l; i++)
      {
        self.synchronizeelements[i].status = self.status;
        self.synchronizeelements[i].checkClass();
        self.synchronizeelements[i].checkChildren();
      }
    }
  }

  this.checkAll = checkAll;
  function checkAll(notifygroup)
  {
    self.checkStatus();
    self.checkClass();
    self.checkChildren(false);

    if (!self.firstview)
    {
      if (!self.errorexternal)
      {
        var text = '';
        for (var i in self.errors)
        {
          if (self.errors[i])
            text += self.errormessages[i] + '<br />';
        }
        self.domNodeError.innerHTML = text;
      }
    }
    else
      self.domNodeError.innerHTML = '';
    if (self.group && notifygroup)
    {
      self.group.pleaseCheck();
    }
  }

  this.setError = setError;
  function setError(values)
  {
    self.domNodeError.innerHTML = values;
    self.errorexternal = true;
    checkAll();
  }

  this.setMode = setMode;
  function setMode(mode, keep)
  {
    self.mode = mode;
    console.log('setMODE');
    console.log(mode);
    console.log(keep);

    // Set all the data based on the mode
    if (!self.isvisible[mode])
    {
      if (self.group)
        self.father.hide();
      return;
    }
    if (self.group)
      self.father.show();

    if (keep)
      self.domNodeValue.innerHTML = self.domNodeFile.value;

    self.domNodeValue.style.display = (self.info[mode]?'':'none');
    self.domNodeFile.style.display = (self.info[mode]?'none':'');
    self.domNodeField.style.display = (self.info[mode]?'none':'');
    self.domNodeError.style.display = (self.info[mode]?'none':'');
    self.domNodeDelete.style.display = (self.info[mode]?'none':'');

    self.domNodeHelp.style.display = (self.help[mode]?'':'none');

    self.edition = !self.info[mode];
    if (mode == 1)
      reset();
    else
      checkAll();
  }

  this.reset = reset;
  function reset()
  {
    if (!self.edition)
      return;
    if (self.mode == 1)
    {
      self.value = self.domNodeField.value = self.domNodeValue.innerHTML = self.defaultvalue;
    }
    else if (self.mode == 2 || self.mode == 3)
    {
      self.domNodeValue.innerHTML = self.domNodeField.value = self.value;
    }
    checkAll();
  }

  function changeImage(e)
  {
    console.log('changeImage');
    
    
    // enviar un POST al group owner
    formdata = new FormData();

    self.domNodeImage.src = self.loadingimage;

    var img, reader, file;
    for ( i = 0, len = this.files.length; i < len; i++ )
    {
      file = this.files[i];

      if (!!file.type.match(/image.*/))
      {
        if ( window.FileReader )
        {
          reader = new FileReader();
          reader.onloadend = function (e)
          {
//            showUploadedItem(e.target.result, file.fileName);
          };
          reader.readAsDataURL(file);
        }
        if (formdata)
        {
          formdata.append("images[]", file);
          formdata.append(self.group.varorder, "image");
          formdata.append(self.group.varkey, self.group.currentkey);
          formdata.append(self.group.varfield, self.id);
        }
      }
    }
    
    if (formdata)
    {
      var request = WA.Managers.ajax.createRequest(WA.Managers.wa4gl.url + WA.Managers.wa4gl.prelib + self.app.applicationID + WA.Managers.wa4gl.premethod + self.id + WA.Managers.wa4gl.preformat + WA.Managers.wa4gl.format, 'POST', null, getResult, false);
      request.send(formdata);
    }
  }
  
  function getResult(response)
  {
    console.log(response);
    var code = WA.JSON.decode(response.responseText);
    if (code.status != 'OK')
      alert(code.message);
    else
    {
      self.domNodeImage.src = code.tempname;
      self.domNodeDownload.value = code.name;
      self.domNodeFile.value = code.name;
      self.value = '';
    }
    checkStatus();
  }
  
  function deleteImage(e)
  {
    self.value = self.domNodeFile.value = '';
    self.domNodeImage.src = '';
    self.domNodeValue.innerHTML = '';
    self.domNodeDelete.style.display = 'none';
    checkAll();
  }
  
  function changefile(e)
  {
    self.domNodeDownload.value = '';
    setTimeout(function() { filechanged(); }, 0);
  }
  
  function filechanged()
  {
    var name = self.domNodeFile.value;
    self.value = name;
    self.domNodeDelete.style.display = '';
    self.domNodeImage.src = name;
    self.domNodeValue.innerHTML = name;
    checkAll();
  }
  
  function start()
  {
    WA.Managers.event.on('change', self.domNodeField, changeImage, true);
    WA.Managers.event.on('click', self.domNodeDelete, deleteImage, true);
    WA.Managers.event.on('keyup', self.domNodeFile, changefile, true);

    // If we are controled by another field
    if (self.code.attributes.synchronizer)
    {
      self.synchronizer = WA.$N(self.code.attributes.synchronizer);
      if (self.synchronizer)
        self.synchronizer.registerSynchronize(self);
    }
    // we do not check, there is still no value. the setMode will do the job
  }

  this.getValues = getValues;
  function getValues()
  {
    if (self.domNodeDownload.value)
      return 'temp:'+self.domNodeDownload.value;
    return self.domNodeFile.value;
  }

  this.setValues = setValues;
  function setValues(values)
  {
    console.log('MMCFIELD VALUE = ');
    console.log(values);
    self.firstview = true;
    self.value = self.domNodeFile.value = values;
    if (values != undefined && values != null && !!values)
    {
      if (values.substr(0,6) == 'http:/' || values.substr(0,7) == 'https:/')
      {
        // if accept external values, check if starts with http*
        self.domNodeImage.src = values;
        self.domNodeValue.innerHTML = values;
      }
      else
      {
        self.domNodeImage.src = self.path + values;
        self.domNodeValue.innerHTML = values;
      }
    }
    else
      reset();
    checkAll();
  }

  this.stop = stop;
  function stop()
  {
    if (self.group)
      self.group.unregisterField(self);
    WA.Managers.event.off('click', self.domNodeDelete, true);
    WA.Managers.event.off('change', self.domNodeField, true);
    WA.Managers.event.off('keyup', self.domNodeFile, changefile, true);
  }

  this.destroy = destroy;
  function destroy(fast)
  {
    WA.Elements.mmcfieldElement.source.destroy.call(self, fast);

    self.synchronizer = null;
    self.synchronizeelements = [];
    self.group = null;
    self.domNodeError = null;
    self.domNodeHelp = null;
    self.domNodeValue = null;
    self.domNodeField = null;
    self.domNodeLabel = null;
    self.errormessages = null;
    self.errors = null;
    self.isvisible = null;
    self.info = null;
    self.disabled = null;
    self.readonly = null;
    self.notnull = null;
    self.help = null;
    self = null;
  }
}

// Add basic element code
WA.extend(WA.Elements.mmcfieldElement, WA.Managers.wa4gl._element);
