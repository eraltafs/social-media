const router = require("express").Router();
const FeedbackController = require("../controllers/Feedback");
const upload = require("multer")();

router.post("/FeedbackForm", upload.none(), FeedbackController.FeedbackForm);


module.exports = router;