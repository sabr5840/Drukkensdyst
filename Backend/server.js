const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { games: availableGames } = require("../Frontend/Shared/games");

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
      currentGame: null,
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
    const lobby = games[gameId];

    if (!lobby) {
      socket.emit("gameError", "Spillet eksisterer ikke.");
      return;
    }

    const existingPlayer = lobby.players.find((player) => player.name === name);

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

    lobby.players.push(player);
    socket.join(gameId);

    socket.emit("joinedGame", {
      gameId,
      players: lobby.players,
    });

    io.to(gameId).emit("gamePlayers", lobby.players);

    console.log(`${name} joinede spil ${gameId}`);
  });

  socket.on("startGame", ({ gameId }) => {
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

    const selectedGame = getRandomGame();

    lobby.gameState = "inProgress";
    lobby.currentGame = selectedGame;

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

    const selectedReader = reader || getRandomPlayer(lobby.players);

    lobby.currentGame = game;

    io.to(gameId).emit("showGameIntro", {
      gameId,
      game,
      players: lobby.players,
      reader: selectedReader,
    });
  });

  socket.on("showGamePlay", ({
    gameId,
    game,
    usedIndexes = [],
    usedPlayerIndexes = [],
    turnCount = 0,
    reader,
  }) => {
    const lobby = games[gameId];

    if (!lobby) return;

    const player = lobby.players.find((p) => p.id === socket.id);

    if (!player?.isHost) {
      socket.emit("gameError", "Kun hosten kan styre spillet.");
      return;
    }

    const gamePlayState = createGamePlayState(
      game,
      lobby.players,
      usedIndexes,
      usedPlayerIndexes,
      turnCount
    );

    io.to(gameId).emit("showGamePlay", {
      gameId,
      game,
      players: lobby.players,
      reader,
      ...gamePlayState,
    });
  });

  socket.on("leaveGame", ({ gameId }) => {
    const lobby = games[gameId];

    if (!lobby) return;

    lobby.players = lobby.players.filter((player) => player.id !== socket.id);
    socket.leave(gameId);

    if (lobby.players.length === 0) {
      delete games[gameId];
      return;
    }

    if (!lobby.players.some((player) => player.isHost)) {
      lobby.players[0].isHost = true;
    }

    io.to(gameId).emit("gamePlayers", lobby.players);
  });

  socket.on("disconnect", () => {
    console.log(`En spiller afbrudt: ${socket.id}`);

    for (const gameId in games) {
      const lobby = games[gameId];

      lobby.players = lobby.players.filter((player) => player.id !== socket.id);

      if (lobby.players.length === 0) {
        delete games[gameId];
        continue;
      }

      if (!lobby.players.some((player) => player.isHost)) {
        lobby.players[0].isHost = true;
      }

      io.to(gameId).emit("gamePlayers", lobby.players);
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

function getRandomGame() {
  const randomIndex = Math.floor(Math.random() * availableGames.length);
  return availableGames[randomIndex];
}

function getRandomIndex(items, usedIndexes = []) {
  const availableIndexes = items
    .map((_, index) => index)
    .filter((index) => !usedIndexes.includes(index));

  if (availableIndexes.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * availableIndexes.length);
  return availableIndexes[randomIndex];
}

function getRandomPlayer(players) {
  if (!players || players.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * players.length);
  return players[randomIndex];
}

function createGamePlayState(
  game,
  players,
  usedIndexes = [],
  usedPlayerIndexes = [],
  turnCount = 0
) {
  if (game.screenType === "hot_seat") {
    return createHotSeatState(
      game,
      players,
      usedIndexes,
      usedPlayerIndexes,
      turnCount
    );
  }

  let newUsedIndexes = [...usedIndexes];
  let selectedCard = null;

  if (game.screenType === "three_random_statements") {
    const selectedCards = [];

    for (let i = 0; i < 3; i++) {
      if (newUsedIndexes.length === game.cards.length) {
        newUsedIndexes = [];
      }

      const nextIndex = getRandomIndex(game.cards, newUsedIndexes);

      if (nextIndex === null) break;

      newUsedIndexes.push(nextIndex);
      selectedCards.push(game.cards[nextIndex]);
    }

    selectedCard = selectedCards;
  } else {
    if (newUsedIndexes.length === game.cards.length) {
      newUsedIndexes = [];
    }

    const nextIndex = getRandomIndex(game.cards, newUsedIndexes);

    if (nextIndex !== null) {
      newUsedIndexes.push(nextIndex);
      selectedCard = game.cards[nextIndex];
    }
  }

  let newUsedPlayerIndexes = [...usedPlayerIndexes];
  let selectedPlayer = null;

  if (game.mode === "player_turns") {
    if (newUsedPlayerIndexes.length === players.length) {
      newUsedPlayerIndexes = [];
    }

    const nextPlayerIndex = getRandomIndex(players, newUsedPlayerIndexes);

    if (nextPlayerIndex !== null) {
      newUsedPlayerIndexes.push(nextPlayerIndex);
      selectedPlayer = players[nextPlayerIndex];
    }
  }

  return {
    card: selectedCard,
    usedIndexes: newUsedIndexes,
    usedPlayerIndexes: newUsedPlayerIndexes,
    currentPlayer: selectedPlayer,
    turnCount: turnCount + 1,
  };
}

function getRandomQuestionsFromCategory(questions, amount = 3) {
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, amount);
}

function createHotSeatState(
  game,
  players,
  usedIndexes = [],
  usedPlayerIndexes = [],
  turnCount = 0
) {
  let newUsedPlayerIndexes = [...usedPlayerIndexes];

  if (newUsedPlayerIndexes.length === players.length) {
    newUsedPlayerIndexes = [];
  }

  const nextPlayerIndex = getRandomIndex(players, newUsedPlayerIndexes);

  if (nextPlayerIndex !== null) {
    newUsedPlayerIndexes.push(nextPlayerIndex);
  }

  const selectedPlayer =
    nextPlayerIndex !== null ? players[nextPlayerIndex] : null;

  const selectedQuestions = {
    green: getRandomQuestionsFromCategory(game.cards.green || [], 3),
    orange: getRandomQuestionsFromCategory(game.cards.orange || [], 3),
    red: getRandomQuestionsFromCategory(game.cards.red || [], 3),
  };

  return {
    card: selectedQuestions,
    usedIndexes,
    usedPlayerIndexes: newUsedPlayerIndexes,
    currentPlayer: selectedPlayer,
    turnCount: turnCount + 1,
  };
}

server.listen(3000, () => {
  console.log("Server kører på port 3000");
});