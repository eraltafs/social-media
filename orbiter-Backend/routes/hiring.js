const router = require("express").Router();
const Jobseeker = require("../controllers/jobseeker");
const Recruiter = require("../controllers/recruiter");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "./upload/";
    if (file.fieldname === "logo") {
      folder += "logos";
    } else if (file.fieldname === "license") {
      folder += "licenses";
    } else if (file.fieldname === "certificate") {
      folder += "certificates";
    }else if (file.fieldname === "resume") {
      folder += "resumes";
    }
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}_${Date.now()}_${file.originalname}`);
  },
});

const fs = require("fs");
const createDirectories = () => {
  const dirs = ["./upload/logos", "./upload/licenses","./upload/certificates","./upload/resumes"];
  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createDirectories();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

router.post("/createProfile", upload.single("resume"), Jobseeker.createProfile);
router.post("/updateProfile", upload.single("resume"), Jobseeker.updateProfile);
router.post("/applyForJob", upload.single("resume"), Jobseeker.applyForJob);
router.post("/registerHiring", upload.fields([ { name: "logo", maxCount: 1 }, { name: "license", maxCount: 1 }, { name: "certificate", maxCount: 1 }]), Recruiter.createProfile);

router.use(upload.none());

router.get("/getProfile/:user_id", Jobseeker.getProfile);
router.get("/getApplied/:user_id", Jobseeker.getApplied);
router.post("/getSaved/", Jobseeker.getSaved);
router.post("/getJobs", Jobseeker.getJobs);
router.post("/getJobId", Jobseeker.getJobId);
router.post("/saveJob", Jobseeker.saveJob);
router.post("/unsaveJob", Jobseeker.unSaveJob);

router.post("/createPost", Recruiter.createPost);
router.get("/recruiter/getProfile/:user_id", Recruiter.getProfile);
router.post("/getMyJobPosts", Recruiter.getJobPosts);
router.post("/changeJobStatus", Recruiter.changeJobStatus);
router.post("/getJobDetail", Recruiter.getJobDetail);
router.post("/getAllResumes", Recruiter.getAllResumes);
router.post("/getAplicants/:jobId", Recruiter.getJobApplicants);

module.exports = router;
