const router = require("express").Router();
const postRoutes = require("../controllers/post.js");
const session = require("express-session");
const uuid = require("uuid").v4;
const multer = require("multer");
const path = require("path");
const upload = multer();
const imageStorage = multer.diskStorage({
  destination: path.join(__dirname, "../upload/images"),
  filename: (req, file, cb) => {
    return cb(null, `${file.fieldname}_${Date.now()}_${file.originalname}`);
  },
});
const imageUpload = multer({
  storage: imageStorage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});
const videoStorage = multer.diskStorage({
  destination: path.join(__dirname, "../upload/videos"),
  filename: (req, file, cb) => {
    return cb(null, `${file.fieldname}_${Date.now()}_${file.originalname}`);
  },
});
const videoUpload = multer({ storage: videoStorage });
router.use(
  session({
    secret: process.env.SESSION_SECRET || uuid(), // Use an environment variable or generate a random key
    resave: false,
    saveUninitialized: false,
  })
);
router.post("/image", imageUpload.array("images"), postRoutes.images);
router.post("/videos", videoUpload.single("video"), postRoutes.videos);

router.use(upload.none());
router.post("/comment_alls", postRoutes.comment_alls);
router.post("/like", postRoutes.like);
router.post("/unlike", postRoutes.unlike);
router.post("/comment", postRoutes.comment);
router.post("/follow", postRoutes.follow);
router.post("/unfollow", postRoutes.unfollow);
router.post("/following", postRoutes.following);
router.post("/followers", postRoutes.followers);
router.post("/likes_list", postRoutes.likes_list);
router.post("/like_reel", postRoutes.like_reel);
router.post("/unlike_reel", postRoutes.unlike_reel);
router.post("/savepost", postRoutes.savePost);
router.post("/unsavePost", postRoutes.unsavePost);
router.post("/fetchSavedPosts", postRoutes.fetchSavedPosts);
router.post("/repost", postRoutes.repostController);
router.post("/repost_list", postRoutes.repost_list);
router.post("/fetch-all-reposts", postRoutes.fetchAllReposts);
router.post("/fetchReels", postRoutes.fetchReels);
router.post("/retrievePost", postRoutes.retrievePost);
router.post("/getDeletedPosts", postRoutes.getDeletedPosts);
router.post("/delete_post", postRoutes.delete_post);
router.post("/delete_post_permanent", postRoutes.delete_post_permanent);
router.post("/send_request", postRoutes.sendConnectionRequest);
router.post("/handle_request", postRoutes.handleConnectionRequest);
router.post("/accepted_connections", postRoutes.fetchAcceptedConnections);
router.post("/all_connections", postRoutes.fetchAllConnectionRequests);
router.post("/reel_likes_list", postRoutes.reel_likes_list);
router.post("/comment_reel", postRoutes.comment_reel);
router.post("/comment_reel_alls", postRoutes.comment_reel_alls);
router.post("/post_data", postRoutes.post_data);
router.post("/reel_data", postRoutes.reel_data);
router.post("/trending", postRoutes.trending);
router.post("/tag_list", postRoutes.tag_list);
router.post("/savereel", postRoutes.saveReel);
router.post("/unsavereel", postRoutes.unsaveReel);
router.post("/fetchSavedreel", postRoutes.fetchSavedReels);
router.post("/connection_count", postRoutes.connectioncount);
router.post("/share-post", postRoutes.shareUserPost);
router.post("/comment_delete", postRoutes.comment_delete);
router.post("/comment_reel_delete", postRoutes.comment_reel_delete);
router.post("/views", postRoutes.views);
router.post("/reel_views", postRoutes.reel_views);
router.post("/share-reel", postRoutes.shareUserReel);
router.post("/notintrest-post", postRoutes.blockedPost);
router.post("/blocked_reel", postRoutes.blockedPostReel);
router.post("/add-comment-settings", postRoutes.addCommentSettings);
router.post("/deleteRepost", postRoutes.deleteRepost);
router.get("/paginationPost/:user_id", postRoutes.paginationPost);
router.get("/paginationTrendingPost/:user_id",postRoutes.paginationTrandingPost);
router.get("/individualPost/:user_id", postRoutes.individualPost);
router.get("/organizationPost/:user_id", postRoutes.organizationPost);
router.get("/getAllHashtags", postRoutes.getAllHashtags);
router.post("/getPostsByHashtag/:hashtag", postRoutes.getPostsByHashtag);

module.exports = router;
