const mongoose = require("mongoose");

const GroupSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
  },
  icon: {
    type: String,
    trim: true,
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Room",
  },
  tagline: String,
  isComunityGroup: {
    type: Boolean,
    default: false,
  },
  admin: [
    {
      avatar: {
        type: String,
        trim: true,
      },
      name: {
        type: String,
        default: "Socilious",
        trim: true,
      },
      uid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
  ],
}, { timestamps: true });

GroupSchema.index({ createdAt: 1 });

module.exports = mongoose.model("Group", GroupSchema);
