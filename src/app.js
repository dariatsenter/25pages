// dt1308: linserv1.cims.nyu.edu, port 11256
// Daria Tsenter
//4/3/18
require('./db');
require('dotenv').config();
//require('bootstrap');
const mongoose = require('mongoose');
const express = require('express');
const session = require('express-session');
const path = require('path');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const auth = require('./auth.js');


const bodyParser = require('body-parser');

const app = express();
app.use(passport.initialize());
app.use(passport.session());


const Log = mongoose.model('Log');
const Book = mongoose.model('Book');



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'pink',
    resave: false,
    saveUninitialized: true,
    expires: new Date(Date.now() + 3600000),
}));

app.use((req, res, next) => {
	res.locals.user = req.session.user;
	next();
});

passport.use("register", new LocalStrategy(function(username, password, done){
	User.findOne({ username : username}, function(err, user){
		if(err) { return done(err); }
		if(!user){
			return done(null, false, { message: 'Incorrect username.' });
		}

		hash( password, user.salt, function (err, hash) {
			if (err) { return done(err); }
			if (hash == user.hash) return done(null, user);
			done(null, false, { message: 'Incorrect password.' });
		});
	});
}));

passport.serializeUser(function(user, done) {
  done(null, user._id);
});
 
passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

app.use(function authenticatedOrNot(req, res, next){
    if(req.isAuthenticated()){
        next();
    }else{
        res.redirect("/login");
    }
});

app.use(function userExist(req, res, next) {
    User.count({
        username: req.body.username
    }, function (err, count) {
        if (count === 0) {
            next();
        } else {
            // req.session.error = "User Exist"
            res.redirect("/register");
        }
    });
});

app.get('/', (req, res) =>{
	res.render('about');
});

app.get('/addlog', (req, res) =>{
	res.render('addlog');
});

app.post('/addlog', (req, res) =>{
	if (req.session.user){

	const newBook = new Book({title: req.body.title, author: req.body.author});
	newBook.save((err) =>{
		if (err){
			res.render('addlog', err);
			console.log(err);
		}else{
			const newLog = new Log({date: req.body.date, book: newBook, comments: req.body.comments, access: req.body.access, user: req.session.user._id});
			newLog.save((err) =>{
				if (err){
					res.json(err);
				}else{
					res.send(newLog);
				}
			});
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
	function success(newUser){
		auth.startAuthenticatedSession(req, newUser, (err) => {
			if (err){
				res.render('register', err);
			} else{
				res.redirect('/');
			}
		});
	}
	function error(err){
		res.render('register', err);
	}
	// console.log(req.body);
	auth.register(req.body.username, req.body.email, req.body.password, error, success);
});

app.get('/login', (req, res) =>{
	res.render('login');
});

app.post('/login', (req, res) =>{
function success(newUser){
		auth.startAuthenticatedSession(req, newUser, (err) => {
			if (err){
				res.render('login', err);
			} else{
				res.redirect('/');
			}
		});
	}
	
	function error(err){
		res.render('login', err);
	}

	auth.login(req.body.username, req.body.password, error, success);
});

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


module.exports = app;


app.listen(process.env.PORT || 3000);
console.log("listening");
