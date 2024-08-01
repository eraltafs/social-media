const express = require("express");
const router = express.Router();
const authRoutes = require("../controllers/auth");
const session = require("express-session");
const uuid = require("uuid").v4;
const multer = require("multer");

const storage = multer.diskStorage({
  destination: "./upload/images",
  filename: (req, file, cb) => {
    return cb(null, `${file.fieldname}_${Date.now()}_${file.originalname}`);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});
router.use(
  session({
    secret: process.env.SESSION_SECRET || uuid(), 
    resave: false,
    saveUninitialized: false,
  })
);
router.use("/profile", express.static("upload/images"));
router.post("/profile", upload.fields([{ name: 'profilePhoto', maxCount: 1 }, { name: 'coverPhoto', maxCount: 1 }]), authRoutes.profile);
router.post("/updateprofile", upload.fields([{ name: 'profilePhoto', maxCount: 1 }, { name: 'coverPhoto', maxCount: 1 }]), authRoutes.updateprofile);
router.post("/updateprofilecard", upload.fields([{ name: 'profilePhoto', maxCount: 1 }, { name: 'coverPhoto', maxCount: 1 }]), authRoutes.updateProfileCard);
router.post("/individualprofilecreate", upload.fields([{ name: 'profilePhoto', maxCount: 1 }]), authRoutes.createIndividualProfile);
router.post("/organizationprofilecreate", upload.fields([{ name: 'profilePhoto', maxCount: 1 }]), authRoutes.createOrganizationProfile);
router.use(upload.none())
router.post("/updatebasicdetails", authRoutes.updateBasicDetails);
router.post("/updateaboutdetails", authRoutes.updateAboutDetails);
router.post("/advance/updateMentor", authRoutes.updateMentor);
router.post("/advance/updateInvestor", authRoutes.updateInvestor);
router.post("/advance/updateStartup", authRoutes.updateStartup);
router.post("/advance/updateStudent", authRoutes.updateStudent);
router.post("/updateCategory", authRoutes.updateCategory);
router.post("/check_available", authRoutes.check_available);
router.post("/all_users", authRoutes.all_users);
router.post("/users", authRoutes.users);
router.post("/usermail", authRoutes.usermail);
router.post("/signin", authRoutes.signin);
router.post("/logout", authRoutes.logout);
router.post("/block", authRoutes.block);
router.post("/unblock", authRoutes.unblock);
router.post("/fetch_block", authRoutes.fetchBlockedUsers);
router.post("/report", authRoutes.report);
router.post("/user_post", authRoutes.user_post);
router.post("/userTextPosts", authRoutes.userTextPosts);
router.post("/userTaggedPosts", authRoutes.userTaggedPosts);
router.post("/user_reel", authRoutes.user_reel);
router.post("/delete_user", authRoutes.delete_user);
router.post("/share-profile", authRoutes.shareUserProfile);
router.post("/add-referral", authRoutes.checkAndAddReferral);
router.post("/suggestions", authRoutes.suggestions);
router.post("/preferences", authRoutes.preferences);
router.post("/fcm", authRoutes.fcm);
router.post("/verify", authRoutes.verifiedUser);

// new signIn flow
router.post("/sendotp", authRoutes.sendOtp);
router.post("/verifyotp", authRoutes.userVerifyOtp);
router.post("/verifygoogleaccount",authRoutes.googleAuthLogin);
router.get("/country",authRoutes.country);
router.post("/country",authRoutes.createCountry);
module.exports = router;
