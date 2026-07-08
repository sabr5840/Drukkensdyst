const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const uploadsDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

app.use("/uploads", express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

app.post("/upload-profile-image", upload.single("image"), (req, res) => {
  const imageUrl = `http://10.0.0.28:3000/uploads/${req.file.filename}`;

  res.json({
    imageUrl,
  });
});

const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: "*",
  },
});

let games = {};

io.on("connection", (socket) => {
  console.log(`En spiller forbundet: ${socket.id}`);

  socket.on("createGame", (playerData) => {
    const gameId = generateGameId();

    games[gameId] = {
      id: gameId,
      players: [{ ...playerData, id: socket.id, isHost: true }],
      gameState: "waiting",
    };

    socket.join(gameId);

    socket.emit("gameCreated", {
      gameId,
      players: games[gameId].players,
    });

    io.to(gameId).emit("gamePlayers", games[gameId].players);

    console.log(`Spil oprettet: ${gameId}`);
  });

  socket.on("joinGame", ({ gameId, name, profileImage }) => {
    const game = games[gameId];

    if (!game) {
      socket.emit("gameError", "Spillet eksisterer ikke.");
      return;
    }

    const existingPlayer = game.players.find((player) => player.name === name);

    if (existingPlayer) {
      socket.emit("gameError", "En spiller med det navn er allerede i spillet.");
      return;
    }

    const player = {
      id: socket.id,
      name,
      profileImage,
      isHost: false,
    };

    game.players.push(player);
    socket.join(gameId);

    socket.emit("joinedGame", {
      gameId,
      players: game.players,
    });

    io.to(gameId).emit("gamePlayers", game.players);

    console.log(`${name} joinede spil ${gameId}`);
  });

  socket.on("startGame", ({ gameId, game: selectedGame }) => {
    const lobby = games[gameId];

    if (!lobby) {
      socket.emit("gameError", "Spillet eksisterer ikke.");
      return;
    }

    const player = lobby.players.find((p) => p.id === socket.id);

    if (!player?.isHost) {
      socket.emit("gameError", "Kun hosten kan starte spillet.");
      return;
    }

    lobby.gameState = "inProgress";

    io.to(gameId).emit("gameStarted", {
      gameId,
      game: selectedGame,
      players: lobby.players,
    });
  });

  socket.on("showGameIntro", ({ gameId, game, reader }) => {
    const lobby = games[gameId];

    if (!lobby) return;

    const player = lobby.players.find((p) => p.id === socket.id);

    if (!player?.isHost) {
      socket.emit("gameError", "Kun hosten kan styre spillet.");
      return;
    }

    io.to(gameId).emit("showGameIntro", {
      gameId,
      game,
      players: lobby.players,
      reader,
    });
  });

  socket.on("showGamePlay", ({
    gameId,
    game,
    card,
    usedIndexes,
    usedPlayerIndexes,
    currentPlayer,
    reader,
  }) => {
    const lobby = games[gameId];

    if (!lobby) return;

    const player = lobby.players.find((p) => p.id === socket.id);

    if (!player?.isHost) {
      socket.emit("gameError", "Kun hosten kan styre spillet.");
      return;
    }

    io.to(gameId).emit("showGamePlay", {
      gameId,
      game,
      players: lobby.players,
      card,
      usedIndexes,
      usedPlayerIndexes,
      currentPlayer,
      reader,
    });
  });

  socket.on("disconnect", () => {
    console.log(`En spiller afbrudt: ${socket.id}`);

    for (const gameId in games) {
      const game = games[gameId];

      game.players = game.players.filter((player) => player.id !== socket.id);

      if (game.players.length === 0) {
        delete games[gameId];
        continue;
      }

      if (!game.players.some((player) => player.isHost)) {
        game.players[0].isHost = true;
      }

      io.to(gameId).emit("gamePlayers", game.players);
    }
  });
});

function generateGameId() {
  let gameId;

  do {
    gameId = Math.floor(100000 + Math.random() * 900000).toString();
  } while (games[gameId]);

  return gameId;
}

server.listen(3000, () => {
  console.log("Server kører på port 3000");
});