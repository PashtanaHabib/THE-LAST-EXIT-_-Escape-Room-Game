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

// room rendering
function renderRoom() {
  var room = currentRoom;
  document.getElementById("room-title").textContent =
    "ROOM 0" + room.id + " — " + room.title.replace("THE ", "");
  var diff = document.getElementById("room-diff");
  diff.textContent = room.difficulty;
  diff.className = "badge diff-" + room.difficulty.toLowerCase();

  var stage = document.getElementById("stage");
  stage.innerHTML =
    '<img class="room-img" alt="' +
    escapeHtml(room.title) +
    '" src="' +
    room.image +
    '" draggable="false">';
  room.objects.forEach(function (o) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "hotspot";
    b.id = "hs-" + o.id;
    b.style.left = o.box[0] + "%";
    b.style.top = o.box[1] + "%";
    b.style.width = o.box[2] + "%";
    b.style.height = o.box[3] + "%";
    b.setAttribute("aria-label", o.name);
    b.innerHTML =
      '<span class="hs-label">' +
      escapeHtml(o.name) +
      '</span><span class="hs-mark"></span>';
    b.addEventListener("click", function () {
      playSound("click");
      handleObject(o);
    });
    stage.appendChild(b);
  });
  updateRoomUI();
}

function updateRoomUI() {
  var room = currentRoom;
  room.objects.forEach(function (o) {
    var el = document.getElementById("hs-" + o.id);
    if (!el) return;
    var a = o.action,
      done = false,
      locked = false,
      ready = false;
    if (a.type === "puzzle") {
      done = isSolved(a.puzzle);
      locked = !done && a.requires && !isSolved(a.requires);
    } else if (a.type === "clue") {
      done = gameState.viewed.indexOf(room.id + ":" + o.id) !== -1;
    } else if (a.type === "door") {
      done = isRoomCompleted(room.id);
      ready = !done && allSolved(room);
    }
    el.classList.toggle("done", done);
    el.classList.toggle("locked", !!locked);
    el.classList.toggle("ready", ready);
  });
  var solved = countSolved(room);
  document.getElementById("room-progress").textContent =
    solved + " / " + room.puzzles.length;
  var bar = document.getElementById("room-bar");
  if (bar) bar.style.width = (solved / room.puzzles.length) * 100 + "%";
  var obj = document.getElementById("objective");
  if (room.id === 4) {
    obj.textContent = allSolved(room) ? "You escaped!" : room.objective;
  } else {
    obj.textContent = allSolved(room)
      ? "All puzzles solved! Use the exit door."
      : room.objective;
  }
  document.getElementById("hud-total").textContent =
    gameState.solvedPuzzles.length + " / " + getTotalPuzzles();
}
