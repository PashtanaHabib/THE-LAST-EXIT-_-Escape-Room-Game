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

// modal
function openModal(html, onClose) {
  var overlay = document.getElementById("modal-overlay");
  document.getElementById("modal-content").innerHTML = html;
  modalOnClose = onClose || null;
  overlay.hidden = false;
  var box = document.getElementById("modal-box");
  box.classList.remove("shake");
  var focusEl = box.querySelector("input, .btn-primary, button");
  if (focusEl)
    setTimeout(function () {
      focusEl.focus();
    }, 30);
}

function closeModal() {
  var overlay = document.getElementById("modal-overlay");
  if (!overlay || overlay.hidden) return;
  overlay.hidden = true;
  document.getElementById("modal-content").innerHTML = "";
  puzzleState = null;
  var cb = modalOnClose;
  modalOnClose = null;
  if (typeof cb === "function") cb();
}

function isModalOpen() {
  var o = document.getElementById("modal-overlay");
  return !!o && !o.hidden;
}

function showInfo(title, text, extra, icon) {
  var html =
    '<div class="modal-head"><span class="modal-icon">' +
    (icon || "🔎") +
    "</span><h2>" +
    escapeHtml(title) +
    "</h2></div>" +
    '<p class="modal-text">' +
    escapeHtml(text).replace(/\n/g, "<br>") +
    "</p>" +
    (extra || "") +
    '<div class="modal-actions"><button type="button" class="btn btn-primary" data-close>Close</button></div>';
  openModal(html);
}
