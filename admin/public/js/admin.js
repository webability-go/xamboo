
XB = {};
XB.ws = null;
XB.onLoad = onLoad;
XB.timestart = 0;

XB.ispause = false;
XB.methods = {get: true, post: true, put: true, delete: true, options: true};

XB.stat = {};
XB.statip = {};
XB.statlastreceived = -1;
XB.xcode = [];
XB.pointer = 0;

function onLoad()
{
  // open ws
  console.log("System OnLoad")

  XB.openWS();
  XB.paintfilter();

  document.getElementById("flag-alive").state = true;
}

XB.openWS = function()
{
  XB.ws = new WebSocket("wss://"+window.location.host+"/listener");
  XB.ws.onopen = XB.wsopen;
  XB.ws.onclose = XB.wsclose;
  XB.ws.onmessage = XB.wsmessage;
  XB.ws.onerror = XB.wserror;
}

XB.closeWS = function()
{
  XB.ws.close();
  XB.ws = null;
}

XB.pause = function()
{
  XB.ispause = !XB.ispause;
  if (XB.ispause)
  { // close WS
    XB.closeWS();
  }
  else
  { // open WS
    XB.openWS();
  }
  XB.paintfilter()
}

XB.setfilter = function(id)
{
  XB.methods[id] = !XB.methods[id];
  XB.paintfilter()
}

XB.paintfilter = function()
{
  document.getElementById("b_pause").style.backgroundColor = XB.ispause?'blue':'white';
  document.getElementById("b_get").style.backgroundColor = XB.methods.get?'green':'red';
  document.getElementById("b_post").style.backgroundColor = XB.methods.post?'green':'red';
  document.getElementById("b_put").style.backgroundColor = XB.methods.put?'green':'red';
  document.getElementById("b_delete").style.backgroundColor = XB.methods.delete?'green':'red';
  document.getElementById("b_options").style.backgroundColor = XB.methods.options?'green':'red';
}

XB.wsopen = function(evt)
{
  console.log("WS Open");
}

XB.wsclose = function(evt)
{
  console.log("WS Close");
  XB.ws = null;
}

XB.wsmessage = function(evt)
{
  XB.SwitchFlagAlive();

  if (evt.data && evt.data)
  {
    code = JSON.parse(evt.data)
  }

  if (code.cpu)
  {
    document.getElementById("cpu").innerHTML = code.cpu;
    document.getElementById("sysname").innerHTML = code.sysname;
    XB.timestart = new Date(code.starttime)
    document.getElementById("since").innerHTML = XB.FormatDate(XB.timestart);
  }
  document.getElementById("load").innerHTML =  code.load1 + ' - ' + code.load2 + ' - ' + code.load3;
  document.getElementById("memalloc").innerHTML =  XB.FormatUnit(code.memalloc);
  document.getElementById("memsys").innerHTML =  XB.FormatUnit(code.memsys);
  document.getElementById("goroutines").innerHTML = code.goroutines.toLocaleString();
  document.getElementById("totalservedrequests").innerHTML = code.totalservedrequests.toLocaleString();
  document.getElementById("totalservedlength").innerHTML = XB.FormatUnit(code.totalservedlength);
  // calculate uptime
  n = new Date();
  document.getElementById("online").innerHTML = XB.FormatTime(n - XB.timestart);

  if (code.lastrequests)
    XB.ParseRequests(code.lastrequests);

  var sum = 0;
  for (var i in XB.stat)
    sum += XB.stat[i];

//  console.log(XB.stat, XB.statlastreceived-1, XB.stat[XB.statlastreceived-1])
  if (XB.stat[XB.statlastreceived-1])
    document.getElementById("servedrequests").innerHTML = XB.stat[XB.statlastreceived-1] + " req/s " + sum + " req/2min";
  else
    document.getElementById("servedrequests").innerHTML = sum + " req/2min";

  document.getElementById("uniqueip").innerHTML =  XB.CountObject(XB.statip) + " ip/2min";

}

XB.wserror = function(evt)
{
  console.log("WS error: ", evt.data);
}

XB.SwitchFlagAlive = function()
{
  node = document.getElementById("flag-alive");
  if (node.state == true)
  {
    node.style.backgroundColor = "yellow";
    node.state = false;
  }
  else
  {
    node.style.backgroundColor = "red";
    node.state = true;
  }
}


XB.SetOneRequest = function()
{
  if (XB.pointer >= XB.xcode.length)
    return;

  code = XB.xcode[XB.pointer++];

  var p = XB.getDomNode("lastrequests")

  var color = "white";
  if (code.Code >= 200 && code.Code < 300)
    color = "#aaffaa";
  if (code.Code >= 300 && code.Code < 400)
    color = "#aaaaff";
  if (code.Code >= 400)
    color = "#ffaaaa";

  var str = "";
  str += "<td>" + code.IP + ":" + code.Port + '</td><td style="text-align: right;">' + XB.FormatTime((code.Duration/1000000).toFixed(2)) + '</td><td style="background-color: '+color+';">' + code.Code + "</td><td>" + code.Method + "</td><td>" + code.Protocol + "</td><td>" + code.Request + "</td><td>" + XB.FormatUnit(code.Length) + "</td>";

  firstzero = XB.getFirstZero();
  var n = XB.getDomNode("request_" + code.Id)
  if (!n)
  {
    n = XB.createDomNode("TR", "request_" + code.Id)
    n.code = code.Code;
    // Si el nodo es code 0: hasta el final, sino antes del primer 0
    if (code.Code == 0)
      p.appendChild(n);
    else
      p.insertBefore(n,  firstzero);
  }
  else
  {
    // si ya no es code 0: antes del primer 0
    n.code = code.Code;
    if (code.Code != 0)
      p.insertBefore(n, firstzero);
  }

  n.innerHTML = str;
  n.date = new Date(code.Time);

  // purge old requests ( keep 20 last only, newest )
  var reqsnodes = p.childNodes;
  if (reqsnodes.length > 20)
  {
    var reqs = [];
    for (i = 0; i < reqsnodes.length; i++)
    {
      if (!reqsnodes[i].date)
        continue;
      if (reqsnodes[i].code == 0)
        continue;
      reqs.push([ reqsnodes[i].id, reqsnodes[i].date ]);
    }
    // order
    reqs.sort(function(a,b){ return b[1] - a[1]; });
    for (i = 20; i < reqs.length; i++)
    {
      var n = XB.getDomNode(reqs[i][0])
      // remove the node
      p.removeChild(n);
    }
  }

  document.getElementById("pagesserved").scrollTo(0, 10000000);
}

XB.getFirstZero = function()
{
  var first = null;
  var p = XB.getDomNode("lastrequests")
  var reqsnodes = p.childNodes;
  for (i = reqsnodes.length-1; i >= 0; i--)
  {
    if (reqsnodes[i].code == 0)
      first = reqsnodes[i];
    else
      break;
  }
  return first;
}

XB.ParseRequests = function(code)
{
  // 1. clean old stats: we keep only 2 minutes alive
  var old = Math.floor(new Date()/1000)-120;
  for (var i in XB.stat)
  {
    if (i < old)
      delete(XB.stat[i]);
  }
  for (var i in XB.statip)
  {
    for (var j = XB.statip[i].length-1; j >= 0; j--)
    {
      if (XB.statip[i][j] < old)
      {
        XB.statip[i].splice(j, 1);
      }
    }
    if (XB.statip[i].length == 0)
      delete(XB.statip[i]);
  }
  // 2. get all stats
  for (var i = 0; i < code.length; i++)
  {
    d = Math.floor(new Date(code[i].Time).getTime()/1000);
    if (d > XB.statlastreceived)
      XB.statlastreceived = d;

    // WSS: no count
    if (code[i].Protocol == "WSS")
      continue;

    ip = code[i].IP;

    if (XB.stat[d])
      XB.stat[d]++;
    else
      XB.stat[d] = 1;

    if (XB.statip[ip])
      XB.statip[ip].push(d);
    else
      XB.statip[ip] = [d];
  }

  // reorder XB.xcode: requests with Code=0 always at the end, ordered y ID
  XB.xcode = XB.ReorderCode(code);
  XB.pointer = 0;
  start = 0;
  if (code.length > 20)
  {
    start = code.length-20;
  }

//  for (i=0; i<code.length; i++)
//  {
//    XB.MakeStat(code[i]);
//  }

  // the server pushes data every second (1000 ms)
  // put new requests slowly
  for (i=start; i<code.length; i++)
  {
    setTimeout(function() { XB.SetOneRequest(); }, 1000/(code.length-start)*(i-start));
  }
}






// order by Code != 0, Id, then by id = 0, Id
XB.ReorderCode = function(code)
{
  code.sort(function(a,b)
    {
      if (a.Code != 0 && b.Code == 0) return -1;
      if (b.Code != 0 && a.Code == 0) return 1;
      return a.Id-b.Id;
    });
//  console.log(code);
  return code;
}

XB.createDomNode = function(type, id, classname)
{
  var domnode = document.createElement(type);
  if (id)
    domnode.id = id;
  if (classname !== null && classname != undefined)
    domnode.className = classname;
  return domnode;
}

XB.getDomNode = function(domID)
{
  return document.getElementById(domID);
}

XB.FormatUnit = function(fnumber)
{
  if (fnumber < 1024) return fnumber + "B";
  fnumber /= 1024;
  if (fnumber < 1024) return fnumber.toFixed(2) + 'KB';
  fnumber /= 1024;
  if (fnumber < 1024) return fnumber.toFixed(2) + 'MB';
  fnumber /= 1024;
  if (fnumber < 1024) return fnumber.toFixed(2) + 'GB';
  fnumber /= 1024;
  return fnumber.toFixed(2) + 'TB';
}

XB.FormatTime = function(fnumber)
{
  str = "ms";
  ms = Math.floor((fnumber*100)%100);
  str = ('0' + ms).slice(-2) + str;
  fnumber = Math.floor(fnumber) / 1000;
  if (fnumber >= 1)
  {
    s = Math.floor(fnumber%60);
    str = ('0' + s).slice(-2) + "s" + str;
    fnumber = Math.floor(fnumber) / 60;
    if (fnumber >= 1)
    {
      m = Math.floor(fnumber%60);
      str = ('0' + m).slice(-2) + "m" + str;
      fnumber = Math.floor(fnumber) / 60;
      if (fnumber >= 1)
      {
        h = Math.floor(fnumber%24);
        str = ('0' + h).slice(-2) + "h" + str;
        fnumber = Math.floor(fnumber) / 24;
        if (fnumber >= 1)
        {
          d = Math.floor(fnumber)
          str = d + "d" + str;
        }
      }
    }
  }
  return str;
}

XB.FormatDate = function(d)
{
  return ("00" + (d.getMonth() + 1)).slice(-2) + "/" +
    ("00" + d.getDate()).slice(-2) + "/" +
    d.getFullYear() + " " +
    ("00" + d.getHours()).slice(-2) + ":" +
    ("00" + d.getMinutes()).slice(-2) // + ":" +
//    ("00" + d.getSeconds()).slice(-2)
    ;
}

XB.CountObject = function(o)
{
  var c = 0;
  for (var i in o)
    c++;
  return c;
}

XB.Page = function(page)
{
  window.location = page;
}
