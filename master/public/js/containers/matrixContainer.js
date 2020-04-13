
/*
    matrixContainer.js
    Contains container to control a matrix
    (c) 2017 Kiwilimon
*/

WA.Containers.matrixContainer = function(fatherNode, domID, code, listener)
{
  var self = this;
  WA.Containers.matrixContainer.sourceconstructor.call(this, fatherNode, domID, code, 'div', { classname: 'matrix' }, listener);

  this.data = null;         // all the data rows we can use for this matrix
  this.loaded = false;      // the data has been loaded in first instance
  this.countload = 0;       // how many time we try to load: >3 throw error
  
  this.className = this.classes.classname + ' zones';
  this.preidbutton = code.attributes.preidbutton?code.attributes.preidbutton:'';

  this.modo = 2;
  this.defaultwidth = code.attributes.defaultwidth?parseInt(code.attributes.defaultwidth, 10):0;
  this.defaultheight = code.attributes.defaultheight?parseInt(code.attributes.defaultheight, 10):0;

  var listalineashorizontal = [];
  var listalineasvertical = [];

  var viewportwidth = this.domNode.offsetWidth;
  var viewportheight = this.domNode.offsetHeight;
  
  var totalceldasviewport = 16;
  var altoporcelda = 0.5;
  
  var cantidadceldashorizontal = 16;
  var cantidadceldasvertical = 100;

  this.celdawidth = 0;
  this.celdaheight = 0;
  
  var dashboardwidth = 0;
  var dashboardheight = 0;

  var dashboard = WA.createDomNode('div', domID+'_matrix', this.classes.classname + ' dashboard');

  this.domNode.appendChild(dashboard);

  this.addEvent('start', start);
  this.addEvent('stop', stop);
  this.addEvent('resize', resize);

  /* SYSTEM METHODS */
  this.newZone = newZone;
  function newZone()
  {

    //var x = Math.floor((Math.random() * 10) + 1);
    //var y = Math.floor((Math.random() * 10) + 1);
    var x = self.defaultwidth;
    var y = self.defaultheight;
    var punto = this.buscazonalibre(x,y);
    
    if (!punto)
    {
      alert("Ya no queda espacio en el Dashboard.");
    }
    else
    {
      var id = getNextFreeID();
            
      var code = {};
      code.tag = 'zone';
      code.attributes = {id: id, top:punto.top, left:punto.left, width:x, height:y, application:"dashboard_graficas|"+id, params:'id='+id};
      var obj = self.app.createTree(self, code);
      
      this.guardaratributoszone(); 
    }

  }

  this.createZone = createZone;
  function createZone(domID, code, listener)
  {
    var ldomID = WA.parseID(domID, self.xdomID);
    if (!ldomID)
      throw 'Error: the zone id is not valid in matrixContainer.createZone: id=' + domID;
    // check the zone does not exists YET !
    if (self.zones[ldomID[2]])
      throw 'Error: the zone already exists in matrixContainer.createZone: id=' + ldomID[2];

    // 1. call event precreate, can we create ?
    if (!self.callEvent('precreate', {id:ldomID[2]}))
      return null;

    var container = dashboard;
    if (code.attributes.father != undefined)
    {
      code.level = self.zones[code.attributes.father].level + 1;
      container = self.zones[code.attributes.father].domNodeChildren;
    } 
    
    var z = new WA.Containers.matrixContainer.matrixZone(self, ldomID[3], container, code, listener);
    self.zones[code.attributes.id] = z;

    self.callEvent('postcreate', {id:ldomID[2]});
    if (self.state == 5)
    {
      z.propagate('start');
      self.propagate('resize');
    }
    return z;
  }

  this.destroyZone = destroyZone;
  function destroyZone(domID)
  {
    var ldomID = WA.parseID(domID, self.xdomID);
    if (!ldomID)
      throw 'Error: the zone id is not valid in matrixContainer.destroyZone: id=' + domID;
    // check the zone must exists YET !
    if (!self.zones[ldomID[2]])
      throw 'Error: the zone does not exists in matrixContainer.destroyZone: id=' + ldomID[2];

    // 2. call event destroy
    if (!self.callEvent('predestroy', {id:ldomID[2]}) )
      return;

    self.app.destroyTree(ldomID[2]);
//    self.zones[ldomID[2]].destroy();
    delete self.zones[ldomID[2]];
    self.callEvent('postdestroy', {id:ldomID[2]});

    guardaratributoszone();
  }

  this.switchzone = switchzone;
  function switchzone(id)
  {
    if (self.zones[id])
      self.zones[id].openclose();
  }

  // getvalues, setvalues, start, stop, resize and destroy are controlled by 4GL so no notifications are needed
  this.getValues = getValues;
  function getValues()
  {
    var atributoszona = {};    
    for(var i in self.zones)
    {
      atributoszona[i] = self.zones[i].getValues();
    }
    
    return atributoszona;
  }

  function getNextFreeID()
  {
    var i = 1;
    while (self.zones['zona_' + i])
      i++;

    return 'zona_' + i;
  }

  this.setValues = setValues;
  function setValues(values)
  {
  }

  function start()
  {
    self.countload = 0;
    fillData();
  }

  function stop()
  {
  }

  this.destroy = destroy;
  function destroy(fast)
  {
    WA.Containers.matrixContainer.source.destroy.call(self, fast);
    // destroy all zones
    self.data = null;
    self.templates = null;
    self = null;
  }

  this.reload = reload;
  function reload()
  {
    if (self.state != 5)
      return;

    // destroy the existing stuff
    for (var i in self.zones)
    {
      self.destroyZone(i);
    }
    self.zones = {};          // Destroy all the zones
    // we should destroy also the 4GL matrix
    self.domNode.innerHTML = '';

    self.loaded = false;
    self.countload = 0;
    fillData();
  }

  function getData(r)
  {
    self.data = WA.JSON.decode(r.responseText);
    self.loaded = true;
    self.countload = 0;
    fillData();
  }

  // any record change should call this
  this.fillData = fillData;
  function fillData(newdataset)
  {
    
    if (!newdataset && !self.loaded && self.serverlistener)
    {
      if (self.countload++ > 3)
      {
        alert('Error getting the record from the server.');
        return;
      }

      // ask to the server the data
      var request = WA.Managers.ajax.createRequest(WA.Managers.wa4gl.url + WA.Managers.wa4gl.prelib + self.app.applicationID + WA.Managers.wa4gl.premethod + self.id + WA.Managers.wa4gl.preformat + WA.Managers.wa4gl.format, 'POST', 'Order=get', getData, true);

      // we put the "loading"
      
      return;
    }
    
    //console.log('Fabricando la matrix');
    
    var dataset = null;
    if (newdataset)
    {
      dataset = newdataset;
      if (self.data && self.data.row)
        self.data.row.concat(newdataset);
      else
      {
        if (!self.data) self.data = {};
        self.data.row = newdataset;
      }
    }
    else
    {
      if (self.data && self.data.row)
        dataset = self.data.row;
    }

    // do we populate data from here ?
    if (dataset)
    {
      for (var i = 0, l = dataset.length; i < l; i++)
        self.app.createTree(self, dataset[i]);        
    }
    
  }
  
  this.resize = resize;
  function resize()
  {
    if (!WA.Containers.matrixContainer.source.resize.call(self))
      return;
    
    // calculate width and height of cells
    viewportwidth = self.domNode.offsetWidth;
    viewportheight = self.domNode.offsetHeight;

    self.celdawidth = viewportwidth/totalceldasviewport;
    self.celdaheight = self.celdawidth * altoporcelda;

    dashboardwidth = totalceldasviewport==cantidadceldashorizontal?'100%':((this.celdawidth * cantidadceldashorizontal) + 'px');
    dashboardheight = this.celdaheight * cantidadceldasvertical;

    dashboard.style.width = dashboardwidth;
    dashboard.style.height = dashboardheight + 'px';

    
    if(self.modo == 1)
      modificarCeldasDashboard();

  }

  this.switchModoMatrix = switchModoMatrix;
  function switchModoMatrix()
  {
    var top = 0;
    var left = 0;

    if(self.modo == 2)
    {
      self.modo = 1;

      //console.log('width celda = ' + self.celdawidth + ' height celda = ' + self.celdaheight);
      for (var i = 0; i <= cantidadceldasvertical; i++) 
      {
        var lineahorizontal = WA.createDomNode("div", "horizontal_" + i);
        listalineashorizontal.push(lineahorizontal);
        
        lineahorizontal.style.position = 'absolute';
        lineahorizontal.style.top = top + 'px';
        lineahorizontal.style.left = 0;
        lineahorizontal.style.right = 0;
        lineahorizontal.style.borderTop = '1px dotted black';

        dashboard.appendChild(lineahorizontal);

        top = top + self.celdaheight;
      }

      for (var i = 0; i <= cantidadceldashorizontal; i++) 
      {
        var lineavertical = WA.createDomNode("div", "vertical_" + i);
        listalineasvertical.push(lineavertical);
        
        lineavertical.style.position = 'absolute';
        lineavertical.style.left = left + 'px';
        lineavertical.style.top = 0;
        lineavertical.style.bottom = 0;
        lineavertical.style.borderRight = '1px dotted black';

        dashboard.appendChild(lineavertical);

        left = left + self.celdawidth;
      }

      WA.Managers.dd.registerGroup('matrixdd', 'caller', true, dashboard, listenerdd);
    
      WA.Managers.dd.registerZone('matrixdd', dashboard, null);
    }
    else
    {
      self.modo = 2;

      for(var k = 0; k <= cantidadceldashorizontal; k++)
      {
        dashboard.removeChild(listalineasvertical[k]);
      }

      for(var l = 0; l <= cantidadceldasvertical; l++)
      {
        dashboard.removeChild(listalineashorizontal[l]);
      }

      listalineashorizontal = [];
      listalineasvertical = [];
    }
    
    for (var i in self.zones)
    {
      self.zones[i].switchModoMatrix(self.modo);
    }
    
    return self.modo;
  }

  function modificarCeldasDashboard()
  {
    var left = 0;
    var top = 0;
    
    for(var k = 0; k <= cantidadceldasvertical; k++)
    {
      var nodo = WA.toDOM(listalineashorizontal[k]);
       
      nodo.style.top = top + 'px';

      top = top + self.celdaheight;
    }

    for(var k = 0; k <= cantidadceldashorizontal; k++)
    {
      var nodo = WA.toDOM(listalineasvertical[k]);
      
      nodo.style.left = left + 'px';

      left = left + self.celdawidth;
    }

  }

  this.listenerdd = listenerdd;
  function listenerdd()
  {}
  
  this.guardaratributoszone = guardaratributoszone;
  function guardaratributoszone()
  {
    var atributos = self.getValues();
    console.log("guardaratributoszone");
    var req = WA.Managers.ajax.createRequest('dashboard/dashboardmatrix/json', 'POST', null, respuestaguardaratributoszone, false);
    req.addParameter('Order', 'set');
    req.addParameter('data', WA.JSON.encode(atributos));
    req.send();
  }

  function respuestaguardaratributoszone(request)
  {
     //quitar la imagen de loading 
  }

  this.borradashboard = borradashboard;
  function borradashboard()
  {
    var atributos = self.getValues();
    console.log(atributos);

    for(zona in atributos)
    {
      console.log(zona);
      var req = WA.Managers.ajax.createRequest("/agregargraficas/borrarparamzona/json", "POST", null, respuestaborrardashboard, false);
      req.addParameter("zonaid", zona);
      req.send();    
      
    }
    
    /*
    var req = WA.Managers.ajax.createRequest('dashboard/dashboardmatrix/json', 'POST', null, respuestaborrardashboard, false);
    req.addParameter('Order', 'del');
    req.addParameter('data', WA.JSON.encode(atributos));
    req.send();
    */
  }

  function respuestaborrardashboard(request)
  {
    var res = WA.JSON.decode(request.responseText);
    if(res.estatus == "Ok")
    {
      WA.$N("dashboard|single|dashboardmatrix").destroyZone(res.zona);

    }
  }

  this.isClipping = isClipping;
  function isClipping(left, top, w, h, myself)
  {
    var colision = false;
    for (var z in self.zones)
    {
      if (myself && myself == z)
        continue;
      if (left < self.zones[z].left+self.zones[z].width && left+w > self.zones[z].left && top < self.zones[z].top+self.zones[z].height && top+h > self.zones[z].top)
      {
        colision = true;
        break;
      }
    }      
    return colision;
  }
  
  this.buscazonalibre = buscazonalibre;
  function buscazonalibre(w,h)
  {
    console.log("buscar zona libre");
    for (var top = 0; top < cantidadceldasvertical-h+1; top++)
    {
      for (var left = 0; left < cantidadceldashorizontal-w+1; left++)
      {
        if (!isClipping(left, top, w, h))
          return {top: top, left: left};  
      }
    }
    // ya no hay espacio y nunca hubo colision 
    return null;
  }

  this.refreshzone = refreshzone;
  function refreshzone(zona)
  {
    if(zona)
    {
      self.zones[zona].unregisterZonedd();
      var xapp = self.zones[zona].code.attributes.application.split('|');
      WA.Managers.wa4gl.reloadApplication(self.zones[zona], xapp[0], xapp[1], self.zones[zona].code.attributes.params?self.zones[zona].code.attributes.params:'');
    }
    else
    {
      WA.Managers.dd.unregisterZone(dashboard);
      WA.Managers.wa4gl.reloadApplication(self.zones, 'dashboard', 'single', self.zones.code.attributes.params?self.zones.code.attributes.params:'');
    }
    
  }

}

// Add basic container code
WA.extend(WA.Containers.matrixContainer, WA.Managers.wa4gl._container);


WA.Containers.matrixContainer.matrixZone = function(father, domID, container, code, listener)
{
  var self = this;
  WA.Containers.matrixContainer.matrixZone.sourceconstructor.call(this, father, domID, code, 'div', { classname:'zone' }, listener);
  this.domNode.style.display = '';

  container.appendChild(this.domNode);

  this.top = parseInt(code.attributes.top, 10);
  this.left = parseInt(code.attributes.left, 10);
  this.width = parseInt(code.attributes.width, 10);
  this.height = parseInt(code.attributes.height, 10);

  this.addEvent('start', start);
  this.addEvent('stop', stop);
  this.addEvent('resize', resize);
  this.addEvent('appstarted', appstarted);
  var agrandar = false;

  function _callNotify(type)
  {
    var result = true;
    // no notifications if the app is not started
    if (self.notify && self.running)
      result = self.notify(type, self.domID, null);
    return result;
  }

  function appstarted()
  {
    self.propagate(self.father.modo==1?'edit':'view');
    if (self.father.modo == 1)
    {
      registerZonedd();
    }
    else
    {
      unregisterZonedd();
    }

  }

  function start()
  {
    show();
  }

  function stop()
  {
    
  }

  this.resize = resize;
  function resize()
  {
    // cannot resize if not visible or not running
    if (!self.visible || !self.father.visible)
      return;
    
    self.domNode.style.top = self.top * self.father.celdaheight +'px';
    self.domNode.style.left = self.left * self.father.celdawidth +'px';
    self.domNode.style.width = self.width * self.father.celdawidth - WA.browser.getNodeBorderWidth(self.domNode) +'px';
    self.domNode.style.height = self.height * self.father.celdaheight - WA.browser.getNodeBorderHeight(self.domNode) +'px';

    // we just get the max size of main container
//    self.domNode.style.width = (WA.browser.getNodeInnerWidth(self.father.domNode) - WA.browser.getNodeExternalWidth(self.domNode)) + 'px';
//    self.domNode.style.height = (WA.browser.getNodeInnerHeight(self.father.domNode) - WA.browser.getNodeExternalHeight(self.domNode)) + 'px';
  }

  this.show = show;
  function show()
  {
    self.visible = true;
    self.resize();
  }

  this.hide = hide;
  function hide()
  {
    self.visible = false;
  }

  this.destroy = destroy;
  function destroy(fast)
  {
    WA.Containers.matrixContainer.matrixZone.source.destroy.call(self, fast);

    //self.domNodeMain.parentNode.removeChild(self.domNodeMain);

    self.children = null;
    self.container = null;
    self.domNodeMain = null;
    self.domNodeOpenClose = null;
    self.domNodeChildren = null;
    self = null;
  }

  this.switchModoMatrix = switchModoMatrix;
  function switchModoMatrix(modo)
  {
    self.propagate(modo==1?'edit':'view');
    if (modo == 1)
    {
      registerZonedd();
    }
    else
    {
      unregisterZonedd();
    }
  }
  
  
  this.registerZonedd = registerZonedd;
  function registerZonedd()
  {
    //console.log('dashboard_graficas|' + self.code.attributes.id + '|' + self.father.preidbutton + '-' + self.code.attributes.id + '-mover');
    var nodomover = WA.toDOM('dashboard_graficas|' + self.code.attributes.id + '|' + self.father.preidbutton + '-' + self.code.attributes.id + '-mover');
    if (nodomover)
      WA.Managers.dd.registerObject('matrixdd', nodomover, self.domNode, listenerZonadd, 'caller');

    var nodoagrandar = WA.toDOM('dashboard_graficas|' + self.code.attributes.id + '|' + self.father.preidbutton + '-' + self.code.attributes.id + '-agrandar');
    if (nodoagrandar)
      WA.Managers.dd.registerObject('matrixdd', nodoagrandar, self.domNode, listenerZonadd, 'caller');
  }

  this.unregisterZonedd = unregisterZonedd;
  function unregisterZonedd()
  {
    var nodomover = WA.toDOM('dashboard_graficas|' + self.code.attributes.id + '|' + self.father.preidbutton + '-' + self.code.attributes.id + '-mover');
    if (nodomover)
      WA.Managers.dd.unregisterObject('matrixdd', nodomover);
    
    var nodoagrandar = WA.toDOM('dashboard_graficas|' + self.code.attributes.id + '|' + self.father.preidbutton + '-' + self.code.attributes.id + '-agrandar');
    if (nodoagrandar)
      WA.Managers.dd.unregisterObject('matrixdd', nodoagrandar);
  }

  this.listenerZonadd = listenerZonadd;
  function listenerZonadd(order, idgrup, idzone, iddop, metrics)
  {
    /* Metrics:
      main apunta al objeto que se clickea
      maintopstart = el top del objeto al iniciar
      mainwidth = el width del objeto al iniciar
      etc
    */

    if (order == 'start')
    {
      /*if (metrics.ystartjailed+metrics.jailscrolltop > metrics.maintopstart+metrics.mainheight - 10 && metrics.ystartjailed+metrics.jailscrolltop < metrics.maintopstart+metrics.mainheight
          && metrics.xstartjailed+metrics.jailscrollleft > metrics.mainleftstart+metrics.mainwidth - 10 && metrics.xstartjailed+metrics.jailscrollleft < metrics.mainleftstart+metrics.mainwidth
        )*/
      
      if(idzone.indexOf("agrandar") != -1)
      {
        console.log("agrandar start");
        agrandar = true;
      }
    }
    else if (order == 'drag')
    {
      if(agrandar)
      {
        //console.log("agrandar drag");
        
        var nuevowidth = self.width * self.father.celdawidth + metrics.xrelativemouse;
        var nuevoheight = self.height * self.father.celdaheight + metrics.yrelativemouse;
        if (nuevowidth < self.father.celdawidth)
          nuevowidth = self.father.celdawidth;
        if (nuevoheight < self.father.celdaheight)
          nuevoheight = self.father.celdaheight;
        
        self.domNode.style.width = nuevowidth - WA.browser.getNodeBorderWidth(self.domNode) +'px';
        self.domNode.style.height = nuevoheight - WA.browser.getNodeBorderHeight(self.domNode) +'px';
      }
      else
      {
        var pointertop = metrics.maintopstart + metrics.yrelativejailed;
        if (pointertop < 0)
          pointertop = 0;      
        var pointerleft = metrics.mainleftstart + metrics.xrelativejailed;
        if (pointerleft < 0)
          pointerleft = 0;      
      
        self.domNode.style.top = pointertop + 'px';
        self.domNode.style.left = pointerleft + 'px';
      }
    }
    else if (order == 'drop')
    {
      
      if(agrandar)
      {
        //console.log("agrandar drop");
       
        var nuevowidth = self.width * self.father.celdawidth + metrics.xrelativemouse;
        var nuevoheight = self.height * self.father.celdaheight + metrics.yrelativemouse;
        if (nuevowidth < self.father.celdawidth)
          nuevowidth = self.father.celdawidth;
        if (nuevoheight < self.father.celdaheight)
          nuevoheight = self.father.celdaheight;
        
        nuevowidth = (Math.round(nuevowidth / self.father.celdawidth)) * self.father.celdawidth;
        nuevoheight = (Math.round(nuevoheight / self.father.celdaheight)) * self.father.celdaheight;
        
        if (self.father.isClipping(self.left, self.top, Math.floor(nuevowidth / self.father.celdawidth), Math.floor(nuevoheight / self.father.celdaheight), self.code.attributes.id))
        {
          self.domNode.style.height = self.height * self.father.celdaheight - WA.browser.getNodeBorderHeight(self.domNode) + 'px';
          self.domNode.style.width = self.width * self.father.celdawidth - WA.browser.getNodeBorderWidth(self.domNode) + 'px';
        }
        else
        {
          self.domNode.style.width = nuevowidth - WA.browser.getNodeBorderWidth(self.domNode) +'px';
          self.domNode.style.height = nuevoheight - WA.browser.getNodeBorderHeight(self.domNode) +'px';
          
          self.width = Math.floor(nuevowidth / self.father.celdawidth);
          self.height = Math.floor(nuevoheight / self.father.celdaheight);
        }
        self.propagate('resize');
      }
      else
      {
        var pointertop = metrics.maintopstart + metrics.yrelativejailed;
        if (pointertop < 0)
          pointertop = 0;      
        var pointerleft = metrics.mainleftstart + metrics.xrelativejailed;
        if (pointerleft < 0)
          pointerleft = 0;    

        /*multiplicar por el ancho de la celda, hacer el redondeo y multiplicarlo de nuevo por el ancho para el left igual para el top multiplicarlo por el height*/
        var nuevotop = (Math.round(pointertop / self.father.celdaheight)) * self.father.celdaheight;
        var nuevoleft = (Math.round(pointerleft / self.father.celdawidth)) * self.father.celdawidth;
        
        if (self.father.isClipping(Math.floor(nuevoleft / self.father.celdawidth), Math.floor(nuevotop / self.father.celdaheight), self.width, self.height, self.code.attributes.id))
        {
          self.domNode.style.top = self.top * self.father.celdaheight + 'px';
          self.domNode.style.left = self.left * self.father.celdawidth + 'px';
        }
        else
        {
          self.domNode.style.top = nuevotop + 'px';
          self.domNode.style.left = nuevoleft + 'px';

          self.top = Math.floor(nuevotop / self.father.celdaheight);
          self.left = Math.floor(nuevoleft / self.father.celdawidth);
        }
      }
      agrandar = false;    
      /*Enviar posiciones y propiedades de las zonas al servidor para guardarlas en BD
        matrixContainer es quien guarda las propiedades de las zonas 
      */
     self.father.guardaratributoszone(); 
    }
  }

  this.getValues = getValues;
  function getValues()
  {
    return {top:self.top, left:self.left, width:self.width, height:self.height};
  }

}

WA.extend(WA.Containers.matrixContainer.matrixZone, WA.Managers.wa4gl._zone);
