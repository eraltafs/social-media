const { s3Url, s3, bucketName } = require("../utils/awsConfig");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const moment = require("moment");
const { default: mongoose } = require("mongoose");

const User = require("../models/User");
const Group = require("../models/Group");
const Room = require("../models/Room");
const groupChat = require("../models/groupChat");
const groupPost = require("../models/groupPost");
const BlockedUser = require("../models/BlockedUser");
const groupInvitation = require("../models/groupInvitation");
const ConnectionRequest = require("../models/connectionRequestModel");

const { calculateAgeOfPost } = require("../utils/timeUtils");
const { sendNotification } = require("../utils/notification");
const { shuffle } = require("../utils/shuffle");
const { processAndUploadImage, uploadToS3 } = require("../utils/uploadAws");

const getConnectionStatus = async (userId, authorId) => {
  try {
    // Check if there is a connection request from the logged-in user to the post author
    const connectionRequestSent = await ConnectionRequest.findOne({
      sender_id: userId,
      receiver_id: authorId,
      status: "accepted", // Assuming accepted status means a connection is established
    });

    if (connectionRequestSent) {
      return "connected"; // The users are connected
    }

    // Check if there is a connection request from the post author to the logged-in user
    const connectionRequestReceived = await ConnectionRequest.findOne({
      sender_id: authorId,
      receiver_id: userId,
      status: "accepted",
    });

    if (connectionRequestReceived) {
      return "connected"; // The users are connected
    }

    // If there are no accepted connection requests, the users are not connected
    return "not_connected";
  } catch (error) {
    console.error("Error checking connection status:", error);
    return "error";
  }
};

async function fetchUserDataByFirebaseIds({ _id, userId }) {
  try {
    const user = await User.findOne({ _id });
    if (user) {
      const isFollowing = user.followers.includes(userId);
      return {
        username: user.username,
        items: user.items,
        avatar: user.avatar,
        first_name: user.first_name,
        last_name: user.last_name,
        isverified: user.isverified,
        type: user.type,
        following: isFollowing,
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
}

async function getUserDataByFirebaseId(_id) {
  try {
    const user = await User.findOne({ _id });
    if (user) {
      // Return only the relevant user data
      return {
        username: user.username,
        avatar: user.avatar,
        last_name: user.last_name,
        first_name: user.first_name,
        name: user.name,
        isverified: user.isverified,
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching comment user data:", error);
    return null;
  }
}
const deleteLocalFile = (filePath) => {
  console.time("deleteLocalFile");
  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.timeEnd("deleteLocalFile");
        console.error("Error deleting file:", err);
      } else {
        console.timeEnd("deleteLocalFile");
        console.log("File deleted successfully");

      }
    });
  }
};


const createGroup = async (req, res) => {
  const { userId, name, tagline } = req.body;
  const isCommunityGroup = userId === "65adf98c13119f90b3f655ae";
  const profilePhotoFile = req.file;
  
  try {
    const user = await User.findById(userId).select("username avatar joinedGroups status name");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.status === "Deactive") {
      return res.status(403).json({ message: "Your account is Deactive" });
    }

    let icon;
    if (profilePhotoFile?.fieldname === "profilePhoto") {
      icon = await uploadToS3(profilePhotoFile, "images", "image/jpeg", "avatar");
      deleteLocalFile(`${path.join(__dirname, "../upload/images")}/${profilePhotoFile.filename}`);
    }

    const members = [{ uid: userId, name: user.name, avatar: user.avatar }];
    const room = await Room.create({ members });

    const groupData = {
      name,
      icon,
      roomId: room._id,
      tagline,
      admin: [{ name: user.name, avatar: user.avatar, uid: user._id }],
      isCommunityGroup,
    };

    const group = await Group.create(groupData);
    return res.status(200).json({ Success: 1, message: "Group created successfully", group });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};


const getAllCommunityGroups = async (req, res) => {
  const { userId } = req.body;

  try {
    const search = req.query.search
      ? { name: { $regex: req.query.search, $options: "i" } }
      : {};

    const user = await User.findById(userId).select("joinedGroups");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const groups = await Group.find({
      ...search,
      _id: {
        $nin: user.joinedGroups.map((id) => new mongoose.Types.ObjectId(id)),
      },
      "admin.uid": { $nin: userId },
    }).lean();
    const allGroups = await Promise.all(
      groups.map(async (group) => {
        const room = await Room.findById(group.roomId);

        group.members = room.members.map((member) => member.uid);
        memberCount = group.members.length;
        const response = {
          ...group,
          memberCount,
        };
        return response;
      })
    );

    const shuffledGroups = shuffle(allGroups);

    return res.status(200).json({
      Success: 1,
      message: "Group fetched successfully",
      groups: shuffledGroups,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

const getMyCommunityGroups = async (req, res) => {
  const { user_id } = req.body;
  try {
    const groups = await Group.find({
      "admin.uid": { $in: user_id },
    }).lean();

    const allGroupsWithUpdates = await Promise.all(
      groups.map(async (group) => {
        // Fetch the room associated with the group
        const room = await Room.findById(group.roomId).lean();

        // Update group members from the room
        group.members = room.members.map((member) => member.uid);
        group.memberCount = group.members.length;

        // Optionally, fetch the latest post for the group to determine the latest activity
        const latestPost = await groupPost
          .findOne({ group_id: group._id.toString() })
          .sort({ updatedAt: -1 })
          .lean();

        const latestUpdateTime =
          latestPost && latestPost.updatedAt > room.updatedAt
            ? latestPost.updatedAt
            : room.updatedAt;

        return {
          ...group,
          latestUpdateTime,
        };
      })
    );

    // Sort the groups based on the latestUpdateTime
    const sortedGroups = allGroupsWithUpdates.sort(
      (a, b) => b.latestUpdateTime - a.latestUpdateTime
    );

    return res.status(200).json({
      Success: 1,
      message: "Group fetched successfully",
      groups: sortedGroups,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

const joinGroup = async (req, res) => {
  const { groupId, userId, main_user } = req.body;

  const title = "Joined Group";
  let body = "";
  try {
    const group = await Group.findById(groupId).select("roomId");
    const room = await Room.findById(group.roomId).select("members");
    const user = await User.findById(userId).select(
      "username avatar joinedGroups"
    );
    if (group && user) {
      if (room.members.some((member) => member.uid === userId)) {
        return res
          .status(409)
          .json({ sucess: 0, message: "User already a member" });
      }
      room.members.push({
        uid: userId,
        name: user.username,
        avatar: user.avatar,
      });
      user.joinedGroups.push(groupId);
      const updatedUser = await user.save();
      await room.save();

      const userInfo = await User.findById(main_user);
      body = `${userInfo?.first_name} added you in group`;

      if (!userInfo) {
        return res.json({ Success: 0, message: "User doesn't exist" });
      }

      const ownerData = await User.findById(userId);
      if (ownerData?.fcmTokenList) {
        const filteredTokenList = ownerData.fcmTokenList.filter(
          (token) => token != null
        );
        if (main_user !== userId) {
          sendNotification(title, body, filteredTokenList);
        }
      }
      return res.status(200).json({
        Success: 1,
        message: "Group joined successfully",
      });
    } else {
      return res
        .status(400)
        .json({ message: "Either group or user not found" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

const getMyjoinedGroups = async (req, res) => {
  const { user_id } = req.body;
  try {
    const user = await User.findById(user_id).select("joinedGroups");

    if (!user) {
      return res.status(404).json({
        Success: 0,
        message: "User not found",
      });
    }

    const joinedGroupIds = user.joinedGroups || [];
    const groups = await Group.find({
      _id: { $in: joinedGroupIds },
    }).lean();

    const allGroupsWithUpdates = await Promise.all(
      groups.map(async (group) => {
        const room = await Room.findById(group.roomId).lean();

        if (room) {
          group.members = room.members.map((member) => member.uid);
          group.memberCount = group.members.length;

          // Optionally, fetch the latest post for the group to determine the latest activity
          const latestPost = await groupPost
            .findOne({ group_id: group._id.toString() })
            .sort({ updatedAt: -1 })
            .lean();

          // Determine the latest update time between the room and the latest post
          const latestUpdateTime =
            latestPost && latestPost.updatedAt > room.updatedAt
              ? latestPost.updatedAt
              : room.updatedAt;

          // Add this info to the group object
          return {
            ...group,
            latestUpdateTime,
          };
        } else {
          return null; // Handle the case where room is not found
        }
      })
    );

    // Sort the groups based on the latestUpdateTime
    const sortedGroups = allGroupsWithUpdates
      .filter((group) => group !== null)
      .sort((a, b) => b.latestUpdateTime - a.latestUpdateTime);

    return res.status(200).json({
      Success: 1,
      message: "Groups fetched successfully",
      groups: sortedGroups,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

const sendGroupInvitation = async (req, res) => {
  try {
    const { sender_id, receiver_ids, groupId } = req.body;

    // Ensure receiver_ids is always an array
    const normalizedReceiverIds = Array.isArray(receiver_ids)
      ? receiver_ids
      : [receiver_ids];

    const group = await Group.findById(groupId).populate("roomId");
    const members = group.roomId.members;
    const title = "group invitation";
    const userInfo = await User.findById(sender_id);
    const body = `${userInfo?.first_name} sent you a group invitation`;

    if (members.some((member) => normalizedReceiverIds.includes(member.uid))) {
      return res.json({
        success: 0,
        message: "One or more users are already members of the group",
      });
    }

    // Check if there is an existing request
    const existingRequest = await groupInvitation.findOne({
      sender_id,
      receiver_ids: { $in: normalizedReceiverIds },
      groupId,
    });

    if (existingRequest) {
      const missingReceiverIds = normalizedReceiverIds.filter(
        (receiver_id) => !existingRequest.receiver_ids.includes(receiver_id)
      );

      if (missingReceiverIds.length) {
        existingRequest.receiver_ids.push(...missingReceiverIds);
        await existingRequest.save();

        // Fetch FCM tokens for missingReceiverIds
        const fcmTokenArr = [];
        await Promise.all(
          missingReceiverIds.map(async (receiverId) => {
            try {
              const receiverData = await User.findById(receiverId);
              if (receiverData?.fcmTokenList) {
                receiverData.fcmTokenList.forEach((token) => {
                  fcmTokenArr.push(token);
                });
              }
            } catch (error) {
              console.error(
                `Error fetching data for receiver ${receiverId}:`,
                error
              );
            }
          })
        );
        const filteredTokenList = fcmTokenArr.filter((e) => e != null);
        sendNotification(title, body, filteredTokenList);
        return res.json({
          success: 1,
          message: "Group invitation sent successfully",
        });
      } else {
        return res.json({
          success: 0,
          message: "Group invitation already sent",
        });
      }
    }

    // If no existing request, create a new one with status 'pending'
    const newRequest = new groupInvitation({
      sender_id,
      receiver_ids: normalizedReceiverIds,
      groupId,
    });

    await newRequest.save();

    // Fetch FCM tokens for all receiver_ids
    const fcmTokenArr = [];
    await Promise.all(
      normalizedReceiverIds.map(async (receiverId) => {
        try {
          const receiverData = await User.findById(receiverId);
          if (receiverData?.fcmTokenList) {
            receiverData.fcmTokenList.forEach((token) => {
              fcmTokenArr.push(token);
            });
          }
        } catch (error) {
          console.error(
            `Error fetching data for receiver ${receiverId}:`,
            error
          );
        }
      })
    );
    const filteredTokenList = fcmTokenArr.filter((e) => e != null);
    sendNotification(title, body, filteredTokenList);

    return res.json({
      success: 1,
      message: "Group invitation sent successfully",
    });
  } catch (error) {
    console.error("Error sending group invitation:", error);
    return res.status(500).json({ success: 0, message: "Server error" });
  }
};

const getGroupInvitation = async (req, res) => {
  try {
    const { user_id } = req.params;
    const GroupInvitations = await groupInvitation
      .find({
        receiver_ids: { $in: user_id },
      })
      .populate({
        path: "sender_id",
        select: "username first_name last_name avatar isverified type",
      });

    return res.json({
      success: 1,
      message: "All group invitation fetched successfully",
      GroupInvitations: GroupInvitations,
    });
  } catch (error) {
    console.error("Error fetching group invitation:", error);
    return res.status(500).json({ success: 0, message: "Server error" });
  }
};

const handleGroupInvitation = async (req, res) => {
  try {
    const { user_id, groupId, action } = req.body;

    const group = await Group.findById(groupId).populate("roomId");
    const room = await Room.findById(group.roomId).select("members");
    if (group && user) {
      if (room.members.some((member) => member.uid === user_id)) {
        getGroupInvitation.receiver_ids =
          getGroupInvitation.receiver_ids.filter(
            (receiver_id) => receiver_id != user_id
          );
        if (!getGroupInvitation.receiver_ids.length) {
          await groupInvitation.findByIdAndDelete(request_id);
        } else {
          await getGroupInvitation.save();
        }
        return res.status(403).json({ message: "User already a member" });
      }
      room.members.push({
        uid: user_id,
        name: user.username,
        avatar: user.avatar,
      });
      user.joinedGroups.push(getGroupInvitation.groupId);
      await user.save();
      await room.save();

      getGroupInvitation.receiver_ids = getGroupInvitation.receiver_ids.filter(
        (receiver_id) => receiver_id != user_id
      );
      if (!getGroupInvitation.receiver_ids.length) {
        await groupInvitation.findByIdAndDelete(request_id);
      } else {
        await getGroupInvitation.save();
      }
      return res.status(200).json({
        Success: 1,
        message: "Group joined successfully",
      });
    } else {
      return res
        .status(400)
        .json({ message: "Either group or user not found" });
    }

    // getGroupInvitation.receiver_ids = getGroupInvitation.receiver_ids.filter(
    //   (receiver_id) => receiver_id != user_id
    // );
    // if (!getGroupInvitation.receiver_ids.length) {
    //   await groupInvitation.findByIdAndDelete(request_id);
    // } else {
    //   await getGroupInvitation.save();
    // }

    return res.json({
      success: 1,
      message: `Added in group`,
    });
  } catch (error) {
    console.error("Error handling connection request:", error);
    return res.status(500).json({ success: 0, message: "Server error" });
  }
};

const exitGroup = async (req, res) => {
  const { user_id, group_id } = req.body;
  try {
    // Fetch the group, user, and room data in parallel
    const [group, user] = await Promise.all([
      Group.findById(group_id),
      User.findById(user_id).select("joinedGroups"),
    ]);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }
    const isAdmin = group.admin.some((admin) => admin.uid.equals(user_id));
    if (isAdmin) {
      return res.json({
        success: 0,
        message: `Admin can't leave the group`,
      });
    }
    if (!user.joinedGroups.includes(group_id)) {
      return res.json({
        success: 0,
        message: `user is not the member of the group`,
      });
    }
    const room = await Room.findById(group.roomId);
    room.members = room.members.filter((member) => member.uid !== user_id);
    user.joinedGroups.pull(group_id);

    await Promise.all([user.save(), room.save()]);
    return res.json({
      success: 1,
      message: `group exited`,
    });
  } catch (error) {
    // Handle any errors and send an error response if necessary
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

const removeMember = async (req, res) => {
  const { user_id, member_id, group_id } = req.body;
  try {
    // Fetch the group, user, and room data in parallel
    const [group, member] = await Promise.all([
      Group.findById(group_id),
      User.findById(member_id).select("joinedGroups"),
    ]);

    if (!member) {
      return res.status(404).json({ error: "member not found" });
    }
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }
    const isAdmin = group.admin.some((admin) => admin.uid.equals(user_id));
    if (!isAdmin) {
      return res.status(401).json({
        success: 0,
        message: `You are not admin, so not authorised`,
      });
    }
    if (!member.joinedGroups.includes(group_id)) {
      res.status(404).json({
        success: 0,
        message: `user is not the member of the group`,
      });
    }
    const room = await Room.findById(group.roomId);
    room.members = room.members.filter((member) => member.uid !== member_id);
    member.joinedGroups.pull(group_id);

    await Promise.all([member.save(), room.save()]);
    return res.json({
      success: 1,
      message: `member removed from group`,
    });
  } catch (error) {
    // Handle any errors and send an error response if necessary
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

const images = async (req, res) => {
  try {
    const { user_id, text, group_id } = req.body;
    const { file } = req;
    const [group, user] = await Promise.all([
      Group.findById(group_id),
      User.findById(user_id).select("username avatar"),
    ]);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }
    group.room = await Room.findById(group.roomId);
    group.members = group.room.members;
    if (!group.members.some((member) => member.uid === user_id)) {
      return res.json({
        success: 0,
        message: `User is not a member of the group`,
      });
    }
    // Check if both text and image are empty
    if (!text && !file) {
      return res.status(400).json({
        success: 0,
        message: "Either 'text' or 'image' should be provided",
      });
    }

    let image = null;

    

    if (file) {
      if (file.fieldname !== "images") {
        return res.status(400).json({ success: 0, message: "Invalid file" });
      }
      try {
        image = await processAndUploadImage(file, "posts", 800, 100);
        deleteLocalFile(
          `${path.join(__dirname, "../upload/images")}/${file.filename}`
        );
      } catch (err) {
        console.log("error uploading image in group post", err);
        return res
          .status(500)
          .json({ success: 0, message: "Error uploading image" });
      }
    }
    const newPost = new groupPost({
      group_id,
      username: user.username,
      user_id,
      avatar: user.avatar,
      text,
      image,
    });

    await newPost.save();
    res.json({
      success: 1,
      newPost: newPost,
    });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ success: 0, message: "Server error" });
  }
};

const getPosts = async (req, res) => {
  const { user_id, group_id } = req.body;
  try {
    const posts = await groupPost.find({ group_id }).sort({ createdAt: -1 });

    if (posts.length > 0) {
      const mergedPosts = [];
      for (const post of posts) {
        const detailedPost = await groupPost.findById(post._id).populate({
          path: "user_id",
          select:
            "username first_name last_name avatar items isverified type followers",
        });
        const _id = detailedPost.user_id._id;
        const likes_check = detailedPost.likes.includes(_id);
        const likes_id = detailedPost.likes;
        const likes_users = await User.find(
          { _id: { $in: likes_id } },
          { password: 0 }
        );
        const user = await User.findById(user_id);
        const likedUsersWithFollowingStatus = likes_users.map((likedUser) => {
          // if (likedUser.status === "Deactive") {
          //   return {type:0};
          // }

          return {
            ...likedUser.toObject(),
            isFollowing: user.following.includes(likedUser._id.toString()),
          };
        });
        const isFollowing = detailedPost.user_id.followers.includes(user_id);
        const connectionStatus = await getConnectionStatus(_id, _id);
        const formattedDateTime = calculateAgeOfPost(detailedPost.createdAt);
        const mergedPost = {
          postId: detailedPost._id,
          userId: _id,
          postText: detailedPost.text,
          postImage: detailedPost.image,
          comments: detailedPost.comments.length,
          likes: detailedPost.likes.length,
          createdAt: detailedPost.createdAt,
          likes_check: likes_check,
          likedUsers: likedUsersWithFollowingStatus,
          username: detailedPost.user_id.username,
          items: detailedPost.user_id.items,
          avatar: detailedPost.user_id.avatar,
          first_name: detailedPost.user_id.first_name,
          last_name: detailedPost.user_id.last_name,
          following: isFollowing,
          isverified: detailedPost.user_id.isverified,
          type: detailedPost.user_id.type,
          isconnection: connectionStatus,
          formattedDateTime,
        };
        mergedPosts.push(mergedPost);
      }
      res.json({
        Success: 1,
        message: "Posts fetched successfully",
        feed: mergedPosts,
      });
    } else {
      res.json({ Success: 0, message: "No posts found" });
    }
  } catch (error) {
    console.error("Error fetching trending posts:", error);
    res.status(500).json({ Success: 0, message: "Server error" });
  }
};
const comment_delete = async (req, res) => {
  const { postId, commentId } = req.body;

  try {
    // Find the post by ID
    const post = await groupPost.findById(postId);

    // Check if the post exists
    if (!post) {
      return res.status(404).json({ success: 0, message: "Post not found" });
    }

    // Find the index of the comment in the post's comments array
    const commentIndex = post.comments.findIndex(
      (comment) => comment._id.toString() === commentId
    );

    // Check if the comment exists
    if (commentIndex === -1) {
      return res.status(404).json({ success: 0, message: "Comment not found" });
    }

    // Remove the comment from the post's comments array
    post.comments.splice(commentIndex, 1);

    // Save the updated post
    await post.save();

    return res.json({ success: 1, message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return res
      .status(500)
      .json({ success: 0, message: "Internal server error" });
  }
};
const updateGroup = async (req, res) => {
  const { user_id, group_id, name, tagline } = req.body;
  const profilePhotoFile = req.file;

  let imageURL;
  let filePath;
  let key;

  try {
    const [group, user] = await Promise.all([
      Group.findById(group_id),
      User.findById(user_id).select("username"),
    ]);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const isAdmin = group.admin.some((admin) => admin.uid.equals(user_id));
    if (!isAdmin) {
      return res.status(401).json({
        success: 0,
        message: `You are not admin, so not authorised`,
      });
    }

    if (profilePhotoFile) {
      // Update fields only if the file is present
      const profilePhotoUrl = `${profilePhotoFile.filename}`;
      imageURL = profilePhotoUrl;

      if (profilePhotoFile.fieldname === "profilePhoto") {
        filePath = `${path.join(__dirname, "../upload/images")}/${
          profilePhotoFile.filename
        }`;
        key = `avatar/${profilePhotoFile.filename}`;

        const fileBuffer = fs.readFileSync(filePath);

        // Update the S3 bucket with the new profile photo
        const params = {
          Bucket: bucketName,
          Key: key,
          Body: fileBuffer,
          ACL: "public-read",
          ContentType: "image/jpeg",
        };

        s3.putObject(params, (err, data) => {
          if (error) {
            console.error("Error uploading to S3:", err.message, err.code);
            return res
              .status(500)
              .json({ success: 0, message: "Error uploading to S3" });
          } else {
            console.log("File uploaded successfully:", data);
            // Additional logic after successful upload
          }
        });

        // Delete file from local
        fs.unlinkSync(filePath);
      }
    }

    const data = {};
    if (name) data.name = name;
    if (imageURL) data.icon = imageURL;
    if (tagline) data.tagline = tagline;
    await Group.findByIdAndUpdate(group_id, data);
    return res
      .status(200)
      .json({ Success: 1, message: "Group updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

const deleteGroup = async (req, res) => {
  const { user_id, group_id } = req.body;
  try {
    const [group, user] = await Promise.all([
      Group.findById(group_id),
      User.findById(user_id).select("username"),
    ]);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const isAdmin = group.admin.some((admin) => admin.uid.equals(user_id));
    if (!isAdmin) {
      return res.status(401).json({
        success: 0,
        message: `You are not admin, so not authorised`,
      });
    }

    await Group.findByIdAndDelete(group_id);
    await Room.findByIdAndDelete(group.roomId);
    await groupPost.deleteMany({ group_id });

    return res
      .status(200)
      .json({ Success: 1, message: "Group deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};
const like = async (req, res) => {
  try {
    const { postId, userId } = req.body;

    const post = await groupPost.findById(postId);
    if (!post) {
      return res.json({ Success: 0, message: "Post not found" });
    }
    if (post.user_id === userId) {
      // Check if the user has already liked the post
      if (post.likes && post.likes.includes(userId)) {
        return res.json({
          Success: 0,
          message: "User already liked this post",
        });
      }
      // Push the user ID into the likes array
      post.likes.push(userId);

      // Save the updated post
      await post.save();
      const _id = post.user_id;
      const isliked = post.likes.includes(userId);
      const userData = await fetchUserDataByFirebaseIds({ _id, userId });
      const postdata = {
        likes_check: isliked,
        comment: post.comments.length,
        likes: post.likes.length,
        following: userData.following,
      };

      res.json({
        Success: 1,
        message: "Post liked successfully",
        postdata: postdata,
      });
    } else {
      const fcmTokenArr = [];
      const title = "Liked Post";
      let body = "";
      const userInfo = await User.findById(userId);
      body = `${userInfo?.first_name} has liked your post`;
      if (!userInfo) {
        return res.json({ Success: 0, message: "User doesn't exist" });
      }

      const ownerData = await User.findById(post.user_id);
      if (ownerData?.fcmTokenList) {
        const filteredTokenList = ownerData.fcmTokenList.filter(
          (token) => token != null
        );

        // Check if the user has already liked the post
        if (post.likes && post.likes.includes(userId)) {
          return res.json({
            Success: 0,
            message: "User already liked this post",
          });
        }
        // Push the user ID into the likes array
        post.likes.push(userId);

        // Save the updated post
        await post.save();
        const _id = post.user_id;
        const isliked = post.likes.includes(userId);
        const userData = await fetchUserDataByFirebaseIds({ _id, userId });
        const postdata = {
          likes_check: isliked,
          comment: post.comments.length,
          likes: post.likes.length,
          following: userData.following,
        };
        sendNotification(title, body, filteredTokenList, postId);
        res.json({
          Success: 1,
          message: "Post liked successfully",
          postdata: postdata,
        });
      }
    }
  } catch (error) {
    console.error("Error liking post:", error);
    res.status(500).json({ message: "Error liking post" });
  }
};

const likes_list = async (req, res) => {
  const post_id = req.body.post_id;
  const user_id = req.body.user_id;

  try {
    const post = await groupPost.findById(post_id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    console.log(post);

    const likes_id = post.likes;
    const likes_users = await User.find(
      { _id: { $in: likes_id } },
      { password: 0 }
    );

    // Fetch the user to check if they are following each user in the likes array
    const user = await User.findById(user_id);

    // Add isFollowing property to each liked user
    const likedUsersWithFollowingStatus = likes_users.map((likedUser) => {
      return {
        user_id: likedUser._id,
        username: likedUser.username,
        avatar: likedUser.avatar,
        first_name: likedUser.first_name,
        last_name: likedUser.last_name,
        name: likedUser.name,
        isverified: likedUser.isverified,
        type: likedUser.type,
        isFollowing: user.following.includes(likedUser._id.toString()),
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

const unlike = async (req, res) => {
  try {
    const { postId, userId } = req.body;

    // Find the post by ID
    const post = await groupPost.findById(postId);
    if (!post) {
      return res.json({ Success: 0, message: "Post not found" });
    }

    // Check if the user has liked the post
    if (!(post.likes && post.likes.includes(userId))) {
      return res.json({ Success: 0, message: "User has not liked this post" });
    }

    // Remove the user ID from the likes array
    post.likes = post.likes.filter((likeUserId) => likeUserId !== userId);

    // Save the updated post
    await post.save();
    const _id = post.user_id;
    const isliked = post.likes.includes(userId);
    const userData = await fetchUserDataByFirebaseIds({ _id, userId });
    const postdata = {
      likes_check: isliked,
      comment: post.comments.length,
      likes: post.likes.length,
      following: userData.following,
    };
    res.json({
      Success: 1,
      message: "Post unliked successfully",
      postdata: postdata,
    });
  } catch (error) {
    console.error("Error unliking post:", error);
    res.json({ Success: 0, message: "Error unliking post" });
  }
};

const comment = async (req, res) => {
  const { text, postId, user_id } = req.body;
  try {
    const post = await groupPost.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const newComment = {
      text,
      user_id,
      comment: post.comments.length,
      likes: post.likes.length,
      createdAt: new Date(), // Add the creation time for the comment
      // formattedCreatedAt: formattedCommentDate
    };

    post.comments.push(newComment);
    await post.save();
    const formattedCommentDate = calculateAgeOfPost(newComment.createdAt);

    // Send the response with the formatted comment creation time
    res.json({
      Success: 1,
      message: "Comment added successfully",
      comment: { ...newComment, formattedCreatedAt: formattedCommentDate },
    });
  } catch (error) {
    res.json({ comment: [], Success: 0, message: "Error fetching feed" });
    console.error(error);
  }
};

const comment_alls = async (req, res) => {
  try {
    const { postId, page, limit } = req.body;
    const pageInt = parseInt(page) || 1;
    const limitInt = parseInt(limit) || 15;
    const skip = (pageInt - 1) * limitInt;

    // Fetch the post by ID
    const post = await groupPost.findById(postId);
    // Validate if the post exists
    if (!post) {
      return res.status(404).json({ Success: 0, message: "Post not found" });
    }

    // Fetch comments with pagination
    const comments = post.comments
      .slice(skip, skip + limitInt) // Apply pagination
      .map(async (comment) => {
        if (comment.user_id) {
          const commentUserData = await getUserDataByFirebaseId(
            comment.user_id
          );
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
              type: commentUserData.type,
              avatar: commentUserData.avatar,
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
    res.json({ comments: validComments, Success: 1, message: "Success" });
  } catch (error) {
    res
      .status(500)
      .json({ comments: [], Success: 0, message: "Error fetching comments" });
    console.error(error);
  }
};

const getGroup = async (req, res) => {
  const { user_id, group_id } = req.body;
  try {
    const group = await Group.findById(group_id).lean();
    if (!group) {
      return res.status(404).json({ success: 0, error: "Group not found" });
    }
    const adminuser = await User.findById(group.admin[0].uid).select(
      "first_name last_name items type username avatar name"
    );

    group.admin = adminuser;
    group.room = await Room.findById(group.roomId);
    if (group.room) {
      const updatedRoom = {
        ...group.room.toObject(),
        createdAt: moment(group.room.createdAt).format("DD-MM-YYYY"),
      };
      group.room = updatedRoom;
    }

    group.members = [];

    for (const member of group.room.members) {
      const currentID = member.uid;
      const user = await User.findById(currentID).select(
        "first_name last_name name username items type"
      );
      if (user) {
        group.members.push({
          first_name: user.first_name,
          last_name: user.last_name,
          username: user.username,
          name:user.name,
          items: user.items,
          uid: currentID,
          type: user.type,
          avatar: member.avatar,
        });
      }
    }

    const chats = await groupChat.find({ roomId: group.roomId.toString() });

    const posts = await groupPost.find({ group_id }).sort({ createdAt: -1 });

    const mergedPosts = [];
    for (const post of posts) {
      const detailedPost = await groupPost.findById(post._id).populate({
        path: "user_id",
        select:
          "username first_name last_name avatar items isverified type followers",
      });
      const _id = detailedPost.user_id._id;
      const likes_check = detailedPost.likes.includes(user_id);
      const likes_id = detailedPost.likes;
      const likes_users = await User.find(
        { _id: { $in: likes_id } },
        { password: 0 }
      );
      const user = await User.findById(user_id);
      const likedUsersWithFollowingStatus = likes_users.map((likedUser) => {
        // if (likedUser.status === "Deactive") {
        //   return {type:0};
        // }

        return {
          ...likedUser.toObject(),
          isFollowing: user.following.includes(likedUser._id.toString()),
        };
      });
      const isFollowing = detailedPost.user_id.followers.includes(user_id);
      const connectionStatus = await getConnectionStatus(_id, _id);
      const formattedDateTime = calculateAgeOfPost(detailedPost.createdAt);
      const mergedPost = {
        postId: detailedPost._id,
        userId: _id,
        postText: detailedPost.text,
        postImage: detailedPost.image,
        comments: detailedPost.comments.length,
        likes: detailedPost.likes.length,
        createdAt: detailedPost.createdAt,
        likes_check: likes_check,
        likedUsers: likedUsersWithFollowingStatus,
        username: detailedPost.user_id.username,
        items: detailedPost.user_id.items[0],
        avatar: detailedPost.user_id.avatar,
        first_name: detailedPost.user_id.first_name,
        last_name: detailedPost.user_id.last_name,
        following: isFollowing,
        isverified: detailedPost.user_id.isverified,
        type: detailedPost.user_id.type,
        isconnection: connectionStatus,
        createdAtformet: formattedDateTime,
      };

      mergedPosts.push(mergedPost);
    }
    // if (group.members.some((member) => member.userId === user_id)) {
    if (group.members.some((member) => member.uid === user_id)) {
      return res.status(200).json({
        success: 1,
        message: "success",
        group,
        chats,
        chatsCount: chats.length,
        posts: mergedPosts,
        isMember: true,
      });
    }
    return res.status(200).json({
      success: 1,
      message: "success",
      group,
      chats,
      chatsCount: chats.length,
      posts: mergedPosts,
      isMember: false,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

const handleMessage = async (senderId, roomId, message) => {
  try {
    const room = await Room.findById(roomId);
    const user = await User.findById(senderId).select(
      "username avatar first_name last_name"
    );
    const time = new Date();
    if (room) {
      const chat = await groupChat.create({
        roomId: roomId,
        senderId: senderId,
        senderName: `${user.first_name} ${user.last_name || ""}`,
        avatar: user.avatar,
        chatType: "message",
        message: message,
        time: time,
      });
      room.lastMessage.chatType = "message";
      room.lastMessage.message = message;
      room.lastMessage.time = time;
      await room.save();
      const response = {};
      response.message = message;
      response.senderId = senderId;
      response.senderName = `${user.first_name} ${user.last_name || ""}`;
      response.avatar = user.avatar;
      response.time = time;
      response.roomId = roomId;
      return response;
    }
  } catch (error) {
    console.error(error);
  }
};

const getAllUser = async (req, res) => {
  try {
    const { userId, groupId } = req.body;

    // Fetch blocked user IDs
    const blockedUserData = await BlockedUser.findOne({ blockedBy: userId });
    const blockedUserIds = new Set(blockedUserData?.blockedUser || []);

    // Fetch user data
    const [userData, groupData] = await Promise.all([
      User.findById(userId),
      Group.findById(groupId).populate("roomId"),
    ]);

    if (!groupData) {
      return res.json({ success: 0, message: "Group Not Found" });
    }

    const groupMembers = groupData.roomId.members.map((member) => member.uid);

    const userFollower = userData?.followers || [];
    const userFollowing = userData?.following || [];

    // Fetch accepted connections
    const connections = await ConnectionRequest.find({
      $or: [{ sender_id: userId }, { receiver_id: userId }],
      status: "accepted",
    });

    // Extract unique user IDs from connections
    const uniqueConnectionUserIds = new Set(
      connections.flatMap((connection) =>
        connection.sender_id == userId
          ? [connection.receiver_id]
          : [connection.sender_id]
      )
    );

    // Combine unique user IDs from followers, following, and accepted connections
    const userIdList = [
      ...new Set([
        ...userFollower,
        ...userFollowing,
        ...uniqueConnectionUserIds,
      ]),
    ];

    if (!userIdList.length) {
      return res.json({ success: 0, message: "No Followings or Followers" });
    }

    // Fetch user details for userIdList
    const userDetailsPromises = userIdList.map(async (id) => {
      if (groupMembers.includes(id) || blockedUserIds.has(id.toString())) {
        return null;
      }
      const userDetails = await User.findById(id);
      return userDetails
        ? {
            _id: userDetails._id,
            username: userDetails.username,
            first_name: userDetails.first_name,
            last_name: userDetails.last_name,
            name: userDetails.name,
            email: userDetails.email,
            avatar: userDetails.avatar,
            items: userDetails.items[0],
            isverified: userDetails.isverified,
            type: userDetails.type,
          }
        : null;
    });

    const userDetails = await Promise.all(userDetailsPromises);
    const filterList = userDetails.filter((user) => user !== null);

    return res.status(200).send({ success: 1, data: filterList });
  } catch (error) {
    console.error(error);
    return res.json({ success: 0, message: "Error fetching user List" });
  }
};

const shareGroup = async (req, res) => {
  try {
    const { group_id } = req.body;

    if (!group_id) {
      return res
        .status(400)
        .json({ success: 0, message: "Group id not provided" });
    }

    const userData = await Group.findOne({ _id: group_id });

    if (!userData) {
      return res.status(404).json({ success: 0, message: "Group not found" });
    }

    const profileLink = `${process.env.APPURL}/viewGroup/${group_id}`;

    return res.status(200).json({
      success: 1,
      message: "Successfully copied",
      link: profileLink,
      data: userData,
    });
  } catch (error) {
    console.error("Error fetching requests:", error);
    return res.status(500).json({ success: 0, message: "Server error" });
  }
};

module.exports = {
  createGroup,
  getAllCommunityGroups,
  getMyCommunityGroups,
  joinGroup,
  getMyjoinedGroups,
  sendGroupInvitation,
  getGroupInvitation,
  handleGroupInvitation,
  exitGroup,
  likes_list,
  removeMember,
  images,
  getPosts,
  updateGroup,
  deleteGroup,
  like,
  unlike,
  comment,
  comment_alls,
  getGroup,
  handleMessage,
  shareGroup,
  getAllUser,
  comment_delete,
};
