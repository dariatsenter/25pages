const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// add your schemas
const User = new mongoose.Schema({
	username: {type: String, unique: true, required: true},
	email: {type: String, unique: true, required: true},
	password: {type: String},
	resetPasswordToken: String,
	resetPasswordExpires: Date
});

// needed so that don't have to implement hasing logic in several places in the app
User.pre('save', function(next) {
	const user = this;
	const SALT_FACTOR = 5;
	//nothing happens if password is unchanged
	if (!user.isModified('password')) {return next();}

	// 10 is salt factor
	bcrypt.genSalt(SALT_FACTOR, function(err, salt) {
		if (err) {return next(err);}
		bcrypt.hash(user.password, salt, function(err, hash) {
			if (err) {return next(err);}
			user.password = hash;
			next();
		});
	});
});

User.statics.comparePassword = function(candidatePassword, hashedPassword, cb) {
	bcrypt.compare(candidatePassword, hashedPassword, function(err, isMatch) {
		if (err) {return cb(err);}
		cb(null, isMatch);
	});
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