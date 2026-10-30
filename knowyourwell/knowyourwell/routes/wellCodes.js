/**
 * wellCodes.js
 * 
 * This module provides routes for managing well codes.
 */

const express = require("express");

async function queryRecordset(pool, query, inputs = []) {
  let request = pool.request();

  for (const [name, type, value] of inputs) {
    request = request.input(name, type, value);
  }

  const result = await request.query(query);
  return result.recordset;
}

function createWellCodesRouter({ pool, sqlClient }) {
  if (!pool || !sqlClient) {
    throw new TypeError("The well-codes router requires a pool and SQL client.");
  }

  const router = express.Router();

  router.get("/getwellcode", async (req, res) => {
    try {
      const rows = await queryRecordset(
        pool,
        "SELECT wi_wellcode FROM dbo.TblWellInfo WHERE well_id = @well_id",
        [["well_id", sqlClient.Int, req.query.well_id]],
      );

      return res.status(200).json({ wellcode: rows });
    } catch (error) {
      console.error(error);
      return res.status(500).send("SERVER ERROR");
    }
  });

  router.get("/newwellcode", async (req, res) => {
    try {
      const schoolId = req.session?.kywmem;
      if (!schoolId) {
        return res.status(400).json({ error: "No school ID found in session." });
      }

      const schools = await queryRecordset(
        pool,
        "SELECT sch_code FROM dbo.tblSchool WHERE school_id = @school_id",
        [["school_id", sqlClient.Int, schoolId]],
      );

      if (!schools.length) {
        return res.status(404).json({ error: "School not found." });
      }

      const schoolCode = schools[0].sch_code;
      const wells = await queryRecordset(
        pool,
        "SELECT MAX(wi_wellcode) AS MAXWELLCODE FROM dbo.tblWellInfo WHERE wi_wellcode LIKE @school_code",
        [["school_code", sqlClient.NVarChar, `${schoolCode}%`]],
      );

      const previousCode = wells[0]?.MAXWELLCODE;
      if (!previousCode) {
        return res.status(200).json({ wellcode: `${schoolCode}001` });
      }

      const match = previousCode.match(/^([a-zA-Z]*)(\d+)$/);
      if (!match) {
        return res.status(500).send("Invalid existing well code.");
      }

      const [, prefix, numberText] = match;
      const nextNumber = Number(numberText) + 1;
      const nextCode = prefix + nextNumber.toString().padStart(numberText.length, "0");

      return res.status(200).json({ wellcode: nextCode });
    } catch (error) {
      console.error(error);
      return res.status(500).send("SERVER ERROR");
    }
  });

  return router;
}

module.exports = createWellCodesRouter;
