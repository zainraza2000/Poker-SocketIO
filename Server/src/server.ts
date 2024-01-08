import express from "express";
import http from "http";
import { Server } from "socket.io";
import { Poker } from "./types";

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const poker = new Poker(0);
app.use(express.static("public"));

// function handlePlayerAction(socket, action) {
//   // Identify the player based on the socket or other authentication mechanisms
//   const playerId = getPlayerId(socket);
//   switch (action) {
//     case "check":
//       pokerGame.check(playerId);
//       break;
//     case "fold":
//       pokerGame.fold(playerId);
//       break;
//     case "raise":
//       pokerGame.raise(playerId, action.amount);
//       break;
//   }
//   io.emit("updateGameState", pokerGame.getGameState());
// }
// Handle socket connections
io.on("connection", (socket) => {
  const playerId = poker.addPlayer(socket.id);
  socket.emit("playerId", playerId);
  // Handle disconnections
  const connections = io.sockets.sockets.size;
  if (connections >= 2) {
    io.emit("updateGameState", "let the games begin");
  }
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
