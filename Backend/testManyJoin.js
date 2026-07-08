const { io } = require("socket.io-client");

const gameId = process.argv[2];

if (!gameId) {
  console.log("Brug sådan: node testManyJoin.js FESTKODE");
  process.exit(1);
}

const players = [
  ["Anna", 1],
  ["Mads", 2],
  ["Julie", 3],
  ["Emil", 4],
  ["Sofie", 5],
  ["Oliver", 6],
  ["Emma", 7],
  ["Lucas", 8],
  ["Freja", 9],
  ["Noah", 10],
  ["Clara", 11],
  ["Oscar", 12],
  ["Ida", 13],
  ["William", 14],
  ["Laura", 15],
];

const sockets = [];

players.forEach(([name, imageNumber], index) => {
  setTimeout(() => {
    const socket = io("http://localhost:3000", {
      transports: ["websocket"],
    });

    sockets.push(socket);

    socket.on("connect", () => {
      console.log(`${name} forbundet: ${socket.id}`);

      socket.emit("joinGame", {
        gameId,
        name,
        profileImage: `https://i.pravatar.cc/150?img=${imageNumber}`,
      });
    });

    socket.on("joinedGame", (data) => {
      console.log(`${name} joinede ✅`);
      console.log("Antal spillere:", data.players.length);
    });

    socket.on("gameError", (message) => {
      console.log(`${name} fejl:`, message);
    });
  }, index * 300);
});

console.log("Holder 15 testspillere online. Tryk Ctrl+C for at stoppe.");