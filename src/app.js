// Daria Tsenter
//4/3/18

const express = require('express');
const session = require('express-session');
const path = require('path');

const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('./db');
const User = mongoose.model('User');
const Log = mongoose.model('Log');
const Book = mongoose.model('Book');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'public')));
// app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
	res.locals.user = req.session.user;
	next();
});

module.exports = app;
