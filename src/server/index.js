"use strict";
exports.__esModule = true;
var path = require("path");
var http = require("http");
var express = require("express");
var socketIO = require("socket.io");
var services_1 = require("./services");
var app = express();
var server = http.createServer(app);
var io = socketIO(server);
// middleware
app.use(express.static(path.join(__dirname + "../../../node_modules")));
app.use(express.static(path.join(__dirname, "../client")));
app.get("*", function (req, res) {
    res.sendFile(path.join(__dirname, "../client/index.html"));
});
// configure socket events
io.on("connection", function (socket) {
    services_1.requestManager(socket);
});
// init server
server.listen(3000, function () {
    console.log("Server up and running @ http://localhost:3000/");
});
