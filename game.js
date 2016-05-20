/**************************************************
** NODE.JS REQUIREMENTS
**************************************************/
var util = require("util"),					// Utility resources (logging, object inspection, etc)
	io = require("socket.io")({
		"transports": ["websocket"]
	}),				// Socket.IO
	Player = require("./Player").Player;	// Player class

/**************************************************
** GAME VARIABLES
**************************************************/
var socket,		// Socket controller
	players,	// Array of connected players
	playerList;	// Array of ID-player pairs

var roomCount = 1,
	mapCount = 22,
	test = 0;
var mapNum = [];

var doorTimeOut;

var doors = [];

/**************************************************
** GAME INITIALISATION
**************************************************/
function init() {

	// Create an empty array to store players
	players = [];
	for(var i = 0;i < roomCount;i++){
		players[i] = [];
		for(var j = 0;j < mapCount;j++)
			players[i][j] = [];
	}

	for(var i = 0;i < mapCount;i++){
		mapNum[i] = 0;
	}

	playerList = [];
	doorTimeOut = [];

	// Set up Socket.IO to listen on port 8000
	socket = io.listen(8000);


	// Start listening for events
	setEventHandlers();
};


/**************************************************
** GAME EVENT HANDLERS
**************************************************/
var setEventHandlers = function() {
	// Socket.IO
	socket.sockets.on("connection", onSocketConnection);
};

// New socket connection
function onSocketConnection(client) {
	var ipAddr = client.request.connection.remoteAddress;

	util.log("New player has connected: "+ client.id);
	util.log("Connection from " + ipAddr);

	showServerPlayerCount();

	// Assign initial map for new player
	client.emit("map change", {map: test} );

	// Listen for client disconnected
	client.on("disconnect", onClientDisconnect);

	// Listen for new player message
	client.on("new player", onNewPlayer);


	// Listen for move player message
	client.on("move player", onMovePlayer);

	// Listen for "on goal" message
	client.on("on goal", onGoal);

	//Listen for "back To Last" message
	client.on("back to last", backToLast);

	//Listen for "door open" message
	client.on("door open", doorOpen);

	//Push hint
	client.on("push", pushHint);
	
	client.on("getInit", sendInit);

	client.on("change map to", onChangeMapTo);

	client.on("change room to", onChangeRoomTo);

	client.on("get server info", onGetServerInfo);	

	client.emit("connect");

};

// Socket client has disconnected
function onClientDisconnect() {
	util.log("Player has disconnected: " + this.id + " Name: " + playerById(this.id).name);

	var removePlayer = playerById(this.id);

	// Player not found
	if (!removePlayer) {
		util.log("Player not found: "+this.id);
		return;
	};

	// Remove player from players array
	var i = removePlayer.getRoomIndex(),
		j = removePlayer.getMapIndex();
	mapNum[j]--;
	players[i][j].splice(players[i][j].indexOf(removePlayer), 1);
	removePlayerFromList(removePlayer.id);

	// Broadcast removed player to connected socket clients
	//this.broadcast.emit("remove player", {id: this.id});
	broadcasting(removePlayer, "remove player", {id: this.id});
};

// New player has joined
function onNewPlayer(data) {
	// Create a new player
	util.log("New player " + this.id + " Name: " + data.name + " team id: " + data.teamId);

	var newPlayer = new Player(data.x, data.y, data.name, data.teamId);
	newPlayer.id = this.id;
	newPlayer.setSocket(this);

	var pair = [this.id, newPlayer];
	playerList.push(pair);

	//set Room and map
	roomBalancing(newPlayer);
	newPlayer.setMapIndex(test);
	mapNum[test]++;


	// Broadcast new player to connected socket clients
	//this.broadcast.emit("new player", {id: newPlayer.id, x: newPlayer.getX(), y: newPlayer.getY()});
	broadcasting(newPlayer, "new player", {id: newPlayer.id, x: newPlayer.getX(), y: newPlayer.getY(), teamId: newPlayer.getTeamId()});

	// Send existing players to the new player
	var i, existingPlayer,
		j = newPlayer.getRoomIndex(),
		k = newPlayer.getMapIndex();
	for (i = 0; i < players[j][k].length; i++) {
		existingPlayer = players[j][k][i];
		this.emit("new player", {id: existingPlayer.id, x: existingPlayer.getX(), y: existingPlayer.getY(),teamId: existingPlayer.getTeamId()});
	};
		
	// Add new player to the players array
	players[newPlayer.getRoomIndex()][newPlayer.getMapIndex()].push(newPlayer);
};

// Player has moved
function onMovePlayer(data) {
	// Find player in array
	var movePlayer = playerById(this.id);

	// Player not found
	if (!movePlayer) {
		util.log("Player not found: "+this.id);
		return;
	};

	// Update player position
	movePlayer.setX(data.x);
	movePlayer.setY(data.y);

	// Broadcast updated position to connected socket clients
	//this.broadcast.emit("move player", {id: movePlayer.id, x: movePlayer.getX(), y: movePlayer.getY()});
	broadcasting(movePlayer, "move player", {id: movePlayer.id, x: movePlayer.getX(), y: movePlayer.getY()});
};

//Player is on the goal
function onGoal(){
	// Find player in array
	var onGoalPlayer = playerById(this.id);

	//Player not found
	if(!onGoalPlayer){
		util.log("Player not found: " + this.id);
		return;
	};

	//notify everyone who should be removed
	broadcasting(onGoalPlayer, "remove player", {id: this.id});

	var mapIndex = onGoalPlayer.getMapIndex();

	mapNum[mapIndex]--;

	if(mapIndex < mapCount - 1){
		//go to the next map
		mapIndex++;
		mapNum[mapIndex]++;

		this.emit("map change", {map: mapIndex});

		var i = onGoalPlayer.getRoomIndex(),
			j = onGoalPlayer.getMapIndex();
		players[i][j].splice(players[i][j].indexOf(onGoalPlayer), 1);

		onGoalPlayer.setMapIndex(mapIndex);

		//send all players in this map
		sendExistingPlayers(onGoalPlayer);

		//send door Info in this map
		sendDoorInfo(onGoalPlayer);

		//send this player to other players
		broadcasting(onGoalPlayer, "new player", {id: onGoalPlayer.id, x: onGoalPlayer.getX(), y: onGoalPlayer.getY()});

		//push this player in the players
		players[i][mapIndex].push(onGoalPlayer);

	//if has reached the last map
	}else if(mapIndex === mapCount - 1){
		// add "successful"
		this.emit("map change", {map: mapIndex});
	}

	util.log("Player " + this.id + " is at Map:" + mapIndex);
}

//Player gets back to the last map
function backToLast(){
	// Find player in array
	var backPlayer = playerById(this.id);

	//Player not found
	if(!backPlayer){
		util.log("Player not found: " + this.id);
		return;
	};

	broadcasting(backPlayer, "remove player", {id: this.id});

	var mapIndex = backPlayer.getMapIndex();

	mapNum[mapIndex]--;

	if(mapIndex > 0){
		//go to the previous map
		mapIndex--;
		mapNum[mapIndex]++;

		this.emit("map change", {map: mapIndex});

		//remove the player from current map
		var i = backPlayer.getRoomIndex(),
			j = backPlayer.getMapIndex();
		players[i][j].splice(players[i][j].indexOf(backPlayer), 1);

		backPlayer.setMapIndex(mapIndex);

		//send all players in this map
		sendExistingPlayers(backPlayer);

		//send door Info in this map
		sendDoorInfo(backPlayer);

		//send this player to other players
		broadcasting(backPlayer, "new player", {id: backPlayer.id, x: backPlayer.getX(), y: backPlayer.getY()});

		//push this player in the players
		players[i][mapIndex].push(backPlayer);

	//if has reached the first map
	}else if(mapIndex === 0){
		// add "failed"
		this.emit("map change", {map: mapIndex});
	}

	util.log("Player " + this.id + " is at Map:" + mapIndex);
}


//handle the "door open" event
function doorOpen(data){


	var currentPlayer = playerById(this.id);
	var mapIndex = currentPlayer.getMapIndex(),
		roomIndex = currentPlayer.getRoomIndex();
	//get doorId
	var doorId = data.id;

	clearDoorTimeOut(doorId, roomIndex, mapIndex);
	
	broadcastAll(roomIndex, mapIndex, "door open", {id: doorId});

	var timeOut = setTimeout(function(cmd, data, roomIndex, mapIndex) {
  		broadcastAll(roomIndex, mapIndex, cmd, {id: data});
  		clearDoorTimeOut(doorId, roomIndex, mapIndex);

	}, 3000, "door close", doorId, roomIndex, mapIndex);

	doorTimeOut.push([currentPlayer.getRoomIndex(), currentPlayer.getMapIndex(), doorId, timeOut]);

}

//handle the "push" event
function pushHint(){
	// Find player in array
	var pushPlayer = playerById(this.id);

	// Player not found
	if (!pushPlayer) {
		util.log("Player not found: "+this.id);
		return;
	};
	broadcasting(pushPlayer, "push", {id: pushPlayer.id});

}

/**************************************************
** GAME HELPER FUNCTIONS
**************************************************/
// Find player by ID
function playerById(id) {
	var i;
	for (i = 0; i < playerList.length; i++) {
		if (playerList[i][0] == id)
			return playerList[i][1];
	};
	
	return false;
};

function removePlayerFromList(id){
	var i;
	for (i = 0; i < playerList.length; i++) {
		if (playerList[i][0] == id)
			playerList.splice(i, 1);
	};
}

function broadcasting(currentPlayer, cmd, msg){
	var i = currentPlayer.getRoomIndex(),
		j = currentPlayer.getMapIndex();

	for(var index = 0;index < players[i][j].length;index++){
		if(currentPlayer.id != players[i][j][index].id)
			players[i][j][index].getSocket().emit(cmd, msg);
	};
}

function broadcastAll(roomIndex, mapIndex, cmd, msg){
	var i = roomIndex,
		j = mapIndex;

	for(var index = 0;index < players[i][j].length;index++){
		players[i][j][index].getSocket().emit(cmd, msg);
	};
}

function sendExistingPlayers(newPlayer){
	var i, existingPlayer,
		j = newPlayer.getRoomIndex(),
		k = newPlayer.getMapIndex();
	for (i = 0; i < players[j][k].length; i++) {
		existingPlayer = players[j][k][i];
		newPlayer.getSocket().emit("new player", {id: existingPlayer.id, x: existingPlayer.getX(), y: existingPlayer.getY()});
	};
}

function roomBalancing(player){
	var minPlayer = 9007199254740991, minPlayerIndex = 0;
	var i;

	for(i = 0;i < players.length;i++){
		if(players[i][0].length < minPlayer){
			minPlayer = players[i][0].length;
			minPlayerIndex = i;
		}
		
	};
	player.setRoomIndex(minPlayerIndex);
}

function clearDoorTimeOut(id, roomIndex, mapIndex){
	for (var i = 0; i < doorTimeOut.length; i++) {
		if (doorTimeOut[i][0] == roomIndex && 
			doorTimeOut[i][1] == mapIndex &&
			doorTimeOut[i][2] == id &&
			doorTimeOut[i][3] != null){
			clearTimeout(doorTimeOut[i][3]);
			doorTimeOut.splice(i, 1);
			break;
		}
	};
}

function showServerPlayerCount(){
	util.log("Server Player Count: " + (playerList.length + 1));
}

function sendDoorInfo(onGoalPlayer){
	for(var i = 0;i < doorTimeOut.length;i++){
		if (doorTimeOut[i][0] == onGoalPlayer.getRoomIndex() && 
			doorTimeOut[i][1] == onGoalPlayer.getMapIndex())
		{
			onGoalPlayer.getSocket().emit("door open", {id: doorTimeOut[i][2]});	
		}
	};
}


/*CONSOLE*/
function sendInit() {
	var player = playerById(this.id);
	this.emit("sendInit", {map: player.getMapIndex(), room: player.getRoomIndex(), maxRoomIndex:roomCount});
}

function onChangeMapTo(data) {
	this.emit("map change", {map: data.map});
	var onGoalPlayer = playerById(this.id);
	
	var i = onGoalPlayer.getRoomIndex(),
			j = onGoalPlayer.getMapIndex();
		players[i][j].splice(players[i][j].indexOf(onGoalPlayer), 1);

	onGoalPlayer.setMapIndex(data.map);

	//Player not found
	if(!onGoalPlayer){
		util.log("Player not found: " + this.id);
		return;
	};
	//send all players in this map
	sendExistingPlayers(onGoalPlayer);

	//send door Info in this map
	sendDoorInfo(onGoalPlayer);

	//push this player in the players
	players[onGoalPlayer.getRoomIndex()][onGoalPlayer.getMapIndex()].push(onGoalPlayer);
	
}

function onChangeRoomTo(data) {
	
	var onGoalPlayer = playerById(this.id);
	this.emit("room change", {map: onGoalPlayer.getMapIndex(), room: data.room});
	var i = onGoalPlayer.getRoomIndex(),
			j = onGoalPlayer.getMapIndex();
		players[i][j].splice(players[i][j].indexOf(onGoalPlayer), 1);

	onGoalPlayer.setRoomIndex(data.room);

	//Player not found
	if(!onGoalPlayer){
		util.log("Player not found: " + this.id);
		return;
	};
	//send all players in this map
	sendExistingPlayers(onGoalPlayer);

	//send door Info in this map
	sendDoorInfo(onGoalPlayer);

	//push this player in the players
	players[onGoalPlayer.getRoomIndex()][onGoalPlayer.getMapIndex()].push(onGoalPlayer);

}

/*special console*/
function onGetServerInfo()
{
	this.emit("map info", JSON.stringify(mapNum));
}

/**************************************************
** RUN THE GAME
**************************************************/
init();



