const router = require("express").Router();
const messageController = require("../controllers/message");
const upload = require("multer")();

router.use(upload.none())
router.post("/getAllUser",  messageController.getAllUser);
router.post("/save-chat",  messageController.saveChat);
router.post("/get-message",  messageController.getMessages);


module.exports = router;