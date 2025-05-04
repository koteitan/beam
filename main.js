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
const beamButtons = document.querySelectorAll('.beam-btn');
const player1Caption = document.getElementById('player1');
const player2Caption = document.getElementById('player2');
const ctx = boardCanvas.getContext('2d');

// Update button enabled/disabled state and styling
function updateButtons() {
  startButtons.forEach(btn => {
    const enabled = (currentState === STATES.START_GAME);
    btn.disabled = !enabled;
    if (enabled) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  beamButtons.forEach(btn => {
    const enabled = (currentState === STATES.SHOOT_BEAM);
    btn.disabled = !enabled;
    if (enabled) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// Set current state, system message, turn captions, and button states
function setState(state, message) {
  currentState = state;
  updateMessage(message);
  updateTurnCaptions();
  updateButtons();
}

// Initialize UI to start-game state
setState(STATES.START_GAME, "Select a game size");

// Update system message
function updateMessage(text) {
  messageBox.textContent = text;
}

// Update turn captions highlighting
function updateTurnCaptions() {
  if (!game) return;
  if (game.turn === 1) {
    player1Caption.classList.add('active');
    player2Caption.classList.remove('active');
  } else {
    player2Caption.classList.add('active');
    player1Caption.classList.remove('active');
  }
}

// Draw board grid and current pieces
function drawBoard() {
  // Clear canvas
  ctx.clearRect(0, 0, boardCanvas.width, boardCanvas.height);
  
  // Draw grid lines
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
  
  // Draw turrets and beams
  for (let r = 0; r < boardSize; r++) {
    for (let c = 0; c < boardSize; c++) {
      const cell = game.board[r][c];
      if (cell) {
        if (cell.type === 'turret') {
          ctx.fillStyle = (cell.owner === 1) ? 'red' : 'green';
          ctx.beginPath();
          ctx.arc(c * cellSize + cellSize/2, r * cellSize + cellSize/2, cellSize/4, 0, Math.PI * 2);
          ctx.fill();
        } else if (cell.type === 'beam') {
          ctx.fillStyle = 'yellow';
          ctx.fillRect(c * cellSize + cellSize/4, r * cellSize + cellSize/4, cellSize/2, cellSize/2);
        }
      }
    }
  }
}

// Initialize the game
function initGame(size) {
  boardSize = size;
  cellSize = boardCanvas.width / boardSize;
  game = new Game();
  game.init(boardSize);
  drawBoard();
  setState(STATES.PUT_TURRET, "Click a cell to put a turret for Player " + game.turn);
}

/* Handle canvas click for turret placement:
   Compute the position as a single number (pos = row * boardSize + col) 
   and wait for the beam direction input.
*/
boardCanvas.addEventListener('click', (e) => {
  if (currentState !== STATES.PUT_TURRET) return;
  const rect = boardCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const col = Math.floor(x / cellSize);
  const row = Math.floor(y / cellSize);
  const pos = row * boardSize + col;
  
  // Check if the cell is blank before proceeding
  if (game.board[row][col] !== 0) {
    updateMessage("Invalid cell. Choose another cell for Player " + game.turn);
    return;
  }
  
  lastTurret = pos;
  drawBoard();
  setState(STATES.SHOOT_BEAM, "Click a direction to shoot beam in");
});

// Handle beam button clicks for shooting beam using game.put with a direction
beamButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    if (currentState !== STATES.SHOOT_BEAM) return;
    const directionStr = btn.getAttribute('data-direction');
    let direction;
    if (directionStr === "left") {
      direction = 0;
    } else if (directionStr === "right") {
      direction = 1;
    } else if (directionStr === "up") {
      direction = 2;
    } else if (directionStr === "down") {
      direction = 3;
    } else {
      updateMessage("Invalid direction");
      return;
    }
    const result = game.put(lastTurret, direction);
    if (result.error !== 0) {
      updateMessage("Error: " + result.error);
      return;
    }
    drawBoard();
    if (result.win) {
      setState(STATES.START_GAME, "Player " + game.turn + " won!");
    } else if (result.draw) {
      setState(STATES.START_GAME, "The game was even");
    } else {
      setState(STATES.PUT_TURRET, "Click a cell to put a turret for Player " + game.turn);
    }
  });
});

// Set up start game button listeners
startButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const size = parseInt(btn.getAttribute('data-size'));
    initGame(size);
  });
});
