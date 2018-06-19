const colors = require('colors');
const logger = require('tracer').colorConsole({
  format: "{{timestamp.green}} <{{title.yellow}}> {{message.cyan}} (in {{file.red}}:{{line}})",
  dateformat: "HH:MM:ss.L"
})
require('dotenv').config()
const request = require('request');
const express_layouts = require('express-ejs-layouts')
const express = require('express');
const favicon = require('favicon');
const path = require('path')
const app = express();
const fs = require('fs')
const body_parser = require('body-parser')
const cookie_parser = require('cookie-parser')
const session = require('express-session')
const mongoStore = require('connect-mongo')(session)
const passport = require('passport')
const express_validator = require('express-validator')
const Local_Strategy = require('passport-local').Strategy;
const multer = require('multer')
const upload = multer({dest:'./public/user_profile_pics'})
var formidable = require('formidable');

const flash = require('connect-flash')
const bcrypt = require('bcryptjs')
// const mongodb = require('mongodb')
// const mongoose = require('mongoose')

const User = require('./models/user.js')
app.set('view engine', 'ejs');

const mongoose = require('mongoose')
mongoose.connect('mongodb://localhost/qaltfi')
  .then(connection => {
    // logger.log('Connected to MongoDB')
  })
  .catch(error => {
    logger.log(error.message)
  })
const Crowdsale = require('./models/crowdsale.js')
const Current_eth_price = require('./models/current_eth_price.js')


app.use(body_parser.json())
app.use(body_parser.urlencoded({ extended: false, limit: '50mb'}))
app.use(cookie_parser())
app.use(express_layouts)
app.use(express.static('public'))
//Handle Session
app.use(session({
  store: new mongoStore({
    url: 'mongodb://localhost/qaltfi',
    ttl: 6000
    // db: 'users',
    // host: 'mongodb://localhost',
    // port: 27017
  }),
  secret:'secret',
  saveUninitialized:true,
  resave:true
  // ,
  // cookie: {
  //   secure: false,
  //   httpOnly: true,
  //   maxAge: 1000 * 60 * 60//one hour
  // }
}))
//Passport
app.use(passport.initialize())
app.use(passport.session())
app.use(flash())
app.use(function (req, res, next) {
  // if there's a flash message in the session request, make it available in the response, then delete it
  res.locals.sessionFlash = req.session.sessionFlash;
  delete req.session.sessionFlash;
  next();
});
//Validation
app.use(express_validator({
  errorFormatter: function (param, msg, value) {
    var namespace = param.split('.')
      , root = namespace.shift()
      , formParam = root;

    while (namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param: formParam,
      msg: msg,
      value: value
    };
  }
}));
app.use(require('connect-flash')());

app.get('*', (req, res, next)=>{
  res.locals.user = req.user || null;
  res.locals.test = 'this is a test'

  next()
})
//MIDDLEWARE

function ensure_authenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  res.redirect('/login')

}

function ensure_crowdsale_not_init(req, res, next) {
  logger.log('not started yet')
  if (!req.user.crowdsale_init) {
    return next();
  }

  res.redirect('/edit-basics')

}
function ensure_crowdsale_init(req, res, next) {
  if (req.user.crowdsale_init) {
    return next();
  }

  res.redirect('/start')

}

function has_wallet(req, res, next) {
  if (req.user.has_wallet) {
    return next();
  }
  req.flash('error','A wallet is required to make transactions')
  res.redirect('/account-wallet')

}

const port = process.env.PORT


app.listen(port, ()=>{logger.log(`listening on ${port}`)})

const home_styles = [
  'New-construction',
  'Older-home',
  // 'City',
  // 'State',//search filters
  // 'Zip',
  'Single-family',
  'Condo',
  'Townhome',
  'Multi-family'
]

app.get('/', (req, res)=>{
  logger.log('main route hit')
  logger.log(req.user)

  Crowdsale.find({}, (err, crowdsales)=>{
    // logger.log(crowdsales)

    res.render('home', {
      styles: home_styles,
      crowdsales, crowdsales,
      // user:req.user,
      page: {
        title: "Home"
      }, expressFlash: req.flash('success'), sessionFlash: res.locals.sessionFlash
    })


  })
  //for member in site.data.categories limit:1 
  //member.name
  //member in site.data.categories
  //member.percentage
  //go to database and get a list of crowdsales


})

app.get('/explore', (req, res) => {
  res.render('explore', {
    page: {
      title: "Explore"
    }
  })

})
app.get('/about', (req, res) => {
  res.render('about', {
    page: {
      title: "About"
    }
  })

})

app.get('/account', ensure_authenticated, (req, res) => {
  res.render('account', {
    page:{
      title:"Account"
    }
  })

})

app.get('/account-wallet', ensure_authenticated, (req, res) => {
  res.render('account-wallet', {
    errors:req.flash('error'),
    page:{
      title:"Account Wallet"
    }
  })

})

app.get('/account-balances', ensure_authenticated, (req, res) => {
  res.render('account-balances', {
    page:{
      title:"Account Balances"
    }
  })

})
app.get('/account-profile', ensure_authenticated, (req, res) => {
  res.render('account-profile', {
    expressFlash: req.flash('success'),
    page:{
      title:"Account Profile"
    }
  })

})

app.get('/contact', (req, res) => {
  res.render('contact', {
    page:{
      title:"Contact"
    }
  })

})


app.get('/edit-basics', [ensure_authenticated, ensure_crowdsale_init],(req, res) => {
  //get the crowdsale this user has started
  Crowdsale.findOne({user_id:req.user.id}, (err, crowdsale)=>{
    if(err)throw('error getting the users crowdsale')
    logger.log(crowdsale)
    Current_eth_price.findOne({ name: 'eth' }, (err, current_eth_price) => {



    res.render('edit-basics', {
      current_eth_price: current_eth_price.price,
      styles: home_styles,
      no_footer: true,
      crowdsale:crowdsale,
      page: {
        title: "Edit"

      }
    })

    })


  })


})

app.get('/edit-about', [ensure_authenticated, ensure_crowdsale_init], (req, res) => {

  Crowdsale.findOne({user_id:req.user.id}, (err, crowdsale)=>{
    if(err)throw('error getting the users crowdsale')
    logger.log(crowdsale)
    res.render('edit-about', {
      no_footer: true,
      crowdsale: crowdsale,
      page: {
        title: "Edit About"
      }
    })
  })


})


app.get('/edit-accounts', [ensure_authenticated, ensure_crowdsale_init], (req, res) => {
    Crowdsale.findOne({user_id:req.user.id}, (err, crowdsale)=>{
    if(err)throw('error getting the users crowdsale')
    logger.log(crowdsale)
  res.render('edit-accounts', {
    crowdsale:crowdsale,
    no_footer: true,
    page: {
      title: "Edit Accounts"

    }
  })

  })
})



app.get('/edit-perks', [ensure_authenticated, ensure_crowdsale_init], (req, res) => {
    Crowdsale.findOne({user_id:req.user.id}, (err, crowdsale)=>{
    if(err)throw('error getting the users crowdsale')
    logger.log(crowdsale)
  res.render('edit-perks', {
    crowdsale:crowdsale,
    no_footer: true,
    page: {
      title: "Edit Perks"

    }
  })

  })
})


app.get('/edit-story', [ensure_authenticated, ensure_crowdsale_init], (req, res) => {
    Crowdsale.findOne({user_id:req.user.id}, (err, crowdsale)=>{
    if(err)throw('error getting the users crowdsale')
    logger.log(crowdsale)
  res.render('edit-story', {
    crowdsale:crowdsale,
    no_footer: true,
    page: {
      title: "Edit Story"

    }
  })

  })
})




app.get('/faqs', (req, res) => {
  res.render('faqs', {
    page: {
      title: "FAQs"
    }
  })

})
// app.get('/home', (req, res) => {
//   res.render('home', {
//     page: {
//       title: "Home"
//     }
//   })

// })


app.get('/login', (req, res) => {
  var flash;
  logger.log('LOGIN!')
  // if(req.flash('error'))flash = req.flash('error')

  res.render('login', {
    layout:'layout-plain',
    express_flash: req.flash('error'),
    // no_footer:true,
    page:{
      title: "Login"
    }
  })

})
app.get('/pricing', (req, res) => {
  res.render('pricing', {
    page:{
      title:"Pricing"
    }
  })

})

app.get('/project', (req, res) => {
  res.render('project', {
    page: {
      title: "Project"
    }
  })

})

app.get('/register', (req, res) => {
  res.render('register', {
    layout:'layout-plain',
    // no_footer: true,
    page: {
      title: "Register"
    }
  })

})

app.get('/start', [ensure_authenticated, ensure_crowdsale_not_init], (req, res) => {
  //get current_eth_price for this view
  logger.log('start route hit')
  Current_eth_price.findOne({name:'eth'}, (err, price)=>{
    logger.log(price)
    logger.log(price.time)
    logger.log(price.price)

    res.render('start', {
      styles: home_styles,
      eth_price_data: { price: price.price, time: price.time},
      page: {
        title: "Start"
      }
    })


  }) 


})

app.get('/testimonials', (req, res) => {
  res.render('testimonials', {
    page:{
      title:"Testimonials"
    }
  })

})
app.get('/typography', (req, res) => {
  res.render('typography', {
    page:{
      title:'Typeography'
    }
  })

})



app.get('/tour', (req, res) => {
  res.render('tour', {
    page:{
      title:"Tour"
    }
  })

})




app.get('/logout', ensure_authenticated, (req, res)=>{
  req.logOut();
  req.flash('success', "You are now logged out")
  res.redirect('/')
})

//TODO clean this mess up
app.post('/all_account_balances', (req, res)=>{
  logger.log(req.body)
  const accounts = [req.body['accounts']]
  // const accounts = req.body['accounts[]']//needed if we send an array of accounts?
  // logger.log(accounts.length)
  var array_resp=[];
  Array.prototype.forEach.call(accounts, (account)=>{
    request(`http://192.168.0.93:1337/account_balance/${account}`, (err, http, body)=>{
      if(err)throw(err)
      logger.log(body)
      array_resp.push(body)
      if(array_resp.length == accounts.length){
        res.send(array_resp)
      }
    })
  })
})

app.post('/create_wallet', ensure_authenticated, (req, res)=>{
  const { pw,pw2,text} = req.body

  logger.log('lets create a new user wallet with this uses id?')
  logger.log(req.user.id)
  logger.log(req.body)
  req.checkBody('pw', 'Password field is require').notEmpty()
  req.checkBody('pw2', 'Password do not match').equals(pw)
  var errors = req.validationErrors()
  if( errors ){
    logger.log('errors')
    res.send({errors})
    // res.render('account-wallet', {
    //   // layout:'layout-plain',
    //   user:req.user,
    //   errors:errors, 
    //   page:{
    //     title:'Account Wallet'
    //   }
    // })
  }else{
    const url = 'http://192.168.0.93:1337/create_wallet'
    const post_data = {
      user_id: req.user.id,
      pw: pw,
      text: text,
      type:'entropy'
    }
    var options = {
      method: 'post',
      body: post_data,
      json: true,
      url: url
    }
    request(options, (err, httpResponse, body) => {
      if(!body){
        throw(err)
      }else{
        logger.log(body)
        User.update({email:req.user.email}, {
          has_wallet:true,
          public_addresses:body,//body has aray of public address?
          }, (err, updated_user)=>{
          if(err)throw(err)
          res.send({
            success:'New wallet created'
          })
        })
      }
    })
  }


} )


app.post('/init_crowdsale', [ensure_authenticated, ensure_crowdsale_not_init],(req, res)=>{
  logger.log(req.body)
  var { home_style,amount_money_needed,amount_down_payment} = req.body
  const user_id = req.user.id
  home_style = home_style.trim()
  req.checkBody('home_style', 'Home type is require').notEmpty()
  req.checkBody('amount_money_needed', 'Amount of money needed is require').notEmpty()
  req.checkBody('amount_down_payment', 'Down payment amount is require').notEmpty()
  var errors = req.validationErrors()
  if (errors) {
    logger.log('errors')
    res.send({errors})
    // res.render('register', {
    //   layout: 'layout-plain',
    //   errors: errors, page: {
    //     title: 'Register'
    //   }
    // })
  }else{
    const new_crowdsale = new Crowdsale({
      user_id,
      home_style,
      amount_money_needed,
      amount_down_payment
    })
    new_crowdsale.save((err, save_new_crwodale) => {
      logger.log(save_new_crwodale)
      logger.log('whats happening????????????????/*  */')
      if (err) throw (err)
      if (!save_new_crwodale) logger.log('this is broken')
      if (save_new_crwodale) {
        User.update({ email: req.user.email }, {
          crowdsale_init: true,
          crowdsale_id: save_new_crwodale.id
          // public_addresses: body,//body has aray of public address?
        }, (err, updated_user) => {
          if (err) throw (err)
          res.send({ success: 'save_new_crwodale' })

        })
      }


    })

  }
})

app.post('/save_crowdsale_update', [ensure_authenticated, ensure_crowdsale_init], (req, res) => {
  logger.log(req.body)
  // logger.log(req.file)
  // if(req.file){
  //   logger.log('we got files')
  // }
  res.send(req.body)
})

app.post('/upload_crowdsale_photos', [ensure_authenticated, ensure_crowdsale_init], (req, res) => {
  logger.log(req.body)
  var form = new formidable.IncomingForm();
  form.multiples = true;
  form.uploadDir = __dirname+'/public/crowdsale_photos'


    // every time a file has been uploaded successfully,
  // rename it to it's orignal name
  form.on('file', function (field, file) {
    logger.log('field - ' + field + ' : file - ' + JSON.stringify(file));
    var ext = file.name
    var index = ext.lastIndexOf('.')
    var ext = ext.slice(index)
    logger.log('whats the upload file?')
    logger.log(file.path)
    var file_name = file.path.split('/')
    file_name = file_name[file_name.length-1]

    Crowdsale.findByIdAndUpdate({ _id: req.user.crowdsale_id}, {
      $push: { photos:file_name}
    }, (err, saved_crowdsale_photo)=>{
      if(err)throw('error saving uploaded crowdsale photo')
      logger.log('saved_crowdsale_photo')
      updated_model = saved_crowdsale_photo



    })


    // resizeThisImage(file.path + ext)//TODO add Jimp
  });
  // log any errors that occur
  form.on('error', function (err) {
    logger.log('An error has occured: \n' + err);
  });

  // once all the files have been uploaded, send a response to the client
  form.on('end', function () {
    logger.log('end')
    setTimeout(()=>{
      res.send(updated_model)
    }, 1000)

  });

  // parse the incoming request containing the form data
  form.parse(req);
  // logger.log(form)
  logger.log(req.file)
  logger.log(req.files)

  //
})

app.post('/update_user_profile', ensure_authenticated, (req, res)=>{
  // logger.log(req.user)
  // logger.log(req.session)
logger.log(req.body)
  User.findOneAndUpdate({email:req.user.email}, 
    req.body,
    { upsert: true },
    (err, updated_user_profile)=>{
      if(err)throw(err)
      console.log('updated_user_profile')
      res.send(updated_user_profile)
    }

  )
})

//POST REGISTER
app.post('/register', upload.single('profile_image'),(req, res) => {
  const { email,password,confirm_password} = req.body
  logger.log({ email, password, confirm_password})
  if(req.file){
    logger.log('uploading file....')
    var profile_img = req.file.filename
  }else{
    logger.log('no file....')
    const man_or_woman = Math.floor(Math.random() * 2);
    const id = Math.floor(Math.random() * 99);
    const sex = man_or_woman===0?'momen':'men'
    var profile_img = `https://randomuser.me/api/portraits/${sex}/${id}.jpg`

  }
  //validator
  req.checkBody('email', 'Email address is require').notEmpty()
  req.checkBody('email', 'Email address is not valid').isEmail()
  req.checkBody('password', 'Password field is require').notEmpty()
  req.checkBody('confirm_password', 'Password do not match').equals(password)
  //Check erros
  var errors = req.validationErrors()
  if( errors ){
    logger.log('errors')
    res.render('register', {
      layout:'layout-plain',
      errors:errors, page:{
        title:'Register'
      }
    })
  }else{
    User.findOne({ email: email }, function (err, user) {
      if (user) {
        const errors = [{msg:'Email is already taken.'}]
        res.render('register', {
          layout: 'layout-plain',
          errors: errors, page: {
            title: 'Register'
          }
        })
      } else {
        logger.log('no errors')
        const new_user = new User({
          email: email,
          password: password,
          profile_img: profile_img
        })
        User.create_user(new_user, (err, user) => {
          if (err) logger.log(err)
          logger.log(user)
          // res.location('/')
          // res.redirect('/')
          passport.authenticate('local')(req, res, function(){
            req.flash('success', 'You are now registered, and logged in')

            res.redirect('/account-profile');
          })



        })

      }

    })

  }
  // res.send(req.body)
})//END POST REGISTER


//POST LOGIN
app.post('/login',
  passport.authenticate('local', {failureRedirect: '/login', failureFlash:true}),
   (req, res) =>{
    logger.log('login hit')
    // If this function gets called, authentication was successful.
    // `req.user` contains the authenticated user.
    req.flash('success', 'You are now logged in')
    //  res.redirect('/edit-accounts/' + req.user.username);
     res.redirect('/account-profile');
  }); //POST LOGIN


//PASSPORT FUNCTIONS
passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.get_user_by_id(id, function (err, user) {
    done(err, user);
  });
});

//PASSPORT LOCAL METHOD
passport.use('local', new Local_Strategy({
  usernameField: 'email',
  passwordField: 'password',
  // passReqToCallback: true
}, (email, password, done)=>{
  logger.log('LOCAL')
  User.get_user_by_email(email, (err, user)=>{
    logger.log('looking up user '+email)
    if(err){
      logger.log(err)
    }
    if(!user){
      logger.log('no user')
      return done(null, false, {message:'Invalid credentials'})
    }
    User.compare_password(password, user.password, (err, is_match)=>{
      if(err) {
        return done(err)
      }
      if(is_match){
        return done(null, user);
      }else{
        logger.log('fail')
        return done(null, false, {message:"Invalid credentials"})
      }
    })
  })
}))
//POST LOGIN
