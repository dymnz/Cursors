var util = require("util"),					// Utility resources (logging, object inspection, etc)
	io = require("socket.io")({
		"transports": ["websocket"]
	});				// Socket.IO


var teamIDList = [];
var idPair;
var socket; //socket handler


function init(){
	for(var i = 0;i < 100000;i++){
		teamIDList[i] = [];

		teamIDList[i][0] = false;	//Has the team Id been used
		teamIDList[i][1] = 0;		//number of team member
		teamIDList[i][2] = [];		//names of members
		teamIDList[i][3] = [];		//sockets of members
		teamIDList[i][4] = false; 	//the team has already started
	}

	idPair = [];

	socket = io.listen(8001);

	setEventHandlers();

}

var setEventHandlers = function() {
	// Socket.IO
	socket.sockets.on("connection", setTeamEventHandler);
};

var setTeamEventHandler = function(client){

	var ipAddr = client.request.connection.remoteAddress;
	util.log("New player has connected: "+ client.id);
	util.log("Connection from " + ipAddr);

	//check whether team id is on the list
	client.on("checkTeamID", onCheckTeamID);

	client.on("getMemberList", onGetMemberList);

	client.on("teamStart", onTeamStart);

	// Listen for client disconnected
	client.on("disconnect", onMemberDisconnect);

	client.emit("connect");
	
}


function onCheckTeamID(data){
	var id = data.teamId;
	if(id != undefined && teamIDList[id][0]){
		this.emit("checkIDReturn", {exist:true, numOfTeammate:teamIDList[id][1]});
		if(teamIDList[id][1] < 6){
				teamIDList[id][1]++;
				teamIDList[id][2].push(data.name);
				teamIDList[id][3].push(this);
				idPair.push([this.id, id]);
				sendMemberAddinfo(id, this.id);
		}

	}else if(id != undefined){
		teamIDList[id][0] = true;
		teamIDList[id][1] = 1;
		teamIDList[id][2].push(data.name);
		teamIDList[id][3].push(this);
		idPair.push([this.id, id]);
		sendMemberAddinfo(id, this.id);

		this.emit("checkIDReturn", {exist:false, numOfTeammate:1});
	}
	util.log("Name: " + teamIDList[id][2][teamIDList[id][2].length-1]);
}

function onGetMemberList(data){
	var id = data.teamId;
	if(id != undefined){
		this.emit("memberList",JSON.stringify(teamIDList[id][2]));
		if(teamIDList[id][4] == true)
			this.emit("gameStart");
	}
}

function onMemberDisconnect(){
	var index = -1;
	var tid;
	for(var i = 0;i < idPair.length;i++){
		if(idPair[i][0] == this.id){
			index = i;
			break;
		}
	}

	if(index != -1){
		tid = idPair[index][1];
		idPair.splice(index, 1);

		if(index == 0 && teamIDList[tid][3][1] != undefined){
			//Leader has left
			//The second one will be the leader
			teamIDList[tid][3][1].emit("changeRole");
		}

		teamIDList[tid][1]--;

		if(teamIDList[tid][1] == 0){
			teamIDList[tid][0] = false;
		}

		for(var i = 0;i < teamIDList[tid][3].length;i++){
			
			if(teamIDList[tid][3][i].id == this.id){
				teamIDList[tid][2].splice(i, 1);
				teamIDList[tid][3].splice(i, 1);
				break;
			}
			else 
				console.log("asdasd");
		}

		for(var i = 0;i < teamIDList[tid][3].length;i++){
			if(teamIDList[tid][3][i].id != this.id){
				teamIDList[tid][3][i].emit("memberDisconnect");
			}
		}

		util.log("Player has disconnected: " + this.id + " Team: " + tid);
	}
}

function onTeamStart(data) {
	var id = data.teamId;
	if(id != undefined && teamIDList[id][0]){
		for(var i = 0;i < teamIDList[id][3].length;i++){
			teamIDList[id][3][i].emit("gameStart");
		}
		teamIDList[id][4] = true;
	}
}

function sendMemberAddinfo(tid, id){
	for(var i = 0;i < teamIDList[tid][3].length;i++){
		if(teamIDList[tid][3][i] != id){
			teamIDList[tid][3][i].emit("memberAdd");
		}
	}
}

init();