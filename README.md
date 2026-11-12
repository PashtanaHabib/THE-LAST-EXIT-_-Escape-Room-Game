
# 🎮 THE LAST EXIT
### Four Rooms. One Escape. No Second Chance.

A cinematic browser-based escape-room adventure built with **HTML5, CSS3, and Vanilla JavaScript**.

Four mysterious rooms. Twelve challenging puzzles. Twenty minutes to escape.

Explore hidden objects, collect clues, solve puzzles, unlock new rooms, and discover the secrets behind the final exit.

> Can you escape before time runs out?

---

## 🌐 Live Demo

🚀 **Play Now:** [THE LAST EXIT - Live Demo]([https://YOUR-USERNAME.github.io/THE-LAST-EXIT/](https://pashtanahabib.github.io/THE-LAST-EXIT-_-Escape-Room-Game/))

---

## 📖 About The Game

THE LAST EXIT is an interactive escape-room game where players must explore four different environments and solve twelve puzzles to escape.

The game combines logical challenges, hidden clues, interactive objects, inventory management, a countdown timer, and a cinematic atmosphere.

Every decision matters. Wrong answers and hints affect your score, while every solved puzzle brings you closer to freedom.

### 🎯 Game Overview

| Feature | Details |
|---|---|
| Rooms | 4 |
| Puzzles | 12 |
| Puzzles per Room | 3 |
| Time Limit | 20 Minutes |
| Starting Score | 1000 Points |
| Leaderboard | Top 5 Records |
| Save System | LocalStorage |
| Platform | Web Browser |

---

## 🏚️ Explore The Four Rooms

### 01. The Office
Investigate the office, discover hidden clues, unlock drawers, and find the first key.

### 02. The Library
Explore mysterious books, decode secret messages, and uncover an important word.

### 03. The Laboratory
Solve mathematical sequences, arrange reactor colors, and activate the laboratory system.

### 04. The Last Exit
Use the clues and items collected throughout your journey to unlock the final gate.

---

## ✨ Key Features

- 🧩 12 interactive puzzles across 4 rooms
- ⏳ 20-minute countdown timer
- 🏆 Dynamic scoring system
- 🎒 Interactive inventory system
- 💡 Puzzle hint system
- 🔐 Progressive room unlocking
- 🎵 Continuous cinematic adventure soundtrack
- 🔊 Interactive sound effects
- ⚙️ Customizable game settings
- 🎬 Cinematic page and room transitions
- 📳 Screen-shake effects
- 🎨 Adjustable animation intensity
- 📊 Top-5 leaderboard
- 💾 Automatic game progress saving
- 🔄 Continue and restart functionality
- 📱 Responsive design for different screen sizes

---

## 🛠️ Technologies Used

| Technology | Purpose |
|---|---|
| HTML5 | Website structure |
| CSS3 | Styling, layouts, animations, and responsive design |
| JavaScript (Vanilla JS) | Game logic and interactivity |
| LocalStorage | Saving game progress, settings, and records |
| SessionStorage | Temporary navigation data |
| HTML Audio API | Playing sound effects |
| Web Audio API | Generating cinematic audio and ambient soundtrack |
| Git & GitHub | Version control and collaboration |
| GitHub Pages | Project deployment |

---

## 💻 JavaScript Concepts Implemented

This project demonstrates practical JavaScript concepts through a complete interactive game.

### 1. JavaScript Fundamentals
- Variables: `var`
- Data Types: String, Number, Boolean, Array, Object, and Null
- Arithmetic Operators
- Comparison Operators
- Logical Operators
- Assignment Operators
- Conditional Statements: `if`, `else`
- Functions and Return Statements
- Scope and Shared State

### 2. Functions
- Function Declarations
- Function Parameters and Arguments
- Return Values
- Reusable Functions
- Callback Functions
- Event Handler Functions
- Modular JavaScript Functions

### 3. Arrays & Array Methods
Arrays are used to manage rooms, puzzles, inventory items, and leaderboard records.

Methods used include:
- `push()`
- `pop()`
- `splice()`
- `indexOf()`
- `includes()`
- `forEach()`
- `filter()`

### 4. Objects
- Object Literals
- Nested Objects
- Object Properties
- Object Methods
- Accessing and Updating Properties
- `Object.assign()`

### 5. DOM Manipulation
- `getElementById()`
- `querySelector()`
- `querySelectorAll()`
- `createElement()`
- `appendChild()`
- `removeChild()`
- `textContent`
- `innerHTML`
- `parentNode`
- `classList.add()`
- `classList.remove()`
- `classList.toggle()`
- Dynamic CSS Styling

### 6. JavaScript Events
- `addEventListener()`
- Click Events
- Input Events
- Change Events
- Submit Events
- Keyboard Events
- Pointer Events
- `DOMContentLoaded`
- Event Handling
- `preventDefault()`

### 7. Timers & Asynchronous Operations
- `setInterval()`
- `clearInterval()`
- `setTimeout()`
- `requestAnimationFrame()`

Used for countdowns, delayed effects, animations, and timed interactions.

### 8. Browser Storage
- `localStorage.getItem()`
- `localStorage.setItem()`
- `localStorage.removeItem()`
- `sessionStorage.getItem()`
- `sessionStorage.setItem()`
- `sessionStorage.removeItem()`
- `JSON.stringify()`
- `JSON.parse()`

Used to save game progress, player information, settings, and leaderboard records.

### 9. String & Number Methods
- `trim()`
- `toLowerCase()`
- `replace()`
- `Number()`
- `String()`
- Regular Expressions
- `Math.max()`
- `Math.min()`
- `Math.floor()`
- `Math.random()`

### 10. Date & Time
- `Date.now()`
- `Math.floor()` for time calculations
- Countdown calculations
- Time formatting
- Tracking elapsed time

### 11. Browser APIs & Audio
- `new Audio()`
- Audio Playback
- Audio Volume Control
- `AudioContext`
- Oscillator Nodes
- Gain Nodes
- Audio Filters
- `window.location`
- `window.history`
- `new URL()`

### 12. Error Handling
- `try...catch`
- Safe LocalStorage Operations
- Handling Invalid Saved Data
- Handling Audio Playback Errors
- Handling Browser Storage Restrictions

---

## 📂 Project Structure

```text
THE-LAST-EXIT/
│
├── index.html
├── instructions.html
├── settings.html
├── levels.html
├── game.html
├── result.html
│
├── css/
│   ├── style.css
│   ├── home.css
│   ├── game.css
│   ├── settings.css
│   └── responsive.css
│
├── js/
│   ├── main.js
│   ├── settings.js
│   ├── game.js
│   ├── puzzles.js
│   ├── timer.js
│   ├── inventory.js
│   ├── score.js
│   └── storage.js
│
├── assets/
│   ├── images/
│   │   ├── office.jpg
│   │   ├── library.jpg
│   │   ├── laboratory.jpg
│   │   └── final-room.jpg
│   │
│   └── sounds/
│       ├── click.mp3
│       ├── correct.mp3
│       ├── wrong.mp3
│       └── adventure-theme.wav
│
└── tools/
    └── generate-images.js
```

---

## ⚙️ How To Run The Project

### Option 1: Run Locally

1. Download or clone this repository.
2. Extract the project files.
3. Open the project folder in Visual Studio Code.
4. Open `index.html` in your browser.
5. Start playing!

**Recommended:** Use the Live Server extension in Visual Studio Code.

### Option 2: Play Online

Open the Live Demo link at the top of this README.

---

## 🎮 How To Play

1. Enter your player name.
2. Read the instructions.
3. Start a new game.
4. Explore the available rooms.
5. Investigate objects and discover hidden clues.
6. Collect useful items in your inventory.
7. Solve all three puzzles in each room.
8. Unlock the next room.
9. Reach the final exit before time runs out!

**Remember:** Wrong answers and hints reduce your score. Think carefully!

---

## 🏆 Scoring System

| Action | Points |
|---|---:|
| Starting Score | +1000 |
| Solving a Puzzle | +100 |
| Completing a Room | +150 |
| Escaping Successfully | +300 |
| Wrong Answer | -25 |
| Using a Hint | -50 |

Your score cannot fall below zero.

---

## 💾 Game Data & Storage

THE LAST EXIT uses browser storage instead of a backend database.

| Storage | Purpose |
|---|---|
| LocalStorage | Active game progress |
| LocalStorage | Player name |
| LocalStorage | Game settings |
| LocalStorage | Top-5 leaderboard |
| SessionStorage | Temporary settings navigation |

**Note:** Saved records belong to the browser and device where the game is played. They are not automatically shared between different devices.

Use the **Reset Leaderboard** option to clear saved leaderboard records in the current browser.

---

## 👥 Team Collaboration

THE LAST EXIT was developed as a collaborative front-end development project.

Git and GitHub were used for version control and team collaboration.

### Collaboration Workflow
- Each team member works on a separate Git branch.
- Every member is responsible for assigned files.
- Features are tested before merging.
- The `main` branch contains the integrated project.

---

## 🎓 Project Objectives

The main objective of this project is to apply front-end development knowledge in a practical and interactive application.

Throughout the development process, we practiced:

- Building multi-page websites.
- Writing modular JavaScript.
- Manipulating the DOM.
- Handling events and user interactions.
- Working with arrays and objects.
- Managing game state.
- Saving data with browser storage.
- Creating timers and animations.
- Using browser audio APIs.
- Collaborating through Git and GitHub.

---

## 🔮 Future Improvements

- Online multiplayer mode.
- Backend-powered accounts.
- Global leaderboard.
- More rooms and advanced puzzles.
- Additional game environments.
- More soundtracks and visual effects.

---

## ❤️ Acknowledgements

Thank you for playing **THE LAST EXIT**.

Every clue has a purpose. Every second matters.

