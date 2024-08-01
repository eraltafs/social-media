// routes/notification.js
const User = require("../models/User");
const Notification = require("../models/notification");

const getAll = async (req, res) => {
  const { recipient } = req.params;

  try {
    // Fetch recipient's details to get the unread notifications and following list
    const recipientUser = await User.findById(recipient).select(
      "unReadNotification following"
    );
    if (!recipientUser) {
      return res.status(404).json({ message: "Recipient not found" });
    }

    const totalUnreadNotification = recipientUser.unReadNotification || 0;

    // Fetch notifications for the recipient
    const notifications = await Notification.find({ recipient })
      .select("-senderdata")
      .populate({
        path: "sender",
        select: "username type name avatar followers following",
      })
      .sort({ createdAt: -1 })
      .lean();

    // Iterate through the notifications to check follow status
    const sortedFinalResponse = notifications.map((notification) => {
      const { sender, type } = notification;
      if (type === "follow" && sender) {
        const senderId = sender._id.toString();
        const recipientId = recipient.toString();

        notification.follow_check =
          recipientUser.following.includes(senderId) ||
          sender.followers.includes(recipientId);
      }

      notification.sender = {
        _id: sender._id,
        username: sender.username,
        type: sender.type,
        avatar: sender.avatar,
        name: sender.name,
      };

      return notification;
    });

    return res.status(200).json({
      success: 1,
      message: "success",
      totalUnreadNotification,
      notifications: sortedFinalResponse,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return res.status(500).json({ message: "Error fetching notifications" });
  }
};

// Get unread notifications for a user
const getUnread = async (req, res) => {
  try {
    const recipient = req.params.recipient;
    const unreadNotifications = await Notification.find({
      recipient,
      isRead: false,
    });

    res.status(200).json(unreadNotifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching notifications" });
  }
};

// making seen notification
const doSeenNotification = async (req, res) => {
  const { post, type, recipient, senderId } = req.body;

  try {
    if (post) {
      await Notification.updateMany(
        { post, type, recipient },
        { isRead: true }
      );
    } else {
      await Notification.updateMany(
        { type, recipient, sender: senderId },
        { isRead: true }
      );
    }
    const user = await User.findById(recipient).select("unReadNotification");
    if (user.unReadNotification > 0) {
      await User.findByIdAndUpdate(recipient, {
        $inc: { unReadNotification: -1 },
      });
    }
    return res
      .status(200)
      .json({ success: 1, message: "Notification seen success" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error while seen notifications" });
  }
};

// making seen all notification
const doSeenAllNotification = async (req, res) => {
  const { recipient } = req.body;

  try {
    await Notification.updateMany({ recipient }, { isRead: true });
    await User.findByIdAndUpdate(recipient, { unReadNotification: 0 });
    res
      .status(200)
      .json({ success: 1, message: "All Notification seen success" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error while seen all notifications" });
  }
};
module.exports = {
  getAll,
  getUnread,
  doSeenNotification,
  doSeenAllNotification,
};
