/**
 * database.js
 * 
 * This module provides a function to retrieve the database configuration for the application.
 * It attempts to read the configuration from a 'config.json' file. If the file is not found or cannot be read,
 * it falls back to using environment variables to construct the configuration.
 */

const fs = require("fs");
const path = require("path");

function getDatabaseConfig(env = process.env) {
  const configPath = path.resolve(__dirname, "..", "config.json");

  try {
    return JSON.parse(fs.readFileSync(configPath, "utf8"));
  } catch (error) {
    const isProduction = env.NODE_ENV === "production";

    return {
      user: "kywAdmin",
      password: env.APPSETTING_MSSQL_PASSWORD,
      database: isProduction ? "kyw" : "kywtestdb",
      server: "kyw.database.windows.net",
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
      },
      options: {
        encrypt: true,
        trustServerCertificate: false,
      },
    };
  }
}

module.exports = { getDatabaseConfig };