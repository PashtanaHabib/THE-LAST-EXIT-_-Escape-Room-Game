// timer.js — 20 minute countdown

// Public API:
// startTimer(onTick, onEnd)  start counting down gameState.timeLeft
// stopTimer()                stop it
// formatTime(seconds)        "MM:SS"
// The remaining time is saved in LocalStorage every second.

var timerId = null;
var timerWarningsPlayed = {};

function formatTime(total) {
  total = Math.max(0, Math.floor(total));
  var m = Math.floor(total / 60), s = total % 60;
  return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
}

function updateTimerDisplay() {
  var el = document.getElementById('hud-time');
  if (!el || !gameState) return;
  el.textContent = formatTime(gameState.timeLeft);
  var box = el.parentNode;
  if (box && box.classList) {
    box.classList.toggle('danger', gameState.timeLeft <= 60);
    box.classList.toggle('warn', gameState.timeLeft > 60 && gameState.timeLeft <= 180);
  }
}

function startTimer(onTick, onEnd) {
  stopTimer();
  if (!gameState || gameState.status !== 'playing') return;

  // Subtract time elapsed since the last saved tick (also covers refresh/closed tab).
  var now = Date.now();
  if (typeof gameState.lastTickAt !== 'number' || gameState.lastTickAt > now) {
    gameState.lastTickAt = now;
  }
  var elapsed = Math.floor((now - gameState.lastTickAt) / 1000);
  if (elapsed > 0) {
    gameState.timeLeft = Math.max(0, gameState.timeLeft - elapsed);
    gameState.lastTickAt += elapsed * 1000;
    saveGame();
  }

  updateTimerDisplay();
  if (gameState.timeLeft <= 0) {
    if (typeof onEnd === 'function') onEnd();
    return;
  }

  timerId = setInterval(function () {
    if (!gameState || gameState.status !== 'playing') { stopTimer(); return; }
    var currentTime = Date.now();
    var secondsPassed = Math.floor((currentTime - gameState.lastTickAt) / 1000);
    if (secondsPassed < 1) return;

    gameState.timeLeft = Math.max(0, gameState.timeLeft - secondsPassed);
    gameState.lastTickAt += secondsPassed * 1000;
    saveGame();
    updateTimerDisplay();
    if (gameState.timeLeft <= 60 && !timerWarningsPlayed[60]) {
      timerWarningsPlayed[60] = true;
      if (typeof playSound === 'function') playSound('timer');
    }
    if (gameState.timeLeft <= 10 && !timerWarningsPlayed[10]) {
      timerWarningsPlayed[10] = true;
      if (typeof playSound === 'function') playSound('timer');
    }
    if (typeof onTick === 'function') onTick(gameState.timeLeft);

    if (gameState.timeLeft <= 0) {
      stopTimer();
      if (typeof onEnd === 'function') onEnd();
    }
  }, 250);
}

function stopTimer() {
  if (timerId) { clearInterval(timerId); timerId = null; }
}