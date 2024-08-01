const router = require("express").Router();
const upload = require("multer")();

const newsRoute = require("./news");
const postRoutes = require("./post");
const authRoutes = require("./auth");
const chatRoutes = require("./chat");
const adminRoutes = require("./admin");
const groupRoutes = require("./group");
const hiringRoutes = require("./hiring");
const messageRoutes = require("./message");
const investRoute = require("./investment");
const searchRoute = require("./searchRoute");
const FeedbackRoute = require("./FeedbackRoutes");
const password = require("../controllers/password");
const notificationRoutes = require("./notification");
const scrapeNewsRoute = require("../routes/scrapnews");

router.use(`/news`, newsRoute);
router.use(`/auth`, authRoutes);
router.use(`/posts`, postRoutes);
router.use(`/chats`, chatRoutes);
router.use(`/admin`, adminRoutes);
router.use(`/search`, searchRoute);
router.use(`/invest`, investRoute);
router.use(`/groups`, groupRoutes);
router.use(`/hirings`, hiringRoutes);
router.use(`/feedback`, FeedbackRoute);
router.use(`/messaging`, messageRoutes);
router.use(`/scrapNews`, scrapeNewsRoute);
router.use(`/notification`, notificationRoutes);
router.use(`/user/forgot-password`, password.forgotPassword);
router.use(`/common/reset-password`, upload.none(), password.resetPassword);

module.exports = router;
