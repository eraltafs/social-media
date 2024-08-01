const mongoose = require("mongoose");

const groupPostSchema = new mongoose.Schema({
  group_id: String,
  username: String,
  user_id: {
    type: String,
    ref: "User",
  },
  avatar:String,
  firebase_id: { type: String },
  text: {
    type: String,
    // required: true,
  },
  image: String,
  video: String,
  likes: [
    {
      type: String,
      ref: "User",
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
  //   views: { type: Number, default: 0 },
},{ timestamps: true });
groupPostSchema.index({ createdAt: -1 });

module.exports = mongoose.model("groupPost", groupPostSchema);
