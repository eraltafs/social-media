const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { ObjectId } = require("mongoose").Types;
const ProfileVisit = require("../models/ProfileVisit");
const { PutObjectCommand } = require("@aws-sdk/client-s3");

//models

const Reel = require("../models/Reel");
const User = require("../models/User");
const Save = require("../models/save");
const post = require("../models/Post.js");
const Repost = require("../models/Repost");
const Message = require("../models/Message.js");
const DeletedPost = require("../models/DeletedPost");
const BlockedUser = require("../models/BlockedUser");
const Notification = require("../models/notification.js");
const ConnectionRequest = require("../models/connectionRequestModel.js");

//utils
const { shuffle } = require("../utils/shuffle.js");
const { calculateAgeOfPost } = require("../utils/timeUtils.js");
const { bucketName, s3Url, s3Client } = require("../utils/awsConfig.js");
const {
  sendInAppNotification,
  sendNotification,
} = require("../utils/notification.js");
const { processAndUploadImage } = require("../utils/uploadAws.js");

const formatDateTime = (date) => {
  const options = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  };
  const formattedDate = date.toLocaleDateString("en-US", options);

  // Extract components and rearrange in the desired order
  const [day, month, year, time] = formattedDate.split(" ");
  const abbreviatedMonth = month.charAt(0).toUpperCase() + month.slice(1, -1); // Fix the abbreviated month format
  return ` ${abbreviatedMonth} ${day} ,${year} ${time}`;
};

const fetchUserDetail = async (_id, followerid) => {
  try {
    const user = await User.findById(_id).select(
      "username items avatar first_name last_name name isverified type followers"
    );

    if (user) {
      const isFollowing = user.followers.includes(followerid);
      return {
        ...user._doc,
        items: user.items[0],
        following: isFollowing,
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
};

const getConnectionStatus = async (userId, authorId) => {
  try {
    // Check if there is a connection request from the logged-in user to the post author
    const connectionRequestSent = await ConnectionRequest.findOne({
      sender_id: userId,
      receiver_id: authorId,
      status: "accepted", // Assuming accepted status means a connection is established
    });

    if (connectionRequestSent) return "connected";

    // Check if there is a connection request from the post author to the logged-in user
    const connectionRequestReceived = await ConnectionRequest.findOne({
      sender_id: authorId,
      receiver_id: userId,
      status: "accepted",
    });

    if (connectionRequestReceived) return "connected";

    return "not_connected";
  } catch (error) {
    console.error("Error checking connection status:", error);
    return "error";
  }
};

const comment_alls = async (req, res) => {
  try {
    const { postId, page, limit } = req.body;
    const pageInt = parseInt(page) || 1;
    const limitInt = parseInt(limit) || 15;
    const skip = (pageInt - 1) * limitInt;

    // Fetch the post by ID
    if (!postId || postId === "") {
      return res.status(500).json({ success: 0, message: "post id not found" });
    }
    const posts = await post.findById(postId);
    // Validate if the post exists
    if (!posts) {
      return res.status(404).json({ Success: 0, message: "Post not found" });
    }

    // Fetch comments with pagination
    const comments = posts.comments
      .slice(skip, skip + limitInt) // Apply pagination
      .map(async (comment) => {
        if (comment.user_id) {
          const commentUserData = await fetchUserDetail(comment.user_id);
          const formattedDateTime = calculateAgeOfPost(comment.createdAt);
          if (commentUserData) {
            // Format the comment with additional user data
            const formattedComment = {
              user_id: comment.user_id,
              text: comment.text,
              createdAt: comment.createdAt,
              _id: comment._id,
              username: commentUserData.username,
              first_name: commentUserData.first_name,
              last_name: commentUserData.last_name,
              type: commentUserData.type,
              avatar: commentUserData.avatar,
              name: commentUserData.name,
              createdAtformet: formattedDateTime,
            };
            return formattedComment;
          }
        }
      });

    // Wait for all promises to resolve using Promise.all
    const formattedComments = await Promise.all(comments);

    // Filter out undefined values (in case some comments did not have user data)
    const validComments = formattedComments.filter((comment) => comment);

    // Send the response with the paginated comments array
    return res.json({
      comments: validComments,
      Success: 1,
      message: "Success",
    });
  } catch (error) {
    console.error("Error fetching comments : ", error);
    return res
      .status(500)
      .json({ comments: [], Success: 0, message: "Error fetching comments" });
  }
};

const comment_reel_alls = async (req, res) => {
  const { reelId, page, limit } = req.body;
  const pageInt = parseInt(page) || 1;
  const limitInt = parseInt(limit) || 15;
  const skip = (pageInt - 1) * limitInt;
  try {
    if (!reelId || reelId === "") {
      return res
        .status(500)
        .json({ success: 0, message: "reelId id not found" });
    }

    // Fetch the post by ID
    const posts = await Reel.findById(reelId);
    // Validate if the post exists
    if (!posts) {
      return res.status(404).json({ Success: 0, message: "Post not found" });
    }

    // Fetch comments with pagination
    const comments = posts.comments
      .slice(skip, skip + limitInt) // Apply pagination
      .map(async (comment) => {
        if (comment.user_id) {
          const commentUserData = await fetchUserDetail(comment.user_id);
          const formattedDateTime = calculateAgeOfPost(comment.createdAt);
          if (commentUserData) {
            // Format the comment with additional user data
            const formattedComment = {
              user_id: comment.user_id,
              text: comment.text,
              createdAt: comment.createdAt,
              _id: comment._id,
              username: commentUserData.username,
              first_name: commentUserData.first_name,
              last_name: commentUserData.last_name,
              name: commentUserData.name,
              avatar: commentUserData.avatar,
              type: commentUserData.type,
              createdAtformet: formattedDateTime,
            };
            return formattedComment;
          }
        }
      });

    // Wait for all promises to resolve using Promise.all
    const formattedComments = await Promise.all(comments);

    // Filter out undefined values (in case some comments did not have user data)
    const validComments = formattedComments.filter((comment) => comment);

    // Send the response with the paginated comments array
    return res.json({
      comments: validComments,
      Success: 1,
      message: "Success",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ comments: [], Success: 0, message: "Error fetching comments" });
  }
};

const like = async (req, res) => {
  const { user_id, postId } = req.body;
  try {
    if (!postId || postId === "") {
      return res.status(500).json({ success: 0, message: "post id not found" });
    }
    if (!user_id || user_id === "") {
      return res
        .status(500)
        .json({ success: 0, message: "user_id id not found" });
    }

    const posts = await post.findById(postId);
    if (!posts) {
      return res.json({ Success: 0, message: "Post not found" });
    }

    // Check if the user has already liked the post
    if (posts.likes && posts.likes.includes(user_id)) {
      return res.json({
        Success: 0,
        message: "User already liked this post",
      });
    }

    // Push the user ID into the likes array
    posts.likes.push(user_id);

    // Save the updated post
    await posts.save();

    // Prepare post data to send in the response

    const user = await User.findById(posts.user_id);
    const isFollowing = user.followers.includes(user_id);
    const postdata = {
      likes_check: true,
      comment: posts.comments.length,
      likes: posts.likes.length,
      following: isFollowing,
    };

    // Check if the post owner has FCM token
    const ownerData = await User.findById(posts.user_id);
    if (ownerData?.fcmTokenList) {
      const userInfo = await User.findById(user_id);
      let body;
      if (posts.likes.length == 1) {
        body = `liked your post`;
      } else {
        body = `and ${posts.likes.length - 1} other liked your post`;
      }

      const senderdata = {
        sender: user_id,
        username: userInfo.username,
        type: userInfo.type,
        first_name: userInfo.first_name,
        last_name: userInfo.last_name,
        avatar: userInfo.avatar,
      };

      // Send notification if FCM token is found and user liked other's post

      if (ownerData?.fcmTokenList.length > 0 && user_id !== posts.user_id) {
        const filteredTokenList = ownerData.fcmTokenList.filter(
          (token) => token != null
        );
        const title = "Liked Post";
        sendNotification(
          title,
          `${userInfo?.first_name} ${body}`,
          filteredTokenList,
          "like",
          postId
        );
      }
      if (user_id !== posts.user_id)
        sendInAppNotification(
          body,
          user_id,
          posts.user_id,
          "like",
          senderdata,
          postId,
          posts.image,
          posts.text,
          null
        );
    }

    return res.json({
      Success: 1,
      message: "Post liked successfully",
      postdata: postdata,
    });
  } catch (error) {
    console.error("Error liking post:", error);
    return res.status(500).json({ message: "Error liking post" });
  }
};

const like_reel = async (req, res) => {
  const { reel_id, user_id } = req.body;
  try {
    if (!reel_id || reel_id === "") {
      return res
        .status(500)
        .json({ success: 0, message: "reel_id id not found" });
    }
    if (!user_id || user_id === "") {
      return res
        .status(500)
        .json({ success: 0, message: "user_id id not found" });
    }
    const reel = await Reel.findById(reel_id);
    if (!reel) {
      return res.json({ Success: 0, message: "Reel not found" });
    }

    // Check if the user has already liked the reel
    if (reel.likes && reel.likes.includes(user_id)) {
      return res.json({
        Success: 0,
        message: "User already liked this reel",
      });
    }

    // Push the user ID into the likes array
    reel.likes.push(user_id);

    // Save the updated reel
    await reel.save();

    // Prepare reel data to send in the response
    const _id = reel.user_id;
    const isliked = reel.likes.includes(user_id);
    const userData = await fetchUserDetail(_id, user_id);
    const postdata = {
      likes_check: isliked,
      comment: reel.comments.length,
      likes: reel.likes.length,
      following: userData.following,
    };

    // Check if the reel owner has FCM token
    const ownerData = await User.findById(reel.user_id);
    if (ownerData?.fcmTokenList) {
      const userInfo = await User.findById(user_id);
      let body;
      if (reel.likes.length == 1) {
        body = `liked your reel`;
      } else {
        body = `and ${reel.likes.length - 1} other liked your reel`;
      }
      const senderdata = {
        sender: user_id,
        username: userInfo.username,
        type: userInfo.type,
        first_name: userInfo.first_name,
        last_name: userInfo.last_name,
        avatar: userInfo.avatar,
      };

      // Send notification if FCM token is found and user liked other's reel
      if (ownerData?.fcmTokenList.length > 0 && user_id !== reel.user_id) {
        const filteredTokenList = ownerData?.fcmTokenList.filter(
          (token) => token != null
        );
        const title = "Liked Reel";

        sendNotification(
          title,
          `${userInfo?.first_name} ${body}`,
          filteredTokenList,
          "like_reel",
          reel_id
        );
      }
      if (user_id !== reel.user_id)
        sendInAppNotification(
          body,
          user_id,
          reel.user_id,
          "like_reel",
          senderdata,
          reel_id,
          null,
          null,
          reel.video
        );
    }

    return res.json({
      Success: 1,
      message: "Reel liked successfully",
      postdata: postdata,
    });
  } catch (error) {
    console.error("Error liking reel:", error);
    return res.status(500).json({ message: "Error liking reel" });
  }
};

const reel_likes_list = async (req, res) => {
  const { reel_id, user_id } = req.body;

  try {
    if (!reel_id || reel_id === "") {
      return res
        .status(500)
        .json({ success: 0, message: "reel_id id not found" });
    }
    if (!user_id || user_id === "") {
      return res
        .status(500)
        .json({ success: 0, message: "user_id id not found" });
    }
    const posts = await Reel.findById(reel_id);
    if (!posts) {
      return res.status(404).json({ error: "Post not found" });
    }

    const likes_id = posts.likes;
    const likes_users = await User.find(
      { _id: { $in: likes_id } },
      { password: 0 }
    );

    // Fetch the user to check if they are following each user in the likes array
    const user = await User.findById(user_id);

    // Add isFollowing property to each liked user
    const likedUsersWithFollowingStatus = likes_users.map((likedUser) => ({
      ...likedUser.toObject(),
      isFollowing: user.following.includes(likedUser._id.toString()),
      items: likedUser.items[0],
    }));

    return res.json({
      Success: 1,
      message: "Success",
      likes: likedUsersWithFollowingStatus,
    });
  } catch (error) {
    console.error("Error fetching liked users:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const unlike = async (req, res) => {
  const { postId, user_id } = req.body;
  try {
    if (!postId || postId === "") {
      return res
        .status(500)
        .json({ success: 0, message: "postId id not found" });
    }
    if (!user_id || user_id === "") {
      return res
        .status(500)
        .json({ success: 0, message: "user_id id not found" });
    }

    // Find the post by ID
    const posts = await post.findById(postId);
    if (!posts) {
      return res.json({ Success: 0, message: "Post not found" });
    }

    // Check if the user has liked the post
    if (!(posts.likes && posts.likes.includes(user_id))) {
      return res.json({ Success: 0, message: "User has not liked this post" });
    }

    // Remove the user ID from the likes array
    posts.likes = posts.likes.filter((likeUserId) => likeUserId !== user_id);

    // Save the updated post
    await posts.save();
    const user = await User.findById(posts.user_id);
    const isFollowing = user.followers.includes(user_id);
    const postdata = {
      likes_check: false,
      comment: posts.comments.length,
      likes: posts.likes.length,
      following: isFollowing,
    };
    if (postdata.likes === 0) {
      let notification = await Notification.deleteOne({
        type: "like",
        post: postId,
      });
    } else {
      let body;
      if (postdata.likes == 1) {
        body = `liked your post`;
      } else {
        body = `and ${postdata.likes - 1} other liked your post`;
      }
      const lastliked = posts.likes[posts.likes.length - 1];

      const sender = await User.findById(lastliked).select(
        "username type first_name last_name avatar"
      );
      const senderdata = {
        sender: lastliked,
        username: sender.username,
        type: sender.type,
        first_name: sender.first_name,
        last_name: sender.last_name,
        avatar: sender.avatar,
      };

      let notification = await Notification.updateOne(
        { type: "like", post: postId },
        { $set: { senderdata: senderdata, body: body, sender: lastliked } }
      );
    }
    return res.json({
      Success: 1,
      message: "Post unliked successfully",
      postdata: postdata,
    });
  } catch (error) {
    console.error("Error unliking post:", error);
    return res.json({ Success: 0, message: "Error unliking post" });
  }
};

const unlike_reel = async (req, res) => {
  try {
    const { reel_id, user_id } = req.body;
    if (!reel_id || reel_id === "") {
      return res
        .status(500)
        .json({ success: 0, message: "reel_id id not found" });
    }
    if (!user_id || user_id === "") {
      return res
        .status(500)
        .json({ success: 0, message: "user_id id not found" });
    }
    // Find the post by ID
    const reel = await Reel.findById(reel_id);
    if (!reel) {
      return res.json({ Success: 0, message: "Post not found", postdata: [] });
    }

    // Check if the user has liked the post
    if (!(reel.likes && reel.likes.includes(user_id))) {
      return res.json({
        Success: 0,
        message: "User has not unliked this post",
        postdata: [],
      });
    }

    // Remove the user ID from the likes array
    reel.likes = reel.likes.filter((likeUserId) => likeUserId !== user_id);

    // Save the updated post
    await reel.save();
    const user = await User.findById(reel.user_id);
    const isFollowing = user.followers.includes(user_id);
    const postdata = {
      likes_check: false,
      comment: reel.comments.length,
      likes: reel.likes.length,
      following: isFollowing,
    };

    if (postdata.likes === 0) {
      let notification = await Notification.deleteOne({
        type: "like_reel",
        post: reel_id,
      });
    } else {
      let body;
      if (postdata.likes == 1) {
        body = `liked your reel`;
      } else {
        body = `and ${postdata.likes - 1} other liked your reel`;
      }
      const lastliked = reel.likes[reel.likes.length - 1];

      const sender = await User.findById(lastliked).select(
        "username type first_name last_name avatar"
      );
      const senderdata = {
        sender: lastliked,
        username: sender.username,
        type: sender.type,
        first_name: sender.first_name,
        last_name: sender.last_name,
        avatar: sender.avatar,
      };

      let notification = await Notification.updateOne(
        { type: "like_reel", post: reel_id },
        { $set: { senderdata: senderdata, body: body, sender: lastliked } }
      );
    }

    return res.json({
      Success: 1,
      message: "Post unliked successfully",
      postdata: postdata,
    });
  } catch (error) {
    console.error("Error unliking post:", error);
    return res.json({ Success: 0, message: "Error unliking post" });
  }
};

const likes_list = async (req, res) => {
  const { post_id, user_id } = req.body;

  try {
    if (!post_id || post_id === "") {
      return res
        .status(500)
        .json({ success: 0, message: "post_id id not found" });
    }
    if (!user_id || user_id === "") {
      return res
        .status(500)
        .json({ success: 0, message: "user_id id not found" });
    }
    const posts = await post.findById(post_id);
    if (!posts) {
      return res.status(404).json({ error: "Post not found" });
    }

    const likes_id = posts.likes;
    const likes_users = await User.find(
      { _id: { $in: likes_id } },
      { password: 0 }
    );

    // Fetch the user to check if they are following each user in the likes array
    const user = await User.findById(user_id);

    // Add isFollowing property to each liked user
    const likedUsersWithFollowingStatus = likes_users.map((likedUser) => {
      return {
        ...likedUser.toObject(),
        isFollowing: user.following.includes(likedUser._id.toString()),
        items: likedUser.items[0],
      };
    });

    return res.json({
      Success: 1,
      message: "Success",
      likes: likedUsersWithFollowingStatus,
    });
  } catch (error) {
    console.error("Error fetching liked users:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
const repost_list = async (req, res) => {
  try {
    const { post_id } = req.body;
    const postData = await post.findById(post_id);

    if (!postData) {
      return res.status(404).json({ error: "Post not found" });
    }

    const { user_id: _id, repost: repost_id } = postData;
    const main_user_data = await User.findById(_id, { password: 0 }).lean();

    if (!main_user_data) {
      return res.status(404).json({ error: "Post user not found or deleted" });
    }

    if (
      Array.isArray(main_user_data.items) &&
      main_user_data.items.length > 0
    ) {
      main_user_data.items = main_user_data.items[0];
    }

    const repost = await User.find(
      { _id: { $in: repost_id } },
      { password: 0 }
    ).lean();

    repost.forEach((user) => {
      if (Array.isArray(user.items) && user.items.length > 0) {
        user.items = user.items[0];
      }
    });

    return res.json({
      Success: 1,
      message: "Success",
      main_user: [main_user_data],
      repost,
    });
  } catch (error) {
    console.error("Error fetching reposted users:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const tag_list = async (req, res) => {
  const { post_id } = req.body;
  try {
    if (!post_id || post_id === "") {
      return res
        .status(500)
        .json({ success: 0, message: "post_id id not found" });
    }

    const posts = await post.findById(post_id).populate({
      path: "tags",
      select: "username first_name last_name name avatar isverified type ",
    });
    if (!posts) {
      return res.status(404).json({ error: "Post not found" });
    }
    const mergedPosts = [];
    const mergedPost = {
      postId: posts._id,
      user_id: posts.user_id,
      tags: posts.tags,
    };
    mergedPosts.push(mergedPost);
    // const main_user = await User.find({ _id: { $in: post_user } }, { password: 0 });
    // const likes_users = await User.find({ _id: { $in: repost_id } }, { password: 0 });

    return res.json({ Success: 1, message: "Success", tagged: mergedPosts });
  } catch (error) {
    console.error("Error fetching liked users:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const comment = async (req, res) => {
  const { postId, user_id: userId, text } = req.body;
  try {
    if (!postId || postId === "") {
      return res
        .status(500)
        .json({ success: 0, message: "postId id not found" });
    }
    if (!userId || userId === "") {
      return res
        .status(500)
        .json({ success: 0, message: "userId id not found" });
    }
    const postData = await post.findById(postId);
    const title = "Comment Post";

    if (!postData) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (userId === "guest_user") {
      return res.json({ message: "guest_user" });
    }

    const newComment = {
      text,
      user_id: userId,
      createdAt: new Date(),
    };

    const userInfo = await User.findById(userId);
    if (!userInfo) {
      return res.json({ Success: 0, message: "User doesn't exist" });
    }

    postData.comments.push(newComment);
    await postData.save();

    const formattedCommentDate = formatDateTime(newComment.createdAt);

    if (postData.user_id === userId) {
      return res.json({
        Success: 1,
        message: "Comment added successfully",
        comment: { ...newComment, formattedCreatedAt: formattedCommentDate },
      });
    }

    const ownerData = await User.findById(postData.user_id);
    const uniqueCommentersCount = new Set(
      postData.comments.map((comment) => comment.user_id)
    ).size;
    const body =
      uniqueCommentersCount === 1
        ? "commented on your post"
        : `and ${uniqueCommentersCount - 1} others commented on your post`;

    const senderData = {
      sender: userId,
      username: userInfo.username,
      type: userInfo.type,
      first_name: userInfo.first_name,
      last_name: userInfo.last_name,
      avatar: userInfo.avatar,
    };
    if (ownerData?.fcmTokenList) {
      const filteredTokenList = ownerData.fcmTokenList.filter(
        (token) => token != null
      );

      sendNotification(
        title,
        `${userInfo.first_name} ${body}`,
        filteredTokenList,
        "comment",
        postId
      );
    }
    sendInAppNotification(
      body,
      userId,
      postData.user_id,
      "comment",
      senderData,
      postId,
      postData.image,
      postData.text,
      null
    );

    return res.json({
      Success: 1,
      message: "Comment added successfully",
      comment: { ...newComment, formattedCreatedAt: formattedCommentDate },
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    return res.json({
      Success: 0,
      message: "Error adding comment",
    });
  }
};

const comment_reel = async (req, res) => {
  try {
    const { reel_id: postId, user_id: userId, text } = req.body;
    const reel = await Reel.findById(postId);
    const title = "Comment Reel";

    if (!reel) {
      return res.status(404).json({ message: "Reel not found" });
    }

    if (userId === "guest_user") {
      return res.json({ message: "guest_user" });
    }

    const userInfo = await User.findById(userId);
    if (!userInfo) {
      return res.json({ Success: 0, message: "User doesn't exist" });
    }

    const newComment = {
      text,
      user_id: userId,
      createdAt: new Date(),
    };

    reel.comments.push(newComment);
    await reel.save();

    const formattedCommentDate = formatDateTime(newComment.createdAt);

    const uniqueCommentersCount = new Set(
      reel.comments.map((comment) => comment.user_id)
    ).size;
    const body =
      uniqueCommentersCount === 1
        ? "commented on your reel"
        : `and ${uniqueCommentersCount - 1} others commented on your reel`;

    const senderData = {
      sender: userId,
      username: userInfo.username,
      type: userInfo.type,
      first_name: userInfo.first_name,
      last_name: userInfo.last_name,
      avatar: userInfo.avatar,
    };
    const ownerData = await User.findById(reel.user_id);
    if (ownerData?.fcmTokenList) {
      const filteredTokenList = ownerData.fcmTokenList.filter(
        (token) => token != null
      );

      sendNotification(
        title,
        `${userInfo.first_name} ${body}`,
        filteredTokenList,
        "comment_reel",
        postId
      );
    }
    sendInAppNotification(
      body,
      userId,
      reel.user_id,
      "comment_reel",
      senderData,
      postId,
      null,
      null,
      reel.video
    );

    return res.json({
      Success: 1,
      message: "Comment added successfully",
      comment: { ...newComment, formattedCreatedAt: formattedCommentDate },
    });
  } catch (error) {
    console.error("Error adding comment to reel:", error);
    return res.json({
      Success: 0,
      message: "Error adding comment to reel",
    });
  }
};

const follow = async (req, res) => {
  try {
    const { user_follow_id: userToFollowId, user_id: currentUserId } = req.body;
    const title = "Follow user";

    const [currentUser, userToFollow] = await Promise.all([
      User.findById(currentUserId),
      User.findById(userToFollowId),
    ]);

    if (!currentUser || !userToFollow) {
      return res.json({ Success: 0, message: "User not found" });
    }

    if (currentUser.following.includes(userToFollow._id)) {
      return res.json({
        Success: 0,
        message: "User is already being followed",
      });
    }

    currentUser.following.push(userToFollow._id);
    userToFollow.followers.push(currentUser._id);
    await Promise.all([currentUser.save(), userToFollow.save()]);

    const userInfo = await User.findById(currentUserId);
    if (!userInfo) {
      return res.json({ Success: 0, message: "User doesn't exist" });
    }

    const body = "started following you";
    const senderData = {
      sender: currentUserId,
      username: userInfo.username,
      type: userInfo.type,
      first_name: userInfo.first_name,
      last_name: userInfo.last_name,
      avatar: userInfo.avatar,
    };
    const ownerData = await User.findById(userToFollowId);
    if (ownerData?.fcmTokenList) {
      const filteredTokenList = ownerData.fcmTokenList.filter(
        (token) => token != null
      );

      sendNotification(
        title,
        `${userInfo.first_name} ${body}`,
        filteredTokenList,
        "follow"
      );

      return res.json({ Success: 1, message: "User followed successfully" });
    }
    sendInAppNotification(
      body,
      currentUserId,
      userToFollowId,
      "follow",
      senderData,
      null,
      null,
      null,
      null
    );
  } catch (error) {
    console.error("Error following user:", error);
    return res.json({ Success: 0, message: "Something went wrong" });
  }
};

const following = async (req, res) => {
  const { user_id, main_user } = req.body;
  try {
    if (!user_id || user_id === "") {
      return res
        .status(500)
        .json({ success: 0, message: "user_id id not found" });
    }
    if (!main_user || main_user === "") {
      return res
        .status(500)
        .json({ success: 0, message: "main_user id not found" });
    }
    const user = await User.findOne({ _id: user_id }, { password: 0 });
    const user_main = await User.findOne({ _id: main_user }, { password: 0 });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (!user_main) {
      return res.status(404).json({ error: "User not found" });
    }
    const followingIds = user.following;
    const blockedUsersData = await BlockedUser.findOne({ blockedBy: user_id });
    const blockedContent = blockedUsersData ? blockedUsersData.blockedUser : [];

    const followingUsers = await User.find(
      {
        $and: [
          { _id: { $in: followingIds } },
          { _id: { $nin: blockedContent } }, // Exclude blocked users
        ],
      },
      { password: 0 }
    );
    // Check if the user_id is present in the followers list for each user
    const enrichedFollowingUsers = followingUsers.map(
      ({
        _id,
        avatar,
        designation,
        first_name,
        last_name,
        username,
        name,
        items,
        isverified,
        type,
        followers,
      }) => {
        return {
          _id,
          avatar,
          designation,
          first_name,
          last_name,
          name,
          username,
          items: items[0],
          isverified,
          type,
          isFollowing: followers.includes(main_user),
        };
      }
    );

    return res.json({
      Success: 1,
      message: "Success",
      following: enrichedFollowingUsers,
    });
  } catch (error) {
    console.error("Error fetching following users:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const followers = async (req, res) => {
  const { user_id, main_user } = req.body;
  try {
    if (!user_id || user_id === "") {
      return res
        .status(500)
        .json({ success: 0, message: "user_id id not found" });
    }
    if (!main_user || main_user === "") {
      return res
        .status(500)
        .json({ success: 0, message: "main_user id not found" });
    }
    const user = await User.findOne({ _id: user_id }, { password: 0 });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const followersIds = user.followers;
    const blockedUsersData = await BlockedUser.findOne({ blockedBy: user_id });
    const blockedContent = blockedUsersData ? blockedUsersData.blockedUser : [];
    // Find users based on the array of following IDs
    // const followersUsers = await User.find({ _id: { $in: followersIds } }, { password: 0 });

    const followersUsers = await User.find(
      {
        $and: [
          { _id: { $in: followersIds } },
          { _id: { $nin: blockedContent } }, // Exclude blocked users
        ],
      },
      { password: 0 }
    );

    const followersWithStatus = followersUsers.map(
      ({
        _id,
        avatar,
        designation,
        first_name,
        last_name,
        username,
        name,
        items,
        isverified,
        type,
        followers,
      }) => {
        return {
          _id,
          avatar,
          designation,
          first_name,
          last_name,
          username,
          name,
          items: items[0],
          isverified,
          type,
          isFollowing: followers.includes(main_user),
        };
      }
    );
    return res.json({
      Success: 1,
      message: "Success",
      followers: followersWithStatus,
    });
  } catch (error) {
    console.error("Error fetching followers users:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const unfollow = async (req, res) => {
  const currentUserId = req.body.user_id;
  const userToUnfollowId = req.body.userToUnfollowId;
  try {
    if (!currentUserId || currentUserId === "") {
      return res
        .status(500)
        .json({ success: 0, message: "currentUserId id not found" });
    }
    if (!userToUnfollowId || userToUnfollowId === "") {
      return res
        .status(500)
        .json({ success: 0, message: "userToUnfollowId id not found" });
    }
    const currentUser = await User.findById(currentUserId);
    const userToUnfollow = await User.findById(userToUnfollowId);

    if (!currentUser || !userToUnfollow) {
      return res.json({ Success: 0, message: "User not found" });
    }

    if (!currentUser.following.includes(userToUnfollow._id)) {
      return res.json({ Success: 0, message: "User is not being followed" });
    }

    // Remove userToUnfollow from currentUser's following list
    currentUser.following = currentUser.following.filter(
      (userId) => userId.toString() !== userToUnfollow._id.toString()
    );

    // Remove currentUser from userToUnfollow's followers list
    userToUnfollow.followers = userToUnfollow.followers.filter(
      (userId) => userId.toString() !== currentUser._id.toString()
    );
    await currentUser.save();
    await userToUnfollow.save();
    await Notification.deleteMany({
      sender: currentUserId,
      recipient: userToUnfollowId,
      type: "follow",
    });
    return res.json({ Success: 1, message: "User unfollowed successfully" });
  } catch (error) {
    console.error("Error unfollowing user:", error);
    return res.json({ Success: 0, message: "Error unfollowing user" });
  }
};

const images = async (req, res) => {
  try {
    const { user_id, text, tags, hashtags, commentSettings } = req.body;
    const files = req.files;

    // Check if both text and images are empty
    if (!text && (!files || files.length === 0)) {
      return res.status(400).json({
        success: 0,
        message: "Either 'text' or 'image' should be provided",
      });
    }

    let imagesArray = [];

    // Check if image files are provided
    if (files && files.length > 0) {
      await Promise.all(
        files.map(async (file) => {
          if (file.fieldname !== "images") {
            throw new Error("Invalid file");
          }
          const imageUrl = await processAndUploadImage(file, "posts", 800, 100);
          imagesArray.push(imageUrl);
          const filePath = `${path.join(__dirname, "../upload/images")}/${
            file.filename
          }`;

          // Delete file from local
          fs.unlinkSync(filePath);
        })
      );
    }

    const newPost = new post({
      user_id,
      text,
      image: imagesArray,
      tags,
      hashtags,
      commentSettings,
    });

    await newPost.save();
    res.json({
      success: 1,
      newPost: newPost,
    });
  } catch (error) {
    console.error("Error creating post:", error);
    if (error.message === "Invalid file") {
      return res.status(400).json({ success: 0, message: "Invalid file" });
    }
    return res.status(500).json({ success: 0, message: "Server error" });
  }
};

const videos = async (req, res) => {
  const { user_id, text, tags, hashtags } = req.body;
  try {
    if (!req.file || req.file.fieldname !== "video") {
      return res.status(400).json({ success: 0, message: "Invalid file" });
    }

    const filePath = path.join(
      __dirname,
      "../upload/videos",
      req.file.filename
    );
    const key = `socio_reels/${req.file.filename}`;
    const video = `${s3Url}/${key}`;

    const fileBuffer = fs.readFileSync(filePath);
    const params = {
      Bucket: bucketName,
      Key: key,
      Body: fileBuffer,
      ACL: "public-read",
      ContentType: "video/mp4",
    };

    try {
      await s3Client.send(new PutObjectCommand(params));
      console.log("File uploaded successfully");

      fs.unlinkSync(filePath);

      const newPost = new Reel({
        user_id,
        text,
        video,
        tags,
        hashtags,
      });

      await newPost.save();

      const { likes, views, ...cleanedPost } = newPost.toObject();
      return res.json({
        success: 1,
        newPost: cleanedPost,
      });
    } catch (uploadError) {
      console.error("Error uploading to S3:", uploadError);
      return res
        .status(500)
        .json({ success: 0, message: "Error uploading to S3" });
    }
  } catch (error) {
    console.error("Error creating post:", error);
    return res.status(500).json({ success: 0, message: "Server error" });
  }
};

const fetchReels = async (req, res) => {
  const userId = req.body.user_id;
  try {
    if (!userId || userId === "") {
      return res
        .status(500)
        .json({ success: 0, message: "userId id not found" });
    }
    const { page = 1, limit = 100 } = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const reels = await Reel.aggregate([
      { $sample: { size: limitNumber } },
      { $skip: skip },
    ]);

    const userIds = reels.map((reel) => reel.user_id);

    const users = await User.find({ _id: { $in: userIds } }, { password: 0 });

    const saveDocument = await Save.findOne({ userId });
    const blockedPostIds = (await User.findById(userId)).blockedContentReel;

    const combinedData = await Promise.all(
      reels.map(async (reel) => {
        const user = users.find(
          (u) => u._id.toString() === reel.user_id.toString()
        );
        if (!user) {
          console.log("reel ------- :\n", reel);
          return null;
        }
        if (blockedPostIds.includes(reel._id.toString())) {
          return null; // Skip blocked posts
        }
        const issaved = saveDocument
          ? saveDocument.reel_ids.includes(reel._id)
          : false;
        const likes_check = reel.likes.includes(userId);
        const follow_check = user.followers.includes(userId);
        const likes_count = reel.likes.length;
        const comment_count = reel.comments.length;
        const viewCount = reel.views ? reel.views.length : 0;
        const _id = reel.user_id;
        const connectionStatus = await getConnectionStatus(userId, _id);
        return {
          ...reel,
          isconnected: connectionStatus,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          name: user.name,
          avatar: user.avatar,
          type: user.type,
          isverified: user.isverified,
          items: user.items,
          likes_check,
          follow_check,
          likes_count,
          comment_count,
          issaved,
          viewCount,
        };
      })
    );

    return res.json({
      success: 1,
      message: "Reels fetched successfully",
      reelsWithUsers: combinedData.filter(Boolean), // Filter out null values
    });
  } catch (error) {
    console.error("Error fetching reels:", error);
    return res.status(500).json({ success: 0, message: "Server error" });
  }
};

const views = async (req, res) => {
  const { postId, user_id } = req.body;
  try {
    if (!postId) {
      return res.status(500).json({ success: 0, message: "Post ID not found" });
    }

    // Fetch the post by ID
    const post_data = await post.findById(postId);
    if (!post_data) {
      return res.status(404).json({ success: 0, message: "Post not found" });
    }
    const { _id, createdAt, views, likes, repost, comments } = post_data;

    const response = {
      _id,
      user_id: post_data.user_id,
      createdAt,
      views: views.length,
      likes: likes.length,
      repost_count: repost.length,
      comments: comments.length,
    };

    if (post_data.views.includes(user_id)) {
      return res.json(response);
    }

    // Increment the views
    post_data.views.push(user_id);
    await post_data.save();

    response.views = post_data.views.length;

    return res.json(response);
  } catch (error) {
    console.error("Error fetching post:", error);
    return res.status(500).json({ success: 0, message: "Error fetching post" });
  }
};

const reel_views = async (req, res) => {
  const { reelId, user_id } = req.body;
  try {
    if (!reelId || reelId === "") {
      return res
        .status(500)
        .json({ success: 0, message: "reelId id not found" });
    }
    if (!user_id || user_id === "") {
      return res
        .status(500)
        .json({ success: 0, message: "user_id id not found" });
    }
    // Fetch the reel by ID
    const reel = await Reel.findById(reelId);
    if (!reel) {
      return res.status(404).json({ success: 0, message: "Reel not found" });
    }
    const { _id, createdAt, views, likes, repost, comments } = reel;

    const response = {
      _id,
      user_id: reel.user_id,
      createdAt,
      views: views.length,
      likes: likes.length,
      repost_count: repost.length,
      comments: comments.length,
    };

    if (reel.views.includes(user_id)) {
      return res.json(response);
    }

    // Increment the views
    reel.views.push(user_id);
    await reel.save();

    response.views = reel.views.length;

    // Send the response
    return res.json(response);
  } catch (error) {
    console.error("Error fetching reel:", error);
    return res.status(500).json({ success: 0, message: "Error fetching reel" });
  }
};

const savePost = async (req, res) => {
  const { user_id, post_id } = req.body;
  try {
    if (!post_id || post_id === "") {
      return res.status(500).json({ success: 0, message: "post id not found" });
    }
    if (!user_id || user_id === "") {
      return res.status(500).json({ success: 0, message: "user id not found" });
    }
    // Check if the user_id already exists in the Save collection
    let saveDocument = await Save.findOne({ user_id });

    // If the user_id doesn't exist, create a new Save document
    if (!saveDocument) {
      saveDocument = new Save({
        user_id,
        post_ids: [],
      });
    }

    // Check if the post_id already exists in the post_ids array
    if (!saveDocument.post_ids.includes(post_id)) {
      saveDocument.post_ids.push(post_id);
      await saveDocument.save();

      // Optionally, you can fetch the details of the saved post from the post collection
      const savedPostDetails = await post.findById(post_id);

      return res.json({
        success: 1,
        message: "Post saved successfully",
        savedPost: savedPostDetails,
      });
    } else {
      return res.json({
        success: 1,
        message: "Post already saved",
      });
    }
  } catch (error) {
    console.error("Error saving post:", error);
    return res.status(500).json({ success: 0, message: "Server error" });
  }
};

const unsavePost = async (req, res) => {
  const { user_id, post_id } = req.body;
  try {
    if (!post_id || post_id === "") {
      return res.status(500).json({ success: 0, message: "post id not found" });
    }
    if (!user_id || user_id === "") {
      return res.status(500).json({ success: 0, message: "user id not found" });
    }

    // Find the Save document for the given user_id
    const saveDocument = await Save.findOne({ user_id });

    // If the Save document doesn't exist, return an error
    if (!saveDocument) {
      return res.json({ success: 0, message: "Save document not found" });
    }

    // Check if the post_id exists in the post_ids array
    const index = saveDocument.post_ids.indexOf(post_id);
    if (index !== -1) {
      // Remove the post_id from the post_ids array
      saveDocument.post_ids.splice(index, 1);
      await saveDocument.save();

      return res.json({
        success: 1,
        message: "Post unsaved successfully",
      });
    } else {
      return res.json({
        success: 1,
        message: "Post not found in saved posts",
      });
    }
  } catch (error) {
    console.error("Error unsaving post:", error);
    return res.status(500).json({ success: 0, message: "Server error" });
  }
};

const fetchSavedPosts = async (req, res) => {
  const { user_id } = req.body;
  try {
    if (!user_id || user_id === "") {
      return res.status(500).json({ success: 0, message: "user id not found" });
    }
    // Fetch the Save document for the given user_id
    const saveDocument = await Save.findOne({ user_id }).sort({
      createdAt: -1,
    });

    if (!saveDocument) {
      return res.json({
        success: 1,
        message: "No saved posts found for the user",
      });
    }

    // Fetch the details of the saved posts from the post collection
    const savedPostsDetails = await post.find({
      _id: { $in: saveDocument.post_ids },
    });

    // Fetch the user details for each saved post
    const savedPosts = [];

    for (const posts of savedPostsDetails) {
      const user = await User.findOne({ _id: posts.user_id });

      if (user) {
        const likes_check = posts.likes.includes(user_id);
        const likes_count = posts.likes.length;
        const comment_count = posts.comments.length;
        const _id = posts.user_id;
        const isconnected = await getConnectionStatus(user_id, _id);
        const follow_check = user.followers.includes(user_id);
        const saved = saveDocument.post_ids.includes(posts._id);
        const repost_count = posts.repost.length;
        const flattenedPost = {
          // ...post.toObject(),
          _id: posts._id,
          createdAt: posts.createdAt,
          image: posts.image,
          text: posts.text,
          user_id: posts.user_id,
          views: posts.views.length,
          user: {
            _id: user._id,
            avatar: user.avatar,
            first_name: user.first_name,
            last_name: user.last_name,
            items: user.items[0],
            username: user.username,
            name: user.name,
            type: user.type,
            isverified: user.isverified,
          },
          likes_check,
          follow_check,
          likes_count,
          comment_count,
          isconnected,
          saved,
          repost_count,
        };

        savedPosts.push(flattenedPost);
      }
    }

    // Now, send the response with the flattened data
    return res.json({
      success: 1,
      message: "Saved posts fetched successfully",
      savedPosts,
    });
  } catch (error) {
    console.error("Error fetching saved posts:", error);
    return res.status(500).json({ success: 0, message: "Server error" });
  }
};

const saveReel = async (req, res) => {
  const { user_id, reel_id } = req.body;
  try {
    if (!reel_id || reel_id === "") {
      return res.status(500).json({ success: 0, message: "reel id not found" });
    }
    if (!user_id || user_id === "") {
      return res.status(500).json({ success: 0, message: "user id not found" });
    }
    // Check if the user_id already exists in the Save collection
    let saveDocument = await Save.findOne({ user_id });

    // If the user_id doesn't exist, create a new Save document
    if (!saveDocument) {
      saveDocument = new Save({
        user_id,
        reel_ids: [],
      });
    }

    // Check if the post_id already exists in the post_ids array
    if (!saveDocument.reel_ids.includes(reel_id)) {
      saveDocument.reel_ids.push(reel_id);
      await saveDocument.save();

      // Optionally, you can fetch the details of the saved post from the post collection
      const savedPostDetails = await Reel.findById(reel_id);

      return res.json({
        success: 1,
        message: "reel saved successfully",
        savedPost: savedPostDetails,
      });
    } else {
      return res.json({
        success: 1,
        message: "Post already saved",
      });
    }
  } catch (error) {
    console.error("Error saving post:", error);
    return res.status(500).json({ success: 0, message: "Server error" });
  }
};

const unsaveReel = async (req, res) => {
  const { user_id, reel_id } = req.body;
  try {
    if (!reel_id || reel_id === "") {
      return res.status(500).json({ success: 0, message: "reel id not found" });
    }
    if (!user_id || user_id === "") {
      return res.status(500).json({ success: 0, message: "user id not found" });
    }
    // Find the Save document for the given user_id
    const saveDocument = await Save.findOne({ user_id });

    // If the Save document doesn't exist, return an error
    if (!saveDocument) {
      return res.json({ success: 0, message: "Save document not found" });
    }

    // Check if the post_id exists in the post_ids array
    const index = saveDocument.reel_ids.indexOf(reel_id);
    if (index !== -1) {
      // Remove the post_id from the post_ids array
      saveDocument.reel_ids.splice(index, 1);
      await saveDocument.save();

      return res.json({
        success: 1,
        message: "Reel unsaved successfully",
      });
    } else {
      return res.json({
        success: 1,
        message: "Reel not found in saved posts",
      });
    }
  } catch (error) {
    console.error("Error unsaving Reel:", error);
    return res.status(500).json({ success: 0, message: "Server error" });
  }
};

const fetchSavedReels = async (req, res) => {
  const { user_id } = req.body;
  try {
    if (!user_id || user_id === "") {
      return res.status(500).json({ success: 0, message: "user id not found" });
    }
    const saveDocument = await Save.findOne({ user_id });

    if (!saveDocument) {
      return res.json({
        success: 1,
        message: "No saved posts found for the user",
      });
    }

    // Fetch the details of the saved posts from the post collection
    const savedPostsDetails = await Reel.find({
      _id: { $in: saveDocument.reel_ids },
    });

    // Fetch the user details for each saved post
    const savedPosts = [];

    for (const reel of savedPostsDetails) {
      const user = await User.findOne({ _id: reel.user_id });

      if (user) {
        const likes_check = reel.likes.includes(user_id);
        const likes_count = reel.likes.length;
        const comment_count = reel.comments.length;
        const follow_check = user.followers.includes(user_id);
        const saved = saveDocument.reel_ids.includes(reel._id);
        const _id = reel.user_id;
        const isconnected = await getConnectionStatus(user_id, _id);
        const flattenedPost = {
          ...reel.toObject(),
          user: {
            _id: user._id,
            avatar: user.avatar,
            first_name: user.first_name,
            last_name: user.last_name,
            items: user.items[0],
            username: user.username,
            name: user.name,
            type: user.type,
            isverified: user.isverified,
          },
          likes_check,
          follow_check,
          likes_count,
          isconnected,
          comment_count,
          saved,
        };

        savedPosts.push(flattenedPost);
      }
    }

    return res.json({
      success: 1,
      message: "Saved posts fetched successfully",
      savedPosts,
    });
  } catch (error) {
    console.error("Error fetching saved posts:", error);
    return res.status(500).json({ success: 0, message: "Server error" });
  }
};

const repostController = async (req, res) => {
  const { userId, postId } = req.body;
  try {
    if (!userId || userId === "") {
      return res.json({ success: 0, message: "user id not found" });
    }

    if (!postId || postId === "") {
      return res.status(500).json({ success: 0, message: "post id not found" });
    }

    const userInfo = await User.findById(userId);
    if (!userInfo) {
      return res.json({ Success: 0, message: "User doesn't exist" });
    }

    const postData = await post.findById(postId);
    if (!postData) {
      return res.json({ Success: 0, message: "Post doesn't exist" });
    }

    const ownerData = await User.findById(postData.user_id);
    if (!ownerData) {
      return res.json({ Success: 0, message: "Owner not found" });
    }

    let repostData = await Repost.findOne({ user_id: userId });
    if (!repostData) {
      repostData = new Repost({
        user_id: userId,
        repost_ids: [],
      });
    }

    if (!repostData.repost_ids.includes(postId)) {
      repostData.repost_ids.push(postId);
      await repostData.save();

      await post.findByIdAndUpdate(
        postId,
        { $push: { repost: userId } },
        { new: true }
      );

      const body =
        postData.repost.length === 0
          ? `reposted your post`
          : `and ${postData.repost.length} other reposted your post`;

      const senderData = {
        sender: userId,
        username: userInfo.username,
        type: userInfo.type,
        first_name: userInfo.first_name,
        last_name: userInfo.last_name,
        avatar: userInfo.avatar,
      };

      if (ownerData?.fcmTokenList) {
        const filteredTokenList = ownerData.fcmTokenList.filter(
          (token) => token != null
        );
        const title = "Repost Post";

        sendNotification(
          title,
          `${userInfo.first_name} ${body}`,
          filteredTokenList,
          "repost",
          postId
        );
      }
      sendInAppNotification(
        body,
        userId,
        postData.user_id,
        "repost",
        senderData,
        postId,
        postData.image,
        postData.text,
        null
      );

      return res.json({ success: 1, message: "Post reposted successfully" });
    } else {
      return res.json({
        success: 0,
        message: "Post already reposted by the user",
      });
    }
  } catch (error) {
    console.error("Error reposting the post:", error);
    return res.status(500).json({ success: 0, message: "Server error" });
  }
};

const fetchAllReposts = async (req, res) => {
  try {
    const { userId, main_user } = req.body;

    if (!userId || !main_user) {
      return res.status(400).json({
        success: 0,
        message: "userId and main_user are required",
      });
    }

    // Fetch repost data for the user
    const [repostData, repostDatas] = await Promise.all([
      Repost.findOne({ user_id: userId }),
      Repost.findOne({ user_id: main_user }),
    ]);

    if (!repostData) {
      return res.json({
        success: 1,
        message: "No reposted posts found for the user",
      });
    }

    // Fetch user data for all reposted posts
    const data = await Promise.all(
      repostData.repost_ids.map(async (postId) => {
        const postData = await post.findById(postId);
        if (!postData) return null; // Skip if post doesn't exist

        const {
          user_id,
          text,
          image,
          likes,
          repost,
          comments,
          createdAt,
          _id: post_id,
        } = postData;

        const userData = await User.findById(user_id);
        if (!userData) return null; // Skip if user doesn't exist

        const {
          _id: userId,
          first_name,
          last_name,
          username,
          avatar,
          items,
          following,
          isverified,
          type,
          name,
        } = userData;

        const repost_check = repostDatas
          ? repostDatas.repost_ids.includes(postId)
          : false;
        const likes_check = likes.includes(userId);
        const follow_check = following.includes(user_id);
        const save = await Save.findOne({ user_id: userId });
        const saved = save ? save.post_ids.includes(postId) : false;

        return {
          post_id,
          user_id,
          text,
          image,
          likes_count: likes.length,
          repost_count: repost.length,
          views: 0,
          comment_count: comments.length,
          createdAt,
          _id: userId,
          first_name,
          last_name,
          username,
          name,
          avatar,
          items: items[0],
          repost_check,
          likes_check,
          follow_check,
          saved,
          isverified,
          type,
        };
      })
    );

    // Filter out null values (posts that don't exist)
    const filteredData = data.filter((post) => post !== null);

    return res.json({
      success: 1,
      message: "Reposted posts fetched successfully",
      data: filteredData,
    });
  } catch (error) {
    console.error("Error fetching reposts:", error);
    return res.status(500).json({ success: 0, message: "Server error" });
  }
};

const sendConnectionRequest = async (req, res) => {
  const { sender_id, receiver_id } = req.body;
  try {
    if (!sender_id || sender_id === "") {
      return res
        .status(500)
        .json({ success: 0, message: "sender_id id not found" });
    }
    if (!receiver_id || receiver_id === "") {
      return res
        .status(500)
        .json({ success: 0, message: "receiver_id id not found" });
    }
    if (sender_id === receiver_id) {
      return res.json({
        success: 0,
        message: "Cannot send a connection request to yourself",
      });
    }

    const [userInfo, ownerData, existingRequest] = await Promise.all([
      User.findById(sender_id),
      User.findById(receiver_id),
      ConnectionRequest.findOne({ sender_id, receiver_id }),
    ]);

    if (!userInfo) {
      return res.json({ Success: 0, message: "User doesn't exist" });
    }

    if (!ownerData) {
      return res.json({ success: 0, message: "Receiver user doesn't exist" });
    }
    const title = "Send Request";
    let body = "sent you a connection request";

    const senderdata = {
      sender: sender_id,
      username: userInfo.username,
      type: userInfo.type,
      first_name: userInfo.first_name,
      last_name: userInfo.last_name,
      avatar: userInfo.avatar,
    };

    // Check if there is an existing request

    if (existingRequest) {
      // If the existing request is rejected, update the status to 'pending'

      if (existingRequest.status === "accepted") {
        return res.json({
          success: 0,
          message: "Connection request already accepted",
        });
      }

      if (existingRequest.status === "pending") {
        return res.json({
          success: 0,
          message: "Connection request already sent",
        });
      }
      if (existingRequest.status === "rejected") {
        existingRequest.status = "pending";
        await existingRequest.save();
        const request_ID = existingRequest._id;
        sendInAppNotification(
          body,
          sender_id,
          receiver_id,
          "connection_request",
          senderdata,
          null,
          null,
          null,
          null,
          request_ID
        );
        if (ownerData?.fcmTokenList) {
          const filteredTokenList = ownerData.fcmTokenList.filter(
            (token) => token != null
          );
          sendNotification(
            title,
            `${userInfo?.first_name} ${body}`,
            filteredTokenList,
            "connection_request"
          );
        }
        return res.json({
          success: 1,
          message: "Connection request sent successfully",
        });
      }

      // If the existing request is accepted, cannot send request again
    }

    // If no existing request, create a new one with status 'pending'
    const newRequest = new ConnectionRequest({
      sender_id,
      receiver_id,
      status: "pending",
    });

    await newRequest.save();
    const request_ID = newRequest._id;

    sendInAppNotification(
      body,
      sender_id,
      receiver_id,
      "connection_request",
      senderdata,
      null,
      null,
      null,
      null,
      request_ID
    );
    if (ownerData?.fcmTokenList) {
      const filteredTokenList = ownerData.fcmTokenList.filter(
        (token) => token != null
      );
      sendNotification(
        title,
        `${userInfo?.first_name} ${body}`,
        filteredTokenList,
        "connection_request"
      );
    }

    return res.json({
      success: 1,
      message: "Connection request sent successfully",
    });
  } catch (error) {
    console.error("Error sending connection request:", error);
    return res.status(500).json({ success: 0, message: "Server error" });
  }
};

const handleConnectionRequest = async (req, res) => {
  const { request_id, action } = req.body;
  try {
    if (!request_id || request_id === "") {
      return res
        .status(500)
        .json({ success: 0, message: "user_id id not found" });
    }
    const connectionRequest = await ConnectionRequest.findById(request_id);
    if (!connectionRequest) {
      return res.json({ success: 0, message: "Connection request not found" });
    }

    const userInfo = await User.findById(connectionRequest.receiver_id);
    if (!userInfo) {
      return res.json({ Success: 0, message: "User doesn't exist" });
    }

    const ownerData = await User.findById(connectionRequest.sender_id);
    if (!ownerData) {
      return res.json({ Success: 0, message: "Owner not found" });
    }

    connectionRequest.status = action === "accept" ? "accepted" : "rejected";
    await connectionRequest.save();

    if (action === "accept") {
      const body = "has accepted request";
      const senderData = {
        sender: connectionRequest.receiver_id,
        username: userInfo.username,
        type: userInfo.type,
        first_name: userInfo.first_name,
        last_name: userInfo.last_name,
        avatar: userInfo.avatar,
      };

      if (ownerData?.fcmTokenList) {
        const filteredTokenList = ownerData.fcmTokenList.filter(
          (token) => token != null
        );
        const title = "Accepted Request";

        sendNotification(
          title,
          `${userInfo.first_name} ${body}`,
          filteredTokenList,
          "connection_accept"
        );
      }
      sendInAppNotification(
        body,
        connectionRequest.receiver_id,
        connectionRequest.sender_id,
        "connection_accept",
        senderData,
        null,
        null,
        null,
        null
      );
    }

    await Notification.deleteMany({
      sender: connectionRequest.sender_id,
      recipient: connectionRequest.receiver_id,
      type: "connection_request",
    });

    return res.json({
      success: 1,
      message: `Connection request ${
        action === "accept" ? "accepted" : "rejected"
      }`,
    });
  } catch (error) {
    console.error("Error handling connection request:", error);
    return res.status(500).json({ success: 0, message: "Server error" });
  }
};

const fetchAllConnectionRequests = async (req, res) => {
  try {
    const { user_id } = req.body;

    // Logic to check if the user_id is valid
    if (!user_id || user_id === "") {
      return res
        .status(500)
        .json({ success: 0, message: "user_id id not found" });
    }
    // Fetch all connection requests (both pending and accepted) for the user
    const allConnectionRequests = await ConnectionRequest.find({
      $or: [{ receiver_id: user_id }],
    }).populate({
      path: "sender_id",
      select: "username first_name last_name name avatar isverified type",
    });

    return res.json({
      success: 1,
      message: "All connection requests fetched successfully",
      connectionRequests: allConnectionRequests,
    });
  } catch (error) {
    console.error("Error fetching all connection requests:", error);
    return res.status(500).json({ success: 0, message: "Server error" });
  }
};

const connectioncount = async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id || user_id === "") {
      return res
        .status(500)
        .json({ success: 0, message: "user_id id not found" });
    }

    const allConnectionRequests = await ConnectionRequest.find({
      $or: [{ receiver_id: user_id, status: "pending" }],
    });

    const user = await User.findOne({ _id: user_id });
    const userNotificationCount = user.unReadNotification
      ? user.unReadNotification
      : 0;

    const unReadMessageCount = await Message.aggregate([
      {
        $match: {
          isRead: false,
          recipient: user_id, // Filter messages where the user is the recipient
        },
      },
      {
        $group: {
          _id: "$chat_id", // Group messages by chat_id (unique per user)
          count: { $sum: 1 }, // Count unread messages for each chat_id
        },
      },
      {
        $match: {
          count: { $gt: 0 }, // Filter out chat_ids with no unread messages
        },
      },
      {
        $group: {
          _id: null, // No need for a specific group ID here
          unreadUserCount: { $sum: 1 }, // Count the number of chat_ids (unread users)
        },
      },
    ]);

    // Fetch profile count
    const profile_count = await ProfileVisit.countDocuments({
      profile_id: user_id,
    });

    return res.json({
      success: 1,
      message: "All connection requests fetched successfully",
      pending: allConnectionRequests.length,
      userNotificationCount,
      unReadMessageCount:
        unReadMessageCount.length > 0
          ? unReadMessageCount[0].unreadUserCount
          : 0,
      profile_count,
      online: user.online,
    });
  } catch (error) {
    console.error("Error fetching all connection requests:", error);
    return res.status(500).json({ success: 0, message: "Server error" });
  }
};

const fetchAcceptedConnections = async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id || user_id === "") {
      return res
        .status(500)
        .json({ success: 0, message: "user_id id not found" });
    }

    // Fetch accepted connections where the user is the sender
    const connectionsSentByUser = await ConnectionRequest.find({
      sender_id: user_id,
      status: "accepted",
    });

    // Fetch accepted connections where the user is the receiver
    const connectionsReceivedByUser = await ConnectionRequest.find({
      receiver_id: user_id,
      status: "accepted",
    });

    // Combine both sets of connections into a single array
    const allConnections = [
      ...connectionsSentByUser,
      ...connectionsReceivedByUser,
    ];

    // Fetch user data for all connections
    const userPromises = allConnections.map(async (connection) => {
      // Determine whether to fetch user data based on sender_id or receiver_id
      let userIdToFetch = null;

      if (connection.sender_id == user_id) {
        userIdToFetch = connection.receiver_id;
      } else if (connection.receiver_id == user_id) {
        userIdToFetch = connection.sender_id;
      }

      let userData = null;

      if (userIdToFetch !== null) {
        userData = await User.findById(
          userIdToFetch,
          "username first_name last_name name avatar items isverified type"
        );
      }

      const connectionData = {
        connection,
        userData,
      };

      return {
        connectionData,
      };
    });

    // Wait for all user data promises to resolve and filter out null values
    const connectionsWithData = (await Promise.all(userPromises)).filter(
      (item) => item !== null
    );

    return res.json({
      success: 1,
      message: "Accepted connection requests fetched successfully",
      connections: connectionsWithData,
    });
  } catch (error) {
    console.error("Error fetching accepted connection requests:", error);
    return res.status(500).json({ success: 0, message: "Server error" });
  }
};

const shareUserPost = async (req, res) => {
  const { post_id } = req.body;
  try {
    if (!post_id || post_id === "") {
      return res.status(500).json({ success: 0, message: "post id not found" });
    }
    const postData = await post.findOne({ _id: post_id });
    if (!postData) {
      return res.status(404).json({ success: 0, message: "Post not found" });
    }
    const postLink = `${process.env.APPURL}/viewPost/${post_id}`;
    res.status(200).json({
      success: 1,
      message: "Successfully copied",
      link: postLink,
      data: postData,
    });
  } catch (error) {
    console.error("Error fetching requests:", error);
    return res.status(500).json({ success: 0, message: "Server error" });
  }
};

const shareUserReel = async (req, res) => {
  const { reel_id } = req.body;
  try {
    if (!reel_id) {
      return res.status(500).json({ success: 0, message: "reel id not found" });
    }
    const reelData = await Reel.findOne({ _id: reel_id });
    if (!reelData) {
      return res.status(404).json({ success: 0, message: "Reel not found" });
    }
    const reelLink = `${process.env.APPURL}/viewReel/${reel_id}`;
    res.status(200).json({
      success: 1,
      message: "Successfully copied",
      link: reelLink,
      data: reelData,
    });
  } catch (error) {
    console.error("Error fetching requests:", error);
    return res.status(500).json({ success: 0, message: "Server error" });
  }
};

const blockedPost = async (req, res) => {
  const { userId, postId } = req.body;
  try {
    if (!postId || !userId) {
      return res
        .status(500)
        .json({ success: 0, message: "post or user id not found" });
    }
    const userData = await User.findByIdAndUpdate(
      { _id: userId },
      { $addToSet: { blockedContent: postId } },
      { new: true }
    );
    if (!userData) {
      return res.status(404).json({ success: 0, message: "User not found" });
    }
    return res
      .status(200)
      .json({ success: 1, message: "Successfully updated" });
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json({ success: 0, message: "Internal Server error" });
  }
};

const blockedPostReel = async (req, res) => {
  const { userId, reelId } = req.body;
  try {
    if (!reelId || !userId) {
      res
        .status(500)
        .json({ success: 0, message: "reel or user id not found" });
    }
    const userData = await User.findByIdAndUpdate(
      { _id: userId },
      { $addToSet: { blockedContentReel: reelId } },
      { new: true }
    );
    if (!userData) {
      return res.status(404).json({ success: 0, message: "User not found" });
    }
    return res
      .status(200)
      .json({ success: 1, message: "Successfully updated" });
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json({ success: 0, message: "Internal Server error" });
  }
};

const delete_post_permanent = async (req, res) => {
  const post_id = req.body.postId;
  try {
    if (!post_id || post_id === "") {
      return res.status(500).json({ success: 0, message: "post id not found" });
    }

    // Check if the post exists
    const existingPost = await DeletedPost.findOneAndDelete({
      post_id: post_id,
    });

    if (!existingPost) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if existingPost is a Mongoose document
    if (!(existingPost instanceof DeletedPost)) {
      return res.status(500).json({ message: "Invalid document type" });
    }

    // Delete the post
    // await existingPost.remove();

    res.json({ success: 1, message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    return res.status(500).json({ message: "Error deleting post" });
  }
};

const delete_post = async (req, res) => {
  const { postId } = req.body;
  try {
    if (!postId || postId === "") {
      return res.status(500).json({ success: 0, message: "post id not found" });
    }

    // Check if the post exists
    const existingPost = await post.findById(postId);
    if (!existingPost) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Call the deleteExpiredPosts function to delete old posts
    // await deleteExpiredPosts();

    // Create a DeletedPost entry before removing the post
    await DeletedPost.create({
      post_id: existingPost._id,
      user_id: existingPost.user_id,
      text: existingPost.text,
      likes: existingPost.likes,
      comments: existingPost.comments,
      repost: existingPost.repost,
      views: existingPost.views,
      image: existingPost.image, // Include other fields as needed
      createdAt: existingPost.createdAt,
      deletedAt: Date.now(),
    });

    // delete all the notification of post
    let notification = await Notification.deleteMany({ post: postId });

    // Delete the post
    await post.deleteOne({ _id: postId });

    return res.json({ success: 1, message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    return res.status(500).json({ message: "Error deleting post" });
  }
};

const getDeletedPosts = async (req, res) => {
  const { user_id } = req.body;
  try {
    if (!user_id || user_id === "") {
      return res.status(500).json({ success: 0, message: "user id not found" });
    }
    const deleted = await DeletedPost.find({ user_id }).populate(
      "user_id",
      "username first_name last_name name avatar isverified type"
    );
    const deletedPosts = deleted.map((deletedPost) => ({
      // ...likedUser.toObject(),
      // isFollowing: user.following.includes(likedUser._id.toString()),

      user_id: deletedPost.user_id,
      _id: deletedPost._id,
      post_id: deletedPost.post_id,
      text: deletedPost.text,
      image: deletedPost.image,
      likes: deletedPost.likes,
      repost: deletedPost.repost,
      comments: deletedPost.comments,
      views: deletedPost.views.length,
      createdAt: deletedPost.createdAt,
      deletedAt: deletedPost.deletedAt,
    }));
    return res.json({ success: 1, deletedPosts });
  } catch (error) {
    console.error("Error retrieving deleted posts:", error);
    return res.status(500).json({ success: 0, message: "Server error" });
  }
};

const retrievePost = async (req, res) => {
  const postIdToRestore = req.body.postId; // Assuming postId is passed in the request parameters
  try {
    if (!postIdToRestore || postIdToRestore === "") {
      return res.status(500).json({ success: 0, message: "post id not found" });
    }

    // Retrieve the deleted post from DeletedPost collection
    const deletedPost = await DeletedPost.findOne({
      post_id: postIdToRestore,
    }).populate("user_id", "username first_name last_name avatar");

    if (!deletedPost) {
      return res
        .status(404)
        .json({ success: 0, message: "Deleted post not found" });
    }

    // Create a new post in post collection using the data from the deleted post
    const { user_id, text, likes, image, comments, repost, views, createdAt } =
      deletedPost;
    const restoredPost = new post({
      user_id: user_id._id,
      text,
      likes,
      image,
      comments,
      repost,
      views,
      createdAt,
      // Include other fields as needed
    });

    await restoredPost.save();

    // Remove the restored post from DeletedPost collection
    await deletedPost.deleteOne();

    return res.json({ success: 1, message: "Post restored successfully" });
  } catch (error) {
    console.error("Error retrieving and restoring deleted post:", error);
    return res.status(500).json({ success: 0, message: "Server error" });
  }
};

const post_data = async (req, res) => {
  const { userId, post_id } = req.body;
  try {
    if (!post_id || post_id === "") {
      return res.status(500).json({ success: 0, message: "post id not found" });
    }
    if (!userId || userId === "") {
      return res.status(500).json({ success: 0, message: "user id not found" });
    }

    const posts = await post.find({ _id: post_id });
    if (!posts || posts.length === 0) {
      return res.status(404).json({ Success: 0, message: "No post found" });
    }

    const repostDatas = await Repost.findOne({ user_id: userId });
    const saveDocument = await Save.findOne({ userId });

    const feedData = await Promise.all(
      posts.map(async (post) => {
        const likes_check = post.likes.includes(userId);
        const repost_check = repostDatas
          ? repostDatas.repost_ids.includes(post._id)
          : false;
        const issaved = saveDocument
          ? saveDocument.post_ids.includes(post._id)
          : false;
        const userData = await fetchUserDetail(post.user_id, userId);
        const connectionStatus = await getConnectionStatus(
          userId,
          post.user_id
        );
        const {
          username,
          items,
          avatar,
          name,
          first_name,
          last_name,
          following,
          type,
          isverified,
        } = userData;

        return {
          postId: post._id,
          userId: post.user_id,
          postText: post.text,
          postImage: post.image,
          comments: post.comments.length,
          likes: post.likes.length,
          createdAt: post.createdAt,
          repost_length: post.repost.length,
          likes_check,
          username,
          items: items[0],
          avatar,
          first_name,
          last_name,
          name,
          following,
          type,
          isverified,
          isconnection: connectionStatus,
          issaved,
          repost_check,
        };
      })
    );

    return res.json({ feed: feedData, Success: 1, message: "Success" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ feed: [], Success: 0, message: "Error fetching feed" });
  }
};

const reel_data = async (req, res) => {
  const { userId, reel_id } = req.body;
  try {
    if (!reel_id || reel_id === "") {
      return res.status(500).json({ success: 0, message: "reel id not found" });
    }
    if (!userId || userId === "") {
      return res.status(500).json({ success: 0, message: "user id not found" });
    }
    const posts = await Reel.find({ _id: reel_id });
    if (!posts) {
      return res.json({ Success: 0, message: "No post found" });
    }
    const repostDatas = await Repost.findOne({ user_id: userId });
    // const feedData = post.map(async(post) => {
    const feedData = await Promise.all(
      posts.map(async (posts) => {
        const saveDocument = await Save.findOne({ userId });
        const _id = posts.user_id;
        const likes_check = posts.likes.includes(userId);
        // const repdata = repostDatas ? repostDatas.repost_ids.includes(post._id) : false;
        const issaved = saveDocument
          ? saveDocument.reel_ids.includes(post._id)
          : false;
        const userData = await fetchUserDetail(_id, userId);
        const connectionStatus = await getConnectionStatus(userId, _id);
        const {
          username,
          items,
          avatar,
          first_name,
          last_name,
          following,
          type,
          name,
          isverified,
        } = userData;
        const formattedDateTime = calculateAgeOfPost(post.createdAt);
        const mergedPost = {
          _id: posts._id,
          user_id: posts.user_id,
          text: posts.text,
          video: posts.video,
          comment_count: posts.comments.length,
          likes_count: posts.likes.length,
          // createdAt: post.createdAt,
          issaved,
          likes_check,
          username,
          items: items[0],
          avatar,
          first_name,
          last_name,
          name,
          follow_check: following,
          type,
          isverified,

          isconnected: connectionStatus,
          // repost_check: repdata,
          createdAt: formattedDateTime,
        };
        return mergedPost;
      })
    );
    const filteredFeedData = feedData.filter((posts) => posts !== null);
    // Step 6: Send Adjusted Feed Data to the Client
    return res.json({
      reelsWithUsers: filteredFeedData,
      success: 1,
      message: "Success",
    });
  } catch (error) {
    console.error(error);
    return res.json({
      reelsWithUsers: [],
      success: 0,
      message: "Error fetching feed",
    });
  }
};

const trending = async (req, res) => {
  const { user_id } = req.body;
  try {
    if (!user_id || user_id === "") {
      return res.status(500).json({ success: 0, message: "user id not found" });
    }
    const posts = await post
      .aggregate([
        {
          $project: {
            _id: 1,
            likesCount: { $size: "$likes" },
          },
        },
        { $sort: { likesCount: -1 } },
        { $limit: 3 },
      ])
      .exec();

    if (posts.length > 0) {
      const mergedPosts = [];
      for (const postss of posts) {
        const detailedPost = await post.findById(postss._id).populate({
          path: "user_id",
          select:
            "username first_name last_name avatar items isverified type followers",
        });
        const saveDocument = await Save.findOne(detailedPost.user_id._id);
        const _id = detailedPost.user_id._id;
        const likes_check = detailedPost.likes.includes(
          detailedPost.user_id._id
        );
        const issaved = saveDocument
          ? saveDocument.post_ids.includes(detailedPost.user_id._id)
          : false;

        const isFollowing = detailedPost.user_id.followers
          ? detailedPost.user_id.followers.includes(user_id)
          : false;
        const connectionStatus = await getConnectionStatus(
          detailedPost.user_id._id,
          _id
        );

        const mergedPost = {
          postId: detailedPost._id,
          userId: detailedPost.user_id._id,
          postText: detailedPost.text,
          postImage: detailedPost.image,
          comments: detailedPost.comments.length,
          likes: detailedPost.likes.length,
          createdAt: detailedPost.createdAt,
          repost_length: detailedPost.repost.length,
          likes_check: likes_check,
          username: detailedPost.user_id.username,
          items: detailedPost.user_id.items,
          avatar: detailedPost.user_id.avatar,
          first_name: detailedPost.user_id.first_name,
          last_name: detailedPost.user_id.last_name,
          following: isFollowing,
          isverified: detailedPost.user_id.isverified,
          type: detailedPost.user_id.type,
          isconnection: connectionStatus,
          issaved: issaved,
          ExactDate: formattedDateTime,
        };
        mergedPosts.push(mergedPost);
      }
      return res.json({
        Success: 1,
        message: "Posts fetched successfully",
        feed: mergedPosts,
      });
    } else {
      return res.json({ Success: 0, message: "No posts found" });
    }
  } catch (error) {
    console.error("Error fetching trending posts:", error);
    return res.status(500).json({ Success: 0, message: "Server error" });
  }
};

const comment_delete = async (req, res) => {
  const { postId, commentId } = req.body;

  try {
    // Find the post by ID

    if (!postId || postId === "") {
      return res.status(500).json({ success: 0, message: "post id not found" });
    }
    if (!commentId || commentId === "") {
      return res
        .status(500)
        .json({ success: 0, message: "comment id not found" });
    }
    const getPost = await post.findById(postId);

    // Check if the post exists
    if (!getPost) {
      return res.status(404).json({ success: 0, message: "Post not found" });
    }

    // Find the comment in the post's comments array
    const comment = getPost.comments.find(
      (comment) => comment._id.toString() === commentId
    );

    // Check if the comment exists
    if (!comment) {
      return res.status(404).json({ success: 0, message: "Comment not found" });
    }

    // Get the user_id related to the comment
    const userId = comment.user_id;

    // Remove the comment from the post's comments array
    getPost.comments = getPost.comments.filter(
      (comment) => comment._id.toString() !== commentId
    );

    // Save the updated post
    await getPost.save();

    const commentLength = getPost.comments.length;
    if (commentLength == 0) {
      let notification = await Notification.deleteOne({
        type: "comment",
        post: postId,
      });
    } else {
      let body;

      const uniqueCommentersCount = new Set(
        getPost.comments.map((comment) => comment.user_id)
      ).size;
      if (uniqueCommentersCount == 1) {
        body = `commented on your post`;
      } else {
        body = `and ${uniqueCommentersCount - 1} other commented on your post`;
      }
      const lastCommenter = getPost.comments[commentLength - 1];
      const lastCommenter_Id = lastCommenter.user_id;

      const sender = await User.findById(lastCommenter_Id).select(
        "username type first_name last_name avatar"
      );
      const senderdata = {
        sender: lastCommenter_Id,
        username: sender.username,
        type: sender.type,
        first_name: sender.first_name,
        last_name: sender.last_name,
        avatar: sender.avatar,
      };
      let notification = await Notification.updateOne(
        { type: "comment", post: postId },
        {
          $set: {
            senderdata: senderdata,
            body: body,
            sender: lastCommenter_Id,
          },
        }
      );
    }

    return res.json({ success: 1, message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return res
      .status(500)
      .json({ success: 0, message: "Internal server error" });
  }
};

const comment_reel_delete = async (req, res) => {
  const { reelId, commentId } = req.body;

  try {
    if (!reelId || reelId === "") {
      return res.status(500).json({ success: 0, message: "reel id not found" });
    }
    if (!commentId || commentId === "") {
      return res
        .status(500)
        .json({ success: 0, message: "comment id not found" });
    }
    // Find the post by ID
    const getPost = await Reel.findById(reelId);

    // Check if the post exists
    if (!getPost) {
      return res.status(404).json({ success: 0, message: "Post not found" });
    }

    // Find the comment in the post's comments array
    const comment = getPost.comments.find(
      (comment) => comment._id.toString() === commentId
    );

    // Check if the comment exists
    if (!comment) {
      return res.status(404).json({ success: 0, message: "Comment not found" });
    }

    // Get the user_id related to the comment
    const userId = comment.user_id;

    // Remove the comment from the post's comments array
    getPost.comments = getPost.comments.filter(
      (comment) => comment._id.toString() !== commentId
    );

    // Save the updated post
    await getPost.save();
    const commentLength = getPost.comments.length;
    if (commentLength == 0) {
      let notification = await Notification.deleteOne({
        type: "comment_reel",
        post: reelId,
      });
    } else {
      let body;

      const uniqueCommentersCount = new Set(
        getPost.comments.map((comment) => comment.user_id)
      ).size;
      if (uniqueCommentersCount == 1) {
        body = `commented on your reel`;
      } else {
        body = `and ${uniqueCommentersCount - 1} other commented on your reel`;
      }
      const lastCommenter = getPost.comments[commentLength - 1];

      const lastCommenter_Id = lastCommenter.user_id;

      const sender = await User.findById(lastCommenter_Id).select(
        "username type first_name last_name avatar"
      );
      const senderdata = {
        sender: lastCommenter_Id,
        username: sender.username,
        type: sender.type,
        first_name: sender.first_name,
        last_name: sender.last_name,
        avatar: sender.avatar,
      };
      let notification = await Notification.updateOne(
        { type: "comment_reel", post: reelId },
        {
          $set: {
            senderdata: senderdata,
            body: body,
            sender: lastCommenter_Id,
          },
        }
      );
    }
    return res.json({ success: 1, message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return res
      .status(500)
      .json({ success: 0, message: "Internal server error" });
  }
};

const addCommentSettings = async (req, res) => {
  const { postId, commentSettings } = req.body;
  try {
    if (!postId || postId === "") {
      return res.status(500).json({ success: 0, message: "post id not found" });
    }

    // Update the post with the new commentSettings value
    await post.findByIdAndUpdate(postId, { commentSettings }, { new: true });

    res.json({ success: 1, message: "Comment settings updated successfully" });
  } catch (error) {
    console.error("Error updating comment settings:", error);
    return res.status(500).json({ success: 0, message: "Server error" });
  }
};

const deleteRepost = async (req, res) => {
  const { repostId, userId } = req.body;
  try {
    if (!repostId || repostId === "") {
      return res
        .status(500)
        .json({ success: 0, message: "repost id not found" });
    }
    if (!userId || userId === "") {
      return res.status(500).json({ success: 0, message: "user id not found" });
    }
    const repost = await Repost.findOne({ user_id: userId });
    if (!repost) {
      return res
        .status(200)
        .json({ success: 0, message: "User not posted anything" });
    }
    const includesRepostId = repost.repost_ids.includes(repostId);
    if (!includesRepostId) {
      return res.status(404).json({
        success: 0,
        message: "Repost id not found in the reposts array",
      });
    }
    await Repost.findOneAndUpdate(
      { user_id: userId },
      { $pull: { repost_ids: repostId } },
      { new: true }
    );

    const updatedpost = await post.findByIdAndUpdate(
      repostId,
      { $pull: { repost: userId } },
      { new: true }
    );
    let remainingReposters = updatedpost.repost.length;
    if (remainingReposters == 0) {
      await Notification.deleteOne({
        type: "repost",
        post: repostId,
      });
    } else {
      let body =
        remainingReposters === 1
          ? `reposted your post`
          : `and ${remainingReposters - 1} others reposted your post`;
      const lastreposted = updatedpost.repost[remainingReposters - 1];

      const sender = await User.findById(lastreposted).select(
        "username type first_name last_name avatar"
      );
      const senderdata = {
        sender: lastreposted,
        username: sender.username,
        type: sender.type,
        first_name: sender.first_name,
        last_name: sender.last_name,
        avatar: sender.avatar,
      };

      await Notification.updateOne(
        { type: "repost", post: repostId },
        { $set: { senderdata: senderdata, body: body, sender: lastreposted } }
      );
    }
    return res.json({ success: 1, message: "Repost deleted successfully" });
  } catch (error) {
    console.error("Error deleting repost:", error);
    return res.status(500).json({ success: 0, message: "Server error" });
  }
};

const paginationPost = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Find the current user and their following IDs
    const currentUser = await User.findById(user_id);
    const followingIds = currentUser.following;

    // Fetch saved and repost data
    const saveData = await Save.findOne({ user_id });
    const repost = await Repost.findOne({ user_id });

    // Find the connection receiver IDs
    const connectionReceiverData = await ConnectionRequest.aggregate([
      {
        $match: {
          $or: [
            { sender_id: new ObjectId(user_id) },
            { receiver_id: new ObjectId(user_id) },
          ],
          status: "accepted",
        },
      },
      {
        $group: {
          _id: null,
          receiverIds: {
            $push: {
              $cond: {
                if: { $eq: [{ $toString: "$sender_id" }, user_id] },
                then: { $toString: "$receiver_id" },
                else: { $toString: "$sender_id" },
              },
            },
          },
        },
      },
      { $project: { _id: 0, receiverIds: 1 } },
    ]);

    const connectionReceiverIds = connectionReceiverData[0]?.receiverIds || [];

    // Calculate the total number of posts
    const totalPosts = await post.countDocuments({
      $or: [
        {
          user_id: {
            $in: [...connectionReceiverIds, ...followingIds, user_id],
          },
        },
        {
          user_id: {
            $nin: [...connectionReceiverIds, ...followingIds, user_id],
          },
        },
      ],
      views: { $not: { $elemMatch: { $eq: user_id } } },
    });

    const totalPages = Math.ceil(totalPosts / parseInt(limit));

    // Ensure the requested page is within the valid range
    if (page < 1 || page > totalPages) {
     
      return res.json({ status: 0, message: "Invalid page number or no posts" });
    }

    const skip = (page - 1) * parseInt(limit);

    // Fetch recent posts with aggregations
    const recentPosts = await post.aggregate([
      {
        $match: {
          $or: [
            {
              user_id: {
                $in: [...connectionReceiverIds, ...followingIds, user_id],
              },
            },
            {
              user_id: {
                $nin: [...connectionReceiverIds, ...followingIds, user_id],
              },
            },
          ],
          views: { $not: { $elemMatch: { $eq: user_id } } },
        },
      },
      {
        $lookup: {
          from: "users",
          let: { userId: { $toObjectId: "$user_id" } },
          pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$userId"] } } }],
          as: "user_details",
        },
      },
      {
        $addFields: {
          user_details: { $arrayElemAt: ["$user_details", 0] },
          followers: {
            $ifNull: [{ $arrayElemAt: ["$user_details.followers", 0] }, []],
          },
          isSaved: {
            $in: [
              "$_id",
              saveData ? saveData.post_ids.map((id) => new ObjectId(id)) : [],
            ],
          },
          repostCheck: {
            $in: [
              "$_id",
              repost ? repost.repost_ids.map((id) => new ObjectId(id)) : [],
            ],
          },
          isLiked: {
            $cond: {
              if: { $in: [user_id, "$likes"] },
              then: true,
              else: false,
            },
          },
          isTagged: {
            $cond: { if: { $in: [user_id, "$tags"] }, then: true, else: false },
          },
          commentsCount: { $size: { $ifNull: ["$comments", []] } },
          viewsCount: { $size: { $ifNull: ["$views", []] } },
          repostCount: { $size: { $ifNull: ["$repost", []] } },
          likeCount: { $size: { $ifNull: ["$likes", []] } },
          isFollowing: {
            $in: [
              user_id,
              {
                $reduce: {
                  input: "$user_details.followers",
                  initialValue: [],
                  in: { $concatArrays: ["$$value", "$$this"] },
                },
              },
            ],
          },
          isFollower: {
            $in: [
              user_id,
              {
                $reduce: {
                  input: "$user_details.following",
                  initialValue: [],
                  in: { $concatArrays: ["$$value", "$$this"] },
                },
              },
            ],
          },
          isConnection: { $in: ["$user_id", connectionReceiverIds] },
        },
      },
      {
        $addFields: {
          "user_details.items": {
            $arrayElemAt: ["$user_details.items", 0],
          },
        },
      },
      {
        $addFields: {
          canComment: {
            $switch: {
              branches: [
                { case: { $eq: ["$commentSettings", "everyone"] }, then: true },
                {
                  case: { $eq: ["$commentSettings", "connections"] },
                  then: { $in: ["$user_id", connectionReceiverIds] },
                },
                {
                  case: { $eq: ["$commentSettings", "following"] },
                  then: { $in: [user_id, "$followers"] },
                },
                { case: { $eq: ["$commentSettings", "none"] }, then: false },
                {
                  case: { $eq: ["$commentSettings", "both"] },
                  then: {
                    $or: [
                      { $in: [user_id, "$followers"] },
                      { $in: ["$user_id", followingIds] },
                    ],
                  },
                },
              ],
              default: false,
            },
          },
        },
      },
      {
        $project: {
          image: 1,
          hashtags: 1,
          view: 1,
          text: 1,
          canComment: 1,
          commentsCount: 1,
          viewsCount: 1,
          repostCount: 1,
          likeCount: 1,
          isLiked: 1,
          isTagged: 1,
          isFollowing: 1,
          isSaved: 1,
          repostCheck: 1,
          isConnection: 1,
          createdAt: 1,
          age: 1,
          "user_details._id": 1,
          "user_details.avatar": 1,
          "user_details.first_name": 1,
          "user_details.last_name": 1,
          "user_details.name": 1,
          "user_details.user_name": 1,
          "user_details.isverified": 1,
          "user_details.username": 1,
          "user_details.type": 1,
          "user_details.items": 1,
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) },
    ]);

    const resentPostFeed = recentPosts.map((post) => ({
      ...post,
      ExectDate: post.createdAt,
    }));

    res.json({
      status: 1,
      feed: resentPostFeed,
      current_page: parseInt(page),
      total_pages: totalPages,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 0, message: err.message });
  }
};

const paginationTrandingPost = async (req, res) => {
  const { user_id } = req.params;
  const { page, limit } = req.query;

  try {
    // finding the saved post from Save Model
    const saveData = await Save.findOne({ user_id });

    // repost check form repost Model
    const repost = await Repost.findOne({ user_id });

    const connectionReceiverIds = await ConnectionRequest.aggregate([
      {
        $match: {
          $or: [
            { sender_id: new ObjectId(user_id) },
            { receiver_id: new ObjectId(user_id) },
          ],
          status: "accepted",
        },
      },
      {
        $group: {
          _id: null,
          receiverIds: {
            $push: {
              $cond: {
                if: { $eq: [{ $toString: "$sender_id" }, user_id] },
                then: { $toString: "$receiver_id" },
                else: { $toString: "$sender_id" },
              },
            },
          },
        },
      },
      { $project: { _id: 0, receiverIds: 1 } },
    ]);

    const ConnectionReceiverIdsInArray =
      connectionReceiverIds[0]?.receiverIds || [];

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trandingPostsCount = await post.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    const totalPages = Math.ceil(trandingPostsCount / parseInt(limit));

    // Ensure the requested page is within the valid range
    if (page < 1 || page > totalPages) {
     
      return res.json({ status: 0, message: "Invalid page number or no posts" });
    }

    // Skip calculation
    const skip = (page - 1) * parseInt(limit);

    const trandingPosts = await post.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $lookup: {
          from: "users",
          let: { userId: { $toObjectId: "$user_id" } },
          pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$userId"] } } }],
          as: "user_details",
        },
      },
      {
        $addFields: {
          user_details: { $arrayElemAt: ["$user_details", 0] },
          viewsCount: {
            $cond: {
              if: { $isArray: "$views" },
              then: { $size: "$views" },
              else: 0,
            },
          },

          isSaved: {
            $in: [
              "$_id",
              saveData ? saveData.post_ids.map((id) => new ObjectId(id)) : [],
            ],
          },

          repostCheck: {
            $in: [
              "$_id",
              repost ? repost.repost_ids.map((id) => new ObjectId(id)) : [],
            ],
          },

          isLiked: {
            $cond: {
              if: {
                $and: [{ $isArray: "$likes" }, { $in: [user_id, "$likes"] }],
              },
              then: true,
              else: false,
            },
          },

          isTagged: {
            $cond: {
              if: {
                $and: [{ $isArray: "$tags" }, { $in: [user_id, "$tags"] }],
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
          repostCount: {
            $cond: {
              if: { $isArray: "$repost" },
              then: { $size: "$repost" },
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

          isFollowing: {
            $in: [
              user_id,
              {
                $reduce: {
                  input: "$user_details.followers",
                  initialValue: [],
                  in: { $concatArrays: ["$$value", "$$this"] },
                },
              },
            ],
          },
          isConnection: { $in: ["$user_id", ConnectionReceiverIdsInArray] },
        },
      },
      {
        $addFields: {
          "user_details.items": {
            $arrayElemAt: ["$user_details.items", 0],
          },
        },
      },
      {
        $sort: { viewsCount: -1 },
      },
      {
        $project: {
          image: 1,
          hashtags: 1,
          view: 1,
          text: 1,
          canComment: 1,
          commentsCount: 1,
          viewsCount: 1,
          repostCount: 1,
          likeCount: 1,
          isLiked: 1,
          isTagged: 1,
          isFollowing: 1,
          isSaved: 1,
          repostCheck: 1,
          isConnection: 1,
          createdAt: 1,
          age: 1,
          "user_details._id": 1,
          "user_details.avatar": 1,
          "user_details.first_name": 1,
          "user_details.last_name": 1,
          "user_details.name": 1,
          "user_details.user_name": 1,
          "user_details.isverified": 1,
          "user_details.username": 1,
          "user_details.type": 1,
          "user_details.items": 1,
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: parseInt(limit),
      },
    ]);

    const resentTranding = trandingPosts.map((post) => ({
      ...post,
      ExectDate: post.createdAt,
    }));
    res.status(200).json({
      status: 1,
      feed: resentTranding,
      current_page: parseInt(page),
      total_pages: totalPages,
    });
  } catch (error) {
    res.status(500).json({ status: 0, message: error.message });
  }
};

const organizationPost = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { page, limit } = req.query;

    const objectIdUserId = new ObjectId(user_id);

    const [followingIds, saveData, repost, connectionReceiverIds] =
      await Promise.all([
        User.findById(user_id).select("following -_id").exec(),
        Save.findOne({ user_id }),
        Repost.findOne({ user_id }),
        ConnectionRequest.aggregate([
          {
            $match: {
              $or: [
                { sender_id: objectIdUserId },
                { receiver_id: objectIdUserId },
              ],
              status: "accepted",
            },
          },
          {
            $group: {
              _id: null,
              receiverIds: {
                $push: {
                  $cond: {
                    if: { $eq: [{ $toString: "$sender_id" }, user_id] },
                    then: { $toString: "$receiver_id" },
                    else: { $toString: "$sender_id" },
                  },
                },
              },
            },
          },
          { $project: { _id: 0, receiverIds: 1 } },
        ]),
      ]);

    // connectionReceiverIds is an array of Object of length 1 inside that we have an array named receiverIds which contains the receiver ids
    const ConnectionReceiverIdsInArray =
      connectionReceiverIds[0]?.receiverIds || [];

    const allUserRelatedIds = [
      ...ConnectionReceiverIdsInArray,
      ...followingIds.following,
      user_id,
    ];

    // finding the recent post on the basis of following, followers, and connection

    const aggregationResult = await post.aggregate([
      {
        $match: {
          $or: [
            { user_id: { $in: [allUserRelatedIds] } },
            { user_id: { $nin: [allUserRelatedIds] } },
          ],
          views: { $not: { $elemMatch: { $eq: user_id } } },
        },
      },
      {
        $lookup: {
          from: "users",
          let: { userId: { $toObjectId: "$user_id" } },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$userId"] },
              },
            },
          ],
          as: "user_details",
        },
      },

      { $match: { "user_details.type": "2" } },

      {
        $addFields: {
          user_details: { $arrayElemAt: ["$user_details", 0] },

          followers: {
            $ifNull: [{ $arrayElemAt: ["$user_details.followers", 0] }, []],
          },

          isSaved: {
            $in: [
              "$_id",
              saveData ? saveData.post_ids.map((id) => new ObjectId(id)) : [],
            ],
          },

          repostCheck: {
            $in: [
              "$_id",
              repost ? repost.repost_ids.map((id) => new ObjectId(id)) : [],
            ],
          },

          isLiked: {
            $cond: {
              if: {
                $and: [{ $isArray: "$likes" }, { $in: [user_id, "$likes"] }],
              },
              then: true,
              else: false,
            },
          },

          isTagged: {
            $cond: {
              if: {
                $and: [{ $isArray: "$tags" }, { $in: [user_id, "$tags"] }],
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

          repostCount: {
            $cond: {
              if: { $isArray: "$repost" },
              then: { $size: "$repost" },
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

          isFollowing: {
            $in: [
              user_id,
              {
                $reduce: {
                  input: "$user_details.followers",
                  initialValue: [],
                  in: { $concatArrays: ["$$value", "$$this"] },
                },
              },
            ],
          },

          isFollower: {
            $in: [
              user_id,
              {
                $reduce: {
                  input: "$user_details.following",
                  initialValue: [],
                  in: { $concatArrays: ["$$value", "$$this"] },
                },
              },
            ],
          },

          isConnection: { $in: ["$user_id", ConnectionReceiverIdsInArray] },
        },
      },
      {
        $addFields: {
          "user_details.items": {
            $arrayElemAt: ["$user_details.items", 0],
          },
        },
      },
      {
        $addFields: {
          canComment: {
            $switch: {
              branches: [
                {
                  case: { $eq: ["$commentSettings", "everyone"] },
                  then: true,
                },
                {
                  case: { $eq: ["$commentSettings", "connections"] },
                  then: {
                    $or: ["$isConnection", false],
                  },
                },
                {
                  case: { $eq: ["$commentSettings", "following"] },
                  then: {
                    $or: ["$isFollower", false],
                  },
                },
                {
                  case: { $eq: ["$commentSettings", "none"] },
                  then: false,
                },
                {
                  case: {
                    $or: [
                      { $eq: ["$commentSettings", "both"] },
                      { $eq: ["$commentSettings", "following"] },
                    ],
                  },
                  then: {
                    $or: ["$isFollowing", { $in: [user_id, "$followers"] }],
                  },
                },
              ],
              default: false,
            },
          },
        },
      },

      {
        $project: {
          image: 1,
          hashtags: 1,
          view: 1,
          text: 1,
          canComment: 1,
          commentsCount: 1,
          viewsCount: 1,
          repostCount: 1,
          likeCount: 1,
          isLiked: 1,
          isTagged: 1,
          isFollowing: 1,
          isSaved: 1,
          repostCheck: 1,
          isConnection: 1,
          createdAt: 1,
          age: 1,
          "user_details._id": 1,
          "user_details.avatar": 1,
          "user_details.first_name": 1,
          "user_details.last_name": 1,
          "user_details.name": 1,
          "user_details.user_name": 1,
          "user_details.isverified": 1,
          "user_details.username": 1,
          "user_details.type": 1,
          "user_details.items": 1,
        },
      },

      {
        $facet: {
          totalPosts: [{ $count: "count" }],
          posts: [
            { $sort: { createdAt: -1 } },
            { $skip: (page - 1) * parseInt(limit) },
            { $limit: parseInt(limit) },
          ],
        },
      },
    ]);

    // finding the total Post of count using the count Document

    const totalPosts = aggregationResult[0].totalPosts[0]?.count || 0; // Safely extract count
    const totalPages = Math.ceil(totalPosts / parseInt(limit));

    // Ensure the requested page is within the valid range
    
    if (page < 1 || page > totalPages) {
     
      return res.json({ status: 0, message: "Invalid page number or no posts" });
    }

    const recentPosts = aggregationResult[0].posts; // Get the posts from the facet

    // ... (Map recentPosts to resentPostFeed with ExectDate calculation)

    const resentPostFeed = recentPosts.map((post) => ({
      ...post,
      ExectDate: post.createdAt,
    }));

    res.status(200).json({
      status: 1,
      feed: resentPostFeed,
      current_page: parseInt(page),
      total_pages: totalPages,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ status: 0, message: "Internal Server Error" });
  }
};

const individualPost = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { page, limit } = req.query;

    const objectIdUserId = new ObjectId(user_id);

    const [followingIds, saveData, repost, connectionReceiverIds] =
      await Promise.all([
        User.findById(user_id).select("following -_id").exec(),
        Save.findOne({ user_id }),
        Repost.findOne({ user_id }),
        ConnectionRequest.aggregate([
          {
            $match: {
              $or: [
                { sender_id: objectIdUserId },
                { receiver_id: objectIdUserId },
              ],
              status: "accepted",
            },
          },
          {
            $group: {
              _id: null,
              receiverIds: {
                $push: {
                  $cond: {
                    if: { $eq: [{ $toString: "$sender_id" }, user_id] },
                    then: { $toString: "$receiver_id" },
                    else: { $toString: "$sender_id" },
                  },
                },
              },
            },
          },
          { $project: { _id: 0, receiverIds: 1 } },
        ]),
      ]);

    // connectionReceiverIds is an array of Object of length 1 inside that we have an array named receiverIds which contains the receiver ids
    const ConnectionReceiverIdsInArray =
      connectionReceiverIds[0]?.receiverIds || [];

    const allUserRelatedIds = [
      ...ConnectionReceiverIdsInArray,
      ...followingIds.following,
      user_id,
    ];

    // finding the recent post on the basis of following, followers, and connection

    const aggregationResult = await post.aggregate([
      {
        $match: {
          $or: [
            { user_id: { $in: [allUserRelatedIds] } },
            { user_id: { $nin: [allUserRelatedIds] } },
          ],
          views: { $not: { $elemMatch: { $eq: user_id } } },
        },
      },
      {
        $lookup: {
          from: "users",
          let: { userId: { $toObjectId: "$user_id" } },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$userId"] },
              },
            },
          ],
          as: "user_details",
        },
      },

      { $match: { "user_details.type": "1" } },

      {
        $addFields: {
          user_details: { $arrayElemAt: ["$user_details", 0] },

          followers: {
            $ifNull: [{ $arrayElemAt: ["$user_details.followers", 0] }, []],
          },

          isSaved: {
            $in: [
              "$_id",
              saveData ? saveData.post_ids.map((id) => new ObjectId(id)) : [],
            ],
          },

          repostCheck: {
            $in: [
              "$_id",
              repost ? repost.repost_ids.map((id) => new ObjectId(id)) : [],
            ],
          },

          isLiked: {
            $cond: {
              if: {
                $and: [{ $isArray: "$likes" }, { $in: [user_id, "$likes"] }],
              },
              then: true,
              else: false,
            },
          },

          isTagged: {
            $cond: {
              if: {
                $and: [{ $isArray: "$tags" }, { $in: [user_id, "$tags"] }],
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

          repostCount: {
            $cond: {
              if: { $isArray: "$repost" },
              then: { $size: "$repost" },
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

          isFollowing: {
            $in: [
              user_id,
              {
                $reduce: {
                  input: "$user_details.followers",
                  initialValue: [],
                  in: { $concatArrays: ["$$value", "$$this"] },
                },
              },
            ],
          },

          isFollower: {
            $in: [
              user_id,
              {
                $reduce: {
                  input: "$user_details.following",
                  initialValue: [],
                  in: { $concatArrays: ["$$value", "$$this"] },
                },
              },
            ],
          },

          isConnection: { $in: ["$user_id", ConnectionReceiverIdsInArray] },
        },
      },
      {
        $addFields: {
          "user_details.items": {
            $arrayElemAt: ["$user_details.items", 0],
          },
        },
      },
      {
        $addFields: {
          canComment: {
            $switch: {
              branches: [
                {
                  case: { $eq: ["$commentSettings", "everyone"] },
                  then: true,
                },
                {
                  case: { $eq: ["$commentSettings", "connections"] },
                  then: {
                    $or: ["$isConnection", false],
                  },
                },
                {
                  case: { $eq: ["$commentSettings", "following"] },
                  then: {
                    $or: ["$isFollower", false],
                  },
                },
                {
                  case: { $eq: ["$commentSettings", "none"] },
                  then: false,
                },
                {
                  case: {
                    $or: [
                      { $eq: ["$commentSettings", "both"] },
                      { $eq: ["$commentSettings", "following"] },
                    ],
                  },
                  then: {
                    $or: ["$isFollowing", { $in: [user_id, "$followers"] }],
                  },
                },
              ],
              default: false,
            },
          },
        },
      },

      {
        $project: {
          image: 1,
          view: 1,
          hashtags: 1,
          text: 1,
          canComment: 1,
          commentsCount: 1,
          viewsCount: 1,
          repostCount: 1,
          likeCount: 1,
          isLiked: 1,
          isTagged: 1,
          isFollowing: 1,
          isSaved: 1,
          repostCheck: 1,
          isConnection: 1,
          createdAt: 1,
          age: 1,
          "user_details._id": 1,
          "user_details.avatar": 1,
          "user_details.first_name": 1,
          "user_details.last_name": 1,
          "user_details.name": 1,
          "user_details.user_name": 1,
          "user_details.isverified": 1,
          "user_details.username": 1,
          "user_details.type": 1,
          "user_details.items": 1,
        },
      },

      {
        $facet: {
          totalPosts: [{ $count: "count" }],
          posts: [
            { $sort: { createdAt: -1 } },
            { $skip: (page - 1) * parseInt(limit) },
            { $limit: parseInt(limit) },
          ],
        },
      },
    ]);

    // finding the total Post of count using the count Document

    const totalPosts = aggregationResult[0].totalPosts[0]?.count || 0; // Safely extract count
    const totalPages = Math.ceil(totalPosts / parseInt(limit));

    // Ensure the requested page is within the valid range
    if (page < 1 || page > totalPages) {
     
      return res.json({ status: 0, message: "Invalid page number or no posts" });
    }

    const recentPosts = aggregationResult[0].posts; // Get the posts from the facet

    // ... (Map recentPosts to resentPostFeed with ExectDate calculation)

    const resentPostFeed = recentPosts.map((post) => ({
      ...post,
      ExectDate: post.createdAt,
    }));

    res.status(200).json({
      status: 1,
      feed: resentPostFeed,
      current_page: parseInt(page),
      total_pages: totalPages,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ status: 0, message: "Internal Server Error" });
  }
};

const getAllHashtags = async (req, res) => {
  const { query } = req.query;
  let pipeline = [];
  if (query) {
    pipeline.push({
      $match: {
        hashtags: { $regex: query, $options: "i" }, // Case-insensitive search
      },
    });
  }
  pipeline.push(
    {
      $unwind: "$hashtags",
    },
    {
      $group: {
        _id: "$hashtags",
      },
    }
  );

  try {
    let result = await post.aggregate(pipeline);
    let hashtags = result.map((item) => item._id);
    // Shuffle the hashtags if there are no tags related to the search query
    if (hashtags.length === 0) {
      result = await post.aggregate([
        { $unwind: "$hashtags" },
        { $group: { _id: "$hashtags" } },
      ]);
      hashtags = result.map((item) => item._id);
      hashtags = shuffle(hashtags);
    }
    res.json({ success: 1, message: "hashtags fethed successfully", hashtags });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getPostsByHashtag = async (req, res) => {
  const { hashtag } = req.params;
  const { user_id } = req.body;
  const { page = 1, limit = 10 } = req.query;

  try {
    // Count total posts with the given hashtag
    if (!user_id || user_id === "") {
      return res.status(500).json({ success: 0, message: "user id not found" });
    }

    if (!hashtag)
      return res
        .status(400)
        .json({ status: 0, message: "Hashtag parameter is required" });

    // Validate page and limit as positive integers
    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);

    if (isNaN(pageInt) || isNaN(limitInt) || pageInt < 1 || limitInt < 1) {
      return res
        .status(400)
        .json({ status: 0, message: "Invalid page or limit value" });
    }
    const totalPosts = await post.countDocuments({
      hashtags: { $in: [hashtag] },
    });

    const totalPages = Math.ceil(totalPosts / limitInt);

    if (totalPages === 0) {
      return res.json({
        status: 1,
        feed: [],
        current_page: pageInt,
        total_pages: totalPages,
        message: "posts by hashtag fetched successfully",
        hashtag,
      });
    }
    if (pageInt > totalPages) {
      return res
        .status(400)
        .json({ status: 0, message: "Invalid page number" });
    }

    const saveData = await Save.findOne({ user_id });
    const repost = await Repost.findOne({ user_id });
    // Find the connection receiver IDs
    const connectionReceiverData = await ConnectionRequest.aggregate([
      {
        $match: {
          $or: [
            { sender_id: new ObjectId(user_id) },
            { receiver_id: new ObjectId(user_id) },
          ],
          status: "accepted",
        },
      },
      {
        $group: {
          _id: null,
          receiverIds: {
            $push: {
              $cond: {
                if: { $eq: [{ $toString: "$sender_id" }, user_id] },
                then: { $toString: "$receiver_id" },
                else: { $toString: "$sender_id" },
              },
            },
          },
        },
      },
      { $project: { _id: 0, receiverIds: 1 } },
    ]);

    const connectionReceiverIds = connectionReceiverData[0]?.receiverIds || [];
    const currentUser = await User.findById(user_id);
    const followingIds = currentUser.following;
    const skip = (pageInt - 1) * limitInt;

    // Find posts with the given hashtag with pagination
    const posts = await post.aggregate([
      {
        $match: { hashtags: { $in: [hashtag] } },
      },
      {
        $lookup: {
          from: "users",
          let: { userId: { $toObjectId: "$user_id" } },
          pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$userId"] } } }],
          as: "user_details",
        },
      },
      {
        $addFields: {
          user_details: { $arrayElemAt: ["$user_details", 0] },
          followers: {
            $ifNull: [{ $arrayElemAt: ["$user_details.followers", 0] }, []],
          },
          isSaved: {
            $in: [
              "$_id",
              saveData ? saveData.post_ids.map((id) => new ObjectId(id)) : [],
            ],
          },
          repostCheck: {
            $in: [
              "$_id",
              repost ? repost.repost_ids.map((id) => new ObjectId(id)) : [],
            ],
          },
          isLiked: {
            $cond: {
              if: { $in: [user_id, "$likes"] },
              then: true,
              else: false,
            },
          },
          isTagged: {
            $cond: { if: { $in: [user_id, "$tags"] }, then: true, else: false },
          },
          commentsCount: { $size: { $ifNull: ["$comments", []] } },
          viewsCount: { $size: { $ifNull: ["$views", []] } },
          repostCount: { $size: { $ifNull: ["$repost", []] } },
          likeCount: { $size: { $ifNull: ["$likes", []] } },
          isFollowing: {
            $in: [
              user_id,
              {
                $reduce: {
                  input: "$user_details.followers",
                  initialValue: [],
                  in: { $concatArrays: ["$$value", "$$this"] },
                },
              },
            ],
          },
          isFollower: {
            $in: [
              user_id,
              {
                $reduce: {
                  input: "$user_details.following",
                  initialValue: [],
                  in: { $concatArrays: ["$$value", "$$this"] },
                },
              },
            ],
          },
          isConnection: { $in: ["$user_id", connectionReceiverIds] },
        },
      },
      {
        $addFields: {
          "user_details.items": {
            $arrayElemAt: ["$user_details.items", 0],
          },
        },
      },
      {
        $addFields: {
          canComment: {
            $switch: {
              branches: [
                { case: { $eq: ["$commentSettings", "everyone"] }, then: true },
                {
                  case: { $eq: ["$commentSettings", "connections"] },
                  then: { $in: ["$user_id", connectionReceiverIds] },
                },
                {
                  case: { $eq: ["$commentSettings", "following"] },
                  then: { $in: [user_id, "$followers"] },
                },
                { case: { $eq: ["$commentSettings", "none"] }, then: false },
                {
                  case: { $eq: ["$commentSettings", "both"] },
                  then: {
                    $or: [
                      { $in: [user_id, "$followers"] },
                      { $in: ["$user_id", followingIds] },
                    ],
                  },
                },
              ],
              default: false,
            },
          },
        },
      },
      {
        $project: {
          image: 1,
          hashtags: 1,
          view: 1,
          text: 1,
          canComment: 1,
          commentsCount: 1,
          viewsCount: 1,
          repostCount: 1,
          likeCount: 1,
          isLiked: 1,
          isTagged: 1,
          isFollowing: 1,
          isSaved: 1,
          repostCheck: 1,
          isConnection: 1,
          createdAt: 1,
          age: 1,
          "user_details._id": 1,
          "user_details.avatar": 1,
          "user_details.first_name": 1,
          "user_details.last_name": 1,
          "user_details.name": 1,
          "user_details.user_name": 1,
          "user_details.isverified": 1,
          "user_details.username": 1,
          "user_details.type": 1,
          "user_details.items": 1,
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limitInt },
    ]);

    res.json({
      status: 1,
      feed: posts,
      current_page: pageInt,
      total_pages: totalPages,
      message: "posts by hashtag fetched successfully",
      hashtag,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  comment_alls,
  like,
  unlike,
  comment,
  follow,
  unfollow,
  images,
  videos,
  following,
  followers,
  likes_list,
  savePost,
  fetchSavedPosts,
  repostController,
  fetchAllReposts,
  repost_list,
  unsavePost,
  sendConnectionRequest,
  handleConnectionRequest,
  fetchAcceptedConnections,
  fetchAllConnectionRequests,
  fetchReels,
  delete_post,
  like_reel,
  comment_reel,
  retrievePost,
  delete_post_permanent,
  getDeletedPosts,
  shareUserPost,
  unlike_reel,
  reel_likes_list,
  comment_reel_alls,
  shareUserReel,
  blockedPost,
  post_data,
  trending,
  tag_list,
  reel_data,
  saveReel,
  unsaveReel,
  fetchSavedReels,
  blockedPostReel,
  connectioncount,
  views,
  reel_views,
  comment_delete,
  addCommentSettings,
  deleteRepost,
  comment_reel_delete,
  paginationPost,
  paginationTrandingPost,
  organizationPost,
  individualPost,
  getAllHashtags,
  getPostsByHashtag,
};
