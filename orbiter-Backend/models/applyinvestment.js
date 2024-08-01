const mongoose = require("mongoose");

const applyinvestmentSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    location: { type: String },
    about: { type: String },
  },
  { timestamps: true }
);
applyinvestmentSchema.index({ createdAt: -1 });

module.exports = mongoose.model("applyinvestment", applyinvestmentSchema);
