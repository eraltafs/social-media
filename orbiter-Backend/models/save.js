const mongoose = require('mongoose');

const saveSchema = new mongoose.Schema({
  user_id:{ type: String},
  post_ids:[
    {
      type: String,
    },
  ],
  reel_ids:[
    {
      type: String,
    },
  ],
  
}, { timestamps: true });
saveSchema.index({ createdAt: -1 });
module.exports = mongoose.model('Save', saveSchema);

  