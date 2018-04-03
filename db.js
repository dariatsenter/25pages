const mongoose = require('mongoose');

// add your schemas
const UserSchema = new mongoose.Schema({
	username: {type: String, unique: true, required: true},
	email: {type: String, unique: true, required: true},
	password: {type: String, unique: true, required: true},
	logs: [Log]
});

const LogSchema = new mongoose.Schema({
	date: {type: Date, required: true},
	book: {type: Book, unique: true, required: true},
	comments: String,
	user: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
});

const BookSchema = new mongoose.Schema({
	title: {type: String, unique: true, required: true},
	author: {type: String, unique: true, required: true},
	comments: String,
});

module.exports = mongoose.model("User", UserSchema);
module.exports = mongoose.model("Log", LogSchema);
module.exports = mongoose.model("Book", BookSchema);



mongoose.connect('mongodb://localhost/final');