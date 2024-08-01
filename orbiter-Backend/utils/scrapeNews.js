const cheerio = require('cheerio');
const axios = require('axios');
const {InshortNewsModel} = require("../models/inshortNews");
const { NewsModel } = require('../models/scrapnews');



async function scrapeContent(link) {
    try {
        const response = await axios.get(link);
        const html = response.data;
        const $ = cheerio.load(html);
        const summaryDivs = $('div.single-post-summary');
        let content = [];
        summaryDivs.each((index, element) => {
            const paragraphs = $(element).find('p');
            paragraphs.each((idx, pElement) => {
                content.push($(pElement).text().trim());
            });
        });

        return content;

    } catch (error) {
        console.error(error);
        return null;
    }
}

async function scrapeNews(category) {
    const baseUrl = `https://inc42.com/industry/${category.toLowerCase()}/page/`;

    for (let page = 1; page <= 2; page++) {
        const response = await axios.get(baseUrl + page);
        const html = response.data;
        const $ = cheerio.load(html);

        const savePromises = [];

        $('div[class^="card-wrapper"]').each(async(index, element) => {
            const title = $('h2.entry-title a', element).text().trim();
            const link = $('h2.entry-title a', element).attr('href');
            const image = $('img.wp-post-image', element).attr('data-src') || $('img.wp-post-image', element).attr('src');
            const content = await scrapeContent(link);
            const createdAt = $('span.date', element).text().trim();
            const author_name = $('span.author a', element).text().trim();
            const dateParts = createdAt.match(/(\d+)(\w+) (\w+), (\d+)/);
            const day = dateParts[1];
            const monthName = dateParts[3];
            const year = dateParts[4];

            const months = {
                "January": 0, "February": 1, "March": 2, "April": 3, "May": 4, "June": 5,
                "July": 6, "August": 7, "September": 8, "October": 9, "November": 10, "December": 11
            };

            const month = months[monthName];
            const dateObject = new Date(year, month, day);
            const unixTimestampInMilliseconds = dateObject.getTime();
            const newData = new NewsModel({
                author_name: author_name,
                source_url: link,
                title,
                image_url: image,
                content,
                created_at: unixTimestampInMilliseconds,
                category_names: [category]
            })
            const savePromise = newData.save();
            savePromises.push(savePromise);
        });
       
        await Promise.all(savePromises);
    }
}

function shuffleAndPrint(array) {
    let currentIndex = array.length, temporaryValue, randomIndex;

    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

function getNewsForStorage(newsObject) {
    return {
        author_name: newsObject.author_name || 'Unknown Author',
        source_url: newsObject.source_url || 'No Source URL',
        title: newsObject.title || 'No Title',
        image_url: newsObject.image_url || 'No Image URL',
        content: [newsObject.content] || 'No Content Available',
        created_at: newsObject.created_at || Date.now(),
        category_names: newsObject.category_names || ['Undefined'],
    };
}
async function fetchAndSaveNews() {
    try {
        const response = await axios.get('https://inshorts.com/api/en/news?category=all_news&include_card_data=true&max_limit=50000');
        const newsList = response.data.data.news_list;
        const newsObjects = newsList.map(news => news.news_obj);
        const allowedCategories = ["startup", "business", "technology", "fintech", "electric-vehicles", "healthtech", "edtech", "it", "ecommerce", "traveltech", "agritech"];

        for (const item of newsObjects) {
            const category = item.category_names[0];
            if (allowedCategories.includes(category)) {
                const { author_name, source_url, title, image_url, content, created_at } = getNewsForStorage(item);
                const contentArray = [item.content]; 
                await InshortNewsModel.insertMany({
                    author_name,
                    source_url,
                    title,
                    image_url,
                    content: contentArray,
                    created_at,
                    category_names: [category]
                });
            }
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}


module.exports = {scrapeNews,shuffleAndPrint, getNewsForStorage, fetchAndSaveNews }
