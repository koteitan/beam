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

// COMの戦略関数の配列
const comStrategies = [comRandom, com2step, com3step];

// COMの戦略名（日本語と英語）
const comStrategyNames = {
  ja: ["スライム", "ゴブリン", "エルフ", "２人対戦"],
  en: ["Slime", "Goblin", "Elf", "Human Player"]
};

// デフォルトの戦略インデックス（1: ゴブリン）
let defaultStrategyIndex = 1;

// 戦略インデックスがHuman Player（3）の場合はvsComModeをfalseにする
function updateVsComMode(strategyIndex) {
  vsComMode = (strategyIndex !== 3);
  return vsComMode;
}
