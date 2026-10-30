/**
 * server.js
 * 
 * This module provides a function to start the API server and establish a connection to the
 * database.
 */

require("dotenv").config();

const sql = require("mssql");
const createApp = require("./app.js");
const { getDatabaseConfig } = require("./config/database.js");

async function startServer() {
  const pool = new sql.ConnectionPool(getDatabaseConfig());
  let databaseUnavailable = false;

  try {
    await pool.connect();
  } catch (error) {
    console.error("Unable to connect to the database:", error.message);
    if (process.env.NODE_ENV === "production") {
      process.exitCode = 1;
      return;
    }
    databaseUnavailable = true;
    console.warn("Starting the development API without a database connection.");
  }

  const app = createApp({
    pool: databaseUnavailable ? null : pool,
    sqlClient: sql,
    databaseUnavailable,
  });
  const port = Number(process.env.PORT) || 7193;
  const server = app.listen(port, () => {
    console.log(`API server is running on port ${port}.`);
  });

  const shutdown = () => {
    server.close(async () => {
      if (!databaseUnavailable) await pool.close();
      process.exit(0);
    });
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer };