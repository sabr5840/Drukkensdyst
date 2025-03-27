const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let games = {}; // Gemmer spil med deres ID

io.on('connection', (socket) => {
    console.log(`En spiller forbundet: ${socket.id}`);

    socket.on('createGame', (playerData) => {
        const gameId = generateGameId();
        games[gameId] = { id: gameId, players: [] }; // Starter tomt
        socket.emit('gameCreated', gameId);
    });

    socket.on('joinGame', (gameId, playerData) => {
        const game = games[gameId];
        if (!game) {
            socket.emit('error', 'Spillet eksisterer ikke.');
            return;
        }

        // Undgå duplikerede spillere
        const existingPlayer = game.players.find(player => player.id === socket.id);
        if (!existingPlayer) {
            game.players.push({ ...playerData, id: socket.id });
        }

        socket.join(gameId);
        console.log(`${playerData.name} er nu i spillet ${gameId}`);
        console.log("Aktuelle spillere i spillet:", game.players.map(p => p.name));

        // **Kun joinGame håndterer opdateret spillerliste**
        io.to(gameId).emit('gamePlayers', game.players);
    });

    socket.on('disconnect', () => {
        console.log(`En spiller afbrudt: ${socket.id}`);
        for (const gameId in games) {
            const game = games[gameId];
            game.players = game.players.filter(player => player.id !== socket.id);

            if (game.players.length === 0) {
                delete games[gameId];
            } else {
                io.to(gameId).emit('gamePlayers', game.players);
            }
        }
    });
});

// **Funktion til at generere en 6-cifret pinkode**
function generateGameId() {
    let gameId;
    do {
        gameId = Math.floor(100000 + Math.random() * 900000).toString(); // 6 cifre
    } while (games[gameId]);
    return gameId;
}

server.listen(3000, () => {
    console.log('Server kører på port 3000');
});
