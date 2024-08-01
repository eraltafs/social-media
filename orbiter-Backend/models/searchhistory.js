const mongoose = require("mongoose");

const searchhistorySchema = new mongoose.Schema({
  user_id: { type: String, ref: "User", required: true },
  search_ids: [{ type: String, ref: "User", required: true }],
});

module.exports = mongoose.model("searchhistory", searchhistorySchema);
