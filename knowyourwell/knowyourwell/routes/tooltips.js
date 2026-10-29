/**
 * tooltips.js
 * 
 * This module provides routes for retrieving tooltip information from the database.
 */

const express = require("express");

function createTooltipsRouter({ pool }) {
  if (!pool) {
    throw new TypeError("The tooltips router requires a pool.");
  }

  const router = express.Router();

  router.get("/tooltips", async (req, res) => {
    try {
      const [tooltipResult, tooltipImageResult] = await Promise.all([
        pool.request().query("SELECT * FROM dbo.tblTooltip"),
        pool.request().query("SELECT * FROM dbo.tblTooltipImage"),
      ]);

      return res.status(200).json({
        tooltip: tooltipResult.recordset,
        tooltipImage: tooltipImageResult.recordset,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).send("SERVER ERROR");
    }
  });

  return router;
}

module.exports = createTooltipsRouter;
