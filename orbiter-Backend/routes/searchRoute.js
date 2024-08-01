const router = require("express").Router();
const searchRoute = require("../controllers/search");
const upload = require("multer")();

router.use(upload.none())
router.post("/search", searchRoute.search);
router.post("/search_history", searchRoute.searchhistory);
router.get("/fetch_history/:user_id", searchRoute.fetchSavedSearchData);
router.post("/profile_visit", searchRoute.profile_visit);
router.get("/saved_profile/:user_id", searchRoute.saved_profile);

module.exports = router;
