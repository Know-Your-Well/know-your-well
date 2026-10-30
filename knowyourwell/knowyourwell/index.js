// Backward-compatible entry point for consumers that import the package root.
// Endpoint implementations live in ./routes/ and are composed by ./routes/index.js.
module.exports = require("./routes/index.js");
