
var serverPorts = [8000, 8002, 8003];
var sockets = [];
//var serverAddrs = "http://nctuece.ddns.net";
var serverAddrs = "http://127.0.0.1";

var serverColors = ['#ff6666', '#11d4d4', '#4da6ff'];
var serverMemeberCounts = [];

var successList = [];
var  serverCount = 3;


function init(){

	for(var i = 0 ; i < serverCount ; i++)
		sockets.push(io.connect(serverAddrs + ":" + serverPorts[i], {port: serverPorts[i], transports: ["websocket"]}));

	for(var i=0 ; i<sockets.length ; i++){
		sockets[i].emit("i am rank");
		sockets[i].on("success", onSuccess);	
	}
}


function onSuccess(data) {
	var successData = [data.server, data.teamId, data.name];

	if(successList.length==0)
		document.getElementById("list").innerHTML = "";

	successList.push(successData);
	console.log(successData);
	updateList(successData);

}


function updateList(newData) {

	var x = document.createElement("h5");
	x.innerHTML=newData[2] + " #" + newData[1];
	
	switch(newData[0])
	{
		case "r":
			x.className="row blue-grey-text text-darken-4 redlist center-align";		
		break;
		case "g":
			x.className="row blue-grey-text text-darken-4 greenlist center-align";
		break;
		case "b":
			x.className="row blue-grey-text text-darken-4 bluelist center-align";
		break;
	}	
    	
    	document.getElementById("list").appendChild(x);
	
}
