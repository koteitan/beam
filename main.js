// main.js - Control game state and UI

// 成績記録用の配列
let record = {};

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
let vsComMode = true; // COM対戦モードのフラグ（デフォルトはtrue）
let startFromPlayer2 = false; // Player 2から開始するフラグ
let comStrategyIndex = defaultStrategyIndex; // COMの戦略インデックス

// Cache DOM elements
const startButtons = document.querySelectorAll('.start-btn');
const boardCanvas = document.getElementById('board');
const messageBox = document.getElementById('message-box');
const player1Caption = document.getElementById('player1');
const player2Caption = document.getElementById('player2');
const player2StartCheckbox = document.getElementById('player2-start-checkbox');
const comStrategySelect = document.getElementById('com-strategy-select');
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

// LocalStorageから成績を読み込む
function loadRecord() {
  const savedRecord = localStorage.getItem('beamGameRecord');
  if (savedRecord) {
    record = JSON.parse(savedRecord);
  }
}

// 成績を保存する
function saveRecord() {
  localStorage.setItem('beamGameRecord', JSON.stringify(record));
}

// 成績を更新する
function updateRecord(strategyIndex, size, startFromPlayer2, isWin) {
  // 必要なオブジェクト構造を作成
  if (!record[strategyIndex]) {
    record[strategyIndex] = {};
  }
  if (!record[strategyIndex][size]) {
    record[strategyIndex][size] = {};
  }
  
  // 先手/後手の結果を記録
  const startKey = startFromPlayer2 ? '1' : '0';
  record[strategyIndex][size][startKey] = isWin ? 1 : 0;
  
  // LocalStorageに保存
  saveRecord();
}

// 成績表を更新する
function updateRecordTable() {
  const recordTable = document.getElementById('record-table');
  if (!recordTable) return;
  
  // テーブルをクリア
  recordTable.innerHTML = '';
  
  // ヘッダー行を作成
  const headerRow = document.createElement('tr');
  
  // 左上のセル（空白）
  const emptyCell = document.createElement('th');
  headerRow.appendChild(emptyCell);
  
  // 先手/後手の列見出し
  const firstPlayerHeader = document.createElement('th');
  firstPlayerHeader.colSpan = 3;
  firstPlayerHeader.textContent = lang === 'ja' ? '先手' : 'First';
  headerRow.appendChild(firstPlayerHeader);
  
  const secondPlayerHeader = document.createElement('th');
  secondPlayerHeader.colSpan = 3;
  secondPlayerHeader.textContent = lang === 'ja' ? '後手' : 'Second';
  headerRow.appendChild(secondPlayerHeader);
  
  recordTable.appendChild(headerRow);
  
  // サイズの行を作成
  const sizeRow = document.createElement('tr');
  
  // 左端のセル（空白）
  const sizeEmptyCell = document.createElement('th');
  sizeRow.appendChild(sizeEmptyCell);
  
  // サイズの列見出し（先手）
  for (let i = 3; i <= 5; i++) {
    const sizeCell = document.createElement('th');
    sizeCell.textContent = i;
    sizeRow.appendChild(sizeCell);
  }
  
  // サイズの列見出し（後手）
  for (let i = 3; i <= 5; i++) {
    const sizeCell = document.createElement('th');
    sizeCell.textContent = i;
    sizeRow.appendChild(sizeCell);
  }
  
  recordTable.appendChild(sizeRow);
  
  // 各戦略の行を作成
  for (let i = 0; i < comStrategyNames.ja.length - 1; i++) {
    const strategyRow = document.createElement('tr');
    
    // 戦略名
    const strategyCell = document.createElement('th');
    strategyCell.textContent = comStrategyNames[lang === 'ja' ? 'ja' : 'en'][i];
    strategyRow.appendChild(strategyCell);
    
    // 先手の成績
    for (let size = 3; size <= 5; size++) {
      const resultCell = document.createElement('td');
      if (record[i] && record[i][size] && record[i][size]['0'] === 1) {
        resultCell.textContent = '✅';
      }
      strategyRow.appendChild(resultCell);
    }
    
    // 後手の成績
    for (let size = 3; size <= 5; size++) {
      const resultCell = document.createElement('td');
      if (record[i] && record[i][size] && record[i][size]['1'] === 1) {
        resultCell.textContent = '✅';
      }
      strategyRow.appendChild(resultCell);
    }
    
    recordTable.appendChild(strategyRow);
  }
}

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
window.addEventListener('DOMContentLoaded', function() {
  initializeCanvas();
  
  // COMの戦略選択ドロップダウンを言語に応じて初期化
  initComStrategySelect();
  
  // プレイヤーのキャプションを更新
  updatePlayerCaptions();
  
  // ゲームルールの表示を言語に応じて切り替え
  updateGameRules();
  
  // LocalStorageから成績を読み込む
  loadRecord();
  
  // 成績表を更新
  updateRecordTable();
});

// ゲームルールと戦績表の表示を言語に応じて切り替える関数
function updateGameRules() {
  const rulesJa = document.getElementById('rules-ja');
  const rulesEn = document.getElementById('rules-en');
  const rulesTitleJa = document.getElementById('rules-title-ja');
  const rulesTitleEn = document.getElementById('rules-title-en');
  const recordTitleJa = document.getElementById('record-title-ja');
  const recordTitleEn = document.getElementById('record-title-en');
  
  if (lang === 'ja') {
    rulesJa.style.display = 'block';
    rulesEn.style.display = 'none';
    rulesTitleJa.style.display = 'block';
    rulesTitleEn.style.display = 'none';
    recordTitleJa.style.display = 'block';
    recordTitleEn.style.display = 'none';
  } else {
    rulesJa.style.display = 'none';
    rulesEn.style.display = 'block';
    rulesTitleJa.style.display = 'none';
    rulesTitleEn.style.display = 'block';
    recordTitleJa.style.display = 'none';
    recordTitleEn.style.display = 'block';
  }
}

// COMの戦略選択ドロップダウンを言語に応じて初期化する関数
function initComStrategySelect() {
  // ドロップダウンの中身をクリア
  comStrategySelect.innerHTML = '';
  
  // 言語に応じた戦略名を取得
  const strategyNames = comStrategyNames[lang === 'ja' ? 'ja' : 'en'];
  
  // 各戦略のオプションを追加
  strategyNames.forEach((name, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = name;
    option.selected = index === defaultStrategyIndex;
    comStrategySelect.appendChild(option);
  });
  
  // 言語に応じてラベルを設定
  const strategyLabel = document.getElementById('strategy-label');
  strategyLabel.textContent = lang === 'ja' ? '対戦相手' : 'Opponent';
}

// チェックボックス状態変更時の処理
player2StartCheckbox.addEventListener('change', function() {
  startFromPlayer2 = this.checked;
});

// プレイヤーのキャプションを更新する関数
function updatePlayerCaptions() {
  // プレイヤー1のキャプションを言語に応じて更新
  if (vsComMode) {
    // COMモードの場合、「プレイヤー」と表示
    player1Caption.textContent = lang === 'ja' ? 'プレイヤー' : 'Player';
  } else {
    // 2人対戦モードの場合、「プレイヤー1」と表示
    player1Caption.textContent = lang === 'ja' ? 'プレイヤー1' : 'Player 1';
  }
  
  // プレイヤー2のキャプションを更新
  if (vsComMode) {
    // COMモードの場合、モンスター名を表示
    const monsterName = comStrategyNames[lang === 'ja' ? 'ja' : 'en'][comStrategyIndex];
    player2Caption.textContent = monsterName;
  } else {
    // 2人対戦モードの場合、「Player 2」を表示
    player2Caption.textContent = lang === 'ja' ? 'プレイヤー2' : 'Player 2';
  }
}

// COMの戦略選択時の処理
comStrategySelect.addEventListener('change', function() {
  comStrategyIndex = parseInt(this.value);
  // 戦略に応じてvsComModeを更新
  const prevVsComMode = vsComMode;
  updateVsComMode(comStrategyIndex);
  
  // プレイヤーのキャプションを更新
  updatePlayerCaptions();
  
  // 2人対戦からCOMモードに変更され、かつ現在のターンがPlayer2の場合は、すぐにCOMの手を選択
  if (!prevVsComMode && vsComMode && game && game.turn === 2 && currentState === STATES.PUT_TURRET) {
    handleComTurn();
  }
});

// COMの手を選択する関数（com.jsの戦略関数を呼び出す）
function handleComTurn() {
  if (!vsComMode || game.turn !== 2) return; // COMモードでない、またはCOMのターンでない場合は何もしない
  
  // COMが考え中のメッセージを表示
  const monsterName = comStrategyNames[lang === 'ja' ? 'ja' : 'en'][comStrategyIndex];
  setState(STATES.PUT_TURRET, `${monsterName}が考えています...`, `${monsterName} is thinking...`);
  
  // 少し遅延を入れてCOMの動きを見えるようにする
  setTimeout(() => {
    // 選択された戦略関数を呼び出して次の状態を取得
    const strategyFunction = comStrategies[comStrategyIndex];
    strategyFunction(game, (nextState) => {
      // 選択した手を実行
      // nextStateから元の手（位置と方向）を特定する必要がある
      const prevBoard = game.board;
      const nextBoard = nextState.board;
      
      // タレットの位置を特定
      let turretPos = -1;
      for (let y = 0; y < boardSize; y++) {
        for (let x = 0; x < boardSize; x++) {
          if (prevBoard[y][x] === ikind_blank && nextBoard[y][x] === ikind_turret) {
            turretPos = y * boardSize + x;
            break;
          }
        }
        if (turretPos !== -1) break;
      }
      
      if (turretPos === -1) {
        console.error('COMの手でタレットの位置を特定できませんでした');
        return;
      }
      
      lastTurret = turretPos;
      drawBoard(turretPos);
      
      // 少し遅延を入れてビーム発射を見えるようにする
      setTimeout(() => {
        game = nextState;
      if (!game.check()) {
        const winner = game.turn === 1 ? 2 : 1;
        
        // 成績を更新（COMが勝った場合は0、プレイヤーが勝った場合は1）
        if (vsComMode) {
          const playerWon = winner === 1;
          updateRecord(comStrategyIndex, boardSize, startFromPlayer2, playerWon);
          updateRecordTable();
        }
        
        if (winner === 2 && vsComMode) {
          // COMが勝利した場合、モンスター名を表示
          const monsterName = comStrategyNames[lang === 'ja' ? 'ja' : 'en'][comStrategyIndex];
          setState(STATES.START_GAME, `${monsterName}の勝利です！`, `${monsterName} won!`);
        } else {
          setState(STATES.START_GAME, `プレイヤー${winner}の勝利です！`, `Player ${winner} won!`);
        }
      } else {
          setState(STATES.PUT_TURRET, `砲台を置いてください`, `Place a turret`);
        }
        drawBoard();
      }, 500);
    });
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
          ctx.arc(c*cellSize+cellSize/2, r*cellSize+cellSize/2, cellSize/2 - 2, 0, Math.PI*2);
          ctx.fill();
        } else if (cell === ikind_horizbeam) {
          const t = cellSize/6, o = (cellSize-t)/2;
          ctx.fillStyle = 'orange';
          ctx.fillRect(c*cellSize + 2, r*cellSize+o, cellSize - 4, t);
        } else if (cell === ikind_vertbeam) {
          const t = cellSize/6, o = (cellSize-t)/2;
          ctx.fillStyle = 'orange';
          ctx.fillRect(c*cellSize+o, r*cellSize + 2, t, cellSize - 4);
        } else if (cell === ikind_crossbeam) {
          const t = cellSize/6, o = (cellSize-t)/2;
          ctx.fillStyle = 'orange';
          ctx.fillRect(c*cellSize + 2, r*cellSize+o, cellSize - 4, t);
          ctx.fillRect(c*cellSize+o, r*cellSize + 2, t, cellSize - 4);
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
    ctx.arc(col*cellSize+cellSize/2, row*cellSize+cellSize/2, cellSize/2 - 2, 0, Math.PI*2);
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
  
  setState(STATES.PUT_TURRET, `砲台を置いてください`, `Place a turret`);
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
  // COMモードでかつPlayer2のターンの場合は入力を無視
  if (vsComMode && game.turn === 2) {
    return;
  }
  
  const rect = boardCanvas.getBoundingClientRect();
  const x = e.clientX-rect.left, y = e.clientY-rect.top;
  const c = Math.floor(x/cellSize), r = Math.floor(y/cellSize);
  const pos = r*boardSize+c;

  if (currentState===STATES.PUT_TURRET) {
    if (game.board[r][c]!==ikind_blank) {
      setState(STATES.PUT_TURRET, `そこには砲台を置けません`, `Cannot place a turret here`);
      return;
    }
    lastTurret = pos;
    setState(STATES.SHOOT_BEAM, 'ビームを発射して下さい', 'Shoot a beam');
    drawBoard(pos);
  } else if (currentState===STATES.SHOOT_BEAM) {
    // 直前に配置したタレットの位置をクリックした場合、put-turret状態に戻る
    if (pos === lastTurret) {
      setState(STATES.PUT_TURRET, `砲台を置いてください`, `Place a turret`);
      drawBoard();
      return;
    }

    const lr = Math.floor(lastTurret/boardSize), lc = lastTurret%boardSize;
    const dr = r - lr, dc = c - lc;
    let dir = -1;
    // Determine direction based on alignment
    if (dr === 0 && dc < 0) dir = 0;
    else if (dr === 0 && dc > 0) dir = 1;
    else if (dc === 0 && dr < 0) dir = 2;
    else if (dc === 0 && dr > 0) dir = 3;
    if (dir < 0) {
      setState(STATES.SHOOT_BEAM, 'そこにはビームが出せません', 'Cannot shoot a beam here');
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
      setState(STATES.SHOOT_BEAM, 'そこにはビームが出せません', 'Cannot shoot a beam here');
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
      
      // 成績を更新（COMが勝った場合は0、プレイヤーが勝った場合は1）
      if (vsComMode) {
        const playerWon = winner === 1;
        updateRecord(comStrategyIndex, boardSize, startFromPlayer2, playerWon);
        updateRecordTable();
      }
      
      if (winner === 2 && vsComMode) {
        // COMが勝利した場合、モンスター名を表示
        const monsterName = comStrategyNames[lang === 'ja' ? 'ja' : 'en'][comStrategyIndex];
        setState(STATES.START_GAME, `${monsterName}の勝利です！`, `${monsterName} won!`);
      } else {
        setState(STATES.START_GAME, `プレイヤー${winner}の勝利です！`, `Player ${winner} won!`);
      }
    } else {
      setState(STATES.PUT_TURRET, `砲台を置いてください`, `Place a turret`);
      // COMのターンなら自動的に手を選択
      if (vsComMode && game.turn === 2) {
        handleComTurn();
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
    handleComTurn();
  }
}));
