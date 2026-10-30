// Azure's IISNode configuration starts index.js. Keep this as the runtime entry
// point while keeping route imports side-effect free for tests and other callers.
const createApiRouter = require("./routes/index.js");

if (require.main === module) {
	require("./server.js").startServer();
}

module.exports = createApiRouter;