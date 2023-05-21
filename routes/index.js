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

mongoose.connect('mongodb://127.0.0.1:27017/employees', {useNewUrlParser: true,  useUnifiedTopology: true,useCreateIndex: true});
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
var employeeSchema =new mongoose.Schema({
  email: {
    type: String,
  },
  name: {
    type: String,
  },
  birthDay: {
    type: String,
  },
  sex: {
    type: String,
  },
  address: {
   type: String,
  },
  phone: {
   type: String,
  },
  positionName: {
    type: String,
  },
  departmentName: {
    type: String,
  },
  applyDay: {
    type: String,
  },
  status: {
    type: String,
  },
  avatar: {
    type: String,
  },
  managerEmail: {
    type: String,
  },
  trainName: {
    type: String,
  }
}, { timestamps: true });

var employee = mongoose.model('employees', employeeSchema);
// users
var userSchema =new mongoose.Schema({
  email: {
    type: String,
    unique: true
  },
  password: {
    type: String,
  },
  roleName: {
    type: String,
  },
});
var user = mongoose.model('users', userSchema);

// position
var positionSchema =new mongoose.Schema({
  name: {
    type: String,
  },
  salary: {
    type: String,
  },
});
var position = mongoose.model('positions', positionSchema);

// train
var trainSchema =new mongoose.Schema({
  name: {
    type: String,
  },
  startTime: {
    type: String,
  },
  endTime: {
    type: String,
  },
});
var train = mongoose.model('trains', trainSchema);

// department
var departmentSchema =new mongoose.Schema({
  name: {
    type: String,
  }
});
var department = mongoose.model('departments', departmentSchema);

var user_name ="";
router.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({ mongooseConnection: mongoose.connection })
}));
router.use(passport.initialize());
router.use(passport.session());

passport.use(new LocalStrategy({
  usernameField: 'email' 
}, async (email, password, done) => { 
  try {
    const myUser  = await user.findOne({ email }); 
    user_info = email; 
    if (!myUser ) {    
      return done(null, false, { message: 'Incorrect email .' }); 
    }
    const isMatch = password === myUser.password;
    if (!isMatch) {
      return done(null, false, { message: 'Incorrect  password.' }); 
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
      res.render('user', { users: data, currentUser: req.user.email });
    });
  } else {
    res.redirect('/login');
  }
});

router.get('/', function(req, res) {
  if (req.isAuthenticated() && req.user.roleName === 'admin') {
      res.redirect('user');

  } else if (req.isAuthenticated() && req.user.roleName === 'manager') {
    employee.find({}, (error, data) => {
      res.render('index', { employee: data, user: req.user });
    });
  } else if (req.isAuthenticated() && req.user.roleName === 'user') {
      res.redirect('employee-info');
  } else {
    res.redirect('/login');
  }
});


router.post('/login', passport.authenticate('local', {
  failureFlash: 'Incorrect email or password.',
  failureRedirect: '/login'
}), (req, res) => {
  res.redirect('/');
});
//form-login
router.get('/login', function(req, res) {
  let errorMessage = req.flash('error');
  let successSignup = req.flash('success');
  res.render('login',{message: errorMessage , success:successSignup});
});


router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error(err);
    }
    res.redirect('/login');
  });
});


/* GET home page. */

//form-sign  giao dien trang dang ky

router.get('/signup', function(req, res) {
  let errormessage =req.flash('error');
  res.render('signup', {message:errormessage});
});

router.post('/signup', async function(req, res) {
  try {
    // Check if email already exists
    const existingUser = await user.findOne({ email: req.body.email });
    let errormessage = 'Email already exists';
    let successsignup = 'signup successful';
    if (existingUser) {
      errormessage= 'Email already exists';
      req.flash('error', errormessage);
      return res.redirect('/signup');
    }

    // Email doesn't exist, create a new user
    const newuser = new user({
      ...req.body,
      roleName: 'user'
    });
    await newuser.save();
    req.flash('success', successsignup);
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

//form-add
router.get('/form-add', function(req, res) {
  if (req.isAuthenticated() && req.user.roleName ==='manager') {
    console.log(' user roleName is :',req.user.roleName )
    res.render('form-add',{user:req.user});
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
  console.log(req.body);
  if(!file) {return next}
  employee.create({ 
    name: req.body.hoten,
    birthDay: birthDate,
    sex: req.body.gioitinh,
    address: req.body.diachi,
    phone: req.body.sdt,
    positionName: req.body.chucvu,
    departmentName: req.body.phongban,
    applyDay: applyDate,
    email: req.body.email,
    managerEmail: req.body.quanly,
    trainName: req.body.daotao,
    status: req.body.tinhtrang,
    avatar: urlImage,
 });
  res.redirect('/');
});

//form update
router.get('/form-update/:id', upload.single('hinhanh'),  function(req, res) {
  employee.findById(req.params.id, function(err, data) {
    res.render('form-update', {test:data});
  })
});

//sửa 
router.post('/update',upload.single('hinhanh'), function(req, res, next) {
  const updateData = Object.assign({}, req.body);
  updateData.hinhanh = urlImage;

  employee.findByIdAndUpdate({_id: req.body.id}, updateData, {new:true}, function(err, data) {
    res.redirect('/');
  });
});



//xoá
router.get('/form-delete/:id', function(req, res) {
  employee.findByIdAndDelete(req.params.id, function(err, data) {
    res.redirect('/');
  })
});



//tim kiem
router.get('/search', function(req, res) {
  employee.find({}, (error, data) => {
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
           employee.find(query).limit(10).exec(function(err, data) {
            if(err) {
              console.log(err);
            } else {
              console.log('data o nodejs: ',data);
              res.render('search',{ test:data,user: req.user});
            }
          });
  }
});


// 
router.get('/user-update/:id',  function(req, res) {
  user.findById(req.params.id, function(err, data) {
    res.render('user-update', {userCurrent:data});
  })
});

router.post('/user-update', function(req, res, next) {
  let userRoleName = req.body.roleName;
  user.findByIdAndUpdate({_id: req.body.id}, { roleName: userRoleName }, function(err, data) {
    if (err) {
      console.log(err);
    }
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

//user search
router.post('/user-search', function(req, res) {
  if(req.body.userSearch) {
    var regex = new RegExp(req.body.userSearch, 'i');
    var query = { 
      $or: [
            { email: regex },
            { roleName: regex } ,
           ] };
           user.find(query).limit(10).exec(function(err, data) {
            if(err) {
              console.log(err);
            } else {
              res.render('user',{ users:data});
            }
          });
  }
});

// chuc vu
router.get('/position', function(req, res) {
  if (req.isAuthenticated() && req.user.roleName ==='admin') {
    position.find({}, (error, data) => {
      res.render('position', { position: data, currentUser: req.user.email });
    });
  } else {
    res.redirect('/login');
  }
});

// add position
router.post('/add-position', function(req, res,next) {
 
  position.create({ 
    name: req.body.chucvu,
    salary: req.body.luong,
 });
  res.redirect('/position');
});

// position update
router.get('/position-update/:id',  function(req, res) {
  position.findById(req.params.id, function(err, data) {
    res.render('position-update', {positionCurrent:data});
  })
});
router.post('/position-update', function(req, res, next) {
  let name = req.body.chucvu;
  let salary = req.body.luong;
  console.log('luong la:', salary)
  position.findByIdAndUpdate(
    {_id: req.body.id}, 
    { $set: { name: name, salary: salary } },
    function(err, data) {
      if (err) {
        console.log(err);
      }
      res.redirect('/position');
    }
  );
});
//delete position
router.get('/position-delete/:id', function(req, res) {
  position.findByIdAndDelete(req.params.id, function(err, data) {
    res.redirect('/position');
  })
});

//train
router.get('/train', function(req, res) {
  if (req.isAuthenticated() && req.user.roleName ==='admin') {
    train.find({}, (error, data) => {
      res.render('train', { train: data, currentUser: req.user.email });
    });
  } else {
    res.redirect('/login');
  }
});
router.post('/add-train', function(req, res,next) {
  train.create({ 
    name: req.body.ten,
    startTime: req.body.thoigianbatdau,
    endTime: req.body.thoigianketthuc,
 });
  res.redirect('/train');
});

//update train
router.get('/train-update/:id',  function(req, res) {
  train.findById(req.params.id, function(err, data) {
    res.render('train-update', {trainCurrent:data});
  })
});
router.post('/train-update',  function(req, res) {
  let name = req.body.ten;
  let startTime = req.body.thoigianbatdau;
  let endTime = req.body.thoigianketthuc;
  train.findByIdAndUpdate(
    {_id: req.body.id}, 
    { $set: { name: name, startTime: startTime,endTime:endTime } },
    function(err, data) {
      if (err) {
        console.log(err);
      }
      res.redirect('/train');
    }
  );
});

// delete train
router.get('/train-delete/:id', function(req, res) {
  train.findByIdAndDelete(req.params.id, function(err, data) {
    res.redirect('/train');
  })
});

// department
router.get('/department', function(req, res) {
  if (req.isAuthenticated() && req.user.roleName ==='admin') {
    department.find({}, (error, data) => {
      res.render('department', { department: data, currentUser: req.user.email });
    });
  } else {
    res.redirect('/login');
  }
});

// add department
router.post('/add-department', function(req, res,next) {
  department.create({ 
    name: req.body.ten,
 });
  res.redirect('/department');
});

// update department
router.get('/department-update/:id',  function(req, res) {
  department.findById(req.params.id, function(err, data) {
    res.render('department-update', {departmentCurrent:data});
  })
});
router.post('/deparment-update',  function(req, res) {
  let name = req.body.ten;
  department.findByIdAndUpdate(
    {_id: req.body.id}, 
    { $set: { name: name} },
    function(err, data) {
      if (err) {
        console.log(err);
      }
      res.redirect('/department');
    }
  );
});

// delete department
router.get('/department-delete/:id', function(req, res) {
  department.findByIdAndDelete(req.params.id, function(err, data) {
    res.redirect('/department');
  })
});
module.exports = router;
