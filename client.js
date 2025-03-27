const socket = require('socket.io-client')('http://localhost:3000');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

socket.on('connect', () => {
    console.log('Forbundet til serveren!');

    // Sørg for kun én event-handler for gamePlayers
    socket.off('gamePlayers'); 
    socket.on('gamePlayers', (players) => {
        console.log("🔄 Opdateret spillerliste:", players);
    });

    // Håndter fejlbeskeder fra serveren
    socket.off('error');
    socket.on('error', (message) => {
        console.log("⚠️ Fejl:", message);
    });

    startGameFlow();
});

function startGameFlow() {
    rl.question('Indtast dit navn: ', (playerName) => {
        rl.question('Indtast URL til dit profilbillede: ', (profileImage) => {
            const playerData = { name: playerName, profileImage: profileImage };

            rl.question('Vil du oprette et spil? (ja/nej): ', (createGame) => {
                if (createGame.toLowerCase() === 'ja') {
                    socket.emit('createGame', playerData);

                    socket.once('gameCreated', (gameId) => {
                        console.log(`Spil oprettet med ID: ${gameId}`);
                        joinGame(gameId, playerData);
                    });
                } else {
                    rl.question('Indtast spil-ID: ', (gameId) => {
                        joinGame(gameId, playerData);
                    });
                }
            });
        });
    });
}

function joinGame(gameId, playerData) {
    console.log(`Spiller ${playerData.name} forsøger at tilslutte sig spillet ${gameId}`);
    socket.emit('joinGame', gameId, playerData);
}
