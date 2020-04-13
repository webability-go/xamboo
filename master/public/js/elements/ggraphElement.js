
/*
    ggraphElement.js, WAJAF, the WebAbility(r) Javascript Application Framework
    Contains element to control a google graph
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

// 0 = nothing, 1 = loading, 2 = loaded
WA.googlegraphready = 0;

WA.Elements.ggraphElement = function(fatherNode, domID, code, listener)
{
  var self = this;
  var googleready = false;
  var data = null;
  this.loaded = false;
  
  if (WA.googlegraphready == 0)
  {
    WA.googlegraphready = 1;
    //console.log('google not loaded ' + domID);
    var node = WA.createDomNode('script', null, null);
    node.setAttribute('type', 'text/javascript');
    node.setAttribute('src', 'https://www.gstatic.com/charts/loader.js');
    node.onload = googleloaded;
    document.getElementsByTagName('head')[0].appendChild(node);
  }
  else if (WA.googlegraphready == 1)
  {
    waitforgoogle();
  }
  else
    google.charts.setOnLoadCallback(googlecallback);

  WA.Elements.ggraphElement.sourceconstructor.call(this, fatherNode, domID, code, 'div', { classname:'ggraph' }, listener);

  this.addEvent('resize', resize);
  this.addEvent('start', start);
  this.addEvent('stop', stop);

  function googleloaded()
  {
    //console.log('googleloaded ' + self.domID);
    google.charts.load('current', {packages: ['corechart', 'orgchart', 'table']});
    google.charts.setOnLoadCallback(googlecallback);
  }
  
  function waitforgoogle()
  {
    if (window.google && window.google.charts)
      google.charts.setOnLoadCallback(googlecallback);
    else
      setTimeout(waitforgoogle, 30);
  }
  
  function googlecallback()
  {
    WA.googlegraphready = 2;
    //console.log('googleready ' + self.domID);
    googleready = true;
    paint();
  }
  
  function paint()
  {
    //console.log('into paint');
    //console.log(googleready);
    //console.log(self.state);
    //console.log(self.loaded);
    
    
    if (googleready && self.state == 5 && self.loaded)
    {
      //console.log(self.data);
      if(self.data.pie)
      {
        var data = new google.visualization.DataTable();

        for(var i=0; i<self.data.cols.length; i++)
          data.addColumn({type: self.data.cols[i].t, label: self.data.cols[i].n});

        data.addRows(self.data.row);

        var chart = new google.visualization.PieChart(document.getElementById(self.domID));
        chart.draw(data, self.data.options);
      }
      if(self.data.combo)
      {
        var data = new google.visualization.DataTable();
        
        for(var i=0; i<self.data.cols.length; i++)
          data.addColumn({type: self.data.cols[i].t, label: self.data.cols[i].n});

        data.addRows(self.data.row);

        var chart = new google.visualization.SteppedAreaChart(document.getElementById(self.domID));
        chart.draw(data, self.data.options);
      }
      if(self.data.acumulada)
      {
        var data = new google.visualization.DataTable();
        
        for(var i=0; i<self.data.cols.length; i++)
          {
            if(self.data.cols[i].rol)
              data.addColumn({type: self.data.cols[i].t, label: self.data.cols[i].n, role:self.data.cols[i].rol});
            else  
              data.addColumn({type: self.data.cols[i].t, label: self.data.cols[i].n});
          }

        data.addRows(self.data.row);

        var chart = new google.visualization.ColumnChart(document.getElementById(self.domID));
        chart.draw(data, self.data.options);
      }
      if(self.data.columna)
      {
        var data = new google.visualization.DataTable();
        
        for(var i=0; i<self.data.cols.length; i++)
          {
            if(self.data.cols[i].rol)
              data.addColumn({type: self.data.cols[i].t, label: self.data.cols[i].n, role:self.data.cols[i].rol});
            else  
              data.addColumn({type: self.data.cols[i].t, label: self.data.cols[i].n});
          }

        data.addRows(self.data.row);

        var chart = new google.visualization.ColumnChart(document.getElementById(self.domID));
        chart.draw(data, self.data.options);
      }
      if(self.data.curva)
      {
        var data = new google.visualization.DataTable();
        
        for(var i=0; i<self.data.cols.length; i++)
          data.addColumn({type: self.data.cols[i].t, label: self.data.cols[i].n});

        data.addRows(self.data.row);

        var chart = new google.visualization.LineChart(document.getElementById(self.domID));
        chart.draw(data, self.data.options);
      }
      if(self.data.cifra)
      {
        var data = new google.visualization.DataTable();
        
        for(var i=0; i<self.data.cols.length; i++)
        {
          data.addColumn({type: self.data.cols[i].t, label: self.data.cols[i].n});
        }

        data.addRows(self.data.row);
        
        var chart = new google.visualization.Table(document.getElementById(self.domID));
        chart.draw(data, self.data.options);
      }
  
      //console.log('Paint graph ' + self.domID);
      
    }
  }
  
  this.resize = resize;
  function resize()
  {
    WA.Elements.ggraphElement.source.resize.call(self);
    paint();
    // size mode for responsive design, not activated for now
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
    //console.log('into filldata ' + self.domID);
    //console.log(self.serverlistener);
    
    if (!newdataset && !self.loaded && self.serverlistener)
    {
      if (self.countload++ > 3)
      {
        alert('Error getting the record from the server.');
        return;
      }

      // ask to the server the data
      var request = WA.Managers.ajax.createRequest(WA.Managers.wa4gl.url + WA.Managers.wa4gl.prelib + self.app.applicationID + WA.Managers.wa4gl.premethod + self.id + WA.Managers.wa4gl.preformat + WA.Managers.wa4gl.format, 'POST', 'Order=get', getData, true);
      WA.toDOM(self.domID).innerHTML = '<div class="loading"></div>';
      return;
    }

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
      //console.log(dataset);
      // create the graph
      paint(); 
    }
  }
    
  this.parseData = parseData;
  function parseData(code)
  {
    for (var i = 0, l = code.children.length; i < l; i++)
    {
      if (code.children[i].tag == 'dataset')
      {
        self.data = WA.JSON.decode(code.children[i].data);
        self.loaded = true;
      }
    }
  }

  function start()
  {
    //console.log('start the graph ' + self.domID);
    self.countload = 0;
    fillData();
  }


  this.reload = reload;
  function reload()
  {
    //console.log("reload");
    self.domNode.innerHTML = '';
    self.loaded = false;
    start();
  }












  this.stop = stop;
  function stop()
  {
  }

  this.destroy = destroy;
  function destroy(fast)
  {
    WA.Elements.ggraphElement.source.destroy.call(self, fast);

    self.data = null;
    self = null;
  }
}

// Add basic element code
WA.extend(WA.Elements.ggraphElement, WA.Managers.wa4gl._element);
