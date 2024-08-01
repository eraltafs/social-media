// Assuming you have Mongoose installed and connected to your database
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const shareSchema = new Schema({
  sender_firebaseid: { type: String },
  receiver_firebaseid: { type: String },
  reel_id: {
    type: Schema.Types.ObjectId,
    ref: 'Reel', // Reference to the Reel model
    // required: true,
  },
  post_id: {
    type: Schema.Types.ObjectId,
    ref: 'Reel', // Reference to the Reel model
    // required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// Create a Share model using the schema
const Share = mongoose.model('Share', shareSchema);

module.exports = Share;
