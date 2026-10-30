// Azure's IISNode adapter may load this file as a module rather than as
// require.main, so start the server unconditionally as the configured entry point.
const createApiRouter = require("./routes/index.js");

require("./server.js").startServer();

module.exports = createApiRouter;