/**
 * landFeatures.js
 * 
 * This module provides routes for retrieving land feature information associated with wells
 * from the database. It defines a route to fetch land features based on a provided well ID.
 */

const express = require("express");

function createLandFeaturesRouter({ pool, sqlClient }) {
  if (!pool || !sqlClient) {
    throw new TypeError("The land-features router requires a pool and SQL client.");
  }

  const router = express.Router();

  router.get("/LandFeatures", async (req, res) => {
    try {
      const result = await pool
        .request()
        .input("well_id", sqlClient.Int, req.query.well_id)
        .query("SELECT * FROM dbo.tblLandFeature WHERE well_id = @well_id");

      res.status(200).json({ LandFeatures: result.recordset });
    } catch (error) {
      console.error(error);
      res.status(500).send("SERVER ERROR");
    }
  });

  return router;
}

module.exports = createLandFeaturesRouter;