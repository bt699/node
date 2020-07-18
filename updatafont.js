var express = require('express')
const app = express();

const bodyParser = require('body-parser');

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: false}));
//app.use(bodyParser.json({uploadDir:'./uploads'}));
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
        res.sendStatus(200);
    } else {
        next();
    }
});

const rootPath = './dist';


app.use('index.html', function(req, res) {
    res.sendFile(path.resolve(rootPath, 'index.html'));
});

app.use(bodyParser.json());

//var router = express.Router()

var fs = require('fs')

var multer = require('multer')

var storage = multer.diskStorage({
	destination:function(req,file,cb){
		console.log(file.mimetype);
		//if(file.mimetype == 'application/octet-stream'){
		//if(file){
			cb(null,'upload/');
		//}
		/* else{
			cb(null, false)

		} */
		
	},
	filename:function(req,file,cb){
		cb(null,Date.now()+"-" + file.originalname)
	},
	
})

var createFolder = function(folder){
	try{
		fs.accessSync(folder)
	}catch(e){
		fs.mkdirSync(folder)
	}
}

var uploadFolder = '../upload/'
createFolder(uploadFolder)

var upload = multer({
	storage:storage,
	fileFilter: function(req, file, cb){
	        // 限制文件上传类型，仅可上传png格式图片
	        if(file.mimetype == 'application/octet-stream'){
	            cb(null, true)
	        } else {
	            cb(null, false)
	        }
	}
	})

app.post('/updatafont',upload.single('file'),function(req,res,next){
	console.log('35');
	var file = req.file;
	res.send({
		res_code:'200',
		type:file.MimeType,
		originalname:file.originalname,
		size:file.size,
		path:file.path
	})
})

//module.exports = router

app.listen(5000, function() {
    console.log('Node app start at port 5000');
});