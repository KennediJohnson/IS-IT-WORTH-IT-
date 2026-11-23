'use strict';
/* Worth the Hype? — daily backgrounds, opening chime and splash.
   Every background is drawn in code (CSS + SVG), so it works offline and needs no image downloads. */

// Small seeded random so a scene looks the same every time it's drawn
function seeded(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

function starsSvg(n, y0, y1, seed) {
  const r = seeded(seed); let out = '';
  for (let i = 0; i < n; i++) {
    const x = (r() * 400).toFixed(1), y = (y0 + r() * (y1 - y0)).toFixed(1), rad = (0.5 + r() * 1.3).toFixed(2);
    out += `<circle class="twinkle" style="animation-delay:${(r() * 3).toFixed(2)}s" cx="${x}" cy="${y}" r="${rad}" fill="#fff"/>`;
  }
  return out;
}
const svgWrap = (inner, defs = '') => `<svg viewBox="0 0 400 860" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><defs>${defs}</defs>${inner}</svg>`;
const blobs = (base, list, extra = '') =>
  `<div class="blobs" style="background:${base}">${list.map(([c, x, y, s, d]) =>
    `<i style="background:${c};left:${x}%;top:${y}%;width:${s}%;aspect-ratio:1;animation-duration:${d || 20}s"></i>`).join('')}</div>${extra}`;

// ---------------------------------------------------------------- scenes
function paris() {
  const r = seeded(7); let roofs = '', lights = '', sparkles = '';
  for (let x = -10; x < 410;) {
    const w = 34 + r() * 40, h = 70 + r() * 90, top = 860 - h;
    roofs += `<path d="M${x} 860 V${top + 16} L${x + 8} ${top} H${x + w - 8} L${x + w} ${top + 16} V860 Z"/><rect x="${x + w * .3}" y="${top - 12}" width="6" height="14"/>`;
    for (let k = 0; k < 4; k++) if (r() > .45) lights += `<rect class="twinkle" style="animation-delay:${(r() * 4).toFixed(1)}s" x="${(x + 6 + r() * (w - 14)).toFixed(0)}" y="${(top + 24 + r() * (h - 36)).toFixed(0)}" width="4" height="6" fill="#ffd37a"/>`;
    x += w + 2;
  }
  for (let i = 0; i < 26; i++) {
    const t = 280 + r() * 460, half = 4 + (t - 250) * 0.11 * r();
    sparkles += `<circle class="twinkle" style="animation-delay:${(r() * 2.6).toFixed(2)}s;animation-duration:1.${(r() * 9).toFixed(0)}s" cx="${(200 + (r() * 2 - 1) * half).toFixed(1)}" cy="${t.toFixed(0)}" r="1.6" fill="#fff6d0"/>`;
  }
  return svgWrap(`
    <rect width="400" height="860" fill="url(#pa)"/>
    ${starsSvg(45, 0, 330, 3)}
    <circle cx="300" cy="610" r="150" fill="url(#pb)"/>
    <g fill="#1b1030">
      <rect x="199" y="200" width="2" height="54"/>
      <path d="M200 250 L203 330 L210 440 L222 540 L246 660 L272 770 L240 770 Q200 700 160 770 L128 770 L154 660 L178 540 L190 440 L197 330 Z"/>
      <rect x="172" y="534" width="56" height="8"/><rect x="186" y="436" width="28" height="6"/>
      ${roofs}
    </g>${lights}${sparkles}`,
  `<linearGradient id="pa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#120a36"/><stop offset=".42" stop-color="#6c2a6e"/><stop offset=".68" stop-color="#ff6a3d"/><stop offset=".86" stop-color="#ffb347"/></linearGradient>
   <radialGradient id="pb"><stop offset="0" stop-color="#fff3c4"/><stop offset=".45" stop-color="#ffc35c" stop-opacity=".85"/><stop offset="1" stop-color="#ff7a3d" stop-opacity="0"/></radialGradient>`);
}

function beach() {
  return svgWrap(`
    <rect width="400" height="860" fill="url(#ba)"/>
    <circle cx="210" cy="520" r="120" fill="url(#bglow)"/>
    <circle cx="210" cy="520" r="58" fill="#ffe9a3"/>
    <rect y="520" width="400" height="200" fill="url(#bsea)"/>
    <g fill="#ffe2a0" opacity=".75">
      <rect x="170" y="532" width="80" height="4" rx="2"/><rect x="180" y="548" width="60" height="3" rx="1.5"/>
      <rect x="190" y="564" width="40" height="3" rx="1.5"/><rect x="196" y="580" width="28" height="2" rx="1"/>
    </g>
    <g fill="none" stroke="#bff6ff" stroke-width="2.4" stroke-linecap="round" opacity=".55">
      <path class="wave" d="M-40 610 q25 -10 50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0"/>
      <path class="wave" style="animation-duration:9s;animation-delay:-3s" d="M-40 650 q25 -10 50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0"/>
      <path class="wave" style="animation-duration:6s;animation-delay:-1s" d="M-40 690 q25 -10 50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0"/>
    </g>
    <path d="M0 708 Q100 690 200 704 T400 700 V860 H0 Z" fill="url(#bsand)"/>
    <path class="wave" style="animation-duration:5s" d="M-40 712 q30 -9 60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0" fill="none" stroke="#fff" stroke-width="3" opacity=".7"/>
    <g fill="#1d1233">
      <path d="M62 860 C70 780 84 700 112 600 L118 602 C94 700 82 780 78 860 Z"/>
      <path d="M114 598 C80 560 40 562 10 590 C48 572 84 576 112 604 Z"/>
      <path d="M114 598 C140 552 190 548 222 574 C186 562 148 570 118 604 Z"/>
      <path d="M114 598 C96 548 104 512 130 488 C116 520 114 556 120 600 Z"/>
      <path d="M114 600 C150 590 186 610 204 646 C178 622 146 610 116 606 Z"/>
      <path d="M112 600 C80 604 50 628 40 662 C60 636 86 616 114 608 Z"/>
    </g>
    <g fill="none" stroke="#2b1a3f" stroke-width="2" stroke-linecap="round">
      <path d="M280 300 q8 -8 16 0 q8 -8 16 0"/><path d="M318 330 q6 -6 12 0 q6 -6 12 0"/><path d="M250 350 q5 -5 10 0 q5 -5 10 0"/>
    </g>`,
  `<linearGradient id="ba" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2d1b69"/><stop offset=".38" stop-color="#c0458a"/><stop offset=".6" stop-color="#ff8a5c"/><stop offset=".62" stop-color="#ffc56b"/></linearGradient>
   <radialGradient id="bglow"><stop offset="0" stop-color="#fff2b0" stop-opacity=".9"/><stop offset="1" stop-color="#ff9a5c" stop-opacity="0"/></radialGradient>
   <linearGradient id="bsea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9d6c"/><stop offset=".12" stop-color="#18b3c4"/><stop offset="1" stop-color="#05506e"/></linearGradient>
   <linearGradient id="bsand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd08a"/><stop offset="1" stop-color="#e59a52"/></linearGradient>`);
}

function tokyo() {
  const r = seeded(21); const neon = ['#ff3da8', '#2fe0ff', '#ffb02e', '#8be04a', '#b46cff'];
  let bld = '', win = '', signs = '';
  for (let x = -6; x < 410;) {
    const w = 28 + r() * 46, h = 220 + r() * 360, top = 780 - h;
    bld += `<rect x="${x}" y="${top}" width="${w}" height="${h + 80}" fill="${r() > .5 ? '#0d0b25' : '#140f33'}"/>`;
    for (let yy = top + 14; yy < 770; yy += 14) for (let xx = x + 5; xx < x + w - 6; xx += 9)
      if (r() > .72) win += `<rect class="${r() > .8 ? 'blink' : ''}" style="animation-delay:${(r() * 3).toFixed(1)}s" x="${xx.toFixed(0)}" y="${yy}" width="4" height="6" fill="${neon[(r() * 5) | 0]}" opacity=".85"/>`;
    if (r() > .55) { const c = neon[(r() * 5) | 0]; signs += `<rect x="${x + w / 2 - 4}" y="${top + 30}" width="8" height="${50 + r() * 60}" rx="3" fill="${c}" filter="url(#tglow)" class="twinkle" style="animation-duration:${(2 + r() * 3).toFixed(1)}s"/>`; }
    x += w + 3;
  }
  return svgWrap(`
    <rect width="400" height="860" fill="url(#ta)"/>
    ${starsSvg(30, 0, 260, 9)}
    <circle cx="300" cy="150" r="34" fill="#ffe7f6" opacity=".9"/><circle cx="300" cy="150" r="70" fill="#ff8ad4" opacity=".15"/>
    ${bld}${win}${signs}
    <rect y="780" width="400" height="80" fill="url(#tw)"/>
    <g opacity=".45" filter="url(#tglow)"><rect x="40" y="800" width="60" height="3" fill="#ff3da8"/><rect x="180" y="814" width="90" height="3" fill="#2fe0ff"/><rect x="300" y="826" width="50" height="3" fill="#ffb02e"/></g>`,
  `<linearGradient id="ta" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05061a"/><stop offset=".55" stop-color="#1c0b45"/><stop offset="1" stop-color="#4a0f55"/></linearGradient>
   <linearGradient id="tw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a0b3d"/><stop offset="1" stop-color="#05061a"/></linearGradient>
   <filter id="tglow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>`);
}

function alps() {
  const r = seeded(5); let pines = '';
  for (let i = 0; i < 22; i++) { const x = r() * 420 - 10, s = 18 + r() * 26, b = 728 + r() * 16; pines += `<path d="M${x} ${b} l${s / 2.4} -${s * 1.6} l${s / 2.4} ${s * 1.6} Z" fill="#0b2a22"/>`; }
  return svgWrap(`
    <rect width="400" height="860" fill="url(#aa)"/>
    ${starsSvg(60, 0, 300, 11)}
    <path d="M-20 560 L70 380 L120 450 L200 300 L270 430 L320 370 L420 540 V760 H-20 Z" fill="#33508a"/>
    <path d="M70 380 L92 424 L80 420 L70 440 L58 418 Z M200 300 L232 362 L214 356 L200 380 L186 352 L170 360 Z M320 370 L344 412 L328 406 L318 420 L306 404 Z" fill="#eef6ff" opacity=".9"/>
    <path d="M-20 640 L60 520 L140 600 L230 480 L320 590 L420 520 V760 H-20 Z" fill="#1d6f6a"/>
    <path d="M-20 700 L90 620 L180 690 L280 610 L420 690 V760 H-20 Z" fill="#12503d"/>
    ${pines}
    <rect y="745" width="400" height="115" fill="url(#al)"/>
    <g fill="#fff" opacity=".18"><rect x="60" y="770" width="120" height="2"/><rect x="200" y="790" width="150" height="2"/><rect x="30" y="815" width="90" height="2"/></g>`,
  `<linearGradient id="aa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#081733"/><stop offset=".45" stop-color="#2b5c8a"/><stop offset=".75" stop-color="#ff9e5e"/></linearGradient>
   <linearGradient id="al" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1f5e7a"/><stop offset="1" stop-color="#071a26"/></linearGradient>`);
}

// ---------------------------------------------------------------- theme list
const THEMES = [
  { id: 'liquid', group: 'Reflective', name: 'Liquid Chrome', e: '🪩',
    html: () => `<div class="lq"><i></i><i></i><i></i><i></i><i></i></div>` },
  { id: 'fractal', group: 'Reflective', name: 'Fractal Glass', e: '🔮',
    html: () => blobs('#160806', [['#ff3d00', -20, 0, 90, 18], ['#ffb000', 45, -10, 80, 24], ['#00b8a0', 30, 55, 95, 21], ['#ff2d6a', -25, 60, 70, 26]], '<div class="ribs"></div>') },
  { id: 'emerald', group: 'Reflective', name: 'Emerald Prism', e: '💎',
    html: () => blobs('#03140c', [['#15b85c', -15, -5, 90, 19], ['#8be04a', 50, 20, 70, 23], ['#ff8a1f', 20, 65, 80, 25], ['#00d1b2', -30, 50, 70, 21]], '<div class="ribs"></div>') },
  { id: 'aurora', group: 'Colors', name: 'Aurora', e: '🌌',
    html: () => blobs('#030712', [['#00ff9d', -20, -10, 85, 17], ['#00c2ff', 40, 20, 75, 22], ['#8b5cf6', -10, 55, 80, 19], ['#2fe0b0', 45, 70, 60, 25]]) },
  { id: 'citrus', group: 'Colors', name: 'Citrus Pop', e: '🍊',
    html: () => blobs('linear-gradient(160deg,#ff5e14,#ffb02e)', [['#15b85c', -25, 45, 90, 18], ['#c6f24a', 50, -10, 70, 22], ['#ffd23f', 30, 30, 60, 20], ['#0f8a45', 40, 75, 80, 24]]) },
  { id: 'lagoon', group: 'Colors', name: 'Lagoon', e: '🐬',
    html: () => blobs('linear-gradient(170deg,#022a3a,#014d4e)', [['#00e0c6', -20, -5, 80, 19], ['#2f9bff', 45, 25, 70, 23], ['#8be04a', 0, 60, 70, 21], ['#ffb02e', 55, 80, 50, 27]]) },
  { id: 'paris', group: 'Places', name: 'Paris at Dusk', e: '🗼', html: paris },
  { id: 'beach', group: 'Places', name: 'Golden Beach', e: '🏝️', html: beach },
  { id: 'tokyo', group: 'Places', name: 'Neon Tokyo', e: '🌃', html: tokyo },
  { id: 'alps', group: 'Places', name: 'Alpine Lake', e: '🏔️', html: alps },
];
const themeById = id => THEMES.find(t => t.id === id);

function dayNumber() { const d = new Date(); return Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 86400000); }

// Which background shows today: your fixed pick, or today's turn in your daily rotation
function todaysTheme(look) {
  if (look.mode === 'photo' && look.photo) return { id: 'photo', name: 'Your photo', e: '📷' };
  if (look.mode === 'fixed') return themeById(look.pick) || THEMES[0];
  const pool = (look.rotation || []).map(themeById).filter(Boolean);
  const list = pool.length ? pool : THEMES;
  return list[(dayNumber() * 7 + 3) % list.length];
}

const _bgCache = {};
function backgroundHtml(id, look) {
  if (id === 'photo') return `<div class="photo" style="background-image:url('${look.photo}')"></div>`;
  return _bgCache[id] || (_bgCache[id] = themeById(id).html());
}
let _bgShown = null;
function applyBackground(look) {
  const t = todaysTheme(look);
  const key = t.id === 'photo' ? 'photo:' + look.photo.length : t.id;
  if (key === _bgShown) return t;
  _bgShown = key;
  document.getElementById('bg').innerHTML = backgroundHtml(t.id, look);
  return t;
}

// ---------------------------------------------------------------- chime (synthesized, no sound file)
function playChime() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  try {
    const ctx = new AC();
    const now = ctx.currentTime + 0.02;
    const master = ctx.createGain(); master.gain.value = 0.32; master.connect(ctx.destination);
    // soft echo for a shimmery tail
    const delay = ctx.createDelay(); delay.delayTime.value = 0.16;
    const fb = ctx.createGain(); fb.gain.value = 0.32;
    const wet = ctx.createGain(); wet.gain.value = 0.45;
    delay.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(master);
    const notes = [1318.5, 1568.0, 2093.0, 2637.0]; // E6 G6 C7 E7 — a bright rising "ding"
    notes.forEach((f, i) => {
      const t = now + i * 0.085;
      [[1, 0.5, 1.8], [2.76, 0.12, 0.9], [5.4, 0.04, 0.5]].forEach(([mult, amp, len]) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = f * mult;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(amp * (i === notes.length - 1 ? 1.2 : 0.8), t + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, t + len);
        o.connect(g); g.connect(master); g.connect(delay);
        o.start(t); o.stop(t + len + 0.05);
      });
    });
    setTimeout(() => ctx.close && ctx.close(), 3200);
  } catch (e) { /* audio not available */ }
}
