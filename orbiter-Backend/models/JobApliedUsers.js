const mongoose = require("mongoose");

const AppliedUserSchema = new mongoose.Schema(
  {
    job_post_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Jobpost",
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "jobseeker",
    },
    experience_year: Number,
    experience_month: Number,
    skills: [{ type: String }],
    resume: String,
  },
  { timestamps: true }
);
AppliedUserSchema.index({ createdAt: -1, user_id: 1, job_post_id: 1 });

const AppliedUser = mongoose.model("AppliedUser", AppliedUserSchema);

module.exports = AppliedUser;
