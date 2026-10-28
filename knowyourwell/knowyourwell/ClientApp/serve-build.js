/*
    this file is used to achieve offline functionality for devs
    you have to run
        ```node serve-build.js```
    from there you can either turn off the serve rin the terminal by doing
        ```control + c```
    or go to the network tab in inspect element and throttle the connection to offline.
*/

const express = require("express");
const path = require("path");
const { createProxyMiddleware } = require("http-proxy-middleware");

const BACKEND_PORT = 7193; // the backend (npm run server)
const TEST_PORT = 5000;    // this test server, the one you open in the browser

const app = express();
const api = createProxyMiddleware({
    target: "http://localhost:" + BACKEND_PORT,
    changeOrigin: true,
});

app.use(express.static(path.join(__dirname, "build"), { index: false }));

// anything that isn't a page request goes to the backend
app.use((req, res, next) =>
    (req.headers.accept || "").includes("text/html") ? next() : api(req, res, next)
);

app.get("*", (req, res) =>
    res.sendFile(path.join(__dirname, "build", "index.html"))
);

app.listen(TEST_PORT, () =>
    console.log("Production build at http://localhost:" + TEST_PORT)
);

console.log("\nPICK THIS ONE!!!!!\nhttp://kywtest.localhost:"+TEST_PORT+"\n")