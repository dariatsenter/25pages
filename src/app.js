// dt1308: linserv1.cims.nyu.edu, port 11256
// Daria Tsenter
//4/3/18
//blablabla
require('./db');
require('dotenv').config();
//require('bootstrap');
const mongoose = require('mongoose');
const express = require('express');
const nodemailer = require('nodemailer');
const session = require('express-session');
const path = require('path');
const auth = require('./auth.js');
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
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());


const Log = mongoose.model('Log');
const User = mongoose.model("User");


passport.use(new LocalStrategy(function(username, password, done){
	User.findOne({ username : username}, function(err, user){
		if(err) { return done(err); }
		if(!user){
			console.log("it actually is incorrect");
			
			return done(null, false, { message: 'Incorrect username.' });
		}

		bcrypt.compare(password, user.password, (err, res) =>{
			if (err){
				return done(err);
			}else if (!res){
				return done(null, false, {message: "USERNAME OR PASSWORD NOT FOUND"});
			}
			return done(null, user);
		})
	});
}));

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "https://www.25pages.club/auth/facebook/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    User.findOne({ username : profile.id}, function(err, user) {
      if (err) { return done(err); }
      if (!user){
      	console.log("singing up a user through facebook now");
      	const authenticate = passport.authenticate("local", {successRedirect: "/", failureRedirect: "/register", failureFlash: true});
		auth.register(profile.id, profile.emails[0].value, "", authenticate.bind(null, req, res), (err) =>{
		res.render("register", {message: err.message});
		console.log('now need to implement an option to change personal information');
	} );
      }
      done(null, user);
    });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user.username);
});

passport.deserializeUser(function(username, done) {
  User.findOne({username: username}, function(err, user) {
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
			totalPages = logs.reduce(function(a, b){
				return {number: a.number + b.number};
			}, 0);
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
	const authenticate = passport.authenticate("local", {successRedirect: "/", failureRedirect: "/register", failureFlash: true});
	auth.register(req.body.username, req.body.email, req.body.password, authenticate.bind(null, req, res), (err) =>{
		res.render("register", {message: err.message});
	} );
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
	if (req.session){
		//destroy session
		req.session.destroy((err)=>{
			if (err){
				res.render('/', err);
			} else{
				res.redirect('/');
			}
		});
	}
});

app.get('/auth/facebook', passport.authenticate('facebook'));


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



module.exports = app;


app.listen(process.env.PORT || 3000);
console.log("listening");
