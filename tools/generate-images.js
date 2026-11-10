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
  <path d="M${w * .28} ${h * .26}a${w * .1} ${w * .1} 0 1 0 ${w * .1} ${w * .13}a${w * .08} ${w * .08} 0 1 1-${w * .1}-${h * .13}z" fill="#e8dfa8"/>
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
   // 5. Create Laboratory Room Object Illustrations

/* ---- laboratory ---- */
A.chalkboard = (w, h) => `<rect width="${w}" height="${h}" rx="4" fill="#6a4b2f" stroke="#2a1b0e" stroke-width="3"/>
  <rect x="${w * .03}" y="${h * .05}" width="${w * .94}" height="${h * .9}" fill="#1f3a32"/>
  <text x="${w * .5}" y="${h * .38}" text-anchor="middle" font-family="cursive, sans-serif" font-size="${h * .17}" fill="#e8f0e8">2   6   12   20   30   ?</text>
  <path d="M${w * .1} ${h * .6}l${w * .12}${h * .08}l${w * .1}-${h * .08}M${w * .55} ${h * .62}h${w * .3}" stroke="#bcd0c4" stroke-width="2.5" fill="none"/>
  <text x="${w * .12}" y="${h * .85}" font-family="cursive, sans-serif" font-size="${h * .09}" fill="#9fb8aa">+4  +6  +8  +10 ...</text>`;
A.labmonitor = (w, h) => `<rect width="${w}" height="${h}" rx="5" fill="#10151b" stroke="#3a4651" stroke-width="3"/>
  <rect x="${w * .07}" y="${h * .1}" width="${w * .86}" height="${h * .78}" fill="url(#screen)"/>
  <polyline points="${w * .1},${h * .7} ${w * .25},${h * .45} ${w * .4},${h * .6} ${w * .55},${h * .3} ${w * .7},${h * .5} ${w * .9},${h * .25}" fill="none" stroke="#8af0d0" stroke-width="3"/>
  <text x="${w * .1}" y="${h * .28}" font-family="monospace" font-size="${h * .1}" fill="#8af0d0">REACTOR LOG</text>`;
A.poster = (w, h) => `<rect width="${w}" height="${h}" fill="#e2dcc4" stroke="#555" stroke-width="2"/>
  <polygon points="${w / 2},${h * .08} ${w * .85},${h * .5} ${w * .15},${h * .5}" fill="#e6b41f" stroke="#111" stroke-width="4"/>
  <text x="${w / 2}" y="${h * .44}" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="${h * .3}" fill="#111">!</text>
  <path d="M${w * .15} ${h * .62}h${w * .7}M${w * .15} ${h * .74}h${w * .7}M${w * .15} ${h * .86}h${w * .45}" stroke="#444" stroke-width="3"/>`;
A.flasks = (w, h) => {
  const cols = ['#d93a3a', '#e6c229', '#2e7bd6', '#2fae5b'];
  return `<rect x="0" y="${h * .45}" width="${w}" height="8" fill="#3b4652"/><rect x="0" y="${h * .9}" width="${w}" height="8" fill="#3b4652"/>
  ${[0, 1, 2, 3].map(i => {
    const cx = w * (.14 + i * .24), c = cols[i];
    return `<polygon points="${cx - w * .05},${h * .1} ${cx + w * .05},${h * .1} ${cx + w * .12},${h * .44} ${cx - w * .12},${h * .44}" fill="rgba(200,230,255,.2)" stroke="#aac" stroke-width="2"/>
    <polygon points="${cx - w * .08},${h * .27} ${cx + w * .08},${h * .27} ${cx + w * .12},${h * .44} ${cx - w * .12},${h * .44}" fill="${c}" opacity=".9"/>
    <rect x="${cx - w * .08}" y="${h * .56}" width="${w * .16}" height="${h * .34}" rx="4" fill="rgba(200,230,255,.18)" stroke="#aac" stroke-width="2"/>
    <rect x="${cx - w * .08}" y="${h * .68}" width="${w * .16}" height="${h * .22}" fill="${cols[(i + 2) % 4]}" opacity=".85"/>`;
  }).join('')}`;
};
A.console = (w, h) => {
  const order = ['#2e7bd6', '#d93a3a', '#e6c229', '#2fae5b'];
  return `<polygon points="0,${h} ${w * .06},${h * .1} ${w * .94},${h * .1} ${w},${h}" fill="url(#steel)" stroke="#0e1319" stroke-width="3"/>
  <rect x="${w * .1}" y="${h * .2}" width="${w * .8}" height="${h * .22}" rx="3" fill="url(#screen)"/>
  <text x="${w / 2}" y="${h * .37}" text-anchor="middle" font-family="monospace" font-size="${h * .14}" fill="#8af0d0">POWER ● COLOR SEQ</text>
  ${order.map((c, i) => `<circle cx="${w * (.2 + i * .2)}" cy="${h * .68}" r="${h * .13}" fill="${c}" stroke="#111" stroke-width="3"/><circle cx="${w * (.2 + i * .2)}" cy="${h * .68}" r="${h * .24}" fill="${c}" opacity=".12"/>`).join('')}`;
};
A.machine = (w, h) => `<rect width="${w}" height="${h}" rx="8" fill="url(#steel)" stroke="#0d1218" stroke-width="4"/>
  <rect x="${w * .08}" y="${h * .06}" width="${w * .84}" height="${h * .26}" rx="4" fill="#0a1418" stroke="#566" stroke-width="3"/>
  <text x="${w / 2}" y="${h * .2}" text-anchor="middle" font-family="monospace" font-size="${h * .07}" fill="#d6b477">CENTRAL UNIT — OFFLINE</text>
  <circle cx="${w * .3}" cy="${h * .5}" r="${h * .1}" fill="#1b2630" stroke="#d6b477" stroke-width="3"/><circle cx="${w * .3}" cy="${h * .5}" r="${h * .04}" fill="#c65d32"/>
  <circle cx="${w * .7}" cy="${h * .5}" r="${h * .1}" fill="#1b2630" stroke="#d6b477" stroke-width="3"/><circle cx="${w * .7}" cy="${h * .5}" r="${h * .04}" fill="#c65d32"/>
  ${['A', 'B', 'C', 'D'].map((l, i) => `<rect x="${w * (.14 + i * .2)}" y="${h * .7}" width="${w * .1}" height="${h * .12}" rx="3" fill="#10151b" stroke="#667" stroke-width="2"/>
  <rect x="${w * (.165 + i * .2)}" y="${h * .72}" width="${w * .05}" height="${h * .06}" fill="#c65d32"/>
  <text x="${w * (.19 + i * .2)}" y="${h * .9}" text-anchor="middle" font-family="monospace" font-size="${h * .055}" fill="#aab">${l}</text>`).join('')}
  <rect x="${w * .9}" y="${h * .4}" width="${w * .06}" height="${h * .45}" fill="#2a3540"/>`;
  // 6. Create Final Room Object Illustrations

/* ---- final room ---- */
A.wallposter = (w, h) => `<polygon points="0,${h * .05} ${w * .9},0 ${w},${h * .92} ${w * .1},${h}" fill="#cfc7ae" stroke="#555" stroke-width="2"/>
  <path d="M${w * .15} ${h * .25}h${w * .65}M${w * .15} ${h * .42}h${w * .6}M${w * .15} ${h * .59}h${w * .5}M${w * .15} ${h * .76}h${w * .3}" stroke="#555" stroke-width="4"/>`;
A.terminal = (w, h) => `<rect x="${w * .05}" y="0" width="${w * .9}" height="${h * .72}" rx="10" fill="#161b21" stroke="#3b4651" stroke-width="4"/>
  <rect x="${w * .12}" y="${h * .08}" width="${w * .76}" height="${h * .52}" rx="6" fill="url(#screen)"/>
  <text x="${w * .16}" y="${h * .25}" font-family="monospace" font-size="${h * .07}" fill="#8af0d0">TERMINAL v2.1</text>
  <text x="${w * .16}" y="${h * .38}" font-family="monospace" font-size="${h * .07}" fill="#8af0d0">ENTER WORD &gt; _</text>
  <rect x="${w * .38}" y="${h * .72}" width="${w * .24}" height="${h * .1}" fill="#1a212a"/>
  <rect x="${w * .1}" y="${h * .84}" width="${w * .8}" height="${h * .14}" rx="5" fill="#18202a" stroke="#2c3744" stroke-width="2"/>`;
A.wallnote = (w, h) => `<rect width="${w}" height="${h}" fill="#bdb59c" stroke="#555" stroke-width="2" transform="rotate(3 ${w / 2} ${h / 2})"/>
  <path d="M${w * .15} ${h * .3}l${w * .2} ${h * .05}M${w * .15} ${h * .5}l${w * .6}-${h * .05}M${w * .15} ${h * .7}l${w * .4} ${h * .04}" stroke="#444" stroke-width="3"/>`;
A.gate = (w, h) => `<rect x="-10" y="-10" width="${w + 20}" height="${h + 10}" fill="#0b0e13" stroke="#2d3844" stroke-width="4"/>
  <rect width="${w / 2 - 2}" height="${h}" fill="url(#steel)" stroke="#0d1218" stroke-width="3"/>
  <rect x="${w / 2 + 2}" width="${w / 2 - 2}" height="${h}" fill="url(#steel)" stroke="#0d1218" stroke-width="3"/>
  ${[0.15, 0.4, 0.65, 0.88].map(f => `<rect x="${w * .06}" y="${h * f}" width="${w * .38}" height="${h * .06}" fill="rgba(0,0,0,.3)"/><rect x="${w * .56}" y="${h * f}" width="${w * .38}" height="${h * .06}" fill="rgba(0,0,0,.3)"/>`).join('')}
  <rect x="${w * .46}" y="0" width="${w * .08}" height="${h}" fill="#e6b41f" opacity=".85"/>
  ${Array.from({ length: 12 }).map((_, i) => `<polygon points="${w * .46},${i * h / 12} ${w * .54},${i * h / 12 + h / 24} ${w * .54},${i * h / 12 + h / 12} ${w * .46},${i * h / 12 + h / 24}" fill="#111" opacity=".75"/>`).join('')}
  <rect x="${w * .62}" y="${h * .45}" width="${w * .3}" height="${h * .16}" rx="6" fill="#0b0f14" stroke="#d6b477" stroke-width="3"/>
  <text x="${w * .77}" y="${h * .565}" text-anchor="middle" font-family="monospace" font-size="${h * .075}" fill="#ff4a3a">_ _ _</text>
  <circle cx="${w / 2}" cy="${-h * .04}" r="12" fill="#ff4a2a"/>`;
A.warnsign = (w, h) => `<polygon points="${w / 2},0 ${w},${h * .9} 0,${h * .9}" fill="#e6b41f" stroke="#111" stroke-width="5"/>
  <text x="${w / 2}" y="${h * .75}" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="${h * .55}" fill="#111">!</text>`;
A.breaker = (w, h) => {
  const cols = ['#2fae5b', '#d93a3a', '#e6c229', '#2e7bd6'];
  return `<rect width="${w}" height="${h}" rx="6" fill="url(#steel)" stroke="#0d1218" stroke-width="4"/>
  <text x="${w / 2}" y="${h * .12}" text-anchor="middle" font-family="monospace" font-size="${h * .07}" fill="#d6b477">BREAKERS</text>
  ${cols.map((c, i) => `<rect x="${w * (.1 + i * .22)}" y="${h * .2}" width="${w * .16}" height="${h * .62}" rx="4" fill="#10151b" stroke="#556" stroke-width="2"/>
  <rect x="${w * (.12 + i * .22)}" y="${h * (.28 + (i % 2) * .22)}" width="${w * .12}" height="${h * .2}" rx="4" fill="${c}"/>
  <circle cx="${w * (.18 + i * .22)}" cy="${h * .9}" r="6" fill="${c}"/>`).join('')}`;
};
// 7. Build SVG Frames and Office/Library Background Scenes

/* ---------------- scenes (background + decor) ---------------- */
function frame(inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${DEFS}${inner}</svg>`;
}
const P = (n, t) => px(n, t);

function sceneOffice() {
  const fy = P(70, H);
  return `
  <rect width="${W}" height="${H}" fill="#121922"/>
  <rect width="${W}" height="${fy}" fill="#18212c"/>
  ${Array.from({ length: 14 }).map((_, i) => `<rect x="${i * 120}" y="0" width="2" height="${fy}" fill="rgba(255,255,255,.025)"/>`).join('')}
  <rect y="${fy - 24}" width="${W}" height="24" fill="#0e1218"/>
  <rect y="${fy}" width="${W}" height="${H - fy}" fill="#0b0e13"/>
  <polygon points="${P(14, W)},${fy} ${P(86, W)},${fy} ${P(95, W)},${H} ${P(5, W)},${H}" fill="#241915" opacity=".85"/>
  <rect x="${P(4, W)}" y="${P(10, H)}" width="${P(14, W)}" height="${P(34, H)}" fill="#0a1226" stroke="#05070a" stroke-width="8"/>
  ${Array.from({ length: 14 }).map((_, i) => `<rect x="${P(4, W)}" y="${P(10, H) + i * 22 + 6}" width="${P(14, W)}" height="9" fill="#06080c" opacity=".7"/>`).join('')}
  <polygon points="${P(4, W)},${P(44, H)} ${P(18, W)},${P(44, H)} ${P(28, W)},${H} ${P(0, W)},${H}" fill="url(#beam)"/>
  <circle cx="${P(48.5, W)}" cy="${P(12, H)}" r="38" fill="#d9d5c8" stroke="#0a0d12" stroke-width="6"/>
  <path d="M${P(48.5, W)} ${P(12, H)}v-26M${P(48.5, W)} ${P(12, H)}l16 10" stroke="#111" stroke-width="4"/>
  <rect x="${P(18, W)}" y="${P(58, H)}" width="${P(62, W)}" height="${P(1.8, H)}" fill="#5a3f2a"/>
  <rect x="${P(19, W)}" y="${P(59.8, H)}" width="${P(60, W)}" height="${P(25, H)}" fill="url(#wood)"/>
  <rect x="${P(19, W)}" y="${P(59.8, H)}" width="${P(2, W)}" height="${P(29, H)}" fill="#1f130b"/><rect x="${P(77, W)}" y="${P(59.8, H)}" width="${P(2, W)}" height="${P(29, H)}" fill="#1f130b"/>
  <rect x="${P(46, W)}" y="${P(63, H)}" width="${P(17, W)}" height="${P(13, H)}" rx="4" fill="none" stroke="rgba(0,0,0,.5)" stroke-width="3"/>
  <ellipse cx="${P(57, W)}" cy="${P(48, H)}" rx="300" ry="240" fill="url(#warm)"/>`;
}
function sceneLibrary() {
  const fy = P(72, H), r = rng(5);
  const cols = ['#4a1f1f', '#1f3250', '#1f4a33', '#4a3a1f', '#3a1f4a', '#555', '#2a2a36'];
  let books = '';
  for (let row = 0; row < 6; row++) {
    let x = 0; const by = 20 + row * 90;
    while (x < W) { const bw = 14 + r() * 18, bh = 55 + r() * 30; books += `<rect x="${x}" y="${by + 80 - bh}" width="${bw}" height="${bh}" fill="${cols[Math.floor(r() * cols.length)]}" opacity=".75"/>`; x += bw + 1; }
    books += `<rect y="${by + 80}" width="${W}" height="10" fill="#1b110a"/>`;
  }
  return `
  <rect width="${W}" height="${H}" fill="#0d0a08"/>${books}
  <rect y="${fy}" width="${W}" height="${H - fy}" fill="#0b0806"/>
  <rect y="${fy - 14}" width="${W}" height="14" fill="#0b0705"/>
  <polygon points="${P(15, W)},${fy + 10} ${P(88, W)},${fy + 10} ${P(95, W)},${H} ${P(8, W)},${H}" fill="#2b1414" opacity=".8"/>
  <rect x="${P(28, W)}" y="${P(62, H)}" width="${P(69, W)}" height="${P(2, H)}" fill="#6a4a2a"/>
  <rect x="${P(29, W)}" y="${P(64, H)}" width="${P(67, W)}" height="${P(22, H)}" fill="url(#wood)"/>
  <rect x="${P(30, W)}" y="${P(64, H)}" width="${P(2, W)}" height="${P(26, H)}" fill="#1a0f08"/><rect x="${P(93, W)}" y="${P(64, H)}" width="${P(2, W)}" height="${P(26, H)}" fill="#1a0f08"/>
  <ellipse cx="${P(70, W)}" cy="${P(48, H)}" rx="260" ry="240" fill="url(#warm)"/>`;
}
