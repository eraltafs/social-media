const morgan = require("morgan");

morgan.token("reqBody", (req, res) => {
  try {
    return JSON.parse(req.body);
  } catch (error) {
    return req.body;
  }
});

morgan.token("resBody", (req, res) => {
  try {
    return JSON.parse(res.locals.responseBody);
  } catch (error) {
    return res.locals.responseBody;
  }
});

morgan.token("request-headers", (req, res) => {
  try {
    return JSON.parse(req.headers);
  } catch (error) {
    return req.headers;
  }
});

const logFormat = (tokens, req, res) => {
  const statusValue = tokens.status(req, res);
  let statusString = `${statusValue} ❌`;
  if (statusValue === "200" || statusValue === "201") {
    statusString = `${statusValue} 🟢`;
  }
  return JSON.stringify(
    {
      date: new Date(
        new Date(tokens.date(req, res, "iso")).getTime() + 5.5 * 60 * 60 * 1000
      ).toISOString(),
      method: tokens.method(req, res),
      url: tokens.url(req, res),
      status: statusString,
      contentLength: tokens.res(req, res, "content-length"),
      responseTime: `${tokens["response-time"](req, res)} ms`,
      requestHeaders: tokens["request-headers"](req, res),
      params: req.params,
      query: req.query,
      files: req.file ? req.file : req.files ? req.files : null,
      requestBody: tokens["reqBody"](req, res),
      responseBody: tokens["resBody"](req, res),
      _s: "————————————————————————————————————————————————————————————————",
    },
    null,
    2
  ).replace(/\\/g, "");
};

const logger = morgan(logFormat, { stream: process.stdout });


const jsonResponse = (req, res, next) => {
  const originalJson = res.json;
  res.json = function (body) {
    res.locals.responseBody = body;
    originalJson.call(this, body);
  };
  next();
};

const sendResponse = (req, res, next) => {
  const originalSend = res.send;
  res.send = function (body) {
    res.locals.responseBody = body;
    originalSend.call(this, body);
  };
  next();
};
module.exports = {logger,jsonResponse,sendResponse};
