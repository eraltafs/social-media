const mongoose = require('mongoose');

const groupChatModel = new mongoose.Schema(
	{
		roomId: String,
		senderId: String,
		senderName: String,
		avatar: String,
		chatType: {
			type: String,
			enum: ['message', 'image', 'file'],
			default: 'message',
		},
		message: String,
		image: String,
		file: String,
		time: Date,
	},
	{ timestamps: true }
);

groupChatModel.index({ time: 1 });

module.exports = mongoose.model('GroupChat', groupChatModel);
