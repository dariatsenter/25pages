const mongoose = require('mongoose');

// add your schemas
const Book = new mongoose.Schema({
	title: {type: String, required: true},
	author: {type: String,  required: true}
});
module.exports = mongoose.model("Book", Book);


const User = new mongoose.Schema({
	username: {type: String, unique: true, required: true},
	email: {type: String, unique: true, required: true},
	password: {type: String, required: true}
});
module.exports = mongoose.model("User", User);

const Log = new mongoose.Schema({
	number: Number,
	date: {type: Date, required: true},
	book: {type: Book, required: true},
	comments: String,
	access: String,
	user: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
});

module.exports = mongoose.model("Log", Log);


mongoose.connect("mongodb://heroku_bp8wct73:sm470cemnvagftcq0b1a6j0a1r@ds243049.mlab.com:43049/heroku_bp8wct73");