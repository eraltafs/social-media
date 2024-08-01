const router = require("express").Router();
const investController = require("../controllers/applyinvestment");
const upload = require("multer")();

router.post("/investmentForm", upload.none(), investController.investmentForm);


module.exports = router;