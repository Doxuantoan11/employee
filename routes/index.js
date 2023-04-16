var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var MongoClient = require('mongodb').MongoClient;
var moment = require('moment');

//upload file
var multer = require('multer');



mongoose.connect('mongodb://127.0.0.1:27017/canbo', {useNewUrlParser: true, useNewUrlParser: true,  useUnifiedTopology: true});
var db = mongoose.connection;
//Bắt sự kiện error
db.on('error', function(err) {
  if (err) console.log(err)
});
//Bắt sự kiện open
db.once('open', function() {
  console.log("Kết nối thành công !");
});


//SCHEMA
var canboSchema =new mongoose.Schema({
  hoten: {
    type: String,
  },
  ngaysinh: {
    type: String,
  },
  gioitinh: {
    type: String,
  },
  diachi: {
    type: String,
  },
  sdt: {
   type: String,
  },
  chucvu: {
    type: String,
  },
  phongban: {
    type: String,
  },
  ngayvaocongty: {
    type: String,
  },
  hinhanh: {
    type: String,
  },
  tinhtrang: {
    type: String,
  }
});

var test = mongoose.model('tests', canboSchema);

var userSchema =new mongoose.Schema({
  username: {
    type: String,
  },
  password: {
    type: String,
  },
});

var user = mongoose.model('users', userSchema);
/* GET home page. */
router.get('/', function(req, res) {
  test.find({}, (error, data) => {
    console.log('danh sach canbo: ', data);
       res.render('index', { test:data });
  });
});
//form-login
router.get('/login', function(req, res) {
  res.render('login', {});
});
// kiem tra login
router.post('/login', async(req, res)=> {
    try {
      const check = await user.findOne({username: req.body.username})

      if(check.password === req.body.password){
        res.redirect('/')
      }
      else {
        res.send("wrong password")
      }
    }
    catch {
      res.send("wrong details")
    }

    
});


//form-sign  giao dien trang dang ky
router.get('/signup', function(req, res) {
  res.render('signup', {});
});
// gui du lieu form dang ky vao database va quay lai trang login
router.post('/signup', function(req, res) {
  user.create(req.body);
  res.redirect('/login');
});

//form-add
router.get('/form-add', function(req, res) {
  res.render('form-add', {});
});

//validator img file and name img
let urlImage;
var storage = multer.diskStorage({
  destination:function(req, file,cb){
    if (file.mimetype === 'image/jpeg' ||
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg'){
          cb(null, 'public/images');
        }else{
          cb(new Error('not image'),false);
        }
  },
  filename:function(req, file,cb){
    urlImage = Date.now()+'.jpg';
    cb(null,urlImage);
  }
});

// them can bo
var upload = multer({storage:storage});

router.post('/add',upload.single('hinhanh'), function(req, res,next) {
  const file = req.file;
  const applyDate = moment(req.body.ngayvaocongty).format('YYYY-MM-DD');
  const birthDate = moment(req.body.ngaysinh).format('YYYY-MM-DD');
  // var date = new Date(req.body.ngayvaocongty).toUTCString();
  // date = date.split(' ').slice(0,4).join(' ');
  if(!file) {return next}
  test.create({ 
    hoten: req.body.hoten,
    ngaysinh: birthDate,
    gioitinh: req.body.gioitinh,
    diachi: req.body.diachi,
    sdt: req.body.sdt,
    chucvu: req.body.chucvu,
    phongban: req.body.phongban,
    ngayvaocongty: applyDate,
    tinhtrang: req.body.tinhtrang,
    hinhanh: urlImage,
 });
  res.redirect('/');
});

//form update
router.get('/form-update/:id', upload.single('hinhanh'),  function(req, res) {
  test.findById(req.params.id, function(err, data) {
    res.render('form-update', {test:data});
  })
});

//sửa 
router.post('/update',upload.single('hinhanh'), function(req, res, next) {
  const updateData = Object.assign({}, req.body);
  updateData.hinhanh = urlImage;

  test.findByIdAndUpdate({_id: req.body.id}, updateData, {new:true}, function(err, data) {
    res.redirect('/');
  });
});




//xoá
router.get('/form-delete/:id', function(req, res) {
  test.findByIdAndDelete(req.params.id, function(err, data) {
    res.redirect('/');
  })
});



//tim kiem
router.get('/search', function(req, res) {
  test.find({}, (error, data) => {
       res.render('search', { test:data});
  });
});



router.post('/search/name', function(req, res, next) {
  var name = req.body.hoten;
  test.find({"hoten": {$regex: name, $options: 'i'}}, function(err, data) {
    if(data){
      res.render('search', { test:data });
    }
    else{
      res.send("Không tìm thấy cán bộ")
    }
  });
});


router.post('/search/sdt', function(req, res, next) {
  var sdt = req.body.sdt;
  test.find({"sdt": {$regex: sdt, $options: 'i'}}, function(err, data) {
    if(data){
      res.render('search', { test:data });
    }
    else{
      res.send("Không tìm thấy cán bộ")
    }
  });
});

module.exports = router;
