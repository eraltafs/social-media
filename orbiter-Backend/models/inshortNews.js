const mongoose = require('mongoose');

const inshortNewsSchema = mongoose.Schema({
    author_name:String,  // {type:String}
    source_url:String,
    title:String,
    image_url:String,
    content:[],
    created_at:Date,
    category_names:[]
})

const InshortNewsModel = mongoose.model("inshortNews",inshortNewsSchema);

module.exports = {
    InshortNewsModel
}