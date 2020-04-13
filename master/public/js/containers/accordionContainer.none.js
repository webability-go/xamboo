
/*
    accordionContainer.js, WAJAF, the WebAbility(r) Javascript Application Framework
    Contains container to control accordion zones
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

function accordionTag(idtag, eindex, idcontent, callback, etop, container, mode)
{
  // we use a trick for functions since 'this' is NOT including 'var' !
  var self = this;
  this.myContainer = container;
  this.myCallback = callback;
  this.myAnimeTag = null;
  this.myAnimeContainer = null;
  this.eindex = eindex;
  this.idtag = idtag;
  this.idcontent = idcontent;
  this.uid = '';
  this.status = false;
  // Mode 1 = onclick, 2 = onmousover
  this.mode = mode;

  // ======== TAG
  this.iheighttag = WA.browser.getNodeHeight(WA.toDOM(idtag));
  this.iwidthtag = WA.browser.getNodeWidth(WA.toDOM(idtag));
  this.itoptag = etop;
  this.ilefttag = 0;
  // ======== CONTAINER
  // Por el momento sólo vertical, left es 0 siempre, top varía
  this.iheightcontainer = 0;
  this.iwidthcontainer = WA.browser.getNodeWidth(WA.toDOM(idtag)); // El mismo que el tag
  this.itopcontainer = 0;
  this.ileftcontainer = 0;

  this.setMode = setMode;
  function setMode(mode)
  {
    self.mode = mode;
  }

  this.getIndex = getIndex;
  function getIndex()
  {
    return self.eindex;
  }

  this.getHeightTag = getHeightTag;
  function getHeightTag()
  {
    return self.iheighttag;
  }

  this.getHeightContainer = getHeightContainer;
  function getHeightContainer()
  {
    return self.iheightcontainer;
  }

  this.getID = getID;
  function getID()
  {
    return self.uid;
  }

  this.getAnimeContainer = getAnimeContainer;
  function getAnimeContainer(newtopcontainer, newheightcontainer)
  {
      self.myAnimeContainer = animManager.createSprite(self.idcontent, self.callBackContainer, self.myContainer.getTiming());
    // Fijamos las posiciones, en este momento
    self.myAnimeContainer.setPosition(self.ileftcontainer, self.itopcontainer, self.ileftcontainer, newtopcontainer);
    self.myAnimeContainer.setSize(self.iwidthcontainer, self.iheightcontainer, self.iwidthcontainer, newheightcontainer);

    // Actualizar a los nuevos valores
    self.itopcontainer = newtopcontainer;
    self.iheightcontainer = newheightcontainer;
  }

  this.startContainer = startContainer;
  function startContainer(show)
  {
    if(show)
    {
      WA.toDOM(idcontent).style.display = "";
      self.myAnimeContainer.start();
    }
    else
    {
      self.myAnimeContainer.start();
    }
  }

  this.callBackTag = callBackTag;
  function callBackTag()
  {
    // destruir SPRITES
    animManager.destroySprite(idtag);

    if (self.myCallback)
      self.myCallback(self.idtag, (self.myContainer.currenttag == self.idtag));
  }

  this.callBackContainer = callBackContainer;
  function callBackContainer()
  {
    if (self.iheightcontainer == 0)
      WA.toDOM(idcontent).style.display = "none";

    // destruir SPRITES
    animManager.destroySprite(idcontent);
  }

  // NO se mueve el size del tag en el anim !!
  this.getAnimeTag = getAnimeTag;
  function getAnimeTag(newtoptag)
  {
      self.myAnimeTag = animManager.createSprite(self.idtag, self.callBackTag, self.myContainer.getTiming());

    // Fijamos las posiciones, en este momento
    self.myAnimeTag.setPosition(self.ilefttag, self.itoptag, self.ilefttag, newtoptag);

    // Actualizar a los nuevos valores
    self.itoptag = newtoptag;
  }

  this.startTag = startTag;
  function startTag(show)
  {
    self.myAnimeTag.start();

    //if (self.myCallback)
      //self.myCallback(self.idtag, show);
  }

  this.show = show;
  function show()
  {
    self.myContainer._showTag(self.getID());
  }

  this.switchTag = switchTag;
  function switchTag()
  {
    self.show();
  }

  this.disable = disable;
  function disable()
  {
    dd = WA.toDOM(self.idtag);
    if (dd)
    {
      if(self.mode != 1)
        dd.onmouseover = null;
      else
        dd.onclick = null;
    }
  }

  this.enable = enable;
  function enable()
  {
    dd = WA.toDOM(self.idtag);
    if (dd)
    {
      if(self.mode != 1)
        dd.onmouseover = self.switchTag;
      else
        dd.onclick = self.switchTag;
    }
  }

  // Constructor
  this.uid = idtag;
  if (WA.toDOM(this.uid) == null)
    return false;

  this.enable();

  this.status = false;
  return this;
}

function accordionContainer(domID, params, feedback, _4glNode)
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
  this.debug = false;
  // El timing para calcular la velocidad de pliegue/despliegue
  this.timing = timing;
  // El id del contenedor principal
  // contiene los tags
  this.idcontainer = mainid;
  // Contiene el tag actualmente abierto
  this.currenttag = null;

  // La altura disponible del contenedor principal
  // (Se va modificando conforme tags son agregados ...)
  this.freeheight = WA.browser.getNodeHeight(WA.toDOM(mainid));
  // La altura ocupada por los tags ...
  this.currentheight = 0;
  // Los tags/opciones disponibles
  this.tags = new Array();

  // **************************************************************************
  // PUBLIC METHODS
  // **************************************************************************
  // Recuperar la altura de los divs anteriores a este
  this.getHeightBeforeTag = getHeightBeforeTag;
  function getHeightBeforeTag(eindex)
  {
    var a = 0;
    if(eindex != 0)
    {
      for(i = 0; i < eindex; i++)
      {
        a += self.tags[eindex].getHeightTag();
      }
    }

    return a;
  }

  // Recuperar timming
  this.getTiming = getTiming;
  function getTiming()
  {
    return self.timing;
  }

  // Recuperar el espacio disponible para plegar/desplegar tags
  this.getFreeSpace = getFreeSpace;
  function getFreeSpace()
  {
    return self.freeheight;
  }

  this.registerTag = registerTag;
  function registerTag(idtag, idcontent, callback, mode)
  {
    // Por seguridad, el overflow del container a hidden
    WA.toDOM(idcontent).style.overflow = "hidden";
    // Por seguridad, position de tag y container a absolute
    WA.toDOM(idcontent).style.position = "absolute";
    WA.toDOM(idtag).style.position = "absolute";

    //altura del tag
    var theight = WA.browser.getNodeHeight(WA.toDOM(idtag));
    // Actualizar la altura disponible
    self.freeheight = Math.ceil(self.freeheight - theight);
    var tag = new accordionTag(idtag, self.tags.length, idcontent, callback, self.currentheight, self, mode);


    if (!tag)
      return null;

    // Desupes de instanciar el objeto, actualizar el top que le corresponde al siguiente
    self.currentheight += theight;
    self.tags[self.tags.length] = tag;

    return tag;
  }

  this.getTagByID = getTagByID;
  function getTagByID(id)
  {
    tag = null;
    for(var i=0; i < self.tags.length; i++)
    {
      if(self.tags[i].getID() == id)
      {
        tag = self.tags[i];
      }
    }

    return tag;
  }

  this.showTag = showTag;
  function showTag(id)
  {
    var old = self.timing;
    self.timing = 0;
    self._showTag(id);
    self.timing = old;
  }

  this._showTag = _showTag;
  function _showTag(id)
  {
    // Si el tag actualmente abierto es el mismo
    if(self.currenttag == id)
    {
      var otag = null;
      for(var i=0; i < self.tags.length; i++)
      {
        if(self.tags[i].idtag == id)
        {
           otag = self.tags[i];
           break;
        }
      }

      if(otag && otag.myCallBack)
        return otag.myCallback(id, true);
      else
        return null;
    }
    var selectedtag = self.getTagByID(id);
    var nAnims = new Array();
    for(var i=0; i < self.tags.length; i++)
    {
      // Recalcular posiciones de todo
      // El top de este tag, la altura siempre es la misma
      var toptag = self.getHeightBeforeTag(i);
      // Se suma el espacio libre si es que existe
      if(i > selectedtag.getIndex())
        toptag += self.freeheight;

      // El top del div tag contenedor
      var toptagcontainer = toptag + self.tags[i].getHeightTag();
      // La altura del div tag contenedor
      var heighttagcontainer = (id == self.tags[i].getID() ? self.getFreeSpace() : 0);

      var unAnimContainer = self.tags[i].getAnimeContainer(toptagcontainer, heighttagcontainer);
      var unAnimTag = self.tags[i].getAnimeTag(toptag);
      nAnims[i] = new Array(self.tags[i], unAnimTag, unAnimContainer, (self.tags[i].getID() == id));
    }

    for(var j = 0; j < nAnims.length; j++)
    {
      // Mandando a showtag
      nAnims[j][0].startTag(nAnims[j][3]);
      nAnims[j][0].startContainer(nAnims[j][3]);
    }

    // Actualizar currenttag
    self.currenttag = id;
  }

  this.disableTag = disableTag;
  function disableTag(id)
  {
    for (var i=0; i < self.tags.length; i++)
    {
      if (self.tags[i].idtag == id)
        self.tags[i].disable();
    }
  }

  this.enableTag = enableTag;
  function enableTag(id)
  {
    for (var i=0; i < self.tags.length; i++)
    {
      if (self.tags[i].idtag == id)
        self.tags[i].enable();
    }
  }

  return this;
}

WA.Containers.accordionContainer = accordionContainer;
