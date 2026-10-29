/**
 * writes.js
 * 
 * This module provides routes for handling data insertion operations.
 */

const express = require("express");

function createWritesRouter({ pool, sqlClient }) {
  if (!pool || !sqlClient) throw new TypeError("Writes router requires a pool and SQL client.");
  const router = express.Router();

  const insert = (query, parameters) => async (req, res) => {
    const transaction = pool.transaction();
    let rolledBack = false;
    try {
      await transaction.begin();
      transaction.on("rollback", () => { rolledBack = true; });
      const request = pool.request(transaction);
      for (const [name, type, value] of parameters(req.body)) request.input(name, type, value);
      await request.query(query);
      await transaction.commit();
      return res.status(200).send("Values Inserted");
    } catch (error) {
      console.error(error);
      if (!rolledBack && transaction.begin) {
        try { await transaction.rollback(); } catch (rollbackError) { console.error(rollbackError); }
      }
      return res.status(500).send("Query does not execute.");
    }
  };

  const featureDefinitions = {
    crop: ["Crop Land", "crop"], pasture: ["Barn Yard/Pasture", "pasture"],
    septic: ["Septic Tank", "septic"], surfaceWater: ["Surface Water", "surfaceWater"],
  };
  for (const [suffix, [featureType, bodyPrefix]] of Object.entries(featureDefinitions)) {
    router.post(`/feature/${suffix}`, insert(
      "INSERT INTO dbo.tblLandFeature(well_id,lf_type,lf_latitude,lf_longitude,lf_genlatitude,lf_genlongitude,lf_datecollected,lf_datacollector,lf_comments) VALUES(@well_id,@lf_type,@lf_latitude,@lf_longitude,@lf_genlatitude,@lf_genlongitude,@lf_datecollected,@lf_datacollector,@lf_comments)",
      (body) => [
        ["well_id", sqlClient.Int, body.well_id], ["lf_type", sqlClient.NVarChar, featureType],
        ["lf_latitude", sqlClient.Decimal(10, 5), body[`${bodyPrefix}Latitude`]],
        ["lf_longitude", sqlClient.Decimal(10, 5), body[`${bodyPrefix}Longitude`]],
        ["lf_genlatitude", sqlClient.Decimal(8, 3), body[`${bodyPrefix}GenLatitude`]],
        ["lf_genlongitude", sqlClient.Decimal(8, 3), body[`${bodyPrefix}GenLongitude`]],
        ["lf_datacollector", sqlClient.NVarChar, body.observer],
        ["lf_comments", sqlClient.NVarChar, body[`${bodyPrefix}Comments`]],
        ["lf_datecollected", sqlClient.DateTime, body.datecollected],
      ],
    ));
  }

  router.post("/api/insert", insert(
    "INSERT INTO dbo.tblFieldActivity(well_id,fa_latitude,fa_longitude,fa_genlatitude,fa_genlongitude,fa_weather,fa_wellcovercondition,fa_wellcoverdescription,fa_topography,fa_surfacerunoff,fa_pooling,fa_groundwatertemp,fa_ph,fa_conductivity,fa_datacollector,fa_observation,fa_datecollected) VALUES(@well_id,@fa_latitude,@fa_longitude,@fa_genlatitude,@fa_genlongitude,@weather,@wellcovercondition,@wellcoverdescription,@topography,@runOff,@pooling,@temp,@ph,@conductivity,@name,@observation,@dateentered)",
    (body) => [
      ["well_id", sqlClient.Int, body.well_id], ["fa_latitude", sqlClient.Decimal(10, 5), body.fa_latitude],
      ["fa_longitude", sqlClient.Decimal(10, 5), body.fa_longitude], ["fa_genlatitude", sqlClient.Decimal(8, 3), body.fa_genlatitude],
      ["fa_genlongitude", sqlClient.Decimal(8, 3), body.fa_genlongitude], ["weather", sqlClient.NVarChar, body.weather],
      ["wellcovercondition", sqlClient.NVarChar, body.wellcovercondition], ["wellcoverdescription", sqlClient.NVarChar, body.wellcoverdescription],
      ["topography", sqlClient.NVarChar, body.topography], ["runOff", sqlClient.NVarChar, body.surfacerunoff],
      ["pooling", sqlClient.NVarChar, body.pooling], ["temp", sqlClient.Decimal(8, 2), body.groundwatertemp],
      ["ph", sqlClient.Decimal(8, 2), body.ph], ["conductivity", sqlClient.Decimal(8, 2), parseFloat(body.conductivity)],
      ["name", sqlClient.NVarChar, body.name], ["observation", sqlClient.NVarChar, body.observations],
      ["dateentered", sqlClient.DateTime, body.datecollected],
    ],
 ));

  router.post("/createclasslab", insert(
    "INSERT INTO dbo.tblClassroomLab(fieldactivity_id,cl_ammonia,cl_calciumhardness,cl_chloride,cl_bacteria,cl_copper,cl_iron,cl_manganese,cl_nitrate,cl_observation,cl_datacollector,cl_datecollected) VALUES(@fa_id,@ammonia,@calcium,@chloride,@bacteria,@copper,@iron,@manganese,@nitrate,@observations,@name,@dateentered)",
    (body) => [
      ["fa_id", sqlClient.Int, body.fa_id], ["ammonia", sqlClient.Decimal(8, 2), body.ammonia],
      ["calcium", sqlClient.Decimal(8, 2), body.calciumhardness], ["chloride", sqlClient.Decimal(8, 2), body.chloride],
      ["bacteria", sqlClient.NVarChar, body.bacteria], ["copper", sqlClient.Decimal(8, 2), body.copper],
      ["iron", sqlClient.Decimal(8, 2), body.iron], ["manganese", sqlClient.Decimal(8, 2), body.manganese],
      ["nitrate", sqlClient.Decimal(8, 2), body.nitrate], ["observations", sqlClient.NVarChar, body.observations],
      ["name", sqlClient.NVarChar, body.datacollector], ["dateentered", sqlClient.DateTime, body.dateentered],
    ],
 ));

  router.post("/createimage", insert(
    "INSERT INTO dbo.tblImage(well_id,im_type,im_latitude,im_longitude,im_genlatitude,im_genlongitude,im_datacollector,im_observation,im_filename,im_datecollected) VALUES(@well_id,@im_type,@im_latitude,@im_longitude,@im_genlatitude,@im_genlongitude,@name,@observation,@im_filename,@dateentered)",
    (body) => [
      ["well_id", sqlClient.Int, body.well_id], ["im_type", sqlClient.NVarChar, body.im_type],
      ["im_latitude", sqlClient.Decimal(10, 5), body.im_latitude], ["im_longitude", sqlClient.Decimal(10, 5), body.im_longitude],
      ["im_genlatitude", sqlClient.Decimal(8, 3), body.im_genlatitude], ["im_genlongitude", sqlClient.Decimal(8, 3), body.im_genlongitude],
      ["name", sqlClient.NVarChar, body.name], ["observation", sqlClient.NVarChar, body.observations],
      ["im_filename", sqlClient.NVarChar, body.im_filename], ["dateentered", sqlClient.DateTime, body.datecollected],
    ],
 ));

  router.post("/createwellinfo", insert(
    "INSERT INTO dbo.tblWellInfo(wi_wellcode,wi_wellname,school_id,wi_registration_number,wi_dnr_well_id,wi_well_user,wi_address,wi_city,wi_state,wi_zipcode,county_id,nrd_id,wi_phone_well_user,wi_email_well_user,wi_well_owner,wi_installyear,wi_smelltaste,wi_smelltaste_description,wi_welldry,wi_welldry_description,wi_maintenance5yr,wi_landuse5yr,wi_numberwelluser,wi_pestmanure,wi_estlatitude,wi_estlongitude,wi_boreholediameter,wi_totaldepth,wi_waterleveldepth,wi_aquifertype,wi_aquiferclass,wi_welltype,wi_wellcasematerial,wi_datacollector,wi_observation,wi_dateentered) VALUES(@wellcode,@wellname,@school_id,@registNum,@dnrId,@welluser,@address,@city,@state,@zipcode,@county_id,@nrd_id,@phone,@email,@wellowner,@installyear,@smelltaste,@smelltaste_description,@welldry,@welldry_description,@maintenance5yr,@landuse5yr,@numberwelluser,@pestmanure,@estlatitude,@estlongitude,@boreholediameter,@totaldepth,@wellwaterleveldepth,@aquifertype,@aquiferclass,@welltype,@wellcasematerial,@datacollector,@observation,@dateentered)",
    (body) => [
      ["wellcode", sqlClient.NVarChar, body.wellcode], ["wellname", sqlClient.NVarChar, body.wellname],
      ["school_id", sqlClient.Int, body.school_id], ["registNum", sqlClient.NVarChar, body.registNum],
      ["dnrId", sqlClient.Int, body.dnrId], ["welluser", sqlClient.NVarChar, body.welluser],
      ["address", sqlClient.NVarChar, body.address], ["city", sqlClient.NVarChar, body.city],
      ["state", sqlClient.NVarChar, body.state], ["zipcode", sqlClient.NVarChar, body.zipcode],
      ["county_id", sqlClient.Int, body.countyid], ["nrd_id", sqlClient.Int, body.nrdid],
      ["phone", sqlClient.NVarChar, body.phone], ["email", sqlClient.NVarChar, body.email],
      ["wellowner", sqlClient.NVarChar, body.wellowner], ["installyear", sqlClient.Int, body.installyear],
      ["smelltaste", sqlClient.NVarChar, body.smelltaste], ["smelltaste_description", sqlClient.NVarChar, body.smelltastedescription],
      ["welldry", sqlClient.NVarChar, body.welldry], ["welldry_description", sqlClient.NVarChar, body.welldrydescription],
      ["maintenance5yr", sqlClient.NVarChar, body.maintenance5yr], ["landuse5yr", sqlClient.NVarChar, body.landuse5yr],
      ["numberwelluser", sqlClient.Int, body.numberwelluser], ["pestmanure", sqlClient.NVarChar, body.pestmanure],
      ["estlatitude", sqlClient.Decimal(10, 5), body.estlatitude], ["estlongitude", sqlClient.Decimal(10, 5), body.estlongitude],
      ["boreholediameter", sqlClient.Decimal(8, 2), body.boreholediameter], ["totaldepth", sqlClient.Decimal(8, 2), body.totaldepth],
      ["wellwaterleveldepth", sqlClient.Decimal(8, 2), body.wellwaterleveldepth], ["aquifertype", sqlClient.NVarChar, body.aquifertype],
      ["aquiferclass", sqlClient.NVarChar, body.aquiferclass], ["welltype", sqlClient.NVarChar, body.welltype],
      ["wellcasematerial", sqlClient.NVarChar, body.wellcasematerial], ["datacollector", sqlClient.NVarChar, body.datacollector],
      ["observation", sqlClient.NVarChar, body.observation], ["dateentered", sqlClient.DateTime, body.dateentered],
    ],
 ));

  return router;
}

module.exports = createWritesRouter;
