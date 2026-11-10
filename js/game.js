// game.js — room + game state management
// Public API (other files):
// requireGame()            load the save; redirect if there is none
// isSolved(puzzleId)       true if the puzzle was solved
// completeRoom(roomId)     +150, unlock next room
// finishGame(won)          end the game (won / lost) and go to result
// initGamePage()           start the game.html page

var currentRoom = null;
var modalOnClose = null;
var puzzleState = null;
// temporary UI state of the open puzzle

//  state helpers
function requireGame(allowedStatus) {
  loadGame();
  if (!gameState) {
    window.location.replace("index.html");
    return false;
  }
  if (allowedStatus === "playing" && gameState.status !== "playing") {
    window.location.replace("result.html");
    return false;
  }
  return true;
}

function isSolved(puzzleId) {
  return gameState.solvedPuzzles.indexOf(puzzleId) !== -1;
}
function isRoomUnlocked(id) {
  return gameState.unlockedRooms.indexOf(id) !== -1;
}
function isRoomCompleted(id) {
  return gameState.completedRooms.indexOf(id) !== -1;
}
function countSolved(room) {
  return room.puzzles.filter(isSolved).length;
}
function allSolved(room) {
  return countSolved(room) === room.puzzles.length;
}
