var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var multer = require('multer');
var fs = require('fs');
var methodOverride = require('method-override');
var app = express();

app.set('view engine', 'ejs');
app.use(express.static(__dirname+'/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(methodOverride('_method'));

mongoose.set('useNewUrlParser', true);    // 1
mongoose.set('useFindAndModify', false);  // 1
mongoose.set('useCreateIndex', true);     // 1
mongoose.set('useUnifiedTopology', true); // 1
mongoose.connect(process.env.MONGO_DB); // 2
var db = mongoose.connection; //3

var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'public/imgs/');
  },
  filename: function(req, file, cb) {
    cb(null, Date.now()+file.originalname);
  },
  fileFilter: function(req, file, cb) {
    var ext = path.extname(file.originalname);
    if (ext !== ".jpeg" || ".png" || ".jpg")
    { return cb(null, false); } cb(null, true); }
});

var upload = multer({ storage: storage });

var postSchema = mongoose.Schema( {
  title: {type:String, required:true},
  writer: {type:String, required:true},
  body: {type:String},
  date: {type:Date, default:Date.now},
  file: {type:String},
  password: {type:Number},
  num: {type:Number}
});

var Post = mongoose.model('postit', postSchema);


app.get('/', function(req, res) {
  Post.find({}, function(err, posts) {
    if (err) res.json(err);
    res.render('pages/home', {posts: posts});
  });
});

app.get('/posting', function(req, res){ // 게시글 작성 페이지: /posting으로 get
    res.render('pages/posting');
});

app.get('/post/:id', function(req, res){  // 게시글 입장은 /post/:id로 get
    Post.findOne({_id:req.params.id}, function(err, post) {
      if (err) res.json(err);
      res.render('pages/apost', {post:post});
    });
});

app.post('/post/:id', function(req, res) {  // 삭제 요청은 /post/:id 로 post
    if (req.body.password == '4444') {  // 마스터키 4444
      Post.deleteOne({_id:req.params.id}, function(err3, post) {
        if (err3) res.json(err3);
        res.redirect('/');
      });
    }
    else {
      Post.findOne({_id:req.params.id, password: req.body.password}, function(err, post) {
        if (err) {
          res.redirect('/');
          return;
        }
        Post.deleteOne({_id:req.params.id, password: req.body.password}, function(err2, post) {
          if (err2) res.json(err2);
          res.redirect('/');
        });
      });
    }
});

app.post('/posting', upload.single('image'), function(req, res) { // 글 작성은 /posting으로 post
    if (!(req.body.title && req.body.writer && req.body.body && req.body.password)){
      res.redirect('/');
      return;
    }

    var newobject = {};
    for (var entry in req.body) {
      newobject[entry] = req.body[entry];
    }
    if (req.file)
      newobject.file = req.file.path.substring(6);
    Post.create(newobject, function(err, post) {
      if (err) res.json(err);
      res.redirect('/');
    });
});


var port = 3000;
app.listen(port, function() {
  var dir='/public/imgs';
  if (!fs.existsSync(dir)) fs.mkdirSync(dir); // 2
  console.log("server is on in port: "+port);
});
