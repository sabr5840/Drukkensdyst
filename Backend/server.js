
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { games: availableGames } = require(
  "../Frontend/Shared/games"
);

/**
 * =====================================================
 * EXPRESS
 * =====================================================
 */

const app = express();

const uploadsDir = path.join(
  __dirname,
  "uploads"
);

/**
 * =====================================================
 * UPLOAD AF PROFILBILLEDER
 * =====================================================
 */

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, {
    recursive: true,
  });
}

app.use(
  "/uploads",
  express.static(uploadsDir)
);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },

  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}.jpg`;

    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
});

app.post(
  "/upload-profile-image",
  upload.single("image"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        error: "Intet billede modtaget",
      });
    }

    const imageUrl =
      `http://10.0.0.28:3000/uploads/${req.file.filename}`;

    res.json({
      imageUrl,
    });
  }
);

/**
 * =====================================================
 * SERVER OG SOCKET.IO
 * =====================================================
 */

const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: "*",
  },
});

/**
 * =====================================================
 * ACTIVE GAMES
 * =====================================================
 */

let games = {};

/**
 * =====================================================
 * ROUND LIMIT
 * =====================================================
 */

function getRoundLimit(game, playerCount) {
  if (!game) return null;

  const setting = game.cardsPerRound;

  if (setting === "players") {
    const limits = {
      2: 4,
      3: 5,
      4: 3,
      5: 4,
      6: 4,
      7: 5,
      8: 6,
      9: 6,
      10: 7,
      11: 8,
      12: 8,
      13: 9,
      14: 9,
    };

    return limits[playerCount] ?? 10;
  }

  if (setting === "halfPlayers") {
    return playerCount < 3
      ? playerCount
      : Math.ceil(playerCount / 2);
  }

  if (
    typeof setting === "number" &&
    Number.isFinite(setting)
  ) {
    return setting;
  }

  return null;
}

/**
 * =====================================================
 * CHECK HOST
 * =====================================================
 */

function isLobbyHost(lobby, socketId) {
  return Boolean(
    lobby?.players?.some(
      (player) =>
        player.id === socketId &&
        player.isHost
    )
  );
}

/**
 * =====================================================
 * VOTING RESULTS
 * =====================================================
 */

function getVotingResults(voting) {
  if (!voting) return [];

  return voting.options.map((option) => {
    const voterIds = Object.entries(
      voting.votes
    )
      .filter(
        ([voterId, optionId]) =>
          String(optionId) ===
          String(option.id)
      )
      .map(([voterId]) => voterId);

    return {
      id: option.id,
      label: option.label,
      votes: voterIds.length,

      ...(voting.showVoters
        ? { voterIds }
        : {}),
    };
  });
}

/**
 * =====================================================
 * REVEAL VOTING RESULTS
 * =====================================================
 */

function revealVotingResults(lobby, gameId) {
  const voting = lobby?.voting;

  if (!voting || voting.revealed) {
    return;
  }

  voting.revealed = true;

  // Kender du mig?:
  // Send individuelle resultater til hver spiller.
  if (voting.gameId === "know_me") {
    const selectedPlayerId =
      voting.selectedPlayerId;

    const correctOptionId =
      voting.votes[selectedPlayerId];

    for (const player of lobby.players) {
      const playerVote =
        voting.votes[player.id];

      const isSelectedPlayer =
        player.id === selectedPlayerId;

      const isCorrect =
        !isSelectedPlayer &&
        correctOptionId !== undefined &&
        String(playerVote) ===
          String(correctOptionId);

      io.to(player.id).emit("voteResults", {
        gameId,
        roundId: voting.roundId,
        isCorrect: isSelectedPlayer
          ? null
          : isCorrect,
        isSelectedPlayer,
        correctOptionId,
        results: getVotingResults(voting),
        totalVotes: Object.keys(
          voting.votes
        ).length,
      });
    }

    return;
  }

  // Eksisterende resultatvisning til øvrige spil.
  io.to(gameId).emit("voteResults", {
    gameId,
    roundId: voting.roundId,
    results: getVotingResults(voting),
    totalVotes: Object.keys(
      voting.votes
    ).length,
    showVoters: voting.showVoters,
  });
}


/**
 * =====================================================
 * SOCKET CONNECTION
 * =====================================================
 */

io.on("connection", (socket) => {
  console.log(
    `En spiller forbundet: ${socket.id}`
  );

  /**
   * ===================================================
   * CREATE GAME
   * ===================================================
   */

  socket.on("createGame", (playerData) => {
    const gameId = generateGameId();

    games[gameId] = {
      id: gameId,

      players: [
        {
          ...playerData,
          id: socket.id,
          isHost: true,
        },
      ],

      gameState: "waiting",
      currentGame: null,

      voting: null,
      votingRound: 0,

      // Serveren holder styr på runderne.
      roundState: null,
    };

    socket.join(gameId);

    socket.emit("gameCreated", {
      gameId,
      players: games[gameId].players,
    });

    io.to(gameId).emit(
      "gamePlayers",
      games[gameId].players
    );

    console.log(
      `Spil oprettet: ${gameId}`
    );
  });

  /**
   * ===================================================
   * JOIN GAME
   * ===================================================
   */

  socket.on(
    "joinGame",
    ({
      gameId,
      name,
      profileImage,
    }) => {
      const lobby = games[gameId];

      if (!lobby) {
        socket.emit(
          "gameError",
          "Spillet eksisterer ikke."
        );
        return;
      }

      const existingPlayer =
        lobby.players.find(
          (player) =>
            player.name === name
        );

      if (existingPlayer) {
        socket.emit(
          "gameError",
          "En spiller med det navn er allerede i spillet."
        );
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

      io.to(gameId).emit(
        "gamePlayers",
        lobby.players
      );

      console.log(
        `${name} joinede spil ${gameId}`
      );
    }
  );

  /**
   * ===================================================
   * START GAME
   * ===================================================
   */

  socket.on(
    "startGame",
    ({ gameId }) => {
      const lobby = games[gameId];

      if (!lobby) {
        socket.emit(
          "gameError",
          "Spillet eksisterer ikke."
        );
        return;
      }

      if (
        !isLobbyHost(
          lobby,
          socket.id
        )
      ) {
        socket.emit(
          "gameError",
          "Kun hosten kan starte spillet."
        );
        return;
      }

      const selectedGame =
        getRandomGame();

      lobby.gameState = "inProgress";

      lobby.currentGame = selectedGame;

      lobby.voting = null;
      lobby.roundState = null;

      io.to(gameId).emit(
        "gameStarted",
        {
          gameId,
          game: selectedGame,
          players: lobby.players,
        }
      );
    }
  );

  /**
   * ===================================================
   * SHOW GAME INTRO
   * ===================================================
   */

  socket.on(
    "showGameIntro",
    ({
      gameId,
      game,
      reader,
    }) => {
      const lobby = games[gameId];

      if (!lobby) return;

      if (
        !isLobbyHost(
          lobby,
          socket.id
        )
      ) {
        socket.emit(
          "gameError",
          "Kun hosten kan styre spillet."
        );
        return;
      }

      if (!game) return;

      const selectedReader =
        reader ||
        getRandomPlayer(
          lobby.players
        );

      lobby.currentGame = game;

      // Nyt spil starter med ny rundestatus.
      lobby.voting = null;
      lobby.roundState = null;

      io.to(gameId).emit(
        "showGameIntro",
        {
          gameId,
          game,
          players: lobby.players,
          reader: selectedReader,
        }
      );
    }
  );

  /**
   * ===================================================
   * DEL 3 FORTSÆTTER HER
   * ===================================================
   *
   * Næste del:
   *
   * - showGamePlay
   * - Oprettelse af afstemninger
   * - Kender du mig? med to svar
   * - Valg af den udvalgte spiller
   * - Udsendelse af nye runder
   */

  /**
   * ===================================================
   * SHOW GAME PLAY
   * ===================================================
   *
   * Opretter en ny runde.
   *
   * Kender du mig?:
   * - To svarmuligheder
   * - Én udvalgt spiller
   * - Alle spillere får samme spørgsmål
   * - Den udvalgte spiller stemmer selv
   *
   * Øvrige spil beholder deres
   * eksisterende afstemningslogik.
   * ===================================================
   */

  socket.on(
    "showGamePlay",
    ({
      gameId,
      game,
      usedIndexes = [],
      usedPlayerIndexes = [],
      turnCount = 0,
      reader,
    }) => {
      const lobby = games[gameId];

      if (!lobby) return;

      /**
       * =================================================
       * HOST VALIDATION
       * =================================================
       */

      if (!isLobbyHost(lobby, socket.id)) {
        socket.emit(
          "gameError",
          "Kun hosten kan styre spillet."
        );
        return;
      }

      if (!game) return;

      /**
       * =================================================
       * FORHINDR DOBBELTE RUNDER
       * =================================================
       */

      const previousRound = lobby.roundState;

      const sameGame =
        lobby.currentGame?.id === game.id;

      if (
        sameGame &&
        previousRound &&
        lobby.voting &&
        !lobby.voting.revealed
      ) {
        // Der er stadig en aktiv afstemning.
        return;
      }

      /**
       * =================================================
       * ROUND LIMIT
       * =================================================
       */

      const limit = getRoundLimit(
        game,
        lobby.players.length
      );

      const previousCount =
        sameGame && previousRound
          ? previousRound.turnCount
          : 0;

      if (
        limit !== null &&
        previousCount >= limit
      ) {
        socket.emit(
          "gameError",
          "Alle spørgsmål i dette spil er gennemført."
        );
        return;
      }

      /**
       * =================================================
       * OPRET NÆSTE SPØRGSMÅL
       * =================================================
       */

      const nextUsedIndexes =
        sameGame && previousRound
          ? previousRound.usedIndexes
          : usedIndexes;

      const nextUsedPlayerIndexes =
        sameGame && previousRound
          ? previousRound.usedPlayerIndexes
          : usedPlayerIndexes;

      const nextTurnCount =
        sameGame && previousRound
          ? previousRound.turnCount
          : turnCount;

      const gamePlayState = createGamePlayState(
        game,
        lobby.players,
        nextUsedIndexes,
        nextUsedPlayerIndexes,
        nextTurnCount
      );

      /**
       * =================================================
       * KENDER DU MIG – TO UDSAGN
       * =================================================
       *
       * Hvis den eksisterende kortgenerator
       * returnerer tre udsagn, bruges de
       * første to til denne runde.
       *
       * De resterende udsagn ændres ikke
       * for de andre spiltyper.
       */

      if (
        game.id === "know_me" &&
        Array.isArray(gamePlayState.card)
      ) {
        gamePlayState.card =
          gamePlayState.card.slice(0, 2);
      }

      /**
       * =================================================
       * GEM NY RUNDE PÅ SERVEREN
       * =================================================
       */

      lobby.currentGame = game;

      lobby.roundState = {
        gameId: game.id,
        card: gamePlayState.card,
        usedIndexes: gamePlayState.usedIndexes,
        usedPlayerIndexes:
          gamePlayState.usedPlayerIndexes,
        turnCount: gamePlayState.turnCount,
      };

      /**
       * =================================================
       * NULSTIL AFSTEMNING
       * =================================================
       */

      lobby.voting = null;

      const votingGameIds = [
        "most_likely_to",
        "would_you_rather",
        "know_me",
      ];

      if (votingGameIds.includes(game.id)) {
        let options = [];

        /**
         * ===============================================
         * HVEM ER MEST TILBØJELIG TIL?
         * ===============================================
         */

        if (game.id === "most_likely_to") {
          options = lobby.players.map(
            (player) => ({
              id: player.id,
              label: player.name,
            })
          );
        }

        /**
         * ===============================================
         * HVAD VIL DU HELST?
         * ===============================================
         */

        if (
          game.id === "would_you_rather" &&
          gamePlayState.card
        ) {
          options = [
            {
              id: "A",
              label:
                gamePlayState.card.optionA,
            },
            {
              id: "B",
              label:
                gamePlayState.card.optionB,
            },
          ];
        }

        /**
         * ===============================================
         * KENDER DU MIG?
         * ===============================================
         */

        if (
          game.id === "know_me" &&
          Array.isArray(gamePlayState.card)
        ) {
          options = gamePlayState.card.map(
            (statement, index) => ({
              id: String(index),
              label: statement,
            })
          );
        }

        /**
         * ===============================================
         * OPRET NY AFSTEMNING
         * ===============================================
         */

        if (options.length > 0) {
          lobby.votingRound += 1;

          const selectedPlayer =
            game.id === "know_me"
              ? (
                  gamePlayState.currentPlayer ||
                  getRandomPlayer(lobby.players)
                )
              : null;

          lobby.voting = {
            roundId: lobby.votingRound,

            gameId: game.id,

            options,

            votes: {},

            revealed: false,

            // Bruges til Kender du mig?
            selectedPlayerId:
              selectedPlayer?.id || null,

            // Bruges kun af
            // Hvem er mest tilbøjelig til?
            showVoters:
              game.id === "most_likely_to"
                ? Math.random() < 0.5
                : false,
          };

          // Sørg for, at den udvalgte spiller
          // også findes i rundens data.
          if (
            game.id === "know_me" &&
            selectedPlayer
          ) {
            gamePlayState.currentPlayer =
              selectedPlayer;
          }
        }
      }

      /**
       * =================================================
       * SEND NY RUNDE TIL ALLE
       * =================================================
       */

      io.to(gameId).emit(
        "showGamePlay",
        {
          gameId,
          game,
          players: lobby.players,
          reader,

          ...gamePlayState,

          voting: lobby.voting
            ? {
                roundId:
                  lobby.voting.roundId,

                gameId:
                  lobby.voting.gameId,

                options:
                  lobby.voting.options,

                votedCount: 0,

                totalCount:
                  lobby.players.length,

                selectedPlayerId:
                  lobby.voting.selectedPlayerId,

                showVoters:
                  lobby.voting.showVoters,
              }
            : null,
        }
      );

      console.log(
        `Ny runde i ${game.id}: ${gamePlayState.turnCount}`
      );
    }
  );

  /**
   * ===================================================
   * DEL 4 FORTSÆTTER HER
   * ===================================================
   *
   * Næste del indeholder:
   *
   * - submitVote
   * - Automatisk afsløring af resultater
   * - revealVotes
   * - endGame
   * - leaveGame
   * - disconnect
   */

  /**
   * ===================================================
   * SUBMIT VOTE
   * ===================================================
   *
   * Registrerer en spillers stemme.
   *
   * - Kun aktive spillere må stemme
   * - Kun én stemme pr. spiller
   * - Kun gyldige valgmuligheder
   * - Kun stemmer til den aktive runde
   *
   * Kender du mig?:
   * - Den udvalgte spiller afgiver sit svar
   * - De øvrige spillere afgiver deres gæt
   * - Resultater vises, når alle har stemt
   */

  socket.on(
    "submitVote",
    ({
      gameId,
      roundId,
      optionId,
    }) => {
      const lobby = games[gameId];

      if (!lobby || !lobby.voting) {
        return;
      }

      const voting = lobby.voting;

      /**
       * ===============================================
       * KONTROLLER AKTIV RUNDE
       * ===============================================
       */

      if (
        voting.roundId !== roundId ||
        voting.revealed
      ) {
        return;
      }

      /**
       * ===============================================
       * KONTROLLER SPILLER
       * ===============================================
       */

      const player = lobby.players.find(
        (player) =>
          player.id === socket.id
      );

      if (!player) {
        return;
      }

      /**
       * ===============================================
       * FORHINDR DOBBELTSTEMMER
       * ===============================================
       */

      const alreadyVoted =
        Object.prototype.hasOwnProperty.call(
          voting.votes,
          socket.id
        );

      if (alreadyVoted) {
        return;
      }

      /**
       * ===============================================
       * KONTROLLER VALGMULIGHED
       * ===============================================
       */

      const validOption =
        voting.options.some(
          (option) =>
            String(option.id) ===
            String(optionId)
        );

      if (!validOption) {
        return;
      }

      /**
       * ===============================================
       * REGISTRER STEMME
       * ===============================================
       */

      voting.votes[socket.id] =
        optionId;

      const votedCount =
        Object.keys(
          voting.votes
        ).length;

      const totalCount =
        lobby.players.length;

      /**
       * ===============================================
       * SEND FREMSKRIDT TIL ALLE
       * ===============================================
       */

      io.to(gameId).emit(
        "voteProgress",
        {
          gameId,
          roundId,
          votedCount,
          totalCount,
        }
      );

      /**
       * ===============================================
       * AUTOMATISK RESULTAT
       * ===============================================
       *
       * Hvem er mest tilbøjelig til?
       * Kender du mig?
       *
       * Når alle har stemt, afsløres
       * resultaterne automatisk.
       */

      const autoRevealGames = [
        "most_likely_to",
        "know_me",
      ];

      if (
        autoRevealGames.includes(
          voting.gameId
        ) &&
        totalCount > 0 &&
        votedCount >= totalCount
      ) {
        revealVotingResults(
          lobby,
          gameId
        );
      }
    }
  );

  /**
   * ===================================================
   * REVEAL VOTES
   * ===================================================
   *
   * Manuel afsløring af stemmer.
   *
   * Bruges af spil, hvor hosten
   * selv styrer resultatvisningen.
   */

  socket.on(
    "revealVotes",
    ({
      gameId,
      roundId,
    }) => {
      const lobby = games[gameId];

      if (!lobby || !lobby.voting) {
        return;
      }

      /**
       * ===============================================
       * KUN HOSTEN
       * ===============================================
       */

      if (
        !isLobbyHost(
          lobby,
          socket.id
        )
      ) {
        return;
      }

      const voting = lobby.voting;

      /**
       * ===============================================
       * KONTROLLER RUNDE
       * ===============================================
       */

      if (
        voting.roundId !== roundId ||
        voting.revealed
      ) {
        return;
      }

      /**
       * ===============================================
       * KENDER DU MIG – VENT PÅ ALLE
       * ===============================================
       *
       * Forhindrer, at hosten
       * afslører resultatet, før
       * alle har afgivet deres svar.
       */

      if (
        voting.gameId === "know_me"
      ) {
        const votedCount =
          Object.keys(
            voting.votes
          ).length;

        const totalCount =
          lobby.players.length;

        if (
          votedCount < totalCount
        ) {
          return;
        }
      }

      /**
       * ===============================================
       * AFSLØR RESULTAT
       * ===============================================
       */

      revealVotingResults(
        lobby,
        gameId
      );
    }
  );

  /**
   * ===================================================
   * END GAME
   * ===================================================
   *
   * Afslutter hele spilsessionen.
   * Alle spillere sendes tilbage
   * til forsiden.
   */

  socket.on(
    "endGame",
    ({ gameId }) => {
      const lobby = games[gameId];

      if (!lobby) {
        return;
      }

      /**
       * ===============================================
       * KUN HOSTEN
       * ===============================================
       */

      if (
        !isLobbyHost(
          lobby,
          socket.id
        )
      ) {
        socket.emit(
          "gameError",
          "Kun hosten kan afslutte spillet."
        );
        return;
      }

      /**
       * ===============================================
       * INFORMER ALLE SPILLERE
       * ===============================================
       */

      io.to(gameId).emit(
        "gameEnded",
        {
          gameId,
        }
      );

      /**
       * ===============================================
       * FJERN SPILLERNE FRA RUMMET
       * ===============================================
       */

      for (
        const player of lobby.players
      ) {
        io.sockets.sockets
          .get(player.id)
          ?.leave(gameId);
      }

      /**
       * ===============================================
       * SLET LOBBY
       * ===============================================
       */

      delete games[gameId];

      console.log(
        `Spil afsluttet: ${gameId}`
      );
    }
  );

  /**
   * ===================================================
   * DEL 5 FORTSÆTTER HER
   * ===================================================
   *
   * Næste del indeholder:
   *
   * - leaveGame
   * - disconnect
   * - generateGameId
   * - getRandomGame
   * - getRandomIndex
   * - getRandomPlayer
   * - createGamePlayState
   * - createHotSeatState
   * - server.listen
   */

  /**
   * ===================================================
   * LEAVE GAME
   * ===================================================
   *
   * Når en spiller frivilligt forlader spillet.
   */

  socket.on("leaveGame", ({ gameId }) => {
    const lobby = games[gameId];

    if (!lobby) return;

    const wasPlayer = lobby.players.some(
      (player) => player.id === socket.id
    );

    if (!wasPlayer) return;

    // Fjern spilleren.
    lobby.players = lobby.players.filter(
      (player) => player.id !== socket.id
    );

    socket.leave(gameId);

    /**
     * Opdater aktiv afstemning.
     */

    if (lobby.voting && !lobby.voting.revealed) {
      delete lobby.voting.votes[socket.id];

      const votedCount = Object.keys(
        lobby.voting.votes
      ).length;

      const totalCount = lobby.players.length;

      io.to(gameId).emit("voteProgress", {
        gameId,
        roundId: lobby.voting.roundId,
        votedCount,
        totalCount,
      });

      // Kender du mig?:
      // Hvis den udvalgte spiller forlader
      // spillet, kan runden ikke bedømmes.
      if (
        lobby.voting.gameId === "know_me" &&
        lobby.voting.selectedPlayerId === socket.id
      ) {
        lobby.voting.revealed = true;

        io.to(gameId).emit("voteResults", {
          gameId,
          roundId: lobby.voting.roundId,
          isCorrect: null,
          cancelled: true,
          message:
            "Den udvalgte spiller har forladt spillet.",
        });
      } else if (
        ["most_likely_to", "know_me"].includes(
          lobby.voting.gameId
        ) &&
        totalCount > 0 &&
        votedCount >= totalCount
      ) {
        revealVotingResults(lobby, gameId);
      }
    }

    // Slet tom lobby.
    if (lobby.players.length === 0) {
      delete games[gameId];
      return;
    }

    // Overfør hostrollen, hvis nødvendigt.
    if (
      !lobby.players.some(
        (player) => player.isHost
      )
    ) {
      lobby.players[0].isHost = true;
    }

    // Opdater spillerlisten.
    io.to(gameId).emit(
      "gamePlayers",
      lobby.players
    );

    console.log(
      `Spiller forlod spil ${gameId}`
    );
  });

  /**
   * ===================================================
   * DISCONNECT
   * ===================================================
   *
   * Når en spiller mister forbindelsen.
   */

  socket.on("disconnect", () => {
    console.log(
      `En spiller afbrudt: ${socket.id}`
    );

    for (const gameId in games) {
      const lobby = games[gameId];

      const wasPlayer = lobby.players.some(
        (player) => player.id === socket.id
      );

      if (!wasPlayer) continue;

      // Fjern spilleren.
      lobby.players = lobby.players.filter(
        (player) => player.id !== socket.id
      );

      /**
       * Opdater aktiv afstemning.
       */

      if (
        lobby.voting &&
        !lobby.voting.revealed
      ) {
        delete lobby.voting.votes[socket.id];

        const votedCount = Object.keys(
          lobby.voting.votes
        ).length;

        const totalCount =
          lobby.players.length;

        io.to(gameId).emit(
          "voteProgress",
          {
            gameId,
            roundId: lobby.voting.roundId,
            votedCount,
            totalCount,
          }
        );

        // Afslut runden uden bedømmelse,
        // hvis den udvalgte spiller
        // mister forbindelsen.
        if (
          lobby.voting.gameId === "know_me" &&
          lobby.voting.selectedPlayerId ===
            socket.id
        ) {
          lobby.voting.revealed = true;

          io.to(gameId).emit(
            "voteResults",
            {
              gameId,
              roundId: lobby.voting.roundId,
              isCorrect: null,
              cancelled: true,
              message:
                "Den udvalgte spiller mistede forbindelsen.",
            }
          );
        } else if (
          ["most_likely_to", "know_me"].includes(
            lobby.voting.gameId
          ) &&
          totalCount > 0 &&
          votedCount >= totalCount
        ) {
          revealVotingResults(
            lobby,
            gameId
          );
        }
      }

      // Slet tom lobby.
      if (lobby.players.length === 0) {
        delete games[gameId];
        continue;
      }

      // Overfør hostrollen.
      if (
        !lobby.players.some(
          (player) => player.isHost
        )
      ) {
        lobby.players[0].isHost = true;
      }

      // Opdater spillerlisten.
      io.to(gameId).emit(
        "gamePlayers",
        lobby.players
      );
    }
  });
});

/**
 * =====================================================
 * GENERATE GAME ID
 * =====================================================
 */

function generateGameId() {
  let gameId;

  do {
    gameId = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
  } while (games[gameId]);

  return gameId;
}

/**
 * =====================================================
 * GET RANDOM GAME
 * =====================================================
 */

function getRandomGame() {
  if (
    !availableGames ||
    availableGames.length === 0
  ) {
    return null;
  }

  const randomIndex = Math.floor(
    Math.random() * availableGames.length
  );

  return availableGames[randomIndex];
}

/**
 * =====================================================
 * GET RANDOM INDEX
 * =====================================================
 *
 * Vælger et tilfældigt indeks,
 * der ikke allerede er brugt.
 */

function getRandomIndex(
  items,
  usedIndexes = []
) {
  if (
    !Array.isArray(items) ||
    items.length === 0
  ) {
    return null;
  }

  const availableIndexes = items
    .map((_, index) => index)
    .filter(
      (index) =>
        !usedIndexes.includes(index)
    );

  if (availableIndexes.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(
    Math.random() * availableIndexes.length
  );

  return availableIndexes[randomIndex];
}

/**
 * =====================================================
 * GET RANDOM PLAYER
 * =====================================================
 */

function getRandomPlayer(players) {
  if (!players || players.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(
    Math.random() * players.length
  );

  return players[randomIndex];
}

/**
 * =====================================================
 * DEL 6 FORTSÆTTER HER
 * =====================================================
 *
 * Sidste del indeholder:
 *
 * - createGamePlayState
 * - Valg af præcis to udsagn
 *   til Kender du mig?
 * - Rotation mellem spillere
 * - getRandomQuestionsFromCategory
 * - createHotSeatState
 * - server.listen
 */

/**
 * =====================================================
 * CREATE GAME PLAY STATE
 * =====================================================
 *
 * Vælger spørgsmål og opdaterer
 * antallet af gennemførte runder.
 *
 * Forhindrer gentagelser, indtil
 * alle spørgsmål er brugt.
 *
 * Kender du mig?:
 * - Vælger præcis to udsagn
 * - Vælger en udvalgt spiller
 * - Undgår gentagelse af spillere,
 *   indtil alle har været valgt
 * =====================================================
 */

function createGamePlayState(
  game,
  players,
  usedIndexes = [],
  usedPlayerIndexes = [],
  turnCount = 0
) {
  /**
   * ===================================================
   * HOT SEAT
   * ===================================================
   */

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

  /**
   * ===================================================
   * RANDOM STATEMENTS
   * ===================================================
   *
   * Kender du mig? bruger 2 udsagn.
   * Andre spil med denne skærmtype
   * bruger fortsat 3 udsagn.
   */

  if (
    game.screenType ===
    "three_random_statements"
  ) {
    const selectedCards = [];

    const numberOfStatements =
      game.id === "know_me" ? 2 : 3;

    for (
      let i = 0;
      i < numberOfStatements;
      i++
    ) {
      if (
        newUsedIndexes.length >=
        game.cards.length
      ) {
        newUsedIndexes = [];
      }

      const nextIndex = getRandomIndex(
        game.cards,
        newUsedIndexes
      );

      if (nextIndex === null) {
        break;
      }

      newUsedIndexes.push(nextIndex);

      selectedCards.push(
        game.cards[nextIndex]
      );
    }

    selectedCard = selectedCards;
  } else {
    /**
     * =================================================
     * NORMAL CARD SELECTION
     * =================================================
     */

    if (
      newUsedIndexes.length >=
      game.cards.length
    ) {
      newUsedIndexes = [];
    }

    const nextIndex = getRandomIndex(
      game.cards,
      newUsedIndexes
    );

    if (nextIndex !== null) {
      newUsedIndexes.push(nextIndex);

      selectedCard =
        game.cards[nextIndex];
    }
  }

  /**
   * ===================================================
   * PLAYER TURNS
   * ===================================================
   *
   * Kender du mig? skal altid have
   * én udvalgt spiller.
   */

  let newUsedPlayerIndexes = [
    ...usedPlayerIndexes,
  ];

  let selectedPlayer = null;

  const requiresPlayer =
    game.mode === "player_turns" ||
    game.id === "know_me";

  if (
    requiresPlayer &&
    players.length > 0
  ) {
    if (
      newUsedPlayerIndexes.length >=
      players.length
    ) {
      newUsedPlayerIndexes = [];
    }

    const nextPlayerIndex =
      getRandomIndex(
        players,
        newUsedPlayerIndexes
      );

    if (nextPlayerIndex !== null) {
      newUsedPlayerIndexes.push(
        nextPlayerIndex
      );

      selectedPlayer =
        players[nextPlayerIndex];
    }
  }

  /**
   * ===================================================
   * RETURN NEW ROUND
   * ===================================================
   */

  return {
    card: selectedCard,

    usedIndexes: newUsedIndexes,

    usedPlayerIndexes:
      newUsedPlayerIndexes,

    currentPlayer:
      selectedPlayer,

    turnCount:
      turnCount + 1,
  };
}

/**
 * =====================================================
 * RANDOM QUESTIONS FROM CATEGORY
 * =====================================================
 */

function getRandomQuestionsFromCategory(
  questions,
  amount = 3
) {
  if (!Array.isArray(questions)) {
    return [];
  }

  const shuffled = [
    ...questions,
  ].sort(
    () => Math.random() - 0.5
  );

  return shuffled.slice(
    0,
    amount
  );
}

/**
 * =====================================================
 * CREATE HOT SEAT STATE
 * =====================================================
 *
 * Vælger en spiller og spørgsmål
 * fra de tre kategorier.
 */

function createHotSeatState(
  game,
  players,
  usedIndexes = [],
  usedPlayerIndexes = [],
  turnCount = 0
) {
  let newUsedPlayerIndexes = [
    ...usedPlayerIndexes,
  ];

  /**
   * ===================================================
   * RESET PLAYER INDEXES
   * ===================================================
   */

  if (
    newUsedPlayerIndexes.length >=
    players.length
  ) {
    newUsedPlayerIndexes = [];
  }

  /**
   * ===================================================
   * SELECT RANDOM PLAYER
   * ===================================================
   */

  const nextPlayerIndex =
    getRandomIndex(
      players,
      newUsedPlayerIndexes
    );

  if (nextPlayerIndex !== null) {
    newUsedPlayerIndexes.push(
      nextPlayerIndex
    );
  }

  const selectedPlayer =
    nextPlayerIndex !== null
      ? players[nextPlayerIndex]
      : null;

  /**
   * ===================================================
   * SELECT QUESTIONS
   * ===================================================
   */

  const selectedQuestions = {
    green:
      getRandomQuestionsFromCategory(
        game.cards.green || [],
        3
      ),

    orange:
      getRandomQuestionsFromCategory(
        game.cards.orange || [],
        3
      ),

    red:
      getRandomQuestionsFromCategory(
        game.cards.red || [],
        3
      ),
  };

  /**
   * ===================================================
   * RETURN NEW ROUND
   * ===================================================
   */

  return {
    card: selectedQuestions,

    usedIndexes,

    usedPlayerIndexes:
      newUsedPlayerIndexes,

    currentPlayer:
      selectedPlayer,

    turnCount:
      turnCount + 1,
  };
}

/**
 * =====================================================
 * START SERVER
 * =====================================================
 */

server.listen(3000, () => {
  console.log(
    "Serveren kører på port 3000"
  );
});
