/**************************************************
** GAME KEYBOARD CLASS
**************************************************/
var Keys = function(up, left, right, down) {
	var up = up || false,
		left = left || false,
		right = right || false,
		down = down || false;
		
	var onKeyDown = function(e) {
		var that = this,
			c = e.keyCode;
		switch (c) {
			// Controls
			case 37: // Left
				that.left = true;
				break;
			case 38: // Up
				that.up = true;
				break;
			case 39: // Right
				that.right = true; // Will take priority over the left key
				break;
			case 40: // Down
				that.down = true;
				break;
		};
	};
	
	var onKeyUp = function(e) {
		var that = this,
			c = e.keyCode;
		switch (c) {
			case 37: // Left
				that.left = false;
				break;
			case 38: // Up
				that.up = false;
				break;
			case 39: // Right
				that.right = false;
				break;
			case 40: // Down
				that.down = false;
				break;
		};
	};

	return {
		up: up,
		left: left,
		right: right,
		down: down,
		onKeyDown: onKeyDown,
		onKeyUp: onKeyUp
	};
};

var strVar=function(){/*
                             
                                      Thesearem                                         
                                  yballs,soshiny,so                                     
                              clean.Manyhavewonderedwh                                  
                      eremyballshaveb           eeen.The                                
                   ballstheyhadn                  utted,t                               
                 hesightstheyhad                   seen.A                               
                 dmiremyballswhil                   ethey                               
                 workasateam .These    aremyballs,  ithin                               
                 kyou'llenjoythem.Th ey'resocleancut that                               
                 you'llwanttoemplo  ythem.Ifyouhadanarmyy                               
                oucou  ldnotdestro  ythem.Yesthayaremybal                               
               lsonlyicandeploythem .Somecallth emtestes,                               
              andotherscojones.If   Ihadthemoney,I'dbuild                               
             thembothhomes.Orteachthemtojuggleand  answe                                
            rthep          hones.Whensweaty,m     yballs                                
           acksm                      ellsswe     et,lik                                
          ecolog                                 ne.Yes                                 
         thesea                                 remyba                                  
        lls,an                                  dtheya                                  
        rethe                      best        .Iwish                                   
        igre                      wtest icl   eskino                                     
        nmyc                      hest.Theba  ll-ha                         irsished,   
       iknit                      intovests  .Sole                        tsallridemyt  
       estes                     ,together. ..out                       west.T    hese  
       aremy                     balls,sos  hiny,                     soclean    .Many  
       havew                    onderedwh  eremyb                   allshav     ebeee   
       n.The                    ballsthe   yhadnutted,thesights   theyhad     seen.     
        Admi                   remyball    swhiletheyworkasateam.Thesea      remyb      
        alls                   ,ithink     you'l   lenjo   ythem.They      'resoc       
        lean                  cutthaty      ou'   llwanttoemploythe      m.Ifyo         
        uhada               narmy youco         uldnotdestroythem.     Yesthay          
         arem             yball  sonlyic         andeploythem.Someca   llthemte         
         stes,            andotherscojon                     es.IfIha    dthemoney      
          ,I'db            uildthemboth              home       s.Orte  acht hemto      
          juggle              anda                   nswe        rtheph  ones.Whe       
           nsweat                                y,m              yball    sack         
            smellssw                            eet,              likec     olog        
               ne.Yest                          hese              aremyballs,and        
     the        yarethebes                       t.Iw           ishigrewtesticl         
    eskinon    mychest.Theball-h                  air         sished,    i              
    knitintovests. Soletsallridemytestes           ,tog    ether..                      
    .out west.Thesearem    yballs,soshiny, soclean.Manyhavewonde                        
     redw  heremyball         shavebeeen. Theballstheyhadnutt                           
      ed,t   hesigh         tstheyhadsee n.Adm iremyballsw                              
       hiletheywo           rkasateam.T  hese                                           
        aremyba              lls,ithi   nkyo                                            
          u'l                lenjoy    them                                             
                              .They'  reso                                              
                               cleancutth                                               
                                 atyou'l                                                
                                   lwa                                                  
*/}.toString().slice(14,-3)


