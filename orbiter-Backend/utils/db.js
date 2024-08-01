const mongoose = require('mongoose');

const connectToDatabase = async () => {
  const url = process.env.mongodbURL;

  try {
    await mongoose.connect(url);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.log(`Mongo Error: ${err}`);
  }
};

module.exports = connectToDatabase;