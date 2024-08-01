const mongoose = require('mongoose');

const roomModel = new mongoose.Schema(
	{
		members: [
			{
				uid: String,
				name: String,
				avatar: String,
			},
		],
		lastMessage: {
			chatType: {
				type: String,
				enum: ['message', 'image'],
				default: 'message',
			},
			message: String,
			image: String,
			// file: String,
			time: {
				type: Date,
				default: new Date(),
			},
		},
	},
	{ timestamps: true }
);

roomModel.index({ updatedAt: 1 });

module.exports = mongoose.model('Room', roomModel);
