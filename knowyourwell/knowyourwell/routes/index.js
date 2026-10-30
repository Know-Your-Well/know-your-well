/**
 * index.js
 * 
 * This module provides a function to create the main API router, which aggregates various sub-routers for different functionalities.
 */

const express = require("express");
const createAuthRouter = require("./auth.js");
const createDataRouter = require("./data.js");
const createHealthRouter = require("./health.js");
const createLandFeaturesRouter = require("./landFeatures.js");
const createSessionRouter = require("./session.js");
const createTooltipsRouter = require("./tooltips.js");
const createWellCodesRouter = require("./wellCodes.js");
const createWritesRouter = require("./writes.js");

function createApiRouter({ pool, sqlClient }) {
  const router = express.Router();
  router.use(createHealthRouter());
  router.use(createLandFeaturesRouter({ pool, sqlClient }));
  router.use(createSessionRouter());
  router.use(createTooltipsRouter({ pool }));
  router.use(createWellCodesRouter({ pool, sqlClient }));
  router.use(createDataRouter({ pool, sqlClient }));
  router.use(createWritesRouter({ pool, sqlClient }));
  router.use(createAuthRouter());
  return router;
}

module.exports = createApiRouter;
