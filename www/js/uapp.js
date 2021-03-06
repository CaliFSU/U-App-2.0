var json;
var jsonlabels;
var statusindex = 0;
var channeloverride;
var cvarupdateindex;
var editcontrollerid;
var seriesOptions;
var chart;
var names;
var memoryraw="";
var MemString;
var MemURL;
var memindex;
var mqtt;
var cloudusername;
var cloudpassword;
var dropdownscope;
var parametersscope;
var settingsscope;
var relayscope;
var currentstorage;
var ourtimer;
var currenttimeout;
var updatestring;
var internalmemoryrootscope
var internalmemoryscope;
var localserver;



var rfmodes = ["Constant","Lagoon","Reef Crest","Short Pulse","Long Pulse","Nutrient Transport","Tidal Swell","Feeding","Feeding","Night","Storm","Custom","Else"];
var rfimages= ["constant.png","lagoon.png","reefcrest.png","shortpulse.png","longpulse.png","ntm.png","tsm.png","feeding.png","feeding.png","night.png","storm.png","custom.png","custom.png"];
var rfmodecolors = ["#00682e","#ffee00","#ffee00","#16365e","#d99593","#eb70ff","#eb70ff","#000000","#000000","#000000","#000000","#000000","#000000"];
var dimmingchannels = ["Daylight Channel","Actinic Channel","Dimming Channel 0","Dimming Channel 1","Dimming Channel 2","Dimming Channel 3","Dimming Channel 4","Dimming Channel 5","AI White Channel","AI Royal Blue Channel","AI Blue Channel","Radion White Channel","Radion Royal Blue Channel","Radion Red Channel","Radion Green Channel","Radion Blue Channel","Radion Intensity Channel","Daylight 2 Channel","Actinic 2 Channel"];
var customvars = ["Custom Var 0","Custom Var 1","Custom Var 2","Custom Var 3","Custom Var 4","Custom Var 5","Custom Var 6","Custom Var 7"];
var pwmchannels = ["PWMD","PWMA","PWME0","PWME1","PWME2","PWME3","PWME4","PWME5","AIW","AIRB","AIB","RFW","RFRB","RFR","RFG","RFB","RFI","PWMD2","PWMA2"];

var app = ons.bootstrap('uapp',['ngStorage','ngAnimate']);

app.controller('DropdownController', function($rootScope, $scope, $http, $localStorage, $timeout){
    $scope.rfmodes = [{"name":"Constant","color":"#00682e","id":"0"},{"name":"Lagoon","color":"#ffee00","id":"1"},{"name":"Reef Crest","color":"#ffee00","id":"2"},{"name":"Short Pulse","color":"#16365e","id":"3"},{"name":"Long Pulse","color":"#d99593","id":"4"},{"name":"Nutrient Transport","color":"#eb70ff","id":"5"},{"name":"Tidal Swell","color":"#eb70ff","id":"6"},{"name":"Feeding","color":"#F5C127","id":"7"},{"name":"Night","color":"#90C3D4","id":"9"},{"name":"Storm","color":"black","id":"10"},{"name":"Custom","color":"#72BD4D","id":"11"}];
    $scope.dcmodes = [{"name":"Constant","color":"#00682e","id":"0"},{"name":"Lagoon","color":"#ffee00","id":"1"},{"name":"Reef Crest","color":"#ffee00","id":"2"},{"name":"Short Pulse","color":"#16365e","id":"3"},{"name":"Long Pulse","color":"#d99593","id":"4"},{"name":"Nutrient Transport","color":"#eb70ff","id":"5"},{"name":"Tidal Swell","color":"#eb70ff","id":"6"},{"name":"Feeding","color":"#F5C127","id":"7"},{"name":"Night","color":"#90C3D4","id":"9"},{"name":"Storm","color":"black","id":"10"},{"name":"Custom","color":"#72BD4D","id":"11"},{"name":"Else","color":"#B28DC4","id":"12"},{"name":"Sine","color":"#47ADAC","id":"13"},{"name":"Gyre","color":"#768C8C","id":"14"}];
	$scope.$storage = $localStorage;
	//$localStorage.controllers = null;
	dropdownscope=$scope;
	relayscope=$scope;
	localserver=window.location.href.indexOf("content.html")!=-1;
	loaddefaultvalues();
	loaddefaultlabels();
	if ($localStorage.controllers != null)
	{
		$scope.activecontroller=$localStorage.activecontroller;
		if ($localStorage.activecontroller==null)
			if ($localStorage.controllers.length>0)
			{
				$scope.activecontroller=$localStorage.controllers[0].name;
				$localStorage.activecontrollerid=0;
			}
		if ($localStorage.jsonlabels==null) $localStorage.jsonlabels=jsonlabels;
	}
	else
	{
		$localStorage.json=new Object();
		$localStorage.controllers=[];
		$localStorage.jsonarray=[];
		$localStorage.jsonlabelsarray=[];
		$scope.activecontroller=null;
		$localStorage.activecontroller=null;
		$localStorage.activecontrollerid=null;
	}
//	console.log("$localStorage.controllers: " + $localStorage.controllers);
//	console.log("$localStorage.jsonarray: " + $localStorage.jsonarray);
//	console.log("$localStorage.jsonlabelsarray: " + $localStorage.jsonlabelsarray);
//	console.log("$scope.activecontroller: " + $scope.activecontroller);
//	console.log("$localStorage.activecontrollerid: " + $localStorage.activecontrollerid);
	$scope.$on('msg', function(event, msg) {
		//console.log('DropdownController'+msg);
		if (msg=="popoverclose")
		{
			$scope.activecontroller=$localStorage.activecontroller;
			$scope.popover.hide();
		}
	});
	ons.createPopover('popover.html').then(function(popover) {
		$scope.popover = popover;
	});
	$scope.closealert=function(){
		alertDialog.hide();
	}
	$scope.syncdate=function(){
		var d=new Date();
		$scope.getcontrollerdata('d' + d.getHours().padLeft() + d.getMinutes().padLeft() + "," + (d.getMonth()+1).padLeft() + d.getDate().padLeft() + "," + (d.getYear()-100).toString());
	}
	$scope.getcontrollerdata=function(cmd){
		if ($localStorage.controllers.length==0 && !localserver) return;
		//console.log(cmd);
		if (mqtt!=null )
		{
			message=null;
			switch (cmd) {
				case "mf":
					if ((json.RA.SF & 1<<2)==1<<2)
						ons.notification.alert({message: 'Already in Water Change Mode', title: 'Reef Angel Controller' });
					else
						if ((json.RA.SF & 1<<1)==1<<1)
							ons.notification.alert({message: 'Already in Feeding Mode', title: 'Reef Angel Controller' });
						else
							message = new Paho.MQTT.Message("mf:1");
					break;
				case "mw":
					if ((json.RA.SF & 1<<1)==1<<1)
						ons.notification.alert({message: 'Already in Feeding Mode', title: 'Reef Angel Controller' });
					else
						if ((json.RA.SF & 1<<2)==1<<2)
							ons.notification.alert({message: 'Already in Water Change Mode', title: 'Reef Angel Controller' });
						else
							message = new Paho.MQTT.Message("mw:1");
					break;
				case "bp":
					if ((json.RA.SF & 1<<1)==0 && (json.RA.SF & 1<<2)==0)
						ons.notification.alert({message: 'Not in Feeding Mode nor Water Change Mode', title: 'Reef Angel Controller' });
					if ((json.RA.SF & 1<<1)==1<<1)
						message = new Paho.MQTT.Message("mf:0");
					if ((json.RA.SF & 1<<2)==1<<2)
						message = new Paho.MQTT.Message("mw:0");
					break;
				case "l0":
					if ((json.RA.SF & 1<<0)==0)
						ons.notification.alert({message: 'Lights on already cancelled', title: 'Reef Angel Controller' });
					else
						message = new Paho.MQTT.Message("l:0");
					break;
				case "l1":
					if ((json.RA.SF & 1<<0)==1<<0)
						ons.notification.alert({message: 'Already in Lights On', title: 'Reef Angel Controller' });
					else
						message = new Paho.MQTT.Message("l:1");
					break;
				case "mt":
					if ((json.RA.AF & 1<<0)==0)
						ons.notification.alert({message: 'No ATO Timeout flag', title: 'Reef Angel Controller' });
					else
						message = new Paho.MQTT.Message("mt:0");
					break;
				case "mo":
					if ((json.RA.AF & 1<<0)==0)
						ons.notification.alert({message: 'No Overheat flag', title: 'Reef Angel Controller' });
					else
						message = new Paho.MQTT.Message("mo:0");
					break;
				case "ml":
					if ((json.RA.AF & 1<<0)==0)
						ons.notification.alert({message: 'No Leak flag', title: 'Reef Angel Controller' });
					else
						message = new Paho.MQTT.Message("ml:0");
					break;
				case "boot":
					message = new Paho.MQTT.Message("boot:0");
					break;
				case "v":
					message = new Paho.MQTT.Message("v:0");
					break;
			}
			if (cmd.substring(0,1)=='d')
				message = new Paho.MQTT.Message("date:1:"+cmd.substring(1,13).split(",").join(""));
			if (cmd.substring(0,4)=='cvar')
			{
				message = new Paho.MQTT.Message(cmd.replace("cvar","cvar:").replace(",",":"));
				updatestring="C"+cmd.substring(4,5)+":";
			}
			if (cmd.substring(0,2)=='po')
			{
				message = new Paho.MQTT.Message(cmd.replace("po","po:").replace(",",":"));
				updatestring=pwmchannels[cmd.substring(2,cmd.indexOf(","))] + "O:";
			}
			if (cmd.substring(0,2)=='mb')
			{
				message = new Paho.MQTT.Message(cmd.replace("mb","mb:").replace(",",":"));
				if (cmd.substring(2,5)=='255')
					updatestring="RFM:";
				if (cmd.substring(2,5)=='256')
					updatestring="RFS:";
				if (cmd.substring(2,5)=='257')
					updatestring="RFD:";
				if (cmd.substring(2,5)=='337')
					updatestring="DCM:";
				if (cmd.substring(2,5)=='338')
					updatestring="DCS:";
				if (cmd.substring(2,5)=='339')
					updatestring="DCD:";
			}
			if (cmd.substring(0,1)=='r' && cmd != "r99")
			{
				message = new Paho.MQTT.Message(cmd.replace("r","r:"));
				if(cmd.substring(3,4)=='0')
					updatestring="ROFF";
				if(cmd.substring(3,4)=='1')
					updatestring="RON";
				if(cmd.substring(3,4)=='2')
					updatestring="RON";
				updatestring+=cmd.substring(1,2)+":";
			}
			if (cmd.substring(0,2)=='mr')
			{
				message = new Paho.MQTT.Message("mr:0");
				updatestring="MR21:";
			}
			if (message!=null)
			{
				modal.show();
				currenttimeout=$timeout;
				ourtimer=$timeout(function() {
					modal.hide();
					ons.notification.alert({message: 'Timeout. Please try again.', title: 'Reef Angel Controller' });
				}, 8000);			
				message.destinationName = cloudusername + "/in";
				mqtt.send(message);
			}
			return;
		}
		if (mqtt==null && cloudusername!=null && cloudpassword!=null && cmd == "r99")
		{
			$scope.cloudstatus="Connecting...";
			json.RA.cloudstatus="Connecting...";
			MQTTconnect();
			return;
		}
		
		modal.show();
		var tempurl;
		
		if (localserver)
			tempurl=document.referrer.replace("wifi","") + cmd;
		else
			tempurl="http://" + $localStorage.controllers[$localStorage.activecontrollerid].ipaddress + ":" + $localStorage.controllers[$localStorage.activecontrollerid].port + "/" + cmd;
		var request=$http({
			method:"GET",
			url: tempurl,
			timeout: 3000
		});
		request.success(function(data){
			console.log(data);
			modal.hide();
			if (cmd.substring(0,1)=='r')
			{
				var x2js = new X2JS();
				json = x2js.xml_str2json( data );
				//console.log(json);
				$localStorage.json=json;
				$localStorage.jsonarray[$localStorage.activecontrollerid]=json;
				$rootScope.$broadcast('msg', 'update');
				console.log(statusindex);
				if (statusindex==3) tabbar.loadPage('dimming.html');
				if (statusindex==5) tabbar.loadPage('rf.html');
				if (statusindex==7) tabbar.loadPage('dimmingoverride.html');
				if (statusindex==8) tabbar.loadPage('dimmingoverride.html');
			}
			if (cmd=='v')
				ons.notification.alert({message: 'Version: ' + data.replace('<V>','').replace('</V>',''), title: 'Reef Angel Controller' });
			if (cmd=='boot' || cmd=='mf' || cmd=='mw' || cmd=='bp' || cmd=='l1' || cmd=='l0' || cmd=='mt' || cmd=='mo' || cmd=='ml' || cmd=='cal0' || cmd=='cal1' || cmd=='cal2' || cmd=='cal3' || cmd=='cal4')
				ons.notification.alert({message: 'Command result: ' + data.replace('<MODE>','').replace('</MODE>',''), title: 'Reef Angel Controller' });
			if (cmd.substring(0,2)=='po')
			{
				if (data.search("Ok"))
				{
					var channel = cmd.substring(0,cmd.search(",")).replace("po","");
					var value = cmd.substring(cmd.search(",")+1,cmd.length)
					//if (value<=100) setjson(pwmchannels[channel],value);
					setjson(pwmchannels[channel] + 'O',value);
					$rootScope.$broadcast('msg', 'overrideok');
				}
			}
			if (cmd.substring(0,4)=='cvar')
			{
				if (data.search("Ok"))
				{
					var channel = cmd.substring(0,cmd.search(",")).replace("cvar","");
					var value = cmd.substring(cmd.search(",")+1,cmd.length)
					setjson('C'+channel,value);
					$rootScope.$broadcast('msg', 'cvarok');
				}
			}
			if (cmd.substring(0,5)=='mb255' || cmd.substring(0,5)=='mb256' || cmd.substring(0,5)=='mb257')
			{
				if (data.search("Ok"))
				{
					var channel;
					var value = cmd.substring(cmd.search(",")+1,cmd.length)
					if (cmd.substring(0,5)=='mb255') channel="M"
					if (cmd.substring(0,5)=='mb256') channel="S"
					if (cmd.substring(0,5)=='mb257') channel="D"
					setjson('RF'+channel,value);
					$rootScope.$broadcast('msg', 'rfok');
				}
			}
			if (cmd.substring(0,5)=='mb337' || cmd.substring(0,5)=='mb338' || cmd.substring(0,5)=='mb339')
			{
				if (data.search("Ok"))
				{
					var channel;
					var value = cmd.substring(cmd.search(",")+1,cmd.length)
					if (cmd.substring(0,5)=='mb337') channel="M"
					if (cmd.substring(0,5)=='mb338') channel="S"
					if (cmd.substring(0,5)=='mb339') channel="D"
					setjson('DC'+channel,value);
					$rootScope.$broadcast('msg', 'dcok');
				}
			}
			if (cmd.substring(0,2)=='mr')
			{
				memoryraw = data.replace('<MEM>','').replace('</MEM>','');
				$rootScope.$broadcast('msg', 'memoryrawok');
			}
		});
		request.error(function(data){
			modal.hide();
			ons.notification.alert({message: 'Unable to process controller data!'});
		})
	}
	$scope.getportallabels=function(){
		if (json!=null)
		{
			modal.show();
			var request=$http({
				method:"GET",
				url:"http://forum.reefangel.com/status/labels.aspx?id=" + json.RA.ID,
				timeout: 3000
			});
			request.success(function(data){
				modal.hide();
				var x2js = new X2JS();
				jsonlabels = x2js.xml_str2json( data );
				//console.log(jsonlabels);
				$localStorage.jsonlabels=jsonlabels;
				$localStorage.jsonlabelsarray[$localStorage.activecontrollerid]=jsonlabels;
				$rootScope.$broadcast('msg', 'labels');
			});
			request.error(function(data){
				modal.hide();
				ons.notification.alert({message: 'Unable to process controller data!'});
			})
		}
	}
	$scope.changerelay=function(id,mode){
		$scope.getcontrollerdata('r' + id + mode);
	}
});

app.controller('Parameters', function($rootScope, $scope, $timeout, $localStorage) {
	$scope.$storage = $localStorage;
	parametersscope=$scope;
	currentstorage=$localStorage;
	$scope.$on('msg', function(event, msg) {
		console.log('Parameters'+msg);
		if (msg=="update")
		{
			json.RA.lastrefresh=new Date().toLocaleString();
			UpdateParams($scope,$timeout,$localStorage);
			//$scope.loadparameterstab();
		}
		if (msg=="paramsok")
		{
			UpdateParams($scope,$timeout,$localStorage);
			
		}
		if (msg=="overrideok")
		{
			UpdateParams($scope,$timeout,$localStorage);
			$scope.backoverride();
		}
		if (msg=="cvarok")
		{
			UpdateParams($scope,$timeout,$localStorage);
			$scope.backcvarupdate();
		}
		if (msg=="rfok")
		{
			UpdateParams($scope,$timeout,$localStorage);
			$scope.backrfupdate();
		}
		if (msg=="dcok")
		{
			UpdateParams($scope,$timeout,$localStorage);
			$scope.backdcupdate();
		}
		if (msg=="labels")
		{
			loadlabels($scope);
		}
	});
	$scope.loadparameterstab=function(){
		tabbar.loadPage('parameters.html');
		statusindex=0;
	}
	$scope.loadflagstab=function(){
		tabbar.loadPage('flags.html');
		statusindex=1;
	}
	$scope.loadiotab=function(){
		tabbar.loadPage('io.html');
		statusindex=2;
	}
	$scope.loaddimmingtab=function(){
		tabbar.loadPage('dimming.html');
		statusindex=3;
	}
	$scope.loadcustomvartab=function(){
		tabbar.loadPage('customvar.html');
		statusindex=4;
	}
	$scope.loadrftab=function(){
		tabbar.loadPage('rf.html');
		statusindex=5;
	}
	$scope.loaddcpumptab=function(){
		tabbar.loadPage('dcpump.html');
		statusindex=6;
	}
	$scope.dimmingoverride=function(channel){
		tabbar.loadPage('dimmingoverride.html');
		channeloverride=channel;
		if (channel<8 || channel==17 || channel==18)
			statusindex=7;
		else if (channel>10 && channel<17)
			statusindex=8;
	}
	$scope.overridechange=function(){
		$scope.pwmoverride=$scope.dimmingoverridechange;
	}
	$scope.backoverride=function(){
		if (statusindex==3 || statusindex==7) tabbar.loadPage('dimming.html');
		if (statusindex==5 || statusindex==8) tabbar.loadPage('rf.html');
		if (statusindex==6) tabbar.loadPage('dcpump.html');
	}
	$scope.setoverride=function(){
		if (channeloverride<8 || channeloverride==17 || channeloverride==18)
			statusindex=3;
		else if (channeloverride>10 && channeloverride<17)
			statusindex=5;
		$scope.getcontrollerdata('po'+channeloverride+','+$scope.dimmingoverridechange);
	}
	$scope.canceloverride=function(){
		if (channeloverride<8 || channeloverride==17 || channeloverride==18)
			statusindex=3;
		else if (channeloverride>10 && channeloverride<17)
			statusindex=5;
		$scope.getcontrollerdata('po'+channeloverride+',255');
	}
	$scope.cvarupdate=function(channel){
		tabbar.loadPage('cvarupdate.html');
		cvarupdateindex=channel;
	}
	$scope.setcvarupdate=function(){
		$scope.getcontrollerdata('cvar'+cvarupdateindex+','+$scope.cvarupdatechange);
	}
	$scope.backcvarupdate=function(){
		tabbar.loadPage('customvar.html');
	}
	$scope.rfmodeupdate=function(channel){
		tabbar.loadPage('rfmodeupdate.html');
	}
	$scope.setrfmodeupdate=function(mode){
		$scope.getcontrollerdata('mb255,'+mode);
	}
	$scope.backrfupdate=function(){
		tabbar.loadPage('rf.html');
	}
	$scope.dcmodeupdate=function(){
		tabbar.loadPage('dcmodeupdate.html');
	}
	$scope.setdcmodeupdate=function(mode){
		$scope.getcontrollerdata('mb337,'+mode);
	}
	$scope.backdcupdate=function(){
		tabbar.loadPage('dcpump.html');
	}
	$scope.rfspeedupdate=function(channel){
		$scope.speedupdatechange=$scope.rfs;
		statusindex=8;
		tabbar.loadPage('speedupdate.html');
	}
	$scope.rfdurationupdate=function(channel){
		$scope.durationupdatechange=$scope.rfd;
		statusindex=8;
		tabbar.loadPage('durationupdate.html');
	}
	$scope.setspeedupdate=function(){
		if (statusindex==6)	$scope.getcontrollerdata('mb338,'+$scope.speedupdatechange);
		if (statusindex==8)	$scope.getcontrollerdata('mb256,'+$scope.speedupdatechange);
	}
	$scope.dcspeedupdate=function(channel){
		$scope.speedupdatechange=$scope.dcs;
		statusindex=6;
		tabbar.loadPage('speedupdate.html');
	}
	$scope.dcdurationupdate=function(channel){
		$scope.durationupdatechange=$scope.dcd;
		statusindex=6;
		tabbar.loadPage('durationupdate.html');
	}
	$scope.setdurationupdate=function(){
		if (statusindex==6)	$scope.getcontrollerdata('mb339,'+$scope.durationupdatechange);
		if (statusindex==8)	$scope.getcontrollerdata('mb257,'+$scope.durationupdatechange);
	}
	$scope.invokegraph=function(id){
		names = [];
		names.push(id);
		tabbar.loadPage("singlegraph.html");
		CreateChart($scope,"paramscontainer");
	}
	if (statusindex==7) $scope.dimmingtab=true;
	if (statusindex==8) $scope.rftab=true;
	if (statusindex==6) $scope.dctab=true;
	$scope.dimmingtab=true;
	$scope.dimmingoverridelabel="Dimming Channel";
	$scope.cvarenabled=false;
	$scope.rfimage="spacer.png";
	$scope.dimmingoverrideslider = "{'range': true, 'actinicslider': true}";
	$scope.pwmoverride = "0";
	if ($localStorage.json != null && $localStorage.controllers.length>0) json=$localStorage.json
	if ($localStorage.jsonlabels != null && $localStorage.controllers.length>0) jsonlabels=$localStorage.jsonlabels
	if (json==null) json=new Object();
	if (json.RA==null) json.RA=new Object();
	console.log(json);
	UpdateParams($scope,$timeout,$localStorage);
});


app.controller('Settings', function($rootScope, $scope, $timeout, $localStorage) {
	$scope.$storage = $localStorage;
	$scope.controllers=$localStorage.controllers;
	settingsscope=$scope;
	statusindex=0;
	$scope.$on('msg', function(event, msg) {
		console.log('Settings'+msg);
		if (msg=="update")
		{
			json.RA.lastrefresh=new Date().toLocaleString();
		}
	});
	if (editcontrollerid!=null)
	{
		$scope.controllername=$localStorage.controllers[editcontrollerid].name;
		$scope.controllerip=$localStorage.controllers[editcontrollerid].ipaddress;
		$scope.controllerport=$localStorage.controllers[editcontrollerid].port;
		$scope.cloudusername=$localStorage.controllers[editcontrollerid].cloudusername;
		$scope.cloudpassword=$localStorage.controllers[editcontrollerid].cloudpassword;
	}
	$scope.saveaddcontroller=function(){
		
		if (editcontrollerid==null)
		{
			$localStorage.controllers.push({
				name : $scope.controllername,
				ipaddress : $scope.controllerip,
				port : $scope.controllerport,
				cloudusername: $scope.cloudusername,
				cloudpassword: $scope.cloudpassword
			});
			$localStorage.jsonarray.push(null);
			$localStorage.jsonlabelsarray.push(null);
			$localStorage.activecontroller=$scope.controllername;
			$localStorage.activecontrollerid=$localStorage.controllers.length-1;
			json=new Object();
			json.RA=new Object();
			$localStorage.json=null;
			jsonlabel=null;
			$localStorage.jsonlabel=null;
			MQTTdisconnect();
			$rootScope.$broadcast('msg', 'paramsok');
			$rootScope.$broadcast('msg', 'popoverclose');
		}
		else
		{
			$localStorage.controllers[editcontrollerid].name=$scope.controllername;
			$localStorage.controllers[editcontrollerid].ipaddress=$scope.controllerip;
			$localStorage.controllers[editcontrollerid].port=$scope.controllerport;
			$localStorage.controllers[editcontrollerid].cloudusername=$scope.cloudusername;
			$localStorage.controllers[editcontrollerid].cloudpassword=$scope.cloudpassword;
			if (editcontrollerid==$localStorage.activecontrollerid)
			{
				$localStorage.activecontroller=$scope.controllername;
				$rootScope.$broadcast('msg', 'popoverclose');
			}
		}
		loaddefaultvalues();
		loaddefaultlabels();
		$scope.loadcontrollertab();
	}
	$scope.loadcontrollertab=function(){
		editcontrollerid=null;
		tabbar.loadPage('settings.html');
	}
	$scope.loadinternalmemorytab=function(){
		tabbar.loadPage('internalmemory.html');
		$scope.getcontrollerdata('mr');
	}
	$scope.addcontroller=function(){
		tabbar.loadPage('addcontroller.html');
	}
	$scope.editcontroller=function(id){
		editcontrollerid=id;
		tabbar.loadPage('addcontroller.html');
	}
	$scope.deletecontroller=function(id){
		ons.notification.confirm({
		  message: 'Are you sure you want to delete ' + $localStorage.controllers[id].name + " controller?",
		  callback: function(idx) {
			switch (idx) {
			  case 1:
			    MQTTdisconnect();
				delete $localStorage.controllers[id];
				$localStorage.controllers = $localStorage.controllers.filter(function(n){ return n != null }); 
				delete $localStorage.jsonarray[id];
				$localStorage.jsonarray = $localStorage.jsonarray.filter(function(n){ return n != null }); 
				if ($localStorage.jsonarray==null) $localStorage.jsonarray=[];
				delete $localStorage.jsonlabelsarray[id];
				$localStorage.jsonlabelsarray = $localStorage.jsonlabelsarray.filter(function(n){ return n != null }); 
				if ($localStorage.jsonlabelsarray==null) $localStorage.jsonlabelsarray=[];
				if ($localStorage.controllers.length==0)
				{
					json=null;
					$localStorage.json=null;
					jsonlabels=null;
					$localStorage.jsonlabels=null;
					$scope.activecontroller=null;
					$localStorage.activecontroller=null;
					$localStorage.activecontrollerid=null;
					editcontrollerid=null;
					$rootScope.$broadcast('msg', 'paramsok');
				}
				if ($localStorage.activecontrollerid==id)
				{
					changeactivecontroller($scope, $localStorage, $rootScope, 0);
				}
				$rootScope.$broadcast('msg', 'popoverclose');
				tabbar.loadPage('settings.html');
				break;
			}
		  }
		});		
	}
});

app.controller('PopoverController', function($rootScope, $scope, $http, $localStorage){
	$scope.$storage = $localStorage;
	$scope.controllers=$localStorage.controllers;
	if ($localStorage.controllers == null) $localStorage.controllers=[];
	$scope.$on('msg', function(event, msg) {
		console.log('PopoverController'+msg);
		if (msg=="popoverclose")
		{
			$scope.controllers=$localStorage.controllers;
		}
	});
	$scope.controllerselected=function(id){
		changeactivecontroller($scope, $localStorage, $rootScope, id);
	}
});

app.controller('Relay', function($rootScope, $scope, $timeout, $localStorage) {
	$scope.$storage = $localStorage;
	relayscope=$scope;
	statusindex=0;
	$scope.$on('msg', function(event, msg) {
		console.log('Relay'+msg);
		if (msg=="update")
		{
			json.RA.lastrefresh=new Date().toLocaleString();
			UpdateParams($scope,$timeout,$localStorage);
		}
		if (msg=="paramsok")
		{
			UpdateParams($scope,$timeout,$localStorage);
		}
	});
	$scope.loadmaintab=function(){
		console.log("main relay box");
	}
	$scope.loadexp1tab=function(){
		$localStorage.exp1tab=true;
		console.log("exp1 relay box");
		
	}
	UpdateParams($scope,$timeout,$localStorage);
});

app.controller('Graph', function($rootScope, $scope, $http, $timeout, $localStorage){
	$scope.$storage = $localStorage;
	$scope.showgraphlist=true;
	UpdateParams($scope,$timeout,$localStorage);
	$scope.$on('msg', function(event, msg) {
		console.log('Graph'+msg);
		if (msg=="update")
		{
			json.RA.lastrefresh=new Date().toLocaleString();
		}
		if (msg=="paramsok")
		{
			UpdateParams($scope,$timeout,$localStorage);
		}
	});
	$scope.buildgraph=function(){
		names = [];
		if ($scope.grapht1==true) names.push("T1");
		if ($scope.grapht2==true) names.push("T2");
		if ($scope.grapht3==true) names.push("T3");
		if ($scope.graphph==true) names.push("PH");
		if ($scope.graphsal==true) names.push("SAL");
		if ($scope.graphorp==true) names.push("ORP");
		if ($scope.graphphe==true) names.push("PHE");
		if ($scope.graphwl==true) names.push("WL");
		if ($scope.graphwl1==true) names.push("WL1");
		if ($scope.graphwl2==true) names.push("WL2");
		if ($scope.graphwl3==true) names.push("WL3");
		if ($scope.graphwl4==true) names.push("WL4");
		if ($scope.graphpar==true) names.push("PAR");
		if ($scope.graphhum==true) names.push("HUM");
		if ($scope.graphcustom==true)
		{
			var items = $scope.graphcustomitems.split(",");
			console.log(items.length);
			for (a=0; a<items.length; a++)
			{
				names.push(items[a].toUpperCase());
			}
		}
		CreateChart($scope,"container");
	}
});

app.controller('InternalMemory', function($rootScope, $scope, $http, $timeout, $localStorage){
	$scope.$storage = $localStorage;
	internalmemoryrootscope=$rootScope;
	internalmemoryscope=$scope;
	currenttimeout=$timeout;
	$scope.showim=true;
	$scope.dimmingexpansionenabled = ((json.RA.EM & 1) == 1);
	memoryraw="";
	$scope.$on('msg', function(event, msg) {
		//console.log('Parameters'+msg);
		if (msg=="memoryrawok")
		{
			$scope.daylighton=new Date("01/01/01 " + getbytevalue(memoryraw,4).pad() + ":" + getbytevalue(memoryraw,5).pad());
			$scope.daylightoff=new Date("01/01/01 " + getbytevalue(memoryraw,6).pad() + ":" + getbytevalue(memoryraw,7).pad());
			$scope.daylightdelayed=getbytevalue(memoryraw,35);
			$scope.actinicoffset=getbytevalue(memoryraw,84);
			$scope.heateron=parseFloat(getintvalue(memoryraw,22)/10);
			$scope.heateroff=parseFloat(getintvalue(memoryraw,24)/10);
			$scope.chilleron=parseFloat(getintvalue(memoryraw,26)/10);
			$scope.chilleroff=parseFloat(getintvalue(memoryraw,28)/10);
			$scope.overheat=parseFloat(getintvalue(memoryraw,18)/10);
			$scope.atotimeout=getintvalue(memoryraw,76);
			$scope.waterlevellow=getbytevalue(memoryraw,131);
			$scope.waterlevelhigh=getbytevalue(memoryraw,132);
			$scope.wmtimer=getintvalue(memoryraw,8);
			$scope.co2controlon=parseFloat(getintvalue(memoryraw,85)/100);
			$scope.co2controloff=parseFloat(getintvalue(memoryraw,87)/100);
			$scope.phcontrolon=parseFloat(getintvalue(memoryraw,89)/100);
			$scope.phcontroloff=parseFloat(getintvalue(memoryraw,91)/100);
			$scope.dp1interval=getintvalue(memoryraw,43);
			$scope.dp1timer=getbytevalue(memoryraw,12);
			$scope.dp2interval=getintvalue(memoryraw,45);
			$scope.dp2timer=getbytevalue(memoryraw,13);
			$scope.dp3interval=getintvalue(memoryraw,134);
			$scope.dp3timer=getbytevalue(memoryraw,133);
			$scope.delayedon=getbytevalue(memoryraw,120);
			$scope.pwmslopestartd=getbytevalue(memoryraw,49);
			$scope.pwmslopeendd=getbytevalue(memoryraw,50);
			$scope.pwmslopedurationd=getbytevalue(memoryraw,51);
			$scope.pwmslopestarta=getbytevalue(memoryraw,52);
			$scope.pwmslopeenda=getbytevalue(memoryraw,53);
			$scope.pwmslopedurationa=getbytevalue(memoryraw,54);
			m=58;
			$scope.pwmslopestart=[];
			$scope.pwmslopeend=[];
			$scope.pwmslopeduration=[];
			for (a=0;a<6;a++)
			{
				$scope.pwmslopestart[a]=getbytevalue(memoryraw,m++);
				$scope.pwmslopeend[a]=getbytevalue(memoryraw,m++);
				$scope.pwmslopeduration[a]=getbytevalue(memoryraw,m++);
			}
		}
	});
	$scope.loadinternalmemorytab=function(){
		$scope.showim=true;
		$scope.getcontrollerdata('mr');
		$scope.memoryresult="";
		memoryraw="";
	}
	$scope.loadcontrollertab=function(){
		editcontrollerid=null;
		tabbar.loadPage('settings.html');
	}
	$scope.toggleGroup = function(group){
		if ($scope.isGroupShown(group)) 
			$scope.shownGroup = null;
		else
			$scope.shownGroup = group;
	};
	$scope.isGroupShown = function(group) {
		return $scope.shownGroup === group;
	};
	$scope.memback = function(group) {
		$scope.getcontrollerdata('mr');
	};
	$scope.memsave = function(group) {
		MemString=[]; 
		MemURL=[];
		memindex=0;
		$scope.memoryresult="";
		if ($scope.daylightdelayed!=getbytevalue(memoryraw,35))
			SaveMemory("Daylights Delayed Start", "mb235," + $scope.daylightdelayed);
		if ($scope.actinicoffset!=getbytevalue(memoryraw,84))
			SaveMemory("Actinic Offset", "mb284," + $scope.actinicoffset);
		if  ($scope.daylighton-new Date("01/01/01 " + getbytevalue(memoryraw,4).pad() + ":" + getbytevalue(memoryraw,5).pad()))
		{
			SaveMemory("Daylights On Hour", "mb204," + new Date(Date.parse($scope.daylighton)).getHours());
			SaveMemory("Daylights On Minute", "mb205," + new Date(Date.parse($scope.daylighton)).getMinutes());
		}
		if  ($scope.daylightoff-new Date("01/01/01 " + getbytevalue(memoryraw,6).pad() + ":" + getbytevalue(memoryraw,7).pad()))
		{
			SaveMemory("Daylights Off Hour", "mb206," + new Date(Date.parse($scope.daylightoff)).getHours());
			SaveMemory("Daylights Off Minute", "mb207," + new Date(Date.parse($scope.daylightoff)).getMinutes());
		}
		if ($scope.heateron!=getintvalue(memoryraw,22)/10)
			SaveMemory("Heater On", "mi222," + Math.round($scope.heateron*10));
		if ($scope.heateroff!=getintvalue(memoryraw,24)/10)
			SaveMemory("Heater Off", "mi224," + Math.round($scope.heateroff*10));
		if ($scope.chilleron!=getintvalue(memoryraw,26)/10)
			SaveMemory("Chiller On", "mi226," + Math.round($scope.chilleron*10));
		if ($scope.chilleroff!=getintvalue(memoryraw,28)/10)
			SaveMemory("Chiller Off", "mi228," + Math.round($scope.chilleroff*10));
		if ($scope.overheat!=getintvalue(memoryraw,18)/10)
			SaveMemory("Overheat Temperature", "mi218," + Math.round($scope.overheat*10));
		if ($scope.atotimeout!=getintvalue(memoryraw,76))
			SaveMemory("Auto Top Off Timeout", "mi276," + $scope.atotimeout);
		if ($scope.wmtimer!=getintvalue(memoryraw,8))
			SaveMemory("Wavemaker Timer", "mi208," + $scope.wmtimer);
		if ($scope.co2controlon!=getintvalue(memoryraw,85)/100)
			SaveMemory("CO2 Control On", "mi285," + Math.round($scope.co2controlon*100));
		if ($scope.co2controloff!=getintvalue(memoryraw,87)/100)
			SaveMemory("CO2 Control Off", "mi287," + Math.round($scope.co2controloff*100));
		if ($scope.phcontrolon!=getintvalue(memoryraw,89)/100)
			SaveMemory("pH Control Off", "mi289," + Math.round($scope.phcontrolon*100));
		if ($scope.phcontroloff!=getintvalue(memoryraw,91)/100)
			SaveMemory("pH Control Off", "mi291," + Math.round($scope.phcontroloff*100));
		if ($scope.dp1interval!=getintvalue(memoryraw,43))
			SaveMemory("Dosing Pump 1 Interval", "mi243," + $scope.dp1interval);
		if ($scope.dp1timer!=getbytevalue(memoryraw,12))
			SaveMemory("Dosing Pump 1 Timer", "mb212," + $scope.dp1timer);
		if ($scope.dp2interval!=getintvalue(memoryraw,45))
			SaveMemory("Dosing Pump 2 Interval", "mi245," + $scope.dp2interval);
		if ($scope.dp2timer!=getbytevalue(memoryraw,13))
			SaveMemory("Dosing Pump 2 Timer", "mb213," + $scope.dp2timer);
		if ($scope.dp3interval!=getintvalue(memoryraw,134))
			SaveMemory("Dosing Pump 3 Interval", "mi334," + $scope.dp3interval);
		if ($scope.dp3timer!=getbytevalue(memoryraw,133))
			SaveMemory("Dosing Pump 3 Timer", "mb333," + $scope.dp3timer);
		if ($scope.delayedon!=getbytevalue(memoryraw,120))			
			SaveMemory("Delayed Start", "mb320," + $scope.delayedon);
		if ($scope.pwmslopestartd!=getbytevalue(memoryraw,49))			
			SaveMemory("Daylight Dimming Start %", "mb249," + $scope.pwmslopestartd);
		if ($scope.pwmslopeendd!=getbytevalue(memoryraw,50))			
			SaveMemory("Daylight Dimming End %", "mb250," + $scope.pwmslopeendd);
		if ($scope.pwmslopedurationd!=getbytevalue(memoryraw,51))			
			SaveMemory("Daylight Dimming Duration", "mb251," + $scope.pwmslopedurationd);
		if ($scope.pwmslopestarta!=getbytevalue(memoryraw,52))			
			SaveMemory("Actinic Dimming Start %", "mb252," + $scope.pwmslopestarta);
		if ($scope.pwmslopeenda!=getbytevalue(memoryraw,53))			
			SaveMemory("Actinic Dimming End %", "mb253," + $scope.pwmslopeenda);
		if ($scope.pwmslopedurationa!=getbytevalue(memoryraw,54))			
			SaveMemory("Actinic Dimming Duration", "mb254," + $scope.pwmslopedurationa);
		if ($scope.waterlevellow!=getbytevalue(memoryraw,131))			
			SaveMemory("Low Water Level", "mb331," + $scope.waterlevellow);
		if ($scope.waterlevelhigh!=getbytevalue(memoryraw,132))			
			SaveMemory("High Water Level", "mb332," + $scope.waterlevelhigh);
		m=58;
		for (a=0;a<6;a++)
		{
			if ($scope.pwmslopestart[a]!=getbytevalue(memoryraw,m))
			{
				t=200+m;
				SaveMemory("Dimming Expansion Channel " + a + " Start %", "mb" + t + "," + $scope.pwmslopestart[a]);
			}
			m++;
			if ($scope.pwmslopeend[a]!=getbytevalue(memoryraw,m))	
			{		
				t=200+m;
				SaveMemory("Dimming Expansion Channel " + a + " End %", "mb" + t + "," + $scope.pwmslopeend[a]);
			}
			m++;
			if ($scope.pwmslopeduration[a]!=getbytevalue(memoryraw,m))
			{			
				t=200+m;
				SaveMemory("Dimming Expansion Channel " + a + " Duration", "mb" + t + "," + $scope.pwmslopeduration[a]);
			}
			m++;
		}
		if (MemString.length>0)
		{
			modal.show();
			$scope.showim=false;
			$scope.memoryresult+=MemString[memindex];
			$scope.updatecontrollermemory(MemURL[memindex]);
		}
		else
		{
			ons.notification.alert({message: 'Nothing to update.'});
		}
	};
	
	$scope.updatecontrollermemory=function(cmd){
		console.log(cmd);
		if (mqtt!=null )
		{
			SaveMQTTMemory(cmd);
		}
		else
		{
			var tempurl="http://" + $localStorage.controllers[$localStorage.activecontrollerid].ipaddress + ":" + $localStorage.controllers[$localStorage.activecontrollerid].port + "/" + cmd;
			var request=$http({
				method:"GET",
				url: tempurl,
				timeout: 3000
			});
			request.success(function(data){
				console.log(data);
				if (data.indexOf("OK")>0)
					$scope.memoryresult+=": OK\n";
				else
					$scope.memoryresult+=": Error\n";
				if (memindex<(MemString.length-1))
				{
					memindex++;
					$scope.memoryresult+=MemString[memindex];
					$timeout(function() {
						$scope.updatecontrollermemory(MemURL[memindex]);
					}, 1000);
				}
				else
				{
					modal.hide();
				}
	
			});
			request.error(function(data){
				modal.hide();
				ons.notification.alert({message: 'Unable to process controller data!'});
			})
		}
	}
});

function UpdateParams($scope,$timeout,$localStorage)
{
	$scope.$storage = $localStorage;
	console.log("Updating...");
	if ($localStorage.controllers.length>0)
	{
		//MQTTdisconnect();
		if ($localStorage.controllers[$localStorage.activecontrollerid]!=null)
		{
			cloudusername=$localStorage.controllers[$localStorage.activecontrollerid].cloudusername;
			cloudpassword=$localStorage.controllers[$localStorage.activecontrollerid].cloudpassword;
		}
		$scope.cloudenabled=false;
		if (cloudusername!=null && cloudpassword!=null)
		{
			$scope.cloudenabled=true;
			$scope.cloudstatus=json.RA.cloudstatus;
		}
		if (mqtt==null && cloudusername!=null && cloudpassword!=null)
		{
			$scope.cloudstatus="Connecting...";
			json.RA.cloudstatus="Connecting...";
			MQTTconnect();
		}
	}
	if (json!=null)
	{
		if (json.RA.lastrefresh == null)
			$scope.lastupdated="Never";
		else
			$scope.lastupdated=json.RA.lastrefresh;
		if (json.RA.ID == null)
			$scope.forumid = "Unknown";
		else
			$scope.forumid = json.RA.ID;
		$scope.t1 = (json.RA.T1/10).toFixed(1);
		$scope.t2 = (json.RA.T2/10).toFixed(1);
		$scope.t3 = (json.RA.T3/10).toFixed(1);
		$scope.ph = (json.RA.PH/100).toFixed(2);
		if (json.RA.BID == 4)
		{
			$scope.stardimmingenabled=true;
			$scope.pwmd2 = json.RA.PWMD2;
			$scope.pwma2 = json.RA.PWMA2;
			$scope.alarm = json.RA.ALARM;
			$scope.leak = json.RA.LEAK;
		}
		else
		{
			$scope.mainenabled=true;
		}
		if (json.RA.REM>0)
		{
			$scope.expansionenabled=true;
			if ((json.RA.REM & 1) == 1)
				$scope.exp1enabled=true;
			if ((json.RA.REM & 2) == 2)
				$scope.exp2enabled=true;
			if ((json.RA.REM & 4) == 4)
				$scope.exp3enabled=true;
			if ((json.RA.REM & 8) == 8)
				$scope.exp4enabled=true;
			if ((json.RA.REM & 16) == 16)
				$scope.exp5enabled=true;
			if ((json.RA.REM & 32) == 32)
				$scope.exp6enabled=true;
			if ((json.RA.REM & 64) == 64)
				$scope.exp7enabled=true;
			if ((json.RA.REM & 128) == 128)
				$scope.exp8enabled=true;
		}
		CheckExpansion($scope);
		if ((json.RA.EM & 1) == 1)
		{
			$scope.pwme0 = json.RA.PWME0;
			$scope.pwme1 = json.RA.PWME1;
			$scope.pwme2 = json.RA.PWME2;
			$scope.pwme3 = json.RA.PWME3;
			$scope.pwme4 = json.RA.PWME4;
			$scope.pwme5 = json.RA.PWME5;
		}
		if ((json.RA.EM & 2) == 2)
		{
			$scope.rfm = rfmodes[json.RA.RFM];
			$scope.rfs = json.RA.RFS;
			$scope.rfd = json.RA.RFD;
			$scope.rfmodecolor = rfmodecolors[json.RA.RFM];
			$scope.rfimage = rfimages[json.RA.RFM];
			$scope.rfw = json.RA.RFW;
			$scope.rfrb = json.RA.RFRB;
			$scope.rfr = json.RA.RFR;
			$scope.rfg = json.RA.RFG;
			$scope.rfb = json.RA.RFB;
			$scope.rfi = json.RA.RFI;
			CheckRadionOverride($scope);
		}
		if ((json.RA.EM & 8) == 8)
			$scope.sal = (json.RA.SAL/10).toFixed(1);
		if ((json.RA.EM & 16) == 16)
			$scope.orp = json.RA.ORP;
		if ((json.RA.EM & 32) == 32)
		{
			CheckIO($scope);
		}
		if ((json.RA.EM & 64) == 64)
			$scope.phe = (json.RA.PHE/100).toFixed(2);
		if ((json.RA.EM & 128) == 128)
		{
			$scope.wl = json.RA.WL;
			$scope.wl1 = json.RA.WL1;
			$scope.wl2 = json.RA.WL2;
			$scope.wl3 = json.RA.WL3;
			$scope.wl4 = json.RA.WL4;
		}
		if ((json.RA.EM1 & 1) == 1)
			$scope.hum = json.RA.HUM;
		if ((json.RA.EM1 & 2) == 2)
		{
			$scope.dcm = rfmodes[json.RA.DCM];
			$scope.dcs = json.RA.DCS;
			$scope.dcd = json.RA.DCD;
			$scope.dcmodecolor = rfmodecolors[json.RA.DCM];
			$scope.dcimage = rfimages[json.RA.DCM];
		}
		if ((json.RA.EM1 & 8) == 8)
			$scope.par = json.RA.PAR;
		CheckFlags($scope);
		$scope.atohigh = json.RA.ATOHIGH;
		$scope.atolow = json.RA.ATOLOW;
		if (json.RA.PWMD!=null)
			$scope.pwmd = json.RA.PWMD;
		if (json.RA.PWMA!=null)
			$scope.pwma = json.RA.PWMA;
		CheckDimmingOverride($scope);
		CheckCvar($scope);
		$scope.c0 = json.RA.C0;
		$scope.c1 = json.RA.C1;
		$scope.c2 = json.RA.C2;
		$scope.c3 = json.RA.C3;
		$scope.c4 = json.RA.C4;
		$scope.c5 = json.RA.C5;
		$scope.c6 = json.RA.C6;
		$scope.c7 = json.RA.C7;

		$scope.dimmingoverridelabel=dimmingchannels[channeloverride];
		if (channeloverride==0)
		{
			$scope.dimmingoverridechange = $scope.pwmd;
			$scope.dimmingoverrideslider = "{'range': true, 'daylightslider': true}";
		}
		if (channeloverride==1)
		{
			$scope.dimmingoverridechange = $scope.pwma;
			$scope.dimmingoverrideslider = "{'range': true, 'actinicslider': true}";
		}
		if (channeloverride==17)
		{
			$scope.dimmingoverridechange = $scope.pwmd2;
			$scope.dimmingoverrideslider = "{'range': true, 'daylightslider': true}";
		}
		if (channeloverride==18)
		{
			$scope.dimmingoverridechange = $scope.pwma2;
			$scope.dimmingoverrideslider = "{'range': true, 'actinicslider': true}";
		}
		if (channeloverride==2)
		{
			$scope.dimmingoverridechange = $scope.pwme0;
			$scope.dimmingoverrideslider = "{'range': true, 'pwmeslider': true}";
		}
		if (channeloverride==3)
		{
			$scope.dimmingoverridechange = $scope.pwme1;
			$scope.dimmingoverrideslider = "{'range': true, 'pwmeslider': true}";
		}
		if (channeloverride==4)
		{
			$scope.dimmingoverridechange = $scope.pwme2;
			$scope.dimmingoverrideslider = "{'range': true, 'pwmeslider': true}";
		}
		if (channeloverride==5)
		{
			$scope.dimmingoverridechange = $scope.pwme3;
			$scope.dimmingoverrideslider = "{'range': true, 'pwmeslider': true}";
		}
		if (channeloverride==6)
		{
			$scope.dimmingoverridechange = $scope.pwme4;
			$scope.dimmingoverrideslider = "{'range': true, 'pwmeslider': true}";
		}
		if (channeloverride==7)
		{
			$scope.dimmingoverridechange = $scope.pwme5;
			$scope.dimmingoverrideslider = "{'range': true, 'pwmeslider': true}";
		}
		if (channeloverride==11)
		{
			$scope.dimmingoverridechange = $scope.rfw;
			$scope.dimmingoverrideslider = "{'range': true, 'daylightslider': true}";
		}
		if (channeloverride==12)
		{
			$scope.dimmingoverridechange = $scope.rfrb;
			$scope.dimmingoverrideslider = "{'range': true, 'actinicslider': true}";
		}
		if (channeloverride==13)
		{
			$scope.dimmingoverridechange = $scope.rfr;
			$scope.dimmingoverrideslider = "{'range': true, 'redslider': true}";
		}
		if (channeloverride==14)
		{
			$scope.dimmingoverridechange = $scope.rfg;
			$scope.dimmingoverrideslider = "{'range': true, 'pwmeslider': true}";
		}
		if (channeloverride==15)
		{
			$scope.dimmingoverridechange = $scope.rfb;
			$scope.dimmingoverrideslider = "{'range': true, 'blueslider': true}";
		}
		if (channeloverride==16)
		{
			$scope.dimmingoverridechange = $scope.rfi;
			$scope.dimmingoverrideslider = "{'range': true, 'intensityslider': true}";
		}
		$scope.cvarupdatelabel=customvars[cvarupdateindex];
		if (cvarupdateindex==0) $scope.cvarupdatechange = $scope.c0;
		if (cvarupdateindex==1) $scope.cvarupdatechange = $scope.c1;
		if (cvarupdateindex==2) $scope.cvarupdatechange = $scope.c2;
		if (cvarupdateindex==3) $scope.cvarupdatechange = $scope.c3;
		if (cvarupdateindex==4) $scope.cvarupdatechange = $scope.c4;
		if (cvarupdateindex==5) $scope.cvarupdatechange = $scope.c5;
		if (cvarupdateindex==6) $scope.cvarupdatechange = $scope.c6;
		if (cvarupdateindex==7) $scope.cvarupdatechange = $scope.c7;
		$scope.rfmodeupdatechange = $scope.rfm;
		$scope.dcmodeupdatechange = $scope.dcm;
		if (statusindex==6)
		{
			$scope.speedupdatechange=$scope.dcs;
			$scope.durationupdatechange=$scope.dcd;
		}
		if (statusindex==8)
		{
			$scope.speedupdatechange=$scope.rfs;
			$scope.durationupdatechange=$scope.rfd;
		}
		CheckRelay($scope);
	}
	loadlabels($scope);
}

function CheckFlags($scope)
{
	$scope.alertnoflag=!(json.RA.AF>0 || json.RA.SF>0);
	$scope.alertato=((json.RA.AF & 1) == 1);
	$scope.alertoverheat=((json.RA.AF & 2) == 2);
	$scope.alertbuslock=((json.RA.AF & 4) == 4);
	$scope.alertleak=((json.RA.AF & 8) == 8);
	$scope.alertlightson=((json.RA.SF & 1) == 1);
}

function CheckIO($scope)
{
	$scope.io0 = (json.RA.IO & 1)/1;
	$scope.io1 = (json.RA.IO & 2)/2;
	$scope.io2 = (json.RA.IO & 4)/4;
	$scope.io3 = (json.RA.IO & 8)/8;
	$scope.io4 = (json.RA.IO & 16)/16;
	$scope.io5 = (json.RA.IO & 32)/32;
}

function CheckExpansion($scope)
{
	$scope.dimmingexpansionenabled = ((json.RA.EM & 1) == 1);
	$scope.rfenabled = ((json.RA.EM & 2) == 2);
	$scope.salinityenabled = ((json.RA.EM & 8) == 8);
	$scope.orpenabled = ((json.RA.EM & 16) == 16);
	$scope.ioenabled = ((json.RA.EM & 32) == 32);
	$scope.pheenabled = ((json.RA.EM & 64) == 64);
	if ((json.RA.EM & 128) == 128)
	{
		$scope.wlenabled=true;
		$scope.multiwlenabled=true;
	}
	$scope.humenabled = ((json.RA.EM1 & 1) == 1);
	$scope.dcpumpenabled = ((json.RA.EM1 & 2) == 2);
	$scope.parenabled = ((json.RA.EM1 & 8) == 8);
}

function CheckCvar($scope)
{
	if (json.RA.C0>0 || json.RA.C1>0 || json.RA.C2>0 || json.RA.C3>0 || json.RA.C4>0 || json.RA.C5>0 || json.RA.C6>0 || json.RA.C7>0) $scope.cvarenabled=true;
}

function CheckDimmingOverride($scope)
{
	if (json.RA.PWMDO<=100)
	{
		$scope.pwmdclass = "dimmingoverridehighlight";
		$scope.pwmd = json.RA.PWMDO;
	}
	else
	{
		$scope.pwmdclass = "";
		$scope.pwmd = json.RA.PWMD;
	}
	if (json.RA.PWMAO<=100)
	{
		$scope.pwmaclass = "dimmingoverridehighlight";
		$scope.pwma = json.RA.PWMAO;
	}
	else
	{
		$scope.pwmaclass = "";
		$scope.pwma = json.RA.PWMA;
	}
	if (json.RA.PWMD2O<=100)
	{
		$scope.pwmd2class = "dimmingoverridehighlight";
		$scope.pwmd2 = json.RA.PWMD2O;
	}
	else
	{
		$scope.pwmd2class = "";
		$scope.pwmd2 = json.RA.PWMD2;
	}
	if (json.RA.PWMA2O<=100)
	{
		$scope.pwma2class = "dimmingoverridehighlight";
		$scope.pwma2 = json.RA.PWMA2O;
	}
	else
	{
		$scope.pwma2class = "";
		$scope.pwma2 = json.RA.PWMA2;
	}
	if (json.RA.PWME0O<=100) 
	{
		$scope.pwme0class = "dimmingoverridehighlight";
		$scope.pwme0 = json.RA.PWME0O;
	}
	else
	{
		$scope.pwme0class = "";
		$scope.pwme0 = json.RA.PWME0;
	}
	if (json.RA.PWME1O<=100) 
	{
		$scope.pwme1class = "dimmingoverridehighlight";
		$scope.pwme1 = json.RA.PWME1O;
	}
	else
	{
		$scope.pwme1class = "";
		$scope.pwme1 = json.RA.PWME1;
	}
	if (json.RA.PWME2O<=100) 
	{
		$scope.pwme2class = "dimmingoverridehighlight";
		$scope.pwme2 = json.RA.PWME2O;
	}
	else
	{
		$scope.pwme2class = "";
		$scope.pwme2 = json.RA.PWME2;
	}
	if (json.RA.PWME3O<=100) 
	{
		$scope.pwme3class = "dimmingoverridehighlight";
		$scope.pwme3 = json.RA.PWME3O;
	}
	else
	{
		$scope.pwme3class = "";
		$scope.pwme3 = json.RA.PWME3;
	}
	if (json.RA.PWME4O<=100) 
	{
		$scope.pwme4class = "dimmingoverridehighlight";
		$scope.pwme4 = json.RA.PWME4O;
	}
	else
	{
		$scope.pwme4class = "";
		$scope.pwme4 = json.RA.PWME4;
	}
	if (json.RA.PWME5O<=100) 
	{
		$scope.pwme5class = "dimmingoverridehighlight";
		$scope.pwme5 = json.RA.PWME5O;
	}
	else
	{
		$scope.pwme5class = "";
		$scope.pwme5 = json.RA.PWME5;
	}
}

function CheckRadionOverride($scope)
{
	if (json.RA.RFWO<=100)
	{
		$scope.rfwclass = "dimmingoverridehighlight";
		$scope.rfw = json.RA.RFWO;
	}
	else
	{
		$scope.rfwclass = "";
		$scope.rfw = json.RA.RFW;
	}
	if (json.RA.RFRBO<=100)
	{
		$scope.rfrbclass = "dimmingoverridehighlight";
		$scope.rfrb = json.RA.RFRBO;
	}
	else
	{
		$scope.rfrbclass = "";
		$scope.rfrb = json.RA.RFRB;
	}
	if (json.RA.RFRO<=100) 
	{
		$scope.rfrclass = "dimmingoverridehighlight";
		$scope.rfr = json.RA.RFRO;
	}
	else
	{
		$scope.rfrclass = "";
		$scope.rfr = json.RA.RFR;
	}
	if (json.RA.RFGO<=100) 
	{
		$scope.rfgclass = "dimmingoverridehighlight";
		$scope.rfg = json.RA.RFGO;
	}
	else
	{
		$scope.rfgclass = "";
		$scope.rfg = json.RA.RFG;
	}
	if (json.RA.RFBO<=100) 
	{
		$scope.rfbclass = "dimmingoverridehighlight";
		$scope.rfb = json.RA.RFBO;
	}
	else
	{
		$scope.rfbclass = "";
		$scope.rfb = json.RA.RFB;
	}
	if (json.RA.RFIO<=100) 
	{
		$scope.rficlass = "dimmingoverridehighlight";
		$scope.rfi = json.RA.RFIO;
	}
	else
	{
		$scope.rficlass = "";
		$scope.rfi = json.RA.RFI;
	}
}

function CheckRelay($scope)
{
	for (a=1;a<=8;a++)
	{
		if ((json.RA.RON & (1<<(a-1))) == 0 && (json.RA.ROFF & (1<<(a-1))) == (1<<(a-1)))
		{
			$scope["r"+a+"on"]=false;
			$scope["r"+a+"off"]=false;
			$scope["r"+a+"auto"]=true;
			if ((json.RA.R & (1<<(a-1))) == (1<<(a-1)))
				$scope["r"+a+"autoclass"]="relaygreenclass";
			else
				$scope["r"+a+"autoclass"]="relayredclass";
			$scope["r"+a+"onclass"]="relayblankclass";
			$scope["r"+a+"offclass"]="relayblankclass";
		}
		if ((json.RA.RON & (1<<(a-1))) == (1<<(a-1)))
		{
			$scope["r"+a+"onclass"]="relaygreenclass";
			$scope["r"+a+"offclass"]="relayblankclass";
			$scope["r"+a+"autoclass"]="relayblankclass";
			$scope["r"+a+"on"]=true;
			$scope["r"+a+"off"]=false;
			$scope["r"+a+"auto"]=false;
		}
		if ((json.RA.ROFF & (1<<(a-1))) == 0)
		{
			$scope["r"+a+"onclass"]="relayblankclass";
			$scope["r"+a+"offclass"]="relayredclass";
			$scope["r"+a+"autoclass"]="relayblankclass";
			$scope["r"+a+"on"]=false;
			$scope["r"+a+"off"]=true;
			$scope["r"+a+"auto"]=false;
		}
		for (b=1;b<=8;b++)
		{
			if ((json.RA["RON"+a] & (1<<(b-1))) == 0 && (json.RA["ROFF"+a] & (1<<(b-1))) == (1<<(b-1)))
			{
				$scope["r"+a+b+"on"]=false;
				$scope["r"+a+b+"off"]=false;
				$scope["r"+a+b+"auto"]=true;
				if ((json.RA["R"+a] & (1<<(b-1))) == (1<<(b-1)))
					$scope["r"+a+b+"autoclass"]="relaygreenclass";
				else
					$scope["r"+a+b+"autoclass"]="relayredclass";
				$scope["r"+a+b+"onclass"]="relayblankclass";
				$scope["r"+a+b+"offclass"]="relayblankclass";
			}
			if ((json.RA["RON"+a] & (1<<(b-1))) == (1<<(b-1)))
			{
				$scope["r"+a+b+"onclass"]="relaygreenclass";
				$scope["r"+a+b+"offclass"]="relayblankclass";
				$scope["r"+a+b+"autoclass"]="relayblankclass";
				$scope["r"+a+b+"on"]=true;
				$scope["r"+a+b+"off"]=false;
				$scope["r"+a+b+"auto"]=false;
			}
			if ((json.RA["ROFF"+a] & (1<<(b-1))) == 0)
			{
				$scope["r"+a+b+"onclass"]="relayblankclass";
				$scope["r"+a+b+"offclass"]="relayredclass";
				$scope["r"+a+b+"autoclass"]="relayblankclass";
				$scope["r"+a+b+"on"]=false;
				$scope["r"+a+b+"off"]=true;
				$scope["r"+a+b+"auto"]=false;
			}
		}			
	}
}

function loaddefaultlabels()
{
	if (jsonlabels==null) jsonlabels=new Object();
	if (jsonlabels.RA==null) jsonlabels.RA=new Object();
	jsonlabels.RA.T1N = "Temp 1";
	jsonlabels.RA.T2N = "Temp 2";
	jsonlabels.RA.T3N = "Temp 3";
	jsonlabels.RA.PHN = "pH";
	jsonlabels.RA.ATOHIGHN = "ATO High";
	jsonlabels.RA.ATOLOWN = "ATO Low";
	jsonlabels.RA.PWMD1N = "Daylight Channel";
	jsonlabels.RA.PWMA1N = "Actinic Channel";
	jsonlabels.RA.ALARMN = "Alarm";
	jsonlabels.RA.LEAKN = "Leak";
	jsonlabels.RA.PWMD2N = "Daylight Channel 2";
	jsonlabels.RA.PWMA2N = "Actinic Channel 2";
	jsonlabels.RA.PWME0N = "Dimming Channel 0";
	jsonlabels.RA.PWME1N = "Dimming Channel 1";
	jsonlabels.RA.PWME2N = "Dimming Channel 2";
	jsonlabels.RA.PWME3N = "Dimming Channel 3";
	jsonlabels.RA.PWME4N = "Dimming Channel 4";
	jsonlabels.RA.PWME5N = "Dimming Channel 5";
	jsonlabels.RA.C0N = "Custom Var 0:";
	jsonlabels.RA.C1N = "Custom Var 1:";
	jsonlabels.RA.C2N = "Custom Var 2:";
	jsonlabels.RA.C3N = "Custom Var 3:";
	jsonlabels.RA.C4N = "Custom Var 4:";
	jsonlabels.RA.C5N = "Custom Var 5:";
	jsonlabels.RA.C6N = "Custom Var 6:";
	jsonlabels.RA.C7N = "Custom Var 7:";
	jsonlabels.RA.RFWN = "White Channel";
	jsonlabels.RA.RFRBN = "Royal Blue Channel";
	jsonlabels.RA.RFRN = "Red Channel";
	jsonlabels.RA.RFGN = "Green Channel";
	jsonlabels.RA.RFBN = "Blue Channel";
	jsonlabels.RA.RFIN = "Intensity Channel";
	jsonlabels.RA.SALN = "Salinity";
	jsonlabels.RA.ORPN = "ORP";
	jsonlabels.RA.PHEN = "pH Expansion";
	jsonlabels.RA.WLN = "Water Level";
	jsonlabels.RA.WL1N = "Water Level 1";
	jsonlabels.RA.WL2N = "Water Level 2";
	jsonlabels.RA.WL3N = "Water Level 3";
	jsonlabels.RA.WL4N = "Water Level 4";
	jsonlabels.RA.HUMN = "Humidity";
	jsonlabels.RA.PARN = "PAR";
	jsonlabels.RA.IO0N = "I/O Channel 0";
	jsonlabels.RA.IO1N = "I/O Channel 1";
	jsonlabels.RA.IO2N = "I/O Channel 2";
	jsonlabels.RA.IO3N = "I/O Channel 3";
	jsonlabels.RA.IO4N = "I/O Channel 4";
	jsonlabels.RA.IO5N = "I/O Channel 5";
	for (a=1;a<=8;a++)
	{
		jsonlabels.RA["R"+a+"N" ]= "Relay " + a;
		for (b=1;b<=8;b++)
		{
			jsonlabels.RA["R"+a+b+"N"] = "Relay " + a + b;
		}
	}
}
function loaddefaultvalues()
{
	if (json==null) json=new Object();
	if (json.RA==null) json.RA=new Object();
	json.RA.T1 = "0.0";
	json.RA.T2 = "0.0";
	json.RA.T3 = "0.0";
	json.RA.PH = "0.00";
	json.RA.ATOHIGH = "0";
	json.RA.ATOLOW = "0";
	json.RA.PWMD1 = "0";
	json.RA.PWMA1 = "0";
	json.RA.ALARM = "0";
	json.RA.LEAK = "0";
	json.RA.PWMD2 = "0";
	json.RA.PWMA2 = "0";
	json.RA.PWME0 = "0";
	json.RA.PWME1 = "0";
	json.RA.PWME2 = "0";
	json.RA.PWME3 = "0";
	json.RA.PWME4 = "0";
	json.RA.PWME5 = "0";
	json.RA.C0 = "0";
	json.RA.C1 = "0";
	json.RA.C2 = "0";
	json.RA.C3 = "0";
	json.RA.C4 = "0";
	json.RA.C5 = "0";
	json.RA.C6 = "0";
	json.RA.C7 = "0";
	json.RA.RFW = "0";
	json.RA.RFRB = "0";
	json.RA.RFR = "0";
	json.RA.RFG = "0";
	json.RA.RFB = "0";
	json.RA.RFI = "0";
	json.RA.SAL = "0.0";
	json.RA.ORP = "0";
	json.RA.PHE = "0.00";
	json.RA.WL = "0";
	json.RA.WL1 = "0";
	json.RA.WL2 = "0";
	json.RA.WL3 = "0";
	json.RA.WL4 = "0";
	json.RA.HUM = "0";
	json.RA.PAR = "0";
	json.RA.IO0 = "0";
	json.RA.IO1 = "0";
	json.RA.IO2 = "0";
	json.RA.IO3 = "0";
	json.RA.IO4 = "0";
	json.RA.IO5 = "0";	
}

function loadlabels($scope) {
	if (jsonlabels!=null)
	{
		$scope.t1n=jsonlabels.RA.T1N;
		$scope.t2n=jsonlabels.RA.T2N;
		$scope.t3n=jsonlabels.RA.T3N;
		$scope.phn=jsonlabels.RA.PHN;
		$scope.saln=jsonlabels.RA.SALN;
		$scope.orpn=jsonlabels.RA.ORPN;
		$scope.phen=jsonlabels.RA.PHEN;
		$scope.humn=jsonlabels.RA.HUMN;
		$scope.parn=jsonlabels.RA.PARN;
		$scope.wln=jsonlabels.RA.WLN;
		$scope.wl1n=jsonlabels.RA.WL1N;
		$scope.wl2n=jsonlabels.RA.WL2N;
		$scope.wl3n=jsonlabels.RA.WL3N;
		$scope.wl4n=jsonlabels.RA.WL4N;
		$scope.atohighn=jsonlabels.RA.ATOHIGHN;
		$scope.atolown=jsonlabels.RA.ATOLOWN;
		$scope.pwmd1n=jsonlabels.RA.PWMD1N;
		$scope.pwma1n=jsonlabels.RA.PWMA1N;
		$scope.alarmn=jsonlabels.RA.ALARMN;
		$scope.leakn=jsonlabels.RA.LEAKN;
		$scope.pwmd2n=jsonlabels.RA.PWMD2N;
		$scope.pwma2n=jsonlabels.RA.PWMA2N;
		$scope.pwme0n=jsonlabels.RA.PWME0N;
		$scope.pwme1n=jsonlabels.RA.PWME1N;
		$scope.pwme2n=jsonlabels.RA.PWME2N;
		$scope.pwme3n=jsonlabels.RA.PWME3N;
		$scope.pwme4n=jsonlabels.RA.PWME4N;
		$scope.pwme5n=jsonlabels.RA.PWME5N;
		$scope.c0n=jsonlabels.RA.C0N;
		$scope.c1n=jsonlabels.RA.C1N;
		$scope.c2n=jsonlabels.RA.C2N;
		$scope.c3n=jsonlabels.RA.C3N;
		$scope.c4n=jsonlabels.RA.C4N;
		$scope.c5n=jsonlabels.RA.C5N;
		$scope.c6n=jsonlabels.RA.C6N;
		$scope.c7n=jsonlabels.RA.C7N;
		$scope.rfwn=jsonlabels.RA.RFWN;
		$scope.rfrbn=jsonlabels.RA.RFRBN;
		$scope.rfrn=jsonlabels.RA.RFRN;
		$scope.rfgn=jsonlabels.RA.RFGN;
		$scope.rfbn=jsonlabels.RA.RFBN;
		$scope.rfin=jsonlabels.RA.RFIN;
		$scope.io0n=jsonlabels.RA.IO0N;
		$scope.io1n=jsonlabels.RA.IO1N;
		$scope.io2n=jsonlabels.RA.IO2N;
		$scope.io3n=jsonlabels.RA.IO3N;
		$scope.io4n=jsonlabels.RA.IO4N;
		$scope.io5n=jsonlabels.RA.IO5N;
		for (a=1; a<=8; a++)
		{
			$scope["r"+a+"n"]=jsonlabels.RA["R"+a+"N"];
			for (b=1; b<=8; b++)
			{
				$scope["r"+a+b+"n"]=jsonlabels.RA["R"+a+b+"N"];
			}
		}
	}
}

function setjson(id, value) {
	//console.log(id);
	for (item in Object.keys(json.RA))
	{
		if (Object.keys(json.RA)[item] == id)
		{
			json.RA[Object.keys(json.RA)[item]]=value;
			return;	
		}
	}
}

function changeactivecontroller($scope, $localStorage, $rootScope, id)
{
	$scope.activecontroller=$localStorage.controllers[id].name;
	$localStorage.activecontroller=$scope.activecontroller;
	$localStorage.activecontrollerid=id;
	json=$localStorage.jsonarray[id];
	$localStorage.json=json;
	jsonlabels=$localStorage.jsonlabelsarray[id];
	if (jsonlabels==null) loaddefaultlabels();
	cloudusername=$localStorage.controllers[$localStorage.activecontrollerid].cloudusername;
	cloudpassword=$localStorage.controllers[$localStorage.activecontrollerid].cloudpassword;
	MQTTdisconnect();
	$rootScope.$broadcast('msg', 'paramsok');
	$rootScope.$broadcast('msg', 'popoverclose');
	if (mqtt==null && cloudusername!=null && cloudpassword!=null)
	{
		$scope.cloudstatus="Connecting...";
		json.RA.cloudstatus="Connecting...";
		MQTTconnect();
		return;
	}
}

// create the chart when all data is loaded
function CreateChart($scope, container)
{
	if (names.length==0)
	{
		ons.notification.alert({message: 'At least one parameter needs to be checked.' });
		return false;
	}
	$scope.showgraphlist=false;
	modal.show();
	$("#"+container).html("");
	$("#"+container).css("height",($(window).height()-15)+"px");
	$("#"+container).css("margin-top","-200px");
	Highcharts.setOptions({
		global: {
			useUTC: false
		}
	});
	seriesOptions = [],
	seriesCounter = 0,
	seriesID = 0;

	$.each(names, function (i, name) {
		$.getJSON('http://forum.reefangel.com/status/jsonp.aspx?id=' + json.RA.ID + '&filter=' + name.toLowerCase() + '&callback=?', function (data) {
			var pcolor;
			var tname;
			var ydec;
			var yunit;
			if (name == "PH") {
				pcolor = '#669900'
				tname = $scope.phn
				ydec = 2
				yunit = 'pH'
			}
			else if (name == "PHE") {
				pcolor = '#447700'
				tname = $scope.phen
				ydec = 2
				yunit = 'pH'
			}
			else if (name == "SAL") {
				pcolor = '#000066'
				tname = $scope.saln
				ydec = 1
				yunit = 'ppt'
			}
			else if (name == "ORP") {
				pcolor = '#330000'
				tname = $scope.orpn
				ydec = 0
				yunit = 'mV'
			}
			else if (name == "T1") {
				pcolor = '#FF0000'
				tname = $scope.t1n
				ydec = 1
				yunit = '°'
			}
			else if (name == "T2") {
				pcolor = '#FF8800'
				tname = $scope.t2n
				ydec = 1
				yunit = '°'
			}
			else if (name == "T3") {
				pcolor = '#9900CC'
				tname = $scope.t3n
				ydec = 1
				yunit = '°'
			}
			else if (name == "WL") {
				pcolor = '#0033FF'
				tname = $scope.wln
				ydec = 1
				yunit = '°'
			}
			else if (name == "WL1") {
				pcolor = '#0033FF'
				tname = $scope.wl1n
				ydec = 1
				yunit = '°'
			}
			else if (name == "WL2") {
				pcolor = '#0033FF'
				tname = $scope.wl2n
				ydec = 1
				yunit = '°'
			}
			else if (name == "WL3") {
				pcolor = '#0033FF'
				tname = $scope.wl3n
				ydec = 1
				yunit = '°'
			}
			else if (name == "WL4") {
				pcolor = '#0033FF'
				tname = $scope.wl4n
				ydec = 1
				yunit = '°'
			}
			else if (name == "PAR") {
				pcolor = '#0033FF'
				tname = $scope.parn
				ydec = 1
				yunit = '°'
			}
			else if (name == "HUM") {
				pcolor = '#0033FF'
				tname = $scope.humn
				ydec = 1
				yunit = '°'
			}
			else {
				pcolor = '#FF0000'
				tname = ''
				ydec = 0
				yunit = ''
			}
			if (data.length) {
				seriesOptions[seriesID] = {
					dataGrouping: {
						smoothed: true
					},
					name: tname,
					color: pcolor,
					tooltip: {
						yDecimals: ydec,
						ySuffix: yunit
					},
					data: data
				};
				seriesID++;
			}
			// As we're loading the data asynchronously, we don't know what order it will arrive. So
			// we keep a counter and create the chart when all the data is loaded.
			seriesCounter++;

			if(data.length==0) 
			{
				modal.hide();
				ons.notification.alert({message: 'No data to display' });
			}
			else
				if (seriesCounter == names.length) {
					DrawChart(container);
			}
		});
	});
}

// create the chart when all data is loaded
function DrawChart(container) {

	chart = new Highcharts.StockChart({
		chart: {
			renderTo: container,
			type: 'spline'
		},
		credits: {
			enabled: false
		},

		legend: {
			enabled: true,
			//align: 'right',
			//backgroundColor: '#FCFFC5',
			borderColor: 'black',
			borderWidth: 2,
			//layout: 'vertical',
			verticalAlign: 'top',
			y: 100,
			shadow: true
		},


		rangeSelector: {
			buttons: [{
				type: 'minute',
				count: 60,
				text: '1h'
			}, {
				type: 'minute',
				count: 720,
				text: '12h'
			}, {
				type: 'day',
				count: 1,
				text: '1d'
			}, {
				type: 'day',
				count: 3,
				text: '3d'
			}, {
				type: 'all',
				text: '7d'
			}],
			selected: 2,
			inputEnabled: false
		},

		navigator: {
			xAxis: {
				type: 'datetime',
				maxZoom: 3600000, // 1 hour
				dateTimeLabelFormats: { // don't display the dummy year
					second: '%I:%M:%S %p',
					minute: '%I:%M %p',
					hour: '%b/%e',
					day: '%b/%e',
					week: '%b/%e'
				}
			}

		},
		xAxis: {
			type: 'datetime',
			maxZoom: 3600000, // 1 hour
			dateTimeLabelFormats: { // don't display the dummy year
				second: '%I:%M:%S %p',
				minute: '%I:%M %p',
				hour: '%I:%M %p',
				day: '%b/%e',
				week: '%b/%e'
			}
		},

		yAxis: {

			plotLines: [{
				value: 0,
				width: 1,
				color: 'silver'
			}]
		},

		tooltip: {
			borderColor: 'silver',
			xDateFormat: '%A, %b %e, %l:%M %p',
			pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b><br/>'
		},

		series: seriesOptions
	});
	modal.hide();

}	

function getbytevalue(d,i)
{
	return parseInt(d.substr(i*2,2),16);
}

function getintvalue(d,i)
{
	return parseInt(d.substr((i+1)*2,2) + d.substr(i*2,2),16);
}

function SaveMemory(s,l)
{
	MemString.push(s);
	MemURL.push(l);
}

function SaveMQTTMemory(cmd)
{
	if (cmd.substring(0,2)=='mb')
	{
		message = new Paho.MQTT.Message(cmd.replace("mb","mb:").replace(",",":"));
		updatestring="MBOK:";
	}			
	if (message!=null)
	{
		modal.show();
		ourtimer=currenttimeout(function() {
			modal.hide();
			ons.notification.alert({message: 'Timeout. Please try again.', title: 'Reef Angel Controller' });
		}, 8000);			
		message.destinationName = cloudusername + "/in";
		mqtt.send(message);
	}
}

function MQTTconnect() {
	console.log("Connecting...");
	mqtt = new Paho.MQTT.Client(
					"forum.reefangel.com",
					9001,
					"web_" + parseInt(Math.random() * 100,
					10));
	var options = {
		timeout: 3,
		useSSL: false,
		cleanSession: true,
		onSuccess: onConnect,
		onFailure: function (message) {
			console.log(message.errorMessage);
			if (parametersscope.cloudenabled)
			{
				parametersscope.cloudstatus="Disconnected";
				relayscope.cloudstatus="Disconnected";
				if (json!=null)
					if (json.RA!=null)
						json.RA.cloudstatus="Disconnected";
			}
			mqtt=null;
		}
	};

	mqtt.onConnectionLost = onConnectionLost;
	mqtt.onMessageArrived = onMessageArrived;

	options.userName = cloudusername;
	options.password = cloudpassword;
	mqtt.connect(options);
}

function MQTTdisconnect() {
	console.log("Disconnected");
	if (mqtt!=null)	mqtt.disconnect();
	mqtt=null;
}

function onConnect() {
	parametersscope.cloudstatus="Connected";
	relayscope.cloudstatus="Connected";
	if (json!=null)
		if (json.RA!=null)
			json.RA.cloudstatus="Connected";
	parametersscope.$apply();
	mqtt.subscribe(cloudusername + "/out");
	message = new Paho.MQTT.Message("all:0");
	message.destinationName = cloudusername + "/in";
	mqtt.send(message);
}

function onConnectionLost(response) {
	console.log("Connection Lost");
	if (parametersscope.cloudenabled)
	{
		parametersscope.cloudstatus="Disconnected";
		relayscope.cloudstatus="Disconnected";
		mqtt=null;
		if (json!=null)
			if (json.RA!=null)
				json.RA.cloudstatus="Disconnected";
	}
};

function onMessageArrived(message) {

	var topic = message.destinationName;
	var payload = message.payloadString;
	console.log(message.payloadString);
	json.RA.lastrefresh=new Date().toLocaleString();
	json.RA.ID=cloudusername;
	parametersscope.lastupdated=json.RA.lastrefresh;
	relayscope.lastupdated=json.RA.lastrefresh;
	parametersscope.forumid=json.RA.ID;
	if (message.payloadString.indexOf("DATE:")!=-1)
	{
		currenttimeout.cancel( ourtimer );
		modal.hide();
		ons.notification.alert({message: 'Date/Time synced', title: 'Reef Angel Controller' });
	}
	if (message.payloadString.indexOf("V:")!=-1)
	{
		currenttimeout.cancel( ourtimer );
		modal.hide();
		ons.notification.alert({message: message.payloadString.replace("V:", "Version: "), title: 'Reef Angel Controller' });
	}
	if (message.payloadString.indexOf("R1:")!=-1 || message.payloadString.indexOf("R2:")!=-1 || message.payloadString.indexOf("R3:")!=-1 || message.payloadString.indexOf("R4:")!=-1 || message.payloadString.indexOf("R5:")!=-1 || message.payloadString.indexOf("R6:")!=-1 || message.payloadString.indexOf("R7:")!=-1 || message.payloadString.indexOf("R8:")!=-1 || message.payloadString.indexOf("ROFF")!=-1 ||  message.payloadString.indexOf("RON")!=-1)
	{
		UpdateCloudParam(message,"R1:","r1",1,0);
		UpdateCloudParam(message,"ROFF1:","roff1",1,0);
		UpdateCloudParam(message,"RON1:","ron1",1,0);
		UpdateCloudParam(message,"R2:","r2",1,0);
		UpdateCloudParam(message,"ROFF2:","roff2",1,0);
		UpdateCloudParam(message,"RON2:","ron2",1,0);
		UpdateCloudParam(message,"R3:","r3",1,0);
		UpdateCloudParam(message,"ROFF3:","roff3",1,0);
		UpdateCloudParam(message,"RON3:","ron3",1,0);
		UpdateCloudParam(message,"R4:","r4",1,0);
		UpdateCloudParam(message,"ROFF4:","roff4",1,0);
		UpdateCloudParam(message,"RON4:","ron4",1,0);
		UpdateCloudParam(message,"R5:","r5",1,0);
		UpdateCloudParam(message,"ROFF5:","roff5",1,0);
		UpdateCloudParam(message,"RON5:","ron5",1,0);
		UpdateCloudParam(message,"R6:","r6",1,0);
		UpdateCloudParam(message,"ROFF6:","roff6",1,0);
		UpdateCloudParam(message,"RON6:","ron6",1,0);
		UpdateCloudParam(message,"R7:","r7",1,0);
		UpdateCloudParam(message,"ROFF7:","roff7",1,0);
		UpdateCloudParam(message,"RON7:","ron7",1,0);
		UpdateCloudParam(message,"R8:","r8",1,0);
		UpdateCloudParam(message,"ROFF8:","roff8",1,0);
		UpdateCloudParam(message,"RON8:","ron8",1,0);
		CheckRelay(relayscope);
	}
	UpdateCloudParam(message,"ATOLOW:","atolow",1,0);
	UpdateCloudParam(message,"ATOHIGH:","atohigh",1,0);
	UpdateCloudParam(message,"ALARM:","alarm",1,0);
	if (message.payloadString.indexOf("EM:")!=-1 && message.payloadString.indexOf("REM:")==-1)
	{
		UpdateCloudParam(message,"EM:","em",1,0);
		CheckExpansion(parametersscope);
	}
	if (message.payloadString.indexOf("EM1:")!=-1)
	{
		UpdateCloudParam(message,"EM1:","em1",1,0);
		CheckExpansion(parametersscope);
	}
	UpdateCloudParam(message,"REM:","rem",1,0);
	UpdateCloudParam(message,"BID:","bid",1,0);
	if (message.payloadString.indexOf("AF:")!=-1)
	{
		var oldaf=json.RA.AF;
		UpdateCloudParam(message,"AF:","af",1,0);
		CheckFlags(parametersscope);
		if (oldaf!=json.RA.AF)
		{
			currenttimeout.cancel( ourtimer );
			modal.hide();
			if ((oldaf & 1<<0)==1<<0 && (json.RA.AF & 1<<0)==0)
				ons.notification.alert({message: 'ATO Timeout Cleared', title: 'Reef Angel Controller' });
			if ((oldaf & 1<<1)==1<<1 && (json.RA.AF & 1<<1)==0)
				ons.notification.alert({message: 'Overheat Cleared', title: 'Reef Angel Controller' });
			if ((oldaf & 1<<3)==1<<3 && (json.RA.AF & 1<<3)==0)
				ons.notification.alert({message: 'Leak Cleared', title: 'Reef Angel Controller' });
		}
	}
	if (message.payloadString.indexOf("SF:")!=-1)
	{
		var oldsf=json.RA.SF;
		UpdateCloudParam(message,"SF:","sf",1,0);
		CheckFlags(parametersscope);
		if (oldsf!=json.RA.SF)
		{
			currenttimeout.cancel( ourtimer );
			modal.hide();
			if ((oldsf & 1<<0)==0 && (json.RA.SF & 1<<0)==1<<0)
				ons.notification.alert({message: 'Lights On', title: 'Reef Angel Controller' });
			if ((oldsf & 1<<1)==0 && (json.RA.SF & 1<<1)==1<<1)
				ons.notification.alert({message: 'Feeding Mode Started', title: 'Reef Angel Controller' });
			if ((oldsf & 1<<2)==0 && (json.RA.SF & 1<<2)==1<<2)
				ons.notification.alert({message: 'Water Change Mode Started', title: 'Reef Angel Controller' });
			if ((oldsf & 1<<0)==1<<0 && (json.RA.SF & 1<<0)==0)
				ons.notification.alert({message: 'Lights Cancel', title: 'Reef Angel Controller' });
			if ((oldsf & 1<<1)==1<<1 && (json.RA.SF & 1<<1)==0)
				ons.notification.alert({message: 'Feeding Mode Ended', title: 'Reef Angel Controller' });
			if ((oldsf & 1<<2)==1<<2 && (json.RA.SF & 1<<2)==0)
				ons.notification.alert({message: 'Water Change Mode Ended', title: 'Reef Angel Controller' });
		}
	}
	UpdateCloudParam(message,"PWMD:","pwmd",1,0);
	UpdateCloudParam(message,"PWMA:","pwma",1,0);
	UpdateCloudParam(message,"PWMD2:","pwmd2",1,0);
	UpdateCloudParam(message,"PWMA2:","pwma2",1,0);
	UpdateCloudParam(message,"WL:","wl",1,0);
	UpdateCloudParam(message,"WL1:","wl1",1,0);
	UpdateCloudParam(message,"WL2:","wl2",1,0);
	UpdateCloudParam(message,"WL3:","wl3",1,0);
	UpdateCloudParam(message,"WL4:","wl4",1,0);
	UpdateCloudParam(message,"HUM:","hum",1,1);
	UpdateCloudParam(message,"DCT:","dct",1,0);
	if (message.payloadString.indexOf("DCM:")!=-1 || message.payloadString.indexOf("DCS:")!=-1 || message.payloadString.indexOf("DCD:")!=-1)
	{
		UpdateCloudParam(message,"DCM:","dcm",1,0);
		UpdateCloudParam(message,"DCS:","dcs",1,0);
		UpdateCloudParam(message,"DCD:","dcd",1,0);
		parametersscope.dcm = rfmodes[json.RA.DCM];
		parametersscope.dcmodecolor = rfmodecolors[json.RA.DCM];
		parametersscope.dcimage = rfimages[json.RA.RFM];
	}
	UpdateCloudParam(message,"PWME0:","pwme0",1,0);
	UpdateCloudParam(message,"PWME1:","pwme1",1,0);
	UpdateCloudParam(message,"PWME2:","pwme2",1,0);
	UpdateCloudParam(message,"PWME3:","pwme3",1,0);
	UpdateCloudParam(message,"PWME4:","pwme4",1,0);
	UpdateCloudParam(message,"PWME5:","pwme5",1,0);
	if (message.payloadString.indexOf("PWMDO:")!=-1 || message.payloadString.indexOf("PWMAO:")!=-1 || message.payloadString.indexOf("PWMD2O:")!=-1 || message.payloadString.indexOf("PWMA2O:")!=-1 || message.payloadString.indexOf("PWME0O:")!=-1 || message.payloadString.indexOf("PWME1O:")!=-1 || message.payloadString.indexOf("PWME2O:")!=-1 || message.payloadString.indexOf("PWME3O:")!=-1 || message.payloadString.indexOf("PWME4O:")!=-1 || message.payloadString.indexOf("PWME5O:")!=-1)
	{
		UpdateCloudParam(message,"PWMDO:","pwmdo",1,0);
		UpdateCloudParam(message,"PWMAO:","pwmao",1,0);
		UpdateCloudParam(message,"PWMD2O:","pwmd2o",1,0);
		UpdateCloudParam(message,"PWMA2O:","pwma2o",1,0);
		UpdateCloudParam(message,"PWME0O:","pwme0o",1,0);
		UpdateCloudParam(message,"PWME1O:","pwme1o",1,0);
		UpdateCloudParam(message,"PWME2O:","pwme2o",1,0);
		UpdateCloudParam(message,"PWME3O:","pwme3o",1,0);
		UpdateCloudParam(message,"PWME4O:","pwme4o",1,0);
		UpdateCloudParam(message,"PWME5O:","pwme5o",1,0);
		CheckDimmingOverride(parametersscope);
	}
	UpdateCloudParam(message,"AIW:","aiw",1,0);
	UpdateCloudParam(message,"AIB:","aib",1,0);
	UpdateCloudParam(message,"AIRB:","airb",1,0);
	if (message.payloadString.indexOf("RFM:")!=-1 || message.payloadString.indexOf("RFS:")!=-1 || message.payloadString.indexOf("RFD:")!=-1)
	{
		UpdateCloudParam(message,"RFM:","rfm",1,0);
		UpdateCloudParam(message,"RFS:","rfs",1,0);
		UpdateCloudParam(message,"RFD:","rfd",1,0);
		parametersscope.rfm = rfmodes[json.RA.RFM];
		parametersscope.rfmodecolor = rfmodecolors[json.RA.RFM];
		parametersscope.rfimage = rfimages[json.RA.RFM];
	}
	UpdateCloudParam(message,"RFW:","rfw",1,0);
	UpdateCloudParam(message,"RFRB:","rfrb",1,0);
	UpdateCloudParam(message,"RFR:","rfr",1,0);
	UpdateCloudParam(message,"RFG:","rfg",1,0);
	UpdateCloudParam(message,"RFB:","rfb",1,0);
	UpdateCloudParam(message,"RFI:","rfi",1,0);
	if (message.payloadString.indexOf("RFWO:")!=-1 || message.payloadString.indexOf("RFRBO:")!=-1 || message.payloadString.indexOf("RFRO:")!=-1 || message.payloadString.indexOf("RFGO:")!=-1 || message.payloadString.indexOf("RFBO:")!=-1 || message.payloadString.indexOf("RFIO:")!=-1) 
	{
		UpdateCloudParam(message,"RFWO:","rfwo",1,0);
		UpdateCloudParam(message,"RFRBO:","rfrbo",1,0);
		UpdateCloudParam(message,"RFRO:","rfro",1,0);
		UpdateCloudParam(message,"RFGO:","rfgo",1,0);
		UpdateCloudParam(message,"RFBO:","rfbo",1,0);
		UpdateCloudParam(message,"RFIO:","rfio",1,0);
		CheckRadionOverride(parametersscope);
	}
	if (message.payloadString.indexOf("IO:")!=-1)
	{
		UpdateCloudParam(message,"IO:","io",1,0);
		CheckIO(parametersscope);
	}
	UpdateCloudParam(message,"LEAK:","leak",1,0);
	if (message.payloadString.indexOf("C0:")!=-1 || message.payloadString.indexOf("C1:")!=-1 || message.payloadString.indexOf("C2:")!=-1 || message.payloadString.indexOf("C3:")!=-1 || message.payloadString.indexOf("C4:")!=-1 || message.payloadString.indexOf("C5:")!=-1 || message.payloadString.indexOf("C6:")!=-1 || message.payloadString.indexOf("C7:")!=-1)
	{
		UpdateCloudParam(message,"C0:","c0",1,0);
		UpdateCloudParam(message,"C1:","c1",1,0);
		UpdateCloudParam(message,"C2:","c2",1,0);
		UpdateCloudParam(message,"C3:","c3",1,0);
		UpdateCloudParam(message,"C4:","c4",1,0);
		UpdateCloudParam(message,"C5:","c5",1,0);
		UpdateCloudParam(message,"C6:","c6",1,0);
		UpdateCloudParam(message,"C7:","c7",1,0);
		CheckCvar(parametersscope);
	}
	UpdateCloudParam(message,"T1:","t1",10,1);
	UpdateCloudParam(message,"T2:","t2",10,1);
	UpdateCloudParam(message,"T3:","t3",10,1);
	UpdateCloudParam(message,"PH:","ph",100,2);
	UpdateCloudParam(message,"ORP:","orp",1,0);
	UpdateCloudParam(message,"SAL:","sal",10,1);
	UpdateCloudParam(message,"PHE:","phe",100,2);
	UpdateCloudParam(message,"PAR:","par",1,0);
	UpdateCloudParam(message,"CEXP0:","cexp0",1,0);
	UpdateCloudParam(message,"CEXP1:","cexp1",1,0);
	UpdateCloudParam(message,"CEXP2:","cexp2",1,0);
	UpdateCloudParam(message,"CEXP3:","cexp3",1,0);
	UpdateCloudParam(message,"CEXP4:","cexp4",1,0);
	UpdateCloudParam(message,"CEXP5:","cexp5",1,0);
	UpdateCloudParam(message,"CEXP6:","cexp6",1,0);
	UpdateCloudParam(message,"CEXP7:","cexp7",1,0);
	if (message.payloadString.indexOf("MR")!=-1)
	{
		memoryraw+=message.payloadString.substr(5,message.payloadString.length);
		//console.log(memoryraw);
	}
	UpdateCloudParam(message,"MR21:","mr21",1,0);
	UpdateCloudParam(message,"MBOK:","mbok",1,0);
	currentstorage.json=json;
	currentstorage.jsonarray[currentstorage.activecontrollerid]=json;
	parametersscope.$apply();
	relayscope.$apply();
};

function UpdateCloudParam(message,id, element, division, decimal)
{
	if (message.payloadString.indexOf(id)!=-1)
	{
		parametersscope[element]=(message.payloadString.replace(id,"")/division).toFixed(decimal);
		//if (json.RA[id.replace(":","")]==null) json.RA.push(id.replace(":",""),0);
		json.RA[id.replace(":","")]=message.payloadString.replace(id,"");
		if (updatestring==id)
		{
			updatestring="";
			currenttimeout.cancel( ourtimer );
			modal.hide();
			//console.log(id);
			if (id=="PWMAO:" || id=="PWMDO:" || id=="PWMA2O:" || id=="PWMD2O:" || id=="PWME0O:" || id=="PWME1O:" || id=="PWME2O:" || id=="PWME3O:" || id=="PWME4O:" || id=="PWME5O:")
				tabbar.loadPage('dimming.html');
			else if (id=="RFWO:" || id=="RFRBO:" || id=="RFRO:" || id=="RFGO:" || id=="RFBO:" || id=="RFIO:" || id=="RFM:" || id=="RFS:" || id=="RFD:")
				tabbar.loadPage('rf.html');
			else if (id=="DCM:" || id=="DCS:" || id=="DCD:")
				tabbar.loadPage('dcpump.html');
			else if (id=="C0:" || id=="C1:" || id=="C2:" || id=="C3:" || id=="C4:" || id=="C5:" || id=="C6:" || id=="C7:")
				tabbar.loadPage('customvar.html');
			else if (id=="RON1:" || id=="RON2:" || id=="RON3:" || id=="RON4:" || id=="RON5:" || id=="RON6:" || id=="RON7:" || id=="RON8:" || id=="ROFF1:" || id=="ROFF2:" || id=="ROFF3:" || id=="ROFF4:" || id=="ROFF5:" || id=="ROFF6:" || id=="ROFF7:" || id=="ROFF8:")
				console.log();
			else if (message.payloadString.indexOf("MR21:")!=-1)
				internalmemoryrootscope.$broadcast('msg', 'memoryrawok');
			else if (id=="MBOK:")
			{
				internalmemoryscope.memoryresult+=": OK\n";
				if (memindex<(MemString.length-1))
				{
					modal.show();
					memindex++;
					console.log(MemURL[memindex]);
					internalmemoryscope.memoryresult+=MemString[memindex];
					SaveMQTTMemory(MemURL[memindex]);
				}
			}
			else
				ons.notification.alert({message: 'Updated', title: 'Reef Angel Controller' });
		}
	}
}

Number.prototype.padLeft = function(base,chr){
   var  len = (String(base || 10).length - String(this).length)+1;
   return len > 0? new Array(len).join(chr || '0')+this : this;
}

Number.prototype.pad = function(size) {
      var s = String(this);
      while (s.length < (size || 2)) {s = "0" + s;}
      return s;
    }
	