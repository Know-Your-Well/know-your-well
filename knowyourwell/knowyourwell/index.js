const assignEntity = require("./middleware/saml.js");

const { Constants } = require("samlify");

const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const app = express();
const sql = require("mssql");
const cors = require("cors");
const { response } = require("express");
const path = require("path");
const { error } = require("console");

require('dotenv').config()

app.use(
  session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: false },
  }),
);

app.use(cors({ origin: "*" }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(bodyParser.json());

app.use(express.static("wwwroot"));

app.use(assignEntity);

app.options("*", cors());

let config;

try {
  const fs = require("fs");
  const rawData = fs.readFileSync("config.json", "utf8");
  config = JSON.parse(rawData);
} catch (e) {
  config = {
    user: "kywAdmin",
    password: process.env.APPSETTING_MSSQL_PASSWORD,
    database: "kywtestdb", //this means go to the test database. not the produciton one.
    server: "kyw.database.windows.net",
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
    options: {
      encrypt: true, // for azure
      trustServerCertificate: false, // change to true for local dev / self-signed certs
    },
  };
}

const appPool = new sql.ConnectionPool(config);
try {
  appPool.connect();
} catch (error) {
  console.error(error);
}

app.get("/heartbeat", (req, res) => {
  res.status(200).send('');
});

app.get("/LandFeatures", async (req, res) => {
  well_id = req.query.well_id;
  let query = `SELECT * FROM dbo.tblLandFeature WHERE well_id = ${well_id}`;

  appPool.query(query, function (err, recordset) {
    if (err) {
      console.log(err);
      res.status(500).send("SERVER ERROR");
      return;
    }
    res.status(200).json({ LandFeatures: recordset.recordset });
  });
});

app.post("/feature/crop", (req, res) => {
  const transaction = appPool.transaction();
  transaction.begin((err) => {
    if (err) console.error("Transaction Failed");
    let request = appPool.request(transaction);
    let rolledBack = false;

    transaction.on("rollback", (aborted) => {
      rolledBack = true;
    });

    request.input("well_id", sql.Int, req.body.well_id);
    request.input("lf_type", sql.NVarChar, "Crop Land");
    request.input("lf_latitude", sql.Decimal(10, 5), req.body.cropLatitude);
    request.input("lf_longitude", sql.Decimal(10, 5), req.body.cropLongitude);
    request.input(
      "lf_genlatitude",
      sql.Decimal(8, 3),
      req.body.cropGenLatitude,
    );
    request.input(
      "lf_genlongitude",
      sql.Decimal(8, 3),
      req.body.cropGenLongitude,
    );
    request.input("lf_datacollector", sql.NVarChar, req.body.observer);
    request.input("lf_comments", sql.NVarChar, req.body.cropComments);
    // request.input('file_name')
    request.input("lf_datecollected", sql.DateTime, req.body.datecollected);

    request.query(
      "INSERT INTO dbo.tblLandFeature(well_id, lf_type, lf_latitude, lf_longitude, lf_genlatitude, lf_genlongitude, lf_datecollected, lf_datacollector, lf_comments) VALUES(@well_id, @lf_type, @lf_latitude, @lf_longitude, @lf_genlatitude, @lf_genlongitude, @lf_datecollected, @lf_datacollector, @lf_comments)",
      function (err, recordset) {
        if (err) {
          console.log(err);
          res.status(500).send("Query does not execute.");
          if (!rolledBack) {
            transaction.rollback((err) => {
              // ... error checks
            });
          }
        } else {
          transaction.commit((err) => {
            if (err) {
              console.log(err);
              res.status(500).send("500: Server Error.");
            } else res.status(200).send("Values Inserted");
          });
        }
      },
    );
  });
});

app.post("/feature/pasture", (req, res) => {
  const transaction = appPool.transaction();
  transaction.begin((err) => {
    if (err) console.error("Transaction Failed");
    let request = appPool.request(transaction);
    let rolledBack = false;

    transaction.on("rollback", (aborted) => {
      rolledBack = true;
    });

    request.input("well_id", sql.Int, req.body.well_id);
    request.input("lf_type", sql.NVarChar, "Barn Yard/Pasture");
    request.input("lf_latitude", sql.Decimal(10, 5), req.body.pastureLatitude);
    request.input(
      "lf_longitude",
      sql.Decimal(10, 5),
      req.body.pastureLongitude,
    );
    request.input(
      "lf_genlatitude",
      sql.Decimal(8, 3),
      req.body.pastureGenLatitude,
    );
    request.input(
      "lf_genlongitude",
      sql.Decimal(8, 3),
      req.body.pastureGenLongitude,
    );
    request.input("lf_datacollector", sql.NVarChar, req.body.observer);
    request.input("lf_comments", sql.NVarChar, req.body.pastureComments);
    // request.input('file_name')
    request.input("lf_datecollected", sql.DateTime, req.body.datecollected);

    request.query(
      "INSERT INTO dbo.tblLandFeature(well_id, lf_type, lf_latitude, lf_longitude, lf_genlatitude, lf_genlongitude, lf_datecollected, lf_datacollector, lf_comments) VALUES(@well_id, @lf_type, @lf_latitude, @lf_longitude, @lf_genlatitude, @lf_genlongitude, @lf_datecollected, @lf_datacollector, @lf_comments)",
      function (err, recordset) {
        if (err) {
          console.log(err);
          res.status(500).send("Query does not execute.");
          if (!rolledBack) {
            transaction.rollback((err) => {
              // ... error checks
            });
          }
        } else {
          transaction.commit((err) => {
            if (err) {
              console.log(err);
              res.status(500).send("500: Server Error.");
            } else res.status(200).send("Values Inserted");
          });
        }
      },
    );
  });
});

app.post("/feature/septic", (req, res) => {
  const transaction = appPool.transaction();
  transaction.begin((err) => {
    if (err) console.error("Transaction Failed");
    let request = appPool.request(transaction);
    let rolledBack = false;

    transaction.on("rollback", (aborted) => {
      rolledBack = true;
    });

    request.input("well_id", sql.Int, req.body.well_id);
    request.input("lf_type", sql.NVarChar, "Septic Tank");
    request.input("lf_latitude", sql.Decimal(10, 5), req.body.septicLatitude);
    request.input("lf_longitude", sql.Decimal(10, 5), req.body.septicLongitude);
    request.input(
      "lf_genlatitude",
      sql.Decimal(8, 3),
      req.body.septicGenLatitude,
    );
    request.input(
      "lf_genlongitude",
      sql.Decimal(8, 3),
      req.body.septicGenLongitude,
    );
    request.input("lf_datacollector", sql.NVarChar, req.body.observer);
    request.input("lf_comments", sql.NVarChar, req.body.septicComments);
    // request.input('file_name')
    request.input("lf_datecollected", sql.DateTime, req.body.datecollected);

    request.query(
      "INSERT INTO dbo.tblLandFeature(well_id, lf_type, lf_latitude, lf_longitude, lf_genlatitude, lf_genlongitude, lf_datecollected, lf_datacollector, lf_comments) VALUES(@well_id, @lf_type, @lf_latitude, @lf_longitude, @lf_genlatitude, @lf_genlongitude, @lf_datecollected, @lf_datacollector, @lf_comments)",
      function (err, recordset) {
        if (err) {
          console.log(err);
          res.status(500).send("Query does not execute.");
          if (!rolledBack) {
            transaction.rollback((err) => {
              // ... error checks
            });
          }
        } else {
          transaction.commit((err) => {
            if (err) {
              console.log(err);
              res.status(500).send("500: Server Error.");
            } else res.status(200).send("Values Inserted");
          });
        }
      },
    );
  });
});

app.post("/feature/surfaceWater", (req, res) => {
  const transaction = appPool.transaction();
  transaction.begin((err) => {
    if (err) console.error("Transaction Failed");
    let request = appPool.request(transaction);
    let rolledBack = false;

    transaction.on("rollback", (aborted) => {
      rolledBack = true;
    });

    request.input("well_id", sql.Int, req.body.well_id);
    request.input("lf_type", sql.NVarChar, "Surface Water");
    request.input(
      "lf_latitude",
      sql.Decimal(10, 5),
      req.body.surfaceWaterLatitude,
    );
    request.input(
      "lf_longitude",
      sql.Decimal(10, 5),
      req.body.surfaceWaterLongitude,
    );
    request.input(
      "lf_genlatitude",
      sql.Decimal(8, 3),
      req.body.surfaceWaterGenLatitude,
    );
    request.input(
      "lf_genlongitude",
      sql.Decimal(8, 3),
      req.body.surfaceWaterGenLongitude,
    );
    request.input("lf_datacollector", sql.NVarChar, req.body.observer);
    request.input("lf_comments", sql.NVarChar, req.body.surfaceWaterComments);
    // request.input('file_name')
    request.input("lf_datecollected", sql.DateTime, req.body.datecollected);

    request.query(
      "INSERT INTO dbo.tblLandFeature(well_id, lf_type, lf_latitude, lf_longitude, lf_genlatitude, lf_genlongitude, lf_datecollected, lf_datacollector, lf_comments) VALUES(@well_id, @lf_type, @lf_latitude, @lf_longitude, @lf_genlatitude, @lf_genlongitude, @lf_datecollected, @lf_datacollector, @lf_comments)",
      function (err, recordset) {
        if (err) {
          console.log(err);
          res.status(500).send("Query does not execute.");
          if (!rolledBack) {
            transaction.rollback((err) => {
              // ... error checks
            });
          }
        } else {
          transaction.commit((err) => {
            if (err) {
              console.log(err);
              res.status(500).send("500: Server Error.");
            } else res.status(200).send("Values Inserted");
          });
        }
      },
    );
  });
});

app.post("/api/insert", (req, res) => {
  const transaction = appPool.transaction();
  transaction.begin((err) => {
    if (err) console.error("Transaction Failed");
    const request = appPool.request(transaction);
    let rolledBack = false;

    request.input("well_id", sql.Int, req.body.well_id);
    request.input("fa_latitude", sql.Decimal(10, 5), req.body.fa_latitude);
    request.input("fa_longitude", sql.Decimal(10, 5), req.body.fa_longitude);
    request.input("fa_genlatitude", sql.Decimal(8, 3), req.body.fa_genlatitude);
    request.input(
      "fa_genlongitude",
      sql.Decimal(8, 3),
      req.body.fa_genlongitude,
    );
    request.input("weather", sql.NVarChar, req.body.weather);
    request.input(
      "wellcovercondition",
      sql.NVarChar,
      req.body.wellcovercondition,
    );
    request.input(
      "wellcoverdescription",
      sql.NVarChar,
      req.body.wellcoverdescription,
    );
    request.input("topography", sql.NVarChar, req.body.topography);
    request.input("runOff", sql.NVarChar, req.body.surfacerunoff);
    request.input("pooling", sql.NVarChar, req.body.pooling);
    request.input("temp", sql.Decimal(8, 2), req.body.groundwatertemp);
    request.input("ph", sql.Decimal(8, 2), req.body.ph);
    request.input(
      "conductivity",
      sql.Decimal(8, 2),
      parseFloat(req.body.conductivity),
    );
    request.input("name", sql.NVarChar, req.body.name);
    request.input("observation", sql.NVarChar, req.body.observations);
    request.input("dateentered", sql.DateTime, req.body.datecollected);

    transaction.on("rollback", (aborted) => {
      rolledBack = true;
    });

    request.query(
      "INSERT INTO dbo.tblFieldActivity(well_id, fa_latitude, fa_longitude, fa_genlatitude, fa_genlongitude, fa_weather, fa_wellcovercondition, fa_wellcoverdescription, fa_topography, fa_surfacerunoff, fa_pooling, fa_groundwatertemp, fa_ph, fa_conductivity, fa_datacollector, fa_observation, fa_datecollected) VALUES(@well_id, @fa_latitude, @fa_longitude, @fa_genlatitude, @fa_genlongitude, @weather, @wellcovercondition, @wellcoverdescription, @topography, @runOff, @pooling, @temp, @ph, @conductivity, @name, @observation, @dateentered)",
      function (err, recordset) {
        if (err) {
          console.log(err);
          res.status(500).send("Query does not execute.");
          if (!rolledBack) {
            transaction.rollback((err) => {
              // ... error checks
            });
          }
        } else {
          transaction.commit((err) => {
            if (err) {
              console.log(err);
              res.status(500).send("500: Server Error.");
            } else res.status(200).send("Values Inserted");
          });
        }
      },
    );
  });
});

// class lab
app.post("/createclasslab", (req, res) => {
  const transaction = appPool.transaction();
  transaction.begin((err) => {
    if (err) console.error("Transaction Failed");
    const request = appPool.request(transaction);
    let rolledBack = false;

    transaction.on("rollback", (aborted) => {
      rolledBack = true;
    });

    request.input("fa_id", sql.Int, req.body.fa_id);
    request.input("ammonia", sql.Decimal(8, 2), req.body.ammonia);
    request.input("calcium", sql.Decimal(8, 2), req.body.calciumhardness);
    request.input("chloride", sql.Decimal(8, 2), req.body.chloride);
    request.input("bacteria", sql.NVarChar, req.body.bacteria);
    request.input("copper", sql.Decimal(8, 2), req.body.copper);
    request.input("iron", sql.Decimal(8, 2), req.body.iron);
    request.input("manganese", sql.Decimal(8, 2), req.body.manganese);
    request.input("nitrate", sql.Decimal(8, 2), req.body.nitrate);
    request.input("name", sql.NVarChar, req.body.datacollector);
    request.input("observations", sql.NVarChar, req.body.observations);
    request.input("dateentered", sql.DateTime, req.body.dateentered);

    request.query(
      "INSERT INTO dbo.tblClassroomLab(fieldactivity_id, cl_ammonia, cl_calciumhardness, cl_chloride, cl_bacteria, cl_copper, cl_iron, cl_manganese, cl_nitrate, cl_observation, cl_datacollector, cl_datecollected) VALUES(@fa_id, @ammonia, @calcium, @chloride, @bacteria, @copper, @iron, @manganese, @nitrate, @observations, @name, @dateentered)",
      function (err, recordset) {
        if (err) {
          console.log(err);
          res.status(500).send("Query does not execute.");
          if (!rolledBack) {
            transaction.rollback((err) => {
              // ... error checks
            });
          }
        } else {
          transaction.commit((err) => {
            if (err) {
              console.log(err);
              res.status(500).send("500: Server Error.");
            } else res.status(200).send("Values Inserted");
          });
        }
      },
    );
  });
});

// well info
app.post("/createwellinfo", (req, res) => {
  const transaction = appPool.transaction();
  transaction.begin((err) => {
    if (err) console.error("Transaction Failed");
    const request = appPool.request(transaction);
    let rolledBack = false;

    transaction.on("rollback", (aborted) => {
      rolledBack = true;
    });

    request.input("wellcode", sql.NVarChar, req.body.wellcode);
    request.input("wellname", sql.NVarChar, req.body.wellname);
    request.input("school_id", sql.Int, req.body.school_id);
    request.input("registNum", sql.NVarChar, req.body.registNum);
    request.input("dnrId", sql.Int, req.body.dnrId);
    request.input("welluser", sql.NVarChar, req.body.welluser);
    request.input("address", sql.NVarChar, req.body.address);
    request.input("city", sql.NVarChar, req.body.city);
    request.input("state", sql.NVarChar, req.body.state);
    request.input("zipcode", sql.NVarChar, req.body.zipcode);
    request.input("county_id", sql.Int, req.body.countyid);
    request.input("nrd_id", sql.Int, req.body.nrdid);
    request.input("phone", sql.NVarChar, req.body.phone);
    request.input("email", sql.NVarChar, req.body.email);
    request.input("wellowner", sql.NVarChar, req.body.wellowner);
    request.input("installyear", sql.Int, req.body.installyear);
    request.input("smelltaste", sql.NVarChar, req.body.smelltaste);
    request.input(
      "smelltaste_description",
      sql.NVarChar,
      req.body.smelltastedescription,
    );
    request.input("welldry", sql.NVarChar, req.body.welldry);
    request.input(
      "welldry_description",
      sql.NVarChar,
      req.body.welldrydescription,
    );
    request.input("maintenance5yr", sql.NVarChar, req.body.maintenance5yr);
    request.input("landuse5yr", sql.NVarChar, req.body.landuse5yr);
    request.input("numberwelluser", sql.Int, req.body.numberwelluser);
    request.input("pestmanure", sql.NVarChar, req.body.pestmanure);
    request.input("estlatitude", sql.Decimal(10, 5), req.body.estlatitude);
    request.input("estlongitude", sql.Decimal(10, 5), req.body.estlongitude);
    request.input(
      "boreholediameter",
      sql.Decimal(8, 2),
      req.body.boreholediameter,
    );
    request.input("totaldepth", sql.Decimal(8, 2), req.body.totaldepth);
    request.input(
      "wellwaterleveldepth",
      sql.Decimal(8, 2),
      req.body.wellwaterleveldepth,
    );
    request.input("aquifertype", sql.NVarChar, req.body.aquifertype);
    request.input("aquiferclass", sql.NVarChar, req.body.aquiferclass);
    request.input("welltype", sql.NVarChar, req.body.welltype);
    request.input("wellcasematerial", sql.NVarChar, req.body.wellcasematerial);
    request.input("datacollector", sql.NVarChar, req.body.datacollector);
    request.input("observation", sql.NVarChar, req.body.observation);
    request.input("dateentered", sql.DateTime, req.body.dateentered);

    request.query(
      "INSERT INTO dbo.tblWellInfo(wi_wellcode, wi_wellname, school_id, " +
      "wi_registration_number, wi_dnr_well_id, wi_well_user, wi_address, " +
      "wi_city, wi_state, wi_zipcode, county_id, nrd_id, wi_phone_well_user, " +
      "wi_email_well_user, wi_well_owner, wi_installyear, wi_smelltaste, " +
      "wi_smelltaste_description, wi_welldry, wi_welldry_description, " +
      "wi_maintenance5yr, wi_landuse5yr, wi_numberwelluser, wi_pestmanure, " +
      "wi_estlatitude, wi_estlongitude, wi_boreholediameter, wi_totaldepth, " +
      "wi_waterleveldepth, wi_aquifertype, wi_aquiferclass, wi_welltype, " +
      "wi_wellcasematerial, wi_datacollector, wi_observation, " +
      "wi_dateentered) " +
      "VALUES(@wellcode, @wellname, @school_id, @registNum, @dnrId, " +
      "@welluser, @address, @city, @state, @zipcode, @county_id, @nrd_id, " +
      "@phone, @email, @wellowner, @installyear, @smelltaste, " +
      "@smelltaste_description, @welldry, @welldry_description, " +
      "@maintenance5yr, @landuse5yr, @numberwelluser, @pestmanure, " +
      "@estlatitude, @estlongitude, @boreholediameter, @totaldepth, " +
      "@wellwaterleveldepth, @aquifertype, @aquiferclass, @welltype, " +
      "@wellcasematerial, @datacollector, @observation, " +
      "@dateentered)",
      function (err, recordset) {
        if (err) {
          console.log(err);
          res.status(500).send("Query does not execute.");
          if (!rolledBack) {
            transaction.rollback((err) => {
              // ... error checks
            });
          }
        } else {
          transaction.commit((err) => {
            if (err) {
              console.log(err);
              res.status(500).send("500: Server Error.");
            } else res.status(200).send("Values Inserted");
          });
        }
      },
    );
  });
});

app.post("/createimage", (req, res) => {
  const transaction = appPool.transaction();
  transaction.begin((err) => {
    if (err) console.error("Transaction Failed");
    const request = appPool.request(transaction);
    let rolledBack = false;

    request.input("well_id", sql.Int, req.body.well_id);
    request.input("im_type", sql.NVarChar, req.body.im_type);
    request.input("im_latitude", sql.Decimal(10, 5), req.body.im_latitude);
    request.input("im_longitude", sql.Decimal(10, 5), req.body.im_longitude);
    request.input("im_genlatitude", sql.Decimal(8, 3), req.body.im_genlatitude);
    request.input("im_genlongitude", sql.Decimal(8, 3), req.body.im_genlongitude);
    request.input("name", sql.NVarChar, req.body.name);
    request.input("observation", sql.NVarChar, req.body.observations);
    request.input("im_filename", sql.NVarChar, req.body.im_filename);
    request.input("dateentered", sql.DateTime, req.body.datecollected);

    transaction.on("rollback", (aborted) => {
      rolledBack = true;
    });

    request.query(
      "INSERT INTO dbo.tblImage(well_id, im_type, im_latitude, im_longitude, im_genlatitude, im_genlongitude, im_datacollector, im_observation, im_filename, im_datecollected) VALUES(@well_id, @im_type, @im_latitude, @im_longitude, @im_genlatitude, @im_genlongitude, @name, @observation, @im_filename, @dateentered)",
      function (err, recordset) {
        if (err) {
          console.log(err);
          res.status(500).send("Query does not execute.");
          if (!rolledBack) {
            transaction.rollback((err) => {
              // ... error checks
            });
          }
        } else {
          transaction.commit((err) => {
            if (err) {
              console.log(err);
              res.status(500).send("500: Server Error.");
            } else res.status(200).send("Values Inserted");
          });
        }
      },
    );
  });
});

app.get("/Wells", async (req, res, next) => {

  let query = "SELECT * FROM dbo.tblWellInfo";

  const kywmemValue = req.session.kywmem;

  let applySchoolId = "";
  if (kywmemValue && kywmemValue !== "" && kywmemValue !== "undefined") {
    applySchoolId = ` WHERE school_id = ${kywmemValue}`;
  } else {
    next(new Error("No school ID found in session."));
  }

  query += applySchoolId;

  const applyFilter = () => {
    if (req.query.filterBy && Object.keys(req.query.filterBy).length !== 0) {
      let conditions = [];
      for (const [column, filter] of Object.entries(req.query.filterBy)) {
        if (filter === "-1") {
          // Do nothing because -1 means the dropdown box has nothing selected
        } else if (column === "search") {
          conditions.push(`wi_wellname LIKE '%${filter}%'`);
        } else if (column === "minLat") {
          if (!isNaN(parseFloat(filter))) {
            conditions.push(`wi_estlatitude >= ${parseFloat(filter)}`);
          }
        } else if (column === "maxLat") {
          if (!isNaN(parseFloat(filter))) {
            conditions.push(`wi_estlatitude <= ${parseFloat(filter)}`);
          }
        } else if (column === "minLon") {
          if (!isNaN(parseFloat(filter))) {
            conditions.push(`wi_estlongitude >= ${parseFloat(filter)}`);
          }
        } else if (column === "maxLon") {
          if (!isNaN(parseFloat(filter))) {
            conditions.push(`wi_estlongitude <= ${parseFloat(filter)}`);
          }
        } else if (column === "byDistance") {
          if (req.query.sortBy === "field_activity" && filter.includes("well_id")) {
            conditions.push(`w.${filter}`);
          } else {
            conditions.push(filter);
          }
        } else {
          conditions.push(`${column} = ${filter}`);
        }
      }
      if (conditions.length > 0) {
        return " AND (" + conditions.join(") AND (") + ")";
      }
    }
    return '';
  }
  query += applyFilter();

  const fieldSort = `SELECT w.*
                        FROM dbo.tblWellInfo w
                        LEFT JOIN (
                          SELECT well_id, MAX(fa_datecollected) as newest
                          FROM dbo.tblFieldActivity
                          GROUP BY well_id
                        ) fa on w.well_id = fa.well_id` +
    applySchoolId +
    applyFilter() +
    ` ORDER BY fa.newest DESC, w.wi_wellcode ASC;`;

  if (req.query.sortBy) {
    if (req.query.sortBy === "field_activity") {
      query = fieldSort;
    } else {
      query += ` ORDER BY ${req.query.sortBy}`;
    }
  } else {
    query += ' ORDER BY wi_wellname';
  }

  appPool.query(query, function (err, recordset) {
    if (err) {
      console.log(err);
      next(err);
    }
    res.status(200).json({ Wells: recordset.recordset });
  });
});

app.get("/csvqueries", async (req, res) => {
  const kywmemValue = req.session.kywmem;

  try {
    // Perform multiple queries concurrently
    //const result1 = query1Function(request);
    let query = `SELECT dbo.tblSchool.sch_name, dbo.tblWellInfo.wi_wellcode, dbo.tblWellInfo.wi_wellname, dbo.tblWellInfo.wi_well_user, dbo.tblWellInfo.wi_address, dbo.tblWellInfo.wi_city, dbo.tblWellInfo.wi_state,
                  dbo.tblWellInfo.wi_zipcode, dbo.tblCountyLookup.county_name, dbo.tblNRDLookup.nrd_name, dbo.tblWellInfo.wi_phone_well_user, dbo.tblWellInfo.wi_email_well_user, dbo.tblWellInfo.wi_well_owner, dbo.tblWellInfo.wi_installyear,
                  dbo.tblWellInfo.wi_smelltaste, dbo.tblWellInfo.wi_smelltaste_description, dbo.tblWellInfo.wi_welldry, dbo.tblWellInfo.wi_welldry_description, dbo.tblWellInfo.wi_maintenance5yr, dbo.tblWellInfo.wi_landuse5yr,
                  dbo.tblWellInfo.wi_numberwelluser, dbo.tblWellInfo.wi_pestmanure, dbo.tblWellInfo.wi_estlatitude, dbo.tblWellInfo.wi_estlongitude, dbo.tblWellInfo.wi_boreholediameter, dbo.tblWellInfo.wi_totaldepth, dbo.tblWellInfo.wi_waterleveldepth,
                  dbo.tblWellInfo.wi_aquifertype, dbo.tblWellInfo.wi_aquiferclass, dbo.tblWellInfo.wi_welltype, dbo.tblWellInfo.wi_wellcasematerial, dbo.tblWellInfo.wi_datacollector, dbo.tblWellInfo.wi_observation, dbo.tblWellInfo.wi_dateentered,
                  dbo.tblWellInfo.wi_registration_number, dbo.tblWellInfo.wi_dnr_well_id, dbo.tblFieldActivity.fa_latitude, dbo.tblFieldActivity.fa_longitude, dbo.tblFieldActivity.fa_weather, dbo.tblFieldActivity.fa_wellcovercondition,
                  dbo.tblFieldActivity.fa_wellcoverdescription, dbo.tblFieldActivity.fa_surfacerunoff, dbo.tblFieldActivity.fa_pooling, dbo.tblFieldActivity.fa_groundwatertemp, dbo.tblFieldActivity.fa_ph, dbo.tblFieldActivity.fa_conductivity,
                  dbo.tblFieldActivity.fa_datacollector, dbo.tblFieldActivity.fa_observation, dbo.tblFieldActivity.fa_datecollected, dbo.tblFieldActivity.fa_topography, dbo.tblClassroomLab.cl_ammonia, dbo.tblClassroomLab.cl_calciumhardness, dbo.tblClassroomLab.cl_chloride,
                  dbo.tblClassroomLab.cl_bacteria, dbo.tblClassroomLab.cl_copper, dbo.tblClassroomLab.cl_iron, dbo.tblClassroomLab.cl_manganese, dbo.tblClassroomLab.cl_nitrate, dbo.tblClassroomLab.cl_observation, dbo.tblClassroomLab.cl_nitrite,
                  dbo.tblClassroomLab.cl_pest_atrazine, dbo.tblClassroomLab.cl_datacollector, dbo.tblClassroomLab.cl_datecollected, dbo.tblWaterScienceLab.wsl_samplecode, dbo.tblWaterScienceLab.wsl_ph, dbo.tblWaterScienceLab.wsl_conductivity,
                  dbo.tblWaterScienceLab.wsl_calciumhardness, dbo.tblWaterScienceLab.wsl_no3no2n, dbo.tblWaterScienceLab.wsl_nh4n, dbo.tblWaterScienceLab.wsl_bromide, dbo.tblWaterScienceLab.wsl_chloride,
                  dbo.tblWaterScienceLab.wsl_fluoride, dbo.tblWaterScienceLab.wsl_orthophosphate, dbo.tblWaterScienceLab.wsl_sulfate, dbo.tblWaterScienceLab.wsl_arsenic, dbo.tblWaterScienceLab.wsl_chromium,
                  dbo.tblWaterScienceLab.wsl_copper, dbo.tblWaterScienceLab.wsl_iron, dbo.tblWaterScienceLab.wsl_manganese, dbo.tblWaterScienceLab.wsl_selenium, dbo.tblWaterScienceLab.wsl_uranium, dbo.tblWaterScienceLab.wsl_zinc,
                  dbo.tblWaterScienceLab.wsl_acetochlor, dbo.tblWaterScienceLab.wsl_alachlor, dbo.tblWaterScienceLab.wsl_atrazine, dbo.tblWaterScienceLab.wsl_butylate, dbo.tblWaterScienceLab.wsl_chlorothalonil,
                  dbo.tblWaterScienceLab.wsl_cyanazine, dbo.tblWaterScienceLab.wsl_de_ethylatrazine, dbo.tblWaterScienceLab.wsl_de_isopropylatrazine, dbo.tblWaterScienceLab.wsl_dimethenamid, dbo.tblWaterScienceLab.wsl_EPTC,
                  dbo.tblWaterScienceLab.wsl_metolachlor, dbo.tblWaterScienceLab.wsl_metribuzin, dbo.tblWaterScienceLab.wsl_norflurazon, dbo.tblWaterScienceLab.wsl_pendamethalin, dbo.tblWaterScienceLab.wsl_permethrin,
                  dbo.tblWaterScienceLab.wsl_prometon, dbo.tblWaterScienceLab.wsl_propazine, dbo.tblWaterScienceLab.wsl_propachlor, dbo.tblWaterScienceLab.wsl_simazine, dbo.tblWaterScienceLab.wsl_teflurthrin, dbo.tblWaterScienceLab.wsl_trifluralin,
                  dbo.tblWaterScienceLab.wsl_totalcoliform, dbo.tblWaterScienceLab.wsl_ecoli, dbo.tblWaterScienceLab.wsl_magnesium, dbo.tblWaterScienceLab.wsl_dateentered
FROM     dbo.tblNRDLookup INNER JOIN
                  dbo.tblSchool ON dbo.tblNRDLookup.nrd_id = dbo.tblSchool.nrd_id INNER JOIN
                  dbo.tblWellInfo ON dbo.tblSchool.school_id = dbo.tblWellInfo.school_id INNER JOIN
                  dbo.tblCountyLookup ON dbo.tblWellInfo.county_id = dbo.tblCountyLookup.county_id INNER JOIN
                  dbo.tblFieldActivity ON dbo.tblWellInfo.well_id = dbo.tblFieldActivity.well_id LEFT OUTER JOIN
                  dbo.tblClassroomLab ON dbo.tblFieldActivity.fieldactivity_id = dbo.tblClassroomLab.fieldactivity_id LEFT OUTER JOIN
                  dbo.tblWaterScienceLab ON dbo.tblFieldActivity.fieldactivity_id = dbo.tblWaterScienceLab.fieldactivity_id WHERE dbo.tblSchool.school_id = ${kywmemValue};`;

    appPool.query(query, function (err, recordset) {
      if (err) {
        console.log(err);
        res.status(500).send("SERVER ERROR");
        return;
      }
      res.status(200).json({ Data: recordset.recordset });
    });
  } catch (error) {
    // If any error occurs during the queries, handle it here
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get('/allImageMetadata', async (req, res) => {
  const kywmemValue = req.session.kywmem;

  let query = `SELECT
  dbo.tblWellInfo.school_id,
  dbo.tblSchool.sch_name,
  dbo.tblWellInfo.well_id,
  dbo.tblWellInfo.wi_wellcode,
  dbo.tblWellInfo.wi_wellname,
  dbo.tblImage.im_type,
  dbo.tblImage.im_latitude,
  dbo.tblImage.im_longitude,
  dbo.tblImage.im_filename,
  dbo.tblImage.im_datacollector,
  dbo.tblImage.im_observation,
  dbo.tblImage.im_datecollected
  FROM
  dbo.tblWellInfo INNER JOIN
    dbo.tblImage ON dbo.tblWellInfo.well_id = dbo.tblImage.well_id
    INNER JOIN
    dbo.tblSchool ON dbo.tblWellInfo.school_id = dbo.tblSchool.school_id
    WHERE
      dbo.tblWellInfo.school_id = ${kywmemValue};`;

  appPool.query(query, function (err, recordset) {
    if (err) {
      console.log(err);
      res.status(500).send("SERVER ERROR");
      return;
    }
    res.status(200).json({ Data: recordset.recordset });
  });
});

app.get("/GetWellInfo", async (req, res) => {
  const transaction = appPool.transaction();
  transaction.begin((err) => {
    if (err) console.error("Transaction Failed");
    const request = appPool.request(transaction);
    let rolledBack = false;

    transaction.on("rollback", (aborted) => {
      rolledBack = true;
    });

    request
      .input("well_id", sql.Int, req.query.well_id)
      .query(
        "SELECT * FROM dbo.tblWellInfo WHERE well_id = @well_id;",
        function (err, recordset) {
          if (err) {
            console.log(err);
            res.status(500).send("Query does not execute.");
            if (!rolledBack) {
              transaction.rollback((err) => {
                // ... error checks
              });
            }
          } else {
            transaction.commit((err) => {
              if (err) {
                console.log(err);
                res.status(500).send("500: Server Error.");
              } else {
                res.status(200).json({ WellInfo: recordset.recordset });
              }
            });
          }
        },
      );
  });
});

app.get("/idp/metadata", (req, res) => {
  res.header("Content-Type", "text/xml").send(req.idp.getMetadata());
});

app.get("/previousentries", async (req, res) => {
  const transaction = appPool.transaction();
  transaction.begin((err) => {
    if (err) console.error("Transaction Failed");
    const request = appPool.request(transaction);
    let rolledBack = false;

    transaction.on("rollback", (aborted) => {
      rolledBack = true;
    });

    //const secondFilter = req.query.newLab === "True" ? " AND classlab_id IS NULL" : "";

    request
      .input("well_id", sql.Int, req.query.well_id)
      .query(
        "SELECT fa.fieldactivity_id, fa.fa_datecollected, cl.classlab_id, cl.cl_datecollected FROM dbo.tblFieldActivity AS fa LEFT JOIN dbo.tblClassroomLab AS cl ON fa.fieldactivity_id = cl.fieldactivity_id WHERE fa.well_id = @well_id;",
        function (err, recordset) {
          if (err) {
            console.log(err);
            res.status(500).send("Query does not execute.");
            if (!rolledBack) {
              transaction.rollback((err) => {
                // ... error checks
              });
            }
          } else {
            transaction.commit((err) => {
              if (err) {
                console.log(err);
                res.status(500).send("500: Server Error.");
              } else {
                // console.log(recordset)
                res.status(200).json({ FieldList: recordset.recordset });
              }
            });
          }
        },
      );
  });
});

app.get("/previousentriesWithWSL", async (req, res) => {
  const transaction = appPool.transaction();
  transaction.begin((err) => {
    if (err) console.error("Transaction Failed");
    const request = appPool.request(transaction);
    let rolledBack = false;

    transaction.on("rollback", (aborted) => {
      rolledBack = true;
    });

    //const secondFilter = req.query.newLab === "True" ? " AND classlab_id IS NULL" : "";

    request
      .input("well_id", sql.Int, req.query.well_id)
      .query(
        "SELECT fa.fieldactivity_id, fa.fa_datecollected, cl.classlab_id, cl.cl_datecollected, wsl.watersciencelab_id, wsl.wsl_dateentered FROM dbo.tblFieldActivity AS fa LEFT JOIN dbo.tblClassroomLab AS cl ON fa.fieldactivity_id = cl.fieldactivity_id LEFT JOIN dbo.tblWaterScienceLab AS wsl ON fa.fieldactivity_id = wsl.fieldactivity_id WHERE fa.well_id = @well_id;",
        function (err, recordset) {
          if (err) {
            console.log(err);
            res.status(500).send("Query does not execute.");
            if (!rolledBack) {
              transaction.rollback((err) => {
                // ... error checks
              });
            }
          } else {
            transaction.commit((err) => {
              if (err) {
                console.log(err);
                res.status(500).send("500: Server Error.");
              } else {
                // console.log(recordset)
                res.status(200).json({ ExpandedFieldList: recordset.recordset });
              }
            });
          }
        },
      );
  });
});

app.get("/GetFieldEntriesByWell", async (req, res) => {
  const transaction = appPool.transaction();
  transaction.begin((err) => {
    if (err) console.error("Transaction Failed");
    const request = appPool.request(transaction);
    let rolledBack = false;

    transaction.on("rollback", (aborted) => {
      rolledBack = true;
    });

    request
      .input("well_id", sql.Int, req.query.well_id)
      .query(
        "SELECT fieldactivity_id, fa_datecollected FROM dbo.tblFieldActivity WHERE well_id = @well_id;",
        function (err, recordset) {
          if (err) {
            console.log(err);
            res.status(500).send("Query does not execute.");
            if (!rolledBack) {
              transaction.rollback((err) => {
                // ... error checks
              });
            }
          } else {
            transaction.commit((err) => {
              if (err) {
                console.log(err);
                res.status(500).send("500: Server Error.");
              } else {
                // console.log(recordset)
                res.status(200).json({ MinimalFieldList: recordset.recordset });
              }
            });
          }
        },
      );
  });
});

app.get("/previousimages", async (req, res) => {
  const transaction = appPool.transaction();
  transaction.begin((err) => {
    if (err) console.error("Transaction Failed");
    const request = appPool.request(transaction);
    let rolledBack = false;

    transaction.on("rollback", (aborted) => {
      rolledBack = true;
    });

    request
      .input("well_id", sql.Int, req.query.well_id)
      .query(
        "SELECT image_id, im_datecollected FROM dbo.tblImage WHERE well_id = @well_id;",
        function (err, recordset) {
          if (err) {
            console.log(err);
            res.status(500).send("Query does not execute.");
            if (!rolledBack) {
              transaction.rollback((err) => {
                // ... error checks
              });
            }
          } else {
            transaction.commit((err) => {
              if (err) {
                console.log(err);
                res.status(500).send("500: Server Error.");
              } else {
                res.status(200).json({ ImageList: recordset.recordset });
              }
            });
          }
        },
      );
  });
});

app.get("/GetFieldEntry", async (req, res) => {
  const transaction = appPool.transaction();
  transaction.begin((err) => {
    if (err) console.error("Transaction Failed");
    const request = appPool.request(transaction);
    let rolledBack = false;

    transaction.on("rollback", (aborted) => {
      rolledBack = true;
    });

    request
      .input("fieldactivity_id", sql.Int, req.query.fieldactivity_id)
      .query(
        "SELECT * FROM dbo.tblFieldActivity WHERE fieldactivity_id = @fieldactivity_id;",
        function (err, recordset) {
          if (err) {
            console.log(err);
            res.status(500).send("Query does not execute.");
            if (!rolledBack) {
              transaction.rollback((err) => {
                // ... error checks
              });
            }
          } else {
            transaction.commit((err) => {
              if (err) {
                console.log(err);
                res.status(500).send("500: Server Error.");
              } else {
                // console.log(recordset)
                res.status(200).json({ FieldActivity: recordset.recordset });
              }
            });
          }
        },
      );
  });
});

app.get("/GetLabEntry", async (req, res) => {
  const transaction = appPool.transaction();
  transaction.begin((err) => {
    if (err) console.error("Transaction Failed");
    const request = appPool.request(transaction);
    let rolledBack = false;

    transaction.on("rollback", (aborted) => {
      rolledBack = true;
    });

    request
      .input("classlab_id", sql.Int, req.query.classlab_id)
      .query(
        "SELECT * FROM dbo.tblClassRoomLab WHERE classlab_id = @classlab_id;",
        function (err, recordset) {
          if (err) {
            console.log(err);
            res.status(500).send("Query does not execute.");
            if (!rolledBack) {
              transaction.rollback((err) => {
                // ... error checks
              });
            }
          } else {
            transaction.commit((err) => {
              if (err) {
                console.log(err);
                res.status(500).send("500: Server Error.");
              } else {
                // console.log(recordset)
                res.status(200).json({ ClassLabEntry: recordset.recordset });
              }
            });
          }
        },
      );
  });
});

app.get("/GetClassLabEntryByFieldActivity", async (req, res) => {
  const transaction = appPool.transaction();
  transaction.begin((err) => {
    if (err) console.error("Transaction Failed");
    const request = appPool.request(transaction);
    let rolledBack = false;

    transaction.on("rollback", (aborted) => {
      rolledBack = true;
    });

    request
      .input("fieldactivity_id", sql.Int, req.query.fieldactivity_id)
      .query(
        "SELECT * FROM dbo.tblClassroomLab WHERE fieldactivity_id = @fieldactivity_id;",
        function (err, recordset) {
          if (err) {
            console.log(err);
            res.status(500).send("Query does not execute.");
            if (!rolledBack) {
              transaction.rollback((err) => {
                // ... error checks
              });
            }
          } else {
            transaction.commit((err) => {
              if (err) {
                console.log(err);
                res.status(500).send("500: Server Error.");
              } else {
                // console.log(recordset)
                res.status(200).json({ ClassLabEntries: recordset.recordset });
              }
            });
          }
        },
      );
  });
});

app.get("/GetWaterScienceLabEntry", async (req, res) => {
  const transaction = appPool.transaction();
  transaction.begin((err) => {
    if (err) console.error("Transaction Failed");
    const request = appPool.request(transaction);
    let rolledBack = false;

    transaction.on("rollback", (aborted) => {
      rolledBack = true;
    });

    request
      .input("watersciencelab_id", sql.Int, req.query.watersciencelab_id)
      .query(
        "SELECT * FROM dbo.tblWaterScienceLab WHERE watersciencelab_id = @watersciencelab_id;",
        function (err, recordset) {
          if (err) {
            console.log(err);
            res.status(500).send("Query does not execute.");
            if (!rolledBack) {
              transaction.rollback((err) => {
                // ... error checks
              });
            }
          } else {
            transaction.commit((err) => {
              if (err) {
                console.log(err);
                res.status(500).send("500: Server Error.");
              } else {
                // console.log(recordset)
                res.status(200).json({ WaterScienceLabEntry: recordset.recordset });
              }
            });
          }
        },
      );
  });
});

app.get("/GetWaterScienceLabEntryByFieldActivity", async (req, res) => {
  const transaction = appPool.transaction();
  transaction.begin((err) => {
    if (err) console.error("Transaction Failed");
    const request = appPool.request(transaction);
    let rolledBack = false;

    transaction.on("rollback", (aborted) => {
      rolledBack = true;
    });

    request
      .input("fieldactivity_id", sql.Int, req.query.fieldactivity_id)
      .query(
        "SELECT * FROM dbo.tblWaterScienceLab WHERE fieldactivity_id = @fieldactivity_id;",
        function (err, recordset) {
          if (err) {
            console.log(err);
            res.status(500).send("Query does not execute.");
            if (!rolledBack) {
              transaction.rollback((err) => {
                // ... error checks
              });
            }
          } else {
            transaction.commit((err) => {
              if (err) {
                console.log(err);
                res.status(500).send("500: Server Error.");
              } else {
                // console.log(recordset)
                res.status(200).json({ WaterScienceLabEntries: recordset.recordset });
              }
            });
          }
        },
      );
  });
});

app.get("/GetImage", async (req, res) => {
  const transaction = appPool.transaction();
  transaction.begin((err) => {
    if (err) console.error("Transaction Failed");
    const request = appPool.request(transaction);
    let rolledBack = false;

    transaction.on("rollback", (aborted) => {
      rolledBack = true;
    });

    request
      .input("image_id", sql.Int, req.query.image_id)
      .query(
        "SELECT * FROM dbo.tblImage WHERE image_id = @image_id;",
        function (err, recordset) {
          if (err) {
            console.log(err);
            res.status(500).send("Query does not execute.");
            if (!rolledBack) {
              transaction.rollback((err) => {
                // ... error checks
              });
            }
          } else {
            transaction.commit((err) => {
              if (err) {
                console.log(err);
                res.status(500).send("500: Server Error.");
              } else {
                res.status(200).json({ Image: recordset.recordset });
              }
            });
          }
        },
      );
  });
});

app.get("/sso/redirect", async (req, res) => {
  // const defaultTemplate = SamlLib.defaultLoginRequestTemplate;
  // defaultTemplate.context = insertTagProperty(defaultTemplate.context, 'ForceAuthn="true"');

  // function insertTagProperty(xmlTag, property){s
  //   return xmlTag.replace('>', ` ${property}>`);
  // }
  // const crypto = require('crypto'); // Node.js crypto module for generating secure random IDs

  const generateSecureId = () => {
    // Generates a secure random ID. SAML IDs typically start with an underscore.
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    const charactersLength = characters.length;
    for (let i = 0; i < 20; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  };

  const getCurrentIsoDateTime = () => {
    // Returns the current date and time in ISO 8601 format, suitable for IssueInstant
    return new Date().toISOString();
  };

  const newId = generateSecureId();
  const issueInstant = getCurrentIsoDateTime();
  // req.sp.entityMeta.meta.AllowCreate = 'false';
  // // const loginRequestTemplate1 = req.sp.entitySetting.loginRequestTemplate;
  // console.log(req.sp)
  const { id, context: redirectUrl } = await req.sp.createLoginRequest(
    req.idp,
    "redirect",
    (loginRequestTemplate) => {
      // console.log(loginRequestTemplate.context);
      // const modifiedTemplate = { ...loginRequestTemplate, additionalField: 'value' }; // example modification
      // console.log(typeof loginRequestTemplate.context)
      let modifiedTemplate = loginRequestTemplate.context
        .replace("{ID}", newId)
        .replace("{IssueInstant}", issueInstant);
      // let modifiedTemplate = ""

      // console.log(modifiedTemplate)
      return {
        id: newId, // ensure this is unique or correctly generated
        context: modifiedTemplate,
      };
    },
  );
  console.log("id: " + id);
  console.log("Context returned: " + redirectUrl + "\n");

  return res.status(200).send(redirectUrl);
});

app.get("/logout", async (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Session destruction error:", err);
      return res.status(500).send("Could not log out, please try again.");
    }

    // Optionally clear the client-side cookie
    res.clearCookie("connect.sid"); // The name of the cookie used for session management ('connect.sid' is default for express-session)

    res.status(200).json({ kywmem: "", displayn: "" });
  });
});

app.get("/userinfo", async (req, res) => {
  if (req.session && req.session.kywmem && req.session.displayName) {
    res
      .status(200)
      .json({ kywmem: req.session.kywmem, displayn: req.session.displayName });
  } else {
    console.log("Not logged in");
    res.status(200).json({ kywmem: "", displayn: "" });
  }
});

app.get("/createDevSession", async (req, res) => {
  // console.log("hit dev sesh")
  req.session.kywmem = "1";
  req.session.displayName = "EXAMPLE STUDENT";
  res.status(200).json({ success: "success" });
});

app.get("/getwellcode", async (req, res) => {
  well_id = req.query.well_id;
  let query = `SELECT wi_wellcode FROM dbo.TblWellInfo WHERE well_id = ${well_id}`;

  appPool.query(query, function (err, recordset) {
    if (err) {
      console.log(err);
      res.status(500).send("SERVER ERROR");
      return;
    }
    res.status(200).json({ wellcode: recordset.recordset });
  });
});

app.get("/newwellcode", async (req, res) => {
  // get the school id from the request
  // find the school code using the school id
  // find the largest well code for that school
  // add 1 to the largest well code and return
  let kywmemValue = req.session.kywmem;
  let query1 = `SELECT sch_code FROM dbo.tblSchool WHERE school_id = ${kywmemValue}`;

  let sch_code = "";

  const getSchoolCode = () => {
    return new Promise((resolve, reject) => {
      appPool.query(query1, function (err, recordset) {
        if (err) {
          console.log(err);
          reject(new Error("SERVER ERROR"));
        } else {
          const sch_code = recordset.recordset[0].sch_code;
          resolve(sch_code);
        }
      });
    });
  };

  sch_code = await getSchoolCode();

  let query2 = `SELECT MAX(wi_wellcode) AS MAXWELLCODE FROM dbo.tblWellInfo WHERE wi_wellcode LIKE '${sch_code}%'`;
  // let query2 = `SELECT MAX(wi_wellcode) AS MAXWELLCODE FROM dbo.tblWellInfo WHERE wi_wellcode LIKE 'abc%'`
  appPool.query(query2, function (err, recordset) {
    if (err) {
      console.log(err);
      res.status(500).send("SERVER ERROR");
      return;
    }
    let prev_max_wellcode = recordset.recordset[0].MAXWELLCODE;
    if (prev_max_wellcode === null) {
      //well code could not be found with this school code meaning this school has not created a well before
      const firstWellCode = sch_code + "001";
      res.status(200).json({ wellcode: firstWellCode });
    } else {
      // well code could be found for this school
      const match = prev_max_wellcode.match(/([a-zA-Z]*)(\d*)/);
      const oldNumber = match[2];
      const newNumber = Number(oldNumber) + 1;
      const paddedNumber = newNumber.toString().padStart(oldNumber.length, "0");
      const finalWellCode = sch_code + paddedNumber;
      res.status(200).json({ wellcode: finalWellCode });
    }
  });
});

app.get("/tooltips", async (req, res) => {
  const getTooltips = () => {
    return new Promise((resolve, reject) => {
      appPool.query("SELECT * FROM dbo.tblTooltip", (err, recordset) => {
        if (err) {
          console.log(err);
          reject(new Error("SERVER ERROR"));
        }
        resolve({ tooltip: recordset?.recordset });
      });
    });
  };

  const getTooltipImages = () => {
    return new Promise((resolve, reject) => {
      appPool.query("SELECT * FROM dbo.tblTooltipImage", (err, recordset) => {
        if (err) {
          console.log(err);
          reject(new Error("SERVER ERROR"));
        }
        resolve({ tooltipImage: recordset?.recordset });
      });
    });
  };

  const tooltips = await getTooltips();
  const tooltipImages = await getTooltipImages();
  if (tooltips instanceof Error || tooltipImages instanceof Error) {
    res.status(500).send("SERVER ERROR");
    return;
  }
  res.status(200).json({ ...tooltips, ...tooltipImages });
});

// receive the idp response
app.post("/saml/acs", async (req, res) => {
  await req.sp.parseLoginResponse(req.idp, "post", req).then((parseResult) => {
    // Use the parseResult can do customized action

    const kywmemValue = parseResult.extract.attributes.kywmem;
    const displayName = parseResult.extract.attributes.displayName;

    req.session.kywmem = kywmemValue;
    req.session.displayName = displayName;

    console.log("kywmem Value: ", kywmemValue);
    console.log(" displayName Value: ", displayName);
  });
  res.redirect("/Well");
});

app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "wwwroot", "index.html"));
});

app.listen(process.env.PORT || 7193, () => {
  console.log("server is running");
});

app.get("*", (req, res) => {
  console.log("hit");
  res.sendFile(path.resolve(__dirname, "wwwroot", "index.html"));
});

app.get("/health", (req, res) => {
  console.log("hit");
  res.status(200).send("Healthy");
});
