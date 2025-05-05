
const charkind = ["","〇","┃","━","╋"];
const charblank = ["１","２","３","４","５","６","７","８","９","Ａ","Ｂ","Ｃ","Ｄ","Ｅ","Ｆ","Ｇ","Ｈ","Ｉ","Ｊ","Ｋ","Ｌ","Ｍ","Ｎ","Ｏ","Ｐ","Ｑ","Ｒ","Ｓ","Ｔ","Ｕ","Ｖ","Ｗ","Ｘ","Ｙ","Ｚ"];
const ikind_blank  = 0;
const ikind_turret = 1;
const ikind_horizbeam = 2;
const ikind_vertbeam = 3;
const ikind_crossbeam = 4;

/* Game state */
Game = function(g){
  if (g != null){
    this.board = g.board.clone();
    this.turn = g.turn;
    this.error = g.error;
    this.n = g.n;
    this.turnCount = g.turnCount;
  }
}

Game.prototype.init = function(n){
  this.n = n;
  this.board = new Array(n);
  this.turn = 1;
  this.error = 0;
  this.turnCount = 0;

  for (var y = 0; y < n; y++){
    this.board[y] = new Array(n);
    for (var x = 0; x < n; x++){
      this.board[y][x] = 0;
    }
  }
}

/* put 
  input:
    pos = [0--n^2-1]: position to put
    dir = 0: left
    dir = 1: right
    dir = 2: up
    dir = 3: down
  output:
    {
      error = 0: no error
      error = 1: the game has error
      Game : next game state
    }
*/
const dir_x = [-1, +1, 0,  0];
const dir_y = [ 0, 0, -1, +1];
Game.prototype.move = function(pos, dir){
  const n = this.n;
  const x = pos % n;
  const y = Math.floor(pos / n);
  const board = this.board;
  if (this.error != 0)       return {error: 1}; /* already error */
  if (pos < 0 || pos >= n*n) return {error: 2}; /* pos out of range */
  if (dir < 0 || dir >= 4)   return {error: 3}; /* dir out of range */
  if (board[y][x] != ikind_blank) return {error: 4}; /* already put */
  const dx = dir_x[dir];
  const dy = dir_y[dir];
  const nx = x + dx;
  const ny = y + dy;
  if (nx < 0 || nx >= n) return {error: 5}; /* cannot shoot beam because out of range */
  if (ny < 0 || ny >= n) return {error: 6}; /* cannot shoot beam because out of range */
  if (board[ny][nx] == ikind_turret) return {error: 7}; /* cannot shoot beam because of turret */

  /* valid move */
  g = new Game(this);
  g.board[y][x] = ikind_turret;
  g.turn = (g.turn == 1) ? 2 : 1;
  g.error = 0;
  g.turnCount++;
  /* shoot beam to dir */
  for (var i = 1; i < n; i++){
    const tx = x + dx * i;
    const ty = y + dy * i;
    if (tx < 0 || tx >= n) break; /* out of range */
    if (ty < 0 || ty >= n) break; /* out of range */
    const t = board[ty][tx];
    var isbreak = false;
    switch(t){
      case ikind_turret:
        isbreak = true;
        break;
      case ikind_blank:
        g.board[ty][tx] = (dy == 0) ? ikind_horizbeam : ikind_vertbeam;
        break;
      case ikind_horizbeam:
        g.board[ty][tx] = ikind_crossbeam;
        break;
      case ikind_vertbeam:
        g.board[ty][tx] = ikind_crossbeam;
        break;
      default: /* cannot happen */
        isbreak = true;
        break;
    }
    if (isbreak) break;
  }
  return {error: 0, next: g};
}

/* generate next game state by solver */
Game.prototype.enumnext = function(){
  var next = [];
  const n = this.n;
  for (var y = 0; y < n; y++){
    for (var x = 0; x < n; x++){
      if (this.board[y][x] == ikind_blank){
        /* try left beam */
        if (x > 0 && this.board[y][x-1] != ikind_turret){
          ret = this.move(y*n+x, 0);
          if (ret.error == 0){
            next.push(ret.next);
          }else{
            console.log("error: put error=" + ret.error + " pos=(" + x + "," + y + ") dir=left");
          }
        }
        /* try right beam */
        if (x < n-1 && this.board[y][x+1] != ikind_turret){
          ret = this.move(y*n+x, 1);
          if (ret.error == 0){
            next.push(ret.next);
          }else{
            console.log("error: put error=" + ret.error + " pos=(" + x + "," + y + ") dir=right");
          }
        }
        /* try up beam */
        if (y > 0 && this.board[y-1][x] != ikind_turret){
          ret = this.move(y*n+x, 2);
          if (ret.error == 0){
            next.push(ret.next);
          }else{
            console.log("error: put error=" + ret.error + " pos=(" + x + "," + y + ") dir=up");
          }
        }
        /* try down beam */
        if (y < n-1 && this.board[y+1][x] != ikind_turret){
          ret = this.move(y*n+x, 3);
          if (ret.error == 0){
            next.push(ret.next);
          }else{
            console.log("error: put error=" + ret.error + " pos=(" + x + "," + y + ") dir=down");
          }
        }
      }// if
    }// for x
  }// for y
  return next;
}

Game.prototype.check = function() {
  const n = this.n;
  const board = this.board;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (board[y][x] === ikind_blank) {
        // try left
        if (x > 0 && board[y][x-1] !== ikind_turret) {
          const ret = this.move(y*n + x, 0);
          if (ret.error === 0) return true;
        }
        // try right
        if (x < n-1 && board[y][x+1] !== ikind_turret) {
          const ret = this.move(y*n + x, 1);
          if (ret.error === 0) return true;
        }
        // try up
        if (y > 0 && board[y-1][x] !== ikind_turret) {
          const ret = this.move(y*n + x, 2);
          if (ret.error === 0) return true;
        }
        // try down
        if (y < n-1 && board[y+1][x] !== ikind_turret) {
          const ret = this.move(y*n + x, 3);
          if (ret.error === 0) return true;
        }
      }
    }
  }
  return false;
}

/* calculate grundy number */
Game.prototype.getGrundy = function(){
  var next = this.enumnext();
  if (next.length == 0) return 0; /* no next state */
  var grundy = new Array(next.length);
  for (var i = 0; i < next.length; i++){
    grundy[i] = next[i].getGrundy();
  }
  grundy.sort();
  var i = 0;
  for (var j = 0; j < grundy.length; j++){
    if (grundy[j] == i){
      i++;
    }else{
      break;
    }
  }
  return i;
}

Game.prototype.toString = function(){
  var str = "";
  const n = this.n;
  for (var y = 0; y < n; y++){
    for (var x = 0; x < n; x++){
      const b=this.board[y][x];
      if (b == ikind_blank){
        str += charblank[x + y*n];
      }else{
        str += charkind[b];
      }
    }
    str += "\n";
  }
  //turn
  str += this.turn + "\n";
}
