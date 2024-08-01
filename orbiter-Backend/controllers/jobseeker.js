const path = require("path");
const fs = require("fs");

const User = require("../models/User");
const jobPost = require("../models/jobPost");
const Jobseeker = require("../models/jobseeker");
const AppliedUser = require("../models/JobApliedUsers");

const { uploadToS3 } = require("../utils/uploadAws");
const { calculateAgeOfJob } = require("../utils/timeUtils");

const deleteLocalFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error("Error deleting file:", err);
      } else {
        console.log("File deleted successfully");
      }
    });
  }
};
const createProfile = async (req, res) => {
  const { user_id, title, job_type, mobile, expected_salary } = req.body;
  const resume = req.file;


  try {
    const user = await User.findById(user_id).select(
      "username first_name last_name role type avatar"
    );

    if (!user) {
      deleteLocalFile(
        `${path.join(__dirname, "../upload/resumes")}/${resume.filename}`
      );
      return res.status(404).json({ Success: 0, error: "User not found" });
    }

    const { role, first_name, last_name, username, avatar, type } = user;

    if (role === "recruiter") {
      deleteLocalFile(
        `${path.join(__dirname, "../upload/resumes")}/${resume.filename}`
      );
      return res.status(409).json({
        Success: 0,
        error: "You are a recruiter, so you can't be a job seeker",
      });
    }

    const alreadyJobSeeker = await Jobseeker.findOne({ user_id });

    if (alreadyJobSeeker) {
      deleteLocalFile(
        `${path.join(__dirname, "../upload/resumes")}/${resume.filename}`
      );
      return res
        .status(409)
        .json({ Success: 0, error: "You are already a job seeker" });
    }

    const data = {
      user_id,
      title,
      job_type,
      mobile,
      expected_salary,
      education: JSON.parse(req.body.education),
      skills: JSON.parse(req.body.skills),
      projects: JSON.parse(req.body.projects),
      experience: JSON.parse(req.body.experience),
      avatar,
      type,
      name: `${first_name || username} ${last_name || ""}`.trim(),
    };

    if (!resume) {
      return res.status(400).json({ message: "No resume file provided" });
    }

    const resumeUrl = await uploadToS3(resume, "resumes", "application/pdf");
    data.resume = resumeUrl;
    deleteLocalFile(
      path.join(__dirname, "../upload/resumes", resume.filename)
    );

    const jobseeker = await Jobseeker.create(data);
    user.role = "jobseeker";
    await user.save();

    return res.status(200).json({
      Success: 1,
      message: "Profile created successfully",
      jobseeker,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({ error: error.message });
  }
};

const getProfile = async (req, res) => {
  const { user_id } = req.params;

  try {
    const user = await Jobseeker.findOne({ user_id }).populate(
      "user_id",
      "avatar"
    );
    if (!user) {
      return res.status(404).json({ Success: 0, error: "User not found" });
    }
    return res.status(200).json({
      Success: 1,
      message: "user fetched successfully",
      applied_jobs: user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

const updateProfile = async (req, res) => {
  const { user_id, title, job_type, mobile, expected_salary } = req.body;
  const resumeFile = req.file;

  

  try {
    const user = await Jobseeker.findOne({ user_id });

    if (!user) {
      if (resumeFile) {
        deleteLocalFile(
          `${path.join(__dirname, "../upload/resumes")}/${resumeFile.filename}`
        );
      }
      return res.status(404).json({ Success: 0, error: "User not found" });
    }

    const data = {
      user_id,
      title,
      job_type,
      mobile,
      expected_salary,
      education: JSON.parse(req.body.education),
      skills: JSON.parse(req.body.skills),
      projects: JSON.parse(req.body.projects),
      experience: JSON.parse(req.body.experience),
    };

    if (resumeFile) {
      const resumeUrl = await uploadToS3(resumeFile, "resumes", "application/pdf");
    data.resume = resumeUrl;
    deleteLocalFile(
      `${path.join(__dirname, "../upload/resumes")}/${resumeFile.filename}`
    );
    }

    const updatedJobseeker = await Jobseeker.findOneAndUpdate(
      { user_id },
      { $set: data },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      Success: 1,
      message: "Profile updated successfully",
      updatedJobseeker,
    });
  } catch (error) {
    console.error(error);
    if (resumeFile) {
      deleteLocalFile(
        `${path.join(__dirname, "../upload/resumes")}/${resumeFile.filename}`
      );
    }
    return res.status(500).json({ error: error.message });
  }
};

const getJobs = async (req, res) => {
  const { user_id } = req.body;
  const { search, filter, location } = req.query;
  const query = {
    ...(search ? { title: { $regex: search, $options: "i" } } : {}),
    ...(filter ? { type: { $regex: filter, $options: "i" } } : {}),
    ...(location ? { location: { $regex: location, $options: "i" } } : {}),
  };
  try {
    const user = await Jobseeker.findOne({ user_id });
    if (!user) {
      return res.status(404).json({ Success: 0, error: "User not found" });
    }

    const jobposts = await jobPost.find(query).sort({ createdAt: -1 });
    const jobsWithTags = jobposts.map((job) => {
      const saved = user.saved_jobs.includes(job._id);
      const applied = user.applied_jobs.includes(job._id);
      const exactdate = calculateAgeOfJob(job.createdAt);
      return {
        ...job.toObject(),
        saved,
        applied,
        exactdate,
      };
    });

    return res.status(200).json({
      success: 1,
      jobs: jobsWithTags,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

const applyForJob = async (req, res) => {
  const {
    user_id,
    post_id,
    experience_year,
    experience_month,
    skills,
    resume,
  } = req.body;
  const resumeFile = req.file;


  try {
    const user = await Jobseeker.findOne({ user_id });

    if (!user) {
      if (resumeFile) {
        deleteLocalFile(
          `${path.join(__dirname, "../upload/resumes")}/${resumeFile.filename}`
        );
      }
      return res.status(404).json({ Success: 0, error: "User not found" });
    }

    const jobpost = await jobPost.findById(post_id);

    if (user.applied_jobs.includes(post_id)) {
      if (resumeFile) {
        deleteLocalFile(
          `${path.join(__dirname, "../upload/resumes")}/${resumeFile.filename}`
        );
      }
      return res.status(409).json({
        Success: 0,
        message: "You have already applied to this job post.",
      });
    }

    const data = {
      user_id: user._id,
      experience_year,
      experience_month,
      skills,
      job_post_id: post_id,
      resume: resume || user.resume || null,
    };

    if (resumeFile) {
      const resumeUrl = await uploadToS3(resumeFile, "resumes", "application/pdf");
      data.resume = resumeUrl;
      deleteLocalFile(
        `${path.join(__dirname, "../upload/resumes")}/${resumeFile.filename}`
      );
    }

    await AppliedUser.create(data);

    user.applied_jobs.push(post_id);
    await user.save();

    jobpost.applied_users += 1;
    await jobpost.save();

    return res.status(200).json({
      Success: 1,
      message: "Application successful!",
    });
  } catch (error) {
    console.error(error);
    if (resumeFile) {
      deleteLocalFile(
        `${path.join(__dirname, "../upload/resumes")}/${resumeFile.filename}`
      );
    }
    return res.status(500).json({ error: error.message });
  }
};

const saveJob = async (req, res) => {
  const { user_id, post_id } = req.body;

  try {
    const user = await Jobseeker.findOne({ user_id });
    if (!user) {
      return res.status(404).json({ Success: 0, error: "User not found" });
    }
    const jobpost = await jobPost.findById(post_id);
    if (!jobpost) {
      return res.status(404).json({ Success: 0, error: "jobpost not found" });
    }
    if (user.saved_jobs.includes(post_id)) {
      return res
        .status(409)
        .json({ Success: 0, error: "jobpost already saved" });
    }
    user.saved_jobs.push(post_id);

    await user.save();
    return res.status(200).json({
      Success: 1,
      message: "job saved successful!",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

const unSaveJob = async (req, res) => {
  const { user_id, post_id } = req.body;

  try {
    const user = await Jobseeker.findOne({ user_id });
    if (!user) {
      return res.status(404).json({ Success: 0, error: "User not found" });
    }
    const jobpost = await jobPost.findById(post_id);
    if (!jobpost) {
      return res.status(404).json({ Success: 0, error: "jobpost not found" });
    }
    if (!user.saved_jobs.includes(post_id)) {
      return res.status(409).json({ Success: 0, error: "job post not saved" });
    }

    const index = user.saved_jobs.indexOf(post_id);
    if (index !== -1) {
      user.saved_jobs.splice(index, 1);
      await user.save();
    } else {
      return res
        .status(404)
        .json({ success: 0, message: "Post id not found in the  array" });
    }

    // user.saved_jobs.slice(post_id);

    // await user.save();
    return res.status(200).json({
      Success: 1,
      message: "job deleted from saved successful!",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};


const getApplied = async (req, res) => {
  const { user_id } = req.params;

  try {
    const user = await Jobseeker.findOne({ user_id }).populate("applied_jobs");
    if (!user) {
      return res.status(404).json({ Success: 0, error: "User not found" });
    }

    const formattedPosts = user.applied_jobs.map((post) => {
      const plainPost = post.toObject();
      plainPost.createdAt = calculateAgeOfJob(post.createdAt);
      plainPost.updatedAt = calculateAgeOfJob(post.updatedAt);
      return plainPost;
    });

    return res.status(200).json({
      Success: 1,
      message: "applied_jobs fetched successfully",
      applied_jobs: formattedPosts,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

const getJobId = async (req, res) => {
  const { user_id, job_id } = req.body;

  try {
    const user = await Jobseeker.findOne({ user_id });

    if (!user) {
      return res.status(404).json({ Success: 0, error: "User not found" });
    }

    const jobpost = await jobPost.findById(job_id);

    if (!jobpost) {
      return res.status(404).json({ Success: 0, error: "Job post not found" });
    }

    const saved = user.saved_jobs.includes(jobpost._id);
    const applied = user.applied_jobs.includes(jobpost._id);
    const exactdate = calculateAgeOfJob(jobpost.createdAt);
    const jobWithTags = {
      ...jobpost.toObject(),
      saved,
      applied,
      exactdate,
    };

    return res.status(200).json({
      success: 1,
      job: jobWithTags,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

const getSaved = async (req, res) => {
  const { user_id } = req.body;

  try {
    const user = await Jobseeker.findOne({ user_id }).populate("saved_jobs");
    if (!user) {
      return res.status(404).json({ Success: 0, error: "User not found" });
    }

    const formattedPosts = user.saved_jobs.map((post) => {
      const plainPost = post.toObject();
      plainPost.createdAt = calculateAgeOfJob(post.createdAt);
      plainPost.updatedAt = calculateAgeOfJob(post.updatedAt);
      return plainPost;
    });

    return res.status(200).json({
      Success: 1,
      message: "saved_jobs fetched successfully",
      saved_jobs: formattedPosts,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createProfile,
  getApplied,
  getSaved,
  getProfile,
  updateProfile,
  getJobs,
  applyForJob,
  saveJob,
  unSaveJob,
  getJobId,
};
