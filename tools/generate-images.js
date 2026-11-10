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
// 3. Create Basic Room Object Illustrations

/* ---------------- object art (local coords: 0..w, 0..h) ---------------- */
const A = {};

A.door = (w, h, o = {}) => {
  const base = o.base || '#3a281c', trim = o.trim || '#0a0d12';
  return `<rect x="-8" y="-8" width="${w + 16}" height="${h + 8}" fill="${trim}"/>
  <rect width="${w}" height="${h}" fill="${base}" stroke="#000" stroke-width="2"/>
  <rect x="${w * .12}" y="${h * .07}" width="${w * .76}" height="${h * .38}" fill="rgba(0,0,0,.18)" stroke="rgba(0,0,0,.55)" stroke-width="3"/>
  <rect x="${w * .12}" y="${h * .52}" width="${w * .76}" height="${h * .4}" fill="rgba(0,0,0,.18)" stroke="rgba(0,0,0,.55)" stroke-width="3"/>
  ${o.window ? `<rect x="${w * .25}" y="${h * .12}" width="${w * .5}" height="${h * .25}" fill="#0e2a33" stroke="#889" stroke-width="3"/><rect x="${w * .25}" y="${h * .12}" width="${w * .5}" height="${h * .25}" fill="url(#beam)"/>` : ''}
  <circle cx="${w * .84}" cy="${h * .55}" r="8" fill="url(#brass)"/>
  <circle cx="${w * .84}" cy="${h * .46}" r="5" fill="#c0392b"/><circle cx="${w * .84}" cy="${h * .46}" r="12" fill="url(#redglow)"/>
  <rect x="${w * .78}" y="${h * .6}" width="${w * .12}" height="${h * .04}" rx="2" fill="#111"/>`;
};

A.computer = (w, h) => {
  const mh = h * .72;
  let keys = '';
  for (let r = 0; r < 3; r++) for (let c = 0; c < 12; c++) keys += `<rect x="${w * .13 + c * w * .062}" y="${h * .89 + r * h * .03}" width="${w * .05}" height="${h * .022}" rx="2" fill="#2d3947"/>`;
  return `<rect x="${w * .08}" y="0" width="${w * .84}" height="${mh}" rx="8" fill="#10151b" stroke="#34404d" stroke-width="3"/>
  <rect x="${w * .12}" y="${mh * .07}" width="${w * .76}" height="${mh * .84}" rx="3" fill="url(#screen)"/>
  <text x="${w * .5}" y="${mh * .3}" text-anchor="middle" font-family="monospace" font-size="${h * .055}" fill="#8af0d0">SYSTEM LOGIN</text>
  <rect x="${w * .2}" y="${mh * .42}" width="${w * .6}" height="${mh * .17}" fill="rgba(0,0,0,.4)" stroke="#8af0d0" stroke-width="1.5"/>
  <text x="${w * .23}" y="${mh * .545}" font-family="monospace" font-size="${h * .05}" fill="#8af0d0">PASSWORD: _</text>
  <text x="${w * .5}" y="${mh * .8}" text-anchor="middle" font-family="monospace" font-size="${h * .038}" fill="#4d9c88">user: E.VOSS</text>
  <rect x="${w * .43}" y="${mh}" width="${w * .14}" height="${h * .1}" fill="#1a212a"/>
  <rect x="${w * .3}" y="${mh + h * .08}" width="${w * .4}" height="${h * .03}" rx="3" fill="#1a212a"/>
  <rect x="${w * .09}" y="${h * .87}" width="${w * .82}" height="${h * .12}" rx="5" fill="#18202a" stroke="#2c3744" stroke-width="2"/>${keys}`;
};

A.sticky = (w, h) => `<g transform="rotate(-5 ${w / 2} ${h / 2})"><rect width="${w}" height="${h}" fill="#f0d95a" stroke="#b9a232" stroke-width="1.5"/>
  <path d="M${w * .15} ${h * .3}h${w * .7}M${w * .15} ${h * .5}h${w * .6}M${w * .15} ${h * .7}h${w * .45}" stroke="#7a6a1b" stroke-width="2"/></g>`;

A.photo = (w, h) => `<rect width="${w}" height="${h}" rx="3" fill="#6b4a2b" stroke="#2b1b0e" stroke-width="3"/>
  <rect x="${w * .1}" y="${h * .08}" width="${w * .8}" height="${h * .84}" fill="#8fb4c9"/>
  <rect x="${w * .1}" y="${h * .62}" width="${w * .8}" height="${h * .3}" fill="#6c8f4c"/>
  <ellipse cx="${w * .5}" cy="${h * .66}" rx="${w * .26}" ry="${h * .13}" fill="#c58a3a"/>
  <circle cx="${w * .66}" cy="${h * .5}" r="${w * .15}" fill="#d49a48"/>
  <ellipse cx="${w * .76}" cy="${h * .46}" rx="${w * .06}" ry="${h * .08}" fill="#8a5a1f" transform="rotate(20 ${w * .76} ${h * .46})"/>
  <circle cx="${w * .7}" cy="${h * .5}" r="${w * .02}" fill="#111"/><circle cx="${w * .8}" cy="${h * .53}" r="${w * .025}" fill="#111"/>
  <circle cx="${w * .6}" cy="${h * .63}" r="${w * .035}" fill="url(#brass)"/>
  <rect x="${w * .3}" y="${h * .75}" width="${w * .05}" height="${h * .12}" fill="#c58a3a"/><rect x="${w * .55}" y="${h * .75}" width="${w * .05}" height="${h * .12}" fill="#c58a3a"/>`;

A.calendar = (w, h) => {
  let cells = '';
  for (let d = 1; d <= 30; d++) {
    const i = d - 1, c = i % 7, r = Math.floor(i / 7);
    const cx = w * .1 + c * (w * .8 / 7) + 6, cy = h * .4 + r * (h * .1);
    cells += `<text x="${cx}" y="${cy}" text-anchor="middle" font-family="sans-serif" font-size="${w * .09}" fill="#333">${d}</text>`;
    if (d === 7) cells += `<circle cx="${cx}" cy="${cy - 4}" r="${w * .08}" fill="none" stroke="#d11" stroke-width="2.5"/>`;
  }
  return `<rect width="${w}" height="${h}" fill="#e9e3d3" stroke="#555" stroke-width="2"/>
  <rect width="${w}" height="${h * .2}" fill="#9d2b22"/>
  <text x="${w / 2}" y="${h * .14}" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="${w * .13}" fill="#fff">NOVEMBER</text>${cells}
  <circle cx="${w / 2}" cy="-4" r="4" fill="#222"/>`;
};

A.drawer = (w, h) => `<rect width="${w}" height="${h}" rx="4" fill="url(#wood)" stroke="#120a05" stroke-width="3"/>
  <rect x="${w * .06}" y="${h * .12}" width="${w * .88}" height="${h * .76}" rx="3" fill="none" stroke="rgba(0,0,0,.5)" stroke-width="2"/>
  <rect x="${w * .36}" y="${h * .44}" width="${w * .28}" height="${h * .12}" rx="5" fill="url(#brass)"/>
  <rect x="${w * .74}" y="${h * .2}" width="${w * .2}" height="${h * .3}" rx="3" fill="#0b0f14" stroke="#445" stroke-width="1.5"/>
  ${[0, 1, 2, 3].map(i => `<circle cx="${w * .775 + i * w * .045}" cy="${h * .35}" r="3" fill="#c0392b"/>`).join('')}`;

A.lockbox = (w, h) => `<rect y="${h * .15}" width="${w}" height="${h * .85}" rx="4" fill="url(#steel)" stroke="#0e1319" stroke-width="3"/>
  <rect y="${h * .15}" width="${w}" height="${h * .3}" rx="4" fill="#56626f" stroke="#0e1319" stroke-width="3"/>
  <rect x="${w * .42}" y="${h * .38}" width="${w * .16}" height="${h * .22}" rx="3" fill="url(#brass)"/>
  <circle cx="${w / 2}" cy="${h * .7}" r="${w * .06}" fill="#0b0f14"/>`;
 // 4. Create Library Room Object Illustrations

/* ---- library ---- */
A.bookshelf = (w, h) => {
  const r = rng(11);
  const cols = ['#7a2e2e', '#2e4a7a', '#2f6b4a', '#7a5a2e', '#5a2e7a', '#8a7a4a', '#3a3a4a', '#9a4a2a'];
  let out = `<rect width="${w}" height="${h}" fill="#241710" stroke="#0e0905" stroke-width="4"/>`;
  const rows = 3, rh = h / rows;
  for (let row = 0; row < rows; row++) {
    let x = 10;
    while (x < w - 16) {
      const bw = 12 + r() * 14, bh = rh * (.62 + r() * .3), c = cols[Math.floor(r() * cols.length)];
      out += `<rect x="${x}" y="${row * rh + rh - 8 - bh}" width="${bw}" height="${bh}" fill="${c}" stroke="rgba(0,0,0,.6)" stroke-width="1.5"/>
      <rect x="${x + 2}" y="${row * rh + rh - 8 - bh + 8}" width="${bw - 4}" height="3" fill="rgba(214,180,119,.55)"/>`;
      x += bw + 1;
    }
    out += `<rect x="0" y="${row * rh + rh - 8}" width="${w}" height="8" fill="#3a271a"/>`;
  }
  return out;
};
A.plaque = (w, h) => `<rect width="${w}" height="${h}" rx="5" fill="url(#brass)" stroke="#4a3a15" stroke-width="3"/>
  <text x="${w / 2}" y="${h * .42}" text-anchor="middle" font-family="serif" font-weight="bold" font-size="${w * .12}" fill="#3a2c0e">SEEK THE</text>
  <text x="${w / 2}" y="${h * .68}" text-anchor="middle" font-family="serif" font-weight="bold" font-size="${w * .12}" fill="#3a2c0e">OLDEST TALE</text>`;
A.globe = (w, h) => `<ellipse cx="${w / 2}" cy="${h * .96}" rx="${w * .34}" ry="${h * .04}" fill="#2a1b11"/>
  <rect x="${w * .46}" y="${h * .6}" width="${w * .08}" height="${h * .36}" fill="#5a4026"/>
  <circle cx="${w / 2}" cy="${h * .36}" r="${w * .42}" fill="#1f4a66" stroke="#b89a5a" stroke-width="4"/>
  <path d="M${w * .2} ${h * .3}q${w * .1}-${h * .1} ${w * .2} 0t${w * .15} ${h * .06}q-${w * .05} ${h * .1}-${w * .18} ${h * .08}t-${w * .17}-${h * .14}zM${w * .55} ${h * .4}q${w * .1}-${h * .05} ${w * .15} ${h * .02}t-${w * .03} ${h * .1}t-${w * .12}-${h * .12}z" fill="#6f8f4a"/>
  <ellipse cx="${w / 2}" cy="${h * .36}" rx="${w * .16}" ry="${w * .42}" fill="none" stroke="rgba(214,180,119,.5)" stroke-width="2"/>`;
A.tablet = (w, h) => `<rect width="${w}" height="${h}" rx="6" fill="#59595f" stroke="#2c2c30" stroke-width="3"/>
  ${['◉', '★', '☀', '☾'].map((s, i) => `<rect x="${w * .07 + i * w * .23}" y="${h * .18}" width="${w * .19}" height="${h * .64}" rx="4" fill="#3b3b40" stroke="#222" stroke-width="2"/>
  <text x="${w * .165 + i * w * .23}" y="${h * .66}" text-anchor="middle" font-family="sans-serif" font-size="${h * .5}" fill="#8e8e96">${s}</text>`).join('')}`;
A.painting = (w, h) => `<rect width="${w}" height="${h}" fill="url(#brass)" stroke="#3a2a0e" stroke-width="3"/>
  <rect x="${w * .07}" y="${h * .05}" width="${w * .86}" height="${h * .9}" fill="url(#sky)"/>
  ${[[.2, .15], [.7, .2], [.45, .3], [.8, .45], [.25, .5], [.6, .12]].map(p => `<circle cx="${w * p[0]}" cy="${h * p[1]}" r="2.4" fill="#fff"/>`).join('')}
  <path d="M${w * .28} ${h * .26}a${w * .1} ${w * .1} 0 1 0 ${w * .1} ${h * .13}a${w * .08} ${w * .08} 0 1 1-${w * .1}-${h * .13}z" fill="#e8dfa8"/>
  <ellipse cx="${w * .5}" cy="${h * .7}" rx="${w * .3}" ry="${h * .1}" fill="#e8e8f0"/><circle cx="${w * .5}" cy="${h * .7}" r="${h * .075}" fill="#3a6aa8"/><circle cx="${w * .5}" cy="${h * .7}" r="${h * .035}" fill="#000"/>`;
A.lamp = (w, h) => `<polygon points="${w * .12},${h * .42} ${w * .88},${h * .42} ${w * .68},${h * .08} ${w * .32},${h * .08}" fill="#d9a85a" stroke="#6a4a1a" stroke-width="3"/>
  <rect x="${w * .46}" y="${h * .42}" width="${w * .08}" height="${h * .46}" fill="#6a4a1a"/>
  <ellipse cx="${w / 2}" cy="${h * .92}" rx="${w * .3}" ry="${h * .06}" fill="#4a3216"/>`;
A.safe = (w, h) => `<rect width="${w}" height="${h}" rx="5" fill="url(#steel)" stroke="#0d1218" stroke-width="4"/>
  <rect x="${w * .12}" y="${h * .08}" width="${w * .76}" height="${h * .16}" fill="#120808" stroke="#444" stroke-width="2"/>
  <text x="${w / 2}" y="${h * .2}" text-anchor="middle" font-family="monospace" font-size="${h * .1}" fill="#ff4a3a">● ● ● ● ● ●</text>
  <circle cx="${w * .5}" cy="${h * .58}" r="${w * .26}" fill="#2c3641" stroke="#98a" stroke-width="3"/>
  <circle cx="${w * .5}" cy="${h * .58}" r="${w * .06}" fill="url(#brass)"/>
  <path d="M${w * .5} ${h * .36}v${h * .1}" stroke="#d6b477" stroke-width="4"/>
  <rect x="${w * .8}" y="${h * .5}" width="${w * .08}" height="${h * .2}" rx="3" fill="url(#brass)"/>`;
   