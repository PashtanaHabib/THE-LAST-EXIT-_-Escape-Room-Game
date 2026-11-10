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

// clicking objects
function handleObject(o) {
  var room = currentRoom,
    a = o.action;
  var key = room.id + ":" + o.id;
  if (gameState.viewed.indexOf(key) === -1) {
    gameState.viewed.push(key);
    saveGame();
  }

  if (a.type === "clue") {
    playSound("clue");
    var isNew = a.item ? addItem(a.item) : false;
    var def = a.item ? getItemDef(a.item) : null;
    var extra = isNew
      ? '<p class="modal-note">' +
        def.icon +
        " <strong>" +
        escapeHtml(def.name) +
        "</strong> was added to your inventory.</p>"
      : "";
    showInfo(a.title, a.text, extra, def ? def.icon : "🔎");
    updateRoomUI();
    return;
  }

  if (a.type === "puzzle") {
    if (a.requires && !isSolved(a.requires)) {
      showInfo(o.name, a.lockedMsg || "It is locked.", "", "🔒");
      return;
    }
    if (isSolved(a.puzzle)) {
      if (a.afterSolved)
        showInfo(a.afterSolved.title, a.afterSolved.text, "", "✅");
      else showInfo(o.name, "You already solved this.", "", "✅");
      return;
    }
    openPuzzle(a.puzzle);
    return;
  }

  if (a.type === "door") {
    if (isRoomCompleted(room.id)) {
      showInfo(
        "Door",
        "This door is already unlocked. Return to the room selection to continue.",
        '<div class="modal-actions"><a class="btn btn-primary" href="levels.html">Room Selection</a></div>',
        "🚪",
      );
      return;
    }
    if (room.id === 1 && !hasItem("key")) {
      playSound("wrong");
      showInfo(
        "Locked Door",
        "You need the Brass Key from the lockbox to open this exit.",
        "",
        "🔒",
      );
      return;
    }
    if (!allSolved(room)) {
      playSound("wrong");
      showInfo(
        "Locked Door",
        a.lockedMsg +
          "\n\nPuzzles solved: " +
          countSolved(room) +
          " / " +
          room.puzzles.length,
        "",
        "🔒",
      );
      return;
    }
    completeRoom(room.id);
  }
}

// puzzles
function openPuzzle(id) {
  var p = getPuzzle(id);
  puzzleState = {
    id: id,
    seq: [],
    toggles:
      p.type === "toggles"
        ? p.switches.map(function () {
            return 0;
          })
        : [],
    choice: null,
  };
  var body = "";

  if (p.type === "text") {
    body =
      '<input id="pz-input" class="pz-input" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="' +
      (p.digits || 24) +
      '"' +
      (p.digits ? ' inputmode="numeric"' : "") +
      ' placeholder="' +
      escapeHtml(p.placeholder || "") +
      '">';
  } else if (p.type === "choice") {
    body =
      '<div class="pz-choices">' +
      p.options
        .map(function (op) {
          return (
            '<button type="button" class="pz-choice" data-choice="' +
            op.id +
            '">' +
            escapeHtml(op.label) +
            "</button>"
          );
        })
        .join("") +
      "</div>";
  } else if (p.type === "sequence") {
    body =
      '<div class="pz-slots" id="pz-slots">' +
      p.answer
        .map(function () {
          return '<span class="slot"></span>';
        })
        .join("") +
      "</div>" +
      '<div class="pz-options">' +
      p.options
        .map(function (op) {
          var style = op.color ? ' style="background:' + op.color + '"' : "";
          return (
            '<button type="button" class="pz-opt' +
            (op.color ? " color" : "") +
            '" data-opt="' +
            op.id +
            '"' +
            style +
            ' aria-label="' +
            escapeHtml(op.name || op.id) +
            '">' +
            escapeHtml(op.label || "") +
            "</button>"
          );
        })
        .join("") +
      "</div>" +
      '<div class="pz-names">' +
      p.options
        .map(function (op) {
          return "<span>" + escapeHtml(op.name || "") + "</span>";
        })
        .join("") +
      "</div>";
  } else if (p.type === "toggles") {
    body =
      '<div class="pz-switches">' +
      p.switches
        .map(function (s, i) {
          return (
            '<button type="button" class="pz-switch" data-sw="' +
            i +
            '" aria-pressed="false"><span class="sw-name">' +
            s +
            '</span><span class="sw-knob"></span><span class="sw-state">OFF</span></button>'
          );
        })
        .join("") +
      "</div>";
  }

  var showHint = gameState.hintsUsed.indexOf(id) !== -1;
  var needsClear = p.type === "sequence";
  var html =
    '<div class="modal-head"><span class="modal-icon">' +
    p.icon +
    "</span><h2>" +
    escapeHtml(p.title) +
    "</h2></div>" +
    '<p class="modal-text pz-prompt">' +
    escapeHtml(p.prompt).replace(/\n/g, "<br>") +
    "</p>" +
    body +
    '<div class="pz-msg" id="pz-msg" role="status"></div>' +
    '<div class="pz-hint" id="pz-hint"' +
    (showHint ? "" : " hidden") +
    ">💡 " +
    escapeHtml(p.hint) +
    "</div>" +
    '<div class="modal-actions">' +
    '<button type="button" class="btn btn-ghost" id="pz-hint-btn">Hint (−50)</button>' +
    (needsClear
      ? '<button type="button" class="btn btn-ghost" id="pz-clear">Clear</button>'
      : "") +
    '<button type="button" class="btn btn-primary" id="pz-submit">' +
    (p.type === "text"
      ? "Enter"
      : p.type === "toggles"
        ? "Activate"
        : "Confirm") +
    "</button>" +
    "</div>";
  openModal(html);
  bindPuzzle(p);
}

function setPuzzleMessage(text, kind) {
  var el = document.getElementById("pz-msg");
  if (!el) return;
  el.textContent = text;
  el.className = "pz-msg " + (kind || "");
}

function bindPuzzle(p) {
  var box = document.getElementById("modal-box");
  var submit = document.getElementById("pz-submit");

  document.getElementById("pz-hint-btn").addEventListener("click", function () {
    useHint(p);
  });

  function readValue() {
    if (p.type === "text") return document.getElementById("pz-input").value;
    if (p.type === "choice") return puzzleState.choice;
    if (p.type === "sequence") return puzzleState.seq.slice();
    if (p.type === "toggles") return puzzleState.toggles.join("");
    return null;
  }

  function trySubmit() {
    var v = readValue();
    if (p.type === "text" && !String(v).trim()) {
      setPuzzleMessage("Type an answer first.", "bad");
      return;
    }
    if (p.id === "p12" && !getFinalGateCode()) {
      setPuzzleMessage(
        "You need Gate Fragments 1, 2 and 3 in your inventory before entering the final code.",
        "bad",
      );
      return;
    }
    if (p.type === "choice" && !v) {
      setPuzzleMessage("Select an option first.", "bad");
      return;
    }
    if (p.type === "sequence" && v.length < p.answer.length) {
      setPuzzleMessage(
        "Choose all " + p.answer.length + " items first.",
        "bad",
      );
      return;
    }
    if (checkAnswer(p.id, v)) onPuzzleSolved(p);
    else onWrongAnswer(p, box);
  }
  submit.addEventListener("click", trySubmit);

  if (p.type === "text") {
    var input = document.getElementById("pz-input");
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        trySubmit();
      }
    });
    if (p.digits)
      input.addEventListener("input", function () {
        input.value = input.value.replace(/[^0-9]/g, "");
      });
  }

  if (p.type === "choice") {
    var btns = box.querySelectorAll(".pz-choice");
    Array.prototype.forEach.call(btns, function (b) {
      b.addEventListener("click", function () {
        playSound("click");
        puzzleState.choice = b.getAttribute("data-choice");
        Array.prototype.forEach.call(btns, function (x) {
          x.classList.toggle("selected", x === b);
        });
        setPuzzleMessage("", "");
      });
    });
  }

  if (p.type === "sequence") {
    var opts = box.querySelectorAll(".pz-opt");
    var renderSlots = function () {
      var slots = box.querySelectorAll(".slot");
      Array.prototype.forEach.call(slots, function (s, i) {
        var id = puzzleState.seq[i],
          def = null;
        p.options.forEach(function (o) {
          if (o.id === id) def = o;
        });
        s.textContent = def && !def.color ? def.label : "";
        s.style.background = def && def.color ? def.color : "";
        s.classList.toggle("filled", !!def);
      });
      Array.prototype.forEach.call(opts, function (b) {
        b.classList.toggle(
          "used",
          p.unique &&
            puzzleState.seq.indexOf(b.getAttribute("data-opt")) !== -1,
        );
      });
    };
    Array.prototype.forEach.call(opts, function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-opt");
        if (puzzleState.seq.length >= p.answer.length) return;
        if (p.unique && puzzleState.seq.indexOf(id) !== -1) return;
        playSound("click");
        puzzleState.seq.push(id);
        setPuzzleMessage("", "");
        renderSlots();
      });
    });
    document.getElementById("pz-clear").addEventListener("click", function () {
      puzzleState.seq = [];
      setPuzzleMessage("", "");
      renderSlots();
    });
    puzzleState.renderSlots = renderSlots;
  }

  if (p.type === "toggles") {
    var sws = box.querySelectorAll(".pz-switch");
    Array.prototype.forEach.call(sws, function (b) {
      b.addEventListener("click", function () {
        playSound("click");
        var i = Number(b.getAttribute("data-sw"));
        puzzleState.toggles[i] = puzzleState.toggles[i] ? 0 : 1;
        var on = puzzleState.toggles[i] === 1;
        b.classList.toggle("on", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
        b.querySelector(".sw-state").textContent = on ? "ON" : "OFF";
        setPuzzleMessage("", "");
      });
    });
  }
}

function useHint(p) {
  var el = document.getElementById("pz-hint");
  if (!el) return;
  if (gameState.hintsUsed.indexOf(p.id) === -1) {
    gameState.hintsUsed.push(p.id);
    saveGame();
    addScore(SCORE_RULES.hint);
    setPuzzleMessage("Hint used: −50 points.", "bad");
  }
  el.hidden = false;
}

function onWrongAnswer(p, box) {
  gameState.wrongAnswers++;
  saveGame();
  addScore(SCORE_RULES.wrong);
  playSound("wrong");
  box.classList.remove("shake");
  void box.offsetWidth; // restart the animation
  box.classList.add("shake");
  if (typeof isScreenShakeEnabled === "function" && isScreenShakeEnabled()) {
    document.body.classList.remove("screen-shake");
    void document.body.offsetWidth;
    document.body.classList.add("screen-shake");
    window.setTimeout(function () {
      document.body.classList.remove("screen-shake");
    }, 420);
  }
  setPuzzleMessage("Incorrect. −25 points.", "bad");
  if (p.type === "sequence") {
    puzzleState.seq = [];
    if (puzzleState.renderSlots) puzzleState.renderSlots();
  }
}

function onPuzzleSolved(p) {
  gameState.solvedPuzzles.push(p.id);
  saveGame();
  addScore(SCORE_RULES.puzzle);
  playSound("correct");

  var gained = [];
  p.reward.forEach(function (id) {
    if (addItem(id)) gained.push(getItemDef(id));
  });

  var gainedHtml = gained.length
    ? '<div class="reward-list">' +
      gained
        .map(function (d) {
          return (
            '<span class="reward">' +
            d.icon +
            " " +
            escapeHtml(d.name) +
            "</span>"
          );
        })
        .join("") +
      "</div>"
    : "";

  var stage = document.getElementById("stage");
  if (stage) {
    stage.classList.remove("solved-flash");
    void stage.offsetWidth;
    stage.classList.add("solved-flash");
    window.setTimeout(function () {
      stage.classList.remove("solved-flash");
    }, 650);
  }
  var box = document.getElementById("modal-box");
  box.classList.add("success");
  document.getElementById("modal-content").innerHTML =
    '<div class="modal-head"><span class="modal-icon">✅</span><h2>Solved!</h2></div>' +
    '<p class="modal-text">' +
    escapeHtml(p.success) +
    "</p>" +
    gainedHtml +
    '<p class="modal-note">+100 points</p>' +
    '<div class="modal-actions"><button type="button" class="btn btn-primary" data-close>' +
    (p.final ? "Continue" : "Continue") +
    "</button></div>";
  var btn = box.querySelector("[data-close]");
  if (btn) btn.focus();
  updateRoomUI();

  if (p.final) {
    completeRoom(currentRoom.id, true);
    modalOnClose = function () {
      window.location.href = "result.html";
    };
    finishGame(true, true);
  } else {
    modalOnClose = function () {
      box.classList.remove("success");
    };
  }
}

//  room / game completion

function completeRoom(roomId, silent) {
  if (isRoomCompleted(roomId)) return;
  gameState.completedRooms.push(roomId);
  if (
    roomId < ROOMS.length &&
    gameState.unlockedRooms.indexOf(roomId + 1) === -1
  ) {
    gameState.unlockedRooms.push(roomId + 1);
  }
  saveGame();
  addScore(SCORE_RULES.room);
  updateRoomUI();
  if (silent) return;
  playSound("unlock");
  var next = getRoom(roomId + 1);
  openModal(
    '<div class="modal-head"><span class="modal-icon">🔓</span><h2>Room Complete!</h2></div>' +
      '<p class="modal-text">The door unlocks with a heavy click. ' +
      (next
        ? "Next: <strong>" + escapeHtml(next.title) + "</strong> is now open."
        : "") +
      "</p>" +
      '<p class="modal-note">+150 points</p>' +
      '<div class="modal-actions"><a class="btn btn-primary" href="levels.html">Continue to Room Selection</a></div>',
  );
}

function finishGame(won, keepModal) {
  if (!gameState || gameState.status !== "playing") return;
  stopTimer();
  if (won) {
    playSound("victory");
    gameState.status = "won";
    saveGame();
    addScore(SCORE_RULES.game);
    saveRecord();
  } else {
    gameState.status = "lost";
    saveGame();
  }
  gameState.finishedAt = Date.now();
  saveGame();
  if (keepModal) return; // victory: the solved modal sends the player to the result page
  if (won) {
    window.location.href = "result.html";
    return;
  }

  // Time is up: show a short Game Over message, then go to the result page
  var overlay = document.getElementById("modal-overlay");
  if (overlay) {
    playSound("wrong");
    openModal(
      '<div class="modal-head"><span class="modal-icon">⏳</span><h2>Time\'s Up</h2></div>' +
        '<p class="modal-text">The countdown reached zero. The doors seal forever...</p>' +
        '<div class="modal-actions"><a class="btn btn-primary" href="result.html">See Result</a></div>',
    );
    setTimeout(function () {
      window.location.href = "result.html";
    }, 4000);
  } else {
    window.location.href = "result.html";
  }
}



// page start
function initGamePage() {
  if (!requireGame('playing')) return;
  var params = new URLSearchParams(window.location.search);
  var rid = Number(params.get('room')) || gameState.currentRoom || 1;
  var room = getRoom(rid);
  if (!room || !isRoomUnlocked(rid)) { window.location.replace('levels.html'); return; }
  currentRoom = room;
  gameState.currentRoom = rid;
  saveGame();

  document.getElementById('hud-player').textContent = gameState.playerName;
  updateScoreDisplay();
  updateTimerDisplay();
  renderRoom();
  renderInventory();

  // modal close handling
  document.getElementById('modal-overlay').addEventListener('click', function (e) {
    if (e.target.id === 'modal-overlay' || e.target.id === 'modal-close' || (e.target.hasAttribute && e.target.hasAttribute('data-close'))) closeModal();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });

  // Try immediately, then retry on the first real user interaction.
  // The Begin button is also a direct user gesture and starts the soundtrack.
  if (typeof startAmbientAudio === 'function') startAmbientAudio();

  var begin = function () {
    if (typeof startAmbientAudio === 'function') startAmbientAudio();
    startTimer(null, function () { finishGame(false); });
  };

  var unlockAdventureSound = function () {
    if (typeof startAmbientAudio === 'function') startAmbientAudio();
  };
  document.addEventListener('pointerdown', unlockAdventureSound, { once: true });
  document.addEventListener('keydown', unlockAdventureSound, { once: true });

  if (gameState.introSeen.indexOf(rid) === -1 && !isRoomCompleted(rid)) {
    gameState.introSeen.push(rid);
    saveGame();
    openModal(
      '<div class="modal-head intro"><span class="eyebrow">ROOM 0' + room.id + '</span><h2>' + escapeHtml(room.title) + '</h2></div>' +
      '<p class="modal-text">' + escapeHtml(room.intro) + '</p>' +
      '<p class="modal-note">Goal: ' + escapeHtml(room.objective) + '</p>' +
      '<div class="modal-actions"><button type="button" class="btn btn-primary" data-close>Begin</button></div>',
      begin
    );
  } else {
    begin();
  }
}