
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
  
  str = "";
  for (i=0; i<code.lastrequests.length; i++)
  {
    str += code.lastrequests[i].Request + "<br />";
  }
  
  document.getElementById("pagesserved").innerHTML = str
}

XB.wserror = function(evt)
{
  console.log("WS error: ", evt.data);
}



