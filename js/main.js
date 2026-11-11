// main.js — starts every page and manages general UI
// (home, instructions, level selection, result), plus
// shared helpers: escapeHtml, showToast, playSound.
// The page is chosen with <body data-page="...">.

var MUTE_KEY = 'thelastexit_muted';
var audioCache = {};
var SOUND_FILES = {
  click: 'assets/sounds/click.mp3',
  correct: 'assets/sounds/correct.mp3',
  wrong: 'assets/sounds/wrong.mp3'
};

/* ---------- helpers ---------- */
function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function isMuted() {
  var settings = typeof getGameSettings === 'function' ? getGameSettings() : { soundEnabled: true };
  return safeGet(MUTE_KEY) === '1' || settings.soundEnabled === false;
}

function playSound(name) {
  if (isMuted()) return;
  if (!SOUND_FILES[name]) {
    if (typeof playGameTone === 'function') playGameTone(name);
    return;
  }
  try {
    var a = audioCache[name];
    if (!a) { a = new Audio(SOUND_FILES[name]); audioCache[name] = a; }
    var settings = typeof getGameSettings === 'function' ? getGameSettings() : { effectsVolume: 80 };
    a.volume = Math.max(0, Math.min(1, (settings.effectsVolume || 0) / 100));
    a.currentTime = 0;
    var p = a.play();
    if (p && p.catch) p.catch(function () { /* autoplay blocked */ });
  } catch (e) { /* ignore */ }
}

function showToast(message) {
  var box = document.getElementById('toasts');
  if (!box) {
    box = document.createElement('div');
    box.id = 'toasts';
    box.className = 'toasts';
    document.body.appendChild(box);
  }
  var t = document.createElement('div');
  t.className = 'toast';
  t.textContent = message;
  box.appendChild(t);
  setTimeout(function () { t.classList.add('out'); }, 2400);
  setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 2900);
}

function initSoundToggle() {
  var btn = document.getElementById('sound-toggle');
  if (!btn) return;
  var render = function () {
    btn.textContent = isMuted() ? '🔇' : '🔊';
    btn.setAttribute('aria-label', isMuted() ? 'Sound off' : 'Sound on');
  };
  render();
  btn.addEventListener('click', function () {
    safeSet(MUTE_KEY, safeGet(MUTE_KEY) === '1' ? '0' : '1');
    render();
    if (typeof updateAmbientVolume === 'function') updateAmbientVolume();
    playSound('click');
  });
}

function fillHud() {
  var p = document.getElementById('hud-player');
  if (p && gameState) p.textContent = gameState.playerName;
  updateScoreDisplay();
  updateTimerDisplay();
}

/* ---------- LEADERBOARD RESET ---------- */
function resetLeaderboard(buttonId, onReset) {
  var button = document.getElementById(buttonId);
  if (!button) return;
  button.addEventListener('click', function () {
    if (!getRecords().length) {
      if (typeof onReset === 'function') onReset();
      return;
    }
    if (!window.confirm('Delete all saved leaderboard records from this browser? Your active game will not be deleted.')) return;
    clearRecords();
    if (typeof onReset === 'function') onReset();
    playSound('click');
  });
}

/* ---------- HOME ---------- */
function initHome() {
  var form = document.getElementById('start-form');
  var input = document.getElementById('player-name');
  var error = document.getElementById('name-error');
  input.value = getLastName();

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = input.value.replace(/\s+/g, ' ').trim();
    if (name.length < 2) {
      error.textContent = 'Please enter a name with at least 2 characters.';
      input.focus();
      return;
    }
    error.textContent = '';
    if (hasSavedGame() && !window.confirm('A game in progress is saved in this browser. Starting a new game will erase it. Continue?')) return;
    playSound('click');
    newGame(name);
    window.location.href = 'instructions.html';
  });

  var cont = document.getElementById('continue-box');
  if (hasSavedGame()) {
    document.getElementById('continue-info').textContent =
      gameState.playerName + ' — Score ' + gameState.score + ' — ' + formatTime(gameState.timeLeft) + ' left';
    cont.hidden = false;
  }

  var best = getBestRecord();
  var bestEl = document.getElementById('best-record');
  if (best && bestEl) {
    bestEl.hidden = false;
    bestEl.innerHTML = '🏆 Best record: <strong>' + escapeHtml(best.name) + '</strong> — ' + best.score + ' pts — ' + formatTime(best.timeLeft) + ' left';
  }

  var resetHomeBtn = document.getElementById('reset-records-home');
  if (resetHomeBtn) {
    resetHomeBtn.hidden = !getRecords().length;
    resetLeaderboard('reset-records-home', function () {
      if (bestEl) { bestEl.hidden = true; bestEl.textContent = ''; }
      resetHomeBtn.hidden = true;
      showToast('Leaderboard cleared. Your active game is safe.');
    });
  }
}

/* ---------- INSTRUCTIONS ---------- */
function initInstructions() {
  var go = document.getElementById('go-btn');
  if (hasSavedGame()) {
    go.textContent = 'Enter the Rooms';
    go.setAttribute('href', 'levels.html');
  } else {
    go.textContent = 'Back to Home';
    go.setAttribute('href', 'index.html');
  }
}

/* ---------- LEVEL SELECTION ---------- */
function initLevels() {
  if (!requireGame('playing')) return;
  fillHud();
  var grid = document.getElementById('level-grid');
  grid.innerHTML = '';

  ROOMS.forEach(function (room) {
    var unlocked = isRoomUnlocked(room.id), done = isRoomCompleted(room.id);
    var solved = countSolved(room);
    var status = done ? 'Completed' : (unlocked ? 'Unlocked' : 'Locked');
    var card = document.createElement('article');
    card.className = 'level-card ' + (done ? 'completed' : unlocked ? 'unlocked' : 'locked');
    card.innerHTML =
      '<div class="level-thumb" style="background-image:url(' + room.image + ')">' +
        '<span class="level-num">0' + room.id + '</span>' +
        (unlocked ? '' : '<span class="level-lock">🔒</span>') +
      '</div>' +
      '<div class="level-body">' +
        '<div class="level-top"><span class="badge diff-' + room.difficulty.toLowerCase() + '">' + room.difficulty + '</span>' +
        '<span class="status status-' + status.toLowerCase() + '">' + status + '</span></div>' +
        '<h3>' + escapeHtml(room.title) + '</h3>' +
        '<p>' + escapeHtml(room.summary) + '</p>' +
        '<div class="mini-progress"><div style="width:' + (solved / room.puzzles.length * 100) + '%"></div></div>' +
        '<div class="mini-label">Puzzles: ' + solved + ' / ' + room.puzzles.length + '</div>' +
        (unlocked
          ? '<a class="btn btn-primary" href="game.html?room=' + room.id + '">' + (done ? 'Review Room' : (solved ? 'Continue' : 'Enter Room')) + '</a>'
          : '<button class="btn btn-disabled" type="button" disabled>Complete Room 0' + (room.id - 1) + ' first</button>') +
      '</div>';
    grid.appendChild(card);
  });

  var total = gameState.solvedPuzzles.length, all = getTotalPuzzles();
  document.getElementById('overall-label').textContent = total + ' / ' + all + ' puzzles solved';
  document.getElementById('overall-bar').style.width = (total / all * 100) + '%';

  var quit = document.getElementById('quit-btn');
  if (quit) quit.addEventListener('click', function () { playSound('click'); });

  startTimer(null, function () { finishGame(false); });
}

/* ---------- RESULT ---------- */
function initResult() {
  if (!requireGame()) return;
  if (gameState.status === 'playing') { window.location.replace('levels.html'); return; }
  var won = gameState.status === 'won';
  document.body.classList.add(won ? 'victory' : 'gameover');

  document.getElementById('result-kicker').textContent = won ? 'YOU ESCAPED' : 'GAME OVER';
  document.getElementById('result-title').textContent = won ? 'Victory!' : "Time's Up";
  document.getElementById('result-msg').textContent = won
    ? 'The gate opens and the night air hits your face. You solved every puzzle in THE LAST EXIT.'
    : 'The countdown reached zero and the doors sealed forever. Dr. Voss\'s trap claimed another one.';

  document.getElementById('res-name').textContent = gameState.playerName;
  document.getElementById('res-score').textContent = gameState.score;
  document.getElementById('res-time').textContent = formatTime(gameState.timeLeft);
  document.getElementById('res-puzzles').textContent = gameState.solvedPuzzles.length + ' / ' + getTotalPuzzles();
  document.getElementById('res-wrong').textContent = gameState.wrongAnswers;
  document.getElementById('res-hints').textContent = gameState.hintsUsed.length;

  var records = getRecords();
  var tbody = document.getElementById('records-body');
  tbody.innerHTML = '';
  if (!records.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="muted">No records yet. Escape to set one!</td></tr>';
  } else {
    records.forEach(function (r, i) {
      var tr = document.createElement('tr');
      tr.innerHTML = '<td>' + (i + 1) + '</td><td>' + escapeHtml(r.name) + '</td><td>' + r.score + '</td><td>' + formatTime(r.timeLeft) + '</td>';
      tbody.appendChild(tr);
    });
  }

  resetLeaderboard('reset-records-result', function () {
    tbody.innerHTML = '<tr><td colspan="4" class="muted">No records yet. Escape to set one!</td></tr>';
    showToast('Leaderboard cleared. Your active game is safe.');
  });

  document.getElementById('play-again').addEventListener('click', function (e) {
    e.preventDefault();
    playSound('click');
    newGame(gameState.playerName);
    window.location.href = 'levels.html';
  });
}