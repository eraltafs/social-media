const fs = require("fs");
const path = require("path");
const { PutObjectCommand } = require("@aws-sdk/client-s3");

const newsModel = require("../models/News");

const { shuffle } = require("../utils/shuffle");
const { calculateAgeOfPost } = require("../utils/timeUtils");
const { bucketName, s3Client } = require("../utils/awsConfig");

const postNews = async (req, res) => {
  try {
    const { user_id, heading, category, details } = req.body;
    const { file } = req;

    let news_images = null;

    // Check if an image file is provided
    if (file) {
      news_images = `${file.filename}`; // Profile URL

      let filePath;
      let key;

      if (file.fieldname !== "news_images") {
        return res.status(400).json({ success: 0, message: "Invalid file" });
      }

      if (file.fieldname === "news_images") {
        filePath = `${path.join(__dirname, "../upload/images")}/${
          file.filename
        }`;
        key = `news_images/${file.filename}`;
      }

      const fileBuffer = fs.readFileSync(filePath); // Update with your local file path
      const params = {
        Bucket: bucketName,
        Key: key,
        Body: fileBuffer,
        ACL: "public-read",
        ContentType: "image/jpeg",
      };
      s3Client.send(new PutObjectCommand(params)).then(
        (data) => {
          console.log("File uploaded successfully:", data);
    
         
    
          return res.status(200).json({ success: 1, message: "File uploaded successfully" });
        },
        (err) => {
          console.error("Error uploading to S3:", err);
          return res.status(500).json({ success: 0, message: "Error uploading to S3" });
        }
      );

      // Delete file from local
      fs.unlinkSync(filePath);
    }

    const newNews = new newsModel({
      user_id,
      heading,
      news_images, // Include the profile URL in the new post
      category,
      details,
    });
    await newNews.save();
    return res.json({ success: 1, message: "Success", data: newNews });
  } catch (error) {
    console.error("Error creating post:", error);
    return res.status(500).json({ success: 0, message: "Server error" });
  }
};
const fetchNews = async (req, res) => {
  try {
    const { user_id } = req.body;
    const posts = await newsModel
      .aggregate([
        {
          $project: {
            _id: 1,
          },
        },
        { $limit: 50 },
      ])
      .exec();

    if (posts.length > 0) {
      const mergedPosts = [];
      for (const post of posts) {
        const detailedPost = await newsModel.findById(post._id).populate({
          path: "user_id",
          select: "username first_name last_name avatar items isverified type ",
        });
        const liked = detailedPost.likes.includes(user_id);
        const formattedDateTime = calculateAgeOfPost(detailedPost.createdAt);
        const mergedPost = {
          postId: detailedPost._id,
          userId: detailedPost.user_id._id,
          details: detailedPost.details,
          news_images: detailedPost.news_images,
          likes: detailedPost.likes.length,
          likes_check: liked,
          category: detailedPost.category,
          view_count: detailedPost.views.length,
          heading: detailedPost.heading,
          username: detailedPost.user_id.username,
          items: detailedPost.user_id.items,
          avatar: detailedPost.user_id.avatar,
          first_name: detailedPost.user_id.first_name,
          last_name: detailedPost.user_id.last_name,
          ExactDate: formattedDateTime,
        };
        mergedPosts.push(mergedPost);
      }
      const shuffledOtherPosts = shuffle([...mergedPosts]);
      res.json({
        Success: 1,
        message: "Posts fetched successfully",
        feed: mergedPosts,
      });
    } else {
      res.json({ Success: 0, message: "No posts found" });
    }
  } catch (error) {
    console.error("Error creating post:", error);
    return res.status(500).json({ success: 0, message: "Server error" });
  }
};
const shareNews = async (req, res) => {
  const { news_id } = req.body;
  try {
    if (!news_id) {
      return res.status(500).json({ success: 0, message: "news id not found" });
    }
    const newsData = await newsModel.findOne({ _id: news_id });
    if (!newsData) {
      return res.status(404).json({ success: 0, message: "News not found" });
    }
    const postLink = `${process.env.APPURL}/viewNews/${news_id}`;
    return res.status(200).json({
      success: 1,
      message: "Successfully copied",
      link: postLink,
      data: newsData,
    });
  } catch (error) {
    console.error("Error fetching requests:", error);
    return res.status(500).json({ success: 0, message: "Server error" });
  }
};
const deleteNews = async (req, res) => {
  try {
    const newsId = req.body.newsId;

    // Check if the post exists
    const existingNews = await newsModel.findById(newsId);
    if (!existingNews) {
      return res.status(404).json({ Success: 0, message: "News not found" });
    }

    // Delete the post
    await newsModel.deleteOne({ _id: newsId });

    return res.json({ Success: 1, message: "News deleted successfully" });
  } catch (error) {
    console.error("Error deleting News:", error);
    return res.status(500).json({ Success: 0, message: "Error deleting News" });
  }
};

const news_data = async (req, res) => {
  try {
    const { news_id } = req.body;
    const news = await newsModel.find({ _id: news_id }).populate({
      path: "user_id",
      select: "username first_name last_name avatar items isverified type ",
    });
    if (!news) {
      return res.json({ Success: 0, message: "No news found" });
    }

    const feedData = await Promise.all(
      news.map(async (newsModel) => {
        const formattedDateTime = calculateAgeOfPost(newsModel.createdAt);
        const liked = newsModel.likes.includes(user_id);
        const mergedPost = {
          newsId: newsModel._id,
          userId: newsModel.user_id._id,
          username: newsModel.user_id.username,
          first_name: newsModel.user_id.first_name,
          last_name: newsModel.user_id.last_name,
          avatar: newsModel.user_id.avatar,
          news_images: newsModel.news_images,
          heading: newsModel.heading,
          category: newsModel.category,
          likes: newsModel.likes.length,
          likes_check: liked,
          details: newsModel.details,
          createdAt: formattedDateTime,
        };
        return mergedPost;
      })
    );
    const filteredFeedData = feedData.filter((news) => news !== null);
    // Step 6: Send Adjusted Feed Data to the Client
    return res.json({ feed: filteredFeedData, Success: 1, message: "Success" });
  } catch (error) {
    return res.json({ feed: [], Success: 0, message: "Error fetching feed" });
  }
};

const like = async (req, res) => {
  try {
    const postId = req.body.news_id;
    const userId = req.body.user_id;

    const post = await newsModel.findById(postId);
    if (!post) {
      return res.json({ Success: 0, message: "News not found" });
    }
    // Check if the user has already liked the post
    if (post.likes && post.likes.includes(userId)) {
      return res.json({ Success: 0, message: "User already liked this post" });
    }
    // Push the user ID into the likes array
    post.likes.push(userId);

    // Save the updated post
    await post.save();
    const _id = post.user_id;
    const isliked = post.likes.includes(userId);
    // const userData = await fetchUserDataByFirebaseIds({ _id, userId });
    const postdata = {
      likes_check: isliked,
      // comment: post.comments.length,
      likes: post.likes.length,
      // following: userData.following,
    };

    return res.json({
      Success: 1,
      message: "News liked successfully",
      postdata: postdata,
    });
  } catch (error) {
    console.error("Error liking news:", error);
    res.status(500).json({ message: "Error liking News" });
  }
};
const views = async (req, res) => {
  try {
    const { news_id, user_id } = req.body;

    // Fetch the post by ID
    const post = await newsModel.findById(news_id);
    const responses = {
      _id: post._id,
      user_id: post.user_id,
      createdAt: post.createdAt,
      views: post.views.length,
      likes: post.likes.length,
      // comments: post.comments.length,
    };
    // Increment the views
    // post.views += 1;

    if (post.views && post.views.includes(user_id)) {
      return res.json(responses);
    }
    // Push the user ID into the likes array
    post.views.push(user_id);

    // Save the updated post
    await post.save();

    // Create a response object with the desired fields
    const response = {
      _id: post._id,
      user_id: post.user_id,
      createdAt: post.createdAt,
      views: post.views.length,
      likes: post.likes.length,
      // comments: post.comments.length,
    };

    return res.json(response);
  } catch (error) {
    console.error("Error fetching post:", error);
    return res.status(500).json({ message: "Error fetching post" });
  }
};

module.exports = {
  postNews,
  fetchNews,
  shareNews,
  deleteNews,
  news_data,
  like,
  views,
};
