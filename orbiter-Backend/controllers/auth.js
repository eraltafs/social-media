const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { ObjectId } = require("mongoose").Types;
const { OAuth2Client } = require("google-auth-library");

// google client

//models
const post = require("../models/Post");
const Reel = require("../models/Reel");
const Save = require("../models/save");
const User = require("../models/User");
const Country = require("../models/Country");
const BlockedUser = require("../models/BlockedUser");
const VerificationModel = require("../models/VerificationModel");
const ConnectionRequest = require("../models/connectionRequestModel");
const { UserOTPVerification } = require("../models/userOtpVerification");

const { calculateAgeOfPost } = require("../utils/timeUtils");
const { processAndUploadImage } = require("../utils/uploadAws");
const { shuffle } = require("../utils/shuffle");

const client = new OAuth2Client(process.env.Google_Client_Id);

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.USER_EMAIL,
    pass: process.env.APP_PASS,
  },
});

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

const generateReferralCode = (username) => {
  const hash = crypto
    .createHash("sha256")
    .update(username + Date.now() + Math.random().toString())
    .digest("hex");

  // Take the first 8 characters as the referral code (adjust as needed)
  const referralCode = hash.substring(0, 8).toLowerCase();
  return referralCode;
};

const formatDateTime = (date) => {
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  };
  const formattedDate = date.toLocaleDateString("en-US", options);

  // Extract components and rearrange in the desired order
  const [day, month, year] = formattedDate.split(" ");
  const abbreviatedMonth = month.charAt(0).toUpperCase() + month.slice(1, -1); // Fix the abbreviated month format
  return `${day} ,${year} `;
};

const generateRandomString = (length) => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let randomString = "";
  for (let i = 0; i < length; i++) {
    randomString += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
  }
  return randomString;
};

const check_available = async (req, res) => {
  try {
    const { username, email } = req.body;

    if (!username && !email) {
      return res.json({
        Success: 0,
        message: "Please provide either username or email",
      });
    }

    if (username) {
      const users = username.toLowerCase();
      const existingUsername = await User.findOne({ username: { $in: users } });

      if (existingUsername) {
        return res.json({ Success: 0, message: "Username already exists" });
      } else {
        return res.json({ Success: 1, message: "Username is valid" });
      }
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.json({ Success: 0, message: "Invalid Email Format" });
      }

      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.json({ Success: 0, message: "Email already exists" });
      } else {
        return res.json({ Success: 1, message: "Email is valid" });
      }
    }
  } catch (error) {
    console.error(error);
    res.json({ Success: 0, message: "Error checking availability" });
  }
};

const all_users = async (req, res) => {
  try {
    const users = await User.find({}).select("-password followers following");
    res.json({ Success: 1, message: "success", users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const users = async (req, res) => {
  const { user_id, main_user } = req.body;
  try {
    if (!user_id || user_id === "") {
      return res
        .status(500)
        .json({ success: 0, message: "user_id id not found" });
    }
    if (!main_user || main_user === "") {
      return res
        .status(500)
        .json({ success: 0, message: "main user id not found" });
    }
    const user = await User.findOne({ _id: user_id }, { password: 0 });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const connectionRequestSentByMainUser = await ConnectionRequest.findOne({
      sender_id: main_user,
      receiver_id: user_id,
    });

    const connectionRequestSentByUser = await ConnectionRequest.findOne({
      sender_id: user_id,
      receiver_id: main_user,
    });

    const connectionsSentByUser = await ConnectionRequest.find({
      sender_id: user_id,
      status: "accepted",
    });

    const connectionsReceivedByUser = await ConnectionRequest.find({
      receiver_id: user_id,
      status: "accepted",
    });

    const connectionsSentByUsers = await ConnectionRequest.find({
      sender_id: user_id,
      receiver_id: main_user,
      status: "accepted",
    }).populate({
      path: "receiver_id",
      select: "username first_name last_name avatar items isverified type",
    });

    const connectionsReceivedByUsers = await ConnectionRequest.find({
      receiver_id: user_id,
      sender_id: main_user,
      status: "accepted",
    }).populate({
      path: "sender_id",
      select: "username first_name last_name avatar items isverified type",
    });

    const acceptedConnections = [
      ...connectionsSentByUser,
      ...connectionsReceivedByUser,
    ];

    const acceptedConnection = [
      ...connectionsSentByUsers,
      ...connectionsReceivedByUsers,
    ];

    const haveAcceptedConnection = acceptedConnection.length > 0;

    let blockedUser = await BlockedUser.findOne({ blockedBy: main_user });

    const isblocked =
      blockedUser && blockedUser.blockedUser
        ? blockedUser.blockedUser.includes(user_id)
        : false;

    const selectedUsers = {
      ...user._doc, // Spread user object to include all fields
      followers_count: user.followers.length,
      following_count: user.following.length,
      isFollowing: user.followers.includes(main_user),
      isblocked,
      connection_status_sent_by_main_user: connectionRequestSentByMainUser
        ? connectionRequestSentByMainUser.status
        : null,
      connection_status_sent_by_user: connectionRequestSentByUser
        ? connectionRequestSentByUser.status
        : null,
      requestId: connectionRequestSentByUser
        ? connectionRequestSentByUser._id
        : "",
      connection_count: acceptedConnections.length,
      isConnected: haveAcceptedConnection,
      joining_date: formatDateTime(user.createdAt),
    };

    res.json({ success: 1, message: "Success", selectedUsers });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const user_reel = async (req, res) => {
  const user_id = req.body.user_id;
  const main_user = req.body.main_user;
  if (!user_id) {
    return res.json({ success: 0, message: "User not found" });
  }
  try {
    const reels = await Reel.find({ user_id });

    // Get the user details for the current user
    const currentUser = await User.findById(user_id);

    // Get the save document for the current user
    const saveDocument = await Save.findOne({ user_id });

    // Iterate through each post to check likes, follows, and saves
    const postsWithLikesAndFollowsAndSaves = reels.map((reel) => {
      const likes_check = reel.likes.includes(main_user);
      const follow_check = currentUser.followers.includes(main_user);

      // Check if saveDocument is not null before accessing its properties
      const saved = saveDocument
        ? saveDocument.reel_ids.includes(reel._id)
        : false;

      // You can include other post details or user details as needed
      const postDetails = {
        _id: reel._id,
        text: reel.text,
        user_id: reel.user_id,
        likes_count: reel.likes.length,
        comment_count: reel.comments.length,
        video: reel.video,
        type: currentUser.type,
        isverified: currentUser.isverified,
        likes_check,
        follow_check,
        saved,
        date: calculateAgeOfPost(reel.createdAt),
      };

      return postDetails;
    });

    res.json({
      Success: 1,
      message: "Success",
      Reels: postsWithLikesAndFollowsAndSaves,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.json({ success: 0, message: "Internal Server Error" });
  }
};

const usermail = async (req, res) => {
  try {
    const { email, username } = req.body;
    const searchCriteria = email ? { email } : username ? { username } : null;

    if (!searchCriteria) {
      return res.json({
        Success: 0,
        message: "Email or Username not provided",
      });
    }

    const user = await User.findOne(searchCriteria);

    if (!user) {
      return res.json({ Success: 0, message: "User not found", users: [] });
    }

    const userId = user._id;

    const [connectionsSentByUsers, connectionsReceivedByUsers] =
      await Promise.all([
        ConnectionRequest.find({
          sender_id: userId,
          status: "accepted",
        }).populate({
          path: "receiver_id",
          select:
            "username first_name last_name avatar items isverified type preferences",
        }),
        ConnectionRequest.find({
          receiver_id: userId,
          status: "accepted",
        }).populate({
          path: "sender_id",
          select:
            "username first_name last_name avatar items isverified type preferences",
        }),
      ]);

    const acceptedConnections = [
      ...connectionsSentByUsers,
      ...connectionsReceivedByUsers,
    ];
    const {
      _id,
      first_name,
      last_name,
      name,
      type,
      preferences,
      followers,
      following,
      avatar,
      isverified,
      status,
      joinedGroups,
      role,
    } = user;
    const selectedUsers = [
      {
        user_id: _id,
        username: user.username,
        first_name,
        last_name,
        name,
        email: user.email,
        type,
        preferences,
        followers_count: followers.length,
        following_count: following.length,
        avatar,
        isverified,
        status,
        joiningGroups: joinedGroups,
        role: role ?? "",
        connection: acceptedConnections.length,
      },
    ];

    res.json({ Success: 1, message: "Data fetched", users: selectedUsers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const signin = async (req, res) => {
  const { email, username, password, fcmToken } = req.body;

  // Sign in logic is based on either supplied email or username.
  const query = email ? { email } : { username };

  try {
    const user = await User.findOne(query);

    if (!user) {
      return res.json({
        Success: 0,
        message: "user not found",
        profile_created: "false",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.json({
        Success: 0,
        message: "Invalid email or password",
        profile_created: "false",
      });
    }

    if (user.status === "Deactive") {
      return res.json({
        Success: 0,
        message: "user is deactive",
      });
    }

    // Process FCM token if provided
    if (
      fcmToken &&
      Array.isArray(user.fcmTokenList) &&
      !user.fcmTokenList.includes(fcmToken)
    ) {
      user.fcmTokenList.push(fcmToken);
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1y" }
    );

    // Setup session user info
    req.session.user = { userId: user._id, username: user.username };

    // Determine whether the profile was created based on the existence of `items`.
    const profileCreated = Boolean(user.items);

    // Respond with appropriate message based on profile creation status.
    return res.json({
      Success: profileCreated ? 1 : 0,
      message: profileCreated ? "Login successful" : "profile not created",
      profile_created: profileCreated.toString(),
      user_id: user._id,
      email: user.email,
      role: user.role ?? "",
      type: user.type,
      token,
    });
  } catch (error) {
    console.error(error); // Logging the exact error
    // Return server error response
    return res.status(500).json({ Success: 500, message: "Error signing in" });
  }
};

const fcm = async (req, res) => {
  const { user_id, fcmToken } = req.body;
  const user = await User.findById({ user_id });
  if (!user.fcmTokenList) {
    user.fcmTokenList = [];
  }
  // Ensure unique fcmTokens in the array
  if (!user.fcmTokenList.includes(fcmToken)) {
    user.fcmTokenList.push(fcmToken);
    await user.save();
  }
};

const logout = async (req, res) => {
  // Destroy the session to log out the user
  const { userId, fcmToken } = req.body;
  try {
    req.session.destroy(async (err) => {
      if (err) {
        console.error(err);
        return res
          .status(500)
          .json({ Success: 0, message: "Error logging out" });
      } else {
        if (!fcmToken) {
          return res.json({ Success: 1, message: "Logout successful" });
        } else {
          const userData = await User.findById(userId).select("fcmTokenList");
          if (!userData) {
            return res.json({ Success: 0, message: "user data not found" });
          }

          const filteredList = userData.fcmTokenList.filter((list) => {
            return list !== fcmToken;
          });

          await User.findOneAndUpdate(
            { _id: userId },
            { $set: { fcmTokenList: filteredList } },
            { new: true }
          );
          return res.json({ Success: 1, message: "Logout successful" });
        }
      }
    });
  } catch (error) {
    console.error("Error Logout user:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while logout the user" });
  }
};

const block = async (req, res) => {
  const { blockedUserId } = req.body;
  const { userId } = req.body; // Assuming you have user authentication
  try {
    // Check if there is already a document for the blocking user
    let blockedUser = await BlockedUser.findOne({ blockedBy: userId });

    if (blockedUser) {
      // If document exists, update the blockedUser array
      if (!blockedUser.blockedUser.includes(blockedUserId)) {
        blockedUser.blockedUser.push(blockedUserId);
        await blockedUser.save();
        res.json({ Success: 1, message: "User blocked successfully" });
      } else {
        res.json({ Success: 1, message: "User is already blocked" });
      }
    } else {
      // If no document exists, create a new one
      blockedUser = new BlockedUser({
        blockedBy: userId,
        blockedUser: [blockedUserId],
      });
      await blockedUser.save();
      res.json({ Success: 1, message: "User blocked successfully" });
    }
  } catch (error) {
    console.error("Error blocking user:", error);
    res
      .status(500)
      .json({ error: "An error occurred while blocking the user" });
  }
};

const unblock = async (req, res) => {
  const { blockedUserId } = req.body;
  const { userId } = req.body; // Assuming you have user authentication

  try {
    const blockedUser = await BlockedUser.findOne({ blockedBy: userId });

    if (blockedUser) {
      const index = blockedUser.blockedUser.indexOf(blockedUserId);
      if (index !== -1) {
        blockedUser.blockedUser.splice(index, 1);
        await blockedUser.save();
        res.json({ Success: 1, message: "User unblocked successfully" });
      } else {
        res.json({ Success: 1, message: "User is not blocked" });
      }
    } else {
      res.json({ Success: 1, message: "No block record found for the user" });
    }
  } catch (error) {
    console.error("Error unblocking user:", error);
    res
      .status(500)
      .json({ error: "An error occurred while unblocking the user" });
  }
};

const fetchBlockedUsers = async (req, res) => {
  const { userId } = req.body;

  try {
    const blockedUser = await BlockedUser.findOne({ blockedBy: userId });

    if (blockedUser) {
      const blockedUserData = await User.find({
        _id: { $in: blockedUser.blockedUser },
      });
      const modifiedBlockedUserData = blockedUserData.map((user) => ({
        ...user.toObject(),
        items: user.items[0],
        designation: user.designation[0],
      }));

      res.json({ Success: 1, blockedUsers: modifiedBlockedUserData });
    } else {
      res.json({ Success: 1, message: "No block record found for the user" });
    }
  } catch (error) {
    console.error("Error fetching blocked users:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching blocked users" });
  }
};

const report = async (req, res) => {
  try {
    const { userId, reportId } = req.body;

    const report = new Report({ userId, reportId });
    await report.save();

    res.json({ message: "User reported successfully" });
  } catch (error) {
    console.error("Error reporting user:", error);
    res
      .status(500)
      .json({ error: "An error occurred while reporting the user" });
  }
};

const profile = async (req, res) => {
  try {
    const email = req.body.email;
    const user = await User.findOne({ email });

    if (!user) {
      res.json({ Success: 0, message: "User not found" });
    } else {
      const updatedFields = {};

      if (req.body.items) {
        updatedFields.items = req.body.items;
      }
      if (req.body.bio) {
        updatedFields.bio = req.body.bio;
      }
      if (req.body.dob) {
        updatedFields.dob = req.body.dob;
      }
      if (req.body.country) {
        updatedFields.country = req.body.country;
      }
      if (req.body.institute) {
        updatedFields.institute = req.body.institute;
      }
      if (req.body.designation) {
        updatedFields.designation = req.body.designation;
      }
      if (req.body.gender) {
        updatedFields.gender = req.body.gender;
      }
      if (req.body.headquater) {
        updatedFields.headquater = req.body.headquater;
      }
      if (req.body.isverified) {
        updatedFields.isverified = req.body.isverified;
      }
      if (req.body.preferences) {
        updatedFields.preferences = req.body.preferences;
      }

      const profilePhoto = req.files["profilePhoto"]
        ? req.files["profilePhoto"][0]
        : null;
      const coverPhoto = req.files["coverPhoto"]
        ? req.files["coverPhoto"][0]
        : null;

      if (profilePhoto) {
        updatedFields.avatar = await processAndUploadImage(
          profilePhoto,
          "avatar",
          800,
          70
        );

        deleteLocalFile(
          `${path.join(__dirname, "../upload/images")}/${profilePhoto.filename}`
        );
      }

      if (coverPhoto) {
        updatedFields.coverPhoto = await processAndUploadImage(
          coverPhoto,
          "coverPhoto",
          800,
          70
        );

        deleteLocalFile(
          `${path.join(__dirname, "../upload/images")}/${coverPhoto.filename}`
        );
      }

      await user.updateOne(updatedFields);

      const updatedUser = await User.findOne({ email });
      res.json({
        Success: 1,
        message: "Profile created successfully",
        user: updatedUser,
      });
    }
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ Success: 0, message: "Internal server error" });
  }
};

const updateprofile = async (req, res) => {
  try {
    // Assuming the user ID is sent in a header

    const _id = req.body.user_id;

    // Fetch the user document from the database
    const user = await User.findOne({ _id });

    if (!user) {
      res.json({ Success: 0, message: "User not found" });
      return;
    }

    const updatedFields = {};

    // Existing code for updating other fields
    if (!user) {
      res.json({ Success: 0, message: "User not found" });
    } else {
      if (req.body.bio) {
        updatedFields.bio = req.body.bio;
      }
      if (req.body.dob) {
        updatedFields.dob = req.body.dob;
      }
      if (req.body.country) {
        updatedFields.country = req.body.country;
      }
      if (req.body.state) {
        updatedFields.state = req.body.state;
      }
      if (req.body.institute) {
        updatedFields.institute = req.body.institute;
      }
      if (req.body.skills) {
        updatedFields.skills = req.body.skills;
      }
      if (req.body.username) {
        const { username } = req.body;
        // Check if the provided username already exists for a different user
        const existingUser = await User.findOne({
          username,
          _id: { $ne: _id },
        });
        if (existingUser) {
          return res.json({
            Success: 0,
            message: "User with the provided Username already exists",
          });
        } else {
          updatedFields.username = req.body.username.toLowerCase();
        }
      }
      // Add similar code for other fields
      if (req.body.links) {
        const filteredLinks = req.body.links;
        updatedFields.links = req.body.links;
      }
      if (req.body.first_name) {
        updatedFields.first_name = req.body.first_name;
      }
      if (req.body.last_name) {
        updatedFields.last_name = req.body.last_name;
      }
      if (req.body.designation) {
        updatedFields.designation = req.body.designation;
      }
      if (req.body.projectAndAchievement) {
        updatedFields.projectAndAchievement = req.body.projectAndAchievement;
      }
      if (req.body.contact) {
        updatedFields.contact = req.body.contact;
      }
      if (req.body.website) {
        updatedFields.website = req.body.website;
      }

      const profilePhoto = req.files["profilePhoto"]
        ? req.files["profilePhoto"][0]
        : null;
      const coverPhoto = req.files["coverPhoto"]
        ? req.files["coverPhoto"][0]
        : null;
      if (profilePhoto) {
        updatedFields.avatar = await processAndUploadImage(
          profilePhoto,
          "avatar",
          800,
          70
        );
        deleteLocalFile(
          `${path.join(__dirname, "../upload/images")}/${profilePhoto.filename}`
        );
      }

      if (coverPhoto) {
        updatedFields.coverPhoto = await processAndUploadImage(
          coverPhoto,
          "coverPhoto",
          800,
          70
        );
        deleteLocalFile(
          `${path.join(__dirname, "../upload/images")}/${coverPhoto.filename}`
        );
      }
    }

    // Update the user's document with the fields in updatedFields
    await user.updateOne(updatedFields);

    // Fetch the updated user data from the database
    const updatedUser = await User.findById(_id);

    res.json({
      Success: 1,
      message: "Profile updated successfully",
      // user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.json({ Success: 0, message: "Internal server error" });
  }
};

const delete_user = async (req, res) => {
  try {
    const userId = req.body.user_id;

    // Check if the user exists
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.json({ Success: 0, message: "User not found" });
    }
    if (existingUser.status === "Deactive") {
      return res.json({ Success: 0, message: "User account already deactive" });
    }

    // Delete the user
    await User.findByIdAndUpdate(userId, { status: "Deactive" });

    res.json({ success: 1, message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Error deleting user" });
  }
};

const shareUserProfile = async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res
        .status(400)
        .json({ success: 0, message: "User id not provided" });
    }

    const userData = await User.findById(user_id);

    if (!userData) {
      return res.status(404).json({ success: 0, message: "User not found" });
    }

    const itemsString =
      Array.isArray(userData.items) && userData.items.length > 0
        ? userData.items[0].toString()
        : "";

    const profileLink = `${process.env.APPURL}/type${userData.type}/viewProfile/${user_id}`;

    return res.status(200).json({
      success: 1,
      message: "Successfully fetched",
      link: profileLink,
      data: { ...userData.toObject(), items: itemsString },
    });
  } catch (error) {
    console.error("Error fetching requests:", error);
    return res.status(500).json({ success: 0, message: "Server error" });
  }
};

const checkAndAddReferral = async (req, res) => {
  const { referralCode, userId } = req.body;
  try {
    if (!referralCode) {
      res.status(500).json({ success: 0, message: "referral code not found" });
    }
    const userData = await User.findOne({ userReferral: referralCode });
    if (userData) {
      const list = await User.findByIdAndUpdate(
        { _id: userData._id },
        { $addToSet: { referredList: userId } },
        { new: true }
      );
      return res
        .status(500)
        .json({ success: 0, message: "Referral Inserted", data: userData });
    }
  } catch (error) {
    console.error("Error fetching requests:", error);
    res.status(500).json({ success: 0, message: "Server error" });
  }
};

const preferences = async (req, res) => {
  const { user_id, preferences } = req.body;
  try {
    const user = await User.findById(user_id);
    if (!user) {
      return res.json({ Success: 0, message: "User not found" });
    }
    const updatedUser = await user.updateOne({ preferences });
    return res.status(201).json({
      Success: 1,
      message: "preferences updated successfully",
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ Success: 0, message: "Internal Server Error" });
  }
};

const suggestions = async (req, res) => {
  const { user_id } = req.body;
  try {
    const user = await User.findById(user_id).select("items preferences");
    if (!user) {
      return res.json({
        Success: 0,
        message: "User not found",
        profile_created: "false",
      });
    }
    const Users = await User.find(
      {
        $or: [{ items: user.items }, { items: { $in: user.preferences } }],
        followers: { $nin: [user_id] },
        _id: { $ne: user_id },
      },
      { password: 0 }
    );
    const modifiedUserData = Users.map((user) => ({
      ...user.toObject(),
      items: user.items[0],
    }));

    const preferencesUsers = shuffle(modifiedUserData);

    return res.status(200).json({
      Success: 1,
      message: "User faetched successfully",
      count: preferencesUsers.length,
      users: preferencesUsers,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ Success: 0, message: "Internal Server Error" });
  }
};

const verifiedUser = async (req, res) => {
  const { user_id, full_name, email, phone, document, aadhar } = req.body;
  try {
    const user = await User.findById(user_id);
    if (!user) {
      return res.json({ success: 0, message: "user not found" });
    }
    // Create a new feedback instance
    const newUser = new VerificationModel({
      user_id,
      username: user.username,
      email,
      full_name,
      phone,
      document,
      aadhar,
    });

    // Save the feedback to the database
    await newUser.save();

    // Respond with a success message
    res.json({
      success: 1,
      message: "Verification request submitted successfully",
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ Success: 0, message: "Internal Server Error" });
  }
};

// new login flow
const generateOTP = async (email) => {
  const OTP = Math.round(1000 + Math.random() * 9000);
  const saltRounds = 10;
  const data = await UserOTPVerification.findOne({ email });
  const hashedOTP = await bcrypt.hash(OTP.toString(), saltRounds);
  if (!data) {
    await new UserOTPVerification({
      otp: hashedOTP,
      email,
      expireAt: new Date(Date.now() + 5 * 60 * 1000),
    }).save();
  } else {
    data.otp = hashedOTP;
    data.expireAt = new Date(Date.now() + 5 * 60 * 1000);
    await data.save();
  }
  return OTP;
};

const sendMail = async (recipientEmail, OTP) => {
  const mailOptions = {
    from: process.env.USER_EMAIL,
    to: recipientEmail,
    subject: "Your Orbiter Account Verification OTP",
    text: `Your OTP for verification is: ${OTP}`,
    html: `
      <html>
      <head>
          <style>
          .email-section {
              width: 70%; /* Adjust the width as needed */
              margin: 0 auto; /* Center horizontally */
              text-align: center; /* Center align content inside */
          }
          </style>
      </head>
      <body>
          <section class="email-section">
          <img
              style="width: 20%"
              src="https://orbiter-prod.blr1.digitaloceanspaces.com/web-images/Orbiter%20-%20Logo.png"
              alt="orbiter-logo"
          />
          <h2 style="color:black; text-decoration: none;">Hi ${recipientEmail},</h2>
          <p style="font-size:medium; color: black;">
              Please find your one time password (OTP) for verification for your
              account 
          </p>
          <div style="width:70%; background-color: #0089f7; border-radius: 10px; margin: 0 auto;">
              <p style="text-align: center; color: white; letter-spacing: 5px; font-size:xx-large; font-weight: 600;padding: 8px;">${OTP}</p>
          </div>
          <p style="color:black;">OTP is valid for next 5 min or one successful attempt.</p>
          <h1 style="color:black;text-align:start; margin-top: 30px; ">-Team Orbiter</h1>
          </section>
      </body>
  </html>
      `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error(error);
  }
};

const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(404).json({ message: "provide email", success: 0 });
    }
    const OTP = await generateOTP(email);

    await sendMail(email, OTP);
    res.status(200).json({ message: "OTP sent successfully", success: 1 });
  } catch (error) {
    console.error("error while sending opt", error);
    res.status(500).json({ message: "error while sending opt", success: 0 });
  }
};

const verifyOTP = async (email, OTP) => {
  const otpData = await UserOTPVerification.findOne({ email });
  if (!otpData) {
    console.error("otp not found");
    return false;
  }
  const isOTPValid = await bcrypt.compare(OTP.toString(), otpData.otp);

  if (!isOTPValid) {
    console.error("opt is not valid");
    return false;
  }

  return true;
};

const userVerifyOtp = async (req, res) => {
  try {
    const { email, otp, fcmToken } = req.body;

    const isOTPValid = await verifyOTP(email, otp);
    if (!isOTPValid) {
      return res
        .status(400)
        .json({ message: "Invalid OTP or OTP expired", success: 0 });
    }

    await UserOTPVerification.deleteMany({ email });

    let user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({
        message: "Profile not created",
        isProfileCreated: false,
        email,
        success: 1,
      });
    }

    // Setup session user info
    req.session.user = { userId: user._id, username: user.username };

    if (user.status === "Deactive") {
      return res.json({
        success: 0,
        message: "user is deactive",
      });
    }

    // Process FCM token if provided
    if (
      fcmToken &&
      Array.isArray(user.fcmTokenList) &&
      !user.fcmTokenList.includes(fcmToken)
    ) {
      user.fcmTokenList.push(fcmToken);
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1y" }
    );

    const {
      _id,
      isverified,
      first_name,
      last_name,
      name,
      avatar,
      role,
      type,
      preferences,
      followers,
      following,
      username,
      status,
      joinedGroups,
    } = user;

    const connectionCount = await ConnectionRequest.countDocuments({
      $or: [
        { sender_id: new ObjectId(_id) },
        { receiver_id: new ObjectId(_id) },
      ],
      status: "accepted",
    });

    return res.status(200).json({
      success: 1,
      message: "OTP Verified successfully",
      isProfileCreated: true,
      user_id: _id,
      username,
      first_name,
      last_name,
      name,
      email,
      type,
      preferences,
      followers_count: followers.length,
      following_count: following.length,
      avatar,
      isverified,
      status,
      joiningGroups: joinedGroups,
      role: role || "",
      connection: connectionCount,
      token,
      followersCount: followers.length,
      followingCount: following.length,
      connectionCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error while verifying OTP", success: 0 });
  }
};

const createIndividualProfile = async (req, res) => {
  // [Note :-> need to verify this route using the token that is provided at the time of otp verification , also later need to implement the logic of fmc token if needed ]
  try {
    const {
      email,
      name,
      gender,
      location,
      designation,
      institute,
      dob,
      type,
      items,
      phone,
      country,
    } = req.body;

    if (
      !email ||
      !name ||
      !gender ||
      !location ||
      !designation ||
      !institute ||
      !dob ||
      !type ||
      !items ||
      !phone ||
      !country
    ) {
      return res
        .status(400)
        .json({ message: "Required fields are missing", success: 0 });
    }
    // Check if items and designation are arrays
    if (!Array.isArray(items) || !Array.isArray(designation)) {
      return res.status(400).json({
        message: "Invalid input: items and designation must be arrays",
        success: 0,
      });
    }
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res
        .status(404)
        .json({ message: "User already exists. Please log in.", success: 0 });
    }

    const nameData = name.trim().split(" ");

    first_name = nameData[0];
    last_name = nameData[nameData.length - 1];

    let username;
    let isUnique = false;
    while (!isUnique) {
      const randomString = generateRandomString(5);
      username = `${nameData[0]}_${randomString}`;
      // Checking if username is unique
      const existingUsername = await User.findOne({ username });
      if (!existingUsername) {
        isUnique = true;
      }
    }

    let avatar = "";

    if (req.files && req.files["profilePhoto"]) {
      const profilePhotoFile = req.files["profilePhoto"][0];
      avatar = await processAndUploadImage(profilePhotoFile, "avatar", 800, 70);
      deleteLocalFile(
        `${path.join(__dirname, "../upload/images")}/${
          profilePhotoFile.filename
        }`
      );
    } else if (req.body && req.body.googleavatarImage) {
      avatar = req.body.googleavatarImage;
    } else if (req.body && req.body.customavatarImage) {
      avatar = req.body.customavatarImage;
    } else if (req.body && req.body.avatar) {
      avatar = req.body.avatar;
    } else {
      avatar = "";
    }

    const userData = new User({
      avatar,
      email,
      username,
      first_name,
      last_name,
      name,
      gender,
      location,
      designation,
      institute,
      dob,
      type,
      items,
      phone,
      country,
    });

    await userData.save();

    const newUser = await User.findOne({ email });

    if (!newUser) {
      return res.status(500).json({
        message: "Error while creating the organization profile",
        success: 0,
      });
    }

    const { _id, isverified, role, followers, following } = newUser;

    const connectionCount = await ConnectionRequest.countDocuments({
      $or: [
        { sender_id: new ObjectId(_id) },
        { receiver_id: new ObjectId(_id) },
      ],
      status: "accepted",
    });

    return res.status(200).json({
      success: 1,
      message: "Profile Created successfully",
      isProfileCreated: true,
      user_id: _id,
      first_name,
      last_name,
      followersCount: followers.length,
      followingCount: following.length,
      connectionCount,
      avatar,
      isverified,
      email,
      role: role || "",
      type,
      username,
      country,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error while creating the profile", success: 0 });
  }
};

const createOrganizationProfile = async (req, res) => {
  // [Note :-> need to verify this route using the token that is provided at the time of otp verification ]
  try {
    const { email, name, location, dob, type, items, country } = req.body;

    if (!email || !name || !location || !dob || !type || !items || !country) {
      return res
        .status(400)
        .json({ message: "Required fields are missing", success: 0 });
    }
    // Check if items and designation are arrays
    if (!Array.isArray(items)) {
      return res.status(400).json({
        message: "Invalid input: category must be arrays",
        success: 0,
      });
    }
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(404).json({
        message: "Organization already exists. Please log in.",
        success: 0,
      });
    }

    const nameData = name.split(" ");
    let username;
    let isUnique = false;
    while (!isUnique) {
      const randomString = generateRandomString(5);
      username = `${nameData[0]}_${randomString}`;
      // Checking if username is unique
      const existingUsername = await User.findOne({ username });
      if (!existingUsername) {
        isUnique = true;
      }
    }

    let avatar = "";

    if (req.files && req.files["profilePhoto"]) {
      const profilePhotoFile = req.files["profilePhoto"][0];
      avatar = await processAndUploadImage(profilePhotoFile, "avatar", 800, 70);
      deleteLocalFile(
        `${path.join(__dirname, "../upload/images")}/${
          profilePhotoFile.filename
        }`
      );
    } else if (req.body && req.body.googleavatarImage) {
      avatar = req.body.googleavatarImage;
    } else if (req.body && req.body.customavatarImage) {
      avatar = req.body.customavatarImage;
    } else if (req.body && req.body.avatar) {
      avatar = req.body.avatar;
    } else {
      avatar = "";
    }

    const userData = new User({
      avatar,
      email,
      username,
      first_name: name,
      name,
      location,
      dob,
      type,
      items,
      country,
    });

    await userData.save();

    // Fetch user data again to get _id
    const newUser = await User.findOne({ email });

    if (!newUser) {
      return res.status(500).json({
        message: "Error while creating the organization profile",
        success: 0,
      });
    }

    const { _id, isverified, followers, following, role } = newUser;

    //  For newly created accounts, data such as followers, following, and connections are initialized to 0.

    const connectionCount = await ConnectionRequest.countDocuments({
      $or: [
        { sender_id: new ObjectId(_id) },
        { receiver_id: new ObjectId(_id) },
      ],
      status: "accepted",
    });

    return res.status(200).json({
      success: 1,
      message: "Profile Created successfully",
      isProfileCreated: true,
      user_id: _id,
      first_name: name,
      followersCount: followers.length,
      followingCount: following.length,
      connectionCount,
      avatar,
      isverified,
      email,
      role: role || "",
      type,
      username,
      country,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error while creating the organization profile",
      success: 0,
    });
  }
};

const googleAuthLogin = async (req, res) => {
  try {
    const { tokenId, fcmToken } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: tokenId,
      audience: process.env.Google_Client_Id,
    });
    const { email, name, picture, given_name, family_name } =
      ticket.getPayload();

    let user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({
        message: "Google Profile Found Sucessfully ! need to create account",
        isProfileCreated: false,
        name,
        picture,
        email,
        success: 1,
      });
    }

    // Setup session user info
    req.session.user = { userId: user._id, username: user.username };

    if (user.status === "Deactive") {
      return res.json({
        success: 0,
        message: "user is deactive",
      });
    }

    // Process FCM token if provided
    if (
      fcmToken &&
      Array.isArray(user.fcmTokenList) &&
      !user.fcmTokenList.includes(fcmToken)
    ) {
      user.fcmTokenList.push(fcmToken);
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1y" }
    );

    const {
      _id,
      first_name,
      last_name,
      avatar,
      username,
      isverified,
      followers,
      following,
      role,
      preferences,
      status,
      joinedGroups,
      type,
    } = user;

    const connectionCount = await ConnectionRequest.countDocuments({
      $or: [
        { sender_id: new ObjectId(_id) },
        { receiver_id: new ObjectId(_id) },
      ],
      status: "accepted",
    });

    return res.status(200).json({
      success: 1,
      message: "Login successful",
      isProfileCreated: true,
      user_id: _id,
      username,
      first_name,
      last_name,
      email,
      type,
      preferences,
      followers_count: followers.length,
      following_count: following.length,
      avatar,
      isverified,
      status,
      joiningGroups: joinedGroups,
      role: role ?? "",
      connection: connectionCount,
      token,
      name,
      followersCount: followers.length,
      followingCount: following.length,
      connectionCount,
    });
  } catch (error) {
    console.error("Google authentication error:", error);
    res.status(500).json({ message: "Google authentication error" });
  }
};

const country = async (req, res) => {
  try {
    const { country } = req.query;
    let query = {};

    if (country) {
      query = { country: { $regex: country, $options: "i" } };
    }

    const countries = await Country.find(query);

    return res.status(200).json({
      success: 1,
      message: "country fetched successfully",
      countries,
    });
  } catch (err) {
    res.status(500).json({ success: 0, message: err.message });
  }
};

const createCountry = async (req, res) => {
  try {
    const newCountry = await Country.create({
      country: req.body.country,
      states: req.body.states,
    });
    res.status(201).json(newCountry);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const updateProfileCard = async (req, res) => {
  try {
    const { user_id, name, username, designation, items, avatar } = req.body;
    const user = await User.findById(user_id);

    if (!user) return res.json({ Success: 0, message: "User not found" });

    const updatedFields = {};
    if (name) updatedFields.name = name;
    if (designation) updatedFields.designation = designation;
    if (items) updatedFields.items = items;
    if (username) {
      const existingUser = await User.findOne({
        username,
        _id: { $ne: user_id },
      });
      if (existingUser) {
        return res.json({
          Success: 0,
          message: "User with the provided Username already exists",
        });
      } else {
        updatedFields.username = username.toLowerCase();
      }
    }
    const profilePhoto = req.files["profilePhoto"]
      ? req.files["profilePhoto"][0]
      : null;
    const coverPhoto = req.files["coverPhoto"]
      ? req.files["coverPhoto"][0]
      : null;
    if (profilePhoto) {
      const url = await processAndUploadImage(profilePhoto, "avatar", 800, 70);
      updatedFields.avatar = url;
      deleteLocalFile(
        `${path.join(__dirname, "../upload/images")}/${profilePhoto.filename}`
      );
    } else if (avatar) {
      updatedFields.avatar = avatar;
    }

    if (coverPhoto) {
      const url = await processAndUploadImage(
        coverPhoto,
        "coverPhoto",
        800,
        70
      );
      updatedFields.coverPhoto = url;

      deleteLocalFile(
        `${path.join(__dirname, "../upload/images")}/${coverPhoto.filename}`
      );
    }

    const updatedUser = await User.findByIdAndUpdate(user_id, updatedFields, {
      new: true,
    });

    res.json({
      Success: 1,
      message: "Profile card updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.json({ Success: 0, message: "Internal server error" });
  }
};

const updateBasicDetails = async (req, res) => {
  try {
    const { user_id, institute, bio, links } = req.body;
    const user = await User.findById(user_id);

    if (!user) return res.json({ Success: 0, message: "User not found" });
    const updatedFields = {};

    if (institute) updatedFields.institute = institute;
    if (bio) updatedFields.bio = bio;
    if (links) updatedFields.links = links;

    const updatedUser = await User.findByIdAndUpdate(user_id, updatedFields, {
      new: true,
    });

    res.json({
      Success: 1,
      message: "Profile card updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.json({ Success: 0, message: "Internal server error" });
  }
};

const updateAboutDetails = async (req, res) => {
  try {
    const {
      user_id,
      dob,
      gender,
      project,
      achievement,
      skills,
      website,
      degree,
      interest,
      Partnerships_Collaborations,
      location,
      startupType,
      industry,
    } = req.body;
    const user = await User.findById(user_id);

    if (!user) return res.json({ Success: 0, message: "User not found" });
    const updatedFields = {};

    if (dob) updatedFields.dob = dob;
    if (gender) updatedFields.gender = gender;
    if (project) updatedFields.project = JSON.parse(project);
    if (achievement) updatedFields.achievement = achievement;
    if (skills) updatedFields.skills = JSON.parse(skills);
    if (website) updatedFields.website = website;
    if (degree) updatedFields.degree = degree;
    if (interest) updatedFields.interest = JSON.parse(interest);
    if (location) updatedFields.location = location;
    if (startupType) updatedFields.startupType = startupType;
    if (industry) updatedFields.industry = industry;
    if (Partnerships_Collaborations)
      updatedFields.Partnerships_Collaborations = Partnerships_Collaborations;

    const updatedUser = await User.findByIdAndUpdate(user_id, updatedFields, {
      new: true,
    });

    res.json({
      Success: 1,
      message: "Profile card updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.json({ Success: 0, message: "Internal server error" });
  }
};

const updateMentor = async (req, res) => {
  try {
    const {
      user_id,
      domain,
      expertise,
      startupMentored,
      MentoringSessions,
      incubationConnection,
      mentoringRegion,
      state,
    } = req.body;
    const user = await User.findById(user_id);

    if (!user) return res.json({ Success: 0, message: "User not found" });
    const updatedFields = {};

    updatedFields.mentorDetails = {};
    if (domain) updatedFields.mentorDetails.domain = domain;
    if (expertise) updatedFields.mentorDetails.expertise = expertise;
    if (startupMentored)
      updatedFields.mentorDetails.startupMentored = startupMentored;
    if (MentoringSessions)
      updatedFields.mentorDetails.MentoringSessions = MentoringSessions;
    if (incubationConnection)
      updatedFields.mentorDetails.incubationConnection = incubationConnection;
    if (mentoringRegion)
      updatedFields.mentorDetails.mentoringRegion = mentoringRegion;
    if (state) updatedFields.mentorDetails.state = state;

    const updatedUser = await User.findByIdAndUpdate(user_id, updatedFields, {
      new: true,
    });

    res.json({
      Success: 1,
      message: "Profile card updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.json({ Success: 0, message: "Internal server error" });
  }
};

const updateInvestor = async (req, res) => {
  try {
    const {
      user_id,
      domain,
      mentorship,
      currency,
      fundingRange,
      fundingAreaItIsRaised,
      incubatorLinked,
      cityOrHeadquarter,
    } = req.body;
    const user = await User.findById(user_id);

    if (!user) return res.json({ Success: 0, message: "User not found" });
    const updatedFields = {};

    updatedFields.investorDetails = {};
    if (domain) updatedFields.investorDetails.domain = domain;
    if (mentorship) updatedFields.investorDetails.mentorship = mentorship;
    if (currency) updatedFields.investorDetails.currency = currency;
    if (fundingRange) updatedFields.investorDetails.fundingRange = fundingRange;
    if (fundingAreaItIsRaised)
      updatedFields.investorDetails.fundingAreaItIsRaised =
        fundingAreaItIsRaised;
    if (incubatorLinked)
      updatedFields.investorDetails.incubatorLinked = incubatorLinked;
    if (cityOrHeadquarter)
      updatedFields.investorDetails.cityOrHeadquarter = cityOrHeadquarter;

    const updatedUser = await User.findByIdAndUpdate(user_id, updatedFields, {
      new: true,
    });

    res.json({
      Success: 1,
      message: "Profile card updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.json({ Success: 0, message: "Internal server error" });
  }
};

const updateStartup = async (req, res) => {
  try {
    const { user_id, domain, investors, startupArea, team, incubatorName } =
      req.body;
    const user = await User.findById(user_id);

    if (!user) return res.json({ Success: 0, message: "User not found" });

    const updatedFields = {};
    updatedFields.startupDetails = {};
    if (domain) updatedFields.startupDetails.domain = domain;
    if (investors) updatedFields.startupDetails.investors = investors;
    if (startupArea) updatedFields.startupDetails.startupArea = startupArea;
    if (team) updatedFields.startupDetails.team = team;
    if (incubatorName)
      updatedFields.startupDetails.incubatorName = incubatorName;

    const updatedUser = await User.findByIdAndUpdate(user_id, updatedFields, {
      new: true,
    });

    res.json({
      Success: 1,
      message: "Profile card updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.json({ Success: 0, message: "Internal server error" });
  }
};

const updateStudent = async (req, res) => {
  try {
    const { user_id, education, experience, certificate, volunteer } = req.body;
    const user = await User.findById(user_id);
    const updatedFields = {};

    if (!user) return res.json({ Success: 0, message: "User not found" });
    else {
      updatedFields.studentDetails = {};
      if (education)
        updatedFields.studentDetails.education = JSON.parse(education);
      if (experience)
        updatedFields.studentDetails.experience = JSON.parse(experience);
      if (certificate)
        updatedFields.studentDetails.certificate = JSON.parse(certificate);
      if (volunteer)
        updatedFields.studentDetails.volunteer = JSON.parse(volunteer);
    }

    const updatedUser = await User.findByIdAndUpdate(user_id, updatedFields, {
      new: true,
    });

    res.json({
      Success: 1,
      message: "Profile card updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.json({ Success: 0, message: "Internal server error" });
  }
};

const updateCategory = async (req, res) => {
  const { user_id, category } = req.body;

  try {
    const user = await User.findById(user_id).select("items");

    if (!user) {
      return res.status(404).json({ Success: 0, message: "User not found" });
    }

    const categoryIndex = user.items.findIndex((item) => item === category);

    if (categoryIndex === -1) {
      return res.status(400).json({
        Success: 0,
        message: `You don't have the given category ${category}`,
      });
    }

    if (categoryIndex === 0) {
      return res.status(400).json({
        Success: 0,
        message: `Your primary category is already ${category}`,
      });
    }

    // Move the category to the first position
    const updatedItems = [
      user.items[categoryIndex],
      ...user.items.filter((_, index) => index !== categoryIndex),
    ];

    const updatedUser = await User.findByIdAndUpdate(
      user_id,
      { items: updatedItems },
      { new: true }
    ).select("items");

    return res.status(200).json({
      Success: 1,
      message: "Category updated successfully",
      updatedUser,
      categoryIndex,
    });
  } catch (error) {
    console.error("Error updating category:", error);
    return res.status(500).json({ Success: 0, message: "Internal server error" });
  }
};

const user_post = async (req, res) => {
  const { user_id, main_user } = req.body;
  if (!user_id) {
    return res.json({ success: 0, message: "User not found" });
  }

  try {
    // Fetch posts, current user, and save document in parallel
    const [posts, currentUser, saveDocument, connectionReceiverData] =
      await Promise.all([
        post.find({ user_id, image: { $ne: [] } }).sort({ createdAt: -1 }),
        User.findById(user_id),
        Save.findOne({ user_id }),
        ConnectionRequest.aggregate([
          {
            $match: {
              $or: [
                { sender_id: new ObjectId(user_id) },
                { receiver_id: new ObjectId(user_id) },
              ],
              status: "accepted",
            },
          },
          {
            $group: {
              _id: null,
              receiverIds: {
                $push: {
                  $cond: {
                    if: { $eq: [{ $toString: "$sender_id" }, user_id] },
                    then: { $toString: "$receiver_id" },
                    else: { $toString: "$sender_id" },
                  },
                },
              },
            },
          },
          { $project: { _id: 0, receiverIds: 1 } },
        ]),
      ]);

    const connectionReceiverIds = connectionReceiverData[0]?.receiverIds || [];
    const followingIds = currentUser.following;

    const postsWithLikesAndFollowsAndSaves = posts.map((post) => {
      const likes_check = post.likes.includes(main_user);
      const follow_check = currentUser.followers.includes(main_user);
      const saved = saveDocument
        ? saveDocument.post_ids.includes(post._id)
        : false;

      let canComment = false;
      switch (post.commentSettings) {
        case "everyone":
          canComment = true;
          break;
        case "connections":
          canComment = connectionReceiverIds.includes(post.user_id.toString());
          break;
        case "following":
          canComment = currentUser.followers.includes(main_user);
          break;
        case "both":
          canComment =
            currentUser.followers.includes(main_user) ||
            followingIds.includes(post.user_id.toString());
          break;
        case "none":
          canComment = false;
          break;
        default:
          canComment = false;
      }

      const {
        _id,
        text,
        user_id,
        likes,
        comments,
        image,
        repost,
        createdAt: date,
        hashtags,
      } = post;

      return {
        _id,
        text,
        user_id,
        image,
        likes_count: likes.length,
        comment_count: comments.length,
        repost_count: repost.length,
        type: currentUser.type,
        isverified: currentUser.isverified,
        likes_check,
        follow_check,
        saved,
        date,
        hashtags,
        canComment,
      };
    });

    res.json({
      feed: postsWithLikesAndFollowsAndSaves,
      Success: 1,
      message: "Success",
    });
  } catch (error) {
    console.error("Error fetching user posts:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const userTextPosts = async (req, res) => {
  const { user_id, main_user } = req.body;
  if (!user_id) {
    return res.json({ success: 0, message: "User not found" });
  }

  try {
    // Fetch posts, current user, and save document in parallel
    const [posts, currentUser, saveDocument, connectionReceiverData] =
      await Promise.all([
        post
          .find({ user_id, image: [], text: { $ne: "" } })
          .sort({ createdAt: -1 }),
        User.findById(user_id),
        Save.findOne({ user_id }),
        ConnectionRequest.aggregate([
          {
            $match: {
              $or: [
                { sender_id: new ObjectId(user_id) },
                { receiver_id: new ObjectId(user_id) },
              ],
              status: "accepted",
            },
          },
          {
            $group: {
              _id: null,
              receiverIds: {
                $push: {
                  $cond: {
                    if: { $eq: [{ $toString: "$sender_id" }, user_id] },
                    then: { $toString: "$receiver_id" },
                    else: { $toString: "$sender_id" },
                  },
                },
              },
            },
          },
          { $project: { _id: 0, receiverIds: 1 } },
        ]),
      ]);

    const connectionReceiverIds = connectionReceiverData[0]?.receiverIds || [];
    const followingIds = currentUser.following;

    const postsWithLikesAndFollowsAndSaves = posts.map((post) => {
      const {
        _id,
        text,
        user_id,
        likes,
        comments,
        image,
        repost,
        createdAt: date,
        hashtags,
      } = post;

      const likes_check = likes.includes(main_user);
      const follow_check = currentUser.followers.includes(main_user);
      const saved = saveDocument ? saveDocument.post_ids.includes(_id) : false;

      let canComment;
      switch (post.commentSettings) {
        case "everyone":
          canComment = true;
          break;
        case "connections":
          canComment = connectionReceiverIds.includes(post.user_id.toString());
          break;
        case "following":
          canComment = currentUser.followers.includes(main_user);
          break;
        case "both":
          canComment =
            currentUser.followers.includes(main_user) ||
            followingIds.includes(post.user_id.toString());
          break;
        case "none":
          canComment = false;
          break;
        default:
          canComment = false;
      }

      return {
        _id,
        text,
        user_id,
        image,
        likes_count: likes.length,
        comment_count: comments.length,
        repost_count: repost.length,
        type: currentUser.type,
        isverified: currentUser.isverified,
        likes_check,
        follow_check,
        saved,
        date,
        hashtags,
        canComment,
      };
    });

    res.json({
      feed: postsWithLikesAndFollowsAndSaves,
      success: 1,
      message: "Success",
    });
  } catch (error) {
    console.error("Error fetching user posts:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const userTaggedPosts = async (req, res) => {
  const { user_id, main_user } = req.body;
  if (!user_id) {
    return res.json({ success: 0, message: "User not found" });
  }

  try {
    // Fetch posts, current user, and save document in parallel
    const [posts, currentUser, saveDocument, connectionReceiverData] =
      await Promise.all([
        post.find({ tags: user_id }).sort({ createdAt: -1 }),
        User.findById(user_id),
        Save.findOne({ user_id }),
        ConnectionRequest.aggregate([
          {
            $match: {
              $or: [
                { sender_id: new ObjectId(user_id) },
                { receiver_id: new ObjectId(user_id) },
              ],
              status: "accepted",
            },
          },
          {
            $group: {
              _id: null,
              receiverIds: {
                $push: {
                  $cond: {
                    if: { $eq: [{ $toString: "$sender_id" }, user_id] },
                    then: { $toString: "$receiver_id" },
                    else: { $toString: "$sender_id" },
                  },
                },
              },
            },
          },
          { $project: { _id: 0, receiverIds: 1 } },
        ]),
      ]);

    const connectionReceiverIds = connectionReceiverData[0]?.receiverIds || [];
    const followingIds = currentUser.following;

    const postsWithLikesAndFollowsAndSaves = posts.map((post) => {
      const {
        _id,
        text,
        user_id,
        likes,
        comments,
        image,
        repost,
        createdAt: date,
        hashtags,
      } = post;

      const likes_check = post.likes.includes(main_user);
      const follow_check = currentUser.followers.includes(main_user);
      const saved = saveDocument ? saveDocument.post_ids.includes(_id) : false;

      let canComment;
      switch (post.commentSettings) {
        case "everyone":
          canComment = true;
          break;
        case "connections":
          canComment = connectionReceiverIds.includes(post.user_id.toString());
          break;
        case "following":
          canComment = currentUser.followers.includes(main_user);
          break;
        case "both":
          canComment =
            currentUser.followers.includes(main_user) ||
            followingIds.includes(post.user_id.toString());
          break;
        case "none":
          canComment = false;
          break;
        default:
          canComment = false;
      }

      return {
        _id,
        text,
        user_id,
        image,
        likes_count: likes.length,
        comment_count: comments.length,
        repost_count: repost.length,
        type: currentUser.type,
        isverified: currentUser.isverified,
        likes_check,
        follow_check,
        saved,
        date,
        hashtags,
        canComment,
      };
    });

    res.json({
      feed: postsWithLikesAndFollowsAndSaves,
      success: 1,
      message: "Success",
    });
  } catch (error) {
    console.error("Error fetching user posts:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  check_available,
  all_users,
  users,
  usermail,
  signin,
  logout,
  block,
  unblock,
  report,
  profile,
  updateprofile,
  updateProfileCard,
  updateBasicDetails,
  updateAboutDetails,
  updateMentor,
  updateInvestor,
  updateStartup,
  updateStudent,
  user_post,
  userTextPosts,
  userTaggedPosts,
  user_reel,
  delete_user,
  fetchBlockedUsers,
  shareUserProfile,
  updateCategory,
  checkAndAddReferral,
  preferences,
  suggestions,
  fcm,
  verifiedUser,
  sendOtp,
  userVerifyOtp,
  createIndividualProfile,
  createOrganizationProfile,
  googleAuthLogin,
  country,
  createCountry,
};
