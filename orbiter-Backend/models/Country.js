const mongoose = require("mongoose");

const CountrySchema = new mongoose.Schema({
  country: { type: String, required: true, unique: true },
  states: { type: [String], required: true },
  countryCode: String,
  mobileNumberSize: String,
});

const Country = mongoose.model("Country", CountrySchema);

module.exports = Country;
