const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // you can restrict this to your frontend domain
    methods: ["GET", "POST"],
  },
});

// Simple matchmaking variables
let waitingPlayer = null;
let roomCount = 0;

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // When a user is ready to play, they emit "joinGame" with their info
  socket.on("joinGame", (userData) => {
    // Save user info on the socket instance for later use
    socket.data.user = userData; // e.g., { uid, name, email }

    if (waitingPlayer) {
      // Pair up with the waiting player
      const roomName = `room-${roomCount++}`;
      socket.join(roomName);
      waitingPlayer.join(roomName);

      // Optionally decide which player goes first (here we choose the waiting player)
      io.to(roomName).emit("gameStart", {
        room: roomName,
        players: [waitingPlayer.data.user, socket.data.user],
        turn: waitingPlayer.id,
      });
      
      waitingPlayer = null; // Clear waiting player since match is made
    } else {
      // No waiting player: mark this socket as waiting
      waitingPlayer = socket;
      socket.emit("waiting", { message: "Waiting for an opponent..." });
    }
  });

  // Listen for moves; ensure you include the room so only that game gets updated
  socket.on("move", (data) => {
    // data should include: { room, board, nextPlayer, ... }
    socket.to(data.room).emit("move", data);
  });

  socket.on("disconnect", () => {
    // If the disconnecting user was waiting, clear the waiting variable
    if (waitingPlayer && waitingPlayer.id === socket.id) {
      waitingPlayer = null;
    }
    console.log("User disconnected:", socket.id);
  });
});

server.listen(4000, () => {
  console.log("WebSocket server running on port 4000");
});
