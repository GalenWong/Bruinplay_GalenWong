$(function(){
	$(".playerpause").hide();
	$(".uploadpage").hide();
	$(".player").hide();
	$("#history").hide();
	attachEventHandler();
	$('.boxes').focus();

});

var currentSong;
var progessID;
var nextSong;

function openNav() {
    document.getElementById("historylist").style.width = "300px";
}


function attachEventHandler(){
	$(".playerpause").on('click', pause);
	$(".playerplay").on('click',play);
	try
		{$('.content').on('click',function(){document.getElementById("historylist").style.width = "0px";});}
	catch(e){
		console.log("no history");
	}
	$('.boxes').bind('keydown',function(e){
		if(e.which===32){
			if($(".playerplay").css('display')==='none'){
				pause();
			}
			else{
				play();
			}
			return false;
		}
	});

	$('.searchbar').bind('keydown',function(e){
		if(e.which===13){
			console.log('enter');
			window.location.href = '/search/'+document.getElementsByClassName('searchbar')[0].value;
			return false;
		}
	});
	$(".playerforward").on('click',forward);
	$(".player").on('click',changeTime);
	$(".Add").on('click', function(){$(".uploadpage").show();});
	$(".uploadbox").on('click',function(){event.stopPropagation();});
	$(".uploadpage").on('click',function(){
		$(".uploadpage").hide();
	});
}
function forward(){
	setnewplay(nextSong[0],nextSong[1],nextSong[2]);
	event.stopPropagation();
}

function pause(){
	$(".playerplay").show();
	$(".playerpause").hide();
	currentSong.pause();
	clearInterval(progessID);
	event.stopPropagation();
}

function play(){
	try{
		currentSong.play();
		$(".playerpause").show();
		$(".playerplay").hide();
		progessID = setInterval(progess,50);
		event.stopPropagation();
	}
	catch(e){
		console.log("no currentSong");
	}
}

function setnewplay(title, artist, address){
	$('.player').show();
	$('#history').show();
	try{
		currentSong.pause();
	}
	catch(e){
		console.log("no currentSong");
	}
	document.getElementById('progess').style.width = 0 ;
	currentSong = 0;
	
	currentSong = document.getElementById("audiohold");
	currentSong.src=address;
	currentSong.play();
	
	currentSong.play();
	play();
	document.getElementById('song').innerHTML = title + ' - &nbsp';
	document.getElementById('singer').innerHTML = artist + ' - &nbsp';
	$(currentSong).on('loadedmetadata',function(){
		var min;
		var sec;
		var temp;
		temp = currentSong.duration;
		min = Math.floor(temp / 60);
		sec = Math.floor(temp%60)<10?"0"+Math.floor(temp%60):Math.floor(temp%60);
		document.getElementById('duration').innerHTML = String(min) + ":" + String(sec);
	});
	for(var i = 0 ;i<songlist.length;i++){
		if(i === songlist.length - 1){
			nextSong = [songlist[0][0], songlist[0][1], songlist[0][2]];
			break;
		}
		if(songlist[i][0]===title && songlist[i][1]===artist && songlist[i][2]===address){
			nextSong=[songlist[i+1][0],songlist[i+1][1], songlist[i+1][2]];
			break;
		}
	}
	var data = {};

	data.title = title;
	data.artist = artist;
	data.address= address;
	$.ajax({type:'POST', 
		data: JSON.stringify(data), 
		contentType: 'application/json', 
		url:'/updatehistory',
		success: function(data){
			document.getElementById('dropdown1').innerHTML = data;
		}});

}

function progess(){
	var temp = currentSong.currentTime;
	if(temp/currentSong.duration===1){
		clearInterval(progessID);
		setTimeout(function(){setnewplay(nextSong[0],nextSong[1],nextSong[2]);},1000);
	}
	var min;
	var sec;
	min = Math.floor(temp / 60);
	sec = Math.floor(temp%60)<10?"0"+Math.floor(temp%60):Math.floor(temp%60);
	document.getElementById('currentTime').innerHTML = String(min) + ":" + String(sec)+" / ";
	document.getElementById('progess').style.width = temp / currentSong.duration *100+ "%";
}


function changeTime(){
	var locale = event.clientX;
	try{
		currentSong.currentTime = currentSong.duration * locale/$(document).width();
	}
	catch(e){
		console.log("no currentSOng");
	}
}