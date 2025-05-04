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

// Change UI state, message, turn highlight, buttons
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

// Initialize UI
setState(STATES.START_GAME, "Select a game size");

// Draw board: grid, placement candidates, pieces, and click highlight
function drawBoard(candidatePos = null) {
  // Clear
  ctx.clearRect(0, 0, boardCanvas.width, boardCanvas.height);

  // Grid
  for (let i = 0; i <= boardSize; i++) {
    ctx.beginPath();
    ctx.moveTo(i*cellSize, 0);
    ctx.lineTo(i*cellSize, boardCanvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i*cellSize);
    ctx.lineTo(boardCanvas.width, i*cellSize);
    ctx.stroke();
  }


  // Highlight valid turret placement candidates
  if (currentState === STATES.PUT_TURRET && game) {
    for (let rr = 0; rr < boardSize; rr++) {
      for (let cc = 0; cc < boardSize; cc++) {
        const p = rr * boardSize + cc;
        if (game.board[rr][cc] !== ikind_blank) continue;
        let valid = false;
        for (let d = 0; d < 4; d++) {
          const r = game.move(p, d);
          if (r.error === 0) { valid = true; break; }
        }
        if (valid) {
          ctx.fillStyle = 'rgba(173, 216, 230, 0.5)';
          ctx.fillRect(cc * cellSize, rr * cellSize, cellSize, cellSize);
        }
      }
    }
  }
  // Draw turrets and beams
  if (game) {
    for (let r = 0; r < boardSize; r++) {
      for (let c = 0; c < boardSize; c++) {
        const cell = game.board[r][c];
        if (cell === ikind_blank) continue;
        if (cell === ikind_turret) {
          const color = (game.turn === 1) ? 'red' : 'green';
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(c*cellSize+cellSize/2, r*cellSize+cellSize/2, cellSize/4, 0, Math.PI*2);
          ctx.fill();
        } else if (cell === ikind_horizbeam) {
          const t = cellSize/5, o = (cellSize-t)/2;
          ctx.fillStyle = 'yellow';
          ctx.fillRect(c*cellSize, r*cellSize+o, cellSize, t);
        } else if (cell === ikind_vertbeam) {
          const t = cellSize/5, o = (cellSize-t)/2;
          ctx.fillStyle = 'yellow';
          ctx.fillRect(c*cellSize+o, r*cellSize, t, cellSize);
        } else if (cell === ikind_crossbeam) {
          const t = cellSize/5, o = (cellSize-t)/2;
          ctx.fillStyle = 'yellow';
          ctx.fillRect(c*cellSize, r*cellSize+o, cellSize, t);
          ctx.fillRect(c*cellSize+o, r*cellSize, t, cellSize);
        }
      }
    }
  }

  // Highlight valid beam-shoot candidates
  if (currentState === STATES.SHOOT_BEAM && game && lastTurret !== null) {
    const lr = Math.floor(lastTurret/boardSize), lc = lastTurret%boardSize;
    for (let dir = 0; dir < 4; dir++) {
      const res = game.move(lastTurret, dir);
      if (res.error === 0) {
        let r = lr + (dir === 2 ? -1 : dir === 3 ? 1 : 0);
        let c = lc + (dir === 0 ? -1 : dir === 1 ? 1 : 0);
        ctx.fillStyle = 'rgba(173, 216, 230, 0.5)';
        ctx.fillRect(c*cellSize, r*cellSize, cellSize, cellSize);
      }
    }
  }
  // Highlight clicked candidate (turret or beam)
  if (candidatePos !== null) {
    const row = Math.floor(candidatePos/boardSize);
    const col = candidatePos%boardSize;
    const color = (currentState===STATES.PUT_TURRET) ? 'rgba(0,0,255,0.5)' : 'rgba(255,0,0,0.5)';
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(col*cellSize+cellSize/2, row*cellSize+cellSize/2, cellSize/4, 0, Math.PI*2);
    ctx.fill();
  }
}

// Initialize game and UI
function initGame(size) {
  boardSize = size;
  cellSize = boardCanvas.width/boardSize;
  game = new Game();
  game.init(boardSize);
  setState(STATES.PUT_TURRET, `Click a cell to put a turret for Player ${game.turn}`);
  drawBoard();
}

// Handle clicks: place turret candidate or shoot beam by adjacent click
boardCanvas.addEventListener('click', e => {
  const rect = boardCanvas.getBoundingClientRect();
  const x = e.clientX-rect.left, y = e.clientY-rect.top;
  const c = Math.floor(x/cellSize), r = Math.floor(y/cellSize);
  const pos = r*boardSize+c;

  if (currentState===STATES.PUT_TURRET) {
    if (game.board[r][c]!==ikind_blank) {
      setState(STATES.PUT_TURRET, `Invalid cell. Choose another for Player ${game.turn}`);
      return;
    }
    lastTurret = pos;
    setState(STATES.SHOOT_BEAM, 'Click adjacent cell to shoot beam');
    drawBoard(pos);
  } else if (currentState===STATES.SHOOT_BEAM) {
    const lr = Math.floor(lastTurret/boardSize), lc = lastTurret%boardSize;
    const dr = r-lr, dc = c-lc;
    let dir = -1;
    if (dr===0&&dc===-1) dir=0;
    else if (dr===0&&dc===1) dir=1;
    else if (dr===-1&&dc===0) dir=2;
    else if (dr===1&&dc===0) dir=3;
    if (dir<0) {
      setState(STATES.SHOOT_BEAM, 'Invalid direction. Click adjacent cell.');
      return;
    }
    const res = game.move(lastTurret, dir);
    if (res.error !== 0) {
      setState(STATES.SHOOT_BEAM, `Error: ${res.error}`);
      return;
    }
    game = res.next;
    if (res.win) {
      setState(STATES.START_GAME, `Player ${game.turn} won!`);
    } else if (res.draw) {
      setState(STATES.START_GAME, 'The game was even');
    } else {
      setState(STATES.PUT_TURRET, `Click a cell to put a turret for Player ${game.turn}`);
    }
    drawBoard();
  }
});

// Start button listeners
startButtons.forEach(btn => btn.addEventListener('click', () => initGame(parseInt(btn.dataset.size))));
