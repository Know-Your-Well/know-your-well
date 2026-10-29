/**
 * session.js
 * 
 * This module provides routes for managing user sessions.
 */

const express = require("express");

function createSessionRouter() {
  const router = express.Router();

  router.get("/logout", (req, res) => {
    req.session.destroy((error) => {
      if (error) {
        console.error("Session destruction error:", error);
        return res.status(500).send("Could not log out, please try again.");
      }

      res.clearCookie("connect.sid");
      return res.status(200).json({ kywmem: "", displayn: "" });
    });
  });

  router.get("/userinfo", (req, res) => {
    if (req.session?.kywmem && req.session?.displayName) {
      return res
        .status(200)
        .json({ kywmem: req.session.kywmem, displayn: req.session.displayName });
    }

    return res.status(200).json({ kywmem: "", displayn: "" });
  });

  router.get("/createDevSession", (req, res) => {
    req.session.kywmem = "1";
    req.session.displayName = "EXAMPLE STUDENT";
    return res.status(200).json({ success: "success" });
  });

  return router;
}

module.exports = createSessionRouter;
