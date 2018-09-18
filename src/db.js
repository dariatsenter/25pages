const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const bcrypt = require('bcrypt');

// add your schemas
const User = new mongoose.Schema({
	username: {type: String, unique: true, required: true},
	email: {type: String, unique: true, required: true},
	password: {type: String, unique:false, sparse: true},
	resetPasswordToken: String,
	resetPasswordExpires: Date,
	numberOfLogs: Number
});

User.plugin(passportLocalMongoose);

//serialize and deserialize by email otherwise when username gets change, the user is forced to log out
User.statics.serializeUser = function() {
    return function(user, cb) {
        cb(null, user.email);
    }
};

User.statics.deserializeUser = function() {
    var self = this;

    return function(id, cb) {
        self.findOne({email: id}, cb);
    }
};

module.exports = mongoose.model("User", User);

const Log = new mongoose.Schema({
	number: Number,
	date: {type: Date, required: true},
	title: {type: String, required: true},
	author: {type: String, required: true},
	comments: String,
	access: String,
	user: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
});

module.exports = mongoose.model("Log", Log);


mongoose.connect("mongodb://heroku_bp8wct73:sm470cemnvagftcq0b1a6j0a1r@ds243049.mlab.com:43049/heroku_bp8wct73");