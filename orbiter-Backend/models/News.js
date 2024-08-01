const mongoose = require("mongoose");

const newsSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      ref: "User",
    },
    news_images: String,
    heading: {
      type: String,
    },
    category: {
      type: String,
    },
    likes: [
      {
        type: String,
        ref: "User",
      },
    ],
    details: {
      type: String,
    },

    views: [
      {
        type: String,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);
newsSchema.index({ createdAt: -1 });
module.exports = mongoose.model("news", newsSchema);
