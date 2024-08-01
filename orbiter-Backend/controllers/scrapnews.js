
const { ObjectId } = require('mongoose').Types;


const { NewsModel } = require('../models/scrapnews');
const { InshortNewsModel } = require('../models/inshortNews');

const {shuffleAndPrint} = require('../utils/scrapeNews');

const newsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const query = category ? { category_names: category } : {};
        const data = await Promise.all([
            InshortNewsModel.find(query),
            NewsModel.find(query)
        ]);
        const mergedData = [].concat(...data);
        const shuffledNews = shuffleAndPrint(mergedData);
        res.status(200).json({ status: 1, message: shuffledNews });
    } catch (error) {
        res.status(500).json({ status: 0, message: error.message });
    }
};

const allNewsList = async (req, res) => {
    try {
        const allcategory = ["all", "startup", "business", "technology", "fintech", "electric-vehicles", "healthtech", "edtech", "it", "ecommerce", "traveltech", "agritech"]
        res.status(200).json({ status: 1, newscategory: allcategory });
    } catch (error) {
        res.status(500).json({ status: 0, message: error.message });
    }
};

const news= async (req, res) => {
    const id = req.params._id;
    console.log(id);
    try {
        const data = await InshortNewsModel.findOne({ "_id": new ObjectId(id) });
        const News = await NewsModel.findOne({ "_id": new ObjectId(id) });
        const NewData = data || News;
        res.status(200).json({ status: 1, message: NewData });
    } catch (error) {
        res.status(500).json({ status: 0, message: error.message });
    }
};

module.exports = { newsByCategory, allNewsList ,news}