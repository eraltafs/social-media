const mongoose = require("mongoose");

const educationSchema = new mongoose.Schema(
  {
    institute_name: String,
    course_type: String,
    duration: String,
  },
  { _id: false }
);

const graduationSchema = new mongoose.Schema(
  {
    college_name: String,
    course: String,
    course_type: String,
    specialization: String,
    duration: String,
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    project_title: String,
    project_detail: String,
    duration: String,
    project_link: String,
  },
  { _id: false }
);

const employmentSchema = new mongoose.Schema(
  {
    employment_type: String,
    company_name: String,
    job_title: String,
    joining_date: String,
    leaving_date: String, // Can be "present"
  },
  { _id: false }
);
const jobseekerSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    name: String,
    title: String,
    job_type: {
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
    education: {
      tenth: educationSchema,
      twelfth: educationSchema,
      graduation: graduationSchema,
      post_graduation: graduationSchema,
    },
    mobile: String,
    skills: [String],
    projects: [projectSchema],
    experience: [employmentSchema],
    expected_salary: String,
    resume: String,
    avatar: String,
    type: String,
    applied_jobs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Jobpost" }],
    saved_jobs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Jobpost" }],
  },
  { timestamps: true }
);

jobseekerSchema.index({ createdAt: -1 });

module.exports = mongoose.model("jobseeker", jobseekerSchema);
