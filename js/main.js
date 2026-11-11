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