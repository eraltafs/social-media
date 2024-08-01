const router = require("express").Router();
const upload = require("multer")();
const Notification = require("../controllers/notification");

router.get("/all/:recipient", Notification.getAll);
router.get("/unread/:recipient", Notification.getUnread);
router.post("/doSeenNotification",upload.none(),Notification.doSeenNotification);
router.post("/doSeenAllNotification",upload.none(),Notification.doSeenAllNotification);
module.exports = router