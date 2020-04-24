const express = require("express");
const app = express();

const http = require("http").createServer(app);

http.listen(3000, function () {
    console.log("Server started");
});
