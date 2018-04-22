const bcrypt = require('bcryptjs');

const mongoose = require('mongoose');

const User = mongoose.model('User');

function register(username, email, password, successCallback, errorCallback) {
	if (username.length >= 6 && password.length >= 6){
		User.findOne({username: username}, (err, result) => {
			if (result){
				errorCallback({message: "USERNAME ALREADY EXISTS"});
				console.log("USERNAME ALREADY EXISTS");
			} else{
				// OK! create new user
				bcrypt.hash(password, 10, function(err, hash) {
					// do more stuff here!
					const user = new User({
						username: username,
						email: email,
						password: hash
					});

					user.save((err, savedUser) => {
						if (err){
							errorCallback({message: "DOCUMENT SAVE ERROR"});
							console.log("DOCUMENT SAVE ERROR");
						} else{
							successCallback(savedUser.username, savedUser.password);
						} 
					});

				});
			}
		});

	}else {
		errorCallback({message: "USERNAME PASSWORD TOO SHORT"});
		console.log("USERNAME PASSWORD TOO SHORT");
	}
}

function startAuthenticatedSession(req, user, cb) {
	// assuming that user is the user retrieved from the database
	req.session.regenerate((err) => {
		if (err) {
			console.log("SESSION REGENERATION");
			cb({message: "REGENERATING SESSION"});
		} else {
		req.session.user = {
			username: user.username,
			_id: user._id
		};
		}
	cb();
	});
}

module.exports = {
  startAuthenticatedSession: startAuthenticatedSession,
  register: register,
  //login: login
};
