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
var mapWidth = 20, mapHeight = 12;
var pixelPerBlock = 20;
var remainingWidth, remainingHeight;
var paddingX, paddingY;
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

	// Find starting point
	for (i = 0 ; i<mapHeight ; i++){
		for(r = 0 ; r<mapWidth ; r++){
			if((maps[data.map])[i][r]===300)
			{
				localPlayer.setX(r*pixelPerBlock + Math.round(Math.random()*(pixelPerBlock)));
				localPlayer.setY(i*pixelPerBlock + Math.round(Math.random()*(pixelPerBlock)));
				console.log("x :" + localPlayer.getX() + "y :" + localPlayer.getY());

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
};


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
};

function drawMap(map) {
	var i, r;

	for (i = 0 ; i<mapHeight ; i++){
		for(r = 0 ; r<mapWidth ; r++){
			switch((maps[map])[i][r])
			{
				case 1: // Wall
					ctx.fillStyle = 'black';
					drawBlock(i, r);
					break;
				case 300: // Origin
					ctx.fillStyle = 'yellow';
					drawBlock(i, r);
					break;					
				case 999: // Goal
					ctx.fillStyle = 'green';
					drawBlock(i, r);
					break;
				default:
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
	
	console.log("cx :" + cX + "cy :" + cY);
}

function drawBlock(i, r)
{
	ctx.fillRect(r*blockWidth+2+paddingX, i*blockWidth+2+paddingY, blockWidth-4, blockWidth-4);
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
	var i = Math.round((y-pixelPerBlock/2)/pixelPerBlock), r = Math.round((x-pixelPerBlock/2)/pixelPerBlock);
	if((maps[map])[i][r]===1)
		return true;
	return false;
}

