var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var MongoClient = require('mongodb').MongoClient;

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
router.post('/add', function(req, res) {
  test.create(req.body);
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
  res.render('search', {});
});

module.exports = router;
