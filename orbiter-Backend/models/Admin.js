const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
	name: {
		type: String,
		min: 1,
		max: 50,
		trim: true,
	},
	email: {
		type: String,
		required: true,
		trim: true,
	},
	password: {
		type: String,
		required: true,
		trim: true,
	},
});


module.exports = mongoose.model('Admin', AdminSchema);
