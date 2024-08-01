require("dotenv").config();
const cors = require("cors");
const path = require("path");
const express = require("express");
const admin = require("firebase-admin");


const indexRouter = require("./routes/index.js");
const { shortPagination } = require("./controllers/shortspagination.js");
const serviceAccount = require("./public/serviceAccountKeyFirebase.json");

require("./utils/db.js")();
require("./utils/cronJob");
const { setupSocket } = require("./utils/socket.js");
const { errHandler } = require("./utils/uploadAws.js");
const { logger, jsonResponse, sendResponse } = require("./utils/logger.js");

const PORT = process.env.PORT || 3000;

// initialize firebase admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.FIREBASE_PROJECT_ID,
});

const app = express();

// Middlewares
app.use(cors());
app.use(logger);
app.use(jsonResponse);
app.use(sendResponse);
app.use(errHandler);
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/.well-known/assetlinks.json", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "assetlinks.json"));
});

app.use("/", shortPagination);
app.use("/api/v1/", indexRouter);

const httpServer = require("http").createServer(app);
setupSocket(httpServer);

// Start the server
httpServer.listen(PORT, () => {
  console.log(`Server started on ${process.env.NODE_ENV} port ${PORT}`);
});
