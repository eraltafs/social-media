const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");


const Otp = require("../models/Otp");
const User = require("../models/User");
const Admin = require("../models/Admin");
const Feedback = require("../models/Feedback");
const Recruiter = require("../models/recruiter");
const Jobseeker = require("../models/jobseeker");
const investment = require("../models/applyinvestment");
const VerificationModel = require("../models/VerificationModel");

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.USER_EMAIL,
    pass: process.env.APP_PASS,
  },
});

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingEmail = await Admin.findOne({ email });
    if (existingEmail) {
      return res.json({ Success: 1, message: "Email already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new Admin({ name, email, password: hashedPassword });
    const savedUser = await newUser.save();
    res
      .status(201)
      .json({ msg: "Admin registered successfully", newAdmin: savedUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const user = await Admin.findOne({ email: req.body.email });

    if (!user) return res.status(400).json({ msg: "User does not exist" });

    const isMatch = await bcrypt.compare(req.body.password, user.password);

    if (!isMatch) return res.status(400).json({ msg: " Invalid credentials." });

    const token = jwt.sign(
      { id: user._id, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "1y" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    res.status(200).json({
      token,
      user: {
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await Admin.findOne({ email: req.body.email });
  if (!user) return res.status(400).json({ msg: "User does not exist" });
  const otp = Math.floor(1000 + Math.random() * 9000);

  try {
    const data = await Otp.findOne({ email });
    if (!data) {
      await new Otp({
        otp,
        email,
        expireAt: new Date(Date.now() + 5 * 60 * 1000),
      }).save();
    } else {
      data.otp = otp;
      data.expireAt = new Date(Date.now() + 5 * 60 * 1000);
      await data.save();
    }
    const mailOptions = {
      from: process.env.USER_EMAIL,
      to: email,
      subject: "Your Admin Panel Password Change OTP",
      html: `
        <html>
        <head>
          <style>
            h1 { color: #333; }
            p { color: #555; }
            strong { color: #000; }
          </style>
        </head>
        <body>
          <div>
            <table border="0" cellspacing="0" cellpadding="0" style="max-width:600px">
              <tbody>
                <tr>
                  <td>
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr height="16"></tr>
                      <tr>
                        <td>
                          <table bgcolor="#4184F3" width="100%" border="0" cellspacing="0" cellpadding="0" style="min-width:332px;max-width:600px;border:1px solid #e0e0e0;border-bottom:0;border-top-left-radius:3px;border-top-right-radius:3px">
                            <tr>
                              <td height="72px" colspan="3"></td>
                            </tr>
                            <tr>
                              <td width="32px"></td>
                              <td style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;font-size:24px;color:#ffffff;line-height:1.25">Orbiter Admin Verification Code</td>
                              <td width="32px"></td>
                            </tr>
                            <tr>
                              <td height="18px" colspan="3"></td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <table bgcolor="#FAFAFA" width="100%" border="0" cellspacing="0" cellpadding="0" style="min-width:332px;max-width:600px;border:1px solid #f0f0f0;border-bottom:1px solid #c0c0c0;border-top:0;border-bottom-left-radius:3px;border-bottom-right-radius:3px">
                            <tr height="16px">
                              <td width="32px" rowspan="3"></td>
                              <td></td>
                              <td width="32px" rowspan="3"></td>
                            </tr>
                            <tr>
                              <td>
                                <p>Dear Orbiter Admin,</p>
                                <p>We received a request to change the password for your Orbiter admin account <a href="mailto:${email}" target="_blank">${email}</a>. Your Admin verification code is:</p>
                                <div style="text-align:center">
                                  <p dir="ltr">
                                    <strong style="text-align:center;font-size:24px;font-weight:bold">${otp}</strong>
                                  </p>
                                </div>
                                <div style="text-align:center">
                                  <p dir="ltr">
                                    <strong style="text-align:center;font-size:14px;font-weight:bold">Valid Only for 5 Minutes</strong>
                                  </p>
                                </div>
                                <p>If you did not request this code, it is possible that someone else is trying to access the Orbiter admin account <a href="mailto:${email}" target="_blank">${email}</a>. <strong>Do not forward or give this code to anyone.</strong></p>
                                <p>Sincerely yours,</p>
                                <p>The Orbiter Accounts team</p>
                              </td>
                            </tr>
                            <tr height="32px"></tr>
                          </table>
                        </td>
                      </tr>
                      <tr height="16"></tr>
                      <tr>
                        <td style="max-width:600px;font-family:Roboto-Regular,Helvetica,Arial,sans-serif;font-size:10px;color:#bcbcbc;line-height:1.5">
                          <table>
                            <tbody>
                              <tr>
                                <td>
                                  <table style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;font-size:10px;color:#666666;line-height:18px;padding-bottom:10px"></table>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </body>
        </html>
      `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        res.json({
          Success: 0,
          error: "An error occurred while sending the email",
          resetToken,
        });
      } else {
        res.json({
          Success: 1,
          message: `Otp sent to your ${email}`,
          otp,
        });
      }
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ Success: 0, error: "Error accessing the database" });
  }
};

const changePassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    // Verify OTP
    const otpData = await Otp.findOne({ email, otp });
    if (!otpData) {
      return res.status(400).json({ Success: 0, message: "Invalid OTP" });
    }

    // Find admin by email
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ Success: 0, message: "Admin not found" });
    }

    // Update admin's password
    const hashedPassword = await bcrypt.hash(password, 10);
    admin.password = hashedPassword;
    await admin.save();

    await Otp.deleteOne({ email, otp });

    res
      .status(200)
      .json({ Success: 1, message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ Success: 0, error: "Internal server error" });
  }
};

const locationSuggestion = async (req, res) => {
  const { query } = req.query;
  const access_token = process.env.access_token;
  if (!query) {
    return res.json("please provide query");
  }
  console.log(access_token, query);
  try {
    const response = await fetch(
      `https://api.mapbox.com/search/geocode/v6/forward?q=${query}&proximity=ip&access_token=${access_token}`
    );
    const data = await response.json();
    return res.json({ data, Success: 1 });
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    res.status(500).json({ Success: 0, error: "Internal server error" });
  }
};

const getAllRecruiter = async (req, res) => {
  const filters = {};
  const pageSize = 10;
  const page = parseInt(req.query.page) || 1;

  if (req.query.country)
    filters.country = { $regex: req.query.country, $options: "i" };
  if (req.query.search)
    filters.company_name = { $regex: req.query.search, $options: "i" };
  if (req.query.establishedYear)
    filters.established = {
      $gte: new Date(`${req.query.establishedYear}-01-01`),
      $lt: new Date(`${req.query.establishedYear}-12-31`),
    };
  try {
    const totalCount = await Recruiter.countDocuments({ ...filters });
    const totalPages = Math.ceil(totalCount / pageSize);
    const recruiters = await Recruiter.find({ ...filters })
      .populate("job_posts")
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .sort({ createdAt: -1 });
    res.status(200).json({
      msg: "fetched all recruiters",
      count: totalCount,
      totalPages,
      currentPage: page,
      recruiters,
    });
  } catch (error) {
    console.error("Error fetching recruiters:", error);
    res.status(500).json({ Success: 0, error: "Internal server error" });
  }
};

const getAllJobseekers = async (req, res) => {
  const filters = {};
  const pageSize = 10;
  const page = parseInt(req.query.page) || 1;
  if (req.query.search) {
    const searchRegex = { $regex: req.query.search, $options: "i" };
    filters.$or = [{ name: searchRegex }, { email: searchRegex }];
  }
  if (req.query.position) {
    filters.position = { $regex: req.query.position, $options: "i" };
  }

  if (req.query.education) {
    filters.education = { $regex: req.query.education, $options: "i" };
  }

  if (req.query.institute) {
    filters["user_id.institute"] = {
      $regex: req.query.institute,
      $options: "i",
    };
  }

  try {
    const totalCount = await Jobseeker.countDocuments({ ...filters });
    const totalPages = Math.ceil(totalCount / pageSize);
    const jobseekers = await Jobseeker.find({ ...filters })
      .populate({
        path: "applied_jobs",
      })
      .populate({
        path: "user_id",
        select: "avatar email dob institute country",
      })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .sort({ createdAt: -1 });

    res.status(200).json({
      msg: "fethed all jobseekers",
      count: totalCount,
      totalPages,
      currentPage: page,
      jobseekers,
    });
  } catch (error) {
    console.error("Error fetching jobseekers:", error);
    res.status(500).json({ Success: 0, error: "Internal server error" });
  }
};

const getAllUsers = async (req, res) => {
  const filters = {};
  const pageSize = 10;
  const page = parseInt(req.query.page) || 1;
  if (req.query.type) {
    filters.type = req.query.type;
  }
  if (req.query.search) {
    const searchRegex = { $regex: req.query.search, $options: "i" };
    filters.$or = [
      { first_name: searchRegex },
      { last_name: searchRegex },
      { username: searchRegex },
      { email: searchRegex },
    ];
  }
  try {
    const totalCount = await User.countDocuments({ ...filters });
    const totalPages = Math.ceil(totalCount / pageSize);
    const users = await User.find({ ...filters })
      .select("-password")
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .sort({ createdAt: -1 });

    res.status(200).json({
      msg: "fethed all users",
      count: totalCount,
      totalPages,
      currentPage: page,
      users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ Success: 0, error: "Internal server error" });
  }
};

const changeRecruiterStatus = async (req, res) => {
  const { _id, status, message } = req.body;

  try {
    const recruiter = await Recruiter.findById(req.body._id).populate({
      path: "user_id",
      select: "email",
    });

    if (!recruiter) {
      return res.status(404).json({ msg: "recruiter not found" });
    }
    if (message) {
      const mailOptions = {
        from: process.env.USER_EMAIL,
        to: recruiter.user_id?.email,
        subject: "Recruiter request rejected",
        html: `
        <html>
        <head>
        </head>
        <body>
          <div>
            <table border="0" cellspacing="0" cellpadding="0" style="max-width:600px">
              <tbody>
                <tr>
                  <td>
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr height="16"></tr>
                      <tr>
                        <td>
                          <table bgcolor="#4184F3" width="100%" border="0" cellspacing="0" cellpadding="0" style="min-width:332px;max-width:600px;border:1px solid #e0e0e0;border-bottom:0;border-top-left-radius:3px;border-top-right-radius:3px">
                            <tr>
                              <td height="72px" colspan="3"></td>
                            </tr>
                            <tr>
                              <td width="32px"></td>
                              <td style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;font-size:24px;color:#ffffff;line-height:1.25">Your Recruiter Request Rejected</td>
                              <td width="32px"></td>
                            </tr>
                            <tr>
                              <td height="18px" colspan="3"></td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <table bgcolor="#FAFAFA" width="100%" border="0" cellspacing="0" cellpadding="0" style="min-width:332px;max-width:600px;border:1px solid #f0f0f0;border-bottom:1px solid #c0c0c0;border-top:0;border-bottom-left-radius:3px;border-bottom-right-radius:3px">
                            <tr height="16px">
                              <td width="32px" rowspan="3"></td>
                              <td></td>
                              <td width="32px" rowspan="3"></td>
                            </tr>
                            <tr>
                              <td>
                                <p>Dear Orbiter Recruiter,</p>
                                <p>We received a request to approve you as a recruiter. Your request has been declined due to the following reason:</p>
                                <p><strong>${message}</strong></p>
                                <p>If you make the necessary changes to your profile, we will review your application again.</p>
                                <p>Sincerely yours,</p>
                                <p>The Orbiter Admin team</p>
                              </td>
                            </tr>
                            <tr height="32px"></tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </body>
        </html>
        
        `,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error sending email:", error);
          return res.json({
            error: "An error occurred while sending the email",
            updatedRecruiter: recruiter,
          });
        } else {
          return res.json({
            msg: "status updated",
            updatedRecruiter: recruiter,
          });
        }
      });
    } else {
      const updatedRecruiter = await Recruiter.findByIdAndUpdate(
        _id,
        { status },
        { new: true, upsert: true }
      );

      res.status(200).json({ msg: "status updated", updatedRecruiter });
    }
  } catch (error) {
    console.error("Error fetching recruiters:", error);
    res.status(500).json({ Success: 0, error: "Internal server error" });
  }
};

const getFeedback = async (req, res) => {
  const pageSize = 10;
  const page = parseInt(req.query.page) || 1;
  const filters = {};
  if (req.query.search) {
    const searchRegex = { $regex: req.query.search, $options: "i" };
    filters.$or = [{ username: searchRegex }, { email: searchRegex }];
  }
  try {
    const totalCount = await Feedback.countDocuments({ ...filters });
    const totalPages = Math.ceil(totalCount / pageSize);
    const feedbacks = await Feedback.find({ ...filters })
      .populate({
        path: "user_id",
        select: "email username",
      })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .sort({ createdAt: -1 });
    res.status(200).json({
      msg: "fethed all feedbacks",
      count: totalCount,
      totalPages,
      currentPage: page,
      feedbacks,
    });
  } catch (error) {
    console.error("Error fetching feedbacks:", error);
    res.status(500).json({ Success: 0, error: "Internal server error" });
  }
};

const getAllVerifications = async (req, res) => {
  const filters = {};
  const pageSize = 10;
  const page = parseInt(req.query.page) || 1;

  if (req.query.search) {
    const searchRegex = { $regex: req.query.search, $options: "i" };
    filters.$or = [
      { full_name: searchRegex },
      { username: searchRegex },
      { email: searchRegex },
    ];
  }

  try {
    const totalCount = await VerificationModel.countDocuments({ ...filters });
    const totalPages = Math.ceil(totalCount / pageSize);
    const verifications = await VerificationModel.find({ ...filters })
      .populate({
        path: "user_id",
        select: "avatar",
      })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .sort({ createdAt: -1 });
    res.status(200).json({
      msg: "fetched all Verifications",
      count: totalCount,
      totalPages,
      currentPage: page,
      verifications,
    });
  } catch (error) {
    console.error("Error fetching verifications:", error);
    res.status(500).json({ Success: 0, error: "Internal server error" });
  }
};

const changeVerificationStatus = async (req, res) => {
  const { _id, status, message } = req.body;

  try {
    const verification = await VerificationModel.findById(req.body._id);

    if (!verification) {
      return res.status(404).json({ msg: "verification not found" });
    }
    if (message) {
      const mailOptions = {
        from: process.env.USER_EMAIL,
        to: verification?.email,
        subject: "Verification request rejected",
        html: `
        <html>
        <head>
        </head>
        <body>
          <div>
            <table border="0" cellspacing="0" cellpadding="0" style="max-width:600px">
              <tbody>
                <tr>
                  <td>
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr height="16"></tr>
                      <tr>
                        <td>
                          <table bgcolor="#4184F3" width="100%" border="0" cellspacing="0" cellpadding="0" style="min-width:332px;max-width:600px;border:1px solid #e0e0e0;border-bottom:0;border-top-left-radius:3px;border-top-right-radius:3px">
                            <tr>
                              <td height="72px" colspan="3"></td>
                            </tr>
                            <tr>
                              <td width="32px"></td>
                              <td style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;font-size:24px;color:#ffffff;line-height:1.25">Your Verification Request Rejected</td>
                              <td width="32px"></td>
                            </tr>
                            <tr>
                              <td height="18px" colspan="3"></td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <table bgcolor="#FAFAFA" width="100%" border="0" cellspacing="0" cellpadding="0" style="min-width:332px;max-width:600px;border:1px solid #f0f0f0;border-bottom:1px solid #c0c0c0;border-top:0;border-bottom-left-radius:3px;border-bottom-right-radius:3px">
                            <tr height="16px">
                              <td width="32px" rowspan="3"></td>
                              <td></td>
                              <td width="32px" rowspan="3"></td>
                            </tr>
                            <tr>
                              <td>
                                <p>Dear Orbiter user,</p>
                                <p>We received a request to approve you as a Verified user. Your request has been declined due to the following reason:</p>
                                <p><strong>${message}</strong></p>
                                <p>If you make the necessary changes to your profile, we will review your application again.</p>
                                <p>Sincerely yours,</p>
                                <p>The Orbiter Admin team</p>
                              </td>
                            </tr>
                            <tr height="32px"></tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </body>
        </html>
        
        `,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error sending email:", error);
          return res.json({
            error: "An error occurred while sending the email",
            updatedVerification: verification,
          });
        } else {
          // Send the response here for email sent successfully
          return res.json({
            msg: "status updated",
            updatedVerification: verification,
          });
        }
      });
    } else {
      // Move the rest of the code here
      const updatedVerification = await VerificationModel.findByIdAndUpdate(
        _id,
        { status },
        { new: true, upsert: true }
      );

      return res
        .status(200)
        .json({ msg: "status updated", updatedVerification });
    }
  } catch (error) {
    console.error("Error fetching verification:", error);
    res.status(500).json({ Success: 0, error: "Internal server error" });
  }
};

const getAllInvestors = async (req, res) => {
  const filters = {};
  const pageSize = 10;
  const page = parseInt(req.query.page) || 1;

  if (req.query.search) {
    const searchRegex = { $regex: req.query.search, $options: "i" };
    filters.$or = [
      { name: searchRegex },
      { phone: searchRegex },
      { email: searchRegex },
      { location: searchRegex },
    ];
  }

  try {
    const totalCount = await investment.countDocuments({ ...filters });
    const totalPages = Math.ceil(totalCount / pageSize);
    const investors = await investment
      .find({ ...filters })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .sort({ createdAt: -1 });
    res.status(200).json({
      msg: "fetched all Investors",
      count: totalCount,
      totalPages,
      currentPage: page,
      investors,
    });
  } catch (error) {
    console.error("Error fetching Investors:", error);
    res.status(500).json({ Success: 0, error: "Internal server error" });
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  changePassword,
  getAllJobseekers,
  getAllUsers,
  getFeedback,
  getAllRecruiter,
  changeRecruiterStatus,
  getAllVerifications,
  changeVerificationStatus,
  getAllInvestors,
  locationSuggestion,
};
