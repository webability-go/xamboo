
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
    document.getElementById("goroutines").innerHTML = code.goroutines;
    document.getElementById("memalloc").innerHTML = code.memalloc;
    document.getElementById("memsys").innerHTML = code.memsys;
  }
  document.getElementById("totalservedrequests").innerHTML = code.totalservedrequests;
  document.getElementById("totalservedlength").innerHTML = code.totalservedlength;

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
  
XB.SetRequests = function(code)
{
  var p = XB.getDomNode("lastrequests")

  for (i=0; i<code.length; i++)
  {
    var str = "";
    str += "<td>" + code[i].IP + ":" + code[i].Port + "</td><td>" + (code[i].Duration/1000000).toFixed(2) + "ms</td><td>" + code[i].Code + "</td><td>" + code[i].Method + "</td><td>" + code[i].Protocol + "</td><td>" + code[i].Request + "</td><td>" + code[i].Length + "</td>";

    var n = XB.getDomNode("request_" + code[i].Id)
    if (!n)
    {
      n = XB.createDomNode("TR", "request_" + code[i].Id)
    }
    p.appendChild(n);
    n.innerHTML = str;
    n.date = new Date(code[i].Time);
  }
  document.getElementById("pagesserved").scrollTo(0, 10000000);
  
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


