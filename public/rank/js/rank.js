
var serverAddrs = ["http://127.0.0.1", "http://127.0.0.1", "http://127.0.0.1"];
var sockets = [];
var canvas, context;
var mapWidth = 20, mapHeight = 3;
var remainingWidth, remainingHeight;
var paddingX, paddingY;


function init(){

	for(var i = 0 ; i < serverAddrs.length ; i++)
		sockets.push(io.connect(serverAddrs[i] + ":8000", {port: 8000, transports: ["websocket"]}));

	canvas = document.getElementById("gameCanvas");
	context = canvas.getContext("2d");

	window.addEventListener("resize", uiScaling, false);

	window.setTimeout(1000, askForData);
}

function askForData() {
	window.setTimeout(1000, askForData);
}

function updateRankList() {
		
}

function drawPivot() {
	
}

function animate() {
	ctx.fillStyle = '#b3e5fc';
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	ctx.fillStyle = 'white';
	ctx.fillRect(paddingX, paddingY, canvas.width-remainingWidth, canvas.height-remainingHeight);

	drawCircle(3, 4, 20);
}

function drawCircle(row, col, radius) {
	ctx.lineWidth=2*scale;
	ctx.beginPath();
	ctx.arc(col*blockWidth+paddingX + blockWidth/2, row*blockWidth+paddingY+blockWidth/2 ,blockWidth/2,0,2*Math.PI);
	ctx.fill();
	ctx.fillStyle = 'black';
	ctx.beginPath();
	ctx.arc(col*blockWidth+paddingX + blockWidth/2, row*blockWidth+paddingY+blockWidth/2 ,blockWidth/2,0,2*Math.PI);
	ctx.stroke();
}


function uiScaling() {
	// Maximise the canvas

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	if (canvas.width/mapWidth >= canvas.height/mapHeight){
		blockWidth = canvas.height/mapHeight;
		remainingHeight = 0;
		remainingWidth = canvas.width - blockWidth*mapWidth;
	}
	else{
		blockWidth = canvas.width/mapWidth;
		remainingHeight = canvas.height - blockWidth*mapHeight;
		remainingWidth = 0;
	}

	paddingX = Math.round(remainingWidth/2);
	paddingY = Math.round(remainingHeight/2);

	playerSize = Math.round(scale * blockWidth/10);	
	if(playerSize < 10)
		playerSize = 10;

}