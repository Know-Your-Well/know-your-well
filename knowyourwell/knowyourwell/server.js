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
  const app = createApp({ pool, sqlClient: sql });
  // IISNode may provide PORT as a named-pipe path rather than a numeric port.
  // Preserve the value as-is; coercing it to Number makes it NaN and silently
  // binds Express to 7193, where IISNode is not listening.
  const port = process.env.PORT || 7193;
  const server = app.listen(port, () => {
    console.log(`API server is running on port ${port}.`);
  });

  // Start serving health, session, and authentication routes immediately. A
  // transient or unavailable SQL connection must not prevent the API process
  // from listening, since those routes do not depend on the database.
  pool.connect().catch((error) => {
    console.error("Unable to connect to the database; data routes may fail:", error.message);
  });

  const shutdown = () => {
    server.close(async () => {
      if (pool.connected) await pool.close();
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