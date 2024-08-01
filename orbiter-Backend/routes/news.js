const router = require("express").Router();
const newsController = require("../controllers/news");
const multer = require("multer");
const upload = multer();
const path = require("path");
const imageStorage = multer.diskStorage({
  destination: path.join(__dirname, "../upload/images"),
  filename: (req, file, cb) => {
    return cb(
      null,
      `${file.fieldname}_${Date.now()}_${file.originalname}`
    );
  },
});
const imageUpload = multer({
  storage: imageStorage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});
router.post("/post_news", imageUpload.single("news_images"), newsController.postNews);
router.post("/fetch_news", upload.none(), newsController.fetchNews);
router.post("/delete_news", upload.none(), newsController.deleteNews);
router.post("/share_news", upload.none(), newsController.shareNews);
router.post("/news_data", upload.none(), newsController.news_data);
router.post("/news_like", upload.none(), newsController.like);
router.post("/news_view", upload.none(), newsController.views);

module.exports = router;