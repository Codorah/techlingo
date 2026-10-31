/* TechLingo — application PWA (vanilla JS, aucun build requis) */
'use strict';

// =============================================================================
// Utilitaires
// =============================================================================
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const sample = (a, n) => shuffle(a).slice(0, n);
const pl = (n, w) => `${n} ${w}${n > 1 ? 's' : ''}`;
const DAY = 864e5;
const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const squash = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
const wordById = (id) => TECH_VOCABULARY.find((w) => w.id === id);

const GLOSS = {
  devops: 'Dev + Ops : livraison continue', idempotent: 'Même résultat à chaque appel', pipeline: 'Chaîne d’automatisation CI/CD',
  kubernetes: 'Orchestrateur de conteneurs', asynchronous: 'Asynchrone (sans attendre)', latency: 'Latence (délai de réponse)',
  cache: 'Mémoire cache', webhook: 'Rappel HTTP automatique', refactor: 'Restructurer le code', sharding: 'Partitionner les données',
  deprecate: 'Déprécier (abandonner)', payload: 'Charge utile (corps du message)', restapi: 'API REST', middleware: 'Intergiciel',
  responsive: 'Adaptatif (tous écrans)', crossplatform: 'Multiplateforme', pushnotification: 'Notification push', offlinefirst: 'Fonctionne hors ligne',
  bandwidth: 'Bande passante', dns: 'Annuaire des noms de domaine', loadbalancer: 'Répartiteur de charge', firewall: 'Pare-feu',
  bottleneck: 'Goulot d’étranglement', thread: 'Fil d’exécution', container: 'Conteneur', compiled: 'Langage compilé',
  typesafety: 'Typage sûr', garbagecollection: 'Ramasse-miettes', pullrequest: 'Demande de fusion de code', scalability: 'Montée en charge'
};
const gloss = (w) => GLOSS[w.id] || w.frDef.split(/[.,;:(]/)[0];

const CAT_ICON = { DevOps: '⚙️', Cloud: '☁️', Frontend: '🎨', Backend: '🗄️', Web: '🌐', Mobile: '📱', 'Réseaux': '📡', 'Systèmes': '🖥️', Langages: '💻', 'Data & AI': '🧠', Architecture: '🏗️' };
const CAT_BG = { DevOps: '#E0F2FE', Cloud: '#E0E7FF', Frontend: '#FCE7F3', Backend: '#DDF7EC', Web: '#CFFAFE', Mobile: '#FEF3D2', 'Réseaux': '#EBE4FF', 'Systèmes': '#E5E7EB', Langages: '#FFE4D6', 'Data & AI': '#F3E8FF', Architecture: '#DCFCE7' };
const CATS = [...new Set(TECH_VOCABULARY.map((w) => w.category))];

const SVG = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const I = {
  home: SVG('<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>'),
  dico: SVG('<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5M9 8h6"/>'),
  practice: SVG('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>'),
  career: SVG('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>'),
  profile: SVG('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
  speaker: SVG('<path d="M11 5L6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>'),
  search: SVG('<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>'),
  chev: SVG('<path d="M9 6l6 6-6 6"/>'),
  back: SVG('<path d="M15 6l-6 6 6 6"/>'),
  close: SVG('<path d="M6 6l12 12M18 6L6 18"/>'),
  mic: SVG('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>'),
  gear: SVG('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>')
};

// Mascotte Byte
function byte(size = 160) {
  return `<svg class="byte" width="${size}" height="${size}" viewBox="0 0 200 200" aria-hidden="true">
    <ellipse cx="100" cy="190" rx="44" ry="6" fill="rgba(2,132,199,.16)"/>
    <line x1="100" y1="22" x2="100" y2="40" stroke="#9CC8EE" stroke-width="5" stroke-linecap="round"/>
    <circle cx="100" cy="17" r="8" fill="#FBBF24"/>
    <rect x="70" y="138" width="60" height="44" rx="22" fill="#fff" stroke="#BFE0FA" stroke-width="3"/>
    <circle cx="100" cy="160" r="7" fill="#38BDF8"/>
    <ellipse cx="58" cy="156" rx="13" ry="10" fill="#DDEBFA" stroke="#BFE0FA" stroke-width="3"/>
    <ellipse cx="142" cy="156" rx="13" ry="10" fill="#DDEBFA" stroke="#BFE0FA" stroke-width="3"/>
    <rect x="26" y="76" width="14" height="34" rx="7" fill="#CBE6FB"/>
    <rect x="160" y="76" width="14" height="34" rx="7" fill="#CBE6FB"/>
    <rect x="38" y="40" width="124" height="100" rx="46" fill="#fff" stroke="#BFE0FA" stroke-width="3"/>
    <rect x="54" y="62" width="92" height="54" rx="26" fill="#0F2A44"/>
    <circle cx="82" cy="86" r="8" fill="#38E1FF"/><circle cx="118" cy="86" r="8" fill="#38E1FF"/>
    <path d="M88 100 Q100 110 112 100" stroke="#38E1FF" stroke-width="4.5" fill="none" stroke-linecap="round"/>
  </svg>`;
}

// =============================================================================
// État persistant
// =============================================================================
const KEY = 'techlingo.v1';
const defaults = () => ({
  name: '', avatar: '🤖', goal: '', onboarded: false, xp: 0, streak: 0, best: 0, lastDay: '',
  learned: {}, favs: [], badges: [], days: {}, correct: 0, total: 0, qaDone: [], dailyGoal: 3,
  settings: { dark: null, sound: true, autoSpeak: false }
});
function loadState() {
  try {
    const o = JSON.parse(localStorage.getItem(KEY)) || {};
    const d = defaults();
    return { ...d, ...o, settings: { ...d.settings, ...(o.settings || {}) } };
  } catch (e) { return defaults(); }
}
let S = loadState();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* stockage indisponible */ } };

const dayRec = () => (S.days[dayKey()] ||= { xp: 0, ids: [] });
const wordsLearned = () => Object.keys(S.learned).length;
const currentStreak = () => {
  const y = dayKey(new Date(Date.now() - DAY));
  return S.lastDay === dayKey() || S.lastDay === y ? S.streak : 0;
};
function touchStreak() {
  const t = dayKey();
  if (S.lastDay === t) return;
  S.streak = S.lastDay === dayKey(new Date(Date.now() - DAY)) ? S.streak + 1 : 1;
  S.lastDay = t;
  S.best = Math.max(S.best, S.streak);
}
function addXP(n) {
  S.xp += n; dayRec().xp += n; touchStreak(); checkBadges(); save();
}
const LEVELS = [{ k: 'A2', min: 0 }, { k: 'B1', min: 300 }, { k: 'B2', min: 800 }, { k: 'C1', min: 1800 }];
function level() {
  let i = 0; LEVELS.forEach((l, n) => { if (S.xp >= l.min) i = n; });
  const cur = LEVELS[i], next = LEVELS[i + 1];
  return { k: cur.k, pct: next ? Math.round(((S.xp - cur.min) / (next.min - cur.min)) * 100) : 100, next };
}
function markStudied(id) {
  const r = dayRec();
  if (!r.ids.includes(id)) r.ids.push(id);
}
const todayWords = () => dayRec().ids.length;
const dailyPct = () => Math.min(100, Math.round((todayWords() / S.dailyGoal) * 100));
const dueIds = () => Object.entries(S.learned).filter(([, v]) => v.due <= Date.now()).map(([id]) => id);
const lastLearnedId = () => Object.entries(S.learned).sort((a, b) => b[1].at - a[1].at)[0]?.[0];

const BADGES = [
  { id: 'first', em: '🌱', name: 'Apprenant en herbe', desc: 'Apprends ton premier mot', ok: () => wordsLearned() >= 1 },
  { id: 'ten', em: '📚', name: '10 mots', desc: 'Apprends 10 mots', ok: () => wordsLearned() >= 10 },
  { id: 'streak3', em: '🔥', name: 'Série de 3 jours', desc: 'Apprends 3 jours de suite', ok: () => S.best >= 3 },
  { id: 'streak7', em: '⚡', name: '7j de streak', desc: 'Apprends 7 jours de suite', ok: () => S.best >= 7 },
  { id: 'quiz', em: '🏆', name: 'Quiz Master', desc: '20 bonnes réponses', ok: () => S.correct >= 20 },
  { id: 'explorer', em: '🧭', name: 'Explorer de la tech', desc: 'Apprends des mots dans 5 domaines', ok: () => new Set(Object.keys(S.learned).map((id) => wordById(id)?.category)).size >= 5 },
  { id: 'speaker', em: '🎤', name: 'Prêt pour l’entretien', desc: 'Répète 3 réponses d’entretien', ok: () => S.qaDone.length >= 3 },
  { id: 'xp500', em: '💎', name: '500 XP', desc: 'Atteins 500 XP', ok: () => S.xp >= 500 }
];
function checkBadges() {
  BADGES.forEach((b) => {
    if (!S.badges.includes(b.id) && b.ok()) {
      S.badges.push(b.id);
      setTimeout(() => { toast(`${b.em} Badge débloqué : ${b.name}`); sfx.win(); }, 600);
    }
  });
}

// =============================================================================
// Audio : voix anglaise + petits sons
// =============================================================================
let voice = null;
function pickVoice() {
  if (!('speechSynthesis' in window)) return;
  const v = speechSynthesis.getVoices();
  voice = v.find((x) => /en-US/i.test(x.lang) && /Google|Natural|Samantha|Aria|Jenny/i.test(x.name)) || v.find((x) => /^en/i.test(x.lang)) || null;
}
if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
function speak(text, rate = 0.95) {
  if (!('speechSynthesis' in window)) { toast('Audio indisponible sur cet appareil'); return; }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US'; u.rate = rate; if (voice) u.voice = voice;
  speechSynthesis.speak(u);
}
let ac;
function beep(freq, dur = 0.12, type = 'sine', vol = 0.05, when = 0) {
  if (!S.settings.sound) return;
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + when;
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + dur);
  } catch (e) { /* audio non disponible */ }
}
const sfx = {
  ok() { beep(660, 0.1); beep(880, 0.14, 'sine', 0.05, 0.1); },
  bad() { beep(190, 0.22, 'triangle', 0.06); },
  tick() { beep(900, 0.03, 'square', 0.018); },
  win() { [523, 659, 784, 1047].forEach((f, i) => beep(f, 0.18, 'sine', 0.05, i * 0.1)); }
};

// Retour haptique : plugin natif si disponible, sinon vibration du navigateur
function buzz(kind = 'light') {
  try {
    const H = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Haptics;
    if (H) { kind === 'success' ? H.notification({ type: 'SUCCESS' }) : H.impact({ style: 'LIGHT' }); return; }
    if (navigator.vibrate) navigator.vibrate(kind === 'success' ? [12, 40, 12] : 8);
  } catch (e) { /* non supporté */ }
}

let toastTimer;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

function confetti() {
  const c = $('#confetti'), dpr = Math.min(devicePixelRatio || 1, 2);
  c.width = c.clientWidth * dpr; c.height = c.clientHeight * dpr;
  const ctx = c.getContext('2d'); ctx.scale(dpr, dpr);
  const W = c.clientWidth, H = c.clientHeight, colors = ['#38BDF8', '#34D399', '#FBBF24', '#A78BFA', '#F87171'];
  const ps = Array.from({ length: 110 }, () => ({
    x: W / 2, y: H * 0.35, vx: (Math.random() - 0.5) * 11, vy: -Math.random() * 12 - 3,
    s: 5 + Math.random() * 6, c: colors[Math.floor(Math.random() * colors.length)], r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4
  }));
  const t0 = performance.now();
  (function frame(now) {
    const t = now - t0;
    ctx.clearRect(0, 0, W, H);
    ps.forEach((p) => { p.vy += 0.3; p.x += p.vx; p.y += p.vy; p.r += p.vr; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.globalAlpha = Math.max(0, 1 - t / 2400); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 3, p.s, p.s / 1.6); ctx.restore(); });
    if (t < 2400) requestAnimationFrame(frame); else ctx.clearRect(0, 0, W, H);
  })(t0);
}

// =============================================================================
// Routeur
// =============================================================================
const TABS = [
  { r: 'home', label: 'Accueil', icon: I.home }, { r: 'dico', label: 'Dico', icon: I.dico },
  { r: 'practice', label: 'Pratique', icon: I.practice }, { r: 'career', label: 'Carrière', icon: I.career },
  { r: 'profile', label: 'Profil', icon: I.profile }
];
let navCount = 0;
function nav(path, replace = false) {
  const target = '#' + path;
  if (location.hash === target) { render(); return; }
  if (replace) location.replace(target); else { navCount++; location.hash = path; }
}
function back(fallback) {
  if (navCount > 0) { navCount--; history.back(); } else nav(fallback, true);
}
const routePath = () => (location.hash.replace(/^#\/?/, '') || '').split('/').map(decodeURIComponent);

let cleanup = null;
function render() {
  if (cleanup) { cleanup(); cleanup = null; }
  const [name, a, b] = routePath();
  if (!S.onboarded && !['onboard', 'setup', 'backup'].includes(name)) return nav('/onboard', true);
  const view = VIEWS[name || 'home'] || VIEWS.home;
  const html = view(a, b);
  if (html == null) return;
  const app = $('#app');
  app.innerHTML = `<div class="screen">${html}</div>`;
  app.scrollTop = 0;
  const tab = TABS.some((t) => t.r === (name || 'home'));
  const bar = $('#tabbar');
  bar.hidden = !tab;
  if (tab) bar.innerHTML = TABS.map((t) => `<button data-a="tab" data-v="${t.r}" class="${t.r === (name || 'home') ? 'on' : ''}" aria-label="${t.label}">${t.icon}<span>${t.label}</span></button>`).join('');
  const after = AFTER[name || 'home'];
  if (after) after(a, b);
}
const topbar = (title, fallback, right = '') => `<div class="topbar"><button class="icon-btn" data-a="back" data-v="${fallback}" aria-label="Retour">${I.back}</button><h2>${title}</h2>${right}</div>`;

// =============================================================================
// Écrans
// =============================================================================
const VIEWS = {}, AFTER = {};

// --- Onboarding (4 écrans animés) + création du profil ---
let O = { step: 0 };
const AVATARS = ['🤖', '🦊', '🐼', '🐙', '🦄', '🚀'];
const avatarOf = () => S.avatar || '🤖';

function illoWheel() {
  const cols = ['#7DD3FC', '#86EFAC', '#FDE68A', '#C4B5FD', '#FCA5A5', '#FDBA74', '#A5F3FC', '#F9A8D4'];
  let p = '';
  for (let i = 0; i < 8; i++) {
    const a0 = (i / 8) * 2 * Math.PI, a1 = ((i + 1) / 8) * 2 * Math.PI, r = 98;
    p += `<path d="M110 110 L${(110 + r * Math.cos(a0)).toFixed(1)} ${(110 + r * Math.sin(a0)).toFixed(1)} A${r} ${r} 0 0 1 ${(110 + r * Math.cos(a1)).toFixed(1)} ${(110 + r * Math.sin(a1)).toFixed(1)}Z" fill="${cols[i]}" stroke="#fff" stroke-width="3"/>`;
  }
  return `<div class="illo illo-wheel"><svg viewBox="0 0 220 240" width="250" height="272" aria-hidden="true">
    <g class="spinner" style="transform-origin:110px 110px"><circle cx="110" cy="110" r="106" fill="#7AB6E3"/>${p}</g>
    <circle cx="110" cy="110" r="26" fill="#fff"/><text x="110" y="115" text-anchor="middle" font-size="12" font-weight="900" fill="#0284C7" font-family="Nunito,sans-serif">SPIN</text>
    <path d="M110 28 L100 4 A12 12 0 1 1 120 4Z" fill="#FBBF24" stroke="#fff" stroke-width="2"/></svg>
    <span class="chip pop-chip">⭐ DevOps</span></div>`;
}
const SLIDES = [
  {
    title: 'Parle tech en anglais', text: 'Explique ton code, le DevOps, le web, le mobile et les réseaux avec les bons mots.',
    art: () => `<div class="illo illo-byte">${byte(190)}<span class="fl f1">API</span><span class="fl f2">deploy</span><span class="fl f3">cache</span><span class="fl f4">bug 🐛</span></div>`
  },
  {
    title: 'Un mot tech chaque jour', text: 'Tourne la roue, découvre un terme et comprends-le avec des exemples réels d’équipes tech.',
    art: illoWheel
  },
  {
    title: 'Retiens pour de bon', text: 'La révision espacée te ramène chaque mot au bon moment. Quiz, vrai ou faux et paires pour t’entraîner.',
    art: () => `<div class="illo illo-cards"><div class="stackcard c3"></div><div class="stackcard c2"></div>
      <div class="flipcard"><div class="fc-in"><div class="fc-face">latency<small>/ˈleɪtənsi/</small></div><div class="fc-face fc-back">latence<small>délai de réponse</small></div></div></div>
      <span class="streak-badge">🔥 7 jours</span></div>`
  },
  {
    title: 'Prêt pour l’entretien', text: 'Entraîne-toi aux vraies questions d’entretien et vérifie les expressions clés que tu utilises à l’oral.',
    art: () => `<div class="illo illo-chat"><div class="bub q">Tell me about your project.</div>
      <div class="bub a"><span class="typing"><i></i><i></i><i></i></span><span class="ans">I built a mobile app with a REST API.</span></div>
      <div class="mic"><span class="ring r1"></span><span class="ring r2"></span><span class="micdot">🎤</span></div></div>`
  }
];

VIEWS.onboard = () => {
  const n = SLIDES.length;
  return `<div class="ob">
    <div class="ob-top"><span></span><button class="link" data-a="obSkip" style="visibility:${O.step < n - 1 ? 'visible' : 'hidden'}" id="obSkip">Passer</button></div>
    <div class="ob-viewport"><div class="ob-track" id="obTrack" style="transform:translateX(${-O.step * 100}%)">
      ${SLIDES.map((s, i) => `<section class="ob-slide ${i === O.step ? 'on' : ''}" aria-hidden="${i !== O.step}">${s.art()}<h1 class="title">${s.title}</h1><p class="sub">${s.text}</p></section>`).join('')}
    </div></div>
    <div class="dots" id="obDots">${SLIDES.map((_, i) => `<i class="${i === O.step ? 'on' : ''}"></i>`).join('')}</div>
    <button class="btn" id="obBtn" data-a="obNext">${O.step === n - 1 ? 'Commencer' : 'Suivant'} →</button>
  </div>`;
};
function obGo(step) {
  const n = SLIDES.length;
  O.step = Math.max(0, Math.min(n - 1, step));
  const tr = $('#obTrack'); if (!tr) return;
  tr.style.transform = `translateX(${-O.step * 100}%)`;
  $$('.ob-slide').forEach((el, i) => { el.classList.toggle('on', i === O.step); el.setAttribute('aria-hidden', i !== O.step); });
  $$('#obDots i').forEach((el, i) => el.classList.toggle('on', i === O.step));
  $('#obBtn').textContent = `${O.step === n - 1 ? 'Commencer' : 'Suivant'} →`;
  $('#obSkip').style.visibility = O.step < n - 1 ? 'visible' : 'hidden';
  buzz();
}
AFTER.onboard = () => {
  const vp = $('.ob-viewport'); let x0 = null, y0 = 0;
  vp.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  vp.addEventListener('touchend', (e) => {
    if (x0 == null) return;
    const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) obGo(O.step + (dx < 0 ? 1 : -1));
    x0 = null;
  }, { passive: true });
};

VIEWS.setup = () => {
  const ready = S.name.trim().length > 0 && !!S.goal;
  return `<div class="setup">
    <div class="center"><h1 class="title">Crée ton profil</h1><p class="sub">Il reste sur ton téléphone : pas de compte, aucune donnée envoyée.</p></div>
    <div class="avatars" role="radiogroup" aria-label="Avatar">${AVATARS.map((a) => `<button class="av ${avatarOf() === a ? 'sel' : ''}" role="radio" aria-checked="${avatarOf() === a}" data-a="avatar" data-v="${a}">${a}</button>`).join('')}</div>
    <div class="stack"><label class="sub" for="nm" style="display:block;margin:0 0 6px">Ton prénom ou pseudo</label>
      <input id="nm" class="input" placeholder="Ex. Alex" maxlength="24" autocomplete="off" autocapitalize="words" value="${esc(S.name)}"></div>
    <div><p class="sub" style="margin:0 0 8px">Ton objectif</p><div class="goal-grid">${GOALS.map((g) => `<button class="option ${S.goal === g.id ? 'sel' : ''}" data-a="goal" data-v="${g.id}"><span class="ico">${g.icon}</span><span>${g.label}</span></button>`).join('')}</div></div>
    <p class="legal">En continuant, tu acceptes les <a href="terms.html">Conditions d’utilisation</a> et la <a href="privacy.html">Politique de confidentialité</a>.</p>
    <button class="btn" id="setupBtn" data-a="setupDone" ${ready ? '' : 'disabled'}>C’est parti 🚀</button>
    <button class="link center" style="width:100%" data-a="nav" data-v="/backup">J’ai déjà une sauvegarde</button>
  </div>`;
};

// --- Accueil ---
let deferredInstall = null;
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone;
VIEWS.home = () => {
  const lv = level(), due = dueIds().length, lastId = lastLearnedId(), last = lastId && wordById(lastId), st = currentStreak();
  return `
  <div class="hello"><div><h1>Bonjour ${esc(S.name || 'toi')} 👋</h1><p class="sub" style="margin-top:2px">Prêt à apprendre aujourd’hui ?</p></div>
    <button class="avatar" data-a="nav" data-v="/profile" aria-label="Mon profil">${avatarOf()}</button></div>
  <div class="stats-row">
    <div class="stat"><span class="em">🔥</span><div><b>${pl(st, 'jour')}</b><span>de streak</span></div></div>
    <div class="stat"><span class="em">🎓</span><div><b>Niveau ${lv.k}</b><span>${S.xp} XP</span></div></div>
  </div>
  <div class="card spin-card">
    <div class="art">${wheelMini()}</div>
    <div class="txt"><h3 style="font-size:21px">Tournez la roue !</h3><p class="sub">Découvrez le mot tech du jour</p>
    <button class="btn" data-a="nav" data-v="/spin">Spin of the Day →</button></div>
  </div>
  ${due > 0
    ? `<button class="alert-card" data-a="review"><span class="em">⏰</span><div><b>${pl(due, 'mot')} prêt${due > 1 ? 's' : ''} pour révision</b><span>Révise maintenant pour ne pas oublier</span></div></button>`
    : `<div class="alert-card ok"><span class="em">✅</span><div><b>Révisions à jour</b><span>${wordsLearned() ? 'Reviens demain pour la suite.' : 'Apprends ton premier mot avec la roue.'}</span></div></div>`}
  ${deferredInstall && !isStandalone() ? `<button class="alert-card" data-a="install" style="background:var(--lav-bg)"><span class="em">📲</span><div><b>Installer TechLingo</b><span>Accès rapide et mode hors ligne</span></div></button>` : ''}
  <div class="card" style="margin-top:14px">
    <div class="row between"><div><b>Objectif du jour</b><p class="sub" style="margin-top:2px">${todayWords()}/${S.dailyGoal} mots étudiés</p></div><span class="pct">${dailyPct()}%</span></div>
    <div class="bar" style="margin-top:12px"><i style="width:${dailyPct()}%"></i></div>
  </div>
  ${last ? `<div class="section-title">Dernier mot appris</div><div class="card last-word">
    <div class="t"><h3>${esc(last.term)}</h3><p class="sub mono" style="font-size:13px">${esc(last.phonetic)}</p><p class="sub">${esc(gloss(last))}</p></div>
    <button class="icon-btn speak" data-speak="${esc(last.term)}" aria-label="Écouter">${I.speaker}</button></div>` : ''}`;
};
function wheelMini() {
  const cols = ['#7DD3FC', '#86EFAC', '#FDE68A', '#C4B5FD', '#FCA5A5', '#FDBA74'];
  let p = '';
  for (let i = 0; i < 6; i++) {
    const a0 = (i / 6) * 2 * Math.PI, a1 = ((i + 1) / 6) * 2 * Math.PI, r = 52;
    p += `<path d="M60 60 L${60 + r * Math.cos(a0)} ${60 + r * Math.sin(a0)} A${r} ${r} 0 0 1 ${60 + r * Math.cos(a1)} ${60 + r * Math.sin(a1)}Z" fill="${cols[i]}" stroke="#fff" stroke-width="2"/>`;
  }
  return `<svg width="118" height="118" viewBox="0 0 120 120" aria-hidden="true">${p}<circle cx="60" cy="60" r="14" fill="#fff"/><text x="60" y="66" text-anchor="middle" font-size="16">★</text></svg>`;
}

// --- Roue ---
const WHEEL_COLORS = ['#7DD3FC', '#86EFAC', '#FDE68A', '#C4B5FD', '#FCA5A5', '#FDBA74', '#A5F3FC', '#F9A8D4'];
let WH = { words: null, rot: 0, spinning: false, result: null };
function newWheelWords() {
  const fresh = TECH_VOCABULARY.filter((w) => !S.learned[w.id]);
  const pool = fresh.length >= 8 ? fresh : TECH_VOCABULARY;
  WH.words = sample(pool, 8); WH.result = null;
}
VIEWS.spin = () => {
  if (!WH.words) newWheelWords();
  return `${topbar('Daily Spin', '/home')}
  <p class="sub center">Laissez le hasard vous guider…</p>
  <div class="wheel-wrap"><svg class="pointer" viewBox="0 0 30 38" aria-hidden="true"><path d="M15 38 L2 10 A15 15 0 1 1 28 10Z" fill="#FBBF24" stroke="#fff" stroke-width="2.5"/><circle cx="15" cy="13" r="5" fill="#fff"/></svg>
    <canvas id="wheel" role="img" aria-label="Roue de mots tech"></canvas></div>
  <div class="spin-result" id="spinResult">${spinResultHtml()}</div>
  <button class="btn" id="spinBtn" data-a="spin" ${WH.spinning ? 'disabled' : ''}>${WH.result ? 'Tourner encore' : 'Tourner la roue'}</button>`;
};
function spinResultHtml() {
  const w = WH.result;
  if (!w) return `<p class="sub">Appuie sur le bouton pour tirer un mot.</p>`;
  return `<div class="card center"><span class="pill">${CAT_ICON[w.category] || ''} ${esc(w.category)}</span>
    <h2 style="font-size:30px;margin:8px 0 2px">${esc(w.term)}</h2><p class="sub">${esc(gloss(w))}</p>
    <button class="btn mint" style="margin-top:12px" data-a="lesson" data-v="${w.id}">Découvrir la fiche →</button></div>`;
}
function drawWheel() {
  const cv = $('#wheel'); if (!cv) return;
  const size = cv.clientWidth || 300, dpr = Math.min(devicePixelRatio || 1, 2);
  cv.width = cv.height = Math.round(size * dpr);
  const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
  const r = size / 2, n = WH.words.length, seg = (2 * Math.PI) / n;
  ctx.clearRect(0, 0, size, size);
  ctx.save(); ctx.translate(r, r);
  ctx.beginPath(); ctx.arc(0, 0, r - 2, 0, 2 * Math.PI); ctx.fillStyle = '#7AB6E3'; ctx.fill();
  ctx.beginPath(); ctx.arc(0, 0, r - 8, 0, 2 * Math.PI); ctx.fillStyle = '#fff'; ctx.fill();
  ctx.rotate(WH.rot);
  WH.words.forEach((w, i) => {
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r - 12, i * seg, (i + 1) * seg); ctx.closePath();
    ctx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length]; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    ctx.save(); ctx.rotate(i * seg + seg / 2); ctx.textAlign = 'right'; ctx.fillStyle = '#0F2A44';
    const label = w.term.length > 13 ? w.term.slice(0, 12) + '…' : w.term;
    ctx.font = `800 ${label.length > 9 ? 13 : 15}px Nunito, system-ui, sans-serif`;
    ctx.fillText(label, r - 28, 5); ctx.restore();
  });
  ctx.rotate(-WH.rot);
  ctx.beginPath(); ctx.arc(0, 0, 36, 0, 2 * Math.PI); ctx.fillStyle = '#fff'; ctx.shadowColor = 'rgba(2,132,199,.35)'; ctx.shadowBlur = 10; ctx.fill(); ctx.shadowBlur = 0;
  ctx.fillStyle = '#0284C7'; ctx.font = '900 13px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(WH.spinning ? '…' : 'SPIN', 0, 5);
  ctx.restore();
}
AFTER.spin = () => drawWheel();
function spinWheel() {
  if (WH.spinning) return;
  WH.spinning = true; WH.result = null;
  $('#spinResult').innerHTML = '<p class="sub">En cours…</p>';
  const btn = $('#spinBtn'); btn.disabled = true; btn.textContent = 'En cours…';
  const TAU = 2 * Math.PI, n = WH.words.length, seg = TAU / n, idx = Math.floor(Math.random() * n), f = 0.2 + Math.random() * 0.6;
  const mod = (x) => ((x % TAU) + TAU) % TAU;
  const cur = WH.rot, delta = mod(mod(-Math.PI / 2 - (idx + f) * seg) - mod(cur));
  const total = delta + (4 + Math.floor(Math.random() * 3)) * TAU, t0 = performance.now(), dur = 4300;
  let lastI = -1, alive = true;
  cleanup = () => { alive = false; WH.spinning = false; WH.rot = cur + total; };
  (function frame(now) {
    if (!alive) return;
    const t = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - t, 4);
    WH.rot = cur + total * e; drawWheel();
    const pi = Math.floor(mod(-Math.PI / 2 - WH.rot) / seg);
    if (pi !== lastI) { lastI = pi; sfx.tick(); }
    if (t < 1) return requestAnimationFrame(frame);
    WH.spinning = false; WH.result = WH.words[idx]; cleanup = null; drawWheel();
    sfx.win(); confetti();
    const res = $('#spinResult'); if (res) res.innerHTML = spinResultHtml();
    const b = $('#spinBtn'); if (b) { b.disabled = false; b.textContent = 'Tourner encore'; }
  })(t0);
}

// --- Leçon : définition -> exemples -> quiz -> bravo ---
let L = null;
function startLesson(id) {
  const w = wordById(id); if (!w) return;
  const opts = shuffle(w.quiz.options.map((t, i) => ({ t, ok: i === w.quiz.correctIndex })));
  L = { id, step: 1, opts, picked: null, result: null };
  nav('/lesson/' + id);
  if (S.settings.autoSpeak) setTimeout(() => speak(w.term), 350);
}
VIEWS.lesson = (id) => {
  const w = wordById(id);
  if (!w) return VIEWS.home();
  if (!L || L.id !== id) { startLesson(id); return null; }
  const head = (title) => `<div class="topbar"><button class="icon-btn" data-a="back" data-v="/spin" aria-label="Fermer">${I.close}</button>
    <div class="progress-top"><div class="bar"><i style="width:${(L.step / 3) * 100}%"></i></div></div><span class="muted" style="font-weight:700">${L.step}/3</span></div>`;
  if (L.step === 1) return `${head()}
    <div class="term-box"><div><h1>${esc(w.term)}</h1><p class="ph">${esc(w.phonetic)}</p><span class="pill" style="margin-top:8px">${esc(w.partOfSpeech)} · ${esc(w.category)}</span></div>
      <button class="icon-btn speak" data-speak="${esc(w.term)}" aria-label="Écouter la prononciation">${I.speaker}</button></div>
    <div class="card def-block stack" style="margin-top:14px">
      <div><h3>Définition</h3><p>${esc(w.enDef)}</p></div>
      <div><h3>En français</h3><p>${esc(w.frDef)}</p></div>
      <button class="btn ghost sm" data-speak="${esc(w.enDef)}" style="margin-top:4px">${I.speaker.replace('<svg', '<svg width="18" height="18"')} Écouter la définition</button></div>
    <div style="margin-top:18px"><button class="btn" data-a="lessonNext">Voir des exemples →</button></div>`;
  if (L.step === 2) return `${head()}
    <h2 class="title" style="font-size:22px;margin-bottom:12px">Exemples d’utilisation</h2>
    <div class="card">${w.examples.map((e) => `<div class="ex"><span class="dot">✓</span><div><p>${esc(e.en)}</p><small>${esc(e.fr)}</small></div>
      <button class="icon-btn speak" data-speak="${esc(e.en)}" aria-label="Écouter">${I.speaker}</button></div>`).join('')}</div>
    <div class="memo" style="margin-top:14px"><h3>💡 À retenir !</h3><p>${esc(w.takeaway)}</p></div>
    <div style="margin-top:18px"><button class="btn" data-a="lessonNext">Tester mes connaissances →</button></div>`;
  const q = w.quiz, p = L.picked;
  return `${head()}
    <h2 class="q-title">${esc(q.question)}</h2>
    <div class="stack">${L.opts.map((o, i) => `<button class="option ${p == null ? '' : o.ok ? 'ok' : i === p ? 'bad' : ''}" data-a="pick" data-v="${i}" ${p != null ? 'disabled' : ''}><span class="radio"></span>${esc(o.t)}</button>`).join('')}</div>
    ${p == null ? '' : `<div class="feedback ${L.opts[p].ok ? 'ok' : 'bad'}"><b>${L.opts[p].ok ? '🎉 Bonne réponse !' : 'Pas tout à fait.'}</b><br>${esc(q.explanation)}</div>
    <div style="margin-top:16px"><button class="btn" data-a="finishLesson">Continuer →</button></div>`}`;
};
function finishLesson() {
  const first = !S.learned[L.id], ok = L.opts[L.picked].ok;
  let xp = first ? 30 : 10; if (ok) xp += first ? 20 : 5;
  if (first) S.learned[L.id] = { box: 1, due: Date.now() + 2 * DAY, at: Date.now() };
  markStudied(L.id); addXP(xp);
  L.result = { xp, ok, first };
  nav('/done/' + L.id);
}
VIEWS.done = (id) => {
  const w = wordById(id);
  if (!w || !L || L.id !== id || !L.result) return VIEWS.home();
  const r = L.result;
  setTimeout(() => { if (r.ok) { confetti(); sfx.win(); } }, 150);
  return `<div class="celebrate">
    <div class="trophy">${r.ok ? '🏆' : '💪'}</div>
    <h1 class="title" style="margin-top:14px">${r.ok ? 'Bravo ! 🎉' : 'Bien joué !'}</h1>
    <p class="sub">Tu as appris <b>${esc(w.term)}</b>${r.ok ? ' sans faute' : ''}.<br>Il reviendra dans tes révisions ${r.first ? 'dans 2 jours' : 'bientôt'}.</p>
    <div class="xp-pill">⭐ +${r.xp} XP</div>
    <div class="stack"><button class="btn" data-a="nav" data-v="/home">Continuer</button>
    <button class="btn ghost" data-a="nav" data-v="/spin">Tirer un autre mot</button></div></div>`;
};

// --- Dictionnaire ---
let D = { q: '', cat: 'all' };
function dicoItems() {
  const q = norm(D.q.trim());
  return TECH_VOCABULARY.filter((w) => {
    if (D.cat === 'fav' && !S.favs.includes(w.id)) return false;
    if (D.cat !== 'all' && D.cat !== 'fav' && w.category !== D.cat) return false;
    return !q || norm([w.term, w.id, w.frDef, w.enDef, gloss(w), w.category].join(' ')).includes(q);
  }).sort((a, b) => a.term.localeCompare(b.term));
}
function dicoList() {
  const items = dicoItems();
  if (!items.length) return `<div class="empty">${D.cat === 'fav' ? 'Aucun favori pour l’instant.<br>Ouvre un mot et touche ♡.' : 'Aucun résultat. Essaie un autre mot (EN ou FR).'}</div>`;
  return `<div class="list">${items.map((w) => `<button class="item" data-a="nav" data-v="/word/${w.id}"><span class="ico" style="background:${CAT_BG[w.category] || '#E0F2FE'}">${CAT_ICON[w.category] || '📘'}</span>
    <span class="t"><b>${esc(w.term)} ${S.learned[w.id] ? '<span class="learned-mark">✓</span>' : ''}</b><small>${esc(gloss(w))}</small></span>${I.chev.replace('<svg', '<svg class="chev"')}</button>`).join('')}</div>`;
}
VIEWS.dico = () => `<div class="topbar"><h2 class="title">Dictionnaire</h2></div>
  <div class="search">${I.search}<input id="dq" class="input" type="search" placeholder="Rechercher un mot (EN / FR)…" value="${esc(D.q)}" autocomplete="off" aria-label="Rechercher"></div>
  <div class="filters">${[['all', 'Tout'], ...CATS.map((c) => [c, c]), ['fav', '♥ Favoris']].map(([k, l]) => `<button data-a="cat" data-v="${esc(k)}" class="${D.cat === k ? 'on' : ''}">${esc(l)}</button>`).join('')}</div>
  <div id="dicoList">${dicoList()}</div>
  <p class="sub center" style="margin-top:14px">${TECH_VOCABULARY.length} mots · ${wordsLearned()} appris</p>`;

VIEWS.word = (id) => {
  const w = wordById(id); if (!w) return VIEWS.dico();
  const fav = S.favs.includes(w.id);
  return `${topbar('', '/dico', `<button class="icon-btn fav-btn" data-a="fav" data-v="${w.id}" aria-label="${fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}" style="margin-left:auto">${fav ? '❤️' : '🤍'}</button>`)}
  <div class="term-box"><div><h1>${esc(w.term)}</h1><p class="ph">${esc(w.phonetic)}</p><span class="pill" style="margin-top:8px">${esc(w.partOfSpeech)} · ${esc(w.category)}</span></div>
    <button class="icon-btn speak" data-speak="${esc(w.term)}" aria-label="Écouter">${I.speaker}</button></div>
  <div class="card def-block stack" style="margin-top:14px"><div><h3>Definition</h3><p>${esc(w.enDef)}</p></div><div><h3>En français</h3><p>${esc(w.frDef)}</p></div></div>
  <div class="section-title">Exemples</div>
  <div class="card">${w.examples.map((e) => `<div class="ex"><span class="dot">✓</span><div><p>${esc(e.en)}</p><small>${esc(e.fr)}</small></div><button class="icon-btn speak" data-speak="${esc(e.en)}" aria-label="Écouter">${I.speaker}</button></div>`).join('')}</div>
  <div class="memo" style="margin-top:14px"><h3>💡 À retenir</h3><p>${esc(w.takeaway)}</p></div>
  <div style="margin-top:18px"><button class="btn" data-a="lesson" data-v="${w.id}">${S.learned[w.id] ? 'Refaire la leçon' : 'Apprendre ce mot'} →</button></div>`;
};

// --- Pratique ---
VIEWS.practice = () => {
  const due = dueIds().length;
  return `<div class="topbar"><div><h2 class="title">Pratique</h2><p class="sub" style="margin-top:2px">Renforcez vos connaissances</p></div></div>
  <button class="mode" data-a="review"><span class="ico" style="background:var(--sun-bg)">🃏</span><span class="t"><b>Révision espacée</b><small>${due ? pl(due, 'carte') + ' à réviser' : wordsLearned() ? 'Rien à réviser, revois quand même' : 'Apprends d’abord un mot'}</small></span>${I.chev.replace('<svg', '<svg width="20" height="20"')}</button>
  <button class="mode" data-a="game" data-v="quick"><span class="ico" style="background:#FFEDD5">⏱️</span><span class="t"><b>Quiz rapide</b><small>5 questions · 90 s</small></span>${I.chev.replace('<svg', '<svg width="20" height="20"')}</button>
  <button class="mode" data-a="game" data-v="tf"><span class="ico" style="background:var(--rose-bg)">✅</span><span class="t"><b>Vrai ou Faux</b><small>6 affirmations · 3 min</small></span>${I.chev.replace('<svg', '<svg width="20" height="20"')}</button>
  <button class="mode" data-a="game" data-v="match"><span class="ico" style="background:var(--lav-bg)">🔗</span><span class="t"><b>Associer</b><small>5 paires · 5 min</small></span>${I.chev.replace('<svg', '<svg width="20" height="20"')}</button>`;
};

let G = null;
function startGame(kind) {
  G = { kind, i: 0, score: 0, picked: null, done: false, xp: 0, mistakes: 0 };
  if (kind === 'quick') {
    G.qs = sample(TECH_VOCABULARY, 5).map((w) => ({ w, opts: shuffle(w.quiz.options.map((t, i) => ({ t, ok: i === w.quiz.correctIndex }))) }));
    G.left = 90;
  } else if (kind === 'tf') {
    G.qs = sample(TECH_VOCABULARY, 6).map((w) => {
      const truth = Math.random() < 0.5;
      const other = sample(TECH_VOCABULARY.filter((x) => x.id !== w.id), 1)[0];
      return { w, truth, text: truth ? w.frDef : other.frDef };
    });
  } else {
    const ws = sample(TECH_VOCABULARY, 5);
    G.ws = ws; G.right = shuffle(ws.map((w) => w.id)); G.matched = []; G.selL = null; G.selR = null; G.flash = null;
  }
  nav('/game/' + kind);
}
VIEWS.game = (kind) => {
  if (!G || G.kind !== kind) { nav('/practice', true); return null; }
  if (G.done) return gameResult();
  const head = `<div class="topbar"><button class="icon-btn" data-a="back" data-v="/practice" aria-label="Quitter">${I.close}</button>
    <div class="progress-top"><div class="bar"><i style="width:${kind === 'match' ? (G.matched.length / 5) * 100 : (G.i / G.qs.length) * 100}%"></i></div></div></div>`;
  if (kind === 'quick') {
    const q = G.qs[G.i], p = G.picked;
    return `${head}<div class="score-line"><span>Question ${G.i + 1}/${G.qs.length}</span><span id="clock">⏱ ${G.left}s</span></div><div class="bar timer"><i id="timerBar" style="width:${(G.left / 90) * 100}%"></i></div>
    <h2 class="q-title" style="margin-top:16px">${esc(q.w.quiz.question)}</h2>
    <div class="stack">${q.opts.map((o, i) => `<button class="option ${p == null ? '' : o.ok ? 'ok' : i === p ? 'bad' : ''}" data-a="gAnswer" data-v="${i}" ${p != null ? 'disabled' : ''}><span class="radio"></span>${esc(o.t)}</button>`).join('')}</div>
    ${p == null ? '' : `<div class="feedback ${q.opts[p].ok ? 'ok' : 'bad'}">${esc(q.w.quiz.explanation)}</div><div style="margin-top:14px"><button class="btn" data-a="gNext">${G.i + 1 < G.qs.length ? 'Suivant →' : 'Terminer'}</button></div>`}`;
  }
  if (kind === 'tf') {
    const q = G.qs[G.i], p = G.picked;
    return `${head}<div class="score-line"><span>Affirmation ${G.i + 1}/${G.qs.length}</span><span>Score : ${G.score}</span></div>
    <div class="card tf-card"><div class="term">${esc(q.w.term)}</div><p>« ${esc(q.text)} »</p></div>
    ${p == null ? `<div class="two"><button class="btn mint" data-a="gAnswer" data-v="1">Vrai</button><button class="btn" style="background:linear-gradient(180deg,#FB8A8A,#E85A5A)" data-a="gAnswer" data-v="0">Faux</button></div>`
      : `<div class="feedback ${(p === 1) === q.truth ? 'ok' : 'bad'}"><b>${(p === 1) === q.truth ? '🎉 Exact !' : 'Raté !'}</b> ${q.truth ? 'Cette définition est la bonne.' : `Cette définition ne correspond pas. Pour <b>${esc(q.w.term)}</b> : ${esc(q.w.frDef)}`}</div>
      <div style="margin-top:14px"><button class="btn" data-a="gNext">${G.i + 1 < G.qs.length ? 'Suivant →' : 'Terminer'}</button></div>`}`;
  }
  const shown = G.ws.filter((w) => !G.matched.includes(w.id)), rights = G.right.filter((id) => !G.matched.includes(id));
  return `${head}<div class="score-line"><span>Associe le terme à sa traduction</span><span>${G.matched.length}/5</span></div>
    <div class="match-grid">${shown.map((w, i) => {
      const rid = rights[i], rw = wordById(rid);
      const cls = (side, id) => (G.flash && G.flash.includes(side + id) ? 'bad' : (side === 'L' ? G.selL : G.selR) === id ? 'sel' : '');
      return `<button class="option ${cls('L', w.id)}" data-a="mPick" data-v="L:${w.id}"><b>${esc(w.term)}</b></button><button class="option ${cls('R', rid)}" data-a="mPick" data-v="R:${rid}">${esc(gloss(rw))}</button>`;
    }).join('')}</div>`;
};
AFTER.game = () => {
  if (!G || G.kind !== 'quick' || G.done) return;
  const iv = setInterval(() => {
    G.left--;
    const c = $('#clock'), b = $('#timerBar');
    if (c) c.textContent = `⏱ ${Math.max(0, G.left)}s`; if (b) b.style.width = `${Math.max(0, (G.left / 90) * 100)}%`;
    if (G.left <= 0) { clearInterval(iv); endGame(); }
  }, 1000);
  cleanup = () => clearInterval(iv);
};
function endGame() {
  if (G.done) return;
  G.done = true;
  G.xp = G.kind === 'match' ? Math.max(5, 25 - 3 * G.mistakes) : G.score * 6;
  if (G.kind === 'match') { S.total += 5 + G.mistakes; S.correct += 5; }
  if (G.xp) addXP(G.xp); else save();
  if (G.kind === 'match' || G.score === G.qs.length) { confetti(); sfx.win(); }
  render();
}
function gameResult() {
  const total = G.kind === 'match' ? 5 : G.qs.length, good = G.kind === 'match' ? 5 : G.score;
  return `<div class="celebrate">
    <div class="trophy">${good === total ? '🏆' : good >= total / 2 ? '👏' : '💪'}</div>
    <h1 class="title" style="margin-top:14px">${good === total ? 'Parfait !' : good >= total / 2 ? 'Bien joué !' : 'Continue !'}</h1>
    <p class="sub">${G.kind === 'match' ? `Terminé avec ${pl(G.mistakes, 'erreur')}.` : `Tu as ${good} bonne${good > 1 ? 's' : ''} réponse${good > 1 ? 's' : ''} sur ${total}.`}</p>
    <div class="xp-pill">⭐ +${G.xp} XP</div>
    <div class="stack"><button class="btn" data-a="game" data-v="${G.kind}">Rejouer</button><button class="btn ghost" data-a="nav" data-v="/practice">Retour à la pratique</button></div></div>`;
}
function gameAnswer(v) {
  if (G.picked != null) return;
  buzz();
  const q = G.qs[G.i]; G.picked = +v;
  const ok = G.kind === 'quick' ? q.opts[G.picked].ok : (G.picked === 1) === q.truth;
  S.total++; if (ok) { S.correct++; G.score++; sfx.ok(); } else sfx.bad();
  save(); checkBadges(); render();
}
function matchPick(v) {
  const [side, id] = v.split(':');
  if (side === 'L') G.selL = G.selL === id ? null : id; else G.selR = G.selR === id ? null : id;
  if (G.selL && G.selR) {
    if (G.selL === G.selR) { G.matched.push(G.selL); sfx.ok(); G.selL = G.selR = null; G.flash = null; if (G.matched.length === 5) return endGame(); }
    else { G.mistakes++; G.flash = ['L' + G.selL, 'R' + G.selR]; sfx.bad(); G.selL = G.selR = null; setTimeout(() => { if (G) { G.flash = null; if (routePath()[0] === 'game') render(); } }, 500); }
  }
  render();
}

// --- Révision espacée (flashcards Leitner) ---
let R = null;
const INTERVALS = [0, 1, 3, 7, 14, 30];
function startReview() {
  const learned = Object.keys(S.learned);
  if (!learned.length) { toast('Apprends d’abord un mot avec la roue 🎡'); return; }
  const due = dueIds();
  R = { ids: sample(due.length ? due : learned, 10), i: 0, flip: false, easy: 0, xp: 0 };
  nav('/review');
}
VIEWS.review = () => {
  if (!R) { nav('/practice', true); return null; }
  if (R.i >= R.ids.length) {
    return `<div class="celebrate"><div class="trophy">🎯</div><h1 class="title" style="margin-top:14px">Révision terminée !</h1>
    <p class="sub">${pl(R.ids.length, 'carte')} revue${R.ids.length > 1 ? 's' : ''}, dont ${R.easy} facile${R.easy > 1 ? 's' : ''}.</p><div class="xp-pill">⭐ +${R.xp} XP</div>
    <div class="stack"><button class="btn" data-a="nav" data-v="/home">Retour à l’accueil</button></div></div>`;
  }
  const w = wordById(R.ids[R.i]), box = S.learned[w.id].box;
  return `<div class="topbar"><button class="icon-btn" data-a="back" data-v="/practice" aria-label="Quitter">${I.close}</button>
    <div class="progress-top"><div class="bar"><i style="width:${(R.i / R.ids.length) * 100}%"></i></div></div><span class="muted" style="font-weight:700">${R.i + 1}/${R.ids.length}</span></div>
  <div class="flash ${R.flip ? 'flip' : ''}" data-a="flip" role="button" tabindex="0" aria-label="Retourner la carte">
    <div class="flash-in">
      <div class="face"><span class="pill">Boîte ${box}</span><h2>${esc(w.term)}</h2><p class="mono muted">${esc(w.phonetic)}</p>
        <button class="icon-btn speak" data-speak="${esc(w.term)}" aria-label="Écouter">${I.speaker}</button><p class="sub">Touche la carte pour voir la réponse</p></div>
      <div class="face back"><h3>${esc(w.term)}</h3><p style="margin-top:6px"><b>${esc(gloss(w))}</b></p><p class="sub">${esc(w.frDef)}</p>
        <p class="sub" style="font-style:italic">« ${esc(w.examples[0].en)} »</p></div>
    </div></div>
  ${R.flip ? `<p class="sub center" style="margin-bottom:10px">Tu t’en souvenais ?</p><div class="rate">
    <button class="r1" data-a="rate" data-v="1">À revoir<small>demain</small></button>
    <button class="r2" data-a="rate" data-v="2">Moyen<small>dans 3 jours</small></button>
    <button class="r3" data-a="rate" data-v="3">Facile<small>dans 7 jours+</small></button></div>` : ''}`;
};
function rate(v) {
  const w = wordById(R.ids[R.i]), e = S.learned[w.id];
  if (v === 1) { e.box = 1; e.due = Date.now() + DAY; }
  else if (v === 2) { e.box = Math.max(2, e.box); e.due = Date.now() + 3 * DAY; }
  else { e.box = Math.min(5, e.box + 1); e.due = Date.now() + Math.max(7, INTERVALS[e.box]) * DAY; R.easy++; }
  markStudied(w.id); R.xp += 5; addXP(5);
  R.i++; R.flip = false; render();
  if (R.i >= R.ids.length) { confetti(); sfx.win(); }
}

// --- Carrière / entretien ---
VIEWS.career = () => {
  const next = INTERVIEW_QA.find((q) => !S.qaDone.includes(q.id)) || INTERVIEW_QA[0];
  return `<div class="topbar"><div><h2 class="title">Carrière</h2><p class="sub" style="margin-top:2px">Préparez vos entretiens</p></div></div>
  <div class="hero-card"><span class="art">🧑‍💻</span><div class="txt"><h3>Interview Vocabulary</h3><p class="sub">Explique ton code, tes projets et la tech en anglais.</p>
    <button class="btn sm" data-a="nav" data-v="/qa/${next.id}">Commencer →</button></div></div>
  <div class="section-title">Questions d’entretien <span class="muted" style="font-size:14px">${S.qaDone.length}/${INTERVIEW_QA.length}</span></div>
  <div class="list">${INTERVIEW_QA.map((q) => `<button class="item" data-a="nav" data-v="/qa/${q.id}"><span class="t"><b style="font-size:15px">${esc(q.q)}</b><small>${esc(q.topic)}</small></span>${S.qaDone.includes(q.id) ? '<span class="learned-mark">✓</span>' : ''}${I.chev.replace('<svg', '<svg class="chev"')}</button>`).join('')}</div>
  <div class="section-title">Verbes d’action pour ton CV</div>
  <div class="list">${INTERVIEW_VERBS.map((v) => `<div class="verb"><div class="row between"><b>${esc(v.verb)}</b><button class="icon-btn speak" style="width:36px;height:36px" data-speak="${esc(v.verb + '. ' + v.example)}" aria-label="Écouter">${I.speaker}</button></div><p>${esc(v.meaning)}</p><em>« ${esc(v.example)} »</em></div>`).join('')}</div>
  <div class="section-title">Simulations à venir</div>
  <div class="card row locked"><span style="font-size:26px">🔒</span><div><b>Entretien Tech</b><p class="sub" style="margin-top:2px">Simulation complète · 20 min · bientôt</p></div></div>`;
};

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let Q = { id: null, fr: false, rec: null, transcript: '' };
VIEWS.qa = (id) => {
  const q = INTERVIEW_QA.find((x) => x.id === id); if (!q) return VIEWS.career();
  if (Q.id !== id) Q = { id, fr: false, rec: null, transcript: '' };
  const idx = INTERVIEW_QA.indexOf(q), nxt = INTERVIEW_QA[(idx + 1) % INTERVIEW_QA.length], done = S.qaDone.includes(q.id);
  const hit = (k) => Q.transcript && squash(Q.transcript).includes(squash(k));
  return `${topbar(esc(q.topic), '/career')}
  <div class="card"><span class="pill">Question ${idx + 1}/${INTERVIEW_QA.length}</span>
    <h2 style="font-size:22px;margin-top:10px">${esc(q.q)}</h2><p class="sub">${esc(q.fr)}</p>
    <button class="btn ghost sm" style="margin-top:12px" data-speak="${esc(q.q)}">${I.speaker.replace('<svg', '<svg width="18" height="18"')} Écouter la question</button></div>
  <div class="section-title">Expressions clés</div>
  <div class="keys">${q.keys.map((k) => `<span class="key ${hit(k) ? 'hit' : ''}" data-k="${esc(k)}">${esc(k)}</span>`).join('')}</div>
  <div class="section-title">Réponse modèle ${done ? '✓' : ''}</div>
  <div class="card"><p class="answer">${esc(q.a)}</p>${Q.fr ? `<hr style="border:0;border-top:1px solid var(--line);margin:14px 0"><p class="answer fr">${esc(q.afr)}</p>` : ''}
    <div class="row" style="margin-top:14px;flex-wrap:wrap"><button class="btn sm" data-speak="${esc(q.a)}">${I.speaker.replace('<svg', '<svg width="18" height="18"')} Écouter</button>
    <button class="btn ghost sm" data-a="qaFr">${Q.fr ? 'Masquer' : 'Voir'} la traduction</button></div></div>
  <div class="section-title">À ton tour</div>
  <div class="card">${SR ? `<p class="sub" style="margin-top:0">Dis ta propre réponse à voix haute. Je repère les expressions clés que tu utilises.</p>
    <button class="btn mic-btn ${Q.rec ? 'rec' : ''}" id="micBtn" data-a="qaMic" style="margin-top:12px">${I.mic.replace('<svg', '<svg width="22" height="22"')} ${Q.rec ? 'Arrêter l’enregistrement' : 'Parler en anglais'}</button>
    <div class="transcript" id="transcript" ${Q.transcript ? '' : 'hidden'}>${esc(Q.transcript)}</div>`
    : `<p class="sub" style="margin-top:0">La reconnaissance vocale n’est pas disponible sur ce navigateur (essaie Chrome ou Edge). Répète la réponse à voix haute, puis valide.</p>`}
    <button class="btn ${done ? 'ghost' : 'mint'}" style="margin-top:12px" data-a="qaDone" ${done ? 'disabled' : ''}>${done ? '✓ Question maîtrisée' : 'J’ai répété cette réponse'}</button></div>
  <div style="margin-top:16px"><button class="btn ghost" data-a="nav" data-v="/qa/${nxt.id}">Question suivante →</button></div>`;
};
function qaMic() {
  if (Q.rec) { Q.rec.stop(); return; }
  const q = INTERVIEW_QA.find((x) => x.id === Q.id), r = new SR();
  r.lang = 'en-US'; r.interimResults = true; r.continuous = true; Q.transcript = '';
  r.onresult = (ev) => {
    Q.transcript = [...ev.results].map((x) => x[0].transcript).join(' ');
    const t = $('#transcript'); if (t) { t.hidden = false; t.textContent = Q.transcript; }
    $$('.key').forEach((el) => el.classList.toggle('hit', squash(Q.transcript).includes(squash(el.dataset.k))));
  };
  r.onerror = (e) => { toast(e.error === 'not-allowed' ? 'Autorise le micro pour utiliser cette fonction' : 'Micro indisponible'); };
  r.onend = () => {
    Q.rec = null;
    const hits = q.keys.filter((k) => squash(Q.transcript).includes(squash(k))).length;
    if (Q.transcript) { toast(hits ? `🎤 ${hits}/${q.keys.length} expressions clés utilisées` : 'Essaie d’utiliser les expressions clés'); if (hits >= Math.ceil(q.keys.length / 2)) markQa(q.id); }
    if (routePath()[0] === 'qa') render();
  };
  try { r.start(); Q.rec = r; render(); } catch (e) { toast('Micro indisponible'); }
  cleanup = () => { try { Q.rec && Q.rec.abort(); } catch (e) { /* ignore */ } Q.rec = null; };
}
function markQa(id) {
  if (S.qaDone.includes(id)) return;
  S.qaDone.push(id); addXP(15); toast('⭐ +15 XP — réponse maîtrisée !');
}

// --- Profil, stats, badges, réglages, FAQ ---
VIEWS.profile = () => {
  const lv = level(), rate = S.total ? Math.round((S.correct / S.total) * 100) : null;
  return `<div class="topbar"><h2 class="title">Mon Profil</h2><button class="icon-btn" data-a="nav" data-v="/settings" aria-label="Paramètres">${I.gear}</button></div>
  <div class="profile-head"><div class="avatar lg">${avatarOf()}</div><h2>${esc(S.name || 'Toi')}</h2>
    <p class="sub">Niveau ${lv.k} · ${S.xp} XP${lv.next ? ` · encore ${lv.next.min - S.xp} XP pour ${lv.next.k}` : ''}</p>
    <div class="bar" style="margin:10px auto 0;max-width:240px"><i style="width:${lv.pct}%"></i></div></div>
  <div class="tiles"><div class="tile"><b>${currentStreak()}</b><span>Jours</span></div><div class="tile"><b>${wordsLearned()}</b><span>Mots</span></div><div class="tile"><b>${rate == null ? '—' : rate + '%'}</b><span>Réussite</span></div></div>
  <div class="list">${[['🏅', 'Mes badges', '/badges'], ['📊', 'Mes statistiques', '/stats'], ['❤️', 'Mes favoris', '/favs'], ['🎯', 'Objectifs', '/goals'], ['⚙️', 'Paramètres', '/settings'], ['❓', 'FAQ', '/faq']]
    .map(([e, l, p]) => `<button class="item" data-a="nav" data-v="${p}"><span style="font-size:20px">${e}</span><span class="t"><b style="font-size:15px">${l}</b></span>${I.chev.replace('<svg', '<svg class="chev"')}</button>`).join('')}</div>`;
};
VIEWS.goals = () => `${topbar('Objectifs', '/profile')}
  <p class="sub" style="margin:0 0 12px">Ton objectif principal</p><div class="stack">${GOALS.map((g) => `<button class="option ${S.goal === g.id ? 'sel' : ''}" data-a="goalSet" data-v="${g.id}"><span class="ico">${g.icon}</span>${g.label}<span class="radio"></span></button>`).join('')}</div>
  <div class="section-title">Objectif quotidien</div><div class="seg">${[2, 3, 5].map((n) => `<button data-a="dailyGoal" data-v="${n}" class="${S.dailyGoal === n ? 'on' : ''}">${n} mots</button>`).join('')}</div>`;

let ST = { range: 7 };
VIEWS.stats = () => {
  const n = ST.range, pts = [];
  for (let i = n - 1; i >= 0; i--) { const d = new Date(Date.now() - i * DAY); pts.push({ d, xp: (S.days[dayKey(d)] || {}).xp || 0 }); }
  const max = Math.max(50, ...pts.map((p) => p.xp)), W = 340, H = 150, px = (i) => 14 + (i * (W - 28)) / (n - 1), py = (v) => H - 20 - (v / max) * (H - 40);
  const line = pts.map((p, i) => `${px(i).toFixed(1)},${py(p.xp).toFixed(1)}`).join(' ');
  const labels = pts.map((p, i) => (n === 7 || i % 6 === 0 || i === n - 1) ? `<text x="${px(i)}" y="${H - 3}" text-anchor="middle" font-size="10" fill="var(--ink-2)">${n === 7 ? ['D', 'L', 'M', 'M', 'J', 'V', 'S'][p.d.getDay()] : p.d.getDate()}</text>` : '').join('');
  const rate = S.total ? Math.round((S.correct / S.total) * 100) : null;
  return `${topbar('Statistiques', '/profile')}
  <div class="seg"><button data-a="range" data-v="7" class="${n === 7 ? 'on' : ''}">7 j</button><button data-a="range" data-v="30" class="${n === 30 ? 'on' : ''}">30 j</button></div>
  <div class="card"><b>XP gagnés</b><svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="XP par jour">
    <polygon points="${px(0)},${H - 20} ${line} ${px(n - 1)},${H - 20}" fill="rgba(56,189,248,.18)"/><polyline points="${line}" fill="none" stroke="#0284C7" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
    ${pts.map((p, i) => `<circle cx="${px(i)}" cy="${py(p.xp)}" r="${n === 7 ? 4 : 2.5}" fill="#0284C7"/>`).join('')}${labels}</svg></div>
  <div class="tiles"><div class="tile"><b>${wordsLearned()}</b><span>Mots appris</span></div><div class="tile"><b>${rate == null ? '—' : rate + '%'}</b><span>Réussite</span></div><div class="tile"><b>${S.best}</b><span>Meilleur streak</span></div></div>
  <div class="section-title">Par domaine</div><div class="card">${CATS.map((c) => {
    const all = TECH_VOCABULARY.filter((w) => w.category === c), got = all.filter((w) => S.learned[w.id]).length;
    return `<div class="dom"><div class="row between"><b>${CAT_ICON[c] || ''} ${esc(c)}</b><span class="muted" style="font-size:13px">${got}/${all.length}</span></div><div class="bar" style="margin-top:6px"><i style="width:${(got / all.length) * 100}%"></i></div></div>`;
  }).join('')}</div>`;
};

VIEWS.badges = () => {
  const have = BADGES.filter((b) => S.badges.includes(b.id)), top = have[have.length - 1];
  return `${topbar('Mes Badges', '/profile')}
  <div class="card badge-hero"><div class="big">${top ? top.em : '🔒'}</div><h3 style="margin-top:8px">${top ? esc(top.name) : 'Aucun badge pour l’instant'}</h3><p class="sub">${have.length}/${BADGES.length} débloqués · continue comme ça !</p></div>
  <div class="badges">${BADGES.map((b) => `<div class="badge ${S.badges.includes(b.id) ? '' : 'off'}" title="${esc(b.desc)}"><span class="em">${b.em}</span>${esc(b.name)}<div class="muted" style="font-weight:500;margin-top:4px">${esc(b.desc)}</div></div>`).join('')}</div>`;
};

VIEWS.settings = () => {
  const dark = document.documentElement.dataset.theme === 'dark';
  const sw = (key, on, label, icon) => `<div class="item"><span style="font-size:20px">${icon}</span><span class="t"><b style="font-size:15px">${label}</b></span><button class="switch ${on ? 'on' : ''}" role="switch" aria-checked="${on}" aria-label="${label}" data-a="toggle" data-v="${key}"></button></div>`;
  return `${topbar('Paramètres', '/profile')}
  <div class="list">${sw('dark', dark, 'Mode sombre', '🌙')}${sw('sound', S.settings.sound, 'Sons', '🔔')}${sw('autoSpeak', S.settings.autoSpeak, 'Prononciation automatique', '🔊')}
    <button class="item" data-a="nav" data-v="/goals"><span style="font-size:20px">🎯</span><span class="t"><b style="font-size:15px">Objectif quotidien</b><small>${S.dailyGoal} mots par jour</small></span>${I.chev.replace('<svg', '<svg class="chev"')}</button>
    ${isStandalone() ? '' : `<button class="item" data-a="install"><span style="font-size:20px">📲</span><span class="t"><b style="font-size:15px">Installer l’application</b><small>Écran d’accueil + hors ligne</small></span>${I.chev.replace('<svg', '<svg class="chev"')}</button>`}
    <button class="item" data-a="nav" data-v="/faq"><span style="font-size:20px">❓</span><span class="t"><b style="font-size:15px">FAQ</b></span>${I.chev.replace('<svg', '<svg class="chev"')}</button>
    <button class="item" data-a="nav" data-v="/backup"><span style="font-size:20px">💾</span><span class="t"><b style="font-size:15px">Sauvegarde de ma progression</b><small>Copier ou restaurer un code</small></span>${I.chev.replace('<svg', '<svg class="chev"')}</button></div>
  <div class="section-title">Informations légales</div>
  <div class="list"><a class="item" href="privacy.html"><span style="font-size:20px">🔒</span><span class="t"><b style="font-size:15px">Politique de confidentialité</b></span>${I.chev.replace('<svg', '<svg class="chev"')}</a>
    <a class="item" href="terms.html"><span style="font-size:20px">📄</span><span class="t"><b style="font-size:15px">Conditions d’utilisation</b></span>${I.chev.replace('<svg', '<svg class="chev"')}</a>
    <button class="item" data-a="reset"><span style="font-size:20px">🗑️</span><span class="t"><b class="danger" style="font-size:15px">Supprimer toutes mes données</b><small>Efface profil, XP et mots appris de cet appareil</small></span></button></div>
  <p class="version">TechLingo v1.0 · Speak Tech. Think Global.<br>Tes données restent sur cet appareil.</p>`;
};

const backupCode = () => btoa(unescape(encodeURIComponent(JSON.stringify(S))));
VIEWS.backup = () => {
  const code = S.onboarded ? backupCode() : '';
  return `${topbar('Sauvegarde', S.onboarded ? '/settings' : '/setup')}
  ${S.onboarded ? `<div class="card"><b>Mon code de sauvegarde</b><p class="sub">Garde ce code (note, email, message) pour retrouver ta progression sur un autre téléphone ou après une réinstallation.</p>
    <textarea class="input code" readonly rows="4" id="bkOut" aria-label="Code de sauvegarde">${esc(code)}</textarea>
    <div class="row" style="margin-top:10px"><button class="btn sm" data-a="copyBackup">Copier</button><button class="btn ghost sm" data-a="shareBackup">Partager</button></div></div>` : ''}
  <div class="card"><b>Restaurer une sauvegarde</b><p class="sub">Colle ici un code de sauvegarde TechLingo.</p>
    <textarea class="input code" rows="4" id="bkIn" placeholder="Colle ton code ici" aria-label="Code à restaurer"></textarea>
    <button class="btn" style="margin-top:10px" data-a="restoreBackup">Restaurer</button></div>`;
};
async function copyBackup() {
  const t = backupCode();
  try { await navigator.clipboard.writeText(t); toast('Code copié ✓'); }
  catch (e) { const el = $('#bkOut'); if (el) { el.focus(); el.select(); } toast('Sélectionne et copie le code'); }
}
async function shareBackup() {
  const text = backupCode();
  try { if (navigator.share) await navigator.share({ title: 'Sauvegarde TechLingo', text }); else await copyBackup(); }
  catch (e) { /* partage annulé */ }
}
function restoreBackup() {
  const raw = ($('#bkIn').value || '').trim();
  try {
    const o = JSON.parse(decodeURIComponent(escape(atob(raw))));
    if (typeof o !== 'object' || o === null || typeof o.xp !== 'number' || typeof o.learned !== 'object') throw new Error('format');
    S = { ...defaults(), ...o, settings: { ...defaults().settings, ...(o.settings || {}) }, onboarded: true };
    save(); applyTheme(); buzz('success'); toast('Progression restaurée ✓');
    navCount = 0; nav('/home', true);
  } catch (e) { toast('Code invalide. Vérifie que tu as tout copié.'); }
}

let FQ = -1;
VIEWS.faq = () => `${topbar('FAQ', '/profile')}
  <div class="list">${FAQ.map(([q, a], i) => `<div><button class="faq-q" data-a="faq" data-v="${i}" aria-expanded="${FQ === i}">${esc(q)}<span>${FQ === i ? '▴' : '▾'}</span></button>${FQ === i ? `<p class="faq-a">${esc(a)}</p>` : ''}</div>`).join('')}</div>`;

// =============================================================================
// Thème, actions, démarrage
// =============================================================================
function applyTheme() {
  const dark = S.settings.dark == null ? matchMedia('(prefers-color-scheme: dark)').matches : S.settings.dark;
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  $('meta[name="theme-color"]').content = dark ? '#0B1726' : '#EAF4FF';
  try { const SB = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.StatusBar; if (SB) { SB.setStyle({ style: dark ? 'DARK' : 'LIGHT' }); SB.setBackgroundColor({ color: dark ? '#0B1726' : '#EAF4FF' }); } } catch (e) { /* web */ }
}

const ACTIONS = {
  nav: (v) => { if (v === '/favs') { D = { q: '', cat: 'fav' }; nav('/dico'); } else nav(v); },
  back: (v) => back(v),
  tab: (v) => { navCount = 0; nav('/' + v); },
  obNext: () => { if (O.step >= SLIDES.length - 1) nav('/setup'); else obGo(O.step + 1); },
  obSkip: () => nav('/setup'),
  avatar: (v) => { S.avatar = v; save(); buzz(); render(); },
  goal: (v) => { S.goal = v; save(); buzz(); render(); },
  setupDone: () => { if (!S.name.trim() || !S.goal) return; S.onboarded = true; save(); buzz('success'); navCount = 0; nav('/home', true); },
  copyBackup: () => copyBackup(),
  shareBackup: () => shareBackup(),
  restoreBackup: () => restoreBackup(),
  goalSet: (v) => { S.goal = v; save(); render(); },
  dailyGoal: (v) => { S.dailyGoal = +v; save(); render(); },
  spin: () => spinWheel(),
  lesson: (v) => startLesson(v),
  lessonNext: () => { L.step++; render(); if (L.step === 1 && S.settings.autoSpeak) speak(wordById(L.id).term); },
  pick: (v) => { if (L.picked != null) return; buzz(); L.picked = +v; const ok = L.opts[L.picked].ok; S.total++; if (ok) { S.correct++; sfx.ok(); } else sfx.bad(); save(); checkBadges(); render(); },
  finishLesson: () => finishLesson(),
  cat: (v) => { D.cat = v; render(); },
  fav: (v) => { S.favs = S.favs.includes(v) ? S.favs.filter((x) => x !== v) : [...S.favs, v]; save(); render(); },
  review: () => startReview(),
  flip: () => { R.flip = !R.flip; render(); },
  rate: (v) => rate(+v),
  game: (v) => startGame(v),
  gAnswer: (v) => gameAnswer(v),
  gNext: () => { G.i++; G.picked = null; if (G.i >= G.qs.length) endGame(); else render(); },
  mPick: (v) => matchPick(v),
  qaFr: () => { Q.fr = !Q.fr; render(); },
  qaMic: () => qaMic(),
  qaDone: () => { markQa(Q.id); render(); },
  range: (v) => { ST.range = +v; render(); },
  faq: (v) => { FQ = FQ === +v ? -1 : +v; render(); },
  toggle: (v) => {
    if (v === 'dark') S.settings.dark = document.documentElement.dataset.theme !== 'dark'; else S.settings[v] = !S.settings[v];
    save(); applyTheme(); render();
  },
  install: async () => {
    if (deferredInstall) { deferredInstall.prompt(); await deferredInstall.userChoice; deferredInstall = null; render(); }
    else toast('Menu du navigateur → « Installer l’application » ou « Sur l’écran d’accueil »');
  },
  reset: () => {
    if (!confirm('Effacer toute ta progression (XP, mots appris, badges) ? Cette action est définitive.')) return;
    S = defaults(); save(); WH = { words: null, rot: 0, spinning: false, result: null }; L = G = R = null; applyTheme();
    O = { step: 0 }; navCount = 0; nav('/onboard', true);
  }
};

document.addEventListener('click', (e) => {
  const sp = e.target.closest('[data-speak]');
  if (sp) { e.stopPropagation(); speak(sp.dataset.speak); return; }
  const el = e.target.closest('[data-a]');
  if (!el) return;
  const fn = ACTIONS[el.dataset.a];
  if (fn) fn(el.dataset.v);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.id === 'nm') e.target.blur();
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.flash')) { e.preventDefault(); ACTIONS.flip(); }
});
document.addEventListener('input', (e) => {
  if (e.target.id === 'dq') { D.q = e.target.value; $('#dicoList').innerHTML = dicoList(); }
  if (e.target.id === 'nm') { S.name = e.target.value.trim().slice(0, 24); save(); const b = $('#setupBtn'); if (b) b.disabled = !(S.name && S.goal); }
});
window.addEventListener('hashchange', render);
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredInstall = e; if (routePath()[0] === 'home' || !routePath()[0]) render(); });
window.addEventListener('appinstalled', () => { deferredInstall = null; toast('TechLingo est installé 🎉'); });
document.addEventListener('visibilitychange', () => { if (document.hidden && 'speechSynthesis' in window) speechSynthesis.cancel(); });
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => { if (S.settings.dark == null) applyTheme(); });

applyTheme();
if (!location.hash || location.hash === '#') location.replace(S.onboarded ? '#/home' : '#/onboard');
render();
checkBadges();

// Écran de chargement animé (durée minimale pour que l'animation se voie)
(function hideBoot() {
  const boot = $('#boot'); if (!boot) return;
  setTimeout(() => { boot.classList.add('out'); setTimeout(() => boot.remove(), 600); }, Math.max(200, 1900 - performance.now()));
  try { const SS = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.SplashScreen; if (SS) SS.hide(); } catch (e) { /* web */ }
})();

// Bouton retour Android : revenir en arrière, ou quitter depuis l'accueil
try {
  const A = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
  if (A) A.addListener('backButton', () => {
    const name = routePath()[0] || 'home';
    if (TABS.some((t) => t.r === name) && name !== 'home') { navCount = 0; nav('/home'); }
    else if (name === 'home' || name === 'onboard') A.exitApp();
    else if (navCount > 0) { navCount--; history.back(); }
    else nav('/home', true);
  });
} catch (e) { /* web */ }

if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { /* hors ligne indisponible */ }));
}
