
/*
    dateselectorElement.js, WAJAF, the WebAbility(r) Javascript Application Framework
    Contains element to control a date picker
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

function dateselectorElement(domNodefather, domID, params, feedback, _4glNode)
{
  var self = this;
  this._4glNode = _4glNode;
  this.domNodefather = domNodefather;
  this.domNode = domNodefather;
  this.domID = domID;
  this.feedback = feedback;
  this.params = params;
  this.id = params.attributes.id;
  this.container = null;    // the container object for popup window
  this.calendarhtml = null; // the html code for popup window

  this.defaultfeedback = null;
  this.isok = false;        // set to true when loaded and ready to show (ajax or normal)
  this.destid = params.attributes.id;         // if of field to fill the value when clicked
  this.widthpopup = 370;    // width of picker
  this.heightpopup = 280;   // height of picker

  this.months = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  this.monthsmax = [0,31,28,31,30,31,30,31,31,30,31,30,31];
  this.days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  this.daysletter = ['D', 'L', 'Ma', 'Mi', 'J', 'V', 'S'];
  this.classes =   {'title':'calendarelementtitle','title6':'calendarelementtitlewe',
                  'title0':'calendarelementtitlewe',
                  'emptyday':'calendarelementemptyday','emptyday6':'calendarelementemptydaywe','emptyday0':'calendarelementemptydaywe',
                  'day':'calendarelementday','day6':'calendarelementdaywe','day0':'calendarelementdaywe',
                  'today':'calendarelementtoday','selectedday':'calendarelementselectedday'};

  this.time = false;
  this.firstday = 1;       // monday is 1rst day of week by default
  this.datemin = null;
  this.datemax = null;
  this.datedefault = null;

  this.currentyear = null;
  this.currentmonth = null;
  this.currentday = 1;
  this.currenthour = 0;
  this.currentminute = 0;
  this.currentsecond = 0;

  this.selectedyear = null;
  this.selectedmonth = null;
  this.selectedday = null;
  this.selectedhour = null;
  this.selectedmin = null;
  this.selectedsec = null;

  this.classname = params.attributes.classname!=undefined?params.attributes.classname:'calendarselector';

  this.domNode = document.createElement('span');
  this.domNode.id = domID;
  this.domNode.className = this.classname;
  domNodefather.appendChild(this.domNode);

  if (params.attributes.link)
  {
    // we link with the container or element
    this.field = _4glNode.getNode(params.attributes.link).ielement || _4glNode.getNode(params.attributes.link).icontainer;
    this.field.registerExtra(self);
  }

  this.start = start;
  function start()
  {
    WA.Managers.event.on('click', self.domNode, self.showCalendar, true);
  }

  this.stop = stop;
  function stop()
  {
    WA.Managers.event.off('click', self.domNode, self.showCalendar, true);
  }

  this.resize = resize;
  function resize()
  {
    self._4glNode.nodeResize(self.domNodefather, self.domNode, self.params.attributes);
  }

  this.showCalendar = showCalendar;
  function showCalendar(e)
  {
    startcalendar();
    var x = WA.browser.getCursorDocumentX(e);
    var y = WA.browser.getCursorDocumentY(e);
    WA.$C('uv-single-calendarmodal').setPosition(''+x,''+y);

    //self.datedefault = new Date();
    var f = self.field.getValues();
    if (!f)
    {
      var fechaactual = new Date();
      self.currentyear = fechaactual.getFullYear();
      self.currentmonth = fechaactual.getMonth() + 1;
      self.selectedyear = fechaactual.getFullYear();
      self.selectedmonth = fechaactual.getMonth();
      self.selectedday = fechaactual.getDate();
      self.load(null);
    }
    else
    {
      var fes = f.substr(3,2) + '/' + f.substr(0,2) + '/' + f.substr(6,4);
      var fechaactual = new Date(fes);
      self.currentyear = fechaactual.getFullYear();
      self.currentmonth = fechaactual.getMonth() + 1;
      self.selectedyear = fechaactual.getFullYear();
      self.selectedmonth = fechaactual.getMonth();
      self.selectedday = fechaactual.getDate();
      self.load(null);
    }

    self.fill();

//    alert('show');
  }

  this.setLang = setLang;   // contiene los formatos de presentacion del calendario
  function setLang(months, days, daysletter)
  {
    if (months)
      self.months = months;
    if (days)
      self.days = days;
    if (daysletter)
      self.daysletter = daysletter;
  }

  this.setLimits = setLimits;  //limites de fecha
  function setLimits(datemin, datemax, datedefault)
  {
    self.datemin = datemin;
    self.datemax = datemax;
    self.datedefault = datedefault;
  }

  this.setClasses = setClasses;  //x
  function setClasses(classes)
  {
    self.classes = classes;
  }

  this.setOptions = setOptions;  //x
  function setOptions(firstday)
  {
    if (firstday !== null)
      self.firstday = firstday;

  }

  this.feedbackhtml = feedbackhtml;  //feeedback
  function feedbackhtml(request)
  {
    self.calendarhtml = request.responseText;
    self.create();
  }

  this.load = load;
  function load(calendarhtmllink)
  {
    self.init();
    if (!calendarhtmllink)
    {
      self.calendarhtml = '<br />';
      self.create();
      return;
    }

    if (calendarhtmllink != null)
    {
      self.calendarhtml = null;
      var request = WA.Managers.ajax.createRequest(calendarhtmllink, 'POST', null, self.feedbackhtml, true, true);
    }
  }

  this.set = set;
  function set(calendarhtml)
  {
    self.init();
    if (calendarhtml != null)
      self.calendarhtml = calendarhtml;
    self.create();
  }

  this.getmaxmonthdays = getmaxmonthdays;   // obtener numero de dias maximo
  function getmaxmonthdays(year, month)
  {
    var m = self.monthsmax[month];
    if (year%4==0 && (year%100!=0 || year%400==0) && month == 2)
      m = 29;
    return m;
  }

  this.fixzero = fixzero;
  function fixzero(num)
  {
    if (num < 10)
      return '0' + num;
    return num;
  }

  this.fill = fill;
  function fill()
  {
    // put all the days of the month and year
    // 1. we put month and year
    WA.browser.setInnerHTML(WA.toDOM('ds_monthyear'), self.months[self.currentmonth] + ' ' + self.currentyear);

    // 2. we put days headers
    // the real day have offset with self.firstday
    for (var i=0; i<7; i++)
    {
      var realday = i + self.firstday;
      if (realday > 6)
        realday -= 7;
      if (self.classes['title'+realday])
        WA.toDOM('ds_daytitle'+i).className=self.classes['title'+realday];
      else
        WA.toDOM('ds_daytitle'+i).className=self.classes['title'];
      WA.browser.setInnerHTML(WA.toDOM('ds_daytitle'+i), self.daysletter[realday]);
    }
    // 3. we put all the days
    // 3.1 we get the 28-31 days of the month, and days numbers:
    var numofdays = self.getmaxmonthdays(self.currentyear, self.currentmonth);
    var dd = new Date();
    dd.setDate(1);
    dd.setMonth(self.currentmonth-1);
    dd.setFullYear(self.currentyear);
    var numoffirstday = dd.getDay();
    dd.setDate(numofdays);
    var numoflastday = dd.getDay();

    // 3.2 we put the empty spaces if needed
    var offset = numoffirstday - self.firstday;
    var realday = self.firstday;
    if (offset < 0)
      offset += 7;
    if (offset != 0)
    {
      // complement with spaces
      for (var k=0; k<offset; k++)
      {
        if (self.classes['emptyday'+realday])
          WA.toDOM('ds_day'+k).className=self.classes['emptyday'+realday];
        else
          WA.toDOM('ds_day'+k).className=self.classes['emptyday'];
        WA.browser.setInnerHTML(WA.toDOM('ds_day'+k), '&nbsp;');
        WA.toDOM('ds_day'+k).onclick = null;
        WA.toDOM('ds_day'+k).onmouseover = null;
        WA.toDOM('ds_day'+k).onmouseout = null;
        WA.toDOM('ds_day'+k).day = null;
        realday ++;
        if (realday > 6)
          realday = 0;
      }
    }

    // 3.3 we put all the days
    var today = new Date();
    for (var i=1; i<=numofdays; i++)
    {
      if (self.currentyear == self.selectedyear && self.currentmonth == self.selectedmonth && self.selectedday == i && self.classes['selectedday'])
        WA.toDOM('ds_day'+offset).className=self.classes['selectedday'];
      else if (self.currentyear == today.getFullYear() && self.currentmonth == today.getMonth()+1 && i == today.getDate() && self.classes['today'])
        WA.toDOM('ds_day'+offset).className=self.classes['today'];
      else if (self.classes['day'+realday])
        WA.toDOM('ds_day'+offset).className=self.classes['day'+realday];
      else
        WA.toDOM('ds_day'+offset).className=self.classes['day'];

      WA.browser.setInnerHTML(WA.toDOM('ds_day'+offset), i);
      WA.toDOM('ds_day'+offset).onclick = self.clickday;
      WA.toDOM('ds_day'+offset).onmouseover = self.showday;
      WA.toDOM('ds_day'+offset).onmouseout = self.hideday;
      WA.toDOM('ds_day'+offset).day = i;
      offset++;
      k++;
      if (k > 6)
        k = 0;
      realday ++;
      if (realday > 6)
        realday = 0;
    }

    // 3.4 we fill with empty days if needed
    if (k != 0)
    {
      for (var j = k; j <= 6; j++)
      {
        if (self.classes['emptyday'+realday])
          WA.toDOM('ds_day'+offset).className=self.classes['emptyday'+realday];
        else
          WA.toDOM('ds_day'+offset).className=self.classes['emptyday'];
        WA.browser.setInnerHTML(WA.toDOM('ds_day'+offset), '&nbsp;');
        WA.toDOM('ds_day'+offset).onclick = null;
        WA.toDOM('ds_day'+offset).onmouseover = null;
        WA.toDOM('ds_day'+offset).onmouseout = null;
        WA.toDOM('ds_day'+offset).day = null;
        offset++;
        realday ++;
        if (realday > 6)
          realday = 0;
      }
    }

    // 4. we show or hide tail based on num of days
    if (offset > 35)
      WA.toDOM('ds_calendartail').style.display = '';
    else
      WA.toDOM('ds_calendartail').style.display = 'none';
  }
  this.change = change;
  function change(request)
  {
    alert(request.responseText);
  }

  this.destroyBackground = destroyBackground;
  function destroyBackground()
  {
    for(var i = 0; i < 42; i++)
    {
      WA.toDOM('ds_day' + i).innerHTML = '' ;
      WA.toDOM('ds_day' + i).className = '';
    }
  }

  this.clickday = clickday;
  function clickday()
  {
    //ajax('/?P=' + self.manager.listener, 'post', null, self.datafeedback, true);
    var clickedday = self.currentyear+'-'+self.fixzero(self.currentmonth)+'-'+self.fixzero(this.day);
    var clickedday = self.fixzero(this.day)+'/'+self.fixzero(self.currentmonth)+'/'+self.currentyear;
//    wa4glManager.startInnerApplication('uvprensa-single-lista', 'uvprensalist', 'single', 'DAY='+clickedday, '');
    self.field.setValues(clickedday);
    stopcalendar();
  }

  this.showday = showday;
  function showday()
  {
    var day = (this.day?this.day:self.currentday)
    /*WA.browser.setInnerHTML(WA.toDOM('ds_calendarselected'), self.currentyear+'/'+self.fixzero(self.currentmonth)+'/'+self.fixzero(day) +
      (self.time?' ' + self.fixzero(self.currenthour) + ':' + self.fixzero(self.currentminute) + ':' + self.fixzero(self.currentsecond):'')
    );*/ /// este es del boton y del mensaje que no tienen por que aparecer en la uvagenda
    self.currentday = day;
  }

  this.hideday = hideday;
  function hideday()
  {
    //WA.browser.setInnerHTML(WA.toDOM('ds_calendarselected'), '');
  }

  this.yearless = yearless;    // menos años
  function yearless()
  {
    self.currentyear --;
    self.destroyBackground();
    self.fill();
  }

  this.yearmore = yearmore;     // mas años
  function yearmore()
  {
    self.currentyear ++;
    self.destroyBackground();
    self.fill();
  }

  this.monthless = monthless;   // menos meses
  function monthless()
  {
    self.destroyBackground();
    self.currentmonth --;
    if (self.currentmonth < 1)
    {
      self.currentmonth = 12;
      self.currentyear --;
    }
    self.fill();
  }

  this.monthmore = monthmore;    //mas meses
  function monthmore()
  {
    self.destroyBackground();
    self.currentmonth ++;
    if (self.currentmonth > 12)
    {
      self.currentmonth = 1;
      self.currentyear ++;
    }
    self.fill();
  }

  this.changehour = changehour;   //cambia hora
  function changehour()
  {
    self.currenthour = this.value;
    self.showday();
  }

  this.changeminute = changeminute;  //cambia minuto
  function changeminute()
  {
    self.currentminute = this.value;
    self.showday();
  }

  this.clickok = clickok;
  function clickok()
  {
    WA.toDOM(self.destid).value = self.currentday + ' ' + self.months[self.currentmonth] + ' ' + self.currentyear +
      (self.time?self.currenthour + ':' + self.currentminute + ':' + self.currentsecond:'');
    self.hide();
  }

  this.clickcancel = clickcancel;
  function clickcancel()
  {
    self.hide();
  }

  this.create = create;
  function create()
  {
    if (self.isok)
      return;
    if (self.calendarhtml != null)
    {
      WA.browser.setInnerHTML(self.container, self.calendarhtml);

      WA.toDOM('ds_calendarpicker').style.display = '';
      self.container.style.width = self.widthpopup+'px';
      self.container.style.height = self.heightpopup+'px';

      // link the events
      WA.toDOM('ds_yearless').onclick = self.yearless;
      WA.toDOM('ds_yearmore').onclick = self.yearmore;
      WA.toDOM('ds_monthless').onclick = self.monthless;
      WA.toDOM('ds_monthmore').onclick = self.monthmore;
      WA.toDOM('ds_calendarhour').onchange = self.changehour;
      WA.toDOM('ds_calendarminute').onchange = self.changeminute;
      //WA.toDOM('ds_calendarok').onclick = self.clickok;
      //WA.toDOM('ds_calendarcancel').onclick = self.clickcancel;

      self.isok = true;
    }
  }

  this.show = show;
  function show(e, destid, time)
  {
    if (!self.isok)
      return;
    if (destid != null)
      self.destid = destid;
    self.container.style.display = '';
    self.container.style.top = WA.browser.getCursorY(e)+'px';
    self.container.style.left = WA.browser.getCursorX(e)+'px';
    self.time = time;
    if (self.time)
      WA.toDOM('ds_calendartime').style.display = '';
    else
      WA.toDOM('ds_calendartime').style.display = 'none';

    // set default values
    var fielddate = WA.toDOM(destid).value;
    if (fielddate)
    {
      var dd = new Date(fielddate);
      self.selectedyear = self.currentyear = dd.getFullYear();
      self.selectedmonth = self.currentmonth = dd.getMonth()+1;
      self.selectedday = self.currentday = dd.getDate();
      self.selectedhour = self.currenthour = dd.getHours();
      self.selectedminute = self.currentminute = dd.getMinutes();
      self.selectedsecond = self.currentsecond = dd.getSeconds();
      WA.toDOM('ds_calendarhour').value = self.currenthour;
      WA.toDOM('ds_calendarminute').value = self.currentminute;
    }
    else
    {
      var dd = new Date();
      self.currentyear = dd.getFullYear();
      self.currentmonth = dd.getMonth()+1;
      self.currentday = dd.getDate();
    }

    self.fill();

    //self.fC.register(self.id + '_calendar', 'monthyear', null);
  }

  this.hide = hide;
  function hide()
  {
    if (!self.isok)
      return;
    //self.fC.unregister(self.id + '_calendar');
    self.container.style.display = 'none';
  }

  this.setValues = setValues;
  function setValues(values)
  {

  }

  this.getValues = getValues;
  function getValues()
  {
    return null;
  }

  // Class initialization

  this.init = init;
  function init()
  {
    var container = document.createElement('div');
    container.id = '_calendar';
    container.style.display = 'none';
    container.style.position = 'absolute';
    container.style.overflow = 'hidden';
    container.style.visibility = 'visible';
    container.style.zIndex = WA.browser.getNextZIndex();
    self.container = container;
    //document.body.appendChild(container);
    self.domNodefather.appendChild(container);
    self.domNodefather.style.overflow = 'hidden';

    //self.fC = new floatingContainer('desktop', 'jail', 800, 500);
  }

  this.destroy = destroy;
  function destroy()
  {

  }

  //return this;
}

// Needed aliases
WA.Elements.dateselectorElement = dateselectorElement;
