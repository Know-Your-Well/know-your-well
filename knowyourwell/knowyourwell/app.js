/**
 * app.js
 * 
 * This module provides a function to create the Express application and configure its middleware.
 */

const express = require("express");
const session = require("express-session");
const cors = require("cors");
const path = require("path");

const assignEntity = require("./middleware/saml.js");
const createApiRouter = require("./routes/index.js");

function createApp({ pool, sqlClient } = {}) {
  if (!pool) {
    throw new TypeError("createApp requires a database pool.");
  }

  const app = express();

  app.use(
    session({
      secret: process.env.SESSION_SECRET || "your_secret_key",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false, httpOnly: false },
    }),
  );
  app.use(cors({ origin: "*" }));
  app.options("*", cors());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(assignEntity);
  app.use(createApiRouter({ pool, sqlClient }));

  const webRoot = path.resolve(__dirname, "wwwroot");
  app.use(express.static(webRoot));
  app.get("*", (req, res) => {
    res.sendFile(path.join(webRoot, "index.html"));
  });

  return app;
}

module.exports = createApp;