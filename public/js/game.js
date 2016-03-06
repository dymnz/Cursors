/**************************************************
** GAME VARIABLES
**************************************************/
var canvas,			// Canvas DOM element
	ctx,			// Canvas rendering context
	keys,			// Keyboard input
	localPlayer,	// Local player
	remotePlayers,	// Remote players
	socket,
	scale,
	playerSize;			// Socket connection
var 	mouseX,
	mouseY,
	mstartX = -1,
	mstartY = -1,
	vX = 0,
	vY = 0,
	RADIUS = 100,
	MOUSE_RADIUS = 20;
var mapWidth = 20, mapHeight = 12;
var pixelPerBlock = 20;
var remainingWidth, remainingHeight;
var paddingX, paddingY;
var doors = [];
/**************************************************
** GAME INITIALISATION
**************************************************/
function init() {
	// Declare the canvas and rendering context
	canvas = document.getElementById("gameCanvas");
	ctx = canvas.getContext("2d");

	// Maximise the canvas
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	//Calculate width per block
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
	paddingY = Math.round(remainingHeight/2)
	scale = blockWidth/pixelPerBlock;
	playerSize = Math.round(scale * blockWidth/10);
	

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
	socket = io.connect("http://localhost:8000", {port: 8000, transports: ["websocket"]});

	// Initialise remote players array
	remotePlayers = [];

	// Start listening for events
	setEventHandlers();
};


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
		mouseX = (e.pageX + mstartX)/2;
		mouseY = (e.pageY + mstartY)/2;
		var mouseLength = Math.sqrt((mouseX-mstartX)*(mouseX-mstartX) + (mouseY-mstartY)*(mouseY-mstartY));
		if(mouseLength > RADIUS){
			mouseX = RADIUS*(mouseX-mstartX)/mouseLength + mstartX;
			mouseY = RADIUS*(mouseY-mstartY)/mouseLength + mstartY;
		}
		vX = (mouseX - mstartX)/10;
		vY = (mouseY - mstartY)/10;
	}
	else if(e.type == "mousedown"){
		mstartX = e.pageX;
		mstartY = e.pageY;
		mouseX = mstartX;
		mouseY = mstartY;
		socket.emit("push", {});
	}
	else if(e.type == "mouseup") {
		mstartX = -1;
		vX = 0;
		vY = 0;
	}
}

function touchHandler(e) {
	e.preventDefault();
	if(e.type == "touchstart"){
		mstartX = e.touches[0].pageX;
		mstartY = e.touches[0].pageY;
		mouseX = mstartX;
		mouseY = mstartY;
		socket.emit("push", {});
	}
	else if(e.type == "touchmove"){
		mouseX = (e.touches[0].pageX + startX)/2;
		mouseY = (e.touches[0].pageY + startY)/2;
		var mouseLength = Math.sqrt((mouseX-mstartX)*(mouseX-mstartX) + (mouseY-mstartY)*(mouseY-mstartY));
		if(mouseLength > RADIUS){
			mouseX = RADIUS*(mouseX-mstartX)/mouseLength + mstartX;
			mouseY = RADIUS*(mouseY-mstartY)/mouseLength + mstartY;
		}
		vX = (mouseX - mstartX)/10;
		vY = (mouseY - mstartY)/10;
	}
	else if(e.type == "touchend"){
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
};

// Socket connected
function onSocketConnected() {
	console.log("Connected to socket server");

	// Send local player data to the game server
	socket.emit("new player", {x: localPlayer.getX(), y: localPlayer.getY()});
};

// Socket disconnected
function onSocketDisconnect() {
	console.log("Disconnected from socket server");
};

// New player
function onNewPlayer(data) {
	console.log("New player connected: "+data.id);

	// Initialise the new player
	var newPlayer = new Player(data.x, data.y);
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
	console.log("Map changed");

	// Set the map 
	localPlayer.setMap(data.map);

	// Clear 
	remotePlayers = [];
	doors = [];

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

			}
			else if(blockId>=100 && blockId<=109)
			{
				var door = [blockId, 'close'];
				doors.push(door);
			}
		}
	}

};


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
	if (localPlayer.update(keys)) {
		// Send local player data to the game server
		socket.emit("move player", {x: localPlayer.getX(), y: localPlayer.getY()});
	};
	checkTile(localPlayer.getX(), localPlayer.getY(), localPlayer.getMap());
};

function checkTile(x, y, map) {
	var i = Math.round((y-pixelPerBlock/2)/pixelPerBlock), r = Math.round((x-pixelPerBlock/2)/pixelPerBlock);
	if (i<0 || i>=mapHeight || r<0 || r>=mapWidth)
		return;

	var blockId = (maps[map])[i][r];
	switch(blockId){
		case 400:
			socket.emit("back to last");
			break;
		case 500:
			localPlayer.setX(localPlayer.getOriX());
			localPlayer.setY(localPlayer.getOriY());
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
		ctx.arc(mstartX, mstartY, RADIUS, 0, 2*Math.PI);
		ctx.stroke();
		
		ctx.beginPath();
		ctx.arc(mouseX, mouseY, MOUSE_RADIUS, 0, 2*Math.PI);
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
				drawBlock(i, r);
				drawCross(i, r);
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
	ctx.fillRect(r*blockWidth+2+paddingX, i*blockWidth+2+paddingY, blockWidth-4, blockWidth-4);
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
		if(isDoorOpen(blockId))
			return false;
		else
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

function isDoorOpen(id){
	var i;
	for(i=0 ; i<doors.length ; i++)
	{
		if(doors[i][0]===id)
			if(doors[i][1]==='close')
				return false;
			else 
				return true;
	}
	return false;
}
