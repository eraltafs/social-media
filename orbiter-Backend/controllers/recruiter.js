
const path = require("path");
const fs = require("fs");



const User = require("../models/User");
const JobPost = require("../models/jobPost");
const Recruiter = require("../models/recruiter");
const Jobseeker = require("../models/jobseeker");
const AppliedUser = require("../models/JobApliedUsers");


const { uploadToS3 } = require("../utils/uploadAws");
const { calculateAgeOfJob } = require("../utils/timeUtils");


const deleteLocalFiles = (files) => {
  files.forEach((file) => {
    if (file) {
      const filePath = path.join(__dirname, `../upload/${file.fieldname}s`, file.filename);
      fs.unlinkSync(filePath);
    }
  });
};

const createProfile = async (req, res) => {
  const {
    user_id,
    company_name,
    description,
    industry,
    established,
    website,
    size,
    email,
    mobile,
    address,
    country,
    state,
    head_quarter,
    CIN_NO,
    GSTIN_NO,
    msme,
    startup_india,
    company_pan,
    tax_identification,
    links
  } = req.body;

  const files = req.files;
  const requiredFiles = ["logo", "certificate", "license"];

  try {
    const recruiter = await Recruiter.findOne({ user_id }).select("_id");

    if (recruiter) {
      deleteLocalFiles(requiredFiles.map(key => files[key] && files[key][0]).filter(Boolean));
      return res.status(409).json({ error: "Recruiter already exists" });
    }

    const user = await User.findById(user_id).select("username first_name last_name role");
    if (!user) {
      deleteLocalFiles(requiredFiles.map(key => files[key] && files[key][0]).filter(Boolean));
      return res.status(404).json({ Success: 0, error: "User not found" });
    }

    if (user.role === "jobseeker") {
      deleteLocalFiles(requiredFiles.map(key => files[key] && files[key][0]).filter(Boolean));
      return res.status(409).json({
        Success: 0,
        error: "You are a job seeker, so you can't be a recruiter",
      });
    }

    const data = {
      user_id,
      company_name,
      description,
      industry,
      established,
      website,
      size,
      email,
      mobile,
      address,
      country,
      state,
      head_quarter,
      links: JSON.parse(links),
      CIN_NO,
      GSTIN_NO,
      msme,
      startup_india,
      company_pan,
      tax_identification,
    };

    if (!files["logo"]) {
      return res.status(400).json({ message: "No logo file provided" });
    }

    const logoUrl = await uploadToS3(files["logo"][0], "logos", "image/jpeg");

    const certificateUrl = files["certificate"]
      ? await uploadToS3(files["certificate"][0], "certificates", "application/pdf")
      : null;

    const licenseUrl = files["license"]
      ? await uploadToS3(files["license"][0], "licenses", "application/pdf")
      : null;

    data.company_logo = logoUrl;
    if (certificateUrl) {
      data.certificate_Incorporation = certificateUrl;
    }
    if (licenseUrl) {
      data.business_License = licenseUrl;
    }

    // Remove local files after successful upload
    deleteLocalFiles([
      files["logo"] && files["logo"][0],
      files["certificate"] && files["certificate"][0],
      files["license"] && files["license"][0]
    ]);

    const newRecruiter = await Recruiter.create(data);
    user.role = "recruiter";
    await user.save();

    return res.status(200).json({
      Success: 1,
      message: "Profile created successfully",
      newRecruiter,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

const createPost = async (req, res) => {
  const {
    user_id,
    title,
    description,
    salary,
    type,
    shift,
    schedule,
    skills,
    experience,
    education,
    location,
    vacancy,
  } = req.body;
  const data = {
    user_id,
    title,
    description,
    salary,
    type,
    shift,
    schedule,
    skills,
    experience,
    education,
    location,
    vacancy,
  };

  try {
    const userData = await Recruiter.findOne({ user_id }).select(
      "company_name company_logo"
    );
    if (!userData) {
      return res.status(404).json({ error: "recruiter not found" });
    }

    data.company_logo = userData.company_logo;
    data.company_name = userData.company_name;

    const job_post = await JobPost.create(data);

    return res
      .status(200)
      .json({ Success: 1, message: "job post created successfully", job_post });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

const getJobPosts = async (req, res) => {
  const { user_id } = req.body;

  const search = req.query.search
    ? { title: { $regex: req.query.search, $options: "i" } }
    : {};
  const filter = req.query.filter ? { status: req.query.filter } : {};
  try {
    const user = await Recruiter.findOne({ user_id }).select("company_logo company_name country email");
    if (!user) {
      return res.status(404).json({ success: 0, error: "recruiter not found" });
    }
    
    
    const jobPosts = await JobPost.find({ user_id, ...search, ...filter });
    if (!jobPosts) {
      return res.status(404).json({ success: 0, error: "jobPosts not found" });
    }

    const job_posts = jobPosts.map((post) => {
      const plainPost = post.toObject();
      plainPost.createdAt = calculateAgeOfJob(post.createdAt);
      return plainPost;
    });

    return res.status(200).json({
      Success: 1,
      message: "posted jobs fetched successfully",
      job_posts,
      company_detail:user

    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

const changeJobStatus = async (req, res) => {
  const { user_id, post_id } = req.body;

  try {
    const postData = await JobPost.findById(post_id);
    if (!postData) {
      return res.status(404).json({ success: 0, error: "post data not found" });
    }
    if (postData.user_id != user_id) {
      return res.status(401).json({
        success: 0,
        message: `You are not creator of job post, so not authorised`,
      });
    }
    if (postData.status === "Active") {
      postData.status = "Inactive";
    } else {
      postData.status = "Active";
    }
    await postData.save();
    return res.status(200).json({
      Success: 1,
      message: `status changed successfully`,
      job_post: postData,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

const getJobDetail = async (req, res) => {
  const { user_id, post_id } = req.body;

  try {
    const userData = await Recruiter.findOne({ user_id }).select(
      "company_name"
    );
    if (!userData) {
      return res.status(404).json({ success: 0, error: "recruiter not found" });
    }
    const postData = await JobPost.findById(post_id);

    if (!postData) {
      return res.status(404).json({ success: 0, error: "post data not found" });
    }
    if (postData.user_id != user_id) {
      return res.status(401).json({
        success: 0,
        message: `You are not creator of job post, so not authorised`,
      });
    }

    const plainPostData = postData.toObject();

    plainPostData.createdAt = calculateAgeOfJob(postData.createdAt);

    return res.status(200).json({
      Success: 1,
      message: `status changed successfully`,
      job_post: plainPostData,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

const getAllResumes = async (req, res) => {
  const { user_id } = req.body;
  const search = req.query.search
    ? { title: { $regex: req.query.search, $options: "i" } }
    : {};
  try {
    const userData = await Recruiter.findOne({ user_id }).select(
      "company_name"
    );

    if (!userData) {
      return res.status(401).json({
        success: 0,
        error: "you are not recruiter. so not authorised",
      });
    }
  
    const jobseekers = await Jobseeker.find({
      resume: { $exists: true },
      ...search,
    }).populate({
      path: "user_id",
      select: "avatar email dob institute country type name",
    });
    return res.status(200).json({
      Success: 1,
      message: `status changed successfully`,
      jobseekers,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

const getJobApplicants = async (req, res) => {
  const { jobId } = req.params;
  try {
    const applicants = await AppliedUser.find({ job_post_id: jobId }).populate(
      "user_id"
    );
    if (!applicants) {
      return res
        .status(404)
        .json({ Success: 0, error: "No applicants found for this job post" });
    }

    return res.status(200).json({
      Success: 1,
      message: "Applicants fetched successfully",
      applicants,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

const getProfile = async (req, res) => {
  const { user_id } = req.params;

  try {
    const recruiter = await Recruiter.findOne({ user_id })
    if (!recruiter) {
      return res.status(404).json({ Success: 0, error: "Recruiter not found" });
    }

    const jobPosts = await JobPost.find({user_id,status: "Active"});
    if (!jobPosts) {
      return res.status(404).json({ success: 0, error: "jobPosts not found" });
    }

    const job_posts = jobPosts.map((post) => {
      const plainPost = post.toObject();
      plainPost.createdAt = calculateAgeOfJob(post.createdAt);
      return plainPost;
    });
    return res.status(200).json({
      Success: 1,
      message: "Recruiter profile fetched successfully",
      recruiter,
      job_posts
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};
module.exports = {
  createProfile,
  getProfile,
  createPost,
  getJobPosts,
  changeJobStatus,
  getJobDetail,
  getAllResumes,
  getJobApplicants,
};
