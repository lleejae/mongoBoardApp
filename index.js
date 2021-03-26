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
  body: {type:String, required:true},
  date: {type:Date, default:Date.now},
  file: {type:String},
  password: {type:Number}
});

var Post = mongoose.model('postit', postSchema);


app.get('/', function(req, res) {
  Post.find({}, function(err, posts) {
    if (err) res.json(err);
    res.render('pages/home', {posts: posts});
  });
});

app.get('/posting', function(req, res){
    res.render('pages/posting');
});

app.get('/post/:id', function(req, res){
    Post.findOne({_id:req.params.id}, function(err, post) {
      if (err) res.json(err);
      res.render('pages/apost', {post:post});
    });
});

app.post('/post/:id', function(req, res) {
  Post.deleteOne({_id:req.params.id}, function(err, post) {
    if (err) res.json(err);
    res.redirect('/');
  });
});

app.post('/posting', upload.single('image'), function(req, res) {
    var newobject = {};
    for (var entry in req.body) {
      newobject[entry] = req.body[entry];
    }
    newobject.file = req.file.path.substring(7);
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
