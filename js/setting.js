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

  