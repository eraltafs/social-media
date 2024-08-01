const User = require("../models/User");
const ChatModel = require("../models/chatModel");
const Message = require("../models/Message");

const createChat = async (req, res) => {
  const { firstId, secondId } = req.body;
  try {
    if (firstId && secondId) {
      const chat = await ChatModel.findOne({
        members: { $all: [firstId, secondId] },
      });
      if (chat)
        return res
          .status(200)
          .send({ succcess: 1, message: "success", data: chat });
      const newChat = new ChatModel({
        members: [firstId, secondId],
        chatExists: false,
      });

      const response = await newChat.save();
      return res.status(201).send({ success: 1, data: response });
    }
    res.status(201).send({ succes: 0, message: "One of userId is missing" });
  } catch (error) {
    return res.json({ success: 0, message: "Error fetching user List" });
  }
};

const findUserChats = async (req, res) => {
  const { userId } = req.body;
  try {
    const chats = await ChatModel.find({ members: userId });

    if (!chats || chats.length === 0) {
      return res.status(401).json({ success: 0, message: "No Chats found" });
    }

    const chatArr = [];

    for (const chat of chats) {
      const otherUser = chat.members.find(id => id !== userId);
      const messages = await Message.find({ chat_id: chat._id });

      const unseenMessageCount = await Message.countDocuments({
        chat_id: chat._id,
        sender: otherUser,
        isRead: false,
      });

      if (messages.length > 0) {
        chatArr.push({
          chat_id: chat._id,
          lastUpdated: chat.lastUpdated,
          chatExists: chat.chatExists,
          otherUser: otherUser.toString(),
          unseenMessageCount,
        });
      }
    }

    if (chatArr.length > 0) {
      chatArr.sort((a, b) => b.lastUpdated - a.lastUpdated);

      const data = await Promise.all(chatArr.map(async (memberData) => {
        const chatMemberData = await User.findById(memberData.otherUser).select(
          "username avatar createdAt username first_name last_name isverified items online type"
        );
        const updatedChatMemberData = {
          ...chatMemberData.toObject(),
          items: chatMemberData.items[0].toString(),
        };

        return { ...memberData, chatMemberData: updatedChatMemberData };
      }));

      return res.status(200).json({ success: 1, message: "Chats found", data });
    } else {
      return res.status(401).json({ success: 0, message: "No Chats found with messages" });
    }
  } catch (error) {
    console.error("Error finding user chats:", error);
    return res.status(500).json({ success: 0, message: "Error finding user chats" });
  }
};



const findChat = async (req, res) => {
  const { firstId, secondId } = req.params;
  try {
    const chats = await ChatModel.find({
      members: { $in: [firstId, secondId] },
    });
    return res
      .status(200)
      .send({ success: 1, message: "Chat inserted", data: chats });
  } catch (error) {
    return res.json({ success: 0, message: "Error saving chats" });
  }
};

module.exports = {
  createChat,
  findUserChats,
  findChat,
};
