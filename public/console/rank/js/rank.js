
var serverPorts = [8000, 8002, 8003];
var serverAddrs = "http://nctuece.ddns.net";
//var serverAddrs = "http://127.0.0.1";

var serverColors = ['#ff6666', '#11d4d4', '#4da6ff'];
var serverMemeberCounts = [];

var successList = [];

var sockets = [];
var canvas, context;
var  mapCount = 22, mapHeight = 4, serverCount = 3, mapWidth = mapCount + 1;
var remainingWidth, remainingHeight;
var paddingX, paddingY;
var blockWidth, blockHeight;
var requestInterval = 1000;
var gameOver = false;

	var testMemberCounts = [5, 10, 20, 30, 2,
	0, 10, 20, 30, 2,
	0, 10, 20, 30, 2,
	0, 10, 20, 30, 2,
	0, 10];


function init(){

	for(var i = 0 ; i < serverCount ; i++)
		sockets.push(io.connect(serverAddrs + ":" + serverPorts[i], {port: serverPorts[i], transports: ["websocket"]}));

	canvas = document.getElementById("gameCanvas");
	context = canvas.getContext("2d");

	window.addEventListener("resize", uiScaling, false);

	window.setTimeout(askForData, requestInterval);

	for(var i=0 ; i<sockets.length ; i++){
		sockets[i].emit("i am rank");
		sockets[i].on("map info", onMapInfo);
		sockets[i].on("success", onSuccess);		
	}

	


	uiScaling();
}

function askForData() {
	window.setTimeout(askForData, requestInterval);
	

	for(var i=0 ; i<sockets.length ; i++)
		sockets[i].emit("get server info");

	
}

function updateRankList() {
	animate();
}

function onSuccess(data) {
	var successData = [data.server, data.teamId, data.name];

	successList.push(successData);
	console.log(successData);

}

function onMapInfo(data) {
	var socketIndex = findSocketIndexWithSocket(this);
	var memberCounts = JSON.parse(data);


	//TODO remove
	//memberCounts = testMemberCounts;
	//randMem();

	serverMemeberCounts[socketIndex] = memberCounts;

	updateRankList();
	
}
function randMem() {

	var temp;
	var index;
	for(var i=0 ; i<2*mapCount ; i++)
	{
		index = Math.floor(Math.random() * mapCount);
		temp = testMemberCounts[index];
		testMemberCounts[index] = testMemberCounts[0];
		testMemberCounts[0] = temp;

	}
	
}

function drawPivot() {
	context.fillStyle = 'black';
	for(var i=1 ; i<mapWidth ; i++)
	{
		if(i==1 || i%5==0 || i==mapCount)
			drawWord(0, i, i.toString());
	}
}

function animate() {
	context.fillStyle = 'white';
	context.fillRect(0, 0, canvas.width, canvas.height);
	
	
	drawPivot();

	var circleRadius;
	for(var i=0 ; i<serverCount ; i++)
	{
		context.fillStyle = serverColors[i];
		context.strokeStyle = serverColors[i];
		console.log(serverMemeberCounts[i]);
		for(var r=0 ; r<mapCount ; r++)
		{
			//console.log(serverCount + " " +serverMemeberCounts[2].length);
			if( serverMemeberCounts[i][r]>0){
				circleRadius = calculateCircleRadius(blockWidth, serverMemeberCounts[i][r]);
				if(circleRadius<blockWidth/3)
					circleRadius = blockWidth/3;
				drawCircle(i+1, r+1, circleRadius);
			}
		}
	}	
}

function calculateCircleRadius(maxWidth, count) {		
	var upperBound = 5;
	return Math.round(count*2/upperBound*maxWidth);
}

function drawCircle(row, col, radius) {
	
	context.lineWidth=2;
	context.beginPath();
	context.arc(col*blockWidth, row*blockHeight ,radius/2,0,2*Math.PI);
	context.fill();
	context.beginPath();
	context.arc(col*blockWidth, row*blockHeight ,radius/2,0,2*Math.PI);
	context.stroke();
}

function drawWord(row, col, word) {
	
	context.fillText(word ,col*blockWidth ,row*blockHeight + fontSize);
}


function uiScaling() {
	// Maximise the canvas

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	blockHeight = Math.round(canvas.height/mapHeight);
	blockWidth = Math.round(canvas.width/mapWidth);
	fontSize = blockWidth/2;
	
	context.font = fontSize.toString() + "px Arial";
}

function findSocketIndexWithSocket(socket)
{
  for(var i=0 ; i<sockets.length ; i++)
            if(sockets[i]==socket)
                return i;
  return -1;
}
