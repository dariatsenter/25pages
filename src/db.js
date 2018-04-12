const mongoose = require('mongoose');

// add your schemas
const Book = new mongoose.Schema({
	title: {type: String, unique: true, required: true},
	author: {type: String, unique: true, required: true},
	comments: String,
});
module.exports = mongoose.model("Book", Book);


const User = new mongoose.Schema({
	username: {type: String, unique: true, required: true},
	email: {type: String, unique: true, required: true},
	password: {type: String, unique: true, required: true}
});
module.exports = mongoose.model("User", User);

const Log = new mongoose.Schema({
	date: {type: Date, required: true},
	book: {type: Book, unique: true, required: true},
	comments: String,
	user: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
});

module.exports = mongoose.model("Log", Log);


mongoose.connect("mongodb://localhost/27017/final");