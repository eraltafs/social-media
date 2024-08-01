const router = require("express").Router();
const scrapnews = require("../controllers/scrapnews")

router.get('/news/:category?', scrapnews.newsByCategory);
router.get('/allnewsList', scrapnews.allNewsList);
router.get('/:_id', scrapnews.news);



module.exports = router

