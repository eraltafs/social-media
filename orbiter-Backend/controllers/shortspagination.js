const express = require("express");
const { ObjectId } = require("mongoose").Types;

const shortPagination = express.Router();

const User = require("../models/User");
const connectionRequestModel = require("../models/connectionRequestModel");
const Reel = require("../models/Reel");

shortPagination.get("/api/shorts", async (req, res) => {
  try {
    const { user_id, page, limit } = req.body;

    //  finding the ids of following list so we can fetch post on the basis of followers

    const currentUser = await User.findById(user_id);

    if (!currentUser) {
      res.status(404).json({ message: "User not found" });
    }

    const followingIds = currentUser.following;

    //  finding the ids of connection so we can fetch post on the basis of connections

    const connectionReceiverIds = await connectionRequestModel.aggregate([
      {
        $match: {
          sender_id: new ObjectId(user_id),
          status: "accepted",
        },
      },
      {
        $group: {
          _id: null,
          receiverIds: { $push: { $toString: "$receiver_id" } },
        },
      },
      { $project: { _id: 0, receiverIds: 1 } },
    ]);

    // connectionReceiverIds is an array of Object of length 1 inside that we have an array named receiverIds which contains the receiver ids
    const ConnectionReceiverIdsInArray = connectionReceiverIds[0].receiverIds;

    // finding the recent post on the basis of following, followers, and connection

    const recentReels = await Reel.aggregate([
      {
        $match: {
          user_id: {
            $in: [
              ...ConnectionReceiverIdsInArray.map((id) => new ObjectId(id)),
              ...followingIds.map((id) => new ObjectId(id)),
              new ObjectId(user_id),
            ],
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user_details",
        },
      },
      {
        $addFields: {
          user_details: { $arrayElemAt: ["$user_details", 0] },

          isLiked: {
            $cond: {
              if: {
                $and: [{ $isArray: "$likes" }, { $in: [user_id, "$likes"] }],
              },
              then: true,
              else: false,
            },
          },

          commentsCount: {
            $cond: {
              if: { $isArray: "$comments" },
              then: { $size: "$comments" },
              else: 0,
            },
          },
          viewsCount: {
            $cond: {
              if: { $isArray: "$views" },
              then: { $size: "$views" },
              else: 0,
            },
          },
          likeCount: {
            $cond: {
              if: { $isArray: "$likes" },
              then: { $size: "$likes" },
              else: 0,
            },
          },
        },
      },

      {
        $project: {
          video: 1,
          view: 1,
          text: 1,
          commentSettings: 1,
          createdAt: 1,
          commentsCount: 1,
          viewsCount: 1,
          repostCount: 1,
          likeCount: 1,
          isLiked: 1,
          "user_details.avatar": 1,
          "user_details.first_name": 1,
          "user_details.last_name": 1,
          "user_details.user_name": 1,
          "user_details.isverified": 1,
        },
      },

      {
        $sort: { createdAt: -1 },
      },
      {
        $skip: (page - 1) * limit,
      },
      {
        $limit: parseInt(limit),
      },
    ]);

    res.json(recentReels);
  } catch (err) {
    console.error(err);
    res.json({ message: err.message });
  }
});

module.exports = {
  shortPagination,
};
