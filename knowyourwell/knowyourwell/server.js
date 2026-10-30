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

  try {
    await pool.connect();
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    process.exitCode = 1;
    return;
  }

  const app = createApp({ pool, sqlClient: sql });
  const port = Number(process.env.PORT) || 7193;
  const server = app.listen(port, () => {
    console.log(`API server is running on port ${port}.`);
  });

  const shutdown = () => {
    server.close(async () => {
      await pool.close();
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