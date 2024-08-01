const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  members : {
    type: Array,
  } ,
  timestamp: {
    type: Date,
    default: Date.now,
  },
  chatExists: {
    type: Boolean,
  },
  lastUpdated: {
    type: Date,
  }
});

module.exports = mongoose.model('Chat', chatSchema);

