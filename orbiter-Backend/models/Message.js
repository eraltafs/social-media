const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chat_id: {
    type: String,
    required: true,
  },
  sender: {
    type: String,
    ref: 'User', // Reference to the User model or your sender model
    required: true,
  },
  recipient: {
    type: String,
    ref: 'User', // Reference to the User model or your recipient model
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  iv:String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
  isRead: {
      type: Boolean,
      default: false, // Messages start as unread
    },
});

module.exports = mongoose.model('Message', messageSchema);

