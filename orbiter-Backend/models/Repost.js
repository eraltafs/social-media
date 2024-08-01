const mongoose = require("mongoose");

const repostSchema = new mongoose.Schema(
  {
    user_id: { type: String },
    repost_ids: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true }
);
repostSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Repost", repostSchema);
