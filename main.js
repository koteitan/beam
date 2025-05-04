// main.js - Control game state and UI

// Define game states
const STATES = {
  START_GAME: "start-game",
  PUT_TURRET: "put-turret",
  SHOOT_BEAM: "shoot-beam"
};

let currentState = STATES.START_GAME;
let game = null;
let boardSize = 0;
let cellSize = 0;
let lastTurret = null;

// Cache DOM elements
const startButtons = document.querySelectorAll('.start-btn');
const boardCanvas = document.getElementById('board');
const messageBox = document.getElementById('message-box');
const player1Caption = document.getElementById('player1');
const player2Caption = document.getElementById('player2');
const ctx = boardCanvas.getContext('2d');

// Update start buttons enabled/disabled state
function updateButtons() {
  startButtons.forEach(btn => {
    const enabled = (currentState === STATES.START_GAME);
    btn.disabled = !enabled;
    btn.classList.toggle('active', enabled);
  });
}

// Set current state, system message, turn captions, and button states
function setState(state, message) {
  currentState = state;
  messageBox.textContent = message;
  if (game) {
    const isFirst = (game.turn === 1);
    player1Caption.classList.toggle('active', isFirst);
    player2Caption.classList.toggle('active', !isFirst);
  }
  updateButtons();
}

// Initialize UI to start-game state
setState(STATES.START_GAME, "Select a game size");

// Draw board grid, turrets, beams, and optionally highlight placement candidate
function drawBoard(candidatePos = null) {
  // Clear canvas
  ctx.clearRect(0, 0, boardCanvas.width, boardCanvas.height);

  // Draw grid
  for (let i = 0; i <= boardSize; i++) {
    ctx.beginPath();
    ctx.moveTo(i * cellSize, 0);
    ctx.lineTo(i * cellSize, boardCanvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * cellSize);
    ctx.lineTo(boardCanvas.width, i * cellSize);
    ctx.stroke();
  }

  if (game) {
    for (let r = 0; r < boardSize; r++) {
      for (let c = 0; c < boardSize; c++) {
        const cell = game.board[r][c];
        if (cell === ikind_blank) continue;
        // Turret
        if (cell === ikind_turret) {
          const color = (game.turn === 1) ? 'red' : 'green';
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(c * cellSize + cellSize/2, r * cellSize + cellSize/2, cellSize/4, 0, Math.PI*2);
          ctx.fill();
        } else {
          // Beam
          ctx.fillStyle = 'yellow';
          ctx.fillRect(c*cellSize + cellSize/4, r*cellSize + cellSize/4, cellSize/2, cellSize/2);
        }
      }
    }
  }

  // Highlight candidate turret position or beam direction click
  if (candidatePos !== null) {
    const row = Math.floor(candidatePos / boardSize);
    const col = candidatePos % boardSize;
    ctx.fillStyle = (currentState === STATES.PUT_TURRET) ? 'rgba(0,0,255,0.5)' : 'rgba(255,0,0,0.5)';
    ctx.beginPath();
    ctx.arc(col*cellSize + cellSize/2, row*cellSize + cellSize/2, cellSize/4, 0, Math.PI*2);
    ctx.fill();
  }
}

// Initialize the game
function initGame(size) {
  boardSize = size;
  cellSize = boardCanvas.width / boardSize;
  game = new Game();
  game.init(boardSize);
  drawBoard();
  setState(STATES.PUT_TURRET, `Click a cell to put a turret for Player ${game.turn}`);
}

// Handle canvas clicks for both turret placement and beam shooting
boardCanvas.addEventListener('click', (e) => {
  const rect = boardCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const col = Math.floor(x / cellSize);
  const row = Math.floor(y / cellSize);
  const pos = row * boardSize + col;

  if (currentState === STATES.PUT_TURRET) {
    // Place turret candidate
    if (game.board[row][col] !== ikind_blank) {
      setState(STATES.PUT_TURRET, `Invalid cell. Choose another for Player ${game.turn}`);
      return;
    }
    lastTurret = pos;
    drawBoard(pos);
    setState(STATES.SHOOT_BEAM, 'Click adjacent cell to shoot beam');
  } else if (currentState === STATES.SHOOT_BEAM) {
    // Determine direction from lastTurret to clicked pos
    const lr = Math.floor(lastTurret / boardSize);
    const lc = lastTurret % boardSize;
    const dr = row - lr;
    const dc = col - lc;
    let dir = -1;
    if (dr === 0 && dc === -1) dir = 0;
    else if (dr === 0 && dc === 1) dir = 1;
    else if (dr === -1 && dc === 0) dir = 2;
    else if (dr === 1 && dc === 0) dir = 3;
    if (dir < 0) {
      setState(STATES.SHOOT_BEAM, 'Invalid direction. Click adjacent cell.');
      return;
    }
    // Execute move
    const result = game.move(lastTurret, dir);
    if (result.error !== 0) {
      setState(STATES.SHOOT_BEAM, `Error: ${result.error}`);
      return;
    }
    game = result.next;
    drawBoard();
    if (result.win) {
      setState(STATES.START_GAME, `Player ${game.turn} won!`);
    } else if (result.draw) {
      setState(STATES.START_GAME, 'The game was even');
    } else {
      setState(STATES.PUT_TURRET, `Click a cell to put a turret for Player ${game.turn}`);
    }
  }
});

// Set up start buttons
startButtons.forEach(btn => {
  btn.addEventListener('click', () => initGame(parseInt(btn.dataset.size)));
});
