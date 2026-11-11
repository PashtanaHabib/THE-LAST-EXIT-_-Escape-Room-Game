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