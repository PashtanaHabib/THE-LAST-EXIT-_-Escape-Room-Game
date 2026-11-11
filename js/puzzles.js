// puzzles.js — game data (rooms, objects, items, puzzles)
// and answer checking.

// Public API (used by game.js):
// getRoom(id)            -> room object
// getPuzzle(id)          -> puzzle object
// getItemDef(id)         -> item definition
// checkAnswer(id, value) -> true / false

// Hotspot boxes are [x, y, width, height] in PERCENT of the
// room image (16:9). tools/generate-images.js reads the same
// data so the drawn objects always sit under the hotspots.

// Inventory item definitions
ar ITEMS = {
  sticky:    { id: 'sticky',    name: 'Sticky Note',     icon: '📝', desc: "Scribbled in Dr. Voss's handwriting: \"Never forget the password again! It is the name of my loyal friend. Look at the photo.\"" },
  photo:     { id: 'photo',     name: 'Dog Photo',       icon: '🖼️', desc: 'A framed photo of a golden dog. The collar tag reads: R-E-X.' },
  calendar:  { id: 'calendar',  name: 'Calendar Page',   icon: '📅', desc: 'NOVEMBER. The 7th is circled in red with a single word beside it: "LEAVE".' },
  email:     { id: 'email',     name: 'Email',           icon: '✉️', desc: 'From E. Voss — "The drawer opens with the date I plan to leave this place. Day first, then month. Four digits. The calendar remembers."' },
  riddle:    { id: 'riddle',    name: 'Riddle Note',     icon: '📜', desc: '"I have keys but open no locks. I have space but no room. You can enter, but never go outside. What am I?"' },
  key:       { id: 'key',       name: 'Brass Key',       icon: '🗝️', desc: 'A heavy brass key with a tag: "OFFICE — EXIT". It fits the office door.' },
  frag1:     { id: 'frag1',     name: 'Gate Fragment 1', icon: '🔢', desc: 'A torn page from the Office. It shows one large digit: 7.  (Fragment 1 of 3 for the final gate.)' },

  plaque:    { id: 'plaque',    name: 'Brass Plaque',    icon: '🏷️', desc: '"SEEK THE OLDEST TALE. Only one book on this shelf was written before the year 1800."' },
  lampnote:  { id: 'lampnote',  name: 'Lamp Engraving',  icon: '💡', desc: 'Etched on the lamp shade: "First the SUN. Then the MOON."' },
  paintnote: { id: 'paintnote', name: 'Painting Caption',icon: '🌌', desc: 'Below the night-sky painting: "The STAR watches. The EYE closes the sky."' },
  globenote: { id: 'globenote', name: 'Globe Notches',   icon: '🌍', desc: 'Three notches are carved into the globe stand, each pointing backward. Beneath: "Move every letter back three steps."' },
  bookpage:  { id: 'bookpage',  name: 'Loose Book Page', icon: '📖', desc: 'A page from "The Glass Garden". Four symbols are drawn on it: ☀  ☾  ★  ◉. Under them: "Arrange the sky as it is revealed."' },
  cipher:    { id: 'cipher',    name: 'Encrypted Note',  icon: '🔐', desc: 'A note found inside the tablet: "HARGXV". It looks like a Caesar cipher.' },
  secretword:{ id: 'secretword',name: 'Secret Word',     icon: '🗣️', desc: 'The decoded message of the Library: EXODUS.' },
  frag2:     { id: 'frag2',     name: 'Gate Fragment 2', icon: '🔢', desc: 'A page from the hidden safe with one large digit: 3.  (Fragment 2 of 3 for the final gate.)' },

  chalknote: { id: 'chalknote', name: 'Lab Rule 1',      icon: '🧪', desc: 'Reactor log: "RULE 1 — RED always goes first."' },
  flasknote: { id: 'flasknote', name: 'Lab Rule 2',      icon: '⚗️', desc: 'Label on the flask rack: "RULE 2 — BLUE comes immediately after YELLOW."' },
  postnote:  { id: 'postnote',  name: 'Lab Rule 3',      icon: '⚠️', desc: 'Safety poster: "RULE 3 — GREEN is never the last."' },
  reactorseq:{ id: 'reactorseq',name: 'Reactor Sequence',icon: '🎨', desc: 'The reactor accepted this order:  RED → GREEN → YELLOW → BLUE.' },
  frag3:     { id: 'frag3',     name: 'Gate Fragment 3', icon: '🔢', desc: 'The activation ticket printed by the machine shows one large digit: 9.  (Fragment 3 of 3 for the final gate.)' },

  wallposter:{ id: 'wallposter',name: 'Torn Poster',     icon: '📰', desc: 'A torn poster: "To enter the terminal, speak the word the Library hid."' },
  warnsign:  { id: 'warnsign',  name: 'Warning Sign',    icon: '🚧', desc: 'WARNING: "Breakers must be switched in REVERSE order of the reactor sequence."' },
  wallnote:  { id: 'wallnote',  name: 'Scratched Note',  icon: '🗒️', desc: 'Scratched into the wall: "Three digits. One from each room. In the order you walked."' }
};

/* ---------- The 12 puzzles ---------- */
var PUZZLES = {
  /* ===== ROOM 1 — OFFICE ===== */
  p1: {
    id: 'p1', room: 1, title: 'Computer Password', type: 'text', icon: '🖥️',
    prompt: 'The computer is locked. A blinking cursor waits for a password.',
    placeholder: 'PASSWORD', answers: ['rex'],
    hint: 'Read the sticky note, then look closely at the photo on the desk.',
    success: 'ACCESS GRANTED. A new email appears on the screen.',
    reward: ['email']
  },
  p2: {
    id: 'p2', room: 1, title: 'Locked Drawer', type: 'text', icon: '🔒', digits: 4,
    prompt: 'The desk drawer has a 4-digit keypad.',
    placeholder: '0000', answers: ['0711'],
    hint: 'The email says: day first, then month. The calendar has a circled date.',
    success: 'Click! The drawer slides open. Inside you find a riddle note.',
    reward: ['riddle']
  },
  p3: {
    id: 'p3', room: 1, title: 'The Lockbox', type: 'text', icon: '📦',
    prompt: 'The lockbox opens with a single word. Read the riddle:\n\n"I have keys but open no locks. I have space but no room. You can enter, but never go outside. What am I?"',
    placeholder: 'ONE WORD', answers: ['keyboard', 'akeyboard'],
    hint: 'You are probably touching one right now when you type.',
    success: 'The lockbox opens. Inside: a brass key and a torn page with the number 7.',
    reward: ['key', 'frag1']
  },

  /* ===== ROOM 2 — LIBRARY ===== */
  p4: {
    id: 'p4', room: 2, title: 'The Oldest Tale', type: 'choice', icon: '📚',
    prompt: 'Five books glow on the shelf. The plaque says: "Seek the oldest tale." Which book do you pull out?',
    options: [
      { id: 'silent', label: 'The Silent Stars — 1921' },
      { id: 'iron',   label: 'Echoes of Iron — 1887' },
      { id: 'vienna', label: 'Shadows of Vienna — 1954' },
      { id: 'glass',  label: 'The Glass Garden — 1799' },
      { id: 'algebra',label: 'Midnight Algebra — 1963' }
    ],
    answer: 'glass',
    hint: 'Compare the years printed next to each title. Pick the smallest number.',
    success: 'A loose page slips out of the book. Symbols are drawn on it.',
    reward: ['bookpage']
  },
  p5: {
    id: 'p5', room: 2, title: 'Order of the Sky', type: 'sequence', icon: '☀️', unique: true,
    prompt: 'Press the four stone symbols in the correct order. The lamp and the painting each tell part of the order.',
    options: [
      { id: 'eye',  label: '◉', name: 'Eye' },
      { id: 'star', label: '★', name: 'Star' },
      { id: 'sun',  label: '☀', name: 'Sun' },
      { id: 'moon', label: '☾', name: 'Moon' }
    ],
    answer: ['sun', 'moon', 'star', 'eye'],
    hint: 'Sun, Moon, then the Star, and the Eye is always last.',
    success: 'The tablet clicks. A hidden compartment opens with an encrypted note.',
    reward: ['cipher']
  },
  p6: {
    id: 'p6', room: 2, title: 'The Hidden Message', type: 'text', icon: '🔐',
    prompt: 'The wall safe displays a word that must be decoded:\n\nH A R G X V\n\nEnter the real word.',
    placeholder: 'DECODED WORD', answers: ['exodus'],
    hint: 'Caesar cipher. Move each letter BACK 3 steps in the alphabet: H becomes E.',
    success: 'The safe opens! You take the secret word and a page with the number 3.',
    reward: ['secretword', 'frag2']
  },

  /* ===== ROOM 3 — LABORATORY ===== */
  p7: {
    id: 'p7', room: 3, title: 'Number Sequence', type: 'text', icon: '🔢',
    prompt: 'The chalkboard shows a sequence:\n\n2 — 6 — 12 — 20 — 30 — ?\n\nEnter the next number to power up the console.',
    placeholder: 'NUMBER', answers: ['42'],
    hint: 'Look at the differences: 4, 6, 8, 10 ... what comes next?',
    success: 'Correct! The color console powers on.',
    reward: []
  },
  p8: {
    id: 'p8', room: 3, title: 'Reactor Colors', type: 'sequence', icon: '🎨', unique: true,
    prompt: 'Press the four colors in the correct order. Three rules are posted around the laboratory (monitor, flask rack and poster).',
    options: [
      { id: 'red',    label: '', name: 'Red',    color: '#d93a3a' },
      { id: 'green',  label: '', name: 'Green',  color: '#2fae5b' },
      { id: 'blue',   label: '', name: 'Blue',   color: '#2e7bd6' },
      { id: 'yellow', label: '', name: 'Yellow', color: '#e6c229' }
    ],
    answer: ['red', 'green', 'yellow', 'blue'],
    hint: 'Red is first. Yellow and Blue are glued together (Yellow, then Blue). Green cannot be last.',
    success: 'The reactor hums. The accepted order is saved to your inventory.',
    reward: ['reactorseq']
  },
  p9: {
    id: 'p9', room: 3, title: 'Activate the Machine', type: 'toggles', icon: '⚡',
    prompt: 'Set the four power switches (A, B, C, D) using these rules:\n\n1. A and C are always in the same state.\n2. B is the opposite of A.\n3. D can be ON only if A is OFF.\n4. Exactly two switches are ON.\n5. A is OFF.',
    switches: ['A', 'B', 'C', 'D'], answer: '0101',
    hint: 'A is OFF, so C is OFF and B is ON. You need exactly two ON switches, so what about D?',
    success: 'The machine roars to life and prints an activation ticket with the number 9.',
    reward: ['frag3']
  },

  /* ===== ROOM 4 — THE LAST EXIT ===== */
  p10: {
    id: 'p10', room: 4, title: 'Terminal Password', type: 'text', icon: '💻',
    prompt: 'TERMINAL LOCKED.\nSpeak the word the Library hid.',
    placeholder: 'SECRET WORD', answers: ['exodus'],
    hint: 'Open your inventory and look for the Secret Word.',
    success: 'ACCESS GRANTED. The breaker panel unlocks.',
    reward: []
  },
  p11: {
    id: 'p11', room: 4, title: 'Breaker Panel', type: 'sequence', icon: '🔌', unique: true,
    prompt: 'Switch the four breakers in REVERSE order of the Reactor Sequence from the Laboratory.',
    options: [
      { id: 'red',    label: '', name: 'Red',    color: '#d93a3a' },
      { id: 'green',  label: '', name: 'Green',  color: '#2fae5b' },
      { id: 'blue',   label: '', name: 'Blue',   color: '#2e7bd6' },
      { id: 'yellow', label: '', name: 'Yellow', color: '#e6c229' }
    ],
    answer: ['blue', 'yellow', 'green', 'red'],
    hint: 'The Reactor Sequence was Red, Green, Yellow, Blue. Read it backwards.',
    success: 'Power floods the corridor. The exit gate lights up.',
    reward: []
  },
  p12: {
    id: 'p12', room: 4, title: 'The Final Gate', type: 'text', icon: '🚪', digits: 3, final: true,
    prompt: 'The gate asks for a 3-digit code. Three fragments from three rooms... in the order you walked.',
    placeholder: '000', answers: ['739'],
    hint: 'Open your inventory: Gate Fragment 1, 2 and 3 each hold one digit.',
    success: 'The gate grinds open. Cold night air rushes in. You are free.',
    reward: []
  }
};