const mongoose = require("mongoose");

const JobPostSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    company_logo: String,
    company_name: String,
    title: String,
    description: String,
    salary: String,
    type: {
      type: String,
      enum: [
        "Remote",
        "Hybrid",
        "Onsite",
        "Full time",
        "Part time",
        "Freelance",
        "Internship",
      ],
      default: "Full time",
    },
    shift: String,
    schedule: String,
    skills: [String],
    experience: String,
    education: String,
    vacancy: String,
    location: String,
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    applied_users: { type: Number, default: 0 },
  },
  { timestamps: true }
);

JobPostSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Jobpost", JobPostSchema);
