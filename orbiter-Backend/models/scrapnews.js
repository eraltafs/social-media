const mongoose = require('mongoose');

const NewsSchema = mongoose.Schema({
    author_name:String,  // {type:String}
    source_url:String,
    title:String,
    image_url:String,
    content:[],
    created_at:Date,
    category_names:[]
})

const NewsModel = mongoose.model("News",NewsSchema);

module.exports = {
    NewsModel
}