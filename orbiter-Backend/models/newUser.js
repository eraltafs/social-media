const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    // required: true,
    unique: true,
    trim: true,
  },
  password: String,
  items: {
    type: String,
    trim: true,
  },
  followers: [
    {
      type: String,
      ref: "User",
    },
  ],
  following: [
    {
      type: String,
      ref: "User",
    },
  ],
  firebase_id: { type: String }, // Ensure uniqueness of firebase_id
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Reference to the User model
  },
  name: {
    type: String,
  },
  first_name: {
    type: String,
  },
  last_name: {
    type: String,
    // required: true,
    trim: true,
  },
  email: {
    type: String,
    // required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  avatar: String,
  bio: {
    type: String,
    trim: true,
  },
  country: {
    type: String,
    trim: true,
  },
  state: String,
  institute: {
    type: String,
    trim: true,
  },
  dob: String,
  designation: {
    type: String,
    trim: true,
  },
  links: [{ type: String }],
  gender: {
    type: String,
  },
  online: {
    type: Boolean,
    default: false,
  },
  isverified: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
    default: false,
  },
  coverPhoto: String,
  headquater: {
    type: String,
    trim: true,
  },
  lastSeen: Date,
  blockedContent: [
    {
      type: String,
    },
  ],
  blockedContentReel: [
    {
      type: String,
    },
  ],
  userReferral: {
    type: String,
  },
  projectAndAchievement: {
    type: String,
  },
  contact: {
    type: String,
  },

  referredList: [
    {
      type: String,
    },
  ],
  website: {
    type: String,
  },
  skills: {
    type: String,
  },
  fcmTokenList: [
    {
      type: String,
    },
  ],
  preferences: [
    {
      type: String,
    },
  ],
  status: {
    type: String,
    enum: ["Active", "Deactive"],
    default: "Active",
  },
  joinedGroups: {
    type: [String],
    trim: true,
  },
  role: { type: String, enum: ["jobseeker", "recruiter"] },

  isPremium: {
    type: Boolean,
    default: false,
  },

  unReadNotification: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model("User", userSchema);
