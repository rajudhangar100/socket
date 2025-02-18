const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

let roomCodes = {}; // Store room codes and players

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Create a unique room code and store the socket
  socket.on("codecreate", (code) => {
    if (!roomCodes[code]) {
      roomCodes[code] = { players: [] };
    }
    socket.emit("codeCreated", { success: true, code });
  });

  // Compare code and join room if valid
  socket.on("compare_code", (code) => {
    if (roomCodes[code]) {
      socket.join(code);
      roomCodes[code].players.push(socket);

      if (roomCodes[code].players.length === 2) {
        // Start game once two players have joined
        io.to(code).emit("gameStart", { room: code });
      }
    } else {
      socket.emit("invalidCode", { message: "Invalid code!" });
    }
  });

  // Handle move event
  socket.on("move", (data) => {
    io.to(data.room).emit("move", data);
  });

  // Handle game over
  socket.on("gameOver", (data) => {
    console.log("Game Over:", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(4000, () => {
  console.log("WebSocket server running on port 4000");
});
