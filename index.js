const express = require("express");
const app = express();

const http = require("http").createServer(app);

http.listen(8000, function () {
    console.log("Server started");
});
