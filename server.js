const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const PORT = 4000;
const GRID_SIZE = 6;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

let players = {};
let restartVotes = new Set();

function createGrid() {
  const totalTiles = GRID_SIZE * GRID_SIZE;
  const half = totalTiles / 2;
  const tiles = Array(half).fill('chicken').concat(Array(half).fill('banana'));
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }
  return tiles;
}

let gameState = {
  grid: createGrid(),
  tileStates: Array(GRID_SIZE * GRID_SIZE).fill(null),
  turnClicks: { banana: null, chicken: null },
  currentPlayer: 'banana',
  winner: null,
  gameStatus: 'waiting', // waiting, playing, finished
  playersReady: { banana: false, chicken: false },
};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Send initial state
  socket.emit('gameState', gameState);

  socket.on('ready', (player) => {
    if (player !== 'banana' && player !== 'chicken') return;
    gameState.playersReady[player] = true;

    if (gameState.playersReady.banana && gameState.playersReady.chicken) {
      gameState.gameStatus = 'playing';
      gameState.currentPlayer = 'banana';
    }
    io.emit('gameState', gameState);
  });

  socket.on('tileClick', ({ player, index }) => {
    if (gameState.gameStatus !== 'playing') return;
    if (gameState.currentPlayer !== player) return;
    if (gameState.turnClicks[player] !== null) return;
    if (gameState.tileStates[index] === 'revealed' || gameState.tileStates[index] === 'mistake') return;

    gameState.turnClicks[player] = index;

    if (player === 'banana') {
      gameState.currentPlayer = 'chicken';
      io.emit('gameState', gameState);
    } else if (player === 'chicken') {
      // Both players clicked, reveal and validate
      const bananaIndex = gameState.turnClicks.banana;
      const chickenIndex = gameState.turnClicks.chicken;

      // Reveal tiles
      gameState.tileStates[bananaIndex] = 'revealed';
      gameState.tileStates[chickenIndex] = 'revealed';

      // Validate moves
      const bananaTileType = gameState.grid[bananaIndex];
      const chickenTileType = gameState.grid[chickenIndex];

      const bananaMistake = bananaTileType !== 'banana';
      const chickenMistake = chickenTileType !== 'chicken';

      if (bananaMistake && chickenMistake) {
        gameState.winner = null;
        gameState.gameStatus = 'finished';
        io.emit('result', "Both players made a mistake! It's a tie!");
      } else if (bananaMistake) {
        gameState.tileStates[bananaIndex] = 'mistake';
        gameState.winner = 'chicken';
        gameState.gameStatus = 'finished';
        io.emit('result', 'Banana player clicked wrong tile! Chicken player wins!');
      } else if (chickenMistake) {
        gameState.tileStates[chickenIndex] = 'mistake';
        gameState.winner = 'banana';
        gameState.gameStatus = 'finished';
        io.emit('result', 'Chicken player clicked wrong tile! Banana player wins!');
      } else {
        io.emit('result', 'Both players clicked correctly! Next turn.');

        // Check win for banana
        const bananaWin = gameState.grid.every((tile, i) => tile !== 'banana' || gameState.tileStates[i] === 'revealed');
        const chickenWin = gameState.grid.every((tile, i) => tile !== 'chicken' || gameState.tileStates[i] === 'revealed');

        if (bananaWin) {
          gameState.winner = 'banana';
          gameState.gameStatus = 'finished';
          io.emit('result', 'Banana player cleared all tiles and wins!');
        } else if (chickenWin) {
          gameState.winner = 'chicken';
          gameState.gameStatus = 'finished';
          io.emit('result', 'Chicken player cleared all tiles and wins!');
        } else {
          // Reset turn for next round
          gameState.turnClicks = { banana: null, chicken: null };
          gameState.currentPlayer = 'banana';
        }
      }

      io.emit('gameState', gameState);
    }
  });

  socket.on('restart', () => {
    gameState = {
      grid: createGrid(),
      tileStates: Array(GRID_SIZE * GRID_SIZE).fill(null),
      turnClicks: { banana: null, chicken: null },
      currentPlayer: 'banana',
      winner: null,
      gameStatus: 'waiting',
      playersReady: { banana: false, chicken: false },
    };
    io.emit('gameState', gameState);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});
