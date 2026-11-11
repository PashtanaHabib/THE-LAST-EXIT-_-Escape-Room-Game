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