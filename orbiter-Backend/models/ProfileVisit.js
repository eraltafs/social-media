const mongoose = require("mongoose");

const profileVisitSchema = new mongoose.Schema({
  user_id: { type: String, ref: "User", required: true },
  profile_id: { type: String, ref: "User", required: true },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ProfileVisit", profileVisitSchema);
