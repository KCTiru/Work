import React, { useState, useEffect } from 'react';
import './App.css';

const CHICKEN_IMG = 'https://thumbs.dreamstime.com/z/full-body-brown-chicken-hen-standing-isolated-white-backgroun-background-use-farm-animals-livestock-theme-49741285.jpg?ct=jpeg';
const BANANA_IMG = 'https://thumbs.dreamstime.com/b/bunch-bananas-6175887.jpg?w=768';

const GRID_SIZE = 6;
const TILE_COUNT = GRID_SIZE * GRID_SIZE;

function App() {
  const [grid, setGrid] = useState([]);
  const [selectedTile, setSelectedTile] = useState(null);
  const [guesses, setGuesses] = useState({});
  const [revealedTiles, setRevealedTiles] = useState(new Set());
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState('');
  const [revealAll, setRevealAll] = useState(false);
  const [lastGuessResult, setLastGuessResult] = useState(null); 

  const generateGrid = () => {
    const items = Array(TILE_COUNT / 2).fill('banana').concat(Array(TILE_COUNT / 2).fill('chicken'));
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  };

  useEffect(() => {
    setGrid(generateGrid());
  }, []);

  useEffect(() => {
    if (selectedTile === null || !guesses.player1 || !guesses.player2) return;

    const actual = grid[selectedTile];
    const p1Correct = guesses.player1 === actual;
    const p2Correct = guesses.player2 === actual;

    const newRevealed = new Set(revealedTiles);
    newRevealed.add(selectedTile);
    setRevealedTiles(newRevealed);

    if (!p1Correct && !p2Correct) {
      setLastGuessResult('incorrect');
      setGameOver(true);
      setWinner('No one');
    } else if (!p1Correct) {
      setLastGuessResult('incorrect');
      setGameOver(true);
      setWinner('Banana Player');
    } else if (!p2Correct) {
      setLastGuessResult('incorrect');
      setGameOver(true);
      setWinner('Chicken Player');
    } else {
      setLastGuessResult('correct');
      if (newRevealed.size === TILE_COUNT) {
        setGameOver(true);
        setWinner('Both players');
      }
    }

    setTimeout(() => {
      setSelectedTile(null);
      setGuesses({});
      setLastGuessResult(null);
    }, 1000);
  }, [guesses]);

  const handleTileClick = (index) => {
    if (gameOver || revealedTiles.has(index) || selectedTile !== null) return;
    setSelectedTile(index);
    setGuesses({});
  };

  const handleGuess = (player, guess) => {
    if (selectedTile === null || gameOver) return;
    setGuesses((prev) => ({ ...prev, [player]: guess }));
  };

  const restartGame = () => {
    setGrid(generateGrid());
    setRevealedTiles(new Set());
    setSelectedTile(null);
    setGameOver(false);
    setWinner('');
    setRevealAll(false);
    setGuesses({});
    setLastGuessResult(null);
  };

  return (
    <div className="container">
      <h1>Chicken Banana Guess Game</h1>
      <p>{gameOver ? `Game Over! Winner: ${winner}` : 'Click a tile and both players must guess.'}</p>

      {gameOver && (
        <>
          <button onClick={restartGame} className="btn restart">Restart</button>
          <button onClick={() => setRevealAll(true)} className="btn reveal">Reveal All</button>
        </>
      )}

      <div className="grid">
        {grid.map((type, idx) => {
          const isRevealed = revealedTiles.has(idx) || revealAll;
          const imgSrc = type === 'chicken' ? CHICKEN_IMG : BANANA_IMG;
          const feedbackClass =
            selectedTile === idx && lastGuessResult === 'correct'
              ? 'correct'
              : selectedTile === idx && lastGuessResult === 'incorrect'
              ? 'incorrect'
              : '';

          return (
            <div
              key={idx}
              className={`tile ${isRevealed ? 'clicked' : ''} ${feedbackClass}`}
              onClick={() => handleTileClick(idx)}
            >
              {isRevealed && <img src={imgSrc} alt={type} className="tile-img" />}
              <div className="tile-number">{idx + 1}</div>
            </div>
          );
        })}
      </div>

      {selectedTile !== null && (
        <div className="guess-panel">
          <h3>Tile #{selectedTile + 1} - Make your guesses!</h3>
          <div className="guess-buttons">
            <div>
              <p>Chicken Player</p>
              <button
                onClick={() => handleGuess('player1', 'chicken')}
                className={guesses.player1 === 'chicken' ? 'selected' : ''}
              >
                Chicken
              </button>
              <button
                onClick={() => handleGuess('player1', 'banana')}
                className={guesses.player1 === 'banana' ? 'selected' : ''}
              >
                Banana
              </button>
            </div>
            <div>
              <p>Banana Player</p>
              <button
                onClick={() => handleGuess('player2', 'chicken')}
                className={guesses.player2 === 'chicken' ? 'selected' : ''}
              >
                Chicken
              </button>
              <button
                onClick={() => handleGuess('player2', 'banana')}
                className={guesses.player2 === 'banana' ? 'selected' : ''}
              >
                Banana
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
