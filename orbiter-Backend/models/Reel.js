const mongoose = require("mongoose");

const reelSchema = new mongoose.Schema({
  username: String,
  user_id: { type: String, ref: "User" },
  text: {
    type: String,
    // required: true,
  },
  video: String,
  likes: [
    {
      type: String,
      ref: "User",
    },
  ],
  comments: [
    {
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
  tags: [
    {
      type: String,
      ref: "User",
    },
  ],
  hashtags:[String],
  
  views: [
    {
      type: String,
      // ref: 'User',
    },
  ],
  view: {
    type: Number,
    default: 0,
    ref: "User",
  },
}, { timestamps: true });
reelSchema.index({ createdAt: -1 });
module.exports = mongoose.model("Reel", reelSchema);
