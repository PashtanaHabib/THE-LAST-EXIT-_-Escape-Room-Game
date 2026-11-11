// storage.js — save / load the game with LocalStorage

//    Public API:
//      saveGame()            save the global gameState
//      loadGame()            load it back (returns state or null)
//      newGame(name)         create + save a fresh game
//      hasSavedGame()        true if a game in progress exists
//      clearGame()           delete the saved game
//      saveRecord()          add the finished (won) game to the records
    //  getRecords()          top 5 records (best first)

    var STORAGE_KEY = 'thelastexit_save_v1';
var RECORDS_KEY = 'thelastexit_records_v1';
var NAME_KEY = 'thelastexit_lastname';
var TOTAL_TIME = 20 * 60;          // 20 minutes, in seconds

var gameState = null;              // the one and only game state

function safeGet(key) {
  try { return window.localStorage.getItem(key); } catch (e) { return null; }
}
function safeSet(key, value) {
  try { window.localStorage.setItem(key, value); return true; } catch (e) { return false; }
}
function safeRemove(key) {
  try { window.localStorage.removeItem(key); } catch (e) { /* ignore */ }
}

function createNewState(name) {
  return {
    version: 1,
    playerName: name,
    score: SCORE_RULES.start,
    timeLeft: TOTAL_TIME,          // remaining time is saved across refreshes
    lastTickAt: Date.now(),        // timestamp used to count time while the page is closed
    status: 'playing',             // 'playing' | 'won' | 'lost'
    currentRoom: 1,
    unlockedRooms: [1],
    completedRooms: [],
    solvedPuzzles: [],
    hintsUsed: [],
    inventory: [],
    viewed: [],
    introSeen: [],
    wrongAnswers: 0,
    startedAt: Date.now()
  };
}

function saveGame() {
  if (!gameState) return false;
  return safeSet(STORAGE_KEY, JSON.stringify(gameState));
}

function loadGame() {
  var raw = safeGet(STORAGE_KEY);
  if (!raw) { gameState = null; return null; }
  try {
    var s = JSON.parse(raw);
    if (!s || typeof s !== 'object' || !s.playerName) { gameState = null; return null; }
    gameState = s;
    return gameState;
  } catch (e) {
    gameState = null;
    return null;
  }
}

function newGame(name) {
  gameState = createNewState(name);
  safeSet(NAME_KEY, name);
  saveGame();
  return gameState;
}

function hasSavedGame() {
  var s = loadGame();
  return !!(s && s.status === 'playing');
}

function clearGame() {
  safeRemove(STORAGE_KEY);
  gameState = null;
}

function getLastName() { return safeGet(NAME_KEY) || ''; }

/* ---------- Records (best scores, kept in this browser) ---------- */
function getRecords() {
  var raw = safeGet(RECORDS_KEY);
  if (!raw) return [];
  try {
    var list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (e) { return []; }
}

function saveRecord() {
  if (!gameState) return;
  var list = getRecords();
  list.push({
    name: gameState.playerName,
    score: gameState.score,
    timeLeft: gameState.timeLeft,
    date: new Date().toISOString().slice(0, 10)
  });
  list.sort(function (a, b) { return b.score - a.score || b.timeLeft - a.timeLeft; });
  safeSet(RECORDS_KEY, JSON.stringify(list.slice(0, 5)));
}

function clearRecords() {
  safeRemove(RECORDS_KEY);
  return true;
}

function getBestRecord() {
  var list = getRecords();
  return list.length ? list[0] : null;
}
