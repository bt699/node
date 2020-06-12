const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const fse = require('fs-extra');
const url = require('url');
const path = require('path');
const userRouter = require('./api');
const app = express();
const low = require('lowdb');
const FileAsync = require('lowdb/adapters/FileAsync');
const FileSync = require('lowdb/adapters/FileSync');
const NginxConfFile = require('nginx-conf').NginxConfFile
let process = require('child_process')

/* const adapterSync = new FileSync('./dist/keycloak.json'); // 申明一个适配器
const db = low(adapterSync);
db.defaults({})
  .write();
  
//apireaml.json
const adapterSyncapireaml = new FileSync('./dist/apireaml.json'); // 申明一个适配器
const dbapireaml = low(adapterSyncapireaml);
dbapireaml.defaults({})
  .write();
dbapireaml.set('putreaml', '').write(); 

//apisession.json
const adapterSyncapisession = new FileSync('./dist/apisessions.json'); // 申明一个适配器
const dbapisession = low(adapterSyncapisession);
dbapisession.defaults({})
  .write();
  
//posthome.json
const adapterSyncposthome = new FileSync('./dist/posthome.json'); // 申明一个适配器
const dbposthome = low(adapterSyncposthome);
dbposthome.defaults({"posthome": []})
  .write();
//dbposthome.set({"posthome": []}).write(); 
 */
const adapterSyncposthome = new FileSync('./dist/posthome.json'); // 申明一个适配器
const dbposthome = low(adapterSyncposthome);
dbposthome.defaults({"posthome": []})
  .write();
//dbposthome.set({"posthome": []}).write(); 

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: false}));

//allow custom header and CORS
app.all('*', function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header(
        'Access-Control-Allow-Headers',
        'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild'
    );
    res.header(
        'Access-Control-Allow-Methods',
        'PUT, POST, GET, DELETE, OPTIONS'
    );

    if (req.method == 'OPTIONS') {
        res.send(200);
    } else {
        next();
    }
});

const rootPath = './dist';
app.use(express.static(rootPath));
app.use('index.html', function(req, res) {
    res.sendFile(path.resolve(rootPath, 'index.html'));
});

app.use(bodyParser.json());
app.use('/api', userRouter);

app.put('/realm', function (req, res, next) {
	if (req.body['clientId']) {
		db.set('clientId',req.body['clientId'])
		  .write();
	}
	
	if (req.body['url']) {
		db.set('url',req.body['url'])
		  .write();
	}
	if (req.body['realm']) {
		db.set('realm',req.body['realm'])
		  .write();		
	}	
    res.send(req.body);
})

app.put('/apirealm', function (req, res, next) {
	if (req.body['addreaml']) {
		dbapireaml.set('addreaml',req.body['addreaml'])
		  .write();
	}
	
	if (req.body['delreaml']) {
		dbapireaml.set('delreaml',req.body['delreaml'])
		  .write();
	}
	if (req.body['getreaml']) {
		dbapireaml.set('getreaml',req.body['getreaml'])
		  .write();		
	}
    res.send(req.body);
})

//apisession.json
app.put('/apisession', function (req, res, next) {
	if (req.body['delsessions']) {
		dbapisession.set('delsessions',req.body['delsessions'])
		  .write();
	}
	
	if (req.body['usersessions']) {
		dbapisession.set('usersessions',req.body['usersessions'])
		  .write();
	}
    res.send(req.body);
})

//homeadd start
//fsecopykey
async function fsecopykey(k,l,b){
	try{
		await fse.copy(k,l)
		const lockfile = fse.readJsonSync(l)
		lockfile.resource = b
		fse.writeJson(k,lockfile,err=>{})	
		
	}catch(e){
		console.log(e);
		//TODO handle the exception
	}
}


//fsecopydir
async function fsecopydir(d,c){
	try{
		//console.log(d)
		await fse.copy('./distcopy','./dist'+d)
		//console.log('dayin')
		await fsecopykey('./dist'+d+'/keycloak.json','./dist'+d+'/lock.json',c)
		await acopynojson(d)
		//硬链接复制json
		await cpcopyjson(d)
		//const destFolder = path.normalize('/www/wwwroot/163.com/'+d)
		//await replacedir(destFolder,d+'/')
		//二级替换字串文件
		//await replacefile(destFolder,'='+d+'/')
	}catch(e){
		console.log(e)
	}
}
//urltomkdir
  function urltomkdir(posturl){
	  const newurl = new URL(posturl)
	  fs.mkdir('dist'+newurl.pathname,{recursive:true},err=>{
		  if(err) return err
		  //console.log('创建成功')
		  return '创建成功'
	  })
	  
	  
  }
 //urltofile
 function urltofile(confile){
	 fs.writeFile('conf/'+confile+'.conf',"",err=>{
		 if(err) return err
		 return '创建成功'
	 })
 }
 
 //confwrite
 function confwrite(fileconf,listen,server_name,root){
 	
	  
	  	NginxConfFile.create(fileconf,function(err,conf){
	 	if(err){
	 		console.log(err)
	 		return
	 	}
	 	
	 	conf.nginx._add('server');
	 	conf.nginx.server._add('listen',listen);
	 	conf.nginx.server._add('server_name',server_name);
	 	conf.nginx.server._add('index','index.html');
	 	conf.nginx.server._add('root', root);	
	 	conf.nginx.server._add('location','/');
	 	conf.nginx.server.location._add('try_files','$uri $uri/ /index.html');	
	 	
	 })
	  	
	 
 	
	
 }
 //二级目录写入confsub
 function subconfwrite(fileconf,loc,uri){
	  	NginxConfFile.create(fileconf,function(err,conf){
	 	if(err){
	 		console.log(err)
	 		return
	 	}
	 	conf.nginx._add('location',loc);//'/'
	 	conf.nginx.location._add('try_files',uri);	//'$uri $uri/ /index.html'
	 })
 }
  //二级目录创建文件suburltofile
 function suburltofile(confile){
	 fs.writeFile('/www/wwwroot/163.com/rewrite/'+confile+'.conf',"",err=>{
		 if(err) return err
		 return '创建成功'
	 })
 }
 //异步拷贝文件夹过滤json
 async function acopynojson(pa){
    const obj = { dereference:true}
	obj.filter = (src,dest) => {
	let stat = fse.lstatSync(src)
	let isDirectory = stat.isDirectory()
	if (isDirectory){
		return true;		
	}else{
		const pathext = path.extname(src)
		if( pathext == '.json' ) {
			return false
		}else{
			return true
		}
	}}
	const scrFolder = path.normalize('/www/wwwroot/163.com/master/copy')
    const destFolder = path.normalize('/www/wwwroot/163.com/'+pa)
	await fse.copy(scrFolder,destFolder,obj,err=>{
	if(err) return console.error('err',err)
	console.log('拷贝成功')
	})
 }
 
 //异步硬拷贝json
async function cpcopyjson(pa){
     const antjson = '/www/server/antnode/dist/' + pa + '/*.json'
	const wwwpath = '/www/wwwroot/163.com/'+ pa
	const cpl = 'cp  -l  ' + antjson + ' ' + wwwpath
	await process.exec(cpl,function(err){
     console.log(err)      //当成功是error是null
     })
	
 }
 
//异步替换文件夹
async function replacedir(dest,pa){
    var filePathjs = path.resolve(dest+'/js')
	await fs.readdir(filePathjs,'utf8',function(err,data){
	data.forEach(function(item,index){
		//console.log(item);
		fs.readFile(dest+'/js/'+item,'utf8',function(err,files){
			//console.log(files);
			var result = files.replace(/\/master\/oa\//g, pa);
			fs.writeFile(dest+'/js/'+item,result,'utf8',function(err){
				if(err) return console.log(err);
				})
			})
		})
	})
}

//异步替换文件
async function replacefile(dest,pa){
    await fs.readdir(dest,'utf8',function(err,data){
	    data.forEach(function(item,index){
		//console.log(item);
		if(path.extname(item)=='.html'){
			fs.readFile(dest+'/'+item,'utf8',function(err,files){
				//console.log(files);
				var result = files.replace(/=\/master\/oa\//g, pa);
				fs.writeFile(dest+'/'+item,result,'utf8',function(err){
					if(err) return console.log(err);
					})
				})
			}
		})
	})
}
  //get homeMenu
 
 app.get('/posthome/:homeDomain', (req, res) => {
   const post = dbposthome.get('posthome')
     .find({ homeDomain: req.params.homeDomain })
     .value()
 
   res.send(post)
 })
 
 //put posthome
 

 app.put('/posthome/:homeDomain',(req, res, next)=>{
	 const put = dbposthome.get('posthome')
	 .find({homeDomain:req.params.homeDomain})
	 .assign(req.body)
	 .write()
	 //console.log(req.body['homeToken']);	 
	 res.send(put)
	 
 })
  //put posthome end
 //update homeMenu
 
  app.post('/posthome/:homeDomain', (req, res) => {
      
   const post = dbposthome.get('posthome')
     .find({ homeDomain: req.params.homeDomain })
	 .assign(req.body)
	 .write()
   //二级复制
      const newurlkey = new URL(post.homeDir)
	  acopynojson(newurlkey.pathname)
	  //硬链接复制json
	  cpcopyjson(newurlkey.pathname)
     
 
   res.send(post)
 })

app.post('/posthome',function(req,res){
	if(Object.keys(req.body).length === 0){
		const dbbody = dbposthome.get('posthome').value()
		//console.log(dbbody);
		// const dbbodyjson = JSON.stringify(dbbody)
		// console.log(dbbodyjson);
		res.send(dbbody)
		
	}else{
	console.log(req.body)
	const newurlkey = new URL(req.body.homeDir)
	console.log(newurlkey.pathname)
	console.log(req.body.homeClient)
	fsecopydir(newurlkey.pathname,req.body.homeClient)
	
	//二级域名拷贝文件夹过滤json
	//acopynojson(newurlkey.pathname)
	//硬链接复制json
	//cpcopyjson(newurlkey.pathname)
	/*
	const obj = { dereference:true}
	
	obj.filter = (src,dest) => {
	let stat = fse.lstatSync(src)
	let isDirectory = stat.isDirectory()
	if (isDirectory){
		return true;		
	}else{
		const pathext = path.extname(src)
		if( pathext == '.json' ) {
			return false
		}else{
			return true
		}
	}}
	const scrFolder = path.normalize('/www/wwwroot/163.com/master/copy')
    const destFolder = path.normalize('/www/wwwroot/163.com/'+newurlkey.pathname)
	fse.copy(scrFolder,destFolder,obj,err=>{
	if(err) return console.error('err',err)
	console.log('拷贝成功')
	//硬链接复制json
	cpcopyjson()
	const antjson = '/www/server/antnode/dist/' + newurlkey.pathname + '/*.json'
	const wwwpath = '/www/wwwroot/163.com/'+ newurlkey.pathname
	const cpl = 'cp  -l  ' + antjson + ' ' + wwwpath
	process.exec(cpl,function(err){
     console.log(err)      //当成功是error是null
     })
	})
	*/
	
	urltofile(req.body.homeDomain)
	//二级新建conf文件
	suburltofile(req.body.homeDomain)
	const newurl = new URL(req.body.homeDir)	
	const rootpath = path.resolve('dist'+newurl.pathname)	
	confwrite('conf/'+req.body.homeDomain+'.conf','80',req.body.homeDomain,rootpath)
	//写入二级conf文件
	subconfwrite('/www/wwwroot/163.com/rewrite/'+req.body.homeDomain+'.conf',newurl.pathname+'/','$uri $uri/ '+newurl.pathname+'/index.html')
	
	
	
	
	//二级替换字串目录
	//const destFolder = path.normalize('/www/wwwroot/163.com/'+newurlkey.pathname)
	//replacedir(destFolder,newurlkey.pathname)
	//二级替换字串文件
	//replacefile(destFolder,newurlkey.pathname)
	/*
	var filePathjs = path.resolve(destFolder+'/js')
	fs.readdir(filePathjs,'utf8',function(err,data){
	data.forEach(function(item,index){
		//console.log(item);
		fs.readFile(destFolder+'/js/'+item,'utf8',function(err,files){
			//console.log(files);
			var result = files.replace(/master\/oa/g, newurl.pathname);
			fs.writeFile(destFolder+'/js/'+item,result,'utf8',function(err){
				if(err) return console.log(err);
				})
			})
		})
	})
	//二级替换字串文件
	//var filePath = path.resolve(__dirname+'/dist/master/usr/dist')
	fs.readdir(destFolder,'utf8',function(err,data){
	    data.forEach(function(item,index){
		//console.log(item);
		if(path.extname(item)=='.html'){
			fs.readFile(destFolder+'/'+item,'utf8',function(err,files){
				//console.log(files);
				var result = files.replace(/master\/oa/g, newurl.pathname);
				fs.writeFile(destFolder+'/'+item,result,'utf8',function(err){
					if(err) return console.log(err);
					})
				})
			}
		})
	})
	*/
	dbposthome.get('posthome')
		.push(req.body)
		.write()
		const dbbody = dbposthome.get('posthome').value()
		res.send(dbbody)

		
	};
	//res.send(req.body)
})

//post menu
 app.post('/postmenu/:homeDomain', (req, res) => {   
   console.log(req.body)
   const post = req.body
   const homedir = post.homeDir
   const newurl = new URL(homedir)
   //const rootpath = path.resolve('dist'+newurl.pathname)
   console.log('422'+newurl.pathname)
   	//二级替换字串文件夹
   const destFolder = path.normalize('/www/wwwroot/163.com/'+newurl.pathname)
   replacedir(destFolder,newurl.pathname+'/')
   //二级替换字串文件
   replacefile(destFolder,'='+newurl.pathname+'/')
   const adapterSyncpostmenu = new FileSync('./dist'+newurl.pathname+'/postmenu.json'); // 申明一个适配器
   const dbpostmenu = low(adapterSyncpostmenu);
   dbpostmenu.defaults({homeMenu:[],pColor:"",layouthead:"",headcol:[],headlogo:""})
     .write();	 
   dbpostmenu.get('homeMenu')
             .assign(post.homeMenu)
			 .write() 
   dbpostmenu.set('pColor',post.pColor)
			 .write()
   dbpostmenu.set('layouthead',post.layouthead)
			 .write()
   dbpostmenu.get('headcol')
             .assign(post.headcol)
			 .write()
   dbpostmenu.set('headlogo',post.headlogo)
			 .write()
   dbpostmenu.set('headtitle',post.headtitle)
			 .write()
   res.send(post)
 })
 
 //put menu
  app.put('/putmenu', (req, res) => {   
   console.log(req.body)
   const put = req.body
   const adapterSyncputmenu = new FileSync('./dist'+'/postmenu.json'); // 申明一个适配器
   const dbputmenu = low(adapterSyncputmenu);
   dbputmenu.defaults({homeMenu:[],pColor:"",layouthead:"",headcol:[],headlogo:"",headtitle:""})
     .write();
   if(req.body.homeMenu){
       dbputmenu.get('homeMenu')
             .assign(put.homeMenu)
			 .write() 
   };
   if(req.body.pColor){
       dbputmenu.set('pColor',put.pColor)
			 .write()
   };
   if(req.body.layouthead){
       dbputmenu.set('layouthead',put.layouthead)
			 .write()
   };
   if(req.body.headcol){
       dbputmenu.get('headcol')
             .assign(put.headcol)
			 .write()
   };
   if(req.body.headlogo){
       dbputmenu.set('headlogo',put.headlogo)
			 .write()
   };
   if(req.body.headtitle){
       dbputmenu.set('headtitle',put.headtitle)
			 .write()
   };
   res.send(put)
 })

//homeadd  end
//put keycloak
  app.put('/putkey', (req, res) => {
   console.log(req.body)
   const put = req.body
   const key = url.parse(req.url,true).query
   console.log(key.key);
   const adapterSyncputmenu = new FileSync('./dist/'+key.key+'/keycloak.json'); // 申明一个适配器
   const dbputmenu = low(adapterSyncputmenu);
   dbputmenu.defaults({realm:"",url:"","ssl-required":"",clientId:""})
     .write();
   if(req.body.realm){
       dbputmenu.set('realm',put.realm)
   			    .write()
   };
   if(req.body.url){
       dbputmenu.set('url',put.url)
			    .write()
   };
   if(req.body['ssl-required']){
       dbputmenu.set('ssl-required',put['ssl-required'])
			    .write()
   };
   if(req.body.clientId){
       dbputmenu.set('clientId',put.clientId)
			    .write()
   };
   //二级替换字串目录
	const destFolder = path.normalize('/www/wwwroot/163.com/'+key.key)
    console.log('521' + destFolder);
    console.log('522' + key.key);
	replacedir(destFolder,'/'+key.key+'/')
	//二级替换字串文件
	replacefile(destFolder,'=/'+key.key+'/')
   res.send(put)
 })

//put keycloak end

app.listen(5000, function() {
    console.log('Node app start at port 5000');
});
