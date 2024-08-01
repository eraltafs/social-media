require("dotenv").config();
const crypto = require("crypto");


const User = require("../models/User");
const chat = require("../models/chatModel");
const Message = require("../models/Message");
const chatModel = require("../models/chatModel");
const BlockedUser = require("../models/BlockedUser");
const ConnectionRequest = require("../models/connectionRequestModel");

const secretKey = process.env.secretKey;
const { calculateAgeOfPost } = require("../utils/timeUtils");
// Function to encrypt the content
const encryptContent = (content, secretKey) => {
  // Ensure secretKey is a Buffer of the correct length
  const key = crypto.createHash("sha256").update(secretKey).digest();

  const iv = crypto.randomBytes(16); // Generate a random IV (Initialization Vector)
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(content, "utf-8", "hex");
  encrypted += cipher.final("hex");
  return { encrypted, iv: iv.toString("hex") }; // Return both the encrypted content and the IV
};

// Function to decrypt the content
const decryptContent = (encryptedContent, secretKey, iv) => {
  const key = crypto.createHash("sha256").update(secretKey).digest();
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    key,
    Buffer.from(iv, "hex")
  );
  let decrypted = decipher.update(encryptedContent, "hex", "utf-8");
  decrypted += decipher.final("utf-8");
  return decrypted;
};


const getAllUser = async (req, res) => {
  try {
    const { userId } = req.body;

    const blockedUserData = await BlockedUser.findOne({ blockedBy: userId });
    const blockedUser = new Set(blockedUserData?.blockedUser || []);

    const userData = await User.findById(userId);
    const userFollower = new Set(userData?.followers || []);
    const userFollowing = new Set(userData?.following || []);

    const connectionsSentByUser = await ConnectionRequest.find({
      sender_id: userId,
      status: "accepted",
    });

    const connectionsReceivedByUser = await ConnectionRequest.find({
      receiver_id: userId,
      status: "accepted",
    });

    const allConnections = [
      ...connectionsSentByUser,
      ...connectionsReceivedByUser,
    ];
    const uniqueConnectionUserIds = new Set(
      allConnections.flatMap((connection) =>
        connection.sender_id == userId
          ? [connection.receiver_id]
          : [connection.sender_id]
      )
    );

    const userIdSet = new Set([
      ...userFollower,
      ...userFollowing,
      ...uniqueConnectionUserIds,
    ]);

    if (!userIdSet.size) {
      return res.json({ success: 0, message: "No Followings or Followers" });
    }

    const allUsers = new Map();
    const userDetails = await User.find(
      { _id: { $in: Array.from(userIdSet) } },
      "username first_name last_name type avatar name"
    );

    userDetails.forEach((user) => {
      if (!blockedUser.has(user._id.toString())) {
        allUsers.set(user._id.toString(), {
          _id: user._id,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          type: user.type,
          avatar: user.avatar,
          name:user.name
        });
      }
    });

    const filterList = Array.from(allUsers.values());

    return res.status(200).send({ success: 1, data: filterList });
  } catch (error) {
    console.error(error);
    return res.json({ success: 0, message: "Error fetching user List" });
  }
};

const saveChat = async (req, res) => {
  try {
    const { chatId, senderId, recipientId, content } = req.body;

    if (!chatId) {
      return res.json({ success: 0, message: "Chat id not found" });
    }
    if (!senderId || !recipientId) {
      return res.json({ success: 0, message: "Sender or Recipient not found" });
    }
    if (!content) {
      return res.json({ success: 0, message: "Content is required" });
    }

    // Encrypt the chat content
    const { encrypted, iv } = encryptContent(content, secretKey);

    const chat = new Message({
      chat_id: chatId,
      sender: senderId,
      recipient: recipientId,
      content: encrypted,
      iv, // Store the IV along with the encrypted content
      timestamp: new Date(),
    });

    const newChat = await chat.save();
    const chatData = await chatModel.findOne({ _id: chatId });
    const updatedChat = await chatModel.updateOne(
      { _id: chatId },
      { $set: { lastUpdated: new Date() } }
    );
    if (chatData?.chatExists === false) {
      // Update the existing chat
      chatData.chatExists = true;
      await chatData.save();
    }

    return res
      .status(200)
      .send({ success: 1, message: "Chat inserted", data: newChat });
  } catch (error) {
    console.error("Error saving chats:", error);
    return res.json({ success: 0, message: "Error saving chats" });
  }
};


const getMessages = async (req, res) => {
  try {
    const { chatId, userId, anotherUserId } = req.body;

    if (!chatId) {
      return res.json({ success: 0, message: "chat id not found" });
    }

    let chatObject = await chat.findOne({ _id: chatId });

    if (!chatObject) {
      return res.json({ success: 0, message: "chat not found" });
    }

    const messages = await Message.find({ chat_id: chatId });

    const feedData = await Promise.all(
      messages.map(async (message) => {
        const decryptedContent = decryptContent(
          message.content,
          secretKey,
          message.iv
        ); // Pass the IV here

        const mergedPost = {
          chat_id: message.chat_id,
          sender: message.sender,
          recipient: message.recipient,
          content: decryptedContent,
          isRead: message.isRead,
          timestamp: calculateAgeOfPost(message.timestamp),
        };

        return mergedPost;
      })
    );

    const updateMessage = await Message.updateMany(
      { chat_id: chatId, sender: anotherUserId, isRead: false },
      { isRead: true }
    );

    return res.json({
      success: 1,
      message: "Successfully got all messages",
      data: feedData,
    });
  } catch (error) {
    console.error(error);
    return res.json({ success: 0, message: "Error fetching messages" });
  }
};

module.exports = {
  getAllUser,
  saveChat,
  getMessages,
};
