const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  body: {
    type: String,
  },
  type: {
    type: String,
    enum: [
      "like",
      "like_reel",
      "comment",
      "comment_reel",
      "repost",
      "connection_request",
      "connection_accept",
      "follow",
      "group_invite",
    ],
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
  },
  postimage: String,
  postText: String,
  video: String,
  request_ID: String,
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now, // Set a default value for createdAt
  },
});

notificationSchema.index({ recipient: 1, type: 1, post: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
