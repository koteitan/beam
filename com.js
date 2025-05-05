// com.js - Computer player strategies

/**
 * ランダム戦略: 有効な手をランダムに選択する
 * @param {Game} g - 現在のゲーム状態
 * @param {Function} callback - 選択した次の状態を処理するコールバック関数
 * @returns {Game|undefined} - コールバックが指定されていない場合は次の状態を返す
 */
function comRandom(g, callback) {
  // 有効な手の候補をすべて列挙（game.enumnextを使用）
  const nextStates = g.enumnext();
  
  if (nextStates.length === 0) return; // 有効な手がない場合
  
  // ランダムに次の状態を選択
  const randomState = nextStates[Math.floor(Math.random() * nextStates.length)];
  
  // 選択した手を実行するためのコールバックを呼び出す
  if (callback) {
    callback(randomState);
    return;
  }
  
  return randomState;
}

/**
 * 2ステップ先読み戦略: 勝てる手があればそれを選ぶ
 * @param {Game} g - 現在のゲーム状態
 * @param {Function} callback - 選択した次の状態を処理するコールバック関数
 * @returns {Game|undefined} - コールバックが指定されていない場合は次の状態を返す
 */
function com2step(g, callback) {
  // 有効な手の候補をすべて列挙（game.enumnextを使用）
  const nextStates = g.enumnext();
  
  if (nextStates.length === 0) return; // 有効な手がない場合
  
  // 勝てる手を探す
  let winningState = null;
  for (const state of nextStates) {
    // この手を指した後、相手が有効な手を持たない場合は勝ち
    if (state.enumnext().length === 0) {
      winningState = state;
      break;
    }
  }
  
  // 勝てる手があればそれを選択、なければランダム
  const selectedState = winningState || nextStates[Math.floor(Math.random() * nextStates.length)];
  
  // 選択した手を実行するためのコールバックを呼び出す
  if (callback) {
    callback(selectedState);
    return;
  }
  
  return selectedState;
}

/**
 * 3ステップ先読み戦略: 勝てる手があればそれを選ぶ、なければ相手が勝てる手を避ける
 * @param {Game} g - 現在のゲーム状態
 * @param {Function} callback - 選択した次の状態を処理するコールバック関数
 * @returns {Game|undefined} - コールバックが指定されていない場合は次の状態を返す
 */
function com3step(g, callback) {
  // 有効な手の候補をすべて列挙（game.enumnextを使用）
  const nextStates = g.enumnext();
  
  if (nextStates.length === 0) return; // 有効な手がない場合
  
  // 勝てる手を探す
  let winningState = null;
  for (const state of nextStates) {
    // この手を指した後、相手が有効な手を持たない場合は勝ち
    if (state.enumnext().length === 0) {
      winningState = state;
      break;
    }
  }
  
  // 勝てる手があればそれを選択
  if (winningState) {
    if (callback) {
      callback(winningState);
      return;
    }
    return winningState;
  }
  
  // 勝てる手がない場合、相手が勝てる手を持つ状態を避ける
  const safeStates = [];
  for (const state of nextStates) {
    // 相手の手を調べる
    const opponentStates = state.enumnext();
    
    // 相手が勝てる手を持つかチェック
    let opponentCanWin = false;
    for (const opponentState of opponentStates) {
      // 相手がこの手を指した後、自分が有効な手を持たない場合は相手の勝ち
      if (opponentState.enumnext().length === 0) {
        opponentCanWin = true;
        break;
      }
    }
    
    // 相手が勝てる手を持たない場合、この手は安全
    if (!opponentCanWin) {
      safeStates.push(state);
    }
  }
  
  // 安全な手があればその中からランダムに選択、なければすべての手の中からランダムに選択
  const selectedState = safeStates.length > 0 
    ? safeStates[Math.floor(Math.random() * safeStates.length)]
    : nextStates[Math.floor(Math.random() * nextStates.length)];
  
  // 選択した手を実行するためのコールバックを呼び出す
  if (callback) {
    callback(selectedState);
    return;
  }
  
  return selectedState;
}

/**
 * Kステップ先読み戦略: 深い先読みで最善手を選ぶ
 * @param {Game} g - 現在のゲーム状態
 * @param {Function} callback - 選択した次の状態を処理するコールバック関数
 * @returns {Game|undefined} - コールバックが指定されていない場合は次の状態を返す
 */
function comKstep(g, callback) {
  // 5x5かつ1手目のときはcom3stepに委譲
  if (g.n === 5 && g.turnCount < 4) {
    return com3step(g, callback);
  }
  // 6手先まで読むミニマックス法
  function minimax(state, depth, maximizingPlayer) {
    minimaxCallCount++;
    const nextStates = state.enumnext();
    if (nextStates.length === 0) {
      // 手がなければ負け（今手番のプレイヤーが負け）
      return maximizingPlayer ? -1 : 1;
    }
    if (depth === 0) {
      // 評価関数（引き分け扱い）
      return 0;
    }
    if (maximizingPlayer) {
      let maxEval = -Infinity;
      for (const next of nextStates) {
        const evalValue = minimax(next, depth - 1, false);
        if (evalValue > maxEval) maxEval = evalValue;
        // すぐ勝てる手があれば即リターン
        if (maxEval === 1) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const next of nextStates) {
        const evalValue = minimax(next, depth - 1, true);
        if (evalValue < minEval) minEval = evalValue;
        // すぐ負ける手があれば即リターン
        if (minEval === -1) break;
      }
      return minEval;
    }
  }

  minimaxCallCount = 0;

  const nextStates = g.enumnext();
  if (nextStates.length === 0) return;

  // すべての手を評価し、最善手を選ぶ
  let bestValue = -Infinity;
  let bestStates = [];
  for (const state of nextStates) {
    const value = minimax(state, 5, false); // 6手先まで読む（今の手＋5手、次は相手手番）
    if (value > bestValue) {
      bestValue = value;
      bestStates = [state];
    } else if (value === bestValue) {
      bestStates.push(state);
    }
  }

  // 最善手が複数あればランダムに選択
  const selectedState = bestStates.length > 0
    ? bestStates[Math.floor(Math.random() * bestStates.length)]
    : nextStates[Math.floor(Math.random() * nextStates.length)];

  if (callback) {
    callback(selectedState);
    return;
  }
  return selectedState;
}

// minimaxの呼び出し回数をカウントするグローバル変数
let minimaxCallCount = 0;

// COMの戦略関数の配列
const comStrategies = [comRandom, com2step, com3step, comKstep];

// COMの戦略名（日本語と英語）
const comStrategyNames = {
  ja: ["スライム", "ゴブリン", "エルフ", "ゴリアテ", "２人対戦"],
  en: ["Slime", "Goblin", "Elf", "Goliath", "Human Player"]
};

/* デフォルトの戦略インデックス（2: エルフ） */
let defaultStrategyIndex = 2;

// 戦略インデックスがHuman Player（4）の場合はvsComModeをfalseにする
function updateVsComMode(strategyIndex) {
  vsComMode = (strategyIndex !== 4);
  return vsComMode;
}
