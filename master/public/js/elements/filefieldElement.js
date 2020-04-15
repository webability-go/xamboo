
/*
    filefieldElement.js, WAJAF, the WebAbility(r) Javascript Application Framework
    Contains element to control a file upload
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

function filefieldElement(domNodefather, domID, params, feedback, _4glNode)
{
  var self = this;
  this._4glNode = _4glNode;
  this.domNodefather = domNodefather;
  this.domID = domID;
  this.params = params;
  this.feedback = feedback;

  this.editable = true;

  // Same CSS that text element ?
  this.classname = params.attributes.classname!=undefined?params.attributes.classname:'textok';
  this.classnameerror = params.attributes.classnameerror!=undefined?params.attributes.classnameerror:'texterror';
  this.classnamefocus = params.attributes.classnamefocus!=undefined?params.attributes.classnamefocus:'textfocus';
  this.classnamedisabled = params.attributes.classnamedisabled!=undefined?params.attributes.classnamedisabled:'textdisabled';
  this.classnamereadonly = params.attributes.classnamereadonly!=undefined?params.attributes.classnamereadonly:'textreadonly';


  this.domNode = document.createElement('input');
  this.domNode.type = 'file';
  this.domNode.id = domID;
  this.domNode.name = _4glNode.id;
  domNodefather.appendChild(this.domNode);

  this.domNodeDownload = document.createElement('input');
  this.domNodeDownload.type = 'hidden';
  this.domNodeDownload.id = domID + '_download';
  this.domNodeDownload.name = _4glNode.id + '_download';
  domNodefather.appendChild(this.domNodeDownload);

  this.domNodeImage = document.createElement('img');
  this.domNodeImage.id = domID + '_image';
  this.domNodeImage.src = '/pics/dot.png';
  this.domNodeImage.style.height = '30px';
  this.domNodeImage.style.width = '30px';
  this.domNodeImage.style.position = 'absolute';
  domNodefather.appendChild(this.domNodeImage);

  this.domNodeDelete = document.createElement('img');
  this.domNodeDelete.id = domID + '_image';
  this.domNodeDelete.src = '/skins/clean/extensions/delete.png';
  this.domNodeDelete.style.position = 'absolute';
  domNodefather.appendChild(this.domNodeDelete);

  this.domNodeFile = document.createElement('input');
  this.domNodeFile.type = 'hidden';
  this.domNodeFile.id = domID + '_file';
  this.domNodeFile.name = _4glNode.id + '_file';
  domNodefather.appendChild(this.domNodeFile);

  this.domNodeFrame = document.createElement('iframe');
  this.domNodeFrame.id = domID + '_hiddenframe';
  this.domNodeFrame.name = domID + '_hiddenframe';
  this.domNodeFrame.style.border = '1px solid blue';
  this.domNodeFrame.style.width = '600px';
  this.domNodeFrame.style.height = '300px';
  this.domNodeFrame.style.display = 'none';
  domNodefather.appendChild(this.domNodeFrame);

  this.loading = false;
  this.loadingfile = '/pics/loading.gif';
//  this.action = '/ajax.php?cmd=previewFile';
  this.page = null;
  this.container = null;

  // we link with the group container if needed
  this.group = null;
  if (params.attributes.link)
  {
    this.group = _4glNode.getNode(params.attributes.link).icontainer;
    this.group.registerField(this);
  }

  this.changeFile = changeFile;
  function changeFile()
  {
    var oldenctype = self.group.domNode.enctype;
    var oldtarget = self.group.domNode.target;
    var oldaction = self.group.domNode.action;
    var oldmethod = self.group.domNode.method;

    // send information to server listener for this field
    self.group.domNode.method = 'post';
    self.group.domNode.enctype = 'multipart/form-data';
    self.group.domNode.encoding = 'multipart/form-data';
    self.group.domNode.action = wa4glManager.url+'?P='+self._4glNode.application.appID + '.' + self._4glNode.id + '.page';
    self.group.domNode.target = self.domID + '_hiddenframe';

    self.loading = true;
    self.domNodeImage.src = self.loadingfile;
    if (self.group.domNode.originsubmit)
      self.group.domNode.originsubmit();
    else
      self.group.domNode.submit();

    self.group.domNode.method = oldmethod;
    self.group.domNode.action = oldaction;
    self.group.domNode.target = oldtarget;
    self.group.domNode.target = oldenctype;
  }

  this.start = start;
  function start()
  {
    WA.Managers.event.on('change', self.domNode, self.changeFile, true);
    WA.Managers.event.on('click', self.domNodeDelete, self.deleteFile, true);
  }

  this.resize = resize;
  function resize()
  {
    self._4glNode.nodeResize(self.domNodefather, self.domNode, self.params.attributes);
    // put the image
    self.domNodeImage.style.left = (parseInt(self.domNode.style.left, 10) + 220) + 'px';
    self.domNodeImage.style.top = self.domNode.style.top;

    self.domNodeDelete.style.left = (parseInt(self.domNode.style.left, 10) + 250) + 'px';
    self.domNodeDelete.style.top = self.domNode.style.top;
  }

  this.registerTitle = registerTitle;
  function registerTitle(element)
  {
    self.titleelement = element;
  }


  this.unregisterTitle = unregisterTitle;
  function unregisterTitle()
  {
    self.titleelement = null;
  }

  this.registerStatus = registerStatus;
  function registerStatus(element)
  {
    self.statuselement = element;
  }

  this.unregisterStatus = unregisterStatus;
  function unregisterStatus()
  {
    self.statuselement = null;
  }

  this.registerHelp = registerHelp;
  function registerHelp(element)
  {
    self.helpelement = element;
  }

  this.unregisterHelp = unregisterHelp;
  function unregisterHelp()
  {
    self.helpelement = null;
  }

  this.registerExtra = registerExtra;
  function registerExtra(element)
  {
    self.extraelement = element;
  }

  this.unregisterExtra = unregisterExtra;
  function unregisterExtra()
  {
    self.extraelement = null;
  }

  this.registerError = registerError;
  function registerError(element)
  {
    self.errorelement = element;
  }

  this.unregisterError = unregisterError;
  function unregisterError()
  {
    self.errorelement = null;
  }

  this.getValues = getValues;
  function getValues()
  {
    return {temporal:self.domNodeFile.value, truename:self.domNodeDownload.value};
  }

  this.setValues = setValues;
  function setValues(values)
  {
  }

  this.stop = stop;
  function stop()
  {
    off('change', self.domNode, self.changeFile, true);
    off('click', self.domNodeDelete, self.deleteFile, true);
  }

  this.destroy = destroy;
  function destroy()
  {
    self.domNode = null;
    self.classname = null;
    self.feedback = feedback;
    self.params = params;
    self.domID = domID;
    self.domNodefather = domNodefather;
    self = null;
  }

  this.setFile = setFile;
  function setFile(path, name, tempname, truename)
  {
    self.domNodeImage.src = path+name;
    self.domNodeFile.value = tempname;
    self.domNodeDownload.value = truename;
    self.loading = false;
  }

  this.deleteFile = deleteFile;
  function deleteFile()
  {
    self.domNodeImage.src = '/pics/dot.png';
    self.domNodeFile.value = '';
    self.domNodeDownload.value = '';
    self.loading = false;
  }

  this.checkClass = checkClass;
  function checkClass()
  {
    switch (self.status)
    {
      case 5: // focus
        if (self.classnamefocus)
        {
          self.domNode.className = self.classnamefocus;
        }
        break;
      case 4: // disabled
        if (self.classnamedisabled)
        {
          self.domNode.className = self.classnamedisabled;
        }
        break;
      case 3: // read only
        if (self.classnamereadonly)
        {
          self.domNode.className = self.classnamereadonly;
        }
        break;
      case 2: // any error
        if (self.classnameerror)
        {
          self.domNode.className = self.classnameerror;
        }
        break;
      case 1: // all ok
        if (self.classname)
        {
          self.domNode.className = self.classname;
        }
        break;
    }
  }
}
// Needed aliases
WA.Elements.filefieldElement = filefieldElement;
