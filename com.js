// com.js - Computer player strategies

// COMの手をランダムに選択する関数
function comPlay(g, callback) {
  // 有効な手の候補をすべて列挙（game.enumnextを使用）
  const nextStates = g.enumnext();
  
  if (nextStates.length === 0) return; // 有効な手がない場合
  
  // ランダムに次の状態を選択
  const randomState = nextStates[Math.floor(Math.random() * nextStates.length)];
  
  // 選択した手を実行するためのコールバックを呼び出す
  if (callback) {
    callback(randomState);
  }
  
  return randomState;
}
