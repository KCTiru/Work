import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const CHICKEN_IMG =
  'https://thumbs.dreamstime.com/z/full-body-brown-chicken-hen-standing-isolated-white-backgroun-background-use-farm-animals-livestock-theme-49741285.jpg?ct=jpeg';
const BANANA_IMG =
  'https://thumbs.dreamstime.com/b/bunch-bananas-6175887.jpg?w=768';

const GRID_SIZE = 6;
const socket = io('http://172.18.0.176:4000'); // Replace with your backend IP

function App() {
  const [gameState, setGameState] = useState(null);
  const [message, setMessage] = useState(null);
  const [playerType, setPlayerType] = useState(null); // 'banana' or 'chicken'
  const [readyClicked, setReadyClicked] = useState(false);

  useEffect(() => {
    socket.on('gameState', (state) => {
      setGameState(state);
      // Clear message on new game start
      if(state.gameStatus === 'playing') setMessage(null);
    });

    socket.on('result', (msg) => {
      setMessage(msg);
    });

    return () => {
      socket.off('gameState');
      socket.off('result');
    };
  }, []);

  function handleReady(type) {
    setPlayerType(type);
    setReadyClicked(true);
    socket.emit('ready', type);
  }

  function handleTileClick(index) {
    if (!gameState) return;
    if (gameState.gameStatus !== 'playing') return;
    if (!playerType) {
      alert('Please select your player type and ready up first!');
      return;
    }
    if (gameState.currentPlayer !== playerType) return;
    if (gameState.turnClicks[playerType] !== null) return;
    if (gameState.tileStates[index] === 'revealed' || gameState.tileStates[index] === 'mistake') return;

    socket.emit('tileClick', { player: playerType, index });
  }

  function restartGame() {
    socket.emit('restart');
    setPlayerType(null);
    setReadyClicked(false);
    setMessage(null);
  }

  if (!gameState) {
    return <div>Loading game...</div>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Chicken Banana Multiplayer Game</h1>

      {!readyClicked && (
        <div>
          <button onClick={() => handleReady('banana')} style={{ marginRight: 10 }}>
            Join as Banana Player
          </button>
          <button onClick={() => handleReady('chicken')}>Join as Chicken Player</button>
        </div>
      )}

      <p>
        <b>Your role:</b> {playerType ? playerType.toUpperCase() : 'Not joined yet'} <br />
        <b>Game status:</b> {gameState.gameStatus} <br />
        <b>Current turn:</b> {gameState.currentPlayer ? gameState.currentPlayer.toUpperCase() : 'N/A'}
      </p>

      {message && (
        <div style={{ marginBottom: 10, padding: 10, backgroundColor: '#eee', borderRadius: 5 }}>
          <b>{message}</b>
        </div>
      )}

      {gameState.gameStatus === 'finished' && (
        <button onClick={restartGame}>Restart Game</button>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID_SIZE}, 60px)`,
          gap: 5,
          marginTop: 20,
          userSelect: 'none',
        }}
      >
        {gameState.grid.map((type, idx) => {
          const state = gameState.tileStates[idx];
          const showImage = state === 'revealed' || state === 'mistake';

          return (
            <div
              key={idx}
              onClick={() => handleTileClick(idx)}
              style={{
                width: 60,
                height: 60,
                border: '1px solid black',
                backgroundColor: state === 'mistake' ? '#f88' : state === 'revealed' ? '#ddd' : '#444',
                cursor:
                  gameState.gameStatus === 'playing' &&
                  gameState.currentPlayer === playerType &&
                  gameState.turnClicks[playerType] === null &&
                  !state
                    ? 'pointer'
                    : 'default',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
              title={state === 'mistake' ? 'Mistake' : 'Hidden Tile'}
            >
              {showImage && (
                <img
                  src={type === 'chicken' ? CHICKEN_IMG : BANANA_IMG}
                  alt={type}
                  style={{ width: 40, height: 40 }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;
