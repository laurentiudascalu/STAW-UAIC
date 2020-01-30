var http = require('http');
var fs = require('fs');
var request = require('request');
var webp=require('webp-converter');
const resizeImg = require('resize-img');
var url = require('url');
var watermark = require('dynamic-watermark');
var zlib = require('zlib');
var mime = require('mime-types')
var sizeOf = require('image-size');
const http2 = require("http2");
var formidable = require('formidable');
var qs = require('querystring');
var cookieParser = require('cookie-parser');
var express = require('express'); 
var app = express(); 
var cors = require('cors');
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
app.use(cookieParser());
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/css'));
app.use(express.static(__dirname + '/images'));
app.use(express.static(__dirname + '/favicon.ico'));
const upload = require('express-fileupload');
const { check, validationResult } = require('express-validator');
const Window = require('window');
const window = new Window();
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
app.use(upload());

var download = function(uri, filename, callback){
  request.head(uri, function(err, res, body){
    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
};

const serverOptions = {
  key: fs.readFileSync('localhost-privkey.pem'),
  cert: fs.readFileSync('localhost-cert.pem')
};

var mysql = require('mysql');
var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database:"test"
});
con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});
app.get('/', function(req, rep){ 
	rep.render('home'); 
});
app.get('/edit', function(req, rep){
	var cookie = req.cookies['idUser'];
	var idDom = req.query.idDom;
	if (cookie != '' && idDom == 0){
		con.query("SELECT `id_user` from cookies where `cookie`= '"+cookie+"';", function (err, result, fields) {
			if (err) throw err;
			if (result.length!=0){
				id = result[0].id_user;
				rep.render('edit', {idDom: '0', x: id});
			}
		});		
	}else if(cookie != '' && idDom != 0){
		con.query("SELECT * from domenii where `id`= '"+idDom+"';", function (err, result, fields) {
			if (err) throw err;
			if (result.length!=0){
				rep.render('edit', {idDom: idDom,resEdit: result});
			}
		});
	} 
});
app.get('/login', function(req, rep){ 
	rep.render('login'); 
});
app.get('/error', function(req, rep){ 
	rep.render('error'); 
});
app.get('/checklogin', function(req, rep){
	var res='-1';
	con.query("SELECT `id_user` from cookies where `cookie`= '"+req.query.cookie+"';", function (err, result, fields) {
		if (err) throw err;
		if (result.length!=0){
			con.query("SELECT `nume` from useri where `id`= '"+result[0].id_user+"';", function (err, result1, fields) {
				if (err) throw err;
				if (result1.length!=0){
					res=result1[0].nume; 
				}
				rep.set('Content-Type', 'text/plain');
				rep.send(res);
			});
		}else{
			rep.set('Content-Type', 'text/plain');
			rep.send(res);
		}
	});
	
});
app.post('/autentificare', function(req, rep){
	var mail=req.body.mail;
	var parola=req.body.parola;
	con.query("SELECT * from useri where `mail`= '" + mail + "' AND `parola` = '" + parola + "';", function (err, result, fields) {
	    		if (err) throw err;
	    		if(result != []){
					var r = '';
   					var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
   					var charactersLength = characters.length;
				    for ( var i = 0; i < 16; i++ ) {
				      r += characters.charAt(Math.floor(Math.random() * charactersLength));
				    }
				    //introducem cookie in db pt id-ul userului
				    con.query("SELECT * from cookies where `id_user` = '" + result[0].id + "';", function (err, result1, fields) {
				    		if (result1.length != 0){
								con.query("UPDATE cookies SET `id_user` = '" + result[0].id + "', `cookie` = '" + r + "';", function (err, result2, fields) {
				    				if (err) throw err;
				    			});
				    		}
				    		if(result1.length == 0){
				    			con.query("INSERT into cookies(`id_user`, `cookie`) values ('" + result[0].id + "', '" + r + "');", function (err, result3, fields) {
				    				if (err) throw err;
				    			});
				    		}
				    });
	    			rep.cookie('idUser',r);
	    			rep.redirect('/#');
	    		}
	});
});
app.get('/contnou', function(req, rep){
	rep.render('contnou')		
});
app.post('/crearecont', function(req, rep){
	var nume=req.body.nume;
	var mail=req.body.mail;
	var parola=req.body.parola;
	var reparola=req.body.reparola;
	con.query("SELECT * from useri where `mail`='"+mail+"' and `parola`='"+parola+"';", function (err, result, fields) {
		if (err) throw err;
		if(result.length!=0){
			var res = "Exista deja cont";
			rep.set('Content-Type', 'text/plain');
			rep.send(res);
		}else{
			if(nume.length>=3 && parola==reparola){
				con.query("INSERT into useri (nume, mail, parola) VALUES ('"+nume+"', '"+mail+"', '"+parola+"');", function (err, result1, fields) {
					if (err) throw err;
					var r = '';
	   				var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	   				var charactersLength = characters.length;
					for ( var i = 0; i < 16; i++ ) {
					    r += characters.charAt(Math.floor(Math.random() * charactersLength));
					}
					con.query("SELECT `id` from useri where `mail`='"+mail+"' and `parola`='"+parola+"';", function (err, result2, fields) {
						if(result2.length!=0){
							con.query("INSERT into cookies(`id_user`, `cookie`) values ('" + result2[0].id + "', '" + r + "');", function (err, result2, fields) {
				    			if (err) throw err;
				    			rep.cookie('idUser',r);
				    			rep.redirect('/#');
				    		});
						}	
					});
				});
			}
		}
	});
});
app.post('/editDomeniu', function(req, rep){
	var domeniu=req.body.domeniu;
 	var urlImg=req.body.urlImg;
 	var ck = req.body.pierderi;
 	var pierderi = 0;
 	var id_domeniu = req.body.id_domeniu;
 	if (ck == 1){
 		pierderi = 1;
 	}
 	var detalii=req.body.detalii;
 	var ck2=req.body.resize;
 	var resize=0;
 	if (ck2 == 1){
 		resize = 1;
 	}
 	var ck3=req.body.watermark;
 	var watermark=0;
 	if (ck3 == 1){
 		watermark = 1;
 	}

	con.query("UPDATE domenii set `domeniu`='"+domeniu+"', `urlImg`='"+urlImg+"', `pierderi`='"+pierderi+"', `detalii`='"+detalii+"', `resize`='"+resize+"', `watermark`='"+watermark+"' where `id`='"+id_domeniu+"';", function (err, result, fields) {
	    	if (err) throw err;
	    	var dir = './domenii/'+id_domeniu;
	    	if(req.files!=null && req.files.length > 0){
	    		var file=req.files.imgUpload;
				var filename=file.name;
				file.mv(dir+'/logo.png');
	    	}
	    	rep.redirect('/#domenii');
	});
	rep.redirect('/#domenii');
});
app.post('/adDomeniu', function(req, rep){ 
 	var domeniu=req.body.domeniu;
 	var urlImg=req.body.urlImg;
 	var ck = req.body.pierderi;
 	var pierderi = 0;
 	var id_user = req.body.id_user;
 	if (ck == 1){
 		pierderi = 1;
 	}
 	var detalii=req.body.detalii;
 	var ck2=req.body.resize;
 	var resize=0;
 	if (ck2 == 1){
 		resize = 1;
 	}
 	var ck3=req.body.watermark;
 	var watermark=0;
 	if (ck3 == 1){
 		watermark = 1;
 	}
 	con.query("INSERT INTO domenii (id_user, domeniu, urlImg, pierderi, detalii, resize, watermark) VALUES ('"+ id_user + "', '" + domeniu + "', '" + urlImg +"', '" + pierderi + "', '" + detalii + "', '" + resize + "', '" + watermark + "');", function (err, result, fields) {
	    	if (err) throw err;
	    	var dir = './domenii/'+result.insertId;
			if (!fs.existsSync(dir)){
			    fs.mkdirSync(dir);
			}

	    	if(req.files!=null && req.files.length > 0){
	    		var file=req.files.imgUpload;
				var filename=file.name;
				file.mv(dir+'/logo.png');
	    	}
	    	
			rep.redirect('/#domenii');
	});

	
});
app.get('/domenii', function(req, rep){ 
	var cookie = req.cookies['idUser'];
	con.query("SELECT `id_user` from cookies where `cookie`= '"+cookie+"';", function (err, result, fields) {
		if (err) throw err;
		if (result.length!=0){
			con.query("SELECT * from domenii where `id_user`= '"+result[0].id_user+"' and `del` = 0;", function (err, result1, fields) {
				console.log(result1);
				if (result1.length!=0){
					res1 = result1;
				}else if(result1.length==0){
					res1 = 0;
				}
				rep.render('domenii', {res: res1}); 
			});
		}
	});
});
app.get('/content', function(req, rep){ 
	rep.render('content'); 
});
app.get('/imagine?', function(request, response){ 
	var imagine =  'https://infiintare-firme-iasi.ro/public/banere/Bine_ati_venit!.jpg';
    var numeImg ='test'; 
    var tip = 'jpg';
    var size = parseInt('0');
    var webpOK = parseInt('0');
    var watermarkOK = parseInt('0');
    var faraPierderi = parseInt('0');
    var idDom = parseInt('0');

      var link=request.url.slice(9);
      var segments = link.split("&");
      for (var i = segments.length - 1; i >= 0; i--) {
        var gets = segments[i].split('=');
        if(gets[0]=='img'){
          imagine=gets[1];
          var lastImg=imagine.split('/');
          var splitImg=lastImg[lastImg.length-1].split('.');
          numeImg=splitImg[0];
          tip=splitImg[1];
        }else if(gets[0]=='size'){
          size=parseInt(gets[1]);
        }else if(gets[0]=='webp'){
          webpOK=parseInt(gets[1]);
        }else if(gets[0]=='faraPierderi'){
          faraPierderi=parseInt(gets[1]);
        }else if(gets[0]=='watermark'){
          watermarkOK=parseInt(gets[1]);
        }else if(gets[0]=='iddom'){
          idDom=parseInt(gets[1]);
        }
      }
  if(idDom > 0){
     numeImg='domenii/'+idDom+'/'+numeImg;
  download(imagine, numeImg+'.'+tip, function(){
    
    if(size==0){
      var dimensions = sizeOf(numeImg+'.'+tip);
      size=parseInt(dimensions.width);
    }
      (async () => {
        const image = await resizeImg(fs.readFileSync(numeImg+'.'+tip), {
          width: size
        });
        fs.writeFileSync(numeImg+'-'+size+'.'+tip, image);

        var dimensionsI = sizeOf(numeImg+'-'+size+'.'+tip);
        var IW=parseInt(dimensionsI.width);
        var IH=parseInt(dimensionsI.height);

        var dimensionsL = sizeOf('domenii/'+idDom+'/'+"logo.png");
        var LW=parseInt(dimensionsL.width);
        var LH=parseInt(dimensionsL.height);

        var LX=parseInt(IW/2)-parseInt(LW/2);
        var LY=parseInt(IH/2)-parseInt(LH/2);

        if(watermarkOK==1){//daca se cere adaugare watermark
          var optionsImageWatermark = {
            type: "image",
            source: numeImg+'-'+size+'.'+tip,
            logo: 'domenii/'+idDom+'/'+"logo.png", 
            destination: numeImg+'-'+size+'.'+tip,
            position: {
              logoX : LX,
              logoY : LY,
              logoHeight: LH,
              logoWidth: LW
            }
          };
          watermark.embed(optionsImageWatermark, function(status) {
            console.log(status);

            if(webpOK==1){//daca se cere webp
              var cerereWebp="-q 70";
              if(faraPierderi==1){
                cerereWebp=cerereWebp+" -lossless";
              }

              webp.cwebp(numeImg+'-'+size+'.'+tip , numeImg+'-'+size+'.webp',cerereWebp,function(status,error){
                console.log(status,error);  
                fs.readFile(numeImg+'-'+size+'.webp', function(err, data) {
                  if (err){
                    response.writeHead(500, {"Content-Type": "text/html"});
                    response.write('Internal server error.');
                    response.end();
                  }else{
                    response.writeHead(200, { 'Content-Encoding': 'gzip',
                                              'Cache-Control': 'max-age=31536000',
                                              "Content-Type": 'image/webp' });
                    zlib.gzip(data, function (error, result) {
                      if (error) throw error;
                      response.end(result);
                    })
                  }  
                });
              }); 
            }else{//daca NU se cere webp
              fs.readFile(numeImg+'-'+size+'.'+tip, function(err, data) {
                if (err){
                  response.writeHead(500, {"Content-Type": "text/html"});
                  response.write('Internal server error.');
                  response.end();
                }else{
                  var mimetype=mime.lookup(tip);
                  response.writeHead(200, { 'Content-Encoding': 'gzip',
                                            'Cache-Control': 'max-age=31536000',
                                            "Content-Type": mimetype });
                  zlib.gzip(data, function (error, result) {
                    if (error) throw error;
                    response.end(result);
                  })
                }  
              });
            }  
          });
        }else{//daca NU se cere adaugare watermark

          if(webpOK==1){//daca se cere webp
            var cerereWebp="-q 70";
            if(faraPierderi==1){
              cerereWebp=cerereWebp+" -lossless";
            }

            webp.cwebp(numeImg+'-'+size+'.'+tip , numeImg+'-'+size+'.webp',cerereWebp,function(status,error){
              console.log(status,error);  
              fs.readFile(numeImg+'-'+size+'.webp', function(err, data) {
                if (err){
                  response.writeHead(500, {"Content-Type": "text/html"});
                  response.write('Internal server error.');
                  response.end();
                }else{
                  response.writeHead(200, { 'Content-Encoding': 'gzip',
                                            'Cache-Control': 'max-age=31536000',
                                            "Content-Type": 'image/webp' });
                    zlib.gzip(data, function (error, result) {
                      if (error) throw error;
                      response.end(result);
                    })
                }  
              });
            }); 
          }else{//daca NU se cere webp
            fs.readFile(numeImg+'-'+size+'.'+tip, function(err, data) {
              if (err){
                response.writeHead(500, {"Content-Type": "text/html"});
                response.write('Internal server error.');
                response.end();
              }else{
                var mimetype=mime.lookup(tip);
                response.writeHead(200, { 'Content-Encoding': 'gzip',
                                          'Cache-Control': 'max-age=31536000',
                                          "Content-Type": mimetype });
                zlib.gzip(data, function (error, result) {
                  if (error) throw error;
                  response.end(result);
                })
              }  
            });
          }
        }
      })();
  });
  }else{
    response.writeHead(500, {"Content-Type": "text/html"});
    response.write('Internal server error.');
    response.end();
  }
});
const PORT = process.env.PORT || 3000;

/*http2
  .createSecureServer(serverOptions, http2Handlers)
  .listen(PORT, () => {
    console.log(`Our app is running on port ${ PORT }`);
  });*/

app.listen(PORT, () => {
  console.log(`Our app is running on port ${ PORT }`);
});