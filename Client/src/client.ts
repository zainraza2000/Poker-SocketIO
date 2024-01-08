import { io, Socket } from "socket.io-client";

const socket: Socket = io("http://localhost:3000"); // Change the URL based on your server configuration

// Listen for incoming messages
socket.on("chat message", (msg: string) => {
  console.log(`Received message: ${msg}`);
});

// Example: Send a message to the server
socket.emit("chat message", "Hello, server!");

socket.on("playerId", (playerId) => {
  console.log(`Connected with Player ID: ${playerId}`);
});

socket.on("updateGameState", (message) => {
  console.log(message);
});
