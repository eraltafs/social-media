const cron = require('node-cron');
const { fetchAndSaveNews } = require("./scrapeNews");
const { scrapeNews } = require("./scrapeNews");
const { InshortNewsModel } = require('../models/inshortNews');
const { NewsModel } = require('../models/scrapnews');
const DeletedPost = require("../models/DeletedPost");

// Cron job to delete expired posts
cron.schedule('0 0 2 * * *', async () => {
    try {
        console.log("Delete post cron job started at:", new Date().toISOString());

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        console.log('Deleting posts older than:', thirtyDaysAgo);

        // Delete posts older than 30 days
        const result = await DeletedPost.deleteMany({ createdAt: { $lt: thirtyDaysAgo } });
        console.log(`${result.deletedCount} expired posts deleted.`);
        console.log('Delete post cron job completed at:', new Date().toISOString());
    } catch (error) {
        console.error('Error deleting expired posts:', error.message);
    }
});

// Cron job to fetch and save news
cron.schedule('0 0 * * *', async () => {
    try {
        console.log("News cron job started at:", new Date().toISOString());
        
        // Delete InshortNews older than one week
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        await InshortNewsModel.deleteMany({ created_at: { $lt: oneWeekAgo } });

        // Delete all NewsModel data
        await NewsModel.deleteMany({});

        // Fetch and save news
        await fetchAndSaveNews();

        // Scrape news for each category
        const categories = ["fintech", "electric-vehicles", "healthtech", "edtech", "it", "ecommerce", "traveltech", "agritech"];
        await Promise.all(categories.map(category => scrapeNews(category)));

        console.log('News cron job completed at:', new Date().toISOString());
    } catch (error) {
        console.error('Error fetching and saving news:', error.message);
    }
});
