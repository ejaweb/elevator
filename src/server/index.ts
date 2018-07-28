import * as path from "path";
import * as http from "http";
import * as express from "express";
import * as socketIO from "socket.io";
import { requestManager } from "./services";

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// middleware
app.use(express.static(path.join(__dirname + "../../../node_modules")));  
app.use(express.static(path.join(__dirname, "../client")));
app.get("*", (req: any, res: any) => {
  res.sendFile(path.join(__dirname, "../client/index.html"));
});

// configure socket events
io.on("connection", (socket) => {
  requestManager(socket);
});

// init server
server.listen(3000, () => {
  console.log("Server up and running @ http://localhost:3000/");
});
