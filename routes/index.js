var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var MongoClient = require('mongodb').MongoClient;


//upload file
var multer = require('multer');




const uri = 'mongodb+srv://dotoan:toan123@cluster0.g8eqyhb.mongodb.net/canbo1?retryWrites=true&w=majority'

const connectDB = async () => {
  try {
    await mongoose.connect(
      uri,
      { useNewUrlParser: true, useUnifiedTopology: true }
    )
    console.log('Connected to mongoDB')
  } catch (error) {
    console.log(error)
    process.exit(1)
  }
}

connectDB()


//SCHEMA
var canboSchema =new mongoose.Schema({
  hoten: {
    type: String,
  },
  tuoi: {
    type: Number,
  },
  gioitinh: {
    type: String,
  },
  diachi: {
    type: String,
  },
  hinhanh: {
    type: String,
  },
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
  if(!file) {return next}
  test.create({ 
    hoten: req.body.hoten,
    tuoi: req.body.tuoi,
    gioitinh: req.body.gioitinh,
    diachi: req.body.diachi,
    hinhanh: urlImage,
 });

  res.redirect('/');
});

//form update
router.get('/form-update/:id', function(req, res) {
  test.findById(req.params.id, function(err, data) {
    res.render('form-update', {test:data});
  })
});

//sửa 
router.post('/update', function(req, res, next) {
  console.log(req.body);
  test.findByIdAndUpdate(req.body.id, req.body, function(err, data) {
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

// router.get('/search/results', function(req, res, next) {
//   var name = req.params.hoten;
//   test.find({"hoten":"name"}, function(err, data) {
//     res.render('search', { test:data });
//   });
// });

module.exports = router;
