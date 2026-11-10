// 1. Load Required Modules and Room Data
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'js/puzzles.js'), 'utf8'), ctx);
const ROOMS = vm.runInContext('ROOMS', ctx);
// 2. Configure Image Dimensions and SVG Definitions

const W = 1600, H = 900;
const px = (pct, total) => (pct / 100) * total;

/* deterministic pseudo random */
function rng(seed) { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

/* ---------------- shared defs ---------------- */
const DEFS = `
<defs>
  <linearGradient id="screen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14524c"/><stop offset="1" stop-color="#082422"/></linearGradient>
  <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a3322"/><stop offset="1" stop-color="#2a1b11"/></linearGradient>
  <linearGradient id="steel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#46525e"/><stop offset="1" stop-color="#232b34"/></linearGradient>
  <linearGradient id="brass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e9cf93"/><stop offset="1" stop-color="#9a7a3c"/></linearGradient>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1330"/><stop offset="1" stop-color="#27335f"/></linearGradient>
  <radialGradient id="vig" cx="0.5" cy="0.48" r="0.78"><stop offset="0.5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.88"/></radialGradient>
  <radialGradient id="warm" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ffb366" stop-opacity="0.55"/><stop offset="1" stop-color="#ffb366" stop-opacity="0"/></radialGradient>
  <radialGradient id="cyan" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#6fe3ff" stop-opacity="0.38"/><stop offset="1" stop-color="#6fe3ff" stop-opacity="0"/></radialGradient>
  <radialGradient id="redglow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ff4a2a" stop-opacity="0.45"/><stop offset="1" stop-color="#ff4a2a" stop-opacity="0"/></radialGradient>
  <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfe4ff" stop-opacity="0.22"/><stop offset="1" stop-color="#cfe4ff" stop-opacity="0"/></linearGradient>
  <filter id="shadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="8" stdDeviation="7" flood-color="#000" flood-opacity="0.65"/></filter>
  <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="4"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="table" tableValues="0 0.10"/></feComponentTransfer></filter>
</defs>`;