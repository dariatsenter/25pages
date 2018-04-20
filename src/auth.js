const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const User = mongoose.model('User');

function register(username, email, password, errorCallback, successCallback) {
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
							successCallback(savedUser);
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

function login(username, password, errorCallback, successCallback) {
	User.findOne({username: username}, (err, user) => {
	if (!err && user) {
    // compare with form password!
	bcrypt.compare(password, user.password, (err, passwordMatch) => {
			// regenerate session if passwordMatch is true
		if (passwordMatch){
			successCallback(user);	
		} else{
			errorCallback({message: "PASSWORDS DO NOT MATCH"});
			console.log("PASSWORDS DO NOT MATCH");
		}
	});

	} else{
		errorCallback({message: "USER NOT FOUND"});
		console.log("USER NOT FOUND");
	}
});

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
  login: login
};
