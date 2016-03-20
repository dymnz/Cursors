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
	mapCount = 24,
	test = 0;
var doorTimeOut;


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
	util.log("New player has connected: "+client.id);
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


	client.emit("connect");
};

// Socket client has disconnected
function onClientDisconnect() {
	util.log("Player has disconnected: "+this.id);

	var removePlayer = playerById(this.id);

	// Player not found
	if (!removePlayer) {
		util.log("Player not found: "+this.id);
		return;
	};

	// Remove player from players array
	var i = removePlayer.getRoomIndex(),
		j = removePlayer.getMapIndex();
	players[i][j].splice(players[i][j].indexOf(removePlayer), 1);
	removePlayerFromList(removePlayer.id);

	// Broadcast removed player to connected socket clients
	//this.broadcast.emit("remove player", {id: this.id});
	broadcasting(removePlayer, "remove player", {id: this.id});
};

// New player has joined
function onNewPlayer(data) {
	// Create a new player
	util.log("New player " + this.id);

	var newPlayer = new Player(data.x, data.y);
	newPlayer.id = this.id;
	newPlayer.setSocket(this);

	var pair = [this.id, newPlayer];
	playerList.push(pair);

	//set Room and map
	roomBalancing(newPlayer);
	newPlayer.setMapIndex(test);

	// Broadcast new player to connected socket clients
	//this.broadcast.emit("new player", {id: newPlayer.id, x: newPlayer.getX(), y: newPlayer.getY()});
	broadcasting(newPlayer, "new player", {id: newPlayer.id, x: newPlayer.getX(), y: newPlayer.getY()});

	// Send existing players to the new player
	var i, existingPlayer,
		j = newPlayer.getRoomIndex(),
		k = newPlayer.getMapIndex();
	for (i = 0; i < players[j][k].length; i++) {
		existingPlayer = players[j][k][i];
		this.emit("new player", {id: existingPlayer.id, x: existingPlayer.getX(), y: existingPlayer.getY()});
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

	if(mapIndex < mapCount - 1){
		//go to the next map
		mapIndex++;
		this.emit("map change", {map: mapIndex});

		var i = onGoalPlayer.getRoomIndex(),
			j = onGoalPlayer.getMapIndex();
		players[i][j].splice(players[i][j].indexOf(onGoalPlayer), 1);

		onGoalPlayer.setMapIndex(mapIndex);

		//send all players in this map
		sendExistingPlayers(onGoalPlayer);

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
	if(mapIndex > 0){
		//go to the previous map
		mapIndex--;
		this.emit("map change", {map: mapIndex});

		//remove the player from current map
		var i = backPlayer.getRoomIndex(),
			j = backPlayer.getMapIndex();
		players[i][j].splice(players[i][j].indexOf(backPlayer), 1);

		backPlayer.setMapIndex(mapIndex);

		//send all players in this map
		sendExistingPlayers(backPlayer);

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

	//get doorId
	var doorId = data.id;
	
	braodcastAll(currentPlayer, "door open", {id: doorId});

	clearDoorTimeOut(doorId);
	var timeOut = setTimeout(function(cmd, data) {
  		braodcastAll(currentPlayer, "door close", {id: doorId});
  		clearDoorTimeOut(doorId);
	}, 10000, "door close", doorId);
	doorTimeOut.push([doorId, timeOut]);

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

function braodcastAll(currentPlayer, cmd, msg){
	var i = currentPlayer.getRoomIndex(),
		j = currentPlayer.getMapIndex();

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

function clearDoorTimeOut(id){
	for (i = 0; i < doorTimeOut.length; i++) {
		if (doorTimeOut[i][0] == id && doorTimeOut[i][1] != null){
			clearTimeout(doorTimeOut[i][1]);
			doorTimeOut.splice(i, 1);
		}
	};
}

function showServerPlayerCount(){
	util.log("Server Player Count: " + playerList.length + 1);
}

/**************************************************
** RUN THE GAME
**************************************************/
init();
