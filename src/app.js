// Daria Tsenter
//Started 4/3/18


require('./db');
require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const nodemailer = require('nodemailer');
const session = require('express-session');
const path = require('path');
const async = require('async');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const flash = require('connect-flash');
const hbs = require("hbs");
hbs.registerHelper('dateFormat', require('handlebars-dateformat'));


const bodyParser = require('body-parser');

const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const LocalStrategy = require('passport-local').Strategy;

const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use(session({
    secret: 'pink',
    resave: false,
    saveUninitialized: true,
    expires: new Date(Date.now() + 3600000),
}));
app.use(passport.initialize()); //important that these two lines come after initializing session
app.use(passport.session());
app.use(flash());


const Log = mongoose.model('Log');
const User = mongoose.model("User");


passport.use(new LocalStrategy(function(username, password, done){
	User.findOne({ username : username}, function(err, user){
		if(err) { return done(err); }
		if(!user){			
			return done(null, false, { message: 'Incorrect username.' });
		}

		User.comparePassword( password, user.password, function(err, isMatch) {
			if (isMatch) {
				return done(null, user);
			} else {
				return done(null, false, { message: 'Incorrect password.' });
			}
		});
	});
}));

//facebook setup
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "https://www.25pages.club/auth/facebook/callback",
    profileFields: ['id', 'emails']
  },
  function(accessToken, refreshToken, profile, done) {
	User.findOne({ username : profile.id}, function(err, user) {
		if (err) { return done(err); }
		if (!user){
	      	console.log("singing up a user through facebook now");
	  //     	const authenticate = passport.authenticate("local", {successRedirect: "/", failureRedirect: "/register", failureFlash: true});
			// auth.register(profile.id, profile.emails[0].value, "", authenticate.bind(null, req, res), (err) =>{
			// res.render("register", {message: err.message});
		// 	// console.log('now need to implement an option to change personal information');
		// } );
			var newUser = new User({
				username: profile.id,
				email: profile.emails[0].value,
				password: "test"
			});

			newUser.save(function(err) {

				if(err) {
					console.log(err);
				} else {
					console.log("saving facebook user ...");
					done(null, newUser);
				}
			});
		}
		//if a user already exists too
		done(null, user);
    });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
	User.findById(id, function(err, user) {
		done(err, user);
	});
});


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');


app.use((req, res, next) => {
	res.locals.user = req.user;
	next();
});


app.get('/', (req, res) =>{
	res.render('about');
});

app.get('/img/logo-white-background.png', (req, res) =>{
	res.sendFile('/img/logo-white-background.png');
});

app.get("/explore", (req, res) =>{
	if (req.user){
		res.render("explore");
	} else{
		res.redirect("/login");
	}
});

app.get('/api/users', function(req, res) {
	// TODO: retrieve all reviews or use filters coming in from req.query
	// send back as JSON list
	const query = {};

	if (req.query.username !== undefined && req.query.username !== ""){
		query["username"] = { "$regex": req.query.username, "$options": "i" };
	}

	User.find(query, function(err, users, count){
		res.json(users);
	});
});

app.get('/user/:username', (req, res) =>{
	User.findOne({"username": req.params.username}, function(err, user, count){
		Log.find({"user": user,"access": "public"}, function(err, logs, count){
			res.render("publicuser", {user: user, publicLogs: logs});
		});
	});
});

app.get('/mystats', (req, res) =>{
	//average pages/day
	let totalPages = {number:0};
	let avgPages = 0;
	let totalBooks = [];
	if (req.user){
		Log.find({user: req.user._id}, function(err, logs, count) {
			if (logs.length == 0){
				totalPages = 0;
			}else{
				totalPages = logs.reduce(function(a, b){
					return {number: a.number + b.number};
				});
			}
			
			avgPages = isNaN(totalPages.number/logs.length) ? 0 : totalPages.number/logs.length;
			let allBooks = logs.map((x) => x.title);
			totalBooks = allBooks.filter((v, i, a) => a.indexOf(v) === i);
				res.render("mystats", {user: res.locals.user, totalPages: totalPages.number || 0, totalBooks: totalBooks.length, avgPages: avgPages.toFixed(2)});
		});
	} else{
		res.redirect("/login");
	}
});


app.get('/addlog', (req, res) =>{
	if (req.user){
		Log.find({user: req.user._id}, function(err, logs, count) {
			res.render('addlog', {user: res.locals.user, allLogs: logs});
		}).sort('-date').exec(function(err, docs) {});
		// have an option to see only public or private, use filter
	} else{
		res.redirect("/login");
	}
});

app.post('/addlog', (req, res) =>{
	if (req.user){
		const newLog = new Log({number: req.body.number, date: req.body.date, title: req.body.title, author: req.body.author, comments: req.body.comments, access: req.body.access, user: req.user._id});
		newLog.save((err) =>{
			if (err){
				res.json(err);
			}else{
				res.redirect("/addlog");
			}
		});
	}else{
		res.redirect('/login');
	}
});


app.get('/register', (req, res) => {
	res.render('register');
});

app.post('/register', (req, res) => {
	// const authenticate = passport.authenticate("local", {successRedirect: "/", failureRedirect: "/register", failureFlash: true});
	// auth.register(req.body.username, req.body.email, req.body.password, authenticate.bind(null, req, res), (err) =>{
	// 	res.render("register", {message: err.message});
	// } );
	var user = new User({
		username: req.body.username,
		email: req.body.email,
		password: req.body.password
	});

	user.save(function(err) {
		req.logIn(user, function(err) {
			res.redirect('/');
		});
	});
});

app.get('/login', (req, res) =>{
	res.render("login");
});


app.post('/login', (req, res, next) => {
	passport.authenticate("local", function(err, user, info) {
			if (err) { next(err) }
			if (!user) {
				return res.render('login', { message: info.message })
			} 
			req.logIn(user, function(err) {
		    	if (err) { return next(err); }
		    	return res.redirect('/explore' );
    		});

		})(req, res, next);
	}
);

app.get('/logout', (req, res) =>{
	// if (req.session){
	// 	//destroy session
	// 	req.session.destroy((err)=>{
	// 		if (err){
	// 			res.render('/', err);
	// 		} else{
	// 			res.redirect('/');
	// 		}
	// 	});
	// }
	req.logout();
	res.redirect('/');
});

app.get('/profile', (req, res) =>{
	if (req.user){
		res.render("profile", {username: req.user.username, email: req.user.email});
	}else{
		res.redirect('login');
	}
});

app.get('/change', (req, res) =>{
	if (req.user){
		res.render("change", {username: req.user.username});
	}else{
		res.redirect('login');
	}
});

app.post('/change', (req, res, next) =>{
	passport.authenticate("local", function(err, user, info) {
		if (err) { next(err) }
		if (!user) {
			return res.render('login', { message: info.message })
		} 
		req.logIn(user, function(err) {
	    	if (err) { return next(err); }
	    	//old password matches, so
	    	User.findOne({ email: user.email }, function(err, user) {
	    		console.log('checking for null'+user);
				if(err) { return done(err); }

				user.username = req.body.username;
				user.password = req.body.newpassword;

				user.save(function(err) {
					console.log('saving the user');
					req.logIn(user, function(err) {
						console.log('inside logIn function');
						//done(err, user);
					});
				});

			});

	    	//return res.redirect('/explore' );
		});

	})(req, res, next);
	res.redirect('/explore' );

	//do more stuff here
	
});

app.get('/forgot', (req, res) =>{
	res.render("forgot");
});

// app.post('/forgot', (req, res) =>{
// 	async.waterfall([function(done)])

// 	res.render("forgot", {message: "And email has been sent with further instructions"});
// });

app.post('/forgot', function(req, res, next) {
  async.waterfall([
  	//this generates a random token for resetPasswordToken
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
    //find user with an email from form 
      User.findOne({ email: req.body.email }, function(err, user) {
      	//wrong email
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
        	done(err, token, user);
        });
      });
    },
    //now send an email
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: '25pagesuser@gmail.com',
          pass: '25pagesclub!'
        }
      });
      var mailOptions = {

        to: user.email,
        from: '25pagesuser@gmail.com',
        subject: '25pages.club Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your 25pages account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('info', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err){
    	return next(err);	
    } 
    //res.redirect('/forgot', {message: "And email has been sent with further instructions"});
    res.render("forgot", {message: "And email has been sent with further instructions"});
  });
  //res.render("forgot", {message: "And email has been sent with further instructions"});
});

app.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('change', {
      username: user.username
    });
  });
});

app.post('/reset/:token', function(req, res) {
  async.waterfall([

    function(done) {
    	console.log('anuone here?');
    	//find a user with the following resetPasswordToken and reset password expiration date
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
        	console.log('didnt find a user with such password reset token');
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }

        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        user.save(function(err) {
        	console.log('saving the user');
          req.logIn(user, function(err) {
          	console.log('inside logIn function');
            done(err, user);
          });
        });
      });
    },
    function(user, done) {
    	console.log('supposed to be sending a confirmation email now');
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: '25pagesuser@gmail.com',
          pass: '25pagesclub'
        }
      });
      var mailOptions = {
        to: user.email,
        from: '25pagesuser@gmail.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/');
  });
});

app.get('/auth/facebook', passport.authenticate('facebook', { scope : ['email'] }));


app.get('/auth/facebook/callback', passport.authenticate('facebook', { successRedirect: '/', failureRedirect: '/login' }));

app.get('/feedback', (req, res)=>{
	res.render('feedback');
});

app.post('/feedback', (req, res) =>{
	let smtpTransport = nodemailer.createTransport({
		service: "Gmail",
		auth: {
			user: "25pagesuser@gmail.com",
			pass: "25pagesclub"
		}});

		smtpTransport.sendMail({
			from: req.body.name + " <25pagesuser@gmail.com>",
			to: "Admin <25pagesclub@gmail.com>",
			subject: req.body.subject,
			html: req.body.message + req.body.email}, function(error, response){  //callback
         if(error){
           console.log(error);
        }else{
          console.log("Message sent: " + req.body.message);
					res.render('feedback', {status: "Thank you for your feedback!"});
       }

   smtpTransport.close();
 });
});

app.get('/privacy', (req, res) =>{
	res.render('privacy');
});

app.get('/terms', (req, res) =>{
	res.render('terms');
});

module.exports = app;


app.listen(process.env.PORT || 3000);
console.log("listening");
