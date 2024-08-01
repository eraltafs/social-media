const socketIo = require("socket.io");
const User = require("../models/User");
const { handleMessage } = require("../controllers/group");
const clients = {};
const appOnlineUsers = {};
const activeUsers = {}; // Define activeUsers
const appRoomId = "000e00ab0d000eca0000ad00";

function setupSocket(httpServer) {
  const io = socketIo(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Connected:", socket.id);

    socket.on("signin", (id) => {
      if (typeof id === "string") {
        console.log(`${id} has signed in`);
        clients[id] = socket;
        console.log("Connected Clients:", Object.keys(clients));
      } else {
        console.error("Invalid signin request");
      }
    });
  });

  io.of("/message").on("connection", (socket) => {
    console.log("Connected: ", socket.id);

    socket.on("online", async ({ senderId }) => {
      if (!senderId) {
        socket.emit("onlineError", "Invalid input for signin");
        return;
      }

      socket.join(appRoomId);
      appOnlineUsers[socket.id] = { senderId, appRoomId };

      console.log({ senderId, appRoomId });
      await User.findByIdAndUpdate(
        senderId,
        { online: true },
        { new: true, upsert: true }
      );

      const usersInApp = Object.values(appOnlineUsers)
        .filter((user) => user.appRoomId === appRoomId)
        .map((user) => user.senderId);
      
      io.of("/message").emit("appOnlineUsers", usersInApp);
    });

    socket.on("signin", ({ senderId, roomId }) => {
      if (!senderId || !roomId) {
        socket.emit("signinError", "Invalid input for signin");
        return;
      }

      socket.join(roomId);
      activeUsers[socket.id] = { senderId, roomId };
      console.log({ senderId, roomId });

      const usersInGroup = Object.values(activeUsers)
        .filter((user) => user.roomId === roomId)
        .map((user) => user.senderId);
      io.of("/message").to(roomId).emit("activeUsers", usersInGroup);
    });

    socket.on("message", async (msg) => {
      console.log("Received Message:", msg);
      const { senderId, roomId } = activeUsers[socket.id];
      const { message } = msg;
      if (typeof message === "string") {
        const chat = await handleMessage(senderId, roomId, message);
        console.log(chat);
        io.of("/message").to(roomId).emit("message", chat);
      } else {
        console.error("Invalid message format");
      }
    });

    socket.on("disconnect", async () => {
      if (appOnlineUsers[socket.id]) {
        const { senderId, appRoomId } = appOnlineUsers[socket.id];
        delete appOnlineUsers[socket.id];
        console.log(senderId, " left the room : ", appRoomId);

        const usersInApp = Object.values(appOnlineUsers)
          .filter((user) => user.appRoomId === appRoomId)
          .map((user) => user.senderId);
        await User.findByIdAndUpdate(
          senderId,
          { online: false },
          { new: true, upsert: true }
        );

        io.of("/message").emit("appOnlineUsers", usersInApp);
      }

      if (activeUsers[socket.id]) {
        delete activeUsers[socket.id];
      } else {
        console.log("User Left");
      }
    });
  });
}

module.exports = { setupSocket };
