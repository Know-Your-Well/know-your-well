/**
 * data.js
 * 
 * This module provides routes for handling data retrieval and manipulation.
 */

const express = require("express");

async function recordset(pool, sqlClient, query, inputs = []) {
  let request = pool.request();
  for (const [name, type, value] of inputs) {
    request = request.input(name, type, value);
  }
  const result = await request.query(query);
  return result.recordset;
}

function createDataRouter({ pool, sqlClient }) {
  if (!pool || !sqlClient) throw new TypeError("Data router requires a pool and SQL client.");
  const router = express.Router();

  router.get("/Wells", async (req, res, next) => {
    try {
      const schoolId = req.session?.kywmem;
      if (!schoolId) return next(new Error("No school ID found in session."));
      const filterBy = req.query.filterBy || {};
      const allowedColumns = new Set([
        "county_id", "nrd_id", "wi_aquiferclass", "wi_aquifertype",
        "wi_welltype", "wi_wellcasematerial", "wi_smelltaste", "wi_welldry",
      ]);
      const conditions = ["school_id = @school_id"];
      const inputs = [["school_id", sqlClient.Int, schoolId]];
      let inputNumber = 0;
      const addInput = (type, value) => {
        const name = `filter${++inputNumber}`;
        inputs.push([name, type, value]);
        return `@${name}`;
      };
      for (const [column, filter] of Object.entries(filterBy)) {
        if (!filter || filter === "-1") continue;
        if (column === "search") {
          conditions.push(`wi_wellname LIKE ${addInput(sqlClient.NVarChar, `%${filter}%`)}`);
        } else if (column === "minLat") {
          conditions.push(`wi_estlatitude >= ${addInput(sqlClient.Decimal(8, 3), filter)}`);
        } else if (column === "maxLat") {
          conditions.push(`wi_estlatitude <= ${addInput(sqlClient.Decimal(8, 3), filter)}`);
        } else if (column === "minLon") {
          conditions.push(`wi_estlongitude >= ${addInput(sqlClient.Decimal(8, 3), filter)}`);
        } else if (column === "maxLon") {
          conditions.push(`wi_estlongitude <= ${addInput(sqlClient.Decimal(8, 3), filter)}`);
        } else if (allowedColumns.has(column)) {
          conditions.push(`${column} = ${addInput(sqlClient.Int, filter)}`);
        }
      }
      const sortBy = req.query.sortBy;
      const allowedSorts = new Set(["wi_wellname", "wi_wellcode", "county_id", "nrd_id"]);
      let query;
      if (sortBy === "field_activity") {
        query = `SELECT w.* FROM dbo.tblWellInfo w LEFT JOIN (SELECT well_id, MAX(fa_datecollected) newest FROM dbo.tblFieldActivity GROUP BY well_id) fa ON w.well_id=fa.well_id WHERE ${conditions.join(" AND ")} ORDER BY fa.newest DESC, w.wi_wellcode ASC`;
      } else {
        query = `SELECT * FROM dbo.tblWellInfo WHERE ${conditions.join(" AND ")} ORDER BY ${allowedSorts.has(sortBy) ? sortBy : "wi_wellname"}`;
      }
      const rows = await recordset(pool, sqlClient, query, inputs);
      return res.status(200).json({ Wells: rows });
    } catch (error) { return next(error); }
  });

  router.get("/csvqueries", async (req, res) => {
    try {
      const schoolId = req.session?.kywmem;
      if (!schoolId) return res.status(400).json({ error: "No school ID found in session." });
      const rows = await recordset(pool, sqlClient,
        `SELECT dbo.tblSchool.sch_name, dbo.tblWellInfo.wi_wellcode, dbo.tblWellInfo.wi_wellname,
         dbo.tblWellInfo.wi_registration_number, dbo.tblWellInfo.wi_dnr_well_id,
         dbo.tblFieldActivity.fa_latitude, dbo.tblFieldActivity.fa_longitude,
         dbo.tblFieldActivity.fa_weather, dbo.tblFieldActivity.fa_datacollector,
         dbo.tblFieldActivity.fa_observation, dbo.tblFieldActivity.fa_datecollected,
         dbo.tblClassroomLab.cl_ammonia, dbo.tblClassroomLab.cl_calciumhardness,
         dbo.tblClassroomLab.cl_chloride, dbo.tblClassroomLab.cl_bacteria,
         dbo.tblClassroomLab.cl_copper, dbo.tblClassroomLab.cl_iron,
         dbo.tblClassroomLab.cl_manganese, dbo.tblClassroomLab.cl_nitrate,
         dbo.tblWaterScienceLab.wsl_samplecode, dbo.tblWaterScienceLab.wsl_ph,
         dbo.tblWaterScienceLab.wsl_conductivity, dbo.tblWaterScienceLab.wsl_calciumhardness,
         dbo.tblWaterScienceLab.wsl_no3no2n, dbo.tblWaterScienceLab.wsl_nh4n,
         dbo.tblWaterScienceLab.wsl_bromide, dbo.tblWaterScienceLab.wsl_chloride,
         dbo.tblWaterScienceLab.wsl_fluoride, dbo.tblWaterScienceLab.wsl_orthophosphate,
         dbo.tblWaterScienceLab.wsl_sulfate, dbo.tblWaterScienceLab.wsl_arsenic,
         dbo.tblWaterScienceLab.wsl_magnesium, dbo.tblWaterScienceLab.wsl_dateentered
         FROM dbo.tblSchool
         INNER JOIN dbo.tblWellInfo ON dbo.tblSchool.school_id=dbo.tblWellInfo.school_id
         LEFT JOIN dbo.tblFieldActivity ON dbo.tblWellInfo.well_id=dbo.tblFieldActivity.well_id
         LEFT JOIN dbo.tblClassroomLab ON dbo.tblFieldActivity.fieldactivity_id=dbo.tblClassroomLab.fieldactivity_id
         LEFT JOIN dbo.tblWaterScienceLab ON dbo.tblFieldActivity.fieldactivity_id=dbo.tblWaterScienceLab.fieldactivity_id
         WHERE dbo.tblSchool.school_id=@school_id`, [["school_id", sqlClient.Int, schoolId]]);
      return res.status(200).json({ Data: rows });
    } catch (error) { console.error(error); return res.status(500).json({ error: "Internal Server Error" }); }
  });

  router.get("/offlineSnapshot", async (req, res) => {
    const schoolId = Number.parseInt(req.session?.kywmem, 10);
    if (Number.isNaN(schoolId)) {
      return res.status(401).json({ error: "Not logged in" });
    }

    const wells = "SELECT well_id FROM dbo.tblWellInfo WHERE school_id = @school";
    const snapshotQuery = (query) =>
      recordset(pool, sqlClient, query, [["school", sqlClient.Int, schoolId]]);

    try {
      const [wellRows, fieldActivities, classLabs, waterScienceLabs, images] = await Promise.all([
        snapshotQuery("SELECT * FROM dbo.tblWellInfo WHERE school_id = @school"),
        snapshotQuery(`SELECT * FROM dbo.tblFieldActivity WHERE well_id IN (${wells})`),
        snapshotQuery(`SELECT cl.* FROM dbo.tblClassroomLab cl
          JOIN dbo.tblFieldActivity fa ON cl.fieldactivity_id = fa.fieldactivity_id
          WHERE fa.well_id IN (${wells})`),
        snapshotQuery(`SELECT wsl.* FROM dbo.tblWaterScienceLab wsl
          JOIN dbo.tblFieldActivity fa ON wsl.fieldactivity_id = fa.fieldactivity_id
          WHERE fa.well_id IN (${wells})`),
        snapshotQuery(`SELECT * FROM dbo.tblImage WHERE well_id IN (${wells})`),
      ]);

      return res.status(200).json({
        Wells: wellRows,
        FieldActivities: fieldActivities,
        ClassLabs: classLabs,
        WaterScienceLabs: waterScienceLabs,
        Images: images,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).send("Snapshot failed.");
    }
  });

  router.get("/allImageMetadata", async (req, res) => {
    const schoolId = req.session?.kywmem;
    if (!schoolId) return res.status(401).json({ error: "Not logged in" });
    try {
      const rows = await recordset(pool, sqlClient,
        `SELECT w.school_id,s.sch_name,w.well_id,w.wi_wellcode,w.wi_wellname,i.im_type,
         i.im_latitude,i.im_longitude,i.im_filename,i.im_datacollector,i.im_observation,i.im_datecollected
         FROM dbo.tblWellInfo w INNER JOIN dbo.tblImage i ON w.well_id=i.well_id
         INNER JOIN dbo.tblSchool s ON w.school_id=s.school_id WHERE w.school_id=@school_id`,
        [["school_id", sqlClient.Int, schoolId]]);
      return res.status(200).json({ Data: rows });
    } catch (error) { console.error(error); return res.status(500).send("SERVER ERROR"); }
  });

  const definitions = [
    ["/GetWellInfo", "well_id", "SELECT * FROM dbo.tblWellInfo WHERE well_id = @well_id", "WellInfo"],
    ["/receive", "well_id", "SELECT * FROM dbo.tblWellInfo WHERE well_id = @well_id", "WellInfo"],
    ["/previousentries", "well_id", "SELECT fa.fieldactivity_id, fa.fa_datecollected, cl.classlab_id, cl.cl_datecollected FROM dbo.tblFieldActivity fa LEFT JOIN dbo.tblClassroomLab cl ON fa.fieldactivity_id=cl.fieldactivity_id WHERE fa.well_id=@well_id", "FieldList"],
    ["/previousentriesWithWSL", "well_id", "SELECT fa.fieldactivity_id, fa.fa_datecollected, cl.classlab_id, cl.cl_datecollected, wsl.watersciencelab_id, wsl.wsl_dateentered FROM dbo.tblFieldActivity fa LEFT JOIN dbo.tblClassroomLab cl ON fa.fieldactivity_id=cl.fieldactivity_id LEFT JOIN dbo.tblWaterScienceLab wsl ON fa.fieldactivity_id=wsl.fieldactivity_id WHERE fa.well_id=@well_id", "ExpandedFieldList"],
    ["/GetFieldEntriesByWell", "well_id", "SELECT fieldactivity_id, fa_datecollected FROM dbo.tblFieldActivity WHERE well_id=@well_id", "MinimalFieldList"],
    ["/previousimages", "well_id", "SELECT image_id, im_datecollected FROM dbo.tblImage WHERE well_id=@well_id", "ImageList"],
    ["/GetFieldEntry", "fieldactivity_id", "SELECT * FROM dbo.tblFieldActivity WHERE fieldactivity_id=@fieldactivity_id", "FieldActivity"],
    ["/GetLabEntry", "classlab_id", "SELECT * FROM dbo.tblClassRoomLab WHERE classlab_id=@classlab_id", "ClassLabEntry"],
    ["/GetClassLabEntryByFieldActivity", "fieldactivity_id", "SELECT * FROM dbo.tblClassroomLab WHERE fieldactivity_id=@fieldactivity_id", "ClassLabEntries"],
    ["/GetWaterScienceLabEntry", "watersciencelab_id", "SELECT * FROM dbo.tblWaterScienceLab WHERE watersciencelab_id=@watersciencelab_id", "WaterScienceLabEntry"],
    ["/GetWaterScienceLabEntryByFieldActivity", "fieldactivity_id", "SELECT * FROM dbo.tblWaterScienceLab WHERE fieldactivity_id=@fieldactivity_id", "WaterScienceLabEntries"],
    ["/GetImage", "image_id", "SELECT * FROM dbo.tblImage WHERE image_id=@image_id", "Image"],
  ];
  for (const [path, parameter, query, responseKey] of definitions) {
    router.get(path, async (req, res) => {
      try {
        const rows = await recordset(pool, sqlClient, query, [[parameter, sqlClient.Int, req.query[parameter]]]);
        return res.status(200).json({ [responseKey]: rows });
      } catch (error) { console.error(error); return res.status(500).send("Query does not execute."); }
    });
  }

  return router;
}

module.exports = createDataRouter;
