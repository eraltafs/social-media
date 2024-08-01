const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      ref: "User",
    },
    username: String,
    email: String,
    thoughts: {
      type: String,
      // required: true,
    },
    rating: {
      type: Number,
    },
    Reccomend: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes",
    },
  },
  { timestamps: true }
);
feedbackSchema.index({ createdAt: -1 });

module.exports = mongoose.model("feedback", feedbackSchema);
