const router = require("express").Router();
const Admin = require("../controllers/admin");
const authenticateAdmin = require("../middleware/authenticateAdmin");

router.post("/register", Admin.register);
router.post("/login", Admin.login);
router.post("/forgotPassword", Admin.forgotPassword);
router.post("/changePassword", Admin.changePassword);
router.get("/locationSuggestion", Admin.locationSuggestion);

router.use(authenticateAdmin);
router.get("/getAllRecruiter", Admin.getAllRecruiter);
router.get("/getAllJobseekers", Admin.getAllJobseekers);
router.get("/getAllUsers", Admin.getAllUsers);
router.patch("/changeStatus", Admin.changeRecruiterStatus);
router.get("/getFeedback", Admin.getFeedback);
router.get("/getAllVerifications", Admin.getAllVerifications);
router.patch("/changeVerificationStatus", Admin.changeVerificationStatus);
router.get("/getInvestors", Admin.getAllInvestors);

module.exports = router;
