var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var MongoClient = require('mongodb').MongoClient;
var moment = require('moment');
//upload file
var multer = require('multer');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const LocalStrategy = require('passport-local').Strategy;
const passport = require('passport');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const flash = require('connect-flash');

const secret = "ct24";
router.use(flash());

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
  roleName: {
    type: String,
  },
});

var user = mongoose.model('users', userSchema);


var user_info ="";
router.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({ mongooseConnection: mongoose.connection })
}));
router.use(passport.initialize());
router.use(passport.session());

passport.use(new LocalStrategy({
  usernameField: 'username'
}, async (username, password, done) => {
  try {
    const myUser  = await user.findOne({ username });
    user_info = username;
    if (!myUser ) {
      return done(null, false, { message: 'Incorrect username or password.' });
    }
    const isMatch = password === myUser.password;
    if (!isMatch) {
      return done(null, false, { message: 'Incorrect username or password.' });
    }
    return done(null, myUser );
  } catch (err) {
    return done(err);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const myuser1 = await user.findById(id);
    done(null, myuser1);
  } catch (err) {
    done(err);
  }
});
// Configure session middleware
var currentUser ="";
router.get('/user', function(req, res) {
  if (req.isAuthenticated() && req.user.roleName ==='admin') {
    user.find({}, (error, data) => {
      console.log('userS : ', data)
      res.render('user', { users: data});
    });
  } else {
    res.redirect('/login');
  }
});

router.get('/', function(req, res) {
  if (req.isAuthenticated() && req.user.roleName === 'admin') {
      res.redirect('user');

  } else if (req.isAuthenticated() && req.user.roleName === 'manager') {
    test.find({}, (error, data) => {
      res.render('index', { test: data, user: req.user });
    });
  } else if (req.isAuthenticated() && req.user.roleName === 'user') {
      res.redirect('employee-info');
  } else {
    res.redirect('/login');
  }
});

//form-login
router.get('/login', function(req, res) {
  res.render('login', {});
});
router.post('/login', passport.authenticate('local', {
  failureFlash: 'Incorrect username or password.',
  failureRedirect: '/login'
}), (req, res) => {
  res.redirect('/');
});

router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error(err);
    }
    res.redirect('/login');
  });
});

// router.post('/login', async (req, res) => {
//   try {
//     user_info = req.body.username;
//     console.log(user_info);
//     const { username, password } = req.body;
//     const user = await user.findOne({ username });
//     if (!user) {
//       return res.status(400).json({ message: 'User not found' });
//     }
//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(400).json({ message: 'Invalid credentials' });
//     }
//     const token = jwt.sign({ id: user._id }, secret);
//     res.json({ token });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });


// router.post('/signup', async (req, res) => {
//   try {
//     const { username, password } = req.body;
//     let user = await user.findOne({ username });
//     if (user) {
//       return res.status(400).json({ message: 'User already exists' });
//     }
//     user = new user({
//       username,
//       password
//     });
//     // const salt = await bcrypt.genSalt(10);
//     // user.password = await bcrypt.hash(password, salt);
//     await user.save();
//     const token = jwt.sign({ id: user._id }, secret);
//     res.json({ token });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });


// kiem tra login

// router.post('/login', async(req, res)=> {
//   try {
//     const check = await user.findOne({username: req.body.username})
//     if(check.password === req.body.password){
//       user_info = check;
//       const token = jwt.sign({ _id: user._id }, secret);
//       res.cookie('token', token, { httpOnly: true, path: '/' });
//       res.redirect('/')
//       }
//       else {
//         res.send("wrong password")
//       }
//     }
//     catch {
//       res.send("wrong details")
//     }
// });

// router.post('/logout', (req, res) => {
//   res.clearCookie('token');
//   console.log('Logout successful');
//   res.json({ message: 'Logout successful' });
// });
// router.get('/logout', (req, res) => {
//   res.clearCookie('token', { domain: 'http://localhost:3001/', path: '/login' });
//   if (req.cookies.token) {
//     console.log('yes cookies token is exist');
//   } else {
//     console.log('no cookies token is  not exist');
//   }
//   // console.log('Logout successful');
//   // res.json({ message: 'Logout successful' });
//   res.redirect('/login');
// });

/* GET home page. */

//form-sign  giao dien trang dang ky
// router.get('/signup', function(req, res) {
//   res.render('signup', {});
// });

router.get('/signup', function(req, res) {
  res.render('signup', {});
});
// gui du lieu form dang ky vao database va quay lai trang login
router.post('/signup', function(req, res) {
  const newuser = new user({
    ...req.body,
    roleName: 'user'
  });
  newuser.save();
  res.redirect('/login');
});

//form-add
router.get('/form-add', function(req, res) {
  if (req.isAuthenticated() && req.user.roleName ==='manager') {
    console.log(' user roleName is :',req.user.roleName )
    res.render('form-add');
  } else {
    res.redirect('/login');
  }
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
    if (req.isAuthenticated() && req.user.roleName ==='manager') {
      res.render('search', { test:data, user: req.user });
    } else {
      res.redirect('/login');
    }
  });
});

router.post('/search', function(req, res) {
  if(req.body.searchText) {
    var regex = new RegExp(req.body.searchText, 'i');
    var query = { 
      $or: [
            { hoten: regex },
            { ngaysinh: regex } ,
            { gioitinh: regex } ,
            { diachi: regex } ,
            { sdt: regex } ,
            { chucvu: regex } ,
            { phongban: regex } ,
            { ngayvaocongty: regex } ,
            { tinhtrang: regex } ,
           ] };
           test.find(query).limit(10).exec(function(err, data) {
            if(err) {
              console.log(err);
            } else {
              console.log('data o nodejs: ',data);
              res.render('search',{ test:data,user: req.user});
            }
          });
  }
});

// user 

// router.get('/user', function(req, res) {
//   if (req.isAuthenticated() && req.user.roleName ==='admin') {
//     user.find({}, (error, data) => {
//       console.log('userS : ', data)
//       res.render('user', { users: data});
//     });
//   } else {
//     res.redirect('/login');
//   }
// });

// 
router.get('/user-update/:id',  function(req, res) {
  user.findById(req.params.id, function(err, data) {
    res.render('user-update', {userCurrent:data});
  })
});
router.post('/user-update', function(req, res, next) {
  user.findByIdAndUpdate({_id: req.body.id},req.body, function(err, data) {
    res.redirect('/user');
  });
});

//xoa user 
router.get('/user-delete/:id', function(req, res) {
  user.findByIdAndDelete(req.params.id, function(err, data) {
    res.redirect('/user');
  })
});

router.get('/employee-info', function(req, res) {
  res.render('employee-info');
});

module.exports = router;
