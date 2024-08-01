//  Here I am going to create a schema for building the Relationship between
//  Follwers and Followings and on the basic of that relationship we will fetch the posts, shorts etc..

const mongoose = require("mongoose");

const relationshipSchema = mongoose.Schema({
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  following: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const RelationshipModel = mongoose.Model("relationship", relationshipSchema);

module.exports = RelationshipModel;
