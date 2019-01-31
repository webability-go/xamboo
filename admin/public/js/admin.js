
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
  console.log(code)
  
  str = '<table border="1"><tr><td>Remote IP</td><td>Time ms</td><td>Code</td><td>Method</td><td>Protocol</td><td>Request</td><td>Length</td></tr>';
  for (i=0; i<code.lastrequests.length; i++)
  {
    str += "<tr><td>" + code.lastrequests[i].IP + ":" + code.lastrequests[i].Port + "</td><td>" + (code.lastrequests[i].Duration/1000000).toFixed(2) + "ms</td><td>" + code.lastrequests[i].Code + "</td><td>" + code.lastrequests[i].Method + "</td><td>" + code.lastrequests[i].Protocol + "</td><td>" + code.lastrequests[i].Request + "</td><td>" + code.lastrequests[i].Length + "</td></tr>";
  }
  str += "</table>";
  
  document.getElementById("cpu").innerHTML = code.cpu;
  document.getElementById("goroutines").innerHTML = code.goroutines;
  document.getElementById("memalloc").innerHTML = code.memalloc;
  document.getElementById("memsys").innerHTML = code.memsys;
  document.getElementById("totalservedrequests").innerHTML = code.totalservedrequests;
  document.getElementById("totalservedlength").innerHTML = code.totalservedlength;

  document.getElementById("pagesserved").innerHTML = str;
  document.getElementById("pagesserved").scrollTo(0, 10000000);
}

XB.wserror = function(evt)
{
  console.log("WS error: ", evt.data);
}



