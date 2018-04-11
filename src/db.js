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


// // is the environment variable, NODE_ENV, set to PRODUCTION? 
// let dbconf;
// if (process.env.NODE_ENV === 'PRODUCTION') {
//  // if we're in PRODUCTION mode, then read the configuration from a file
//  // use blocking file io to do this...
//  const fs = require('fs');
//  const path = require('path');
//  const fn = path.join(__dirname, 'config.json');
//  const data = fs.readFileSync(fn);

//  // our configuration file will be in json, so parse it and set the
//  // conenction string appropriately!
//  const conf = JSON.parse(data);
//  dbconf = conf.dbconf;
// } else {
//  // if we're not in PRODUCTION mode, then use
//  dbconf = 'mongodb://localhost/dt1308';
// }
//mongoose.connect(dbconf);

mongoose.connect("mongodb://localhost/final")