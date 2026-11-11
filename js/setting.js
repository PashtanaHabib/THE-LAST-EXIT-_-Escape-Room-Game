//  settings.js — persistent preferences, extra audio and transitions
var GAME_SETTINGS_KEY = 'thelastexit_settings_v1';
var DEFAULT_GAME_SETTINGS = {
  soundEnabled: true,
  effectsVolume: 80,
  ambientVolume: 60,
  transitions: true,
  screenShake: true,
  motion: 'full'
};

function getGameSettings() {
  var saved = {};
  try { saved = JSON.parse(safeGet(GAME_SETTINGS_KEY) || '{}') || {}; } catch (e) {}
  return Object.assign({}, DEFAULT_GAME_SETTINGS, saved);
}

function saveGameSettings(settings) {
  safeSet(GAME_SETTINGS_KEY, JSON.stringify(settings));
  applyMotionSettings();
}

function updateGameSetting(key, value) {
  var settings = getGameSettings();
  settings[key] = value;
  saveGameSettings(settings);
  updateAmbientVolume();
}

function isScreenShakeEnabled() {
  return getGameSettings().screenShake && getGameSettings().motion === 'full';
}

function applyMotionSettings() {
  var motion = getGameSettings().motion;
  document.documentElement.setAttribute('data-motion', motion);
}

function audioIsEnabled() {
  var settings = getGameSettings();
  return settings.soundEnabled && safeGet('thelastexit_muted') !== '1' && settings.effectsVolume > 0;
}

var gameAudioContext = null;
var ambientGain = null;
var ambientOscillators = [];
var ambientLoopId = null;
var ambientFilter = null;
var ambientMusicStarted = false;

function getAudioContext() {
  var AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!gameAudioContext) gameAudioContext = new AudioContextClass();
  if (gameAudioContext.state === 'suspended') gameAudioContext.resume();
  return gameAudioContext;
}

function playGameTone(name) {
  var settings = getGameSettings();
  if (!audioIsEnabled()) return;
  var ctx = getAudioContext();
  if (!ctx) return;

  var now = ctx.currentTime;
  var master = Math.max(0, Math.min(1, settings.effectsVolume / 100));
  var patterns = {
    clue:      [{ f: 660, d: .10, t: 'sine', g: .12 }, { f: 880, d: .16, t: 'sine', g: .10, wait: .08 }],
    unlock:    [{ f: 392, d: .16, t: 'triangle', g: .16 }, { f: 587, d: .20, t: 'triangle', g: .14, wait: .13 }, { f: 784, d: .28, t: 'sine', g: .12, wait: .27 }],
    transition:[{ f: 220, d: .30, t: 'sawtooth', g: .045 }, { f: 165, d: .36, t: 'sine', g: .07, wait: .12 }],
    victory:   [{ f: 523, d: .18, t: 'sine', g: .13 }, { f: 659, d: .18, t: 'sine', g: .13, wait: .16 }, { f: 784, d: .35, t: 'sine', g: .15, wait: .32 }],
    timer:     [{ f: 880, d: .12, t: 'square', g: .07 }]
  };
  var notes = patterns[name];
  if (!notes) return;

  notes.forEach(function (note) {
    var start = now + (note.wait || 0);
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = note.t;
    osc.frequency.setValueAtTime(note.f, start);
    if (name === 'transition') {
      osc.frequency.exponentialRampToValueAtTime(Math.max(50, note.f * .55), start + note.d);
    }
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(.0002, note.g * master), start + .025);
    gain.gain.exponentialRampToValueAtTime(.0001, start + note.d);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + note.d + .03);
  });
}

// A slow cinematic D-minor soundscape with a low drone and a repeating

//    plucked-note motif. It is generated locally, so no external audio file
//    or network connection is required.

function playAdventureNote(frequency, when, duration, volume) {
  if (!gameAudioContext || !ambientFilter) return;
  var ctx = gameAudioContext;
  var osc = ctx.createOscillator();
  var gain = ctx.createGain();
  var toneFilter = ctx.createBiquadFilter();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(frequency, when);
  toneFilter.type = 'lowpass';
  toneFilter.frequency.value = 1500;
  gain.gain.setValueAtTime(.0001, when);
  gain.gain.exponentialRampToValueAtTime(Math.max(.0002, volume), when + .035);
  gain.gain.exponentialRampToValueAtTime(.0001, when + duration);
  osc.connect(toneFilter);
  toneFilter.connect(gain);
  gain.connect(ambientFilter);
  osc.start(when);
  osc.stop(when + duration + .05);
}

var adventureTrackAudio = null;

function startAmbientAudio() {
  var settings = getGameSettings();
  if (!settings.soundEnabled || settings.ambientVolume <= 0 || safeGet('thelastexit_muted') === '1') return;


  // Use a real, bundled looping soundtrack instead of relying only on
  // synthesized tones. It is retried on the user's first interaction
  // because browsers may block autoplay before a gesture.
  if (!adventureTrackAudio) {
    adventureTrackAudio = new Audio('assets/sounds/adventure-theme.wav');
    adventureTrackAudio.loop = true;
    adventureTrackAudio.preload = 'auto';
    adventureTrackAudio.setAttribute('aria-hidden', 'true');
  }

  adventureTrackAudio.volume = Math.max(0, Math.min(0.9, settings.ambientVolume / 100));
  if (!adventureTrackAudio.paused) {
    ambientMusicStarted = true;
    return;
  }

  var playAttempt;
  try {
    playAttempt = adventureTrackAudio.play();
  } catch (error) {
    ambientMusicStarted = false;
    return;
  }

  if (playAttempt && typeof playAttempt.then === 'function') {
    playAttempt.then(function () {
      ambientMusicStarted = true;
    }).catch(function () {
      ambientMusicStarted = false;
    });
  } else {
    ambientMusicStarted = true;
  }
}

function updateAmbientVolume() {
  var settings = getGameSettings();
  var shouldPlay = settings.soundEnabled &&
    settings.ambientVolume > 0 &&
    safeGet('thelastexit_muted') !== '1';

  if (!adventureTrackAudio) {
    if (shouldPlay && document.body.getAttribute('data-page') === 'game') startAmbientAudio();
    return;
  }

  adventureTrackAudio.volume = shouldPlay
    ? Math.max(0, Math.min(0.9, settings.ambientVolume / 100))
    : 0;

  if (shouldPlay && adventureTrackAudio.paused && document.body.getAttribute('data-page') === 'game') {
    startAmbientAudio();
  } else if (!shouldPlay && !adventureTrackAudio.paused) {
    adventureTrackAudio.pause();
  }
}

function stopAmbientAudio() {
  if (adventureTrackAudio) {
    adventureTrackAudio.pause();
    adventureTrackAudio.currentTime = 0;
  }
  ambientMusicStarted = false;
}

function transitionLabel(href) {
  var url;
  try { url = new URL(href, window.location.href); } catch (e) { return ['THE LAST EXIT', 'One moment...']; }
  var roomId = Number(url.searchParams.get('room'));
  if (url.pathname.endsWith('/game.html') && roomId && typeof ROOMS !== 'undefined') {
    var room = ROOMS.filter(function (r) { return r.id === roomId; })[0];
    if (room) return ['ENTERING ROOM 0' + room.id, room.title];
  }
  if (url.pathname.endsWith('/levels.html')) return ['ROOM SELECTION', 'Choose your next destination'];
  if (url.pathname.endsWith('/result.html')) return ['THE FINAL MOMENT', 'Your fate is being decided'];
  if (url.pathname.endsWith('/instructions.html')) return ['THE BRIEFING', 'Read the rules before you enter'];
  if (url.pathname.endsWith('/settings.html')) return ['GAME SETTINGS', 'Make the experience yours'];
  return ['THE LAST EXIT', 'Prepare yourself'];
}

function showPageTransition(href) {
  var settings = getGameSettings();
  if (!settings.transitions || settings.motion === 'off') {
    window.location.href = href;
    return;
  }
  var overlay = document.getElementById('page-transition');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'page-transition';
    overlay.className = 'page-transition';
    overlay.innerHTML = '<div class="transition-content"><span class="transition-mark">THE LAST EXIT</span><h2 id="transition-title"></h2><p id="transition-subtitle"></p><span class="transition-line"></span></div>';
    document.body.appendChild(overlay);
  }
  var label = transitionLabel(href);
  document.getElementById('transition-title').textContent = label[0];
  document.getElementById('transition-subtitle').textContent = label[1];
  playGameTone('transition');
  requestAnimationFrame(function () { overlay.classList.add('visible'); });
  window.setTimeout(function () { window.location.href = href; }, settings.motion === 'reduced' ? 220 : 520);
}

function initPageTransitions() {
  document.addEventListener('click', function (event) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    var link = event.target.closest ? event.target.closest('a[href]') : null;
    if (!link || link.target === '_blank' || link.hasAttribute('download') || link.getAttribute('href').charAt(0) === '#') return;
    var rawHref = link.getAttribute('href');
    if (!rawHref || /^(mailto:|tel:|javascript:)/i.test(rawHref)) return;
    var url;
    try { url = new URL(rawHref, window.location.href); } catch (e) { return; }
    if (url.origin !== window.location.origin || !/\.html$/i.test(url.pathname)) return;
    if (url.href === window.location.href) return;
    event.preventDefault();
    if (url.pathname.endsWith('/settings.html')) {
      try { window.sessionStorage.setItem('thelastexit_settings_return', window.location.href); } catch (e) {}
    }
    showPageTransition(url.href);
  });
}

function initSettingsPage() {
  var settings = getGameSettings();
  var sound = document.getElementById('setting-sound-enabled');
  var effects = document.getElementById('setting-effects-volume');
  var ambient = document.getElementById('setting-ambient-volume');
  var transitions = document.getElementById('setting-transitions');
  var shake = document.getElementById('setting-shake');
  var motion = document.getElementById('setting-motion');
  if (!sound) return;

  function render() {
    var s = getGameSettings();
    sound.checked = s.soundEnabled && safeGet('thelastexit_muted') !== '1';
    effects.value = s.effectsVolume;
    ambient.value = s.ambientVolume;
    transitions.checked = s.transitions;
    shake.checked = s.screenShake;
    motion.value = s.motion;
    document.getElementById('effects-volume-value').textContent = s.effectsVolume + '%';
    document.getElementById('ambient-volume-value').textContent = s.ambientVolume + '%';
  }
  function changed(key, value) {
    updateGameSetting(key, value);
    document.getElementById('settings-feedback').textContent = '✓ Settings saved automatically.';
    playGameTone('clue');
  }

  sound.addEventListener('change', function () {
    safeSet('thelastexit_muted', sound.checked ? '0' : '1');
    changed('soundEnabled', sound.checked);
  });
  effects.addEventListener('input', function () {
    document.getElementById('effects-volume-value').textContent = effects.value + '%';
    changed('effectsVolume', Number(effects.value));
  });
  ambient.addEventListener('input', function () {
    document.getElementById('ambient-volume-value').textContent = ambient.value + '%';
    changed('ambientVolume', Number(ambient.value));
  });
  transitions.addEventListener('change', function () { changed('transitions', transitions.checked); });
  shake.addEventListener('change', function () { changed('screenShake', shake.checked); });
  motion.addEventListener('change', function () { changed('motion', motion.value); });

  var closeButton = document.getElementById('close-settings');
  if (closeButton) {
    closeButton.addEventListener('click', function () {
      var returnUrl = null;
      try {
        returnUrl = window.sessionStorage.getItem('thelastexit_settings_return');
        window.sessionStorage.removeItem('thelastexit_settings_return');
      } catch (e) {}
      if (returnUrl) {
        try {
          var parsedReturn = new URL(returnUrl, window.location.href);
          if (parsedReturn.origin === window.location.origin) {
            window.location.href = parsedReturn.href;
            return;
          }
        } catch (e) {}
      }
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = 'index.html';
      }
    });
  }

  document.getElementById('reset-settings').addEventListener('click', function () {
    saveGameSettings(Object.assign({}, DEFAULT_GAME_SETTINGS));
    render();
    document.getElementById('settings-feedback').textContent = 'Default settings restored.';
    playGameTone('unlock');
  });
  render();
  applyMotionSettings();
}

document.addEventListener('DOMContentLoaded', function () {
  applyMotionSettings();
  initPageTransitions();
  if (document.body.getAttribute('data-page') === 'settings') initSettingsPage();
});