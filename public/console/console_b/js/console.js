/**************************************************
** GAME VARIABLES
**************************************************/
var canvas,			// Canvas DOM element
	ctx,			// Canvas rendering context
	keys,			// Keyboard input
	localPlayer,	// Local player
	localName,
	localTeamId,
	remotePlayers,	// Remote players
	socket,			// Socket connection
	mouseX,
	mouseY,
	vX = 0,
	vY = 0,
	lastX,
	lastY,
	RADIUS = 2,
	MOUSE_RADIUS = 0.4,
	scale,
	playerSize,
	mstartX = -1,
	mstartY = -1;
var mapWidth = 20, mapHeight = 12;
var pixelPerBlock = 20;
var remainingWidth, remainingHeight;
var paddingX, paddingY;
var doors = [];
var maxRoomIndex = -1;

var p = 8003;
/**************************************************
** GAME INITIALISATION
**************************************************/
function init(name, team_id) {

	// Declare the canvas and rendering context
	canvas = document.getElementById("gameCanvas");
	ctx = canvas.getContext("2d");

	//Calculate width per block
	uiScaling();

	// Initialise keyboard controls
	keys = new Keys();

	// Calculate a random start position for the local player
	// The minus 5 (half a player size) stops the player being
	// placed right on the egde of the screen
	var startX = Math.round(Math.random()*(canvas.width-5)),
		startY = Math.round(Math.random()*(canvas.height-5));

	// Initialise the local player
	localPlayer = new Player(startX, startY);
	//localPlayer.

	// Initialise socket connection
	socket = io.connect("http://nctuece.ddns.net:" + p, {port: p, transports: ["websocket"]});


	switch(p)
	{
		case 8000:
			stylelist[0][1] = '#ff6666';
			stylelist[12][1] = '#ff6666';
			break;
		case 8002:
			stylelist[0][1] = '#11d4d4';
			stylelist[12][1] = '#11d4d4';
			break;
		case 8003:
			stylelist[0][1] = '#4da6ff';
			stylelist[12][1] = '#4da6ff';
			break;
	}

	// Initialise remote players array
	remotePlayers = [];

	// Start listening for events
	localName=name;
	localTeamId=team_id;
	setEventHandlers();
};


function uiScaling() {
	// Maximise the canvas
	canvas.width = window.innerWidth+1;
	canvas.height = window.innerHeight-50;

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
	scale = blockWidth/pixelPerBlock;
	playerSize = Math.round(scale * blockWidth/10);	
	if(playerSize < 5)
		playSize = 5;
}

/**************************************************
** GAME EVENT HANDLERS
**************************************************/
var setEventHandlers = function() {
	// Window resize
	window.addEventListener("resize", uiScaling, false);
	window.addEventListener("orientationchange", uiScaling, false);

	// Socket connection successful
	socket.on("connect", onSocketConnected);

	// Socket disconnection
	socket.on("disconnect", onSocketDisconnect);

	// New player message received
	socket.on("new player", onNewPlayer);
	
	// Player move message received
	socket.on("move player", onMovePlayer);

	// Player removed message received
	socket.on("remove player", onRemovePlayer);

	// Map change
	socket.on("map change", onMapChange);

	// Door open
	socket.on("door open", onDoorOpen);

	// Door close
	socket.on("door close", onDoorClose);

	socket.on("room change", onRoomChange);

	socket.on("sendInit", onSendInit);

	socket.on("chosen players", onChosenPlayers);

	socket.on("credit roll", showCredit);
};

// Keyboard key down
function onKeydown(e) {
	if (localPlayer) {
		keys.onKeyDown(e);
	};
};

// Keyboard key up
function onKeyup(e) {
	if (localPlayer) {
		keys.onKeyUp(e);
	};
};

// Browser window resize
function onResize(e) {
	uiScaling();
};

// Socket connected
function onSocketConnected() {
	console.log("Connected to socket server");

	// Send local player data to the game server
	socket.emit("new player", {x: localPlayer.getX(), y: localPlayer.getY(), name: localName, teamId:localTeamId});
};

// Socket disconnected
function onSocketDisconnect() {
	console.log("Disconnected from socket server");
};

// New player
function onNewPlayer(data) {
	console.log("New player connected: "+data.id);
	console.log("New player is at " + data.x + " " + data.y);
	// Initialise the new player
	var newPlayer = new Player(data.x, data.y, localName, localTeamId);
	newPlayer.id = data.id;

	// Add new player to the remote players array
	remotePlayers.push(newPlayer);
};

// Move player
function onMovePlayer(data) {
	var movePlayer = playerById(data.id);

	// Player not found
	if (!movePlayer) {
		console.log("Player not found: "+data.id);
		return;
	};

	// Update player position
	movePlayer.setX(data.x);
	movePlayer.setY(data.y);
};

// Remove player
function onRemovePlayer(data) {
	var removePlayer = playerById(data.id);

	// Player not found
	if (!removePlayer) {
		console.log("Player not found: "+data.id);
		return;
	};

	// Remove player from array
	remotePlayers.splice(remotePlayers.indexOf(removePlayer), 1);
};

// Map change
function onMapChange(data) {
	console.log("Map changed " + data.map);

	// Set the map 
	localPlayer.setMap(data.map);

	// Clear 
	remotePlayers = [];
	doors = [];

	//
	localPlayer.setAlreadyOnGoal(false);

	// Find starting point
	for (i = 0 ; i<mapHeight ; i++){
		for(r = 0 ; r<mapWidth ; r++){
			var blockId = (maps[data.map])[i][r];
			if(blockId===300)
			{
				localPlayer.setX(-1000);
				localPlayer.setY(-1000);
				localPlayer.setOriX(localPlayer.getX());
				localPlayer.setOriY(localPlayer.getY());
			}
			else if(blockId>=100 && blockId<=109)
			{
				var door = [blockId, 'close'];
				doors.push(door);
			}
		}
	}
	GetInit();
};


function onDoorOpen(data) {
	var id = data.id;

	var doorIndex = findDoorById(id);

	console.log("Door open with id: " + id + " and door index: "+ doorIndex);
	if(doorIndex == -1)
		console.log("Door index error: onDoorOpen");
	else if (doors[doorIndex][1] == "close")
		doors[doorIndex][1] = "open";
	else 
		console.log("Door status error"); 
}

function onDoorClose(data) {
	var id = data.id;

	var doorIndex = findDoorById(id);
	if(doorIndex == -1)
		console.log("Door index error: onDoorClose");
	else if (doors[doorIndex][1] == "open")
	{
		doors[doorIndex][1] = "close";
		if(isStuckInDoor(localPlayer.getX(), localPlayer.getY(), localPlayer.getMap()))
		{
			localPlayer.setX(localPlayer.getOriX());
			localPlayer.setY(localPlayer.getOriY());
			socket.emit("move player", {x: localPlayer.getX(), y: localPlayer.getY()});
		}
	}
	else
		console.log("Door status error: onDoorClose " + id + " is " + doors[doorIndex][1] ); 
}

/**************************************************
** GAME ANIMATION LOOP
**************************************************/
function animate() {
	draw();

	// Request a new animation frame using Paul Irish's shim
	window.requestAnimFrame(animate);
};


/**************************************************
** GAME UPDATE
**************************************************/

function checkTile(x, y, map) {
	if (map==-1)
		return;
	var i = Math.round((y-pixelPerBlock/2)/pixelPerBlock), r = Math.round((x-pixelPerBlock/2)/pixelPerBlock);
	if (i<0 || i>=mapHeight || r<0 || r>=mapWidth)
		return;
	
	var blockId = (maps[map])[i][r];
	switch(blockId){
		case 400:
			if(localPlayer.getAlreadyOnGoal() == false)
			{
				socket.emit("back to last");
				localPlayer.setAlreadyOnGoal(true);	
			}
			break;
		case 500:
			localPlayer.setX(localPlayer.getOriX());
			localPlayer.setY(localPlayer.getOriY());
			break;
		case 999:
			if(localPlayer.getAlreadyOnGoal() == false)
			{
				socket.emit("on goal");
				localPlayer.setAlreadyOnGoal(true);	
			}
			break;
	}
}

/**************************************************
** GAME DRAW
**************************************************/
function draw() {
	if(localPlayer.getMap()===-1)
		return;

	// Wipe the canvas clean
	ctx.fillStyle = 'white';
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	ctx.fillStyle = 'white';
	ctx.fillRect(paddingX, paddingY, canvas.width-remainingWidth, canvas.height-remainingHeight);

	// Draw map
	drawMap(localPlayer.getMap());
	
	var originColor = ctx.fillStyle;
	var originColor2 = ctx.strokeStyle;

	// Draw the remote players
	var i;
	var colorOtherBorder = 'grey'; var colorOtherFill = 'grey';
	var colorTeamFill = '#99ddff'; var colorTeamBorder = '#99ddff';
	for (i = 0; i < remotePlayers.length; i++) {
		drawPlayer(remotePlayers[i], colorOtherFill, colorOtherBorder);
	};
	// Draw gamepad	
	if(mstartX != -1){
		ctx.beginPath();
		ctx.arc(mstartX, mstartY, RADIUS * blockWidth , 0, 2*Math.PI);
		ctx.fillStyle =  "rgba(70 ,130, 180, 0.3)";
		ctx.strokeStyle =  "rgba(70 ,130, 180, 0.9)";
		ctx.lineWidth = blockWidth/5;
		ctx.stroke();
		ctx.fill();	
		
		ctx.beginPath();
		ctx.arc(mouseX, mouseY, MOUSE_RADIUS * blockWidth , 0, 2*Math.PI);
		ctx.fillStyle =  "rgba(100 ,160, 210, 1)";
		ctx.fill();	
		ctx.lineWidth = blockWidth/10;
		ctx.stroke();
	}
	ctx.fillStyle = originColor;
	ctx.strokeStyle = originColor2;
};

function drawMap(map) {
	var i, r;
	var drawLaterId = [];
	var drawLaterX = [];
	var drawLaterY = [];

	for (i = 0 ; i<mapHeight ; i++){
		for(r = 0 ; r<mapWidth ; r++){
			var blockId = (maps[map])[i][r];
			ctx.strokeStyle = 'black';
			// Doors
			if(blockId>=100 && blockId<=109){
				drawLaterX.push(r);
				drawLaterY.push(i);
				drawLaterId.push(blockId);
			}
			// Button
			else if (blockId>=200 && blockId<=209){
				drawLaterX.push(r);
				drawLaterY.push(i);
				drawLaterId.push(blockId);
				ctx.fillStyle = findStyle(blockId);
				drawCircle(i, r);					
			}
			// Goal
			else if (blockId == 999){
				ctx.fillStyle = findStyle(blockId);
				drawBlock(i, r, false);
			}
			else if (blockId == 1 || blockId == 600){
				ctx.fillStyle = findStyle(blockId);
				ctx.strokeStyle = ctx.fillStyle;
				drawBlock(i, r, true);
			}
			//400 back to last, 500 back to origin
			else if (blockId ==  400 || blockId ==500){
				ctx.fillStyle = findStyle(blockId);
				drawBlock(i, r, false);			
			}
			
		}
	}

	ctx.strokeStyle = 'black';
	var x, y, i, blockId;
	for(i=0 ; i<drawLaterId.length ; i++)
	{
		
		y = drawLaterY[i];
		x = drawLaterX[i]
		blockId = drawLaterId[i];

		ctx.fillStyle = findStyle(blockId);
		if(blockId>=100 && blockId<=109){
			if(!isDoorOpen(blockId))
			{
				drawBlock(y, x, false);
				drawCross(y, x);
			}
		}
		// Button
		else if (blockId>=200 && blockId<=209){	
			drawCircle(y, x);					
		}

	}
}
function drawPlayer(player, styleFill, styleBorder)
{
	// Translate the coord
	var x = player.getX(), y = player.getY();
	var cX = Math.round( scale* x),
		cY = Math.round( scale * y);
	ctx.strokeStyle = styleBorder;
	ctx.fillStyle = styleFill;
	ctx.beginPath();
	ctx.arc(cX+paddingX, cY+paddingY, playerSize/2 , 0, 2*Math.PI);
	ctx.fill();	
	ctx.lineWidth = playerSize/5;
	ctx.stroke();
	if(player.rippleFlag){
		console.log("drawing ripple...");
		player.clickedRipple += RIPPLE_DELTA;
		ctx.strokeStyle = "rgba(50, 50, 50, 0.8)";
		ctx.beginPath();
		ctx.lineWidth = 2;
		ctx.arc(cX+paddingX, cY+paddingY, player.clickedRipple*blockWidth, 0, 2*Math.PI);
		ctx.stroke();
		if(player.clickedRipple > MAX_RIPPLE_SIZE){
			player.rippleFlag = false;
			player.clickedRipple = 0;
		}
	}
}

function drawBlock(i, r, withBorder)
{
	//ctx.fillRect(r*blockWidth+1+paddingX, i*blockWidth+1+paddingY, blockWidth-2, blockWidth-2);
	ctx.fillRect(r*blockWidth+paddingX+1, i*blockWidth+paddingY+1, blockWidth-2, blockWidth-2);

	if(withBorder == true)
	{
		ctx.beginPath();
		ctx.lineWidth=1;
		ctx.rect(r*blockWidth+paddingX, i*blockWidth+paddingY, blockWidth, blockWidth);
		ctx.stroke();
	}

}

function drawCross(i, r)
{
	ctx.fillStyle = 'black';
	ctx.lineWidth=2*scale;
	ctx.beginPath();
	ctx.moveTo(r*blockWidth+paddingX+4,i*blockWidth+paddingY+4);
	ctx.lineTo(r*blockWidth+paddingX + blockWidth-4,i*blockWidth+paddingY+blockWidth-4);
	ctx.stroke();
	ctx.beginPath();
	ctx.moveTo(r*blockWidth+paddingX+blockWidth-4,i*blockWidth+paddingY+4);
	ctx.lineTo(r*blockWidth+paddingX+4,i*blockWidth+paddingY+blockWidth-4);
	ctx.stroke();
	ctx.beginPath();
	ctx.fillStyle = 'black';
	ctx.lineWidth=2*scale;
	ctx.rect(r*blockWidth+paddingX, i*blockWidth+paddingY, blockWidth, blockWidth);
	ctx.stroke();
}

function drawCircle(i, r) {
	ctx.lineWidth=2*scale;
	ctx.beginPath();
	ctx.arc(r*blockWidth+paddingX + blockWidth/2, i*blockWidth+paddingY+blockWidth/2 ,blockWidth/2,0,2*Math.PI);
	ctx.fill();
	ctx.fillStyle = 'black';
	ctx.beginPath();
	ctx.arc(r*blockWidth+paddingX + blockWidth/2, i*blockWidth+paddingY+blockWidth/2 ,blockWidth/2,0,2*Math.PI);
	ctx.stroke();
}


/**************************************************
** GAME HELPER FUNCTIONS
**************************************************/
// Find player by ID
function playerById(id) {
	var i;
	for (i = 0; i < remotePlayers.length; i++) {
		if (remotePlayers[i].id == id)
			return remotePlayers[i];
	};
	
	return false;
};

function isStuckInDoor(x, y, map) {
	if (map == -1)
		return true;
	var i = Math.round((y-pixelPerBlock/2)/pixelPerBlock), r = Math.round((x-pixelPerBlock/2)/pixelPerBlock);
	if (i<0 || i>=mapHeight || r<0 || r>=mapWidth)
		return true;
	//console.log("i :" + i, "r: "+ r);
	var blockId = (maps[map])[i][r];
	if(blockId>=100 && blockId<=109)
	{
		if(!isDoorOpen(blockId))
			return true;
	}
	return false;
}

function isCollision(x, y, map){
	if (map == -1)
		return true;
	var i = Math.round((y-pixelPerBlock/2)/pixelPerBlock), r = Math.round((x-pixelPerBlock/2)/pixelPerBlock);
	if (i<0 || i>=mapHeight || r<0 || r>=mapWidth)
		return true;
	//console.log("i :" + i, "r: "+ r);
	var blockId = (maps[map])[i][r];
	if(blockId===1)
		return true;
	if(blockId>=100 && blockId<=109)
	{
		if(!isDoorOpen(blockId))
			return true;
	}
	return false;
}
function findStyle(id) {
	var i;
	for(i = 0; i<stylelist.length ; i++)
		if(stylelist[i][0]==id)
			return stylelist[i][1];
	return 'black';
}

function findDoorById(id) {
	var i;
	for(i=0 ; i<doors.length ; i++)
	{
		if(doors[i][0]==id)	
			return i;
	}
	return -1;
}


function isDoorOpen(id){
	
	var doorIndex = findDoorById(id);
	
	if (doorIndex == -1)
		console.log("Door index error");
	else if (doors[doorIndex][1] == "close")
	{
		return false;
	}
	return true;
}

function checkOnButton(x, y, map) {
	if (map==-1)
		return;
	var i = Math.round((y-pixelPerBlock/2)/pixelPerBlock), r = Math.round((x-pixelPerBlock/2)/pixelPerBlock);
	if (i<0 || i>=mapHeight || r<0 || r>=mapWidth)
		return;
	
	var blockId = (maps[map])[i][r];

	if(blockId>= 200 && blockId<=209)
		return blockId;
	return -1;
}

/*CONSOLE*/
function updateHtml(){
	document.getElementById("map").innerHTML = localPlayer.getMap();
}

function onRoomChange(data)
{
	localPlayer.setRoom(data.room);
	onMapChange(data);
	console.log("onRoomChange " + data.map +" " + data.room);
}


function GetInit() {
	socket.emit("getInit");
}

function NextRoom(){
	localPlayer.nextRoom();
	console.log("NextRoom "+localPlayer.getRoom());
	socket.emit("change room to",{room:localPlayer.getRoom()}); //change to next map after press the button
}


function NextMap(){
	localPlayer.nextMap();
	socket.emit("change map to",{map:localPlayer.getMap()}); //change to next map after press the button
}

function LastMap(){
	localPlayer.lastMap();
	socket.emit("change map to",{map:localPlayer.getMap()}); //change to previse map after press the button
}

function DoorAllOpen(){
	var mapIndex = localPlayer.getMap();
	var openedDoor = [];
	for (i = 0 ; i<mapHeight ; i++){
		for(r = 0 ; r<mapWidth ; r++){
			var id=(maps[mapIndex])[i][r];
			if(openedDoor.indexOf(id)==-1 && id>=100 && id<=109){
				openedDoor.push(id);
				socket.emit("door open", {id: id});
				console.log("sent door open " + id + " mapIndex:" + mapIndex);
			}
		}
	}
}

function mapChoose(){
	var mapIndex = document.getElementById("mapNumber").value;
	if(mapIndex>=0 && mapIndex<maxMapIndex)
		socket.emit("change map to", {map: mapIndex}); //change to the map to what was inputed
}

function onSendInit(data) {
	localPlayer.setMap(data.map);
	localPlayer.setRoom(data.room);
	maxRoomIndex = data.maxRoomIndex;
	console.log("map room " + data.map +"  " + data.room + " maxRoomIndex " +maxRoomIndex);
	updateHtml();
}


function showCredit() {
	document.getElementById("gameCanvas").style.display = "none";
	document.getElementById("console").style.display = "none";

	document.getElementById("credit_roll").style.display = "block";
	document.body.className = "grey lighten-4 valign-wrapper";
}

function onChosenPlayers(data) {
	var players = JSON.parse(data);

	console.log(players);
}