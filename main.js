// main.js - Control game state and UI

// Define game states
const STATES = {
  START_GAME: "start-game",
  PUT_TURRET: "put-turret",
  SHOOT_BEAM: "shoot-beam"
};
const lang = navigator.language.includes('ja') ? 'ja' : 'en';

let currentState = STATES.START_GAME;
let game = null;
let boardSize = 4; // デフォルトのボードサイズを4に設定
let cellSize = 0;
let lastTurret = null;
let vsComMode = false; // COM対戦モードのフラグ
let startFromPlayer2 = false; // Player 2から開始するフラグ

// Cache DOM elements
const startButtons = document.querySelectorAll('.start-btn');
const boardCanvas = document.getElementById('board');
const messageBox = document.getElementById('message-box');
const player1Caption = document.getElementById('player1');
const player2Caption = document.getElementById('player2');
const vsComCheckbox = document.getElementById('vs-com-checkbox');
const player2StartCheckbox = document.getElementById('player2-start-checkbox');
const ctx = boardCanvas.getContext('2d');

// Update start buttons enabled/disabled state
function updateButtons() {
  startButtons.forEach(btn => {
    btn.disabled = false;
    btn.classList.toggle('active', currentState === STATES.START_GAME);
  });
}

 // Change UI state, message, turn highlight, buttons
function setState(state, msgJa, msgEn) {
  currentState = state;
  messageBox.textContent = (lang === 'ja' ? msgJa : msgEn);
  if (game) {
    const isFirst = (game.turn === 1);
    player1Caption.classList.toggle('active', isFirst);
    player2Caption.classList.toggle('active', !isFirst);
  }
  updateButtons();
}

// Initialize UI
setState(STATES.START_GAME, "ゲームサイズを選択してください", "Select a game size");

// ページ読み込み時にcanvasとゲームを初期化
function initializeCanvas() {
  const isMobile = window.innerWidth < 600;
  if (isMobile) {
    const maxWidth = window.innerWidth - 40;
    boardCanvas.width = maxWidth;
    boardCanvas.height = maxWidth;
  } else {
    // デスクトップ（Windows含む）ではキャンバスサイズを大きくする
    boardCanvas.width = 500;
    boardCanvas.height = 500;
  }
  cellSize = boardCanvas.width / boardSize;
  
  // 初期状態でもゲームオブジェクトを作成
  if (!game) {
    game = new Game();
    game.init(boardSize);
  }
  
  drawBoard();
}

// ページ読み込み時に初期化
window.addEventListener('DOMContentLoaded', initializeCanvas);

// チェックボックス状態変更時の処理
vsComCheckbox.addEventListener('change', function() {
  vsComMode = this.checked;
});

player2StartCheckbox.addEventListener('change', function() {
  startFromPlayer2 = this.checked;
});

// COMの手をランダムに選択する関数
function comPlay() {
  if (!vsComMode || game.turn !== 2) return; // COMモードでない、またはCOMのターンでない場合は何もしない
  
  // 少し遅延を入れてCOMの動きを見えるようにする
  setTimeout(() => {
    // 有効な手の候補をすべて列挙
    const validMoves = [];
    
    for (let r = 0; r < boardSize; r++) {
      for (let c = 0; c < boardSize; c++) {
        const pos = r * boardSize + c;
        if (game.board[r][c] !== ikind_blank) continue;
        
        for (let dir = 0; dir < 4; dir++) {
          const result = game.move(pos, dir);
          if (result.error === 0) {
            validMoves.push({ pos, dir });
          }
        }
      }
    }
    
    if (validMoves.length === 0) return; // 有効な手がない場合
    
    // ランダムに手を選択
    const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
    
    // 選択した手を実行
    lastTurret = randomMove.pos;
    drawBoard(randomMove.pos);
    
    // 少し遅延を入れてビーム発射を見えるようにする
    setTimeout(() => {
      const res = game.move(randomMove.pos, randomMove.dir);
      if (res.error !== 0) {
        console.error('COMの手でエラーが発生しました:', res.error);
        return;
      }
      
      game = res.next;
      if (!game.check()) {
        const winner = game.turn === 1 ? 2 : 1;
        setState(STATES.START_GAME, `プレイヤー${winner}の勝利です！`, `Player ${winner} won!`);
      } else {
        setState(STATES.PUT_TURRET, `プレイヤー${game.turn}のタレットを配置するセルをクリックしてください`, `Click a cell to put a turret for Player ${game.turn}`);
      }
      drawBoard();
    }, 500);
  }, 1000);
}

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
          const color = 'red';
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
      const dx = dir === 0 ? -1 : dir === 1 ? 1 : 0;
      const dy = dir === 2 ? -1 : dir === 3 ? 1 : 0;
      const res = game.move(lastTurret, dir);
      if (res.error === 0) {
        for (let i = 1; i < boardSize; i++) {
          const ty = lr + dy * i;
          const tx = lc + dx * i;
          if (ty < 0 || ty >= boardSize || tx < 0 || tx >= boardSize) break;
          if (game.board[ty][tx] === ikind_turret) break;
          ctx.fillStyle = 'rgba(173, 216, 230, 0.5)';
          ctx.fillRect(tx * cellSize, ty * cellSize, cellSize, cellSize);
        }
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
  
  // Adjust canvas size
  const isMobile = window.innerWidth < 600;
  if (isMobile) {
    const maxWidth = window.innerWidth - 40; // 20px margin on each side
    boardCanvas.width = maxWidth;
    boardCanvas.height = maxWidth;
  } else {
    // デスクトップ（Windows含む）ではキャンバスサイズを大きくする
    boardCanvas.width = 500;
    boardCanvas.height = 500;
  }
  
  cellSize = boardCanvas.width/boardSize;
  game = new Game();
  game.init(boardSize);
  
  // Player 2から開始する場合は、turnを2に設定
  if (startFromPlayer2) {
    game.turn = 2;
  }
  
  setState(STATES.PUT_TURRET, `プレイヤー${game.turn}のタレットを配置するセルをクリックしてください`, `Click a cell to put a turret for Player ${game.turn}`);
  drawBoard();
}

// Handle window resize
window.addEventListener('resize', function() {
  if (game) {
    const isMobile = window.innerWidth < 600;
    if (isMobile) {
      const maxWidth = window.innerWidth - 40;
      boardCanvas.width = maxWidth;
      boardCanvas.height = maxWidth;
      cellSize = boardCanvas.width/boardSize;
      drawBoard();
    } else if (boardCanvas.width !== 500) {
      boardCanvas.width = 500;
      boardCanvas.height = 500;
      cellSize = boardCanvas.width/boardSize;
      drawBoard();
    }
  }
});

// Handle clicks: place turret candidate or shoot beam by adjacent click
boardCanvas.addEventListener('click', e => {
  const rect = boardCanvas.getBoundingClientRect();
  const x = e.clientX-rect.left, y = e.clientY-rect.top;
  const c = Math.floor(x/cellSize), r = Math.floor(y/cellSize);
  const pos = r*boardSize+c;

  if (currentState===STATES.PUT_TURRET) {
    if (game.board[r][c]!==ikind_blank) {
      setState(STATES.PUT_TURRET, `無効なセルです。プレイヤー${game.turn}のタレットを配置する他のセルを選択してください`, `Invalid cell. Choose another cell for Player ${game.turn}`);
      return;
    }
    lastTurret = pos;
    setState(STATES.SHOOT_BEAM, '隣接するセルをクリックしてビームを発射してください', 'Click adjacent cell to shoot beam');
    drawBoard(pos);
  } else if (currentState===STATES.SHOOT_BEAM) {
    const lr = Math.floor(lastTurret/boardSize), lc = lastTurret%boardSize;
    const dr = r - lr, dc = c - lc;
    let dir = -1;
    // Determine direction based on alignment
    if (dr === 0 && dc < 0) dir = 0;
    else if (dr === 0 && dc > 0) dir = 1;
    else if (dc === 0 && dr < 0) dir = 2;
    else if (dc === 0 && dr > 0) dir = 3;
    if (dir < 0) {
      setState(STATES.SHOOT_BEAM, '無効な方向です。同じ行または列の整列したセルをクリックしてください', 'Invalid direction. Click aligned cell in same row or column.');
      return;
    }
    // Check clear path to clicked cell
    const dx = dir === 0 ? -1 : dir === 1 ? 1 : 0;
    const dy = dir === 2 ? -1 : dir === 3 ? 1 : 0;
    let reachable = false;
    for (let i = 1; i < boardSize; i++) {
      const ty = lr + dy * i, tx = lc + dx * i;
      if (ty < 0 || ty >= boardSize || tx < 0 || tx >= boardSize) break;
      if (game.board[ty][tx] === ikind_turret) break;
      if (ty === r && tx === c) { reachable = true; break; }
    }
    if (!reachable) {
      setState(STATES.SHOOT_BEAM, '無効なビームターゲットです。同じ行または列のクリアなパスを選択してください', 'Invalid beam target. Choose a clear path in same row or column');
      return;
    }
    const res = game.move(lastTurret, dir);
    if (res.error !== 0) {
      setState(STATES.SHOOT_BEAM, `エラー: ${res.error}`, `Error: ${res.error}`);
      return;
    }
    // use Game.prototype.check for endgame
    game = res.next;
    if (!game.check()) {
      const winner = game.turn === 1 ? 2 : 1;
      setState(STATES.START_GAME, `プレイヤー${winner}の勝利です！`, `Player ${winner} won!`);
    } else {
      setState(STATES.PUT_TURRET, `プレイヤー${game.turn}のタレットを配置するセルをクリックしてください`, `Click a cell to put a turret for Player ${game.turn}`);
      // COMのターンなら自動的に手を選択
      if (vsComMode && game.turn === 2) {
        comPlay();
      }
    }
    drawBoard();
  }
});

// Start button listeners
startButtons.forEach(btn => btn.addEventListener('click', () => {
  initGame(parseInt(btn.dataset.size));
  // COMモードでゲーム開始時、COMのターン（プレイヤー2）の場合は自動的に手を選択
  if (vsComMode && game.turn === 2) {
    comPlay();
  }
}));
