const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    username: String,
    user_id: {
      type: String,
      ref: "User",
    },
    text: String,

    image: [String],
    video: String, // Add a field for the profile URL
    // reels:String,
    likes: [
      {
        type: String,
        ref: "User",
      },
    ],
    repost: [String],
    comments: [
      {
        user_id: { type: String },
        text: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    views: [String],
    tags: [
      {
        type: String,
        ref: "User",
      },
    ],
    hashtags: [String],
    view: {
      type: Number,
      default: 0,
      ref: "User",
    },
    commentSettings: {
      type: String,
      enum: ["everyone", "connections", "none", "both", "following"],
      default: "everyone", // Default to everyone
    },
  },
  { timestamps: true }
);
postSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Post", postSchema);
