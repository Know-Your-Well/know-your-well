/**
 * api.test.js
 * 
 * This module contains tests for the backend API endpoints.
 */

const request = require("supertest");
const express = require("express");
const session = require("express-session");
const createApp = require("../../app.js");
const createAuthRouter = require("../../routes/auth.js");

function createFakePool({ recordset = [], queryError } = {}) {
  const query = jest.fn(async () => {
    if (queryError) {
      throw queryError;
    }

    return { recordset };
  });

  const dbRequest = {
    input: jest.fn().mockReturnThis(),
    query,
  };

  return {
    pool: {
      request: jest.fn(() => dbRequest),
    },
    sqlClient: { Int: "SQL_INT" },
    dbRequest,
  };
}

function createSequencePool(recordsets) {
  const queryResults = recordsets.map((recordset) =>
    jest.fn().mockResolvedValue({ recordset }),
  );

  const requests = queryResults.map((query) => ({
    input: jest.fn().mockReturnThis(),
    query,
  }));

  return {
    pool: {
      request: jest.fn(() => requests.shift()),
    },
  };
}

function createSqlTypes() {
  return {
    Int: "SQL_INT",
    NVarChar: "SQL_NVARCHAR",
    DateTime: "SQL_DATETIME",
    Decimal: () => "SQL_DECIMAL",
  };
}

function createWritePool({ failQuery = false } = {}) {
  const transaction = {
    begin: jest.fn().mockResolvedValue(undefined),
    commit: jest.fn().mockResolvedValue(undefined),
    rollback: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
  };
  const request = {
    input: jest.fn().mockReturnThis(),
    query: jest.fn().mockImplementation(async () => {
      if (failQuery) throw new Error("insert failed");
      return {};
    }),
  };
  return {
    pool: {
      transaction: jest.fn(() => transaction),
      request: jest.fn(() => request),
    },
    transaction,
    request,
  };
}

describe("backend API", () => {
  test("GET /heartbeat responds successfully", async () => {
    const { pool, sqlClient } = createFakePool();
    const app = createApp({ pool, sqlClient });

    await request(app).get("/heartbeat").expect(200);
  });

  test("development API keeps session routes available without a database", async () => {
    const app = createApp({ databaseUnavailable: true });
    const agent = request.agent(app);

    await agent.get("/heartbeat").expect(200);
    await agent.get("/createDevSession").expect(200, { success: "success" });
    await agent
      .get("/tooltips")
      .expect(503, { error: "Database unavailable; data requests cannot be served." });
  });

  test("GET /LandFeatures returns rows for the requested well", async () => {
    const rows = [{ well_id: 42, lf_type: "Crop Land" }];
    const { pool, sqlClient, dbRequest } = createFakePool({ recordset: rows });
    const app = createApp({ pool, sqlClient });

    const response = await request(app)
      .get("/LandFeatures")
      .query({ well_id: 42 })
      .expect(200);

    expect(response.body).toEqual({ LandFeatures: rows });
    expect(dbRequest.input).toHaveBeenCalledWith("well_id", "SQL_INT", "42");
    expect(dbRequest.query).toHaveBeenCalledWith(
      "SELECT * FROM dbo.tblLandFeature WHERE well_id = @well_id",
    );
  });

  test("GET /LandFeatures responds with 500 when the database query fails", async () => {
    const { pool, sqlClient } = createFakePool({ queryError: new Error("database unavailable") });
    const app = createApp({ pool, sqlClient });
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});

    try {
      await request(app)
        .get("/LandFeatures")
        .query({ well_id: 42 })
        .expect(500, "SERVER ERROR");
    } finally {
      consoleError.mockRestore();
    }
  });

  test("GET /userinfo returns an empty profile when no session values exist", async () => {
    const { pool, sqlClient } = createFakePool();
    const app = createApp({ pool, sqlClient });

    await request(app)
      .get("/userinfo")
      .expect(200, { kywmem: "", displayn: "" });
  });

  test("GET /createDevSession and /userinfo use the development session", async () => {
    const { pool, sqlClient } = createFakePool();
    const app = createApp({ pool, sqlClient });
    const agent = request.agent(app);

    await agent.get("/createDevSession").expect(200, { success: "success" });
    await agent
      .get("/userinfo")
      .expect(200, { kywmem: "1", displayn: "EXAMPLE STUDENT" });
  });

  test("GET /tooltips combines tooltip and image rows", async () => {
    const tooltips = [{ tooltip_id: 1, tooltip_text: "Example" }];
    const tooltipImages = [{ tooltip_image_id: 2, tooltip_image: "image.png" }];
    const { pool } = createSequencePool([tooltips, tooltipImages]);
    const app = createApp({ pool, sqlClient: { Int: "SQL_INT", NVarChar: "SQL_NVARCHAR" } });

    const response = await request(app).get("/tooltips").expect(200);

    expect(response.body).toEqual({ tooltip: tooltips, tooltipImage: tooltipImages });
  });

  test("GET /getwellcode uses a parameter instead of interpolating the well ID", async () => {
    const rows = [{ wi_wellcode: "ABC001" }];
    const { pool } = createSequencePool([rows]);
    const sqlClient = { Int: "SQL_INT", NVarChar: "SQL_NVARCHAR" };
    const app = createApp({ pool, sqlClient });

    const response = await request(app).get("/getwellcode?well_id=42").expect(200);

    expect(response.body).toEqual({ wellcode: rows });
  });

  test("GET /newwellcode rejects requests without a school session", async () => {
    const { pool } = createSequencePool([]);
    const app = createApp({ pool, sqlClient: { Int: "SQL_INT", NVarChar: "SQL_NVARCHAR" } });

    await request(app)
      .get("/newwellcode")
      .expect(400, { error: "No school ID found in session." });
  });

  test("GET /newwellcode returns the next padded code", async () => {
    const { pool } = createSequencePool([
      [{ sch_code: "ABC" }],
      [{ MAXWELLCODE: "ABC009" }],
    ]);
    const app = createApp({ pool, sqlClient: { Int: "SQL_INT", NVarChar: "SQL_NVARCHAR" } });
    const agent = request.agent(app);

    await agent.get("/createDevSession").expect(200);
    await agent.get("/newwellcode").expect(200, { wellcode: "ABC010" });
  });

  test("GET /newwellcode starts with 001 for a school with no wells", async () => {
    const { pool } = createSequencePool([
      [{ sch_code: "XYZ" }],
      [{ MAXWELLCODE: null }],
    ]);
    const app = createApp({ pool, sqlClient: { Int: "SQL_INT", NVarChar: "SQL_NVARCHAR" } });
    const agent = request.agent(app);

    await agent.get("/createDevSession").expect(200);
    await agent.get("/newwellcode").expect(200, { wellcode: "XYZ001" });
  });

  test("GET /GetFieldEntry returns parameterized field activity data", async () => {
    const rows = [{ fieldactivity_id: 42, fa_weather: "Sunny" }];
    const { pool } = createSequencePool([rows]);
    const app = createApp({ pool, sqlClient: createSqlTypes() });

    const response = await request(app)
      .get("/GetFieldEntry")
      .query({ fieldactivity_id: 42 })
      .expect(200);

    expect(response.body).toEqual({ FieldActivity: rows });
  });

  test("GET /Wells rejects a request without a school session", async () => {
    const { pool } = createFakePool();
    const app = createApp({ pool, sqlClient: createSqlTypes() });

    await request(app).get("/Wells").expect(500);
  });

  test("GET /offlineSnapshot requires a school session", async () => {
    const { pool } = createSequencePool([]);
    const app = createApp({ pool, sqlClient: createSqlTypes() });

    await request(app)
      .get("/offlineSnapshot")
      .expect(401, { error: "Not logged in" });
  });

  test("GET /offlineSnapshot returns all offline data for the session school", async () => {
    const snapshot = [
      [{ well_id: 1 }],
      [{ fieldactivity_id: 2 }],
      [{ classlab_id: 3 }],
      [{ watersciencelab_id: 4 }],
      [{ image_id: 5 }],
    ];
    const { pool } = createSequencePool(snapshot);
    const app = createApp({ pool, sqlClient: createSqlTypes() });
    const agent = request.agent(app);

    await agent.get("/createDevSession").expect(200);
    const response = await agent.get("/offlineSnapshot").expect(200);

    expect(response.body).toEqual({
      Wells: snapshot[0],
      FieldActivities: snapshot[1],
      ClassLabs: snapshot[2],
      WaterScienceLabs: snapshot[3],
      Images: snapshot[4],
    });
  });

  test("GET /allImageMetadata requires a school session", async () => {
    const { pool } = createSequencePool([]);
    const app = createApp({ pool, sqlClient: createSqlTypes() });

    await request(app)
      .get("/allImageMetadata")
      .expect(401, { error: "Not logged in" });
  });

  test("POST /feature/crop commits a parameterized insert", async () => {
    const { pool, transaction, request: dbRequest } = createWritePool();
    const app = createApp({ pool, sqlClient: createSqlTypes() });

    await request(app).post("/feature/crop").send({
      well_id: 7,
      cropLatitude: 40.8,
      cropLongitude: -96.7,
      cropGenLatitude: 40.8,
      cropGenLongitude: -96.7,
      observer: "Tester",
      cropComments: "Test feature",
      datecollected: "2026-10-27",
    }).expect(200, "Values Inserted");

    expect(transaction.commit).toHaveBeenCalledTimes(1);
    expect(dbRequest.input).toHaveBeenCalledWith("lf_type", "SQL_NVARCHAR", "Crop Land");
  });

  test("POST /feature/crop rolls back and responds 500 on insert failure", async () => {
    const { pool, transaction } = createWritePool({ failQuery: true });
    const app = createApp({ pool, sqlClient: createSqlTypes() });
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});

    try {
      await request(app).post("/feature/crop").send({ well_id: 7 }).expect(500);
      expect(transaction.rollback).toHaveBeenCalledTimes(1);
    } finally {
      consoleError.mockRestore();
    }
  });

  test("GET /idp/metadata returns XML identity-provider metadata", async () => {
    const { pool } = createFakePool();
    const app = createApp({ pool, sqlClient: createSqlTypes() });
    const response = await request(app).get("/idp/metadata").expect(200);

    expect(response.text).toContain("<md:EntityDescriptor");
  });

  test("GET /sso/redirect returns the identity provider redirect URL", async () => {
    const redirectUrl = "https://identity.example.test/sso?SAMLRequest=abc";
    const sp = { createLoginRequest: jest.fn().mockResolvedValue({ context: redirectUrl }) };
    const app = express();
    app.use((req, res, next) => {
      req.idp = {};
      req.sp = sp;
      next();
    });
    app.use(createAuthRouter());

    await request(app).get("/sso/redirect").expect(200, redirectUrl);
    expect(sp.createLoginRequest).toHaveBeenCalledWith(
      {},
      "redirect",
      expect.any(Function),
    );
  });

  test("POST /saml/acs stores parsed identity attributes and redirects", async () => {
    const sp = {
      parseLoginResponse: jest.fn().mockResolvedValue({
        extract: { attributes: { kywmem: "school-42", displayName: "Test Student" } },
      }),
    };
    const app = express();
    app.use(session({ secret: "test", resave: false, saveUninitialized: true }));
    app.use((req, res, next) => {
      req.idp = {};
      req.sp = sp;
      next();
    });
    app.use(createAuthRouter());

    await request(app).post("/saml/acs").send({}).expect(302).expect("Location", "/Well");
    expect(sp.parseLoginResponse).toHaveBeenCalledWith({}, "post", expect.any(Object));
  });

  test("POST /saml/acs passes parse failures to Express error handling", async () => {
    const app = express();
    app.use(session({ secret: "test", resave: false, saveUninitialized: true }));
    app.use((req, res, next) => {
      req.idp = {};
      req.sp = { parseLoginResponse: jest.fn().mockRejectedValue(new Error("invalid assertion")) };
      next();
    });
    app.use(createAuthRouter());
    app.use((error, req, res, next) => res.status(401).json({ error: error.message }));

    await request(app).post("/saml/acs").expect(401, { error: "invalid assertion" });
  });
});