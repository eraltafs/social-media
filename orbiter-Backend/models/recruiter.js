const mongoose = require("mongoose");

const recruiterSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    company_logo: String,
    company_name: String,
    description: String,
    industry: String,
    established: Date,
    website: String,
    size: String,
    email: String,
    mobile: String,
    address: String,
    country: String,
    state:String,
    head_quarter:String,
    links: {
      facebook:String,
      linkedin:String,
      instagram:String,
      twitter:String,
    },
    CIN_NO: String,
    GSTIN_NO: String,
    msme: String,
    startup_india: String,
    company_pan: String,
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    certificate_Incorporation:String,
    business_License:String,
    tax_identification:String,
  },
  { timestamps: true }
);

recruiterSchema.index({ createdAt: -1, user_id: 1 });

module.exports = mongoose.model("recruiter", recruiterSchema);
