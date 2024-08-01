const mongoose = require('mongoose');

const groupInvitationSchema = new mongoose.Schema({
  sender_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver_ids: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  ],
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
});

module.exports = mongoose.model('groupInvitation', groupInvitationSchema);
