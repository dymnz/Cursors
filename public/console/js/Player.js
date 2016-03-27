/**************************************************
** GAME PLAYER CLASS
**************************************************/
var Player = function(startX, startY, pname, tid) {
	var 	x = startX,
		y = startY,
		id,
		name = pname,
		teamId = tid,
		moveAmount = 1,
		map=-1,
		room=-1,
		playerSize,
		oriX, oriY,
		alreadyOnGoal = false;
	
	// Getters and setters

	var getRoom = function() {
		return room;
	}

	var getX = function() {
		return x;
	};

	var getY = function() {
		return y;
	};
	var getOriX = function() {
		return oriX;
	};

	var getOriY = function() {
		return oriY;
	};
	var getMap = function(){
		return map;
	}
	var getAlreadyOnGoal = function () {
		return alreadyOnGoal;
	}

	var setX = function(newX) {
		x = newX;
	};

	var setY = function(newY) {
		y = newY;
	};
	var setOriX = function(newX) {
		oriX = newX;
	};

	var setOriY = function(newY) {
		oriY = newY;
	};
	var setRoom = function(newRoom) {
		room = newRoom;
	}

	var setMap  = function(newMap) {
		map = newMap;
	}
	var setAlreadyOnGoal = function (stat) {
		alreadyOnGoal = stat;
	}

	var nextMap = function () {
		if(map+1<maxMapIndex)
			map++;
	}
	var lastMap = function () {
		if(map-1>=0)
			map--;
	}
	var nextRoom = function () {
		if(room+1<maxRoomIndex)
			room++;
	}
	var lastRoom = function () {
		if(room-1>=0)
			room--;
	}

	// Update player position
	var update = function(keys, vX, vY) {
		// Previous position
		var prevX = x,
			prevY = y;

		// Up key takes priority over down
		if (keys.up) {
			if ((y-moveAmount>=0) && !isCollision(x, y-moveAmount, map))
				y -= moveAmount;
		} else if (keys.down) {
			if ((y+moveAmount<=pixelPerBlock*mapHeight) && !isCollision(x, y+moveAmount, map))
				y += moveAmount;
		};

		// Left key takes priority over right
		if (keys.left) {
			if ((x-moveAmount>=0) && !isCollision(x-moveAmount, y, map))
				x -= moveAmount;
		} else if (keys.right) {
			if ((x+moveAmount<=pixelPerBlock*mapWidth) && !isCollision(x+moveAmount, y, map))
				x += moveAmount;
		};

		if ( ((y+vY>0) && (y+vY<pixelPerBlock*mapHeight) && !isCollision(x, y+vY, map)) )
			y += vY;
		else{
			if(vY<0)
			{
				while(vY<0)
				{
					vY++;
					if((y+vY>0) && (y+vY<pixelPerBlock*mapHeight) && !isCollision(x, y+(vY), map))
					{
						y+=vY;
						break;
					}				
				}

			}
			else if(vY>0)
			{
				while(vY>0)
				{
					vY--;
					if((y+vY>0) && (y+vY<pixelPerBlock*mapHeight )&& !isCollision(x, y+(vY), map))
					{
						y+=vY;
						break;
					}					
				}
	
			}
		}
		if ((x+vX>0) && (x+vX<pixelPerBlock*mapWidth) && !isCollision(x+vX, y, map)) 
			x += vX;
		else {
			if(vX<0)
			{
				while(vX<0){
					vX++;
					if((x+vX>0) && (x+vX<pixelPerBlock*mapWidth)&&!isCollision(x+(vX), y, map))
					{
						x+=vX;
						break;
					}					
				}

			}
			else if(vX>0)
			{
				while(vX>0){
					vX--;
					if((x+vX>0) && (x+vX<pixelPerBlock*mapWidth)&&!isCollision(x+(vX), y, map))
					{
						x+=vX;
						break;
					}					
				}

			}
		}

		return (prevX != x || prevY != y) ? true : false;
		
	};

	// Draw player
	var draw = function(ctx) {
		ctx.fillStyle = 'red';
		ctx.fillRect(x-5, y-5, 10, 10);
	};

	// Define which variables and methods can be accessed
	return {
		getX: getX,
		getY: getY,
		getOriX: getOriX,
		getOriY: getOriY,
		getMap: getMap,
		getAlreadyOnGoal: getAlreadyOnGoal,
		setX: setX,
		setY: setY,
		setRoom: setRoom,
		getRoom: getRoom,
		setOriX: setOriX,
		setOriY: setOriY,
		setMap: setMap,
		setAlreadyOnGoal: setAlreadyOnGoal,
		update: update,
		draw: draw,
		nextMap: nextMap,
		lastMap: lastMap,
		nextRoom: nextRoom,
		lastRoom: lastRoom,
		name: name
	}
};