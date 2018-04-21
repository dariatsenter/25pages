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
const auth = require('./auth.js');
const bcrypt = require('bcrypt');
const flash = require('connect-flash');
const hbs = require("hbs");
hbs.registerHelper('dateFormat', require('handlebars-dateformat'));


const bodyParser = require('body-parser');

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const app = express();
app.use(passport.initialize());
app.use(passport.session());


const Log = mongoose.model('Log');
const Book = mongoose.model('Book');
const User = mongoose.model("User");


passport.use(new LocalStrategy(function(username, password, done){
	User.findOne({ username : username}, function(err, user){
		console.log("in passport localstrategy findone");
		if(err) { return done(err); }
		if(!user){
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

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'pink',
    resave: false,
    saveUninitialized: true,
    expires: new Date(Date.now() + 3600000),
}));



app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use((req, res, next) => {
	console.log("req.user", req.user);
	res.locals.user = req.user;
	next();
});


app.get('/', (req, res) =>{
	res.render('about');
});

app.get("/explore", (req, res) =>{
	res.render("explore");
});

app.get('/api/users', function(req, res) {
	// TODO: retrieve all reviews or use filters coming in from req.query
	// send back as JSON list
	const query = {};

	if (req.query.username !== undefined && req.query.username !== ""){
		query["username"] = { "$regex": req.query.username, "$options": "i" };
	}

	console.log("query is trying ", query );
	User.find(query, function(err, users, count){
		res.json(users);
	});
});


app.get('/addlog', (req, res) =>{
	if (req.user){
		Log.find({user: req.user._id}, function(err, logs, count) {
			res.render('addlog', {user: res.locals.user, allLogs: logs});
		}).sort('-date').exec(function(err, docs) {});;
	} else{
		res.redirect("/login");
	}
});

app.post('/addlog', (req, res) =>{
	if (req.user){

	const newBook = new Book({title: req.body.title, author: req.body.author});
	newBook.save((err) =>{
		if (err){
			res.render('addlog', err);
			console.log(err);
		}else{
			const newLog = new Log({number: req.body.number, date: req.body.date, book: newBook, comments: req.body.comments, access: req.body.access, user: req.user._id});
			newLog.save((err) =>{
				if (err){
					res.json(err);
				}else{
					res.redirect("/addlog");
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
	console.log("body parsing", req.body);	
	const authenticate = passport.authenticate("local", {successRedirect: "/", failureRedirect: "/register", failureFlash: true});
	// console.log(req.body);
	auth.register(req.body.username, req.body.email, req.body.password, authenticate.bind(null, req, res), (err) =>{
		res.render("register", {message: err.message});
	} );
});

app.get('/login', (req, res) =>{
	res.render("login");
});
	

app.post('/login', 
	passport.authenticate("local", {successRedirect: "/", failureRedirect: "/login", failureFlash: true})
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


module.exports = app;


app.listen(process.env.PORT || 3000);
console.log("listening");
