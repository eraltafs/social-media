const mongoose = require("mongoose");

const verificationSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      ref: "User",
    },
    username: String,
    full_name: String,
    email: String,
    phone: Number,
    document: String,
    aadhar: Number,
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);
verificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model("verification", verificationSchema);
