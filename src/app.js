// Daria Tsenter
//Started 4/3/18
// SETTING UP
require('./db');
require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const app = express();
const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));
const nodemailer = require('nodemailer');
const mailgunTransport = require('nodemailer-mailgun-transport');
const cookieParser = require('cookie-parser');

const bodyParser = require('body-parser');

const async = require('async');
const crypto = require('crypto');
const flash = require('connect-flash');
const hbs = require("hbs");
const i18n = require('i18n');

hbs.registerHelper('dateFormat', require('handlebars-dateformat'));

// 'forgot password' configuration
const mailgunOptions = {
	service: 'Mailgun',
  auth: {
    api_key: process.env.MAILGUN_ACTIVE_API_KEY,
    domain: process.env.MAILGUN_DOMAIN,
  }
}
const transport = mailgunTransport(mailgunOptions);

const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const LocalStrategy = require('passport-local').Strategy;

const session = require('express-session');
const MongoStore = require('connect-mongo')(session); //store sessions in the database
mongoose.Promise = global.Promise;
const db = mongoose.connection;

app.use(cookieParser("pink"));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
	secret: 'pink',
	resave: false,
	saveUninitialized: true,
	store: new MongoStore({ mongooseConnection: db, clear_interval: 3600 }),
	cookie: { secure: false, maxAge: 3600000} //1 hour max
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/dist', express.static(path.join(__dirname,'../node_modules/bootstrap/dist')));

app.use(flash());

const Log = mongoose.model('Log');
const User = mongoose.model("User");

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const env = process.env.NODE_ENV.toUpperCase();

// PASSPORT - FACEBOOK
passport.use(new FacebookStrategy({
		clientID: process.env['FACEBOOK_APP_ID_' + env],
		clientSecret: process.env['FACEBOOK_APP_SECRET_' + env],
		callbackURL: process.env[ 'WEBSITE_' + env] + "auth/facebook/callback",
		profileFields: ['id', 'emails']
	},
	function(accessToken, refreshToken, profile, done) {
		// in case email is not grabbed
		if (profile.emails === undefined) {
        	done('email-required')
        	return;
    	}
		//check by email if one exists
		User.findOne({ email : profile.emails[0].value}, function(err, user) {
			if (err) { 
				return done(err);
			}
			if (!user){
				const newUser = new User({
					username: profile.id,
					facebookId: profile.id,
					email: profile.emails[0].value,
					numberOfLogs: 0
				});

				newUser.save(function(err) {

					if(err) {
						console.log(err);
					} else {
						done(null, newUser);
					}
				});
			}else{
				//if a user already exists too
				done(null, user);
			}
		});
	}
));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

i18n.configure({
  locales: ['en', 'ru'],
  cookie: 'locale',
  directory: "" + __dirname + "/locales"
});

app.use((req, res, next) => {
	res.locals.user = req.user;
	next();
});

//internalization
app.use(i18n.init);

hbs.registerHelper('__', function () {
  return i18n.__.apply(this, arguments);
});
hbs.registerHelper('__n', function () {
  return i18n.__n.apply(this, arguments);
});

app.get('/ru', function (req, res) {
	i18n.setLocale('ru');
  res.cookie('locale', 'ru', { maxAge: 900000, httpOnly: true });
  res.redirect('back');
});

app.get('/en', function (req, res) {
	i18n.setLocale('en');
  res.cookie('locale', 'en', { maxAge: 900000, httpOnly: true });
  res.redirect('back');
});

app.get('/', (req, res) =>{
	res.render('about');
});

//testing middleware logging guser
app.get('/',  function(req, res, next) {
  res.render('/', { user: req.user });
});

app.get('/img/logo-white-background.png', (req, res) =>{
	res.sendFile('/img/logo-white-background.png');
});

app.get('/img/icons8-edit-50.png', (req, res) =>{
	res.sendFile('/img/icons8-edit-50.png');
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
		res.json(users.sort(function(a, b) {
    return a.numberOfLogs - b.numberOfLogs;
}))};
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
			if (logs.length === 0){
				totalPages = 0;
			}else{
				totalPages = logs.reduce(function(a, b){
					return {number: a.number + b.number};
				});
			}
			
			avgPages = isNaN(totalPages.number/logs.length) ? 0 : totalPages.number/logs.length;
			const allBooks = logs.map((x) => x.title);
			totalBooks = allBooks.filter((v, i, a) => a.indexOf(v) === i);
				res.render("mystats", {user: res.locals.user, totalPages: totalPages.number || 0, totalBooks: totalBooks.length, avgPages: avgPages.toFixed(2)});
		});
	} else{
		res.redirect("/login");
	}
});

app.get('/addlog', (req, res) =>{
	if (req.user){
		res.render('addlog');
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
				User.update({_id: req.user._id}, { $inc: {numberOfLogs: 1}}, function(error, rawResponse) {
				if (error) {
					console.error(error);
				}}); //increment the number of logs
				res.redirect("/mylogs");
			}
		});
	}else{
		res.redirect('/login');
	}
});

app.get('/mylogs', (req, res) =>{
	if (req.user){
		Log.find({user: req.user._id}, function(err, logs, count) {
			res.render('mylogs', {user: res.locals.user, allLogs: logs});
		}).sort('-date').exec(function(err, docs) {});
	// have an option to see only public or private, use filter
	} else{
		res.redirect("/login");
	}
})

app.get('/register', (req, res) => {
	res.render('register', {lang: i18n.getLocale()});
});

app.post('/register', (req, res) => {
	const newUser = new User({
		username: req.body.username,
		email: req.body.email.toLowerCase(),
		numberOfLogs: 0
	});

	User.register(newUser, req.body.password, function(err, account) {
        if (err) {
            return res.render('register', { account : account });
        }

        passport.authenticate('local')(req, res, function () {
          res.redirect('/addlog');
        });
    });
});

app.get('/login', (req, res) =>{
	res.render("login");
});


app.post('/login', function(req, res, next) {
	passport.authenticate('local', function(err, user, info) {
	if (err) { return next(err) }
    if (!user) {
		return res.render('login', { message: info.message });
    }
    req.logIn(user, function(err) {
		if (err) { return next(err); }
		return res.redirect('/addlog');
    });
  })(req, res, next);
});

app.get('/logout', (req, res) =>{
	console.log('req.user ' + req.user);
	req.session.destroy(function (err) {
		if (!err){
			req.logout();
    		res.redirect('/');
		}else{
			console.log(err);
			res.redirect('/');
		}

  });
});

app.get('/profile', (req, res) =>{
	if (req.user){
		res.render("profile", {username: req.user.username, email: req.user.email});
	}else{
		res.redirect('login');
	}
});

app.get('/changeusername', (req, res) =>{
	if (req.user){
		res.render("changeusername", {username: req.user.username, lang: i18n.getLocale()});
	}else{
		res.redirect('login');
	}
});

app.post('/changeusername', (req, res) =>{
	// req.body.username = req.user.username;
	// passport.authenticate('local')(req, res, function (err, user, info) {
		User.findOne({username: req.user.username}, function(err, user){
			user.username = req.body.username;
			req.user.username = req.body.username;
			// console.log('umm' + user);
			user.save(function(err) {
				if (err){
					console.log(err);
					res.redirect('/');
				}else{
					console.log('saved new username');
				}
					
			});
		})
        res.redirect('/addlog');
    // });
});

app.get('/change', (req, res) =>{
	if (req.user){
		res.render("change", {username: req.user.username});
	}else{
		res.redirect('login');
	}
});

app.post('/change', (req, res) =>{
	User.findOne({ username: req.user.username}, function(err, usr){
		if (err){
			console.log(err);
		}else{
			usr.setPassword(req.body.newpassword, function(error){
				if (error){
					console.log(error);
				}else{
					console.log('inside setPAssword');
					usr.save();
	                console.log('outside of save');
	                return res.redirect('/profile');
				}
			});
		}		
	});	
});

app.get('/forgot', (req, res) =>{
	res.render("forgot");
});

app.post('/forgot', function(req, res, next) {
	async.waterfall([
	//this generates a random token for resetPasswordToken
	function(done) {
		crypto.randomBytes(20, function(err, buf) {
			const token = buf.toString('hex');
			done(err, token);
		});
	},
	function(token, done) {
	//find user with an email from form 
		User.findOne({ email: new RegExp(req.body.email, "i")  }, function(err, user) {
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
		console.log('in function to send email');
		const smtpTransport = nodemailer.createTransport(transport);
		const mailOptions = {
			to: user.email,
			from: 'support@25pages.club',
			subject: '25pages.club Password Reset',
			text: 'You are receiving this because you (or someone else) have requested the reset of the password for your 25pages account.\n\n' +
			'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
			'http://' + req.headers.host + '/reset/' + token + '\n\n' +
			'If you did not request this, please ignore this email and your password will remain unchanged.\n'
		};
		smtpTransport.sendMail(mailOptions, function(err) {
			if (!err){
				req.flash('info', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
			} else{
				req.flash('info', 'Something went wrong on the server, try later.');
			}
			done(err, 'done');
			smtpTransport.close();
		});
	}
	], function(err) {
	if (err){
		return next(err);	
	} 
		res.render("success", {message: "And email has been sent with further instructions"});
	});
	//res.render("forgot", {message: "And email has been sent with further instructions"});
});

app.get('/reset/:token', function(req, res) {
	User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
		if (!user) {
			req.flash('error', 'Password reset token is valid or has expired.');
			return res.redirect('/forgot');
		}
		//render change password page
		res.render('change', {
		username: user.username
		});
	});
});

app.post('/reset/:token', function(req, res) {
	async.waterfall([

	function(done) {
		//find a user with the following resetPasswordToken and reset password expiration date
		User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
			if (!user) {
				req.flash('error', 'Password reset token is invalid or has expired.');
				return res.redirect('back');
			}
			//HERE!
			user.resetPasswordToken = undefined;
			user.resetPasswordExpires = undefined;

			user.setPassword(req.body.newpassword, function(error){
				if (error){
					console.log(error);
				}else{
					console.log('inside setPassword after /forgot');
					user.save();
	                console.log('outside of save');
	                return res.redirect('/profile');
				}
			});
		});
	},
	function(user, done) {
		const smtpTransport = nodemailer.createTransport(transport);
		const mailOptions = {
			to: user.email,
			from: 'support@25pages.club',
			subject: 'Your password has been changed',
			text: 'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
		};
		smtpTransport.sendMail(mailOptions, function(err) {
			if (!err){
				req.flash('success', 'Your password has been changed.');
			} else{
				req.flash('info', 'Something went wrong on the server, try later.');
			}
			smtpTransport.close();
			done(err, 'done');
		});
	}
	], function(err) {
	res.redirect('/');
	});
});

app.get('/auth/facebook', passport.authenticate('facebook', { scope : ['email'], authType: 'rerequest', failureRedirect: '/', successRedirect: '/addlog'}));

app.get('/auth/facebook/callback', function(req, res, next) {
	passport.authenticate('facebook', function (err, user, info) {
        if (err) {
            if (err == 'email-required') res.redirect('/auth/facebook/rerequest');
            //for any other type of error
            res.redirect('/');
            return;
        }
        res.redirect('/addlog');
        // do the rest of the thing
})(req, res, next)
});

app.get('/auth/facebook/rerequest',
    passport.authenticate('facebook', {
        scope: ['email'],
        authType: 'rerequest' // this is important
    }
));

app.get('/feedback', (req, res)=>{
	res.render('feedback');
});

app.post('/feedback', (req, res) =>{
	const smtpTransport = nodemailer.createTransport(transport);
		const mailOptions = {
			to: "25pagesclub@gmail.com",
			from: 'support@25pages.club',
			subject: req.body.subject,
			text: 'This is from ' + req.body.name + '\n Message ' + req.body.message + '\n Email '+ req.body.email
		};
		smtpTransport.sendMail(mailOptions, function(err) {
			if (!err){
				res.render('feedback', {status: "Thank you for your feedback!"});
			} else{
				req.flash('info', 'Something went wrong on the server, try later.');
			}
			smtpTransport.close();			
		});
});

app.get('/privacy', (req, res) =>{
	if (i18n.getLocale() === "en"){
		res.render('privacy');		
	}else{
		res.render('privacyrus');
	}

});

app.get('/terms', (req, res) =>{
	if (i18n.getLocale() === "en"){
		res.render('terms');		
	}else{
		res.render('termsrus');
	}
});

app.get('/usercheck', function(req, res) {
    User.findOne({username: req.query.username.toLowerCase() || req.query.newUsername.toLowerCase()}, function(err, user){
        if(err) {
          console.log(err);
        }
        var message;
        if(user) {
            message = "user exists";
            res.sendStatus(404);
        } else {
            message= "user doesn't exist";
            res.sendStatus(202);
        }
    });
});

module.exports = app;

app.listen(process.env.PORT || 3000);
console.log("listening");
