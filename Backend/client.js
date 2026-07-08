const readline = require('readline');
const socket = require('socket.io-client')('http://localhost:3000');

// Setup readline interface for input from user
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let gameId = ''; // Hold styr på den aktuelle gameId
let isHost = false; // Om spilleren er host eller ikke

// Når vi har forbindelse til serveren
socket.on('connect', () => {
    console.log('Forbundet til serveren!');
    
    // Vent på at spilleren opretter et spil eller deltager i et eksisterende spil
    rl.question('Vil du oprette et spil eller deltage? (opret/deltag) ', (action) => {
        if (action.toLowerCase() === 'opret') {
            // Opret et spil
            rl.question('Indtast dit navn: ', (name) => {
                socket.emit('createGame', { name, imageUri });
                savePlayer({ name, imageUri, gameId: id });

                console.log('Spillet er oprettet, vent på at andre spillerne tilslutter sig...');
            });
        } else if (action.toLowerCase() === 'deltag') {
            // Deltag i et spil
            rl.question('Indtast gameId: ', (id) => {
                gameId = id;
                rl.question('Indtast dit navn: ', (name) => {
                    socket.emit('joinGame', id, { name });
                    savePlayer({ name, gameId: id });
                });
            });
        }
    });
});

// Modtag opdatering af spillernes liste i spillet
socket.on('gamePlayers', (players) => {
    console.log("🔄 Opdateret spillerliste:");
    players.forEach(player => {
        console.log(`- ${player.name} (Host: ${player.isHost ? 'Ja' : 'Nej'})`);
    });
    
    // Tjek om vi er host
    const currentPlayer = players.find(player => player.id === socket.id);
    isHost = currentPlayer && currentPlayer.isHost;
    
    if (isHost) {
        rl.question('Er du klar til at starte spillet? (ja/nej) ', (answer) => {
            if (answer.toLowerCase() === 'ja') {
                socket.emit('startGame', gameId);
            } else {
                console.log('Vent på at hosten starter spillet.');
            }
        });
    }
});

// Modtag spilstatus opdatering
socket.on('gameState', (state) => {
    console.log('Spilstatus:', state);
    if (state === 'inProgress') {
        startMiniGameFlow();
    }
});

// Start flowet af mini-spil
function startMiniGameFlow() {
    console.log('Spillet er startet!');
    socket.emit('startGame', gameId);
}

// Modtag næste mini-spil
socket.on('nextMiniGame', (miniGame) => {
    console.log(`Næste mini-spil: ${miniGame}`);
    rl.question('Er du klar til at spille? (ja/nej) ', (answer) => {
        if (answer.toLowerCase() === 'ja') {
            // Start mini-spillet
            console.log(`Spiller mini-spil: ${miniGame}`);
        } else {
            socket.emit('skipMiniGame', gameId);
            console.log('Du hoppede over mini-spillet!');
        }
    });
});

// Lyt efter frakobling
socket.on('disconnect', () => {
    console.log('Du er blevet afbrudt fra serveren.');
    rl.close();
});

// Lyt efter fejlmeddelelser
socket.on('error', (message) => {
    console.error(`Fejl: ${message}`);
    rl.close();
});
