const User = require("../models/User");
const Notification = require("../models/notification");
const { getMessaging } = require("firebase-admin/messaging");
require("dotenv").config();

const sendInAppNotification = async (
  body,
  sender,
  recipient,
  type,
  senderdata,
  postId,
  postimage,
  postText,
  video,
  request_ID
) => {
  // Build the message object
  data = {
    sender,
    recipient,
    body,
    type,
    isRead: false,
    createdAt: new Date(),
    ...(postId && { post: postId }),
    ...(postimage && { postimage: postimage[0] }),
    ...(postText && { postText }),
    ...(video && { video }),
    request_ID,
  };

  try {
    let query;

    if (postId) {
      query = { recipient, type, post: postId };
    } else {
      query = { sender, recipient, type };
    }

    let existingNotification = await Notification.findOne(query);
    if (!existingNotification) {
      existingNotification = await Notification.create(data);
      await User.findByIdAndUpdate(recipient, {
        $inc: { unReadNotification: 1 },
      });
    } else {
      // Notification exists, update if isRead is false
      if (existingNotification.isRead) {
        await User.findByIdAndUpdate(recipient, {
          $inc: { unReadNotification: 1 },
        });
      }
      existingNotification = await Notification.findOneAndUpdate(query, data, {
        new: true,
      });
    }
  } catch (error) {
    console.error("Error sending in app notification:", error);
  }
};

const sendNotification = async (title, body, tokenList, type, postId) => {
  let dataUrl;

  if (postId && postId != null) {
    dataUrl = `${process.env.APPURL}/${type}/${postId}`;
  }

  const dataUrlString = JSON.stringify({ url: dataUrl });

  const message = {
    notification: {
      title,
      body,
    },
    tokens: tokenList,
    data: {
      url: dataUrlString, // Convert to string
    },
    apns: {
      payload: {
        aps: {
          sound: "default",
        },
      },
    },
  };

  try {
    const response = await getMessaging().sendEachForMulticast(message);
    console.log("Notification sent successfully:", response);
  } catch (error) {
    console.error("Error sending Notification:", error);
  }
};
module.exports = { sendInAppNotification, sendNotification };
