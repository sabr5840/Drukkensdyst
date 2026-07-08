const { io } = require("socket.io-client");

const socket = io("http://localhost:3000", {
  transports: ["websocket"],
});

const gameId = process.argv[2];
const name = process.argv[3] || "Testspiller";
const imageNumber = process.argv[4] || "1";

if (!gameId) {
  console.log("Brug sådan: node testJoin.js FESTKODE NAVN BILLEDE_NR");
  console.log("Eksempel: node testJoin.js 969554 Anna 2");
  process.exit(1);
}

const profileImage = `https://i.pravatar.cc/150?img=${imageNumber}`;

socket.on("connect", () => {
  console.log("Test-spiller forbundet:", socket.id);

  socket.emit("joinGame", {
    gameId,
    name,
    profileImage,
  });
});

socket.on("joinedGame", (data) => {
  console.log("Join lykkedes:", data);
});

socket.on("gamePlayers", (players) => {
  console.log("Spillere i lobby:", players.map((p) => p.name));
});

socket.on("gameError", (message) => {
  console.log("Fejl:", message);
});