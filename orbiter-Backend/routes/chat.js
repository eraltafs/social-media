const router = require("express").Router();
const chatController = require("../controllers/chat");
const upload = require("multer")();
router.use(upload.none())

router.post("/create-chat", chatController.createChat);
router.post("/find-user-chats", chatController.findUserChats);
router.post("/find-chat/:firstId/:secondId", chatController.findChat);

module.exports = router;