'use strict';
/* Worth the Hype? — everything runs on-device from your own answers and simple, visible rules.
   No AI, no external APIs. Data lives in localStorage. */

// ---------------------------------------------------------------- constants
const KEY = 'wth-v1';
const DAY = 86400000;

const CATS = [
  { id: 'beauty', label: 'Beauty', e: '💄' },
  { id: 'clothing', label: 'Clothing', e: '👗' },
  { id: 'food', label: 'Restaurants', e: '🍜', once: true },
  { id: 'travel', label: 'Travel', e: '✈️', once: true },
  { id: 'subs', label: 'Subscriptions', e: '📺' },
  { id: 'experiences', label: 'Experiences', e: '🎟️', once: true },
  { id: 'tech', label: 'Tech', e: '🎧' },
  { id: 'home', label: 'Home', e: '🛋️' },
  { id: 'other', label: 'Other', e: '✨' },
];
const cat = id => CATS.find(c => c.id === id) || CATS[CATS.length - 1];
const AVATARS = ['🙂', '😎', '🦄', '🐱', '🐸', '🌸', '🔥', '👑', '🍓', '🌈', '🐼', '💅'];

// Regret Test questions. Each option: [label, points, extra]
// Points always add up to a max of 100 (25+15+15+15+10+20 budget).
function questionsFor(category) {
  const once = cat(category).once;
  const qs = [];
  if (once) {
    qs.push({ id: 'freq', max: 25, q: 'How long will you be talking about it?', hint: 'Great experiences pay off in memories. Forgettable ones don’t.', opts: [
      ['For years', 25, 1, '🤩'], ['For a few months', 18, 1, '😊'], ['A couple of weeks', 10, 1, '🙂'], ['A few days', 4, 1, '😐'], ['I’ll forget by next week', 0, 1, '🫥']] });
    qs.push({ id: 'dupe', max: 15, q: 'Have you done something like this recently?', hint: 'New experiences tend to feel more worth it than repeats.', opts: [
      ['Never — totally new', 15, 0, '🆕'], ['Not in a long time', 10, 0, '⏳'], ['Yes, a few months ago', 4, 0, '🔁'], ['Yes, very recently', 0, 0, '🔂']] });
  } else {
    qs.push({ id: 'freq', max: 25, q: 'How often will you actually use it?', hint: 'Be honest — think about the last thing like this you bought.', opts: [
      ['Every day', 25, 365, '🔥'], ['A few times a week', 21, 150, '💪'], ['About once a week', 17, 52, '📅'], ['About once a month', 9, 12, '🗓️'], ['A few times a year', 4, 4, '🎄'], ['Probably just once', 0, 1, '1️⃣']] });
    qs.push({ id: 'dupe', max: 15, q: 'Do you already own something that does the same job?', hint: 'Duplicates are the #1 source of buyer’s regret.', opts: [
      ['Nope, nothing like it', 15, 0, '🆕'], ['Sort of, but it’s worn out', 10, 0, '🩹'], ['Yes, but this is better', 4, 0, '🆙'], ['Yes, and it works fine', 0, 0, '✅']] });
  }
  qs.push({ id: 'wait', max: 15, q: 'How long have you wanted it?', hint: 'If the want survives a wait, it’s usually real.', opts: [
    ['Over a month', 15, 0, '🗓️'], ['A couple of weeks', 10, 0, '⌛'], ['A few days', 5, 0, '⏱️'], ['I just saw it', 0, 0, '👀']] });
  qs.push({ id: 'why', max: 15, q: 'What’s the real reason you want it?', hint: 'Pick the one that’s most true, not the one that sounds best.', opts: [
    ['It solves an actual need', 15, 0, '🎯'], ['Replacing something worn out', 12, 0, '♻️'], ['A planned treat I saved for', 10, 0, '🎁'], ['Everyone’s talking about it', 3, 0, '📣'], ['I’m bored, stressed, or it’s on sale', 0, 0, '🌀']] });
  qs.push({ id: 'full', max: 10, q: 'Would you still buy it at full price, with no sale or hype?', hint: 'Take away the countdown timer. Still want it?', opts: [
    ['Yes, definitely', 10, 0, '💯'], ['Probably', 6, 0, '👍'], ['Not sure', 3, 0, '🤷'], ['Honestly, no', 0, 0, '👎']] });
  if (!once) {
    qs.push({ id: 'life', max: 0, q: 'How long will it last you?', hint: 'Used to work out your cost per use. Doesn’t change your score.', opts: [
      ['Less than 6 months', 0, 0.5, '🍂'], ['About a year', 0, 1, '🌱'], ['2–3 years', 0, 2.5, '🌳'], ['5+ years', 0, 5, '🏔️']] });
  }
  return qs;
}

function budgetPoints(price, budget) {
  if (!budget) return { pts: 10, pct: null };
  const pct = price / budget;
  const pts = pct <= 0.10 ? 20 : pct <= 0.25 ? 15 : pct <= 0.50 ? 8 : pct <= 1 ? 3 : 0;
  return { pts, pct };
}

function scoreTest(t, budget) {
  const qs = questionsFor(t.category);
  const rows = [];
  let total = 0, usesPerYear = 1, years = 1;
  for (const q of qs) {
    const opt = q.opts[t.answers[q.id]];
    if (!opt) continue;
    if (q.id === 'freq') usesPerYear = opt[2];
    if (q.id === 'life') { years = opt[2]; continue; }
    total += opt[1];
    rows.push({ label: shortLabel(q.id), answer: opt[0], pts: opt[1], max: q.max });
  }
  const b = budgetPoints(t.price, budget);
  total += b.pts;
  rows.push({ label: 'Budget fit', answer: b.pct == null ? 'No monthly budget set' : `${Math.round(b.pct * 100)}% of your monthly budget`, pts: b.pts, max: 20 });
  const once = cat(t.category).once;
  const uses = once ? 1 : Math.max(1, Math.round(usesPerYear * years));
  return { score: total, rows, usesPerYear: once ? 1 : usesPerYear, years: once ? 1 : years, expectedUses: uses, cpu: t.price / uses };
}
const shortLabel = id => ({ freq: 'How much you’ll use it', dupe: 'Not a duplicate', wait: 'Waited before buying', why: 'Real reason', full: 'Worth full price' }[id] || id);

function verdict(score) {
  if (score >= 75) return { cls: 'good', title: 'Worth the hype!', e: '🎉', text: 'Your answers line up. This looks like a purchase you’ll be glad you made.' };
  if (score >= 50) return { cls: 'mid', title: 'Sleep on it', e: '😴', text: 'Could go either way. Wait 48 hours — if you still want it, go for it.' };
  return { cls: 'bad', title: 'Skip the hype', e: '🙅', text: 'Your answers point to regret. Keep your money for something you’ll love more.' };
}

const TIPS = {
  freq: 'You don’t expect to use it much. Could you borrow, rent or try a sample first?',
  dupe: 'You already own something similar. Try using what you have for two more weeks.',
  wait: 'This is a fresh want. Add it to your wishlist and re-take the test in a week.',
  why: 'The reason is hype or mood, not need. Those feelings fade faster than the charge on your card.',
  full: 'The deal is doing the selling. A discount on something you don’t need is still money spent.',
  budget: 'It takes a big bite of your monthly budget. Look for a cheaper alternative below.',
};

// ---------------------------------------------------------------- state
const SAMPLE_MEMBERS = [
  { id: 'm1', name: 'Maya', e: '🌸', bio: 'Skincare minimalist. Hates waste.' },
  { id: 'm2', name: 'Jordan', e: '🎧', bio: 'Tests every gadget so you don’t have to.' },
  { id: 'm3', name: 'Priya', e: '✈️', bio: 'Budget traveler, 23 countries.' },
  { id: 'm4', name: 'Leo', e: '🍜', bio: 'Will drive 40 minutes for good ramen.' },
];

function seed() {
  const now = Date.now();
  return {
    v: 1,
    onboarded: false,
    profile: { name: '', e: '🙂', budget: 300 },
    items: [],
    posts: [
      { id: uid(), sample: true, author: 'Maya', e: '🌸', category: 'beauty', item: 'Viral glow serum', vote: 'overhyped', text: 'Used it daily for 6 weeks. Nice texture, but honestly no different from my $12 one. The packaging is doing a lot of work.', likes: 14, liked: false, at: now - 2 * DAY, comments: [
        { author: 'Priya', e: '✈️', text: 'Same experience! Returned mine.', at: now - DAY }] },
      { id: uid(), sample: true, author: 'Jordan', e: '🎧', category: 'tech', item: 'Noise-cancelling headphones', vote: 'worth', text: 'Wear them 3+ hours a day on my commute. Works out to about 9¢ per use after a year. Absolutely worth it.', likes: 22, liked: false, at: now - 3 * DAY, comments: [] },
      { id: uid(), sample: true, author: 'Leo', e: '🍜', category: 'food', item: 'Tasting menu downtown', vote: 'ask', text: '$140 per person. Anyone been? Trying to decide if it’s worth it for an anniversary.', likes: 6, liked: false, at: now - 5 * 3600000, comments: [
        { author: 'Maya', e: '🌸', text: 'Went last spring — still talk about the dessert. Worth it for a special night.', at: now - 3 * 3600000 }] },
      { id: uid(), sample: true, author: 'Priya', e: '✈️', category: 'subs', item: 'Streaming bundle', vote: 'overhyped', text: 'Did the math: watched 3 things in 2 months. That’s $11 per show. Cancelled.', likes: 9, liked: false, at: now - 6 * DAY, comments: [] },
    ],
    chat: [
      { id: uid(), author: 'Jordan', e: '🎧', text: 'Anyone tried the new air fryer everyone is posting?', at: now - 50 * 60000 },
      { id: uid(), author: 'Maya', e: '🌸', text: 'Mine gets used 4x a week. Cost per use is tiny now 😂', at: now - 45 * 60000 },
      { id: uid(), author: 'Leo', e: '🍜', text: 'Take the Regret Test before Black Friday, people!', at: now - 20 * 60000 },
    ],
    dms: {
      m1: [
        { id: uid(), sample: true, text: 'Saw you’re eyeing that lip oil 👀', at: now - 26 * 3600000 },
        { id: uid(), sample: true, text: 'The drugstore one is basically identical. Happy to send you the name!', at: now - 26 * 3600000 + 40000 },
      ],
    },
    dmRead: {},
    following: ['m1'],
  };
}

let S = load();
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return Object.assign(seed(), JSON.parse(raw));
  } catch (e) { /* fall through */ }
  return seed();
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); }
  catch (e) { toast('Storage is full — try removing some photos.'); }
}

// ---------------------------------------------------------------- helpers
function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); }
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const fmt0 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const money = n => (Math.abs(n) >= 1000 ? fmt0 : fmt).format(n || 0);
const cents = n => n < 1 ? `${Math.round(n * 100)}¢` : fmt.format(n);
const scoreCls = s => s == null ? 'none' : s >= 75 ? 'good' : s >= 50 ? 'mid' : 'bad';
const buzz = p => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} };
const monthKey = d => { const x = new Date(d); return `${x.getFullYear()}-${x.getMonth()}`; };
function ago(t) {
  const s = (Date.now() - t) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`;
  return new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
let toastTimer;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}
function thumb(item, size) {
  return item.photo ? `<div class="thumb"${size ? ` style="width:${size}px;height:${size}px"` : ''}><img src="${item.photo}" alt=""></div>`
    : `<div class="thumb"${size ? ` style="width:${size}px;height:${size}px"` : ''}>${cat(item.category).e}</div>`;
}
function itemCpu(it) {
  if (it.status === 'bought' && it.uses > 0) return it.price / it.uses;
  return it.price / Math.max(1, it.expectedUses || 1);
}
// Resize + compress photos so they fit comfortably in on-device storage
function compressImage(file, max = 720) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const r = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.72));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('bad image')); };
    img.src = url;
  });
}

// Center-crop a photo to a small square for profile pictures
function squareImage(file, size = 320) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const side = Math.min(img.width, img.height);
      const c = document.createElement('canvas'); c.width = c.height = size;
      c.getContext('2d').drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('bad image')); };
    img.src = url;
  });
}
// Your avatar: profile photo if you added one, otherwise your emoji
const myFace = () => S.profile.photo ? `<img src="${S.profile.photo}" alt="">` : esc(S.profile.e || '🙂');
const face = x => x.mine ? myFace() : esc(x.e || '🙂');

// ---------------------------------------------------------------- routing
let tab = (location.hash || '#home').slice(1);
if (!['home', 'test', 'items', 'spend', 'community'].includes(tab)) tab = 'home';
let itemsSeg = 'wishlist';
let commSeg = 'boards';
let boardCat = 'all';
let test = newTest();
function newTest() { return { step: 0, name: '', category: '', price: '', photo: null, answers: {}, result: null, savedId: null }; }

function go(t) {
  tab = t; history.replaceState(null, '', '#' + t);
  render(); window.scrollTo(0, 0);
}

function render() {
  document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  $('.avatar').innerHTML = myFace();
  const v = $('#view');
  v.innerHTML = ({ home: viewHome, test: viewTest, items: viewItems, spend: viewSpend, community: viewCommunity })[tab]();
  $('.tabs [data-tab="community"]').classList.toggle('has-dot', unreadCount() > 0);
  if (sheet) renderSheet();
}

// ---------------------------------------------------------------- HOME
let installEvt = null;
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone;
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

function monthSpend(offset = 0) {
  const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - offset);
  const k = monthKey(d);
  return S.items.filter(i => i.status === 'bought' && monthKey(i.boughtAt) === k).reduce((a, i) => a + i.price, 0);
}

function viewHome() {
  const name = S.profile.name ? `, ${esc(S.profile.name)}` : '';
  const wish = S.items.filter(i => i.status === 'wishlist');
  const saved = S.items.filter(i => i.status === 'skipped').reduce((a, i) => a + i.price, 0);
  const spent = monthSpend();
  const budget = S.profile.budget || 0;
  const pct = budget ? Math.min(100, (spent / budget) * 100) : 0;
  const trending = [...S.posts].sort((a, b) => (b.likes + b.comments.length * 2) - (a.likes + a.comments.length * 2)).slice(0, 2);
  const recent = [...S.items].sort((a, b) => b.createdAt - a.createdAt).slice(0, 3);
  const hr = new Date().getHours();
  const hello = hr < 12 ? 'Good morning' : hr < 18 ? 'Hey there' : 'Good evening';

  let install = '';
  if (!isStandalone() && !localStorage.getItem('wth-install-dismissed')) {
    install = `<div class="card row">
      <div style="font-size:34px">📲</div>
      <div class="grow"><b>Put it on your home screen</b>
        <div class="small muted">${installEvt ? 'Opens like a regular app and works offline.' : isIOS ? 'Tap the Share button <b>⬆︎</b>, then <b>Add to Home Screen</b>.' : 'Open your browser menu and choose <b>Install app</b> or <b>Add to Home screen</b>.'}</div>
      </div>
      ${installEvt ? `<button class="btn small" data-action="install">Install</button>` : `<button class="close" data-action="dismiss-install" aria-label="Dismiss">✕</button>`}
    </div>`;
  }

  return `
    <div class="hero">
      <h1>${hello}${name}! 👋</h1>
      <p>Thinking about buying something? Find out if it’s really worth it in under a minute.</p>
      <button class="btn" data-action="start-test">🧪 Take the Regret Test</button>
    </div>
    <div class="stats">
      <div class="stat pink"><b>${wish.length}</b><small>On wishlist</small></div>
      <div class="stat purple"><b>${money(spent)}</b><small>Spent this month</small></div>
      <div class="stat teal"><b>${money(saved)}</b><small>Saved by skipping</small></div>
    </div>
    ${budget ? `<div class="card">
      <div class="row" style="justify-content:space-between;margin-bottom:8px"><b>Monthly budget</b><span class="small muted">${money(spent)} of ${money(budget)}</span></div>
      <div class="progress ${spent > budget ? 'over' : ''}"><i style="width:${pct}%"></i></div>
      <div class="small muted" style="margin-top:6px">${spent > budget ? `You’re ${money(spent - budget)} over budget this month.` : `${money(budget - spent)} left to spend this month.`}</div>
    </div>` : ''}
    ${install}
    <div class="section-title">🔥 Hot on the boards <button data-action="tab" data-to="community">See all</button></div>
    ${trending.map(postCard).join('')}
    <div class="section-title">🕒 Recently added <button data-action="tab" data-to="items">My stuff</button></div>
    ${recent.length ? recent.map(itemRow).join('') : `<div class="card empty"><div class="big">🛍️</div><b>Nothing here yet</b>Take the Regret Test on something you’re eyeing and it’ll show up here.</div>`}
  `;
}

// ---------------------------------------------------------------- REGRET TEST
function viewTest() {
  const qs = test.category ? questionsFor(test.category) : [];
  const total = qs.length + 1;
  const steps = `<div class="steps">${Array.from({ length: total }, (_, i) => `<i class="${i < test.step || test.result ? 'done' : ''}"></i>`).join('')}</div>`;

  if (test.result) return viewResult();

  if (test.step === 0) {
    const isSub = test.category === 'subs';
    return `
      ${steps}
      <div class="q-title">What are you thinking of buying?</div>
      <p class="q-hint">A product, a meal out, a trip, a subscription — anything.</p>
      <form data-form="test-basics" autocomplete="off">
        <label class="field"><span>What is it?</span>
          <input class="input" name="name" required maxlength="80" placeholder="e.g. Viral lip oil" value="${esc(test.name)}"></label>
        <div class="field"><span style="display:block;font-weight:700;font-size:14px;margin-bottom:6px">Category</span>
          <div class="chips wrap">${CATS.map(c => `<button type="button" class="chip ${test.category === c.id ? 'on' : ''}" data-action="test-cat" data-cat="${c.id}">${c.e} ${c.label}</button>`).join('')}</div>
        </div>
        <label class="field"><span>${isSub ? 'Cost per year' : 'Price'}</span>
          <div class="money"><input class="input" name="price" type="number" inputmode="decimal" min="0" step="0.01" required placeholder="0.00" value="${esc(test.price)}"></div>
          ${isSub ? '<small class="muted">For subscriptions, enter the yearly total (monthly × 12).</small>' : ''}</label>
        ${!S.profile.budget ? `<label class="field"><span>Your monthly “fun money” budget</span>
          <div class="money"><input class="input" name="budget" type="number" inputmode="decimal" min="0" placeholder="e.g. 300"></div>
          <small class="muted">Optional. Used to check if the price fits.</small></label>` : ''}
        <label class="field"><span>Photo (optional)</span>
          <div class="photo-pick">📷 ${test.photo ? 'Change photo' : 'Snap or choose a photo'}<input type="file" accept="image/*" data-photo="test"></div>
          ${test.photo ? `<img class="photo-preview" src="${test.photo}" alt="">` : ''}</label>
        <button class="btn block" type="submit">Start the test →</button>
      </form>`;
  }

  const q = qs[test.step - 1];
  const chosen = test.answers[q.id];
  return `
    ${steps}
    <button class="backlink" data-action="test-back">← Back</button>
    <div class="small muted" style="font-weight:700">${cat(test.category).e} ${esc(test.name)} · ${money(+test.price)}</div>
    <div class="q-title" style="margin-top:6px">${q.q}</div>
    <p class="q-hint">${q.hint}</p>
    ${q.opts.map((o, i) => `<button class="opt ${chosen === i ? 'on' : ''}" data-action="answer" data-i="${i}"><span class="e">${o[3]}</span><span>${o[0]}</span></button>`).join('')}
  `;
}

function ringSvg(score, cls) {
  const r = 78, c = 2 * Math.PI * r, off = c * (1 - score / 100);
  const color = { good: 'var(--good)', mid: 'var(--mid)', bad: 'var(--bad)' }[cls];
  return `<div class="ring"><svg width="180" height="180" viewBox="0 0 180 180" aria-hidden="true">
      <circle cx="90" cy="90" r="${r}" fill="none" stroke="#f1f5ea" stroke-width="18"/>
      <circle cx="90" cy="90" r="${r}" fill="none" stroke="${color}" stroke-width="18" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${off}"/>
    </svg><div class="num"><div>${score}<small>out of 100</small></div></div></div>`;
}

function viewResult() {
  const r = test.result, v = verdict(r.score);
  const once = cat(test.category).once;
  // tips for the weakest answers
  const weak = [];
  const qs = questionsFor(test.category);
  for (const q of qs) {
    if (!q.max) continue;
    const o = q.opts[test.answers[q.id]];
    if (o && o[1] / q.max < 0.5) weak.push(TIPS[q.id]);
  }
  const bp = budgetPoints(+test.price, S.profile.budget);
  if (bp.pct != null && bp.pts < 10) weak.push(TIPS.budget);
  const saved = test.savedId && S.items.find(i => i.id === test.savedId);

  return `
    <div class="card score-wrap">
      ${ringSvg(r.score, v.cls)}
      <div class="verdict ${v.cls}">${v.e} ${v.title}</div>
      <p class="muted" style="margin:4px 0 0">${v.text}</p>
    </div>
    <div class="kv">
      <div><small>Price</small><b>${money(+test.price)}</b></div>
      <div><small>${once ? 'Per experience' : 'Est. cost per use'}</small><b>${cents(r.cpu)}</b></div>
      ${!once ? `<div><small>Expected uses</small><b>${r.expectedUses.toLocaleString()}</b></div>
      <div><small>Lasts about</small><b>${r.years} yr${r.years === 1 ? '' : 's'}</b></div>` : ''}
    </div>
    <div class="card">
      <h3 style="margin-bottom:4px">How your score was calculated</h3>
      <p class="small muted" style="margin:0 0 6px">Every point comes from your answers. Nothing hidden.</p>
      <ul class="breakdown">${r.rows.map(row => `<li><div class="grow"><b>${row.label}</b><div class="small muted">${esc(row.answer)}</div>
        <div class="minibar"><i style="width:${(row.pts / row.max) * 100}%"></i></div></div><div class="pts">${row.pts}/${row.max}</div></li>`).join('')}</ul>
    </div>
    ${weak.length ? `<div class="section-title">💡 Before you buy</div>${weak.map(t => `<div class="tip">${t}</div>`).join('')}` : ''}
    <div class="section-title">What will you do?</div>
    ${saved ? `<div class="card center"><b>Saved to “${saved.status === 'wishlist' ? 'Wishlist' : saved.status === 'bought' ? 'Bought' : 'Skipped'}”</b> ✓
      <div class="btn-row" style="margin-top:12px"><button class="btn ghost small" data-action="open-item" data-id="${saved.id}">View item</button><button class="btn small" data-action="new-test">Test something else</button></div></div>`
    : `<div class="btn-row" style="margin-bottom:10px">
        <button class="btn green" data-action="save-test" data-status="bought">🛍️ I bought it</button>
        <button class="btn purple" data-action="save-test" data-status="wishlist">💖 Wishlist it</button>
      </div>
      <div class="btn-row">
        <button class="btn ghost" data-action="save-test" data-status="skipped">🙅 Skip it</button>
        <button class="btn ghost" data-action="ask-community">💬 Ask others</button>
      </div>
      <button class="backlink" style="width:100%;margin-top:8px" data-action="new-test">Start over</button>`}
  `;
}

// ---------------------------------------------------------------- MY STUFF
function itemRow(it) {
  const sub = it.status === 'bought'
    ? `${money(it.price)} · ${it.uses || 0} use${it.uses === 1 ? '' : 's'} · ${cents(itemCpu(it))}/use`
    : `${money(it.price)} · ${cat(it.category).label}`;
  return `<button class="item" data-action="open-item" data-id="${it.id}">
    ${thumb(it)}
    <div class="grow"><h3 class="ellipsis">${esc(it.name)}</h3><div class="meta">${sub}</div></div>
    <div class="badge ${scoreCls(it.score)}">${it.score == null ? 'no test' : it.score}</div>
  </button>`;
}

function viewItems() {
  const segs = [['wishlist', '💖 Wishlist'], ['bought', '🛍️ Bought'], ['skipped', '🙅 Skipped']];
  const list = S.items.filter(i => i.status === itemsSeg).sort((a, b) => b.createdAt - a.createdAt);
  const total = list.reduce((a, i) => a + i.price, 0);
  const empty = {
    wishlist: ['💖', 'Your wishlist is empty', 'Add things you’re eyeing, then wait a bit before you buy. Wants that last are usually worth it.'],
    bought: ['🛍️', 'No purchases logged', 'Log what you buy and tap “+1 use” each time you use it to watch the cost per use drop.'],
    skipped: ['🙅', 'Nothing skipped yet', 'Every time you skip the hype, the money you kept shows up here.'],
  }[itemsSeg];
  return `
    <div class="seg">${segs.map(([k, l]) => `<button class="${itemsSeg === k ? 'on' : ''}" data-action="items-seg" data-seg="${k}">${l}</button>`).join('')}</div>
    ${list.length ? `<div class="small muted" style="margin:0 4px 10px;font-weight:700">${list.length} item${list.length === 1 ? '' : 's'} · ${money(total)} ${itemsSeg === 'skipped' ? 'kept in your pocket 🎉' : 'total'}</div>` : ''}
    ${list.length ? list.map(itemRow).join('') : `<div class="card empty"><div class="big">${empty[0]}</div><b>${empty[1]}</b>${empty[2]}</div>`}
    <button class="fab" data-action="add-item" aria-label="Add an item">+</button>
  `;
}

// ---------------------------------------------------------------- SPENDING
function viewSpend() {
  const budget = S.profile.budget || 0;
  const months = [];
  for (let o = 5; o >= 0; o--) {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - o);
    months.push({ label: d.toLocaleDateString(undefined, { month: 'short' }), total: monthSpend(o) });
  }
  const bought = S.items.filter(i => i.status === 'bought');
  const skipped = S.items.filter(i => i.status === 'skipped');
  const all = bought.reduce((a, i) => a + i.price, 0);
  const saved = skipped.reduce((a, i) => a + i.price, 0);
  const avg = months.reduce((a, m) => a + m.total, 0) / 6;

  // categories
  const byCat = {};
  bought.forEach(i => byCat[i.category] = (byCat[i.category] || 0) + i.price);
  const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const catMax = cats.length ? cats[0][1] : 1;

  // cost per use ranking
  const used = bought.filter(i => !cat(i.category).once);
  const best = [...used].sort((a, b) => itemCpu(a) - itemCpu(b)).slice(0, 3);
  const worst = [...used].filter(i => !best.includes(i)).sort((a, b) => itemCpu(b) - itemCpu(a)).slice(0, 3);

  return `
    <div class="stats">
      <div class="stat purple"><b>${money(monthSpend())}</b><small>This month</small></div>
      <div class="stat pink"><b>${money(avg)}</b><small>Monthly avg</small></div>
      <div class="stat teal"><b>${money(saved)}</b><small>Saved</small></div>
    </div>
    <div class="card">
      <div class="row" style="justify-content:space-between"><h3>Last 6 months</h3>${budget ? `<span class="small muted">- - budget ${money(budget)}</span>` : ''}</div>
      ${barChart(months, budget)}
    </div>
    <div class="card">
      <h3 style="margin-bottom:12px">Where it goes</h3>
      ${cats.length ? cats.map(([c, v]) => `<div class="catbar"><div class="row"><span>${cat(c).e} ${cat(c).label}</span><span>${money(v)} · ${Math.round(v / all * 100)}%</span></div>
        <div class="progress"><i style="width:${(v / catMax) * 100}%"></i></div></div>`).join('')
      : `<div class="empty" style="padding:12px"><b>No purchases yet</b>Mark something as “bought” to see your spending by category.</div>`}
    </div>
    ${best.length ? `<div class="card">
      <h3>🏆 Best value (lowest cost per use)</h3>
      ${best.map(i => cpuRow(i)).join('')}
    </div>` : ''}
    ${worst.length ? `<div class="card">
      <h3>🫠 Not pulling their weight</h3>
      <p class="small muted" style="margin:4px 0 0">Use these more and tap “+1 use” to bring the cost down.</p>
      ${worst.map(i => cpuRow(i)).join('')}
    </div>` : ''}
    <div class="card row">
      <div style="font-size:34px">🐷</div>
      <div class="grow"><b>${money(saved)} saved by skipping the hype</b>
      <div class="small muted">${skipped.length} thing${skipped.length === 1 ? '' : 's'} you decided weren’t worth it. All-time spending logged: ${money(all)}.</div></div>
    </div>
  `;
}
function cpuRow(i) {
  return `<button class="item" style="box-shadow:none;padding:8px 0;margin:0;border-bottom:1px solid var(--line);border-radius:0" data-action="open-item" data-id="${i.id}">
    ${thumb(i, 44)}<div class="grow"><b class="ellipsis" style="display:block">${esc(i.name)}</b><div class="meta">${i.uses || 0} uses · paid ${money(i.price)}</div></div>
    <b>${cents(itemCpu(i))}</b></button>`;
}
function barChart(months, budget) {
  const W = 320, H = 180, pad = 26, bw = 30;
  const max = Math.max(budget, ...months.map(m => m.total), 10) * 1.15;
  const gap = (W - pad * 2) / months.length;
  const y = v => H - 24 - (v / max) * (H - 50);
  let bars = '';
  months.forEach((m, i) => {
    const x = pad + i * gap + (gap - bw) / 2;
    const top = y(m.total), h = Math.max(m.total ? 3 : 0, H - 24 - top);
    const last = i === months.length - 1;
    const over = budget && m.total > budget;
    bars += `<rect x="${x}" y="${H - 24 - h}" width="${bw}" height="${h}" rx="8" fill="${over ? '#f0442b' : last ? 'url(#g)' : '#b9e5a0'}"/>
      <text x="${x + bw / 2}" y="${H - 6}" text-anchor="middle" font-size="11" font-weight="700" fill="#6c7a68">${m.label}</text>
      ${m.total ? `<text x="${x + bw / 2}" y="${H - 30 - h}" text-anchor="middle" font-size="10" font-weight="800" fill="#1d2b1f">${m.total >= 1000 ? '$' + (m.total / 1000).toFixed(1) + 'k' : '$' + Math.round(m.total)}</text>` : ''}`;
  });
  const bl = budget ? `<line x1="${pad - 6}" x2="${W - pad + 6}" y1="${y(budget)}" y2="${y(budget)}" stroke="#ff6b1a" stroke-width="2" stroke-dasharray="5 5"/>` : '';
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Spending per month for the last six months">
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff6b1a"/><stop offset="1" stop-color="#ffa62b"/></linearGradient></defs>
    <line x1="${pad - 6}" x2="${W - pad + 6}" y1="${H - 24}" y2="${H - 24}" stroke="#e9eee0"/>
    ${bars}${bl}</svg>`;
}

// ---------------------------------------------------------------- COMMUNITY
function postCard(p) {
  const voteLabel = { worth: '✅ Worth it', overhyped: '🚫 Overhyped', ask: '🤔 Asking' }[p.vote];
  return `<div class="post">
    <div class="post-head"><div class="pav">${face(p)}</div><div class="grow"><b>${esc(p.author)}</b>${p.mine ? '' : ''}<small>${cat(p.category).e} ${cat(p.category).label} · ${ago(p.at)}</small></div>
      <span class="tag ${p.vote}">${voteLabel}</span></div>
    <div class="item-name">${esc(p.item)}</div>
    <p>${esc(p.text)}</p>
    ${p.photo ? `<img src="${p.photo}" alt="Photo of ${esc(p.item)}">` : ''}
    <div class="post-actions">
      <button class="${p.liked ? 'on' : ''}" data-action="like" data-id="${p.id}">${p.liked ? '❤️' : '🤍'} ${p.likes}</button>
      <button data-action="open-post" data-id="${p.id}">💬 ${p.comments.length} ${p.comments.length === 1 ? 'comment' : 'comments'}</button>
      ${p.sample ? '<span class="tag sample" style="margin-left:auto;align-self:center">sample</span>' : ''}
    </div>
  </div>`;
}

function viewCommunity() {
  const unread = unreadCount();
  const segs = [['boards', '📌 Boards'], ['messages', `💬 Messages${unread ? ` <span class="seg-badge">${unread}</span>` : ''}`], ['people', '👯 People']];
  let body = '';
  if (commSeg === 'boards') {
    const posts = S.posts.filter(p => boardCat === 'all' || p.category === boardCat).sort((a, b) => b.at - a.at);
    body = `
      <div class="chips"><button class="chip ${boardCat === 'all' ? 'on' : ''}" data-action="board-cat" data-cat="all">All</button>
        ${CATS.map(c => `<button class="chip ${boardCat === c.id ? 'on' : ''}" data-action="board-cat" data-cat="${c.id}">${c.e} ${c.label}</button>`).join('')}</div>
      ${posts.length ? posts.map(postCard).join('') : `<div class="card empty"><div class="big">📭</div><b>No posts in this board yet</b>Be the first — tap + to share an opinion.</div>`}
      <button class="fab" data-action="new-post" aria-label="New post">+</button>`;
  } else if (commSeg === 'messages') {
    body = viewInbox();
  } else {
    body = SAMPLE_MEMBERS.map(m => {
      const f = S.following.includes(m.id);
      const n = S.posts.filter(p => p.author === m.name).length;
      return `<div class="card row"><div class="pav" style="width:52px;height:52px;font-size:28px">${m.e}</div>
        <div class="grow"><b>${m.name}</b><div class="small muted">${m.bio}</div><div class="small muted">${n} post${n === 1 ? '' : 's'}</div></div>
        <div class="person-btns"><button class="btn small" data-action="open-thread" data-id="${m.id}" aria-label="Message ${m.name}">💬 Message</button>
        <button class="btn small ghost" data-action="follow" data-id="${m.id}">${f ? '✓ Following' : '+ Follow'}</button></div></div>`;
    }).join('');
  }
  return `
    <div class="seg">${segs.map(([k, l]) => `<button class="${commSeg === k ? 'on' : ''}" data-action="comm-seg" data-seg="${k}">${l}</button>`).join('')}</div>
    ${commSeg === 'people' || (commSeg === 'boards' && !localStorage.getItem('wth-demo-ok')) ? `<div class="notice">👋 The community is in preview: posts, messages and sample members live on this phone only.${commSeg === 'boards' ? ' <button style="font-weight:800;text-decoration:underline" data-action="demo-ok">Got it</button>' : ''}</div>` : ''}
    ${body}`;
}

// ---------------------------------------------------------------- MESSAGES
// Private 1-to-1 chats (S.dms, keyed by member id) plus the public Hype Room (S.chat).
const member = id => SAMPLE_MEMBERS.find(m => m.id === id);
function isUnread(id) {
  const msgs = S.dms[id] || [];
  const last = msgs[msgs.length - 1];
  return !!last && !last.mine && last.at > (S.dmRead[id] || 0);
}
function unreadCount() { return Object.keys(S.dms || {}).filter(isUnread).length; }
function shortTime(t) {
  const d = new Date(t), now = new Date();
  const days = Math.floor((new Date(now.toDateString()) - new Date(d.toDateString())) / DAY);
  if (days === 0) return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  if (days === 1) return 'Yesterday';
  if (days < 7) return d.toLocaleDateString(undefined, { weekday: 'long' });
  return d.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric', year: '2-digit' });
}
function stampTime(t) {
  const d = new Date(t), days = Math.floor((new Date(new Date().toDateString()) - new Date(d.toDateString())) / DAY);
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const day = days === 0 ? 'Today' : days === 1 ? 'Yesterday' : days < 7 ? d.toLocaleDateString(undefined, { weekday: 'long' }) : d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  return `<b>${day}</b> ${time}`;
}
function convoRow(id, name, e, last, unread, preview) {
  return `<button class="convo ${unread ? 'unread' : ''}" data-action="open-thread" data-id="${id}">
    <span class="udot" aria-label="${unread ? 'Unread' : ''}"></span>
    <div class="pav">${e}</div>
    <div class="grow"><div class="top-line"><b class="ellipsis">${esc(name)}</b><span class="time">${last ? shortTime(last.at) : ''} ›</span></div>
      <div class="preview">${esc(preview)}</div></div></button>`;
}
function viewInbox() {
  const dms = SAMPLE_MEMBERS.filter(m => (S.dms[m.id] || []).length)
    .map(m => ({ m, last: S.dms[m.id][S.dms[m.id].length - 1] }))
    .sort((a, b) => b.last.at - a.last.at);
  const roomLast = S.chat[S.chat.length - 1];
  return `
    <div class="inbox-head"><div><h3>Messages</h3><div class="small muted">🔒 Private chats are only between you and them</div></div>
      <button class="compose" data-action="compose" aria-label="New message">✏️</button></div>
    <div class="inbox-label">🔒 Private</div>
    <div class="inbox">${dms.length ? dms.map(({ m, last }) => convoRow(m.id, m.name, m.e, last, isUnread(m.id), (last.mine ? 'You: ' : '') + msgPreview(last))).join('')
      : `<div class="empty" style="padding:22px"><b>No private chats yet</b>Tap ✏️ to message someone one-on-one.</div>`}</div>
    <div class="inbox-label">🌍 Public group</div>
    <div class="inbox">${convoRow('room', 'Hype Room', '🌍', roomLast, false, roomLast ? `${roomLast.mine ? 'You' : roomLast.author}: ${msgPreview(roomLast)}` : 'Say hi to everyone')}</div>`;
}
const EMOJI = {
  'Faces': '😀 😂 🥹 😍 🥰 😘 😎 🤩 🥳 😅 😭 😱 🤯 😴 🙄 😬 🤔 🫠 😤 🥺 😇 🤭 🫣 💀'.split(' '),
  'Reactions': '👍 👎 👏 🙌 🙏 💪 👀 🔥 ✨ 💯 ❤️ 🧡 💚 🤎 💔 ✅ ❌ ‼️ ❓ 🎉'.split(' '),
  'Shopping': '🛍️ 💸 💰 💳 🧾 🏷️ 🤑 📦 🎁 💄 👗 👟 👜 🕶️ 🎧 📱 🛋️ 🍜 ☕ ✈️ 🏝️ 🎟️ 📺 🌿'.split(' '),
};
const STICKERS = [
  { id: 'worth', e: '💸', t: 'WORTH IT' },
  { id: 'hype', e: '🔥', t: 'SO HYPED' },
  { id: 'nope', e: '🙅', t: 'NOPE' },
  { id: 'money', e: '🤑', t: 'TAKE MY MONEY' },
  { id: 'regret', e: '😭', t: 'INSTANT REGRET' },
  { id: 'skip', e: '😴', t: 'SKIP IT' },
  { id: 'treat', e: '🎁', t: 'TREAT YOURSELF' },
  { id: 'obsessed', e: '✨', t: 'OBSESSED' },
];
const sticker = id => STICKERS.find(x => x.id === id) || STICKERS[0];
const stickerHtml = st => `<div class="stk stk-${st.id}"><span class="stk-e">${st.e}</span><b>${st.t}</b><i>GIF</i></div>`;
function isJumbo(t) {
  if (!t || /[A-Za-z0-9]/.test(t)) return false;
  const pics = t.match(/\p{Extended_Pictographic}/gu) || [];
  return pics.length >= 1 && pics.length <= 3 && /^[\p{Extended_Pictographic}\p{Emoji_Component}‍️\s]+$/u.test(t);
}
function msgPreview(m) {
  if (m.kind === 'sticker') return `GIF: ${sticker(m.sticker).t}`;
  if (m.kind === 'media') return m.gif ? 'GIF' : '📷 Photo';
  return m.text;
}
const timeOnly = t => new Date(t).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
let tray = null;          // null | 'emoji' | 'gif'
const msgDraft = {};      // unsent text per conversation

function bubbles(msgs, group) {
  const who = x => x.mine ? '~me' : (x.author || 'them');
  const lastMine = [...msgs].reverse().find(x => x.mine);
  let html = '';
  msgs.forEach((m, i) => {
    const prev = msgs[i - 1], next = msgs[i + 1];
    const newTime = !prev || m.at - prev.at > 30 * 60000;
    if (newTime) html += `<div class="stamp">${stampTime(m.at)}</div>`;
    const starts = newTime || who(prev) !== who(m);
    const ends = !next || who(next) !== who(m) || next.at - m.at > 30 * 60000;
    if (group && !m.mine && starts) html += `<div class="sender">${m.e || ''} ${esc(m.author)}</div>`;
    const side = m.mine ? 'me' : 'them';
    if (m.kind === 'sticker') html += `<div class="msg-free ${side}">${stickerHtml(sticker(m.sticker))}</div>`;
    else if (m.kind === 'media') html += `<div class="msg-free ${side}"><img class="msg-media" src="${m.src}" alt="${m.gif ? 'GIF' : 'Photo'}"></div>`;
    else if (isJumbo(m.text)) html += `<div class="msg-free jumbo ${side}">${esc(m.text)}</div>`;
    else html += `<div class="msg ${side}${ends ? ' tail' : ''}">${esc(m.text)}</div>`;
    if (m === lastMine) html += `<div class="receipt">${!group && m.readAt ? `<b>Read</b> ${timeOnly(m.readAt)}` : 'Delivered'}</div>`;
  });
  return html;
}
function sheetThread(id) {
  const room = id === 'room';
  const m = room ? null : member(id);
  if (!room && !m) return null;
  const msgs = room ? S.chat : (S.dms[id] || []);
  const name = room ? 'Hype Room' : m.name;
  return {
    full: true, title: name,
    body: `
      <header class="thread-top">
        <button class="back" data-action="close" aria-label="Back to messages">‹</button>
        <div class="who"><div class="pav">${room ? '🌍' : m.e}</div><span>${esc(name)}</span></div>
        <span></span>
      </header>
      <div class="thread-body">
        <div class="thread-note">${room ? '🌍 Public group · everyone in the community can read this' : `🔒 Private · only you and ${esc(m.name)} can see this chat`}</div>
        ${msgs.length ? bubbles(msgs, room) : `<div class="thread-empty"><div class="pav">${m.e}</div><b>${esc(m.name)}</b><span>${esc(m.bio)}</span></div>`}
      </div>
      ${tray === 'emoji' ? `<div class="tray" aria-label="Emoji">
          ${(S.recentEmoji || []).length ? `<div class="tray-h">Recently used</div><div class="emoji-grid">${S.recentEmoji.map(x => `<button type="button" data-action="emoji" data-e="${x}">${x}</button>`).join('')}</div>` : ''}
          ${Object.entries(EMOJI).map(([h, list]) => `<div class="tray-h">${h}</div><div class="emoji-grid">${list.map(x => `<button type="button" data-action="emoji" data-e="${x}">${x}</button>`).join('')}</div>`).join('')}
        </div>` : ''}
      ${tray === 'gif' ? `<div class="tray" aria-label="GIFs">
          <label class="gif-upload">📷 Send a GIF or photo from your phone<input type="file" accept="image/*" data-dm-media="${id}"></label>
          <div class="tray-h">Hype GIFs</div>
          <div class="stk-grid">${STICKERS.map(st => `<button type="button" data-action="send-sticker" data-s="${st.id}" aria-label="Send ${st.t} GIF">${stickerHtml(st)}</button>`).join('')}</div>
        </div>` : ''}
      <form class="imsg-composer" data-form="dm" data-id="${id}" autocomplete="off">
        <div class="composer-row">
          <button type="button" class="cbtn ${tray === 'emoji' ? 'on' : ''}" data-action="tray" data-t="emoji" aria-label="Emoji" aria-pressed="${tray === 'emoji'}">😊</button>
          <button type="button" class="cbtn gif ${tray === 'gif' ? 'on' : ''}" data-action="tray" data-t="gif" aria-label="GIFs" aria-pressed="${tray === 'gif'}">GIF</button>
          <div class="field-wrap"><input name="text" maxlength="500" data-draft="${id}" value="${esc(msgDraft[id] || '')}" placeholder="${room ? 'Message the room' : 'Message'}" aria-label="Message ${esc(name)}" enterkeyhint="send">
          <button class="send" type="submit" aria-label="Send">↑</button></div>
        </div>
      </form>`,
  };
}
function sheetCompose() {
  return {
    title: 'New message',
    body: `<p class="muted small" style="margin-top:0">🔒 Private messages are only between you and the person you pick.</p>
      <div class="inbox">${SAMPLE_MEMBERS.map(m => `<button class="convo" data-action="open-thread" data-id="${m.id}"><span class="udot"></span><div class="pav">${m.e}</div>
        <div class="grow"><b>${m.name}</b><div class="preview">${esc(m.bio)}</div></div></button>`).join('')}</div>`,
  };
}

function sendMsg(id, fields) {
  const msg = { id: uid(), mine: true, author: S.profile.name || 'You', e: S.profile.e, at: Date.now(), ...fields };
  if (id === 'room') S.chat.push(msg);
  else {
    (S.dms[id] = S.dms[id] || []).push(msg); S.dmRead[id] = Date.now();
    // Sample members "open" your message a few seconds later so you can see read receipts in action.
    // With a real server this would come from the other person's phone.
    setTimeout(() => {
      const list = S.dms[id]; if (!list) return;
      const t = Date.now(); let changed = false;
      list.forEach(x => { if (x.mine && !x.readAt) { x.readAt = t; changed = true; } });
      if (!changed) return;
      save();
      if (sheet && sheet.type === 'thread' && sheet.id === id) renderSheet();
    }, 2500 + Math.random() * 2500);
  }
  save(); buzz(8);
}

// ---------------------------------------------------------------- SHEETS
let sheet = null; // { type, id }
function openSheet(type, id) { sheet = { type, id }; renderSheet(); }
function closeSheet() { sheet = null; $('#sheet-root').innerHTML = ''; document.body.style.overflow = ''; }
function renderSheet() {
  const root = $('#sheet-root');
  const fn = { item: sheetItem, post: sheetPost, newPost: sheetNewPost, addItem: sheetAddItem, profile: sheetProfile, thread: sheetThread, compose: sheetCompose }[sheet.type];
  const out = fn && fn(sheet.id);
  if (!out) return closeSheet();
  if (out.full) {
    const typed = root.querySelector('.imsg-composer input');
    const keep = typed && (document.activeElement === typed || document.activeElement?.classList.contains('send'));
    const entering = !root.querySelector('.thread');
    root.innerHTML = `<div class="thread${entering ? ' enter' : ''}" role="dialog" aria-modal="true" aria-label="${esc(out.title)}">${out.body}</div>`;
    const body = root.querySelector('.thread-body');
    body.scrollTop = body.scrollHeight;
    if (keep) root.querySelector('.imsg-composer input').focus();
    document.body.style.overflow = 'hidden';
    return;
  }
  const prevScroll = root.querySelector('.sheet')?.scrollTop || 0;
  const focused = document.activeElement && root.contains(document.activeElement) ? document.activeElement.name : null;
  root.innerHTML = `<div class="overlay" data-action="overlay"><div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(out.title)}">
    <div class="grabber"></div>
    <div class="sheet-head"><h2>${out.title}</h2><button class="close" data-action="close" aria-label="Close">✕</button></div>
    ${out.body}</div></div>`;
  root.querySelector('.sheet').scrollTop = prevScroll;
  if (focused) root.querySelector(`[name="${focused}"]`)?.focus();
  document.body.style.overflow = 'hidden';
}

function sheetItem(id) {
  const it = S.items.find(i => i.id === id);
  if (!it) return null;
  const once = cat(it.category).once;
  const cpu = itemCpu(it);
  const alts = it.alts || [];
  const cheapest = alts.length ? alts.reduce((a, b) => (b.price < a.price ? b : a)) : null;
  const v = it.score != null ? verdict(it.score) : null;
  return {
    title: esc(it.name),
    body: `
      ${it.photo ? `<img class="hero-img" src="${it.photo}" alt="">` : ''}
      <div class="row" style="margin-bottom:12px">
        <div class="badge ${scoreCls(it.score)}">${it.score ?? '–'}</div>
        <div class="grow">${v ? `<b class="verdict ${v.cls}" style="font-size:18px">${v.e} ${v.title}</b>` : '<b>Not tested yet</b>'}
          <div class="small muted">${cat(it.category).e} ${cat(it.category).label} · added ${ago(it.createdAt)}</div></div>
      </div>
      <div class="kv">
        <div><small>Price</small><b>${money(it.price)}</b></div>
        <div><small>${it.status === 'bought' && it.uses ? 'Cost per use (real)' : 'Cost per use (est.)'}</small><b>${cents(cpu)}</b></div>
        ${it.status === 'bought' && !once ? `<div><small>Times used</small><b>${it.uses || 0}</b></div><div><small>Goal</small><b>${(it.expectedUses || 1).toLocaleString()}</b></div>` : ''}
      </div>
      ${it.status === 'bought' && !once ? `<button class="btn block purple" data-action="use" data-id="${it.id}" style="margin-bottom:8px">➕ I used it today</button>
        ${it.uses ? `<button class="backlink" style="width:100%" data-action="unuse" data-id="${it.id}">Undo last use</button>` : ''}` : ''}

      ${it.score == null && it.status !== 'bought' ? `<button class="btn block" data-action="test-item" data-id="${it.id}" style="margin-bottom:14px">🧪 Take the Regret Test on this</button>` : ''}

      <div class="card">
        <h3>🔍 Compare alternatives</h3>
        <p class="small muted" style="margin:4px 0 8px">Found a dupe or a cheaper option? Add it to see the difference.</p>
        ${alts.map((a, i) => `<div class="alt"><div class="grow"><b>${esc(a.name)}</b><div class="small ${a.price < it.price ? '' : 'muted'}" style="${a.price < it.price ? 'color:var(--good);font-weight:700' : ''}">
          ${a.price < it.price ? `Save ${money(it.price - a.price)} (${Math.round((1 - a.price / it.price) * 100)}% less)` : a.price > it.price ? `${money(a.price - it.price)} more` : 'Same price'}</div></div>
          <b>${money(a.price)}</b><button class="x" data-action="del-alt" data-id="${it.id}" data-i="${i}" aria-label="Remove ${esc(a.name)}">✕</button></div>`).join('')}
        ${cheapest && cheapest.price < it.price ? `<div class="tip" style="margin-top:8px">💸 Going with <b>${esc(cheapest.name)}</b> keeps <b>${money(it.price - cheapest.price)}</b> in your pocket.</div>` : ''}
        <form data-form="alt" data-id="${it.id}" class="row" style="margin-top:10px;gap:8px" autocomplete="off">
          <input class="input grow" name="name" required maxlength="60" placeholder="Alternative" style="min-width:0">
          <div class="money" style="width:110px"><input class="input" name="price" type="number" inputmode="decimal" min="0" step="0.01" required placeholder="0"></div>
          <button class="btn small" type="submit" aria-label="Add alternative" style="min-height:50px">Add</button>
        </form>
      </div>

      ${it.status === 'bought' ? `<div class="card">
        <h3>⭐ Your review</h3>
        <div class="stars" style="margin:6px 0">${[1, 2, 3, 4, 5].map(n => `<button class="${(it.rating || 0) >= n ? 'on' : ''}" data-action="rate" data-id="${it.id}" data-n="${n}" aria-label="${n} star${n > 1 ? 's' : ''}">⭐</button>`).join('')}</div>
        <form data-form="review" data-id="${it.id}">
          <textarea class="input" name="review" maxlength="500" placeholder="Was it worth it? Be honest.">${esc(it.review || '')}</textarea>
          <div class="btn-row" style="margin-top:8px"><button class="btn small ghost" type="submit">Save review</button>
          <button class="btn small" type="button" data-action="share-review" data-id="${it.id}">Share to boards</button></div>
        </form>
      </div>` : ''}

      <div class="section-title" style="margin-top:6px">Move to</div>
      <div class="btn-row" style="margin-bottom:12px">
        ${it.status !== 'bought' ? `<button class="btn green small" data-action="status" data-id="${it.id}" data-status="bought">🛍️ Bought</button>` : ''}
        ${it.status !== 'wishlist' ? `<button class="btn purple small" data-action="status" data-id="${it.id}" data-status="wishlist">💖 Wishlist</button>` : ''}
        ${it.status !== 'skipped' ? `<button class="btn ghost small" data-action="status" data-id="${it.id}" data-status="skipped">🙅 Skipped</button>` : ''}
      </div>
      <button class="btn red block" data-action="del-item" data-id="${it.id}">Delete item</button>`,
  };
}

function sheetAddItem() {
  return {
    title: 'Add an item',
    body: `<form data-form="add-item" autocomplete="off">
      <label class="field"><span>What is it?</span><input class="input" name="name" required maxlength="80" placeholder="e.g. Running shoes"></label>
      <label class="field"><span>Category</span><select class="input" name="category">${CATS.map(c => `<option value="${c.id}">${c.e} ${c.label}</option>`).join('')}</select></label>
      <label class="field"><span>Price</span><div class="money"><input class="input" name="price" type="number" inputmode="decimal" min="0" step="0.01" required placeholder="0.00"></div></label>
      <label class="field"><span>Where does it go?</span><select class="input" name="status">
        <option value="${itemsSeg === 'skipped' ? 'skipped' : 'wishlist'}">${itemsSeg === 'skipped' ? '🙅 Skipped' : '💖 Wishlist'}</option>
        <option value="bought" ${itemsSeg === 'bought' ? 'selected' : ''}>🛍️ Bought</option>
        ${itemsSeg === 'skipped' ? '<option value="wishlist">💖 Wishlist</option>' : '<option value="skipped">🙅 Skipped</option>'}</select></label>
      <label class="field"><span>Photo (optional)</span><div class="photo-pick">📷 Snap or choose a photo<input type="file" accept="image/*" name="photo"></div></label>
      <button class="btn block" type="submit">Add item</button>
      <p class="small muted center">Tip: the <b>Regret Test</b> adds items with a score.</p>
    </form>`,
  };
}

function sheetPost(id) {
  const p = S.posts.find(x => x.id === id);
  if (!p) return null;
  return {
    title: 'Discussion',
    body: `${postCard(p)}
      <div class="card">
        <h3>${p.comments.length} comment${p.comments.length === 1 ? '' : 's'}</h3>
        ${p.comments.map(c => `<div class="comment"><div class="pav">${face(c)}</div><div class="grow"><b>${esc(c.author)}</b> <span class="small muted">${ago(c.at)}</span><p>${esc(c.text)}</p></div></div>`).join('')}
        <form data-form="comment" data-id="${p.id}" class="row" style="margin-top:10px;gap:8px" autocomplete="off">
          <input class="input grow" name="text" required maxlength="300" placeholder="Add your take…" aria-label="Comment">
          <button class="btn small" type="submit" style="min-height:50px">Post</button>
        </form>
      </div>`,
  };
}

let draft = null;
function sheetNewPost() {
  const d = draft;
  return {
    title: 'Share your take',
    body: `<form data-form="post" autocomplete="off">
      <label class="field"><span>What are you talking about?</span><input class="input" name="item" required maxlength="80" placeholder="e.g. That viral water bottle" value="${esc(d.item)}"></label>
      <label class="field"><span>Board</span><select class="input" name="category">${CATS.map(c => `<option value="${c.id}" ${d.category === c.id ? 'selected' : ''}>${c.e} ${c.label}</option>`).join('')}</select></label>
      <div class="field"><span style="display:block;font-weight:700;font-size:14px;margin-bottom:6px">Your verdict</span>
        <div class="chips wrap">${[['worth', '✅ Worth it'], ['overhyped', '🚫 Overhyped'], ['ask', '🤔 Asking']].map(([k, l]) => `<button type="button" class="chip ${d.vote === k ? 'on' : ''}" data-action="draft-vote" data-v="${k}">${l}</button>`).join('')}</div></div>
      <label class="field"><span>Your thoughts</span><textarea class="input" name="text" required maxlength="600" placeholder="What made it worth it — or not?">${esc(d.text)}</textarea></label>
      <label class="field"><span>Photo (optional)</span><div class="photo-pick">📷 ${d.photo ? 'Change photo' : 'Snap or choose a photo'}<input type="file" accept="image/*" data-photo="draft"></div>
        ${d.photo ? `<img class="photo-preview" src="${d.photo}" alt="">` : ''}</label>
      <button class="btn block" type="submit">Post to the board</button>
    </form>`,
  };
}
function syncDraft() {
  const f = $('[data-form="post"]');
  if (!f || !draft) return;
  draft.item = f.item.value; draft.text = f.text.value; draft.category = f.category.value;
}

function sheetProfile() {
  const p = S.profile;
  return {
    title: S.onboarded ? 'You' : 'Welcome! 👋',
    body: `${!S.onboarded ? `<p class="muted" style="margin-top:0">Worth the Hype? helps you decide if something is worth buying — using your own answers, not ads or algorithms. Two quick things and you’re in:</p>` : ''}
      <form data-form="profile" autocomplete="off">
        <label class="field"><span>Your name</span><input class="input" name="name" maxlength="30" placeholder="What should we call you?" value="${esc(p.name)}"></label>
        <div class="field"><span style="display:block;font-weight:700;font-size:14px;margin-bottom:6px">Profile picture</span>
          <div class="pfp-row">
            <div class="pfp">${myFace()}</div>
            <div class="grow">
              <label class="btn small purple pfp-btn">📷 ${p.photo ? 'Change photo' : 'Upload a photo'}<input type="file" accept="image/*" data-pfp></label>
              ${p.photo ? `<button type="button" class="backlink" data-action="remove-pfp">Remove photo, use emoji</button>` : `<div class="small muted" style="margin-top:6px">Or pick an emoji below</div>`}
            </div>
          </div>
          <div class="emoji-pick ${p.photo ? 'dim' : ''}">${AVATARS.map(a => `<button type="button" class="${p.e === a && !p.photo ? 'on' : ''}" data-action="pick-emoji" data-e="${a}" aria-label="Avatar ${a}">${a}</button>`).join('')}</div></div>
        <label class="field"><span>Monthly “fun money” budget</span><div class="money"><input class="input" name="budget" type="number" inputmode="decimal" min="0" value="${p.budget || ''}" placeholder="e.g. 300"></div>
          <small class="muted">What you’re comfortable spending each month on wants, not bills.</small></label>
        ${S.onboarded ? `<label class="toggle-row"><div class="grow"><b>Send read receipts</b><div class="small muted">Let people see when you’ve read their private messages.</div></div>
          <input type="checkbox" name="receipts" ${S.profile.receipts !== false ? 'checked' : ''}><span class="switch" aria-hidden="true"></span></label>` : ''}
        <button class="btn block" type="submit">${S.onboarded ? 'Save' : 'Let’s go! ✨'}</button>
      </form>
      ${S.onboarded ? `<div class="section-title">Your data</div>
      <p class="small muted" style="margin-top:0">Everything is stored on this phone only. Nothing is sent anywhere.</p>
      <div class="btn-row"><button class="btn ghost small" data-action="export">⬇️ Export backup</button>
        <label class="btn ghost small" style="position:relative;overflow:hidden">⬆️ Restore backup<input type="file" accept="application/json,.json" data-import style="position:absolute;inset:0;opacity:0"></label></div>
      <div class="btn-row" style="margin-top:10px"><button class="btn ghost small" data-action="clear-samples">Remove sample posts</button>
        <button class="btn red small" data-action="reset">Erase everything</button></div>` : ''}`,
  };
}

// ---------------------------------------------------------------- actions
const actions = {
  tab: el => go(el.dataset.to),
  profile: () => openSheet('profile'),
  close: () => { closeSheet(); if (!S.onboarded) { S.onboarded = true; save(); } },
  overlay: (el, e) => { if (e.target === el) actions.close(); },
  'start-test': () => { test = newTest(); go('test'); },
  'new-test': () => { test = newTest(); render(); window.scrollTo(0, 0); },
  'test-cat': el => { syncBasics(); test.category = el.dataset.cat; render(); },
  'test-back': () => { test.step = Math.max(0, test.step - 1); render(); },
  answer: el => {
    const qs = questionsFor(test.category);
    const q = qs[test.step - 1];
    test.answers[q.id] = +el.dataset.i;
    buzz(10);
    if (test.step < qs.length) { test.step++; render(); window.scrollTo(0, 0); }
    else {
      test.result = scoreTest({ ...test, price: +test.price }, S.profile.budget);
      buzz(test.result.score >= 75 ? [40, 60, 40, 60, 120] : test.result.score >= 50 ? [60, 80, 60] : [250]);
      render(); window.scrollTo(0, 0);
    }
  },
  'save-test': el => {
    const r = test.result, status = el.dataset.status;
    const existing = test.itemId && S.items.find(i => i.id === test.itemId);
    const data = { name: test.name.trim(), category: test.category, price: +test.price, photo: test.photo, score: r.score,
      expectedUses: r.expectedUses, usesPerYear: r.usesPerYear, years: r.years, status };
    let it;
    if (existing) { it = Object.assign(existing, data); }
    else { it = { id: uid(), uses: 0, alts: [], rating: 0, review: '', createdAt: Date.now(), ...data }; S.items.push(it); }
    stamp(it, status);
    test.savedId = it.id; save(); render();
    toast(status === 'skipped' ? `Nice! ${money(it.price)} saved 🐷` : status === 'bought' ? 'Logged — tap “I used it” to track value' : 'Added to your wishlist 💖');
  },
  'ask-community': () => {
    draft = { item: test.name, category: test.category, vote: 'ask', photo: test.photo,
      text: `Thinking about buying this for ${money(+test.price)}. My Regret Test score: ${test.result.score}/100. Worth it?` };
    openSheet('newPost');
  },
  'items-seg': el => { itemsSeg = el.dataset.seg; render(); },
  'open-item': el => openSheet('item', el.dataset.id),
  'add-item': () => openSheet('addItem'),
  'test-item': el => {
    const it = S.items.find(i => i.id === el.dataset.id);
    closeSheet();
    test = newTest(); Object.assign(test, { name: it.name, category: it.category, price: String(it.price), photo: it.photo, itemId: it.id, step: 1 });
    go('test');
  },
  use: el => {
    const it = S.items.find(i => i.id === el.dataset.id);
    it.uses = (it.uses || 0) + 1; save(); buzz(20);
    toast(`Use #${it.uses} · now ${cents(itemCpu(it))} per use`);
    if (it.uses === it.expectedUses) toast('🎉 You hit your usage goal!');
    render();
  },
  unuse: el => { const it = S.items.find(i => i.id === el.dataset.id); it.uses = Math.max(0, (it.uses || 0) - 1); save(); render(); },
  status: el => {
    const it = S.items.find(i => i.id === el.dataset.id);
    it.status = el.dataset.status; stamp(it, it.status); save();
    toast(it.status === 'skipped' ? `${money(it.price)} saved 🐷` : `Moved to ${it.status === 'bought' ? 'Bought' : 'Wishlist'}`);
    itemsSeg = it.status; render();
  },
  'del-item': el => {
    if (!confirm('Delete this item? This can’t be undone.')) return;
    S.items = S.items.filter(i => i.id !== el.dataset.id); save(); closeSheet(); render(); toast('Item deleted');
  },
  'del-alt': el => { const it = S.items.find(i => i.id === el.dataset.id); it.alts.splice(+el.dataset.i, 1); save(); render(); },
  rate: el => { const it = S.items.find(i => i.id === el.dataset.id); it.rating = +el.dataset.n; save(); buzz(10); render(); },
  'share-review': el => {
    const it = S.items.find(i => i.id === el.dataset.id);
    const f = $(`[data-form="review"][data-id="${it.id}"]`);
    if (f) { it.review = f.review.value; save(); }
    draft = { item: it.name, category: it.category, photo: it.photo, vote: (it.rating || 0) >= 4 ? 'worth' : (it.rating || 0) && it.rating <= 2 ? 'overhyped' : 'ask',
      text: `${it.rating ? '⭐'.repeat(it.rating) + ' ' : ''}${it.review || ''}${it.uses ? `\n\nUsed ${it.uses} times — ${cents(itemCpu(it))} per use.` : ''}`.trim() };
    openSheet('newPost');
  },
  'comm-seg': el => { commSeg = el.dataset.seg; render(); },
  'open-thread': el => {
    const id = el.dataset.id;
    if (id !== 'room') {
      S.dms[id] = S.dms[id] || []; S.dmRead[id] = Date.now();
      // With read receipts on, their messages get a "read" time that would be shared with them
      if (S.profile.receipts !== false) S.dms[id].forEach(x => { if (!x.mine && !x.readAt) x.readAt = Date.now(); });
      save();
    }
    tray = null; sheet = { type: 'thread', id }; render();
  },
  tray: el => { tray = tray === el.dataset.t ? null : el.dataset.t; renderSheet(); },
  emoji: el => {
    const inp = $('.imsg-composer input');
    const e = el.dataset.e;
    const at = inp.selectionStart ?? inp.value.length;
    inp.value = inp.value.slice(0, at) + e + inp.value.slice(inp.selectionEnd ?? at);
    msgDraft[inp.dataset.draft] = inp.value;
    S.recentEmoji = [e, ...(S.recentEmoji || []).filter(x => x !== e)].slice(0, 8);
    save(); buzz(5);
  },
  'send-sticker': el => { sendMsg(sheet.id, { kind: 'sticker', sticker: el.dataset.s }); tray = null; render();
  },
  compose: () => openSheet('compose'),
  'board-cat': el => { boardCat = el.dataset.cat; render(); },
  'demo-ok': () => { localStorage.setItem('wth-demo-ok', '1'); render(); },
  like: el => {
    const p = S.posts.find(x => x.id === el.dataset.id);
    p.liked = !p.liked; p.likes += p.liked ? 1 : -1; buzz(10); save(); render();
  },
  'open-post': el => openSheet('post', el.dataset.id),
  'new-post': () => { draft = { item: '', category: boardCat === 'all' ? 'beauty' : boardCat, vote: 'worth', text: '', photo: null }; openSheet('newPost'); },
  'draft-vote': el => { syncDraft(); draft.vote = el.dataset.v; renderSheet(); },
  follow: el => {
    const id = el.dataset.id;
    S.following = S.following.includes(id) ? S.following.filter(x => x !== id) : [...S.following, id];
    save(); render();
  },
  'pick-emoji': el => {
    const f = $('[data-form="profile"]');
    S.profile.name = f.name.value; S.profile.e = el.dataset.e; S.profile.photo = null; save(); render();
  },
  'remove-pfp': () => {
    const f = $('[data-form="profile"]'); if (f) S.profile.name = f.name.value;
    S.profile.photo = null; save(); render(); toast('Photo removed');
  },
  install: async () => {
    if (!installEvt) return;
    installEvt.prompt(); await installEvt.userChoice; installEvt = null; render();
  },
  'dismiss-install': () => { localStorage.setItem('wth-install-dismissed', '1'); render(); },
  export: () => {
    const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `worth-the-hype-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  },
  'clear-samples': () => { S.posts = S.posts.filter(p => !p.sample); S.chat = S.chat.filter(m => m.mine);
    for (const k in S.dms) { S.dms[k] = S.dms[k].filter(m => !m.sample); if (!S.dms[k].length) delete S.dms[k]; } save(); render(); toast('Sample posts removed'); },
  reset: () => {
    if (!confirm('Erase all your items, posts and settings from this phone? This can’t be undone.')) return;
    localStorage.removeItem(KEY); S = seed(); closeSheet(); test = newTest(); go('home'); setTimeout(() => openSheet('profile'), 300);
  },
};
function stamp(it, status) {
  if (status === 'bought' && !it.boughtAt) it.boughtAt = Date.now();
  if (status === 'skipped') it.skippedAt = Date.now();
}
function syncBasics() {
  const f = $('[data-form="test-basics"]');
  if (!f) return;
  test.name = f.name.value; test.price = f.price.value;
  if (f.budget && f.budget.value) S.profile.budget = +f.budget.value;
}

document.addEventListener('click', e => {
  const tabBtn = e.target.closest('.tabs button');
  if (tabBtn) { if (tabBtn.dataset.tab === 'test' && tab === 'test' && test.result) test = newTest(); return go(tabBtn.dataset.tab); }
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const fn = actions[el.dataset.action];
  if (fn) { if (el.tagName === 'BUTTON') e.preventDefault(); fn(el, e); }
});

const forms = {
  'test-basics': f => {
    syncBasics();
    if (!test.category) { toast('Pick a category first'); return; }
    if (!(+test.price >= 0) || test.price === '') { toast('Add a price'); return; }
    save(); test.step = 1; render(); window.scrollTo(0, 0);
  },
  'add-item': async f => {
    let photo = null;
    if (f.photo.files[0]) { try { photo = await compressImage(f.photo.files[0]); } catch (e) { toast('Couldn’t read that photo'); } }
    const status = f.status.value;
    const it = { id: uid(), name: f.name.value.trim(), category: f.category.value, price: +f.price.value || 0, photo, status,
      score: null, uses: 0, alts: [], rating: 0, review: '', expectedUses: 1, createdAt: Date.now() };
    stamp(it, status); S.items.push(it); save(); itemsSeg = status; closeSheet(); render(); toast('Item added');
  },
  alt: f => {
    const it = S.items.find(i => i.id === f.dataset.id);
    it.alts = it.alts || []; it.alts.push({ name: f.name.value.trim(), price: +f.price.value || 0 }); save(); render();
  },
  review: f => { const it = S.items.find(i => i.id === f.dataset.id); it.review = f.review.value; save(); toast('Review saved'); },
  comment: f => {
    const p = S.posts.find(x => x.id === f.dataset.id);
    const text = f.text.value.trim(); if (!text) return;
    p.comments.push({ author: S.profile.name || 'You', e: S.profile.e, text, at: Date.now(), mine: true }); save(); render();
  },
  post: f => {
    syncDraft();
    S.posts.push({ id: uid(), mine: true, author: S.profile.name || 'You', e: S.profile.e, category: draft.category, item: draft.item.trim(),
      vote: draft.vote, text: draft.text.trim(), photo: draft.photo, likes: 0, liked: false, at: Date.now(), comments: [] });
    save(); draft = null; closeSheet(); commSeg = 'boards'; boardCat = 'all'; go('community'); toast('Posted! 🎉');
  },
  dm: f => {
    const text = f.text.value.trim(); if (!text) return;
    msgDraft[f.dataset.id] = '';
    sendMsg(f.dataset.id, { kind: 'text', text }); render();
  },
  profile: f => {
    S.profile.name = f.name.value.trim(); S.profile.budget = +f.budget.value || 0;
    if (f.receipts) S.profile.receipts = f.receipts.checked;
    const first = !S.onboarded; S.onboarded = true; save(); closeSheet(); render();
    toast(first ? `Welcome${S.profile.name ? ', ' + S.profile.name : ''}! ✨` : 'Saved');
  },
};
document.addEventListener('submit', e => {
  const f = e.target.closest('[data-form]');
  if (!f) return;
  e.preventDefault();
  forms[f.dataset.form]?.(f);
});

document.addEventListener('input', e => {
  if (e.target.dataset.draft) msgDraft[e.target.dataset.draft] = e.target.value;
});
document.addEventListener('change', async e => {
  const inp = e.target;
  if (inp.hasAttribute('data-pfp') && inp.files[0]) {
    try {
      const f = $('[data-form="profile"]'); if (f) S.profile.name = f.name.value;
      S.profile.photo = await squareImage(inp.files[0]); save(); render(); toast('Looking good! 📸');
    } catch (err) { toast('Couldn’t read that photo'); }
    return;
  }
  if (inp.dataset.dmMedia && inp.files[0]) {
    const file = inp.files[0], id = inp.dataset.dmMedia;
    try {
      if (file.type === 'image/gif') {
        if (file.size > 1.5 * 1024 * 1024) { toast('That GIF is too big — pick one under 1.5 MB'); return; }
        const src = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
        sendMsg(id, { kind: 'media', gif: true, src });
      } else {
        sendMsg(id, { kind: 'media', gif: false, src: await compressImage(file) });
      }
      tray = null; render();
    } catch (err) { toast('Couldn’t read that file'); }
    return;
  }
  if (inp.dataset.photo && inp.files[0]) {
    try {
      const url = await compressImage(inp.files[0]);
      if (inp.dataset.photo === 'test') { syncBasics(); test.photo = url; render(); }
      else { syncDraft(); draft.photo = url; renderSheet(); }
    } catch (err) { toast('Couldn’t read that photo'); }
  }
  if (inp.hasAttribute('data-import') && inp.files[0]) {
    try {
      const data = JSON.parse(await inp.files[0].text());
      if (!data || !Array.isArray(data.items)) throw new Error('not a backup');
      S = Object.assign(seed(), data); save(); closeSheet(); render(); toast('Backup restored');
    } catch (err) { toast('That file isn’t a Worth the Hype? backup'); }
  }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && sheet) actions.close(); });

// ---------------------------------------------------------------- install + offline
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; if (tab === 'home') render(); });
window.addEventListener('appinstalled', () => { installEvt = null; toast('Installed! Find it on your home screen 📲'); render(); });
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

render();
if (!S.onboarded) setTimeout(() => openSheet('profile'), 250);
