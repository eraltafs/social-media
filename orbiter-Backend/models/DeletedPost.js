const mongoose = require("mongoose");

const deletedPostSchema = new mongoose.Schema(
  {

    post_id: { type: String },
    user_id: {
      type: String,
      ref: "User",
    },
    text: {
      type: String,
      // required: true,
    },
    image: [String],
    video: String,
    likes: [
      {
        type: String,
        ref: "User",
      },
    ],
    hashtags:[String],
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

    views: [
      {
        type: String,
        // ref: 'User',
      },
    ],

    deletedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);
deletedPostSchema.index({ deletedAt: -1 });

const DeletedPost = mongoose.model("DeletedPost", deletedPostSchema);

module.exports = DeletedPost;
