
XB = {};
XB.ws = null;
XB.onLoad = onLoad;

function onLoad()
{
  // open ws
  console.log("System OnLoad")
    
  console.log(window.location.host)
  XB.ws = new WebSocket("wss://"+window.location.host+"/listener");
  XB.ws.onopen = XB.wsopen;
  XB.ws.onclose = XB.wsclose;
  XB.ws.onmessage = XB.wsmessage;
  XB.ws.onerror = XB.wserror;
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
  if (evt.data && evt.data)
  {
    code = JSON.parse(evt.data)
  }
  console.log(code);
  
  XB.ParseMessage(code);
  
  if (code.cpu)
  {
    document.getElementById("cpu").innerHTML = code.cpu;
    document.getElementById("goroutines").innerHTML = code.goroutines.toLocaleString();
    document.getElementById("memalloc").innerHTML =  XB.FormatUnit(code.memalloc);
    document.getElementById("memsys").innerHTML =  XB.FormatUnit(code.memsys);
  }
  document.getElementById("totalservedrequests").innerHTML = code.totalservedrequests.toLocaleString();
  document.getElementById("totalservedlength").innerHTML = XB.FormatUnit(code.totalservedlength);

}

XB.wserror = function(evt)
{
  console.log("WS error: ", evt.data);
}

XB.ParseMessage = function(code)
{
  if (code.lastrequests)
  {
    XB.SetRequests(code.lastrequests);
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


XB.xcode = []
XB.pointer = 0;

XB.SetRequests = function(code)
{
  // put old requests instantly
  if (XB.pointer < XB.xcode.length)
  {
    for (i=XB.pointer; i<XB.xcode.length; i++)
    {
      XB.SetOneRequest();
    }
  }
  
  // reorder XB.xcode: requests with Code=0 always at the end, ordered y ID
  XB.xcode = XB.ReorderCode(code);
  XB.pointer = 0;
  // the server pushes data every second (1000 ms)
  // put new requests slowly
  for (i=0; i<code.length; i++)
  {
    setTimeout(function() { XB.SetOneRequest(); }, 900/code.length*i);
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
  console.log(code);
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

