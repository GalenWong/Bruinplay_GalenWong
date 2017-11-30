var express = require("express");
var fs = require('fs');
var json = require('./songs.json');
var bodyParser = require('body-parser');
var formidable = require('formidable');

const ytdl = require('ytdl-core');


var app = express();
var Songs = initialSongs();

app.set('view engine', 'hbs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var history=[];

app.listen(3000, '0.0.0.0',(request, response) => {
	console.log("Server is listening on port 3000. Go to http://localhost:3000/");
});

app.get("/", (request, response) => {
	response.render("home", {
		title: "BruinPlay",
		content: "Hello, World!",
		songs:Songs
	});
});

app.get("/search/:keyword",(request,response)=>{
	var keyword = request.params.keyword;
	console.log(keyword);
	var found = [];
	for(var i = 0; i<Songs.length;i++){
		if(Songs[i]["title"].toLowerCase().indexOf(keyword.toLowerCase())!==-1 || Songs[i]["artistName"].toLowerCase().indexOf(keyword.toLowerCase())!==-1){
			found.push(Songs[i]);
		}
	}
	response.render("search", {
		title: "BruinPlay - Search Result - "+keyword,
		songs:found,
		key:keyword
	});

});

app.post("/updatehistory", (request ,response)=>{
	for(var j = 0; j < history.length; j++){
		if(history[j].title===request.body.title && history[j].artist===request.body.artist && history[j].address===request.body.address){
			history.splice(j,1);
		}
	}
	history.push(request.body);
	var result = "";
	for(var i = history.length -1 ; i>=0; i--){
		result+='<li><a onclick="setnewplay(\''+history[i].title+'\',\''+history[i].artist+'\',\''+history[i].address+'\')">'+history[i].title+' - '+history[i].artist+'</a></li>';
	}
	response.send(result);
});

app.get("/album", (request, response) => {
	var albumlisted = [];
	for(var i = 0; i < json.length;i++){
		var looked = false;
		for(var j=0; j <albumlisted.length;j++){
			if(albumlisted[j]["albumName"] === json[i]["albumName"]){
				looked =true;
				break;
			}
		}
		if(!looked && json[i]["albumName"]!==null){
			albumlisted.push(json[i]);
		}
	}
	response.render("album", {
		title: "BruinPlay",
		content: "Hello, World!",
		songs:albumlisted
	});
});

app.get('/album/:album',function(request,response){
	var album = request.params.album;
	var albumsongs = [];
	for(var i = 0; i < Songs.length;i++){
		if(Songs[i]["albumName"]===album){
			albumsongs.push(Songs[i]);
		}
	}
	response.render("albumsongs",{
		title: "BruinPlay - Album: "+album,
		songs:albumsongs
	});
});

app.get("/artist", (request, response) => {
	var artistlisted = [];
	for(var i = 0; i < json.length;i++){
		var looked = false;
		for(var j=0; j <artistlisted.length;j++){
			if(artistlisted[j]["artistName"] === json[i]["artistName"]){
				looked =true;
				break;
			}
		}
		if(!looked){
			artistlisted.push(json[i]);
		}
	}
	response.render("artist", {
		title: "BruinPlay",
		content: "Hello, World!",
		songs:artistlisted
	});
});

app.get('/artist/:artist',function(request,response){
	var artist = request.params.artist;
	var artistsongs = [];
	for(var i = 0; i < Songs.length;i++){
		if(Songs[i]["artistName"]===artist){
			artistsongs.push(Songs[i]);
		}
	}
	response.render("artistsongs",{
		title: "BruinPlay - Artist: "+artist,
		songs:artistsongs
	});
});

app.get('/delete/:artist/:title', function(request, response){
	var singer = request.params.artist;
	var song = request.params.title;
	var link = request.params.link;
	for(var i =0; i < Songs.length; i++){
		if(json[i]['artistName']===singer && json[i]['title']===song){
			try{
				fs.unlink('./public'+json[i]["audioSrc"],function(err){console.log(err);});
			}
			catch(e){
				console.log("a web link cannot unlink");
			}
			json.splice(i,1);
		}
	}

	fs.readFile('songs.json',function(err,content){
	  if(err) throw err;
	  fs.writeFile('songs.json',JSON.stringify(json),function(err){
	    if(err) throw err;
	  });
	});
	
	response.redirect('back');
});

app.get('/duoerror',function(request,response){
	response.send('Please do not upload a source and give a link at the same time.');
});

app.get('/emptyfielderror',function(request,response){
	response.send('Title/Artist/Source is/are empty. Please fill in the gap.');
});

app.get('/notmp3error',function(request,response){
	response.send('You can only upload mp3 files as audio.');
});

app.get('/imgtypeerror',function(request,response){
	response.send('Only JPG/PNG format are supported for album cover so far...');
});

app.get('/invalidlinkerror',function(request,response){
	response.send('The link provided is not a validy youtube link');
});

app.post('/upload',function(request,response){
	var form = new formidable.IncomingForm();
	var dict = {};

	form.parse(request,function(err,fields,files){
		var name = fields.giventitle;
		var singer = fields.givenartist;
		var link = fields.givenurl;
		var source = files.givensource;
		var image = files.givencover;
		var album = fields.givenalbum;


		if(name===""||singer===""||(link===""&&source.size===0)){
			return response.redirect('/emptyfielderror');
		}

		var oldpath=files.givensource.path;
		var filename= name.replace(/ /g,"");
		var newpath = './public/songsupload/'+ singer.replace(/ /g,"")+'/'+ filename + '.' + file_ext;

		if(source.size!==0 && link!==""){
			return response.redirect('/duoerror');
		}

		if(!fs.existsSync('./public/songsupload/'+ singer.replace(/ /g,"")+'/')){
			fs.mkdirSync('./public/songsupload/'+ singer.replace(/ /g,"")+'/');
		}

		if(source.size===0){
			var reg=/youtube.com\/watch\?v=(.+)&?/;
			var result = reg.exec(link);
			
			if(!result){
				return response.redirect('/invalidlinkerror');
			}
			function wrap(){
				newpath = './public/songsupload/'+ singer.replace(/ /g,"")+'/'+ filename + '.opus';
				ytdl(link , {filter: 'audioonly'}).pipe(fs.createWriteStream(newpath));
			}
			wrap();
			dict["audioSrc"]=newpath.substring(1).replace("/public","");
			dict["title"]=name;
			dict["artistName"]=singer;
			if(album===""){
				dict["albumName"]=null;
			}
			else{
				dict["albumName"]=album;
			}

		}
		else{
			var file_ext = files.givensource.name.split('.').pop().toLowerCase();
			
		
			if(file_ext!=='mp3'){
				return response.redirect('/notmp3error');
			}

			fs.rename(oldpath,newpath,function(err){
				if (err) throw err;
				console.log("success!");
				dict["audioSrc"]=newpath.substring(1).replace("/public","");
				dict["title"]=name;
				dict["artistName"]=singer;
				if(album===""){
					dict["albumName"]=null;
				}
				else{
					dict["albumName"]=album;
				}
			});
		}
		
		
		if(image.size!==0){
			var imageoldpath=files.givencover.path;
			var img_file_ext = files.givencover.name.split('.').pop().toLowerCase();
			var img_name=name;
			var imgnewpath = './public/songsupload/'+singer.replace(/ /g,"")+'/'+img_name+'.'+img_file_ext;

			if(img_file_ext!=='png'&&
				img_file_ext!=='jpg'&&
				img_file_ext!=='jpeg'){
			 return response.redirect('/imgtypeerror');
			}
			fs.rename(imageoldpath,imgnewpath,function(err){
			if (err) throw err;
			});
			dict["audioImageSrc"]=imgnewpath.substring(1).replace("/public","");
		}
		else{
			dict["audioImageSrc"]=null;
		}

		json.push(dict);

		fs.readFile('songs.json',function(err,content){
		  if(err) throw err;
		  fs.writeFile('songs.json',JSON.stringify(json),function(err){
		    if(err) throw err;
		  });
		});

		setTimeout(function(){response.redirect('/');},2500);
	});
});



function initialSongs(){
	return json;
}