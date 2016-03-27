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
	MOUSE_RADIUS = 0.4;
var scale,
	playerSize,
	mstartX = -1,
	mstartY = -1;
var mapWidth = 20, mapHeight = 12;
var pixelPerBlock = 20;
var remainingWidth, remainingHeight;
var paddingX, paddingY;
var doors = [];
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
	socket = io.connect("http://127.0.0.1:8000", {port: 8000, transports: ["websocket"]});

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
	canvas.height = window.innerHeight+1;

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
	// Keyboard
	window.addEventListener("keydown", onKeydown, false);
	window.addEventListener("keyup", onKeyup, false);
	canvas.addEventListener("mousemove", mouseHandler, false);
	canvas.addEventListener("mousedown", mouseHandler, false);
	canvas.addEventListener("mouseup", mouseHandler, false);
	canvas.addEventListener("touchstart", touchHandler, false);
	canvas.addEventListener("touchmove", touchHandler, false);
	canvas.addEventListener("touchend", touchHandler, false);

	// Window resize
	window.addEventListener("resize", onResize, false);
	window.addEventListener("orientationchange", onResize, false);

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

function mouseHandler(e) {
	if(mstartX != -1 && e.type == "mousemove"){
		e.preventDefault();
		mouseX = (e.pageX - mstartX)/3 + mstartX;
		mouseY = (e.pageY - mstartY)/3 + mstartY;
		var mouseLength = Math.sqrt((mouseX-mstartX)*(mouseX-mstartX) + (mouseY-mstartY)*(mouseY-mstartY));
		if(mouseLength > RADIUS * blockWidth){
			mouseX = RADIUS* blockWidth *(mouseX-mstartX)/mouseLength + mstartX;
			mouseY = RADIUS* blockWidth *(mouseY-mstartY)/mouseLength + mstartY;
		}
		vX = (mouseX - mstartX)/25/scale;
		vY = (mouseY - mstartY)/25/scale;
	}
	else if(e.type == "mousedown"){
		mstartX = e.pageX;
		mstartY = e.pageY;
		mouseX = mstartX;
		mouseY = mstartY;
		lastX=localPlayer.getX();
		lastY=localPlayer.getY();
		//buttonPushed(localPlayer.getX(), localPlayer.getY(), localPlayer.getMap());
	}
	else if(e.type == "mouseup") {
		e.preventDefault();
		mstartX = -1;
		if(Math.sqrt((localPlayer.getX()-lastX)*(localPlayer.getX()-lastX) + (localPlayer.getY()-lastY)*(localPlayer.getY()-lastY))<5)
			buttonPushed(localPlayer.getX(), localPlayer.getY(), localPlayer.getMap());
		vX = 0;
		vY = 0;
	}
}

function touchHandler(e) {
	if(e.type == "touchstart" && e.touches.length == 1){
		mstartX = e.touches[0].pageX;
		mstartY = e.touches[0].pageY;
		mouseX = mstartX;
		mouseY = mstartY;
		lastX=localPlayer.getX();
		lastY=localPlayer.getY();
	}
	else if(e.type == "touchmove"){
		e.preventDefault();
		mouseX = (e.touches[0].pageX - mstartX)/2 + mstartX;
		mouseY = (e.touches[0].pageY - mstartY)/2 + mstartY;

		var mouseLength = Math.sqrt((mouseX-mstartX)*(mouseX-mstartX) + (mouseY-mstartY)*(mouseY-mstartY));
		if(mouseLength > RADIUS* blockWidth){
			mouseX = RADIUS* blockWidth *(mouseX-mstartX)/mouseLength + mstartX;
			mouseY = RADIUS* blockWidth *(mouseY-mstartY)/mouseLength + mstartY;
		}
		vX = (mouseX - mstartX)/25/scale;
		vY = (mouseY - mstartY)/25/scale;
	}
	else if(e.type == "touchend"){
		e.preventDefault();
		if(Math.sqrt((localPlayer.getX()-lastX)*(localPlayer.getX()-lastX) + (localPlayer.getY()-lastY)*(localPlayer.getY()-lastY))<5)
			buttonPushed(localPlayer.getX(), localPlayer.getY(), localPlayer.getMap());

		mstartX = -1;
		mstartY = -1;
		vX = 0;
		vY = 0;
	}
}

// Browser window resize
function onResize(e) {
	// Maximise the canvas
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

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
				localPlayer.setX(r*pixelPerBlock + Math.round(Math.random()*(pixelPerBlock)));
				localPlayer.setY(i*pixelPerBlock + Math.round(Math.random()*(pixelPerBlock)));
				localPlayer.setOriX(localPlayer.getX());
				localPlayer.setOriY(localPlayer.getY());
				console.log("x :" + localPlayer.getX() + "y :" + localPlayer.getY());
				
				// Send local player data to the game server
				socket.emit("move player", {x: localPlayer.getX(), y: localPlayer.getY()});
			}
			else if(blockId>=100 && blockId<=109)
			{
				var door = [blockId, 'close'];
				doors.push(door);
			}
		}
	}

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
	update();
	draw();

	// Request a new animation frame using Paul Irish's shim
	window.requestAnimFrame(animate);
};


/**************************************************
** GAME UPDATE
**************************************************/
function update() {
	// Update local player and check for change
	if (localPlayer.update(keys, vX, vY)) {
		// Send local player data to the game server
		socket.emit("move player", {x: localPlayer.getX(), y: localPlayer.getY()});
	};
	checkTile(localPlayer.getX(), localPlayer.getY(), localPlayer.getMap());
};

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
	ctx.fillStyle = 'black';
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	ctx.fillStyle = 'white';
	ctx.fillRect(paddingX, paddingY, canvas.width-remainingWidth, canvas.height-remainingHeight);

	// Draw map
	drawMap(localPlayer.getMap());

	// Draw the local player
	drawPlayer(localPlayer.getX(), localPlayer.getY(), 'red');

	// Draw the remote players
	var i;
	for (i = 0; i < remotePlayers.length; i++) {
		drawPlayer(remotePlayers[i].getX(), remotePlayers[i].getY(), 'grey');
	};

	// Draw gamepad	
	if(mstartX != -1){
		var originColor = ctx.fillStyle;
		ctx.beginPath();
		ctx.arc(mstartX, mstartY, RADIUS * blockWidth , 0, 2*Math.PI);
		ctx.stroke();
		
		ctx.beginPath();
		ctx.arc(mouseX, mouseY, MOUSE_RADIUS * blockWidth , 0, 2*Math.PI);
		ctx.fillStyle = 'red';
		ctx.fill();	
		ctx.fillStyle = originColor;
	}
};

function drawMap(map) {
	var i, r;

	for (i = 0 ; i<mapHeight ; i++){
		for(r = 0 ; r<mapWidth ; r++){
			var blockId = (maps[map])[i][r];

			// Doors
			if(blockId>=100 && blockId<=109){
				ctx.fillStyle = findStyle(blockId);
				if(!isDoorOpen(blockId))
				{
					drawBlock(i, r);
					drawCross(i, r);
				}
				
			}
			// Button
			else if (blockId>=200 && blockId<=209){
				ctx.fillStyle = findStyle(blockId);
				drawBlock(i, r);
				drawCircle(i, r);					
			}
			// Goal
			else if (blockId == 999 || blockId == 1){
				ctx.fillStyle = findStyle(blockId);
				drawBlock(i, r);
			}
			//400 back to last, 500 back to origin
			else if (blockId ==  400 || blockId ==500){
				ctx.fillStyle = findStyle(blockId);
				drawBlock(i, r);
			}
			
		}
	}
}

function drawPlayer(x, y, style)
{
	// Translate the coord
	var cX = Math.round( scale* x),
		cY = Math.round( scale * y);
	ctx.fillStyle = style;
	ctx.fillRect(cX - playerSize/2+paddingX, cY-playerSize/2+paddingY, playerSize, playerSize);
	
}

function drawBlock(i, r)
{
	ctx.fillRect(r*blockWidth+1+paddingX, i*blockWidth+1+paddingY, blockWidth-2, blockWidth-2);
}

function drawCross(i, r)
{
	ctx.fillStyle = 'black';
	ctx.lineWidth=3;
	ctx.beginPath();
	ctx.moveTo(r*blockWidth+paddingX+4,i*blockWidth+paddingY+4);
	ctx.lineTo(r*blockWidth+paddingX + blockWidth-4,i*blockWidth+paddingY+blockWidth-4);
	ctx.stroke();
	ctx.beginPath();
	ctx.moveTo(r*blockWidth+paddingX+blockWidth-4,i*blockWidth+paddingY+4);
	ctx.lineTo(r*blockWidth+paddingX+4,i*blockWidth+paddingY+blockWidth-4);
	ctx.stroke();
}

function drawCircle(i, r) {
	ctx.fillStyle = 'black';
	ctx.lineWidth=3;
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

function buttonPushed(x, y, map) {
	console.log("pushed");

	socket.emit("push");

	var blockId = checkOnButton(x, y, map);
	if(blockId != -1)
	{
		socket.emit("door open", {id: blockId-100});
		console.log("door open sent");
	}
}