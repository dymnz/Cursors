/**************************************************
** GAME VARIABLES
**************************************************/
var canvas,			// Canvas DOM element
	ctx,			// Canvas rendering context
	keys,			// Keyboard input
	localPlayer,	// Local player
	localName,
	localTeamId,
	role,
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
	RIPPLE_DELTA = 0.1,
	MAX_RIPPLE_SIZE = 0.4;
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

function connectionInit(){
	// Initialise socket connection
	socket = io.connect("http://127.0.0.1:8000", {port: 8000, transports: ["websocket"]});

	//event handler
	socket.on("checkIDReturn", onCheckIDReturn);

	//add new member to team Memberlist
	socket.on("memberAdd",onMemberAdd);
	role = "nobody";

}

function init() {

	// Declare the canvas and rendering context
	canvas = document.getElementById("gameCanvas");
	ctx = canvas.getContext("2d");

	//Calculate width per block
	uiScaling();

	// Initialise keyboard controls
	keys = new Keys();

	// Calculate a random start position for the local player
	// The minus 5 (half a player size) stops the player being
	// placed right on the edge of the screen
	var startX = Math.round(Math.random()*(canvas.width-5)),
		startY = Math.round(Math.random()*(canvas.height-5));

	// Initialise the local player
	localPlayer = new Player(startX, startY);
	//localPlayer.


	// Initialise remote players array
	remotePlayers = [];

	// Start listening for events
	setEventHandlers();
};

function checkTeamID(){

	var name=document.getElementById("name").value;
	var teamId=document.getElementById("team_id").value;
	localName = name;
	localTeamId = teamId;

	if(isNaN(teamId) || teamId.replace(/^\s+|\s+$/g, '').length != 5)
		document.getElementById('inform').innerHTML = 'Team ID is a 5-digit number';
	else if (name.replace(/^\s+|\s+$/g, '').length != 0)
		socket.emit("checkTeamID", {teamId:localTeamId, name:localName});
	else
        document.getElementById('inform').innerHTML = 'Name cannot be empty';
}

function onCheckIDReturn(data){

	if(data.exist==false){
		showLeaderPage();
	}else if(data.numOfTeammate<6){
		showMemberPage();
	}else{		
		document.getElementById('inform').innerHTML = 'The team has been full';
		document.getElementById("team_id").value = Math.floor(Math.random() * (99999 - 10000 + 1)) + 10000;
	}
}


/*******************************************/
// on click function of joinbutton
function gameStart(){

	if(role=="Leader") leaderStart();
	if(role=="Member") memberStart();//do nothing;

}

/********************Leader Event*********************/

function showLeaderPage(){
	role = "Leader";
	document.getElementById('welcome').style.display = "none";

	socket.emit("getMemberList", {name:localName, teamId:localTeamId});
	//sent create Room message and leader name to server;
	//then the server will let events which relate to "Being A Leader" on.

	document.getElementById('joinTeam').style.display = "block";
}

function onMemberAdd(data){

	//do something show the teammate name;
	var x = document.createElement("LI");
    var t = document.createTextNode(data.name);
    x.appendChild(t);
    document.getElementById("teamMemberList").appendChild(x);
    //TODO
}

function onMemberDelete(){

//do something delete the teammate name;

}

function leaderStart(){
	
	socket.emit("teamStart", {teamId:localTeamId});//let server know the team is going to depart;
	document.getElementById('joinTeam').style.display = "none";
	init();
	socket.emit("new player", {x: localPlayer.getX(), y: localPlayer.getY(), name: localName, teamId:localTeamId});
	console.log("localTeamId: "+localTeamId);
	animate();		
}

/*******************member event**********************/

function memberStart(){
//do nothing
}

function showMemberPage(){
	role = "Member";
	document.getElementById('welcome').hide();
	socket.emit("showMemberList", {name:localName});//sent the server "I am one of the member";
	// then the server may sent kick or depart event;
}

function onKickedByLeader(){
	document.getElementById('welcome').display();
}


function onDepartNotice(){
	init();
	animate();
}

/***********************endOfNewFunction*******************/

function uiScaling() {
	// Maximise the canvas
	if(document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
	else if(document.documentElement.msRequestFullscreen) document.documentElement.msRequestFullscreen();
	else if(document.documentElement.mozRequestFullScreen) document.documentElement.mozRequestFullScreen();
	else if(document.documentElement.webkitRequestFullscreen) document.documentElement.webkitRequestFullscreen();

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
		playerSize = 5;
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
	
	// Player push message received
	socket.on("push", pushHint);

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
	e.preventDefault();	
	if(e.type == "touchstart" ){
		if(e.touches.length != 1) return;
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
	uiScaling();
};

// Socket connected
function onSocketConnected() {
	console.log("Connected to socket server");

	// Send local player data to the game server
	//socket.emit("new player", {x: localPlayer.getX(), y: localPlayer.getY(), name: localName, teamId:localTeamId});
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
	var placeholderName = "penis";
	var newPlayer = new Player(data.x, data.y, placeholderName, data.teamId);
	console.log("id" + localTeamId + " " + data.teamId);
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

// Player pushing
function pushHint(data) {
	var pushPlayer = playerById(data.id);

	// Player not found
	if (!pushPlayer) {
		console.log("Player not found: "+data.id);
		return;
	};

	// Update player flag
	pushPlayer.rippleFlag = true;
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
	
	var originColor = ctx.fillStyle;
	var originColor2 = ctx.strokeStyle;


	// Draw the remote players

	var i;
	var colorOtherBorder = 'grey'; var colorOtherFill = 'grey';
	var colorTeamFill = '#99ddff'; var colorTeamBorder = '#99ddff';
	for (i = 0; i < remotePlayers.length; i++) {
		if (remotePlayers[i].getTeamId() == localTeamId)
		{
			colorFill = colorTeamFill;
			colorBorder = colorTeamBorder;
		}
		else
		{
			colorFill = colorOtherFill;
			colorBorder = colorOtherBorder;
		}
		drawPlayer(remotePlayers[i], colorFill, colorBorder);
	};

	// Draw the local player
	var colorSelfFill = '#66ff66'; var colorSelfBorder = '#66ff66';
	drawPlayer(localPlayer, colorSelfFill, colorSelfBorder);

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
				//drawBlock(i, r, false);
				drawCircle(i, r);					
			}
			// Goal
			else if (blockId == 999){
				ctx.fillStyle = findStyle(blockId);
				drawBlock(i, r, false);
			}
			else if (blockId == 1 || blockId == 600){
				ctx.fillStyle = findStyle(blockId);
				drawBlock(i, r, true);
			}
			//400 back to last, 500 back to origin
			else if (blockId ==  400 || blockId ==500){
				ctx.fillStyle = findStyle(blockId);
				drawBlock(i, r, false);			
			}
			
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
		ctx.fillStyle = 'black';
		ctx.lineWidth=1;
		ctx.rect(r*blockWidth+paddingX, i*blockWidth+paddingY, blockWidth, blockWidth);
		ctx.stroke();
	}

}

function drawCross(i, r)
{
	ctx.fillStyle = 'black';
	ctx.lineWidth=3*scale;
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
	if(blockId==1)
		return true;
	if(blockId>=100 && blockId<=109)
	{
		if(!isDoorOpen(blockId))
			return true;
	}
	if(blockId==600)
		return false;
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
	localPlayer.rippleFlag = true;

	var blockId = checkOnButton(x, y, map);
	if(blockId != -1)
	{
		socket.emit("door open", {id: blockId-100});
	}
}