// com.js - Computer player strategies

/**
 * COMの手を選択する関数
 * @param {Game} g - 現在のゲーム状態
 * @param {Function} callback - 選択した次の状態を処理するコールバック関数
 * @returns {Game|undefined} - コールバックが指定されていない場合は次の状態を返す
 */
function comPlay(g, callback) {
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
