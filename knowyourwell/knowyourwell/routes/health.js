/**
 * health.js
 * 
 * This module provides routes for health checks regarding the status of the application.
 */

const express = require("express");

function createHealthRouter() {
  const router = express.Router();

  router.get("/heartbeat", (req, res) => {
    res.status(200).send("");
  });

  router.get("/health", (req, res) => {
    res.status(200).send("Healthy");
  });

  return router;
}

module.exports = createHealthRouter;