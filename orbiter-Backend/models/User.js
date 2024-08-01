const mongoose = require("mongoose");
const educationSchema = new mongoose.Schema(
  {
    institute: String,
    degree: String,
    specialization: String,
  },
  { _id: false }
);
const experienceSchema = new mongoose.Schema(
  {
    "company": "String",
    "title": "String",
    "type": "String",
    "date": "String",
  },
  { _id: false }
);
const certificateSchema = new mongoose.Schema(
  {
    "course": "String",
    "organization": "String",
    "ID": "String",
    "URL": "String",
  },
  { _id: false }
);
const volunteerSchema = new mongoose.Schema(
  {
    "organization": "String",
    "position": "String",
    "date": "String",
  },
  { _id: false }
);

const mentorSchema = new mongoose.Schema(
  {
    domain: String,
    expertise: String,
    startupMentored: String,
    MentoringSessions: String,
    incubationConnection: String,
    mentoringRegion: String,
    state: String,
  },
  { _id: false }
);

const investorSchema = new mongoose.Schema(
  {
    domain: String,
    mentorship: String,
    currency: String,
    fundingRange: Number,
    fundingAreaItIsRaised: String,
    incubatorLinked: String,
    cityOrHeadquarter: String,
  },
  { _id: false }
);

const startupSchema = new mongoose.Schema({
  domain: String,
  investors: String,
  startupArea: String,
  team: String,
  incubatorName: String,
});
const studentSchema = new mongoose.Schema(
  {
    education: educationSchema,
    experience: experienceSchema,
    certificate: certificateSchema,
    volunteer: volunteerSchema,
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
      trim: true,
      index: true,
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
    email: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    online: {
      type: Boolean,
      default: false,
      index: true,
    },
    isverified: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["Active", "Deactive"],
      default: "Active",
      index: true,
    },
    role: { type: String, enum: ["jobseeker", "recruiter"], index: true },
    isPremium: {
      type: Boolean,
      default: false,
      index: true,
    },
    unReadNotification: {
      type: Number,
      default: 0,
    },
    project: [
      {
        title: String,
        detail: String,
      },
    ],
    mentorDetails: mentorSchema,
    investorDetails: investorSchema,
    startupDetails: startupSchema,
    studentDetails: studentSchema,
    password: String,
    name: String,
    first_name: String,
    last_name: String,
    phone: String,
    avatar: String,
    bio: String,
    country: String,
    state: String,
    institute: String,
    dob: String,
    gender: { type: String, enum: ["Male", "Female"] },
    lastSeen: Date,
    type: String,
    coverPhoto: String,
    headquater: String,
    userReferral: String,
    achievement: String,
    contact: String,
    website: String,
    degree: String,
    location: String,
    startupType: String,
    industry: String,
    Partnerships_Collaborations: String,
    interest: [String],
    links: [String],
    items: [String],
    designation: [String],
    blockedContent: [String],
    blockedContentReel: [String],
    referredList: [String],
    fcmTokenList: [String],
    preferences: [String],
    skills: [String],
    joinedGroups: [String],
  },
  { timestamps: true }
);
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model("User", userSchema);
