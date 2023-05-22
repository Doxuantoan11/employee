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

mongoose.connect('mongodb://127.0.0.1:27017/employees', {useNewUrlParser: true,  useUnifiedTopology: true,useCreateIndex: true,useFindAndModify: false });
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

// using merge to merge collection
var merge = "employees_with_details";
employee.aggregate([
   {
      $lookup:
         {
           from: "users",
           localField: "email",
           foreignField: "email",
           as: "userdetails"
         }
   },
   {
      $lookup:
         {
           from: "positions",
           localField: "positionName",
           foreignField: "name",
           as: "positiondetails"
         }
   },
   {
      $lookup:
         {
           from: "trains",
           localField: "trainName",
           foreignField: "name",
           as: "traindetails"
         }
   },
   {
      $lookup:
         {
           from: "departments",
           localField: "departmentName",
           foreignField: "name",
           as: "departmentdetails"
         }
   },
   {
      $merge:
         {
           into: merge,
           on: "_id",
           whenMatched: "replace",
           whenNotMatched: "insert"
         }
   }
])


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
    employee.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'email',
          foreignField: 'email',
          as: 'user'
        }
      },
      {
        $lookup: {
          from: 'positions',
          localField: 'positionName',
          foreignField: 'name',
          as: 'position'
        }
      },
      {
        $lookup: {
          from: 'trains',
          localField: 'trainName',
          foreignField: 'name',
          as: 'train'
        }
      },
      {
        $lookup: {
          from: 'departments',
          localField: 'departmentName',
          foreignField: 'name',
          as: 'department'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $unwind: '$position'
      },
      {
        $unwind: '$train'
      },
      {
        $unwind: '$department'
      },
      {
        $project: {
          _id: 1,
          name: 1,
          birthDay: 1,
          sex: 1,
          address: 1,
          phone: 1,
          status: 1,
          avatar: 1,
          managerEmail:1,
          applyDay:1,
          email: '$user.email',
          positionName: '$position.name',
          salary: '$position.salary',
          trainName: '$train.name',
          startTime: '$train.startTime',
          endTime: '$train.endTime',
          departmentName: '$department.name'
        }
      }
    ]).exec(function(err, result) {
      if (err) {
        console.log(err);
      } else {
        var filteredResult = result.filter(function(item) {
            return item.email === req.user.email;
        });
        if (filteredResult.length === 0) {
          res.send('User is not used');
      } else {
          res.render('employee-info', { user :filteredResult });
      }
      }
    });
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
    user.find({}, function(err, userData) {
      if (err) throw err;

      position.find({}, function(err, positionData) {
        if (err) throw err;

        train.find({}, function(err, trainData) {
          if (err) throw err;

          department.find({}, function(err, departmentData) {
            if (err) throw err;
            console.log('thong tin chuc vu:', positionData)
            res.render('form-add', {
              user: req.user,
              userData: userData,
              positionData: positionData,
              trainData: trainData,
              departmentData: departmentData
            });
          });
        });
      });
    });
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
    user.find({}, function(err, userData) {
      if (err) throw err;

      position.find({}, function(err, positionData) {
        if (err) throw err;

        train.find({}, function(err, trainData) {
          if (err) throw err;

          department.find({}, function(err, departmentData) {
            if (err) throw err;
            res.render('form-update', {
              employee:data,
              user: req.user,
              userData: userData,
              positionData: positionData,
              trainData: trainData,
              departmentData: departmentData
            });
          });
        });
      });
    });
    // res.render('form-update', {employee:data});
  })
});

//sửa 
router.post('/update', upload.single('hinhanh'), function(req, res, next) {
  const applyDate = moment(req.body.ngayvaocongty).format('YYYY-MM-DD');
  const birthDate = moment(req.body.ngaysinh).format('YYYY-MM-DD');
  if (!req.file) {
    employee.findByIdAndUpdate(
      { _id: req.body.id },
      { name: req.body.hoten,
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
        status: req.body.tinhtrang,},
      { new: true, upsert: true },
      function(err, data) {
        res.redirect('/');
      }
    );
  } 
  else {
    let avatar = urlImage;
    employee.findByIdAndUpdate(
      { _id: req.body.id },
      { name: req.body.hoten,
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
        avatar: avatar, },
      { new: true, upsert: true },
      function(err, data) {
        res.redirect('/');
      }
    );
  }
});
// router.post('/update',upload.single('hinhanh'), function(req, res, next) {
//   const updateData = Object.assign({}, req.body);
//   updateData.avatar = urlImage;

//   employee.findByIdAndUpdate({_id: req.body.id}, updateData, {new:true}, function(err, data) {
//     res.redirect('/');
//   });
// });


//xoá
router.get('/form-delete/:id', function(req, res) {
  employee.findByIdAndDelete(req.params.id, function(err, data) {
    res.redirect('/');
  })
});


//tim kiem
router.get('/search', function(req, res) {
  employee.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: 'email',
        foreignField: 'email',
        as: 'user'
      }
    },
    {
      $lookup: {
        from: 'positions',
        localField: 'positionName',
        foreignField: 'name',
        as: 'position'
      }
    },
    {
      $lookup: {
        from: 'trains',
        localField: 'trainName',
        foreignField: 'name',
        as: 'train'
      }
    },
    {
      $lookup: {
        from: 'departments',
        localField: 'departmentName',
        foreignField: 'name',
        as: 'department'
      }
    },
    {
      $unwind: '$user'
    },
    {
      $unwind: '$position'
    },
    {
      $unwind: '$train'
    },
    {
      $unwind: '$department'
    },
    {
      $project: {
        _id: 1,
        name: 1,
        birthDay: 1,
        sex: 1,
        address: 1,
        phone: 1,
        status: 1,
        avatar: 1,
        managerEmail:1,
        applyDay:1,
        email: '$user.email',
        positionName: '$position.name',
        salary: '$position.salary',
        trainName: '$train.name',
        departmentName: '$department.name'
      }
    }
  ]).exec(function(err, result) {
    if (err) {
      console.log(err);
    } else {
      res.render('search', { employee:result, user: req.user });
    }
  });
  // employee.find({}, (error, data) => {
  //   if (req.isAuthenticated() && req.user.roleName ==='manager') {
  //     res.render('search', { employee:data, user: req.user });
  //   } else {
  //     res.redirect('/login');
  //   }
  // });
});

router.post('/search', function(req, res) {
  console.log('gia tri',req.body.searchText)
  if(req.body.searchText) {
    var regex = new RegExp(req.body.searchText, 'i');
    console.log('regex:', regex);
    console.log('searchText:', req.body.searchText);
    employee.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'email',
          foreignField: 'email',
          as: 'user'
        }
      },
      {
        $lookup: {
          from: 'positions',
          localField: 'positionName',
          foreignField: 'name',
          as: 'position'
        }
      },
      {
        $lookup: {
          from: 'trains',
          localField: 'trainName',
          foreignField: 'name',
          as: 'train'
        }
      },
      {
        $lookup: {
          from: 'departments',
          localField: 'departmentName',
          foreignField: 'name',
          as: 'department'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $unwind: '$position'
      },
      {
        $unwind: '$train'
      },
      {
        $unwind: '$department'
      },
      {
        $project: {
          _id: 1,
          name: 1,
          birthDay: 1,
          sex: 1,
          address: 1,
          phone: 1,
          status: 1,
          avatar: 1,
          managerEmail:1,
          applyDay:1,
          email: '$user.email',
          positionName: '$position.name',
          salary: '$position.salary',
          trainName: '$train.name',
          departmentName: '$department.name'
        }
      },
      // {
      //   $match:
      //     {
      //       "position.salary": { $gte: req.body.minSalary }
      //     }
      // },
      {
        $match:
          {
            $or: [
                  { name: regex },
                  { "position.salary":regex },
                  { birthDay: regex } ,
                  { sex: regex } ,
                  { address: regex } ,
                  { phone: regex } ,
                  { positionName: regex } ,
                  { departmentName: regex } ,
                  { applyDay: regex } ,
                  { managerEmail: regex } ,
                  { email: regex } ,
                  { trainName: regex } ,
                  { status: regex } ,
                 ]
          }
      }
    ]).exec(function(err, result) {
      if (err) {
        console.log(err);
      } else {
        console.log(result);
        res.render('search', { employee:result, user: req.user });
      }
    });

  }
});
// router.post('/search', function(req, res) {
//   if(req.body.searchText) {
//     var regex = new RegExp(req.body.searchText, 'i');
//     var query = { 
//       $or: [
//             { name: regex },
//             { birthDay: regex } ,
//             { sex: regex } ,
//             { address: regex } ,
//             { phone: regex } ,
//             { positionName: regex } ,
//             { departmentName: regex } ,
//             { applyDay: regex } ,
//             { managerEmail: regex } ,
//             { email: regex } ,
//             { trainName: regex } ,
//             { status: regex } ,
//            ] };
//            employee.find(query).limit(10).exec(function(err, data) {
//             if(err) {
//               console.log(err);
//             } else {
//               console.log('data o nodejs: ',data);
//               res.render('search',{ employee:data,user: req.user});
//             }
//           });
//   }
// });


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
  if (req.isAuthenticated() && req.user.roleName ==='manager') {
    train.find({}, (error, data) => {
      res.render('train', { train: data, user: req.user });
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
router.post('/train-update', async function(req, res) {
  var name = req.body.ten;
  var startTime = req.body.thoigianbatdau;
  var endTime = req.body.thoigianketthuc;
  var oldname;
  await train.find({_id: req.body.id},function(err, data)
  {
    if (err) {
      console.log(err);
    }
    else if (data) {
      oldname = data[0].name;
      console.log('ten dao tao cu la:',oldname);
    }
  });

 await train.findByIdAndUpdate(
    {_id: req.body.id}, 
    { $set: { name: name,startTime:startTime,endTime:endTime} },
    function(err, data) {
      if (err) {
        console.log(err);
      }
      employee.updateMany(
        { trainName: oldname },
        { $set: { trainName: name } },
        { multi: true },
        function(err, data) {
          if (err) {
            console.log(err);
          }
        }
      );
      res.redirect('/train');
    }
  );
});

// delete train
router.get('/train-delete/:id',async function(req, res) {

  // Find the old name of the train using its ID
  var oldname;
  await train.find({_id: req.params.id},function(err, data)
  {
    if (err) {
      console.log(err);
    }
    else if (data) {
      oldname = data[0].name;
      console.log('ten dao tao cu la:',oldname);
    }
  });

  await employee.updateMany(
    { trainName: oldname },
    { $set: { trainName: '' } },
    { multi: true },
    function(err, data) {
      if (err) {
        console.log(err);
      }
    }
  );
  // Delete the train record using its ID
  await train.findByIdAndDelete(req.params.id, function(err, data) {
    if (err) {
      console.log(err);
    }
    res.redirect('/train');
  });
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
