/**************************************************
** GAME PLAYER CLASS
**************************************************/
var Player = function(startX, startY, pname) {
	var x = startX,
		y = startY,
		id,
		name = pname,
		roomIndex,
		mapIndex,
		socket;

	// Getters and setters
	var getX = function() {
		return x;
	};

	var getY = function() {
		return y;
	};

	var setX = function(newX) {
		x = newX;
	};

	var setY = function(newY) {
		y = newY;
	};

	var setRoomIndex = function(newIndex){
		roomIndex = newIndex;
	};

	var setMapIndex = function(newIndex){
		mapIndex = newIndex;
	};

	var getRoomIndex = function(){
		return roomIndex;
	};

	var getMapIndex = function(){
		return mapIndex;
	};

	var setSocket = function(newSocket){
		socket = newSocket;
	};

	var getSocket = function(){
		return socket;
	};

	// Define which variables and methods can be accessed
	return {
		getX: getX,
		getY: getY,
		setX: setX,
		setY: setY,
		id: id,
		setRoomIndex: setRoomIndex,
		setMapIndex: setMapIndex,
		getRoomIndex: getRoomIndex,
		getMapIndex: getMapIndex,
		setSocket: setSocket,
		getSocket: getSocket,
		name: name
	}
};

// Export the Player class so you can use it in
// other files by using require("Player").Player
exports.Player = Player;