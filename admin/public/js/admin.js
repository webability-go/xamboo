
XB = {}
XB.onLoad = onLoad

function onLoad()
{
    var output = document.getElementById("output");
    var input = document.getElementById("input");
    var ws;
    var print = function(message) {
        var d = document.createElement("div");
        d.innerHTML = message;
        output.appendChild(d);
    };
    
    console.log("loading Hooks")
    
    document.getElementById("open").onclick = function(evt) {
      console.log("CLICK OPEN")
    
    
        if (ws) {
            return false;
        }
        ws = new WebSocket("wss://developers.webability.info:81/listener");
        ws.onopen = function(evt) {
            print("OPEN");
        }
        ws.onclose = function(evt) {
            print("CLOSE");
            ws = null;
        }
        ws.onmessage = function(evt) {
            print("RESPONSE: " + evt.data);
        }
        ws.onerror = function(evt) {
            print("ERROR: " + evt.data);
        }
        return false;
    };
    document.getElementById("send").onclick = function(evt) {
      console.log("CLICK SEND")
        if (!ws) {
            return false;
        }
        print("SEND: " + input.value);
        ws.send(input.value);
        return false;
    };
    document.getElementById("close").onclick = function(evt) {
      console.log("CLICK CLOSE")
        if (!ws) {
            return false;
        }
        ws.close();
        return false;
    };
    
}