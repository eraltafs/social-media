const mongoose = require("mongoose");

const posttestSchema = new mongoose.Schema({
  username: String,
  firebase_id: { type: String },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  text: {
    type: String,
    // required: true,
  },
  image: String,
  video: String, // Add a field for the profile URL
  // reels:String,
  likes: [
    {
      type: String,
      ref: "User",
    },
  ],
  repost: [
    {
      type: String,
    },
  ],
  comments: [
    {
      firebase_id: { type: String },
      user_id: { type: String },
      text: {
        type: String,
        // required: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],

  createdAt: {
    type: Date,
    default: Date.now,
  },
  views: [
    {
      type: String,
      // ref: 'User',
    },
  ],
  tags: [
    {
      type: String,
      ref: "User",
    },
  ],
  view: {
    type: Number,
    default: 0,
    ref: "User",
  },
  commentSettings: {
    type: String,
    enum: ["everyone", "connections", "none"],
    default: "everyone", // Default to everyone
  },
});

module.exports = mongoose.model("Posttest", posttestSchema);
