var teamIDList = [];

module.exports = {
	teamInit: function(){
		for(var i = 0;i < 100000;i++){
			teamIDList[i] = [];

			teamIDList[i][0] = false;	//Has Id been used
			teamIDList[i][1] = 0;		//number of team member
			teamIDList[i][2] = [];		//names of members
		}
	},

	setTeamEventHandler: function(){
		//check whether team id is on the list
		client.on("checkTeamID", onCheckTeamID);

		client.on("getMemberList", onGetMemberList);

		client.on("memberDisconnect", onMemberDisconnect);
		
	}

};


function onCheckTeamID(data){
	var id = data.teamId;
	if(teamIDList[id][0]){
		this.emit("checkIDReturn", {exist:true, numOfTeammate:teamIDList[id][1]});
		if(teamIDList[id][1] < 6){
				teamIDList[id][1]++;
				teamIDList[id][2].push(data.name);
		}

	}else{
		teamIDList[id][0] = true;
		teamIDList[id][1] = 1;
		teamIDList[id][2].push(data.name);
		this.emit("checkIDReturn", {exist:false, numOfTeammate:1});
	}
}

function onGetMemberList(data){
	var id = data.teamId;
}

function onMemberDisconnect(data){

}