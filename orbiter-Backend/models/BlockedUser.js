
const mongoose = require('mongoose');

const blockedUserSchema = new mongoose.Schema({
  blockedBy:{ type: String},
  blockedUser:[
    {
      type: String,
    },
  ]
});

module.exports = mongoose.model('BlockedUser', blockedUserSchema);
