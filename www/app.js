/* TechLingo — application (vanilla JS, aucun build requis) */
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
const isDark = () => document.documentElement.dataset.theme === 'dark';

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

// Domaines : icône + teinte
const CAT = {
  DevOps: ['refresh', 237], Cloud: ['cloud', 255], Frontend: ['layout', 330], Backend: ['server', 152], Web: ['globe', 200],
  Mobile: ['phone', 70], 'Réseaux': ['network', 290], 'Systèmes': ['cpu', 262], Langages: ['code', 40], 'Data & AI': ['brain', 305], Architecture: ['boxes', 135]
};
const CATS = [...new Set(TECH_VOCABULARY.map((w) => w.category))];
const hueStyle = (h) => isDark() ? `--c:oklch(0.82 0.1 ${h});--c-soft:oklch(0.3 0.06 ${h})` : `--c:oklch(0.48 0.13 ${h});--c-soft:oklch(0.95 0.035 ${h})`;
const catIcon = (cat, size = 22, lg = false) => `<span class="badge-ic ${lg ? 'lg' : ''}" style="${hueStyle((CAT[cat] || ['book', 237])[1])}">${icon((CAT[cat] || ['book'])[0], size)}</span>`;
const tintIcon = (name, h, size = 22, lg = false) => `<span class="badge-ic ${lg ? 'lg' : ''}" style="${hueStyle(h)}">${icon(name, size)}</span>`;

// Mascotte Byte (corps entier) et tête seule pour les avatars
function byte(size = 160, accent = '#FBBF24') {
  return `<svg class="s-byte" width="${size}" height="${size}" viewBox="0 0 200 200" aria-hidden="true">
    <line x1="100" y1="22" x2="100" y2="40" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
    <circle cx="100" cy="17" r="8" fill="${accent}"/>
    <rect x="70" y="138" width="60" height="44" rx="22" fill="#F1F7FD"/>
    <circle cx="100" cy="160" r="7" fill="${accent}"/>
    <ellipse cx="58" cy="156" rx="13" ry="10" fill="#E3EEF9"/><ellipse cx="142" cy="156" rx="13" ry="10" fill="#E3EEF9"/>
    <rect x="26" y="76" width="14" height="34" rx="7" fill="#DCEBF8"/><rect x="160" y="76" width="14" height="34" rx="7" fill="#DCEBF8"/>
    <rect x="38" y="40" width="124" height="100" rx="46" fill="#fff"/>
    <rect x="54" y="62" width="92" height="54" rx="26" fill="#0F2A44"/>
    <circle cx="82" cy="86" r="8" fill="#38E1FF"/><circle cx="118" cy="86" r="8" fill="#38E1FF"/>
    <path d="M88 100 Q100 110 112 100" stroke="#38E1FF" stroke-width="4.5" fill="none" stroke-linecap="round"/>
  </svg>`;
}
const AVATARS = [['sky', '#38BDF8'], ['violet', '#A78BFA'], ['mint', '#34D399'], ['sun', '#FBBF24'], ['coral', '#FB7185'], ['slate', '#94A3B8']];
function byteHead(size, color) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true">
    <circle cx="50" cy="50" r="50" fill="${color}"/>
    <line x1="50" y1="20" x2="50" y2="28" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/><circle cx="50" cy="18" r="4.5" fill="#fff"/>
    <rect x="20" y="28" width="60" height="48" rx="22" fill="#fff"/>
    <rect x="27" y="38" width="46" height="27" rx="13" fill="#0F2A44"/>
    <circle cx="40" cy="50" r="4" fill="#38E1FF"/><circle cx="60" cy="50" r="4" fill="#38E1FF"/>
    <path d="M44 57 Q50 61 56 57" stroke="#38E1FF" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  </svg>`;
}
const avatarColor = () => (AVATARS.find((a) => a[0] === S.avatar) || AVATARS[0])[1];
const avatarOf = (size = 40) => byteHead(size, avatarColor());

// =============================================================================
// État persistant (sur l'appareil)
// =============================================================================
const KEY = 'techlingo.v1';
const defaults = () => ({
  name: '', avatar: 'sky', goal: '', onboarded: false, xp: 0, streak: 0, best: 0, lastDay: '',
  learned: {}, favs: [], badges: [], days: {}, correct: 0, total: 0, qaDone: [], dailyGoal: 3,
  settings: { dark: null, sound: true, autoSpeak: false }
});
function loadState() {
  try {
    const o = JSON.parse(localStorage.getItem(KEY)) || {};
    const d = defaults();
    const st = { ...d, ...o, settings: { ...d.settings, ...(o.settings || {}) } };
    if (!AVATARS.some((a) => a[0] === st.avatar)) st.avatar = 'sky';
    return st;
  } catch (e) { return defaults(); }
}
let S = loadState();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* stockage indisponible */ } };

const dayRec = () => (S.days[dayKey()] ||= { xp: 0, ids: [] });
const wordsLearned = () => Object.keys(S.learned).length;
const currentStreak = () => (S.lastDay === dayKey() || S.lastDay === dayKey(new Date(Date.now() - DAY)) ? S.streak : 0);
function touchStreak() {
  const t = dayKey();
  if (S.lastDay === t) return;
  S.streak = S.lastDay === dayKey(new Date(Date.now() - DAY)) ? S.streak + 1 : 1;
  S.lastDay = t; S.best = Math.max(S.best, S.streak);
}
function addXP(n) { S.xp += n; dayRec().xp += n; touchStreak(); checkBadges(); save(); }
const LEVELS = [{ k: 'A2', min: 0 }, { k: 'B1', min: 300 }, { k: 'B2', min: 800 }, { k: 'C1', min: 1800 }];
function level() {
  let i = 0; LEVELS.forEach((l, n) => { if (S.xp >= l.min) i = n; });
  const cur = LEVELS[i], next = LEVELS[i + 1];
  return { k: cur.k, cur, next, pct: next ? Math.round(((S.xp - cur.min) / (next.min - cur.min)) * 100) : 100 };
}
function markStudied(id) { const r = dayRec(); if (!r.ids.includes(id)) r.ids.push(id); }
const todayWords = () => dayRec().ids.length;
const dailyPct = () => Math.min(100, Math.round((todayWords() / S.dailyGoal) * 100));
const dueIds = () => Object.entries(S.learned).filter(([, v]) => v.due <= Date.now()).map(([id]) => id);
const lastLearnedId = () => Object.entries(S.learned).sort((a, b) => b[1].at - a[1].at)[0]?.[0];
const GOAL_ICON = { interview: 'target', career: 'trend', understand: 'bulb', skills: 'wrench' };

const BADGES = [
  { id: 'first', ic: 'sprout', h: 152, name: 'Premier mot', desc: 'Apprends ton premier mot', ok: () => wordsLearned() >= 1 },
  { id: 'ten', ic: 'book', h: 237, name: '10 mots', desc: 'Apprends 10 mots', ok: () => wordsLearned() >= 10 },
  { id: 'streak3', ic: 'flame', h: 52, name: 'Série de 3', desc: '3 jours de suite', ok: () => S.best >= 3 },
  { id: 'streak7', ic: 'zap', h: 85, name: 'Série de 7', desc: '7 jours de suite', ok: () => S.best >= 7 },
  { id: 'quiz', ic: 'trophy', h: 75, name: 'Quiz Master', desc: '20 bonnes réponses', ok: () => S.correct >= 20 },
  { id: 'explorer', ic: 'compass', h: 200, name: 'Explorateur', desc: 'Mots dans 5 domaines', ok: () => new Set(Object.keys(S.learned).map((id) => wordById(id)?.category)).size >= 5 },
  { id: 'speaker', ic: 'mic', h: 290, name: 'Prêt pour l’entretien', desc: '3 réponses répétées', ok: () => S.qaDone.length >= 3 },
  { id: 'xp500', ic: 'gem', h: 305, name: '500 XP', desc: 'Atteins 500 XP', ok: () => S.xp >= 500 }
];
function checkBadges() {
  BADGES.forEach((b) => {
    if (!S.badges.includes(b.id) && b.ok()) {
      S.badges.push(b.id);
      setTimeout(() => { toast(`Badge débloqué : ${b.name}`, 'award'); sfx.win(); buzz('success'); }, 700);
    }
  });
}

// =============================================================================
// Audio, haptique, toast, confettis
// =============================================================================
let voice = null;
function pickVoice() {
  if (!('speechSynthesis' in window)) return;
  const v = speechSynthesis.getVoices();
  voice = v.find((x) => /en-US/i.test(x.lang) && /Google|Natural|Samantha|Aria|Jenny/i.test(x.name)) || v.find((x) => /^en/i.test(x.lang)) || null;
}
if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
function speak(text, rate = 0.95) {
  if (!('speechSynthesis' in window)) { toast('Audio indisponible sur cet appareil', 'info'); return; }
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
const cap = (name) => window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins[name];
function buzz(kind = 'light') {
  try {
    const H = cap('Haptics');
    if (H) { if (kind === 'success') H.notification({ type: 'SUCCESS' }); else if (kind === 'error') H.notification({ type: 'ERROR' }); else H.impact({ style: 'LIGHT' }); return; }
    if (navigator.vibrate) navigator.vibrate(kind === 'success' ? [12, 40, 12] : kind === 'error' ? [30, 30, 30] : 8);
  } catch (e) { /* non supporté */ }
}
let toastTimer;
function toast(msg, ic = 'info') {
  const t = $('#toast'); t.innerHTML = `${icon(ic, 18)}<span>${esc(msg)}</span>`; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}
function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = $('#confetti'), dpr = Math.min(devicePixelRatio || 1, 2);
  c.width = c.clientWidth * dpr; c.height = c.clientHeight * dpr;
  const ctx = c.getContext('2d'); ctx.scale(dpr, dpr);
  const W = c.clientWidth, H = c.clientHeight, colors = ['#1C9BE0', '#34C77B', '#F5B82E', '#8B6CF0', '#F0596B'];
  const ps = Array.from({ length: 120 }, () => ({
    x: W / 2 + (Math.random() - 0.5) * 80, y: H * 0.32, vx: (Math.random() - 0.5) * 12, vy: -Math.random() * 13 - 4,
    s: 6 + Math.random() * 6, c: colors[Math.floor(Math.random() * colors.length)], r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4
  }));
  const t0 = performance.now();
  (function frame(now) {
    const t = now - t0;
    ctx.clearRect(0, 0, W, H);
    ps.forEach((p) => { p.vy += 0.32; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.globalAlpha = Math.max(0, 1 - t / 2200); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 3, p.s, p.s / 1.6); ctx.restore(); });
    if (t < 2200) requestAnimationFrame(frame); else ctx.clearRect(0, 0, W, H);
  })(t0);
}

// =============================================================================
// Routeur (avec sens de transition)
// =============================================================================
const TABS = [
  { r: 'home', label: 'Accueil', ic: 'home' }, { r: 'dico', label: 'Dico', ic: 'dico' },
  { r: 'practice', label: 'Pratique', ic: 'practice' }, { r: 'career', label: 'Carrière', ic: 'career' },
  { r: 'profile', label: 'Profil', ic: 'profile' }
];
let navCount = 0, pendingDir = 'fade';
function nav(path, replace = false, dir = 'fwd') {
  pendingDir = dir;
  const target = '#' + path;
  if (location.hash === target) { render(); return; }
  if (replace) location.replace(target); else { navCount++; location.hash = path; }
}
function back(fallback) {
  pendingDir = 'back';
  if (navCount > 0) { navCount--; history.back(); } else nav(fallback, true, 'back');
}
const routePath = () => (location.hash.replace(/^#\/?/, '') || '').split('/').map(decodeURIComponent);

let cleanup = null;
function render() {
  if (cleanup) { cleanup(); cleanup = null; }
  const [raw, a, b] = routePath();
  const name = raw || 'home';
  if (!S.onboarded && !['onboard', 'setup', 'backup'].includes(name)) return nav('/onboard', true, 'fade');
  const view = VIEWS[name] || VIEWS.home;
  const html = view(a, b);
  if (html == null) return;
  const dir = pendingDir || 'back'; pendingDir = null;
  const app = $('#app');
  app.innerHTML = `<div class="screen ${dir}">${html}</div>`;
  app.scrollTop = 0;
  const tab = TABS.some((t) => t.r === name);
  const bar = $('#tabbar');
  bar.hidden = !tab;
  if (tab) {
    bar.innerHTML = `<div class="brand-side"><img src="icons/icon.svg" width="32" height="32" alt="">TechLingo</div>` + TABS.map((t) => `<button data-a="tab" data-v="${t.r}" class="${t.r === name ? 'on' : ''}" aria-label="${t.label}" ${t.r === name ? 'aria-current="page"' : ''}><span class="pill">${icon(t.ic, 24)}</span><span>${t.label}</span></button>`).join('');
  }
  const after = AFTER[name];
  if (after) after(a, b);
}
const navbar = (title, fallback, right = '<span></span>') => `<div class="navbar"><button class="icon-btn" data-a="back" data-v="${fallback}" aria-label="Retour">${icon('back', 26)}</button><h2>${title}</h2>${right}</div>`;
const largebar = (title, right = '') => `<div class="largebar"><h1>${title}</h1>${right}</div>`;
const chev = () => icon('chev', 20, 'chev');

// =============================================================================
// Écrans
// =============================================================================
const VIEWS = {}, AFTER = {};

// --- Onboarding : 4 scènes animées -------------------------------------------
let O = { step: 0 };
function wheelSvg(size, light = false) {
  const cols = light ? ['rgba(255,255,255,.95)', 'rgba(255,255,255,.55)', 'rgba(255,255,255,.8)', 'rgba(255,255,255,.4)', 'rgba(255,255,255,.9)', 'rgba(255,255,255,.5)', 'rgba(255,255,255,.75)', 'rgba(255,255,255,.35)']
    : ['#7DD3FC', '#86EFAC', '#FDE68A', '#C4B5FD', '#FCA5A5', '#FDBA74', '#A5F3FC', '#F9A8D4'];
  let p = '';
  for (let i = 0; i < 8; i++) {
    const a0 = (i / 8) * 2 * Math.PI, a1 = ((i + 1) / 8) * 2 * Math.PI, r = 96;
    p += `<path d="M100 100 L${(100 + r * Math.cos(a0)).toFixed(1)} ${(100 + r * Math.sin(a0)).toFixed(1)} A${r} ${r} 0 0 1 ${(100 + r * Math.cos(a1)).toFixed(1)} ${(100 + r * Math.sin(a1)).toFixed(1)}Z" fill="${cols[i]}" stroke="${light ? 'transparent' : '#fff'}" stroke-width="3"/>`;
  }
  return `<svg width="${size}" height="${size}" viewBox="0 0 200 200" aria-hidden="true">${p}<circle cx="100" cy="100" r="24" fill="${light ? 'rgba(255,255,255,.95)' : '#fff'}"/></svg>`;
}
const SLIDES = [
  {
    color: 'oklch(0.6 0.15 237)', title: 'Parle tech en anglais',
    text: 'Explique ton code, le DevOps, le web, le mobile et les réseaux avec les mots justes.',
    scene: () => `${byte(190)}<span class="mock s-term t1">deploy</span><span class="mock s-term t2">REST API</span><span class="mock s-term t3">latency</span><span class="mock s-term t4">pull request</span>`
  },
  {
    color: 'oklch(0.56 0.17 290)', title: 'Un mot tech par jour',
    text: 'Tourne la roue, découvre un terme, écoute sa prononciation et vois-le dans de vraies phrases d’équipe.',
    scene: () => `<div class="s-wheel">${wheelSvg(190, true)}</div>
      <div class="mock s-word"><div class="h"><div><b>Kubernetes</b><div class="ph">/ˌkjuːbərˈnetiːz/</div></div><span class="spk">${icon('speaker', 20)}</span></div>
      <div class="s-line" style="width:94%"></div><div class="s-line" style="width:72%"></div><div class="s-line" style="width:84%"></div></div>`
  },
  {
    color: 'oklch(0.6 0.15 160)', title: 'Retiens pour de bon',
    text: 'La révision espacée te ramène chaque mot au bon moment, avec des quiz rapides pour t’entraîner.',
    scene: () => `<div><div class="s-flip"><div class="in"><div class="mock s-face"><b>latency</b><small>/ˈleɪtənsi/</small></div><div class="mock s-face bk"><b>latence</b><small>délai de réponse</small></div></div></div>
      <div class="s-rate"><span class="mock" style="color:var(--danger-ink)">À revoir</span><span class="mock" style="color:oklch(0.55 0.13 75)">Moyen</span><span class="mock" style="color:var(--success-ink)">Facile</span></div></div>`
  },
  {
    color: 'oklch(0.66 0.16 50)', title: 'Prêt pour l’entretien',
    text: 'Réponds aux vraies questions d’entretien à voix haute et vérifie que tu utilises les expressions clés.',
    scene: () => `<div class="s-chat"><div class="mock s-bub q">Can you explain what DevOps is?</div>
      <div class="s-bub a">DevOps is a culture that automates testing and deployment with a CI/CD pipeline.</div>
      <div class="s-keys"><span class="s-key">culture</span><span class="s-key">automates</span><span class="s-key">CI/CD pipeline</span></div></div>`
  }
];
VIEWS.onboard = () => {
  const s = SLIDES[O.step], last = O.step === SLIDES.length - 1;
  return `<div class="ob">
    <div class="ob-stage" style="--slide:${s.color}">
      <div class="ob-head"><div class="ob-steps">${SLIDES.map((_, i) => `<i class="${i <= O.step ? 'on' : ''}"></i>`).join('')}</div>
        <button class="ob-skip" data-a="obSkip" style="visibility:${last ? 'hidden' : 'visible'}">Passer</button></div>
      <div class="ob-scenes">${SLIDES.map((x, i) => `<div class="scene ${i === O.step ? 'on' : i < O.step ? 'prev' : ''}" aria-hidden="${i !== O.step}">${x.scene()}</div>`).join('')}</div>
    </div>
    <div class="ob-panel">
      <div class="ob-text" aria-live="polite"><h1>${s.title}</h1><p>${s.text}</p></div>
      <div class="cta"><button class="btn" data-a="obNext">${last ? 'Commencer' : 'Continuer'}</button></div>
    </div></div>`;
};
function obGo(step) {
  if (step < 0 || step >= SLIDES.length || step === O.step) return;
  O.step = step;
  const s = SLIDES[step], last = step === SLIDES.length - 1;
  $('.ob-stage').style.setProperty('--slide', s.color);
  $$('.scene').forEach((el, i) => { el.className = `scene ${i === step ? 'on' : i < step ? 'prev' : ''}`; el.setAttribute('aria-hidden', i !== step); });
  $$('.ob-steps i').forEach((el, i) => el.classList.toggle('on', i <= step));
  $('.ob-text').innerHTML = `<h1>${s.title}</h1><p>${s.text}</p>`;
  $('.ob-text').animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: 'cubic-bezier(.25,1,.5,1)' });
  $('[data-a=obNext]').textContent = last ? 'Commencer' : 'Continuer';
  $('.ob-skip').style.visibility = last ? 'hidden' : 'visible';
  buzz();
}
AFTER.onboard = () => {
  const st = $('.ob-stage'); let x0 = null, y0 = 0;
  st.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  st.addEventListener('touchend', (e) => {
    if (x0 == null) return;
    const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) obGo(O.step + (dx < 0 ? 1 : -1));
    x0 = null;
  }, { passive: true });
};

// --- Création du profil ------------------------------------------------------
VIEWS.setup = () => {
  const ready = S.name.trim().length > 0 && !!S.goal;
  return `<div class="setup">
    <div><h1>Crée ton profil</h1><p class="sub" style="margin-top:6px">Il reste sur ton téléphone. Pas de compte, aucune donnée envoyée.</p></div>
    <div class="field"><label id="avl">Ton avatar</label>
      <div class="avatars" role="radiogroup" aria-labelledby="avl">${AVATARS.map(([id, c]) => `<button class="av ${S.avatar === id ? 'sel' : ''}" role="radio" aria-checked="${S.avatar === id}" aria-label="Byte ${id}" data-a="avatar" data-v="${id}">${byteHead(46, c)}</button>`).join('')}</div></div>
    <div class="field"><label for="nm">Ton prénom ou pseudo</label><input id="nm" class="input" placeholder="Ex. Alex" maxlength="24" autocomplete="off" autocapitalize="words" value="${esc(S.name)}"></div>
    <div class="field"><label id="gl">Ton objectif</label><div class="choices" role="radiogroup" aria-labelledby="gl">${GOALS.map((g) => `<button class="choice ${S.goal === g.id ? 'sel' : ''}" role="radio" aria-checked="${S.goal === g.id}" data-a="goal" data-v="${g.id}">${icon(GOAL_ICON[g.id], 22)}<span>${g.label}</span>${S.goal === g.id ? `<span class="end">${icon('checkCircle', 22)}</span>` : ''}</button>`).join('')}</div></div>
    <div class="cta">
      <p class="legal" style="margin-bottom:14px">En continuant, tu acceptes les <a href="terms.html">Conditions d’utilisation</a> et la <a href="privacy.html">Politique de confidentialité</a>.</p>
      <button class="btn" id="setupBtn" data-a="setupDone" ${ready ? '' : 'disabled'}>C’est parti</button>
      <button class="text-btn" style="width:100%;margin-top:6px" data-a="nav" data-v="/backup">J’ai déjà une sauvegarde</button>
    </div></div>`;
};

// --- Accueil -----------------------------------------------------------------
let deferredInstall = null;
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone || !!cap('App');
function ring(pct, size = 64) {
  const r = (size - 10) / 2, c = 2 * Math.PI * r;
  return `<div class="ring" style="width:${size}px;height:${size}px"><svg width="${size}" height="${size}" aria-hidden="true">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--surface-2)" stroke-width="8"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--success)" stroke-width="8" stroke-linecap="round" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${(c * (1 - pct / 100)).toFixed(1)}"/></svg>
    <span class="v">${pct}%</span></div>`;
}
VIEWS.home = () => {
  const lv = level(), due = dueIds().length, lastId = lastLearnedId(), last = lastId && wordById(lastId), st = currentStreak();
  const units = CATS.map((c) => { const all = TECH_VOCABULARY.filter((w) => w.category === c); return { c, all: all.length, got: all.filter((w) => S.learned[w.id]).length }; })
    .sort((x, y) => (x.got === x.all) - (y.got === y.all) || y.got / y.all - x.got / x.all);
  return `
  <div class="topstats">
    <button class="avatar-btn" data-a="tab" data-v="profile" aria-label="Mon profil">${avatarOf(40)}</button><span class="sp"></span>
    <span class="stat-pill streak ${st ? '' : 'off'}" title="Jours de suite">${icon('flame', 22)}${st}</span>
    <span class="stat-pill xp" title="Points d’expérience">${icon('zap', 22)}${S.xp}</span>
  </div>
  <div class="hello"><h1>Bonjour ${esc(S.name || '')}</h1><p class="sub">Niveau ${lv.k} · ${todayWords() >= S.dailyGoal ? 'objectif du jour atteint' : `encore ${pl(S.dailyGoal - todayWords(), 'mot')} aujourd’hui`}</p></div>

  <div class="hero">
    <div class="art">${wheelSvg(170, true)}</div>
    <div class="txt"><span class="k">${icon('sparkles', 16)} Mot du jour</span><h2>Tourne la roue</h2><p>Découvre un nouveau terme tech en 5 minutes.</p>
      <button class="btn white sm" data-a="nav" data-v="/spin">${icon('play', 18)} Lancer</button></div>
  </div>

  <div class="tile goal" style="margin-top:14px">${ring(dailyPct())}
    <div style="flex:1"><b>Objectif du jour</b><p class="sub">${todayWords()} sur ${S.dailyGoal} mots étudiés</p></div>
    <button class="icon-btn" data-a="nav" data-v="/goals" aria-label="Modifier l’objectif">${icon('gear', 20)}</button></div>

  ${due ? `<button class="tile press feature" style="margin-top:14px" data-a="review">${tintIcon('clock', 75, 22)}<span class="t"><b>${pl(due, 'mot')} à réviser</b><span class="sub" style="display:block">Révise maintenant pour ne pas oublier</span></span>${chev()}</button>` : ''}
  ${deferredInstall && !isStandalone() ? `<button class="tile press feature" style="margin-top:14px" data-a="install">${tintIcon('download', 290, 22)}<span class="t"><b>Installer TechLingo</b><span class="sub" style="display:block">Sur ton écran d’accueil, même hors ligne</span></span>${chev()}</button>` : ''}

  <div class="section">Parcours <small>${wordsLearned()}/${TECH_VOCABULARY.length} mots</small></div>
  <div class="group">${units.map((u) => `<button class="row" data-a="unit" data-v="${esc(u.c)}">${catIcon(u.c)}<span class="t"><b>${esc(u.c)}</b>
    <span class="bar" style="margin-top:7px;height:8px;display:block"><i style="width:${(u.got / u.all) * 100}%"></i></span></span>
    <span class="muted" style="font-size:13px;font-weight:700;min-width:30px;text-align:right">${u.got === u.all ? icon('checkCircle', 20, 'ok') : `${u.got}/${u.all}`}</span></button>`).join('')}</div>

  ${last ? `<div class="section">Dernier mot appris</div><div class="tile feature"><div class="t"><b>${esc(last.term)}</b><div class="mono muted" style="font-size:13px">${esc(last.phonetic)}</div><div class="sub">${esc(gloss(last))}</div></div>
    <button class="speak" data-speak="${esc(last.term)}" aria-label="Écouter ${esc(last.term)}">${icon('speaker', 20)}</button></div>` : ''}`;
};
function startUnit(cat) {
  const next = TECH_VOCABULARY.find((w) => w.category === cat && !S.learned[w.id]);
  if (next) startLesson(next.id);
  else { D = { q: '', cat }; nav('/dico'); }
}

// --- Roue --------------------------------------------------------------------
const WHEEL_COLORS = ['#7DD3FC', '#86EFAC', '#FDE68A', '#C4B5FD', '#FCA5A5', '#FDBA74', '#A5F3FC', '#F9A8D4'];
let WH = { words: null, rot: 0, spinning: false, result: null };
function newWheelWords() {
  const fresh = TECH_VOCABULARY.filter((w) => !S.learned[w.id]);
  WH.words = sample(fresh.length >= 8 ? fresh : TECH_VOCABULARY, 8); WH.result = null;
}
VIEWS.spin = () => {
  if (!WH.words) newWheelWords();
  return `${navbar('Mot du jour', '/home')}
  <p class="sub center">Tourne la roue pour tirer un terme tech.</p>
  <div class="wheel-wrap"><svg class="pointer" viewBox="0 0 34 42" aria-hidden="true"><path d="M17 41 L3 12 A15 15 0 1 1 31 12Z" fill="#F5B82E" stroke="#fff" stroke-width="3"/><circle cx="17" cy="15" r="5" fill="#fff"/></svg>
    <canvas id="wheel" role="img" aria-label="Roue de mots tech"></canvas></div>
  <div id="spinResult">${spinResultHtml()}</div>
  <div class="cta"><button class="btn ${WH.result ? 'ghost' : ''}" id="spinBtn" data-a="spin" ${WH.spinning ? 'disabled' : ''}>${icon('refresh', 20)} ${WH.result ? 'Tourner encore' : 'Tourner la roue'}</button></div>`;
};
function spinResultHtml(pop = false) {
  const w = WH.result;
  if (!w) return '';
  return `<div class="tile result ${pop ? 'pop' : ''}"><span class="chip" style="${hueStyle(CAT[w.category][1])};background:var(--c-soft);color:var(--c)">${icon(CAT[w.category][0], 14)} ${esc(w.category)}</span>
    <h2>${esc(w.term)}</h2><p class="sub">${esc(gloss(w))}</p>
    <button class="btn success" style="margin-top:16px" data-a="lesson" data-v="${w.id}">Découvrir ce mot ${icon('arrow', 20)}</button></div>`;
}
function drawWheel() {
  const cv = $('#wheel'); if (!cv) return;
  const size = cv.clientWidth || 300, dpr = Math.min(devicePixelRatio || 1, 2);
  cv.width = cv.height = Math.round(size * dpr);
  const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
  const r = size / 2, n = WH.words.length, seg = (2 * Math.PI) / n;
  ctx.clearRect(0, 0, size, size);
  ctx.save(); ctx.translate(r, r);
  ctx.beginPath(); ctx.arc(0, 0, r - 2, 0, 2 * Math.PI); ctx.fillStyle = isDark() ? '#2A3E57' : '#D6E6F5'; ctx.fill();
  ctx.rotate(WH.rot);
  WH.words.forEach((w, i) => {
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r - 10, i * seg, (i + 1) * seg); ctx.closePath();
    ctx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length]; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();
    ctx.save(); ctx.rotate(i * seg + seg / 2); ctx.textAlign = 'right'; ctx.fillStyle = '#10243A';
    const label = w.term.length > 13 ? w.term.slice(0, 12) + '…' : w.term;
    ctx.font = `700 ${label.length > 9 ? 13 : 15}px "DM Sans", system-ui, sans-serif`;
    ctx.fillText(label, r - 26, 5); ctx.restore();
  });
  ctx.rotate(-WH.rot);
  ctx.beginPath(); ctx.arc(0, 0, 34, 0, 2 * Math.PI); ctx.fillStyle = '#fff'; ctx.fill();
  ctx.lineWidth = 4; ctx.strokeStyle = isDark() ? '#2A3E57' : '#D6E6F5'; ctx.stroke();
  ctx.fillStyle = '#0284C7'; ctx.font = '700 12px "DM Sans", system-ui, sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(WH.spinning ? '…' : 'SPIN', 0, 4);
  ctx.restore();
}
AFTER.spin = () => drawWheel();
function spinWheel() {
  if (WH.spinning) return;
  WH.spinning = true; WH.result = null; buzz();
  $('#spinResult').innerHTML = '';
  const btn = $('#spinBtn'); btn.disabled = true; btn.innerHTML = 'La roue tourne…';
  const TAU = 2 * Math.PI, n = WH.words.length, seg = TAU / n, idx = Math.floor(Math.random() * n), f = 0.2 + Math.random() * 0.6;
  const mod = (x) => ((x % TAU) + TAU) % TAU;
  const cur = WH.rot, delta = mod(mod(-Math.PI / 2 - (idx + f) * seg) - mod(cur));
  const total = delta + (4 + Math.floor(Math.random() * 3)) * TAU, t0 = performance.now(), dur = 4000;
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
    sfx.win(); buzz('success');
    const res = $('#spinResult'); if (res) res.innerHTML = spinResultHtml(true);
    const b = $('#spinBtn'); if (b) { b.disabled = false; b.classList.add('ghost'); b.innerHTML = `${icon('refresh', 20)} Tourner encore`; }
  })(t0);
}

// --- Leçon : définition → exemples → quiz → fin ------------------------------
let L = null;
const LETTERS = ['A', 'B', 'C', 'D'];
function startLesson(id) {
  const w = wordById(id); if (!w) return;
  L = { id, step: 1, opts: shuffle(w.quiz.options.map((t, i) => ({ t, ok: i === w.quiz.correctIndex }))), sel: null, picked: null, result: null };
  nav('/lesson/' + id);
  if (S.settings.autoSpeak) setTimeout(() => speak(w.term), 350);
}
function feedbackSheet(ok, title, text, action, label = 'Continuer') {
  return `<div class="sheet-pad"></div><div class="sheet full ${ok ? 'ok' : 'bad'}" role="alert"><div class="in">
    <div class="h"><span class="disc">${icon(ok ? 'check' : 'close', 22)}</span>${title}</div>
    <p>${text}</p><button class="btn ${ok ? 'success' : 'danger'}" data-a="${action}">${label}</button></div></div>`;
}
VIEWS.lesson = (id) => {
  const w = wordById(id);
  if (!w) return VIEWS.home();
  if (!L || L.id !== id) { startLesson(id); return null; }
  const head = `<div class="lessonbar"><button class="icon-btn" data-a="back" data-v="/home" aria-label="Quitter la leçon">${icon('close', 26)}</button>
    <div class="bar"><i style="width:${(L.step / 3) * 100}%"></i></div></div>`;
  if (L.step === 1) return `${head}
    <div class="term-hero"><div><h1>${esc(w.term)}</h1><div class="ph">${esc(w.phonetic)}</div>
      <div class="chips"><span class="chip">${esc(w.partOfSpeech)}</span><span class="chip" style="${hueStyle(CAT[w.category][1])};background:var(--c-soft);color:var(--c)">${icon(CAT[w.category][0], 14)} ${esc(w.category)}</span></div></div>
      <button class="speak-lg" data-speak="${esc(w.term)}" aria-label="Écouter la prononciation">${icon('speaker', 26)}</button></div>
    <div class="def"><h3>${icon('languages', 16)} Definition</h3><p>${esc(w.enDef)}</p>
      <button class="text-btn" style="padding-left:0" data-speak="${esc(w.enDef)}">${icon('speaker', 18).replace('class="ic ', 'style="display:inline;vertical-align:-3px;margin-right:6px" class="ic ')}Écouter la définition</button></div>
    <div class="def" style="margin-top:8px"><h3>En français</h3><p class="fr">${esc(w.frDef)}</p></div>
    <div class="cta"><button class="btn" data-a="lessonNext">Voir des exemples</button></div>`;
  if (L.step === 2) return `${head}
    <h2 class="q-title">Comment on l’utilise</h2>
    <div class="tile" style="padding:4px 16px">${w.examples.map((e) => `<div class="ex">${icon('quote', 20, 'qi')}<div style="flex:1"><p>${esc(e.en)}</p><small>${esc(e.fr)}</small></div>
      <button class="speak" data-speak="${esc(e.en)}" aria-label="Écouter l’exemple">${icon('speaker', 18)}</button></div>`).join('')}</div>
    <div class="memo">${icon('bulb', 24)}<div><b>À retenir</b><p>${esc(w.takeaway)}</p></div></div>
    <div class="cta"><button class="btn" data-a="lessonNext">Je teste mes connaissances</button></div>`;
  const q = w.quiz, p = L.picked, checked = p != null;
  const okIdx = L.opts.findIndex((o) => o.ok);
  return `${head}
    <h2 class="q-title">${esc(q.question)}</h2>
    <div class="choices">${L.opts.map((o, i) => {
      const cls = !checked ? (L.sel === i ? 'sel' : '') : (o.ok ? 'ok' : i === p ? 'bad' : 'dim');
      return `<button class="choice ${cls}" data-a="sel" data-v="${i}" ${checked ? 'disabled' : ''}><span class="key">${LETTERS[i]}</span><span>${esc(o.t)}</span></button>`;
    }).join('')}</div>
    ${checked ? feedbackSheet(L.opts[p].ok, L.opts[p].ok ? 'Bonne réponse !' : 'Pas tout à fait', `${L.opts[p].ok ? '' : `Réponse : <b>${esc(L.opts[okIdx].t)}</b>. `}${esc(q.explanation)}`, 'finishLesson')
      : `<div class="cta"><button class="btn success" data-a="check" ${L.sel == null ? 'disabled' : ''}>Vérifier</button></div>`}`;
};
function finishLesson() {
  const first = !S.learned[L.id], ok = L.opts[L.picked].ok;
  let xp = first ? 30 : 10; if (ok) xp += first ? 20 : 5;
  if (first) S.learned[L.id] = { box: 1, due: Date.now() + 2 * DAY, at: Date.now() };
  markStudied(L.id); addXP(xp);
  L.result = { xp, ok, first };
  WH.words = null;
  nav('/done/' + L.id, true);
}
VIEWS.done = (id) => {
  const w = wordById(id);
  if (!w || !L || L.id !== id || !L.result) return VIEWS.home();
  const r = L.result;
  setTimeout(() => { if (r.ok) { confetti(); sfx.win(); buzz('success'); } }, 200);
  return `<div class="done">
    <div class="medal ${r.ok ? '' : 'alt'}">${icon(r.ok ? 'trophy' : 'thumbsUp', 56)}</div>
    <h1>${r.ok ? 'Leçon terminée !' : 'Bien essayé !'}</h1>
    <p class="sub">Tu connais maintenant <b>${esc(w.term)}</b>. ${r.first ? 'Il reviendra en révision dans 2 jours.' : 'Révision enregistrée.'}</p>
    <div class="recap"><div style="--c:var(--gold-press)"><span>XP gagnés</span><b>${icon('zap', 20)} ${r.xp}</b></div>
      <div style="--c:${r.ok ? 'var(--success)' : 'var(--brand)'}"><span>Quiz</span><b>${icon(r.ok ? 'target' : 'refresh', 20)} ${r.ok ? '100 %' : 'À revoir'}</b></div></div>
    <div class="actions"><button class="btn" data-a="nav" data-v="/home">Continuer</button><button class="btn ghost" data-a="nav" data-v="/spin">Un autre mot</button></div></div>`;
};

// --- Dictionnaire ------------------------------------------------------------
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
  if (!items.length) return `<div class="empty">${icon(D.cat === 'fav' ? 'bookmark' : 'search', 40)}${D.cat === 'fav' ? 'Aucun favori pour l’instant.<br>Ouvre un mot et touche le marque-page.' : 'Aucun résultat.<br>Essaie un autre mot, en anglais ou en français.'}</div>`;
  return `<div class="group">${items.map((w) => `<button class="row" data-a="nav" data-v="/word/${w.id}">${catIcon(w.category)}
    <span class="t"><b>${esc(w.term)}</b><small>${esc(gloss(w))}</small></span>${S.learned[w.id] ? icon('checkCircle', 20, 'ok') : ''}${chev()}</button>`).join('')}</div>`;
}
VIEWS.dico = () => `${largebar('Dictionnaire')}
  <div class="search">${icon('search', 20)}<input id="dq" class="input" type="search" placeholder="Rechercher en anglais ou en français" value="${esc(D.q)}" autocomplete="off" aria-label="Rechercher un mot"></div>
  <div class="filters" role="tablist">${[['all', 'Tous', ''], ['fav', 'Favoris', 'bookmark'], ...CATS.map((c) => [c, c, CAT[c][0]])].map(([k, l, ic]) => `<button role="tab" aria-selected="${D.cat === k}" data-a="cat" data-v="${esc(k)}" class="${D.cat === k ? 'on' : ''}">${ic ? icon(ic, 16) : ''}${esc(l)}</button>`).join('')}</div>
  <div id="dicoList">${dicoList()}</div>
  <p class="count">${TECH_VOCABULARY.length} mots · ${wordsLearned()} appris</p>`;

VIEWS.word = (id) => {
  const w = wordById(id); if (!w) return VIEWS.dico();
  const fav = S.favs.includes(w.id);
  return `${navbar('', '/dico', `<button class="icon-btn ${fav ? 'on' : ''}" data-a="fav" data-v="${w.id}" aria-pressed="${fav}" aria-label="${fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}">${icon('bookmark', 24).replace('fill="none"', fav ? 'fill="currentColor"' : 'fill="none"')}</button>`)}
  <div class="term-hero"><div><h1>${esc(w.term)}</h1><div class="ph">${esc(w.phonetic)}</div>
    <div class="chips"><span class="chip">${esc(w.partOfSpeech)}</span><span class="chip" style="${hueStyle(CAT[w.category][1])};background:var(--c-soft);color:var(--c)">${icon(CAT[w.category][0], 14)} ${esc(w.category)}</span>${S.learned[w.id] ? `<span class="chip" style="background:var(--success-soft);color:var(--success-ink)">${icon('check', 14)} Appris</span>` : ''}</div></div>
    <button class="speak-lg" data-speak="${esc(w.term)}" aria-label="Écouter la prononciation">${icon('speaker', 26)}</button></div>
  <div class="def"><h3>Definition</h3><p>${esc(w.enDef)}</p></div>
  <div class="def"><h3>En français</h3><p class="fr">${esc(w.frDef)}</p></div>
  <div class="section">Exemples</div>
  <div class="tile" style="padding:4px 16px">${w.examples.map((e) => `<div class="ex">${icon('quote', 20, 'qi')}<div style="flex:1"><p>${esc(e.en)}</p><small>${esc(e.fr)}</small></div><button class="speak" data-speak="${esc(e.en)}" aria-label="Écouter l’exemple">${icon('speaker', 18)}</button></div>`).join('')}</div>
  <div class="memo">${icon('bulb', 24)}<div><b>À retenir</b><p>${esc(w.takeaway)}</p></div></div>
  <div class="cta"><button class="btn" data-a="lesson" data-v="${w.id}">${S.learned[w.id] ? 'Refaire la leçon' : 'Apprendre ce mot'}</button></div>`;
};

// --- Pratique ----------------------------------------------------------------
VIEWS.practice = () => {
  const due = dueIds().length, n = wordsLearned();
  return `${largebar('Pratique')}
  <button class="tile press feature" data-a="review">${tintIcon('layers', 237, 26, true)}<span class="t"><b>Révision espacée</b>
    <span class="sub" style="display:block">${due ? `${pl(due, 'carte')} à réviser maintenant` : n ? 'Tout est à jour, révise quand même' : 'Apprends d’abord un mot avec la roue'}</span></span>${due ? `<span class="chip">${due}</span>` : chev()}</button>
  <div class="section">Jeux rapides</div>
  <div class="group">
    <button class="row" data-a="game" data-v="quick">${tintIcon('timer', 52)}<span class="t"><b>Quiz rapide</b><small>5 questions · 90 secondes</small></span>${chev()}</button>
    <button class="row" data-a="game" data-v="tf">${tintIcon('checkCircle', 152)}<span class="t"><b>Vrai ou faux</b><small>6 définitions à juger</small></span>${chev()}</button>
    <button class="row" data-a="game" data-v="match">${tintIcon('link', 290)}<span class="t"><b>Associer</b><small>5 termes et leur traduction</small></span>${chev()}</button>
  </div>
  <div class="section">Ta précision</div>
  <div class="tile goal">${ring(S.total ? Math.round((S.correct / S.total) * 100) : 0)}<div><b>${S.correct} bonne${S.correct > 1 ? 's' : ''} réponse${S.correct > 1 ? 's' : ''}</b><p class="sub">sur ${S.total} question${S.total > 1 ? 's' : ''} au total</p></div></div>`;
};

let G = null;
function startGame(kind) {
  G = { kind, i: 0, score: 0, picked: null, done: false, xp: 0, mistakes: 0 };
  if (kind === 'quick') {
    G.qs = sample(TECH_VOCABULARY, 5).map((w) => ({ w, opts: shuffle(w.quiz.options.map((t, i) => ({ t, ok: i === w.quiz.correctIndex }))) }));
    G.left = 90;
  } else if (kind === 'tf') {
    G.qs = sample(TECH_VOCABULARY, 6).map((w) => {
      const truth = Math.random() < 0.5, other = sample(TECH_VOCABULARY.filter((x) => x.id !== w.id), 1)[0];
      return { w, truth, text: truth ? w.frDef : other.frDef };
    });
  } else {
    const ws = sample(TECH_VOCABULARY, 5);
    G.ws = ws; G.right = shuffle(ws.map((w) => w.id)); G.matched = []; G.selL = null; G.selR = null; G.flash = null;
  }
  nav('/game/' + kind);
}
VIEWS.game = (kind) => {
  if (!G || G.kind !== kind) { nav('/practice', true, 'fade'); return null; }
  if (G.done) return gameResult();
  const prog = kind === 'match' ? G.matched.length / 5 : (G.i + (G.picked != null ? 1 : 0)) / G.qs.length;
  const head = `<div class="lessonbar"><button class="icon-btn" data-a="back" data-v="/practice" aria-label="Quitter">${icon('close', 26)}</button><div class="bar"><i style="width:${prog * 100}%"></i></div></div>`;
  if (kind === 'quick') {
    const q = G.qs[G.i], p = G.picked, okIdx = q.opts.findIndex((o) => o.ok);
    return `${head}<div class="timer-row"><span>Question ${G.i + 1} sur ${G.qs.length}</span><span class="clock">${icon('timer', 18)}<span id="clock">${G.left} s</span></span></div>
    <div class="bar brand" style="height:6px"><i id="timerBar" style="width:${(G.left / 90) * 100}%"></i></div>
    <h2 class="q-title" style="margin-top:18px">${esc(q.w.quiz.question)}</h2>
    <div class="choices">${q.opts.map((o, i) => `<button class="choice ${p == null ? '' : o.ok ? 'ok' : i === p ? 'bad' : 'dim'}" data-a="gAnswer" data-v="${i}" ${p != null ? 'disabled' : ''}><span class="key">${LETTERS[i]}</span><span>${esc(o.t)}</span></button>`).join('')}</div>
    ${p == null ? '' : feedbackSheet(q.opts[p].ok, q.opts[p].ok ? 'Bonne réponse !' : 'Raté', `${q.opts[p].ok ? '' : `Réponse : <b>${esc(q.opts[okIdx].t)}</b>. `}${esc(q.w.quiz.explanation)}`, 'gNext', G.i + 1 < G.qs.length ? 'Continuer' : 'Voir mon score')}`;
  }
  if (kind === 'tf') {
    const q = G.qs[G.i], p = G.picked, right = p != null && (p === 1) === q.truth;
    return `${head}<div class="timer-row"><span>Définition ${G.i + 1} sur ${G.qs.length}</span><span>${G.score} correcte${G.score > 1 ? 's' : ''}</span></div>
    <h2 class="q-title" style="margin-top:8px">Cette définition est-elle juste ?</h2>
    <div class="tile tf"><div class="term">${esc(q.w.term)}</div><p>${esc(q.text)}</p></div>
    ${p == null ? `<div class="two"><button class="btn success" data-a="gAnswer" data-v="1">${icon('check', 20)} Vrai</button><button class="btn danger" data-a="gAnswer" data-v="0">${icon('close', 20)} Faux</button></div>`
      : feedbackSheet(right, right ? 'Exact !' : 'Raté', q.truth ? 'Cette définition correspond bien au terme.' : `Elle décrit un autre terme. <b>${esc(q.w.term)}</b> : ${esc(q.w.frDef)}`, 'gNext', G.i + 1 < G.qs.length ? 'Continuer' : 'Voir mon score')}`;
  }
  const shown = G.ws.filter((w) => !G.matched.includes(w.id)), rights = G.right.filter((id) => !G.matched.includes(id));
  const cls = (side, id) => (G.flash && G.flash.includes(side + id) ? 'bad' : (side === 'L' ? G.selL : G.selR) === id ? 'sel' : '');
  return `${head}<h2 class="q-title">Associe chaque terme à sa traduction</h2>
    <div class="pairs">${shown.map((w, i) => {
      const rid = rights[i], rw = wordById(rid);
      return `<button class="choice ${cls('L', w.id)}" data-a="mPick" data-v="L:${w.id}"><b>${esc(w.term)}</b></button><button class="choice ${cls('R', rid)}" data-a="mPick" data-v="R:${rid}">${esc(gloss(rw))}</button>`;
    }).join('')}</div>
    <p class="count">${G.mistakes ? pl(G.mistakes, 'erreur') : 'Aucune erreur pour l’instant'}</p>`;
};
AFTER.game = () => {
  if (!G || G.kind !== 'quick' || G.done || G.picked != null) return;
  const iv = setInterval(() => {
    G.left--;
    const c = $('#clock'), b = $('#timerBar');
    if (c) c.textContent = `${Math.max(0, G.left)} s`; if (b) b.style.width = `${Math.max(0, (G.left / 90) * 100)}%`;
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
  render();
}
function gameResult() {
  const total = G.kind === 'match' ? 5 : G.qs.length, good = G.kind === 'match' ? 5 : G.score;
  const perfect = G.kind === 'match' ? G.mistakes === 0 : good === total;
  if (perfect) setTimeout(() => { confetti(); sfx.win(); buzz('success'); }, 200);
  const acc = G.kind === 'match' ? Math.round((5 / (5 + G.mistakes)) * 100) : Math.round((good / total) * 100);
  return `<div class="done">
    <div class="medal ${perfect ? '' : 'alt'}">${icon(perfect ? 'trophy' : good >= total / 2 ? 'thumbsUp' : 'target', 56)}</div>
    <h1>${perfect ? 'Sans faute !' : good >= total / 2 ? 'Bien joué !' : 'Continue comme ça'}</h1>
    <p class="sub">${G.kind === 'match' ? `Toutes les paires trouvées avec ${pl(G.mistakes, 'erreur')}.` : `${good} bonne${good > 1 ? 's' : ''} réponse${good > 1 ? 's' : ''} sur ${total}.`}</p>
    <div class="recap"><div style="--c:var(--gold-press)"><span>XP gagnés</span><b>${icon('zap', 20)} ${G.xp}</b></div><div style="--c:var(--success)"><span>Précision</span><b>${icon('target', 20)} ${acc} %</b></div></div>
    <div class="actions"><button class="btn" data-a="game" data-v="${G.kind}">Rejouer</button><button class="btn ghost" data-a="nav" data-v="/practice">Retour à la pratique</button></div></div>`;
}
function gameAnswer(v) {
  if (G.picked != null) return;
  if (cleanup) { cleanup(); cleanup = null; }
  const q = G.qs[G.i]; G.picked = +v;
  const ok = G.kind === 'quick' ? q.opts[G.picked].ok : (G.picked === 1) === q.truth;
  S.total++; if (ok) { S.correct++; G.score++; sfx.ok(); buzz('success'); } else { sfx.bad(); buzz('error'); }
  save(); checkBadges(); pendingDir = 'none'; render();
}
function matchPick(v) {
  const [side, id] = v.split(':');
  buzz();
  if (side === 'L') G.selL = G.selL === id ? null : id; else G.selR = G.selR === id ? null : id;
  if (G.selL && G.selR) {
    if (G.selL === G.selR) { G.matched.push(G.selL); sfx.ok(); G.selL = G.selR = null; G.flash = null; if (G.matched.length === 5) return endGame(); }
    else {
      G.mistakes++; G.flash = ['L' + G.selL, 'R' + G.selR]; sfx.bad(); buzz('error'); G.selL = G.selR = null;
      setTimeout(() => { if (G) { G.flash = null; if (routePath()[0] === 'game') { pendingDir = 'none'; render(); } } }, 500);
    }
  }
  pendingDir = 'none'; render();
}

// --- Révision espacée (Leitner) ----------------------------------------------
let R = null;
const INTERVALS = [0, 1, 3, 7, 14, 30];
function startReview() {
  const learned = Object.keys(S.learned);
  if (!learned.length) { toast('Apprends d’abord un mot avec la roue', 'info'); return; }
  const due = dueIds();
  R = { ids: sample(due.length ? due : learned, 10), i: 0, flip: false, easy: 0, xp: 0 };
  nav('/review');
}
VIEWS.review = () => {
  if (!R) { nav('/practice', true, 'fade'); return null; }
  if (R.i >= R.ids.length) {
    return `<div class="done"><div class="medal">${icon('layers', 56)}</div><h1>Révision terminée</h1>
    <p class="sub">${pl(R.ids.length, 'carte')} revue${R.ids.length > 1 ? 's' : ''}, dont ${R.easy} facile${R.easy > 1 ? 's' : ''}.</p>
    <div class="recap"><div style="--c:var(--gold-press)"><span>XP gagnés</span><b>${icon('zap', 20)} ${R.xp}</b></div><div style="--c:var(--success)"><span>Faciles</span><b>${icon('checkCircle', 20)} ${R.easy}</b></div></div>
    <div class="actions"><button class="btn" data-a="nav" data-v="/home">Retour à l’accueil</button></div></div>`;
  }
  const w = wordById(R.ids[R.i]), box = S.learned[w.id].box;
  return `<div class="lessonbar"><button class="icon-btn" data-a="back" data-v="/practice" aria-label="Quitter">${icon('close', 26)}</button>
    <div class="bar"><i style="width:${(R.i / R.ids.length) * 100}%"></i></div><span class="muted" style="font-weight:700;font-size:14px">${R.i + 1}/${R.ids.length}</span></div>
  <div class="flash ${R.flip ? 'flip' : ''}" data-a="flip" role="button" tabindex="0" aria-label="Retourner la carte">
    <div class="flash-in">
      <div class="face"><span class="chip">Boîte ${box}</span><h2>${esc(w.term)}</h2><p class="mono muted">${esc(w.phonetic)}</p>
        <button class="speak" data-speak="${esc(w.term)}" aria-label="Écouter">${icon('speaker', 20)}</button><p class="sub">Touche la carte pour voir la réponse</p></div>
      <div class="face back"><h3 style="font-size:20px">${esc(w.term)}</h3><p style="margin-top:6px;font-weight:700;color:var(--success-ink)">${esc(gloss(w))}</p><p class="sub">${esc(w.frDef)}</p>
        <p class="sub" style="font-style:italic">« ${esc(w.examples[0].en)} »</p></div>
    </div></div>
  <div class="cta">${R.flip ? `<p class="sub center" style="margin-bottom:12px">Tu t’en souvenais ?</p><div class="rate">
    <button class="btn danger" data-a="rate" data-v="1">À revoir<small>demain</small></button>
    <button class="btn gold" data-a="rate" data-v="2">Moyen<small>dans 3 jours</small></button>
    <button class="btn success" data-a="rate" data-v="3">Facile<small>7 jours et +</small></button></div>`
    : `<button class="btn" data-a="flip">Voir la réponse</button>`}</div>`;
};
function rate(v) {
  const w = wordById(R.ids[R.i]), e = S.learned[w.id];
  if (v === 1) { e.box = 1; e.due = Date.now() + DAY; }
  else if (v === 2) { e.box = Math.max(2, e.box); e.due = Date.now() + 3 * DAY; }
  else { e.box = Math.min(5, e.box + 1); e.due = Date.now() + Math.max(7, INTERVALS[e.box]) * DAY; R.easy++; }
  markStudied(w.id); R.xp += 5; addXP(5); buzz();
  R.i++; R.flip = false; pendingDir = 'fwd'; render();
  if (R.i >= R.ids.length) { confetti(); sfx.win(); }
}

// --- Carrière / entretien ----------------------------------------------------
VIEWS.career = () => {
  const next = INTERVIEW_QA.find((q) => !S.qaDone.includes(q.id)) || INTERVIEW_QA[0];
  const done = S.qaDone.length;
  return `${largebar('Carrière')}
  <div class="hero" style="background:var(--violet);box-shadow:0 4px 0 var(--violet-press)">
    <div class="art" style="right:-10px;opacity:.25">${icon('message', 150)}</div>
    <div class="txt" style="max-width:72%"><span class="k">${icon('mic', 16)} Entraînement</span><h2>Prépare ton entretien</h2><p>${done}/${INTERVIEW_QA.length} questions maîtrisées</p>
      <button class="btn white sm" style="--t:var(--violet)" data-a="nav" data-v="/qa/${next.id}">${icon('play', 18)} ${done ? 'Continuer' : 'Commencer'}</button></div></div>
  <div class="section">Questions d’entretien <small>${done}/${INTERVIEW_QA.length}</small></div>
  <div class="group">${INTERVIEW_QA.map((q) => `<button class="row" data-a="nav" data-v="/qa/${q.id}">${tintIcon('message', 290)}<span class="t"><b>${esc(q.q)}</b><small>${esc(q.topic)}</small></span>${S.qaDone.includes(q.id) ? icon('checkCircle', 20, 'ok') : ''}${chev()}</button>`).join('')}</div>
  <div class="section">Verbes d’action pour ton CV</div>
  <div class="group">${INTERVIEW_VERBS.map((v) => `<div class="verb"><div class="h"><b>${esc(v.verb)}</b><button class="speak" data-speak="${esc(v.verb + '. ' + v.example)}" aria-label="Écouter ${esc(v.verb)}">${icon('speaker', 18)}</button></div><p>${esc(v.meaning)}</p><em>${esc(v.example)}</em></div>`).join('')}</div>
  <div class="section">Bientôt</div>
  <div class="group"><div class="row" style="opacity:.7">${tintIcon('lock', 262)}<span class="t"><b>Simulation d’entretien complète</b><small>20 minutes avec questions enchaînées</small></span></div></div>`;
};

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let Q = { id: null, fr: false, rec: null, transcript: '' };
VIEWS.qa = (id) => {
  const q = INTERVIEW_QA.find((x) => x.id === id); if (!q) return VIEWS.career();
  if (Q.id !== id) Q = { id, fr: false, rec: null, transcript: '' };
  const idx = INTERVIEW_QA.indexOf(q), nxt = INTERVIEW_QA[(idx + 1) % INTERVIEW_QA.length], done = S.qaDone.includes(q.id);
  const hit = (k) => Q.transcript && squash(Q.transcript).includes(squash(k));
  return `${navbar(`Question ${idx + 1}/${INTERVIEW_QA.length}`, '/career')}
  <span class="chip" style="${hueStyle(290)};background:var(--c-soft);color:var(--c);align-self:flex-start">${esc(q.topic)}</span>
  <div class="term-hero" style="margin-top:10px"><div><h1 style="font-size:24px">${esc(q.q)}</h1><p class="sub" style="margin-top:6px">${esc(q.fr)}</p></div>
    <button class="speak-lg" style="background:var(--violet);box-shadow:0 4px 0 var(--violet-press)" data-speak="${esc(q.q)}" aria-label="Écouter la question">${icon('speaker', 26)}</button></div>
  <div class="section">Expressions clés</div>
  <div class="keys">${q.keys.map((k) => `<span class="kw ${hit(k) ? 'hit' : ''}" data-k="${esc(k)}">${hit(k) ? icon('check', 14) : ''}${esc(k)}</span>`).join('')}</div>
  <div class="section">Réponse modèle ${done ? `<small style="color:var(--success-ink);display:inline-flex;gap:4px;align-items:center">${icon('checkCircle', 16)} maîtrisée</small>` : ''}</div>
  <div class="tile"><p class="answer">${esc(q.a)}</p>${Q.fr ? `<p class="answer fr">${esc(q.afr)}</p>` : ''}
    <div class="btn-row"><button class="btn sm" data-speak="${esc(q.a)}">${icon('speaker', 18)} Écouter</button><button class="btn ghost sm" data-a="qaFr">${icon('languages', 18)} ${Q.fr ? 'Masquer' : 'Traduction'}</button></div></div>
  <div class="section">À ton tour</div>
  <div class="tile">${SR ? `<p class="sub">Réponds à voix haute en anglais. Les expressions clés que tu utilises s’allument.</p>
    <button class="btn violet ${Q.rec ? 'rec' : ''}" style="margin-top:14px" data-a="qaMic">${icon('mic', 22)} ${Q.rec ? 'Arrêter' : 'Parler en anglais'}</button>
    <div class="transcript" id="transcript" ${Q.transcript ? '' : 'hidden'}>${esc(Q.transcript)}</div>`
    : `<p class="sub">Lis la réponse modèle à voix haute, puis reformule-la avec ton propre projet.</p>`}
    <button class="btn ${done ? 'ghost' : 'success'}" style="margin-top:12px" data-a="qaDone" ${done ? 'disabled' : ''}>${done ? 'Question maîtrisée' : 'J’ai répété cette réponse'}</button></div>
  <div class="cta"><button class="btn ghost" data-a="nav" data-v="/qa/${nxt.id}">Question suivante ${icon('arrow', 20)}</button></div>`;
};
function qaMic() {
  if (Q.rec) { Q.rec.stop(); return; }
  const q = INTERVIEW_QA.find((x) => x.id === Q.id), r = new SR();
  r.lang = 'en-US'; r.interimResults = true; r.continuous = true; Q.transcript = '';
  r.onresult = (ev) => {
    Q.transcript = [...ev.results].map((x) => x[0].transcript).join(' ');
    const t = $('#transcript'); if (t) { t.hidden = false; t.textContent = Q.transcript; }
    $$('.kw').forEach((el) => el.classList.toggle('hit', squash(Q.transcript).includes(squash(el.dataset.k))));
  };
  r.onerror = (e) => toast(e.error === 'not-allowed' ? 'Autorise le micro pour utiliser cette fonction' : 'Micro indisponible', 'mic');
  r.onend = () => {
    Q.rec = null;
    const hits = q.keys.filter((k) => squash(Q.transcript).includes(squash(k))).length;
    if (Q.transcript) { toast(hits ? `${hits}/${q.keys.length} expressions clés utilisées` : 'Essaie d’utiliser les expressions clés', 'mic'); if (hits >= Math.ceil(q.keys.length / 2)) markQa(q.id); }
    if (routePath()[0] === 'qa') { pendingDir = 'none'; render(); }
  };
  try { r.start(); Q.rec = r; pendingDir = 'none'; render(); } catch (e) { toast('Micro indisponible', 'mic'); }
  cleanup = () => { try { if (Q.rec) Q.rec.abort(); } catch (e) { /* ignore */ } Q.rec = null; };
}
function markQa(id) {
  if (S.qaDone.includes(id)) return;
  S.qaDone.push(id); addXP(15); buzz('success'); toast('+15 XP · réponse maîtrisée', 'zap');
}

// --- Profil, stats, badges, réglages -----------------------------------------
VIEWS.profile = () => {
  const lv = level(), acc = S.total ? Math.round((S.correct / S.total) * 100) : null;
  return `${largebar('Profil', `<button class="icon-btn" data-a="nav" data-v="/settings" aria-label="Paramètres">${icon('gear', 24)}</button>`)}
  <div class="me"><div class="avatar-lg">${avatarOf(84)}</div><h2>${esc(S.name || 'Toi')}</h2>
    <div class="lvl"><div class="bar brand"><i style="width:${lv.pct}%"></i></div><div class="labels"><span>Niveau ${lv.k}</span><span>${lv.next ? `${S.xp}/${lv.next.min} XP` : `${S.xp} XP`}</span></div></div></div>
  <div class="kpis">
    <div class="kpi" style="--c:var(--streak)">${icon('flame', 22)}<b>${currentStreak()}</b><span>jours de suite</span></div>
    <div class="kpi" style="--c:var(--brand)">${icon('dico', 22)}<b>${wordsLearned()}</b><span>mots appris</span></div>
    <div class="kpi" style="--c:var(--success)">${icon('target', 22)}<b>${acc == null ? '–' : acc + ' %'}</b><span>de réussite</span></div></div>
  <div class="section">Mon espace</div>
  <div class="group">${[['award', 85, 'Badges', `${S.badges.length}/${BADGES.length} débloqués`, '/badges'], ['chart', 237, 'Statistiques', 'Activité et domaines', '/stats'], ['bookmark', 25, 'Favoris', pl(S.favs.length, 'mot'), '/favs'], ['target', 152, 'Objectifs', `${S.dailyGoal} mots par jour`, '/goals']]
    .map(([ic, h, l, s, p]) => `<button class="row" data-a="nav" data-v="${p}">${tintIcon(ic, h)}<span class="t"><b>${l}</b><small>${s}</small></span>${chev()}</button>`).join('')}</div>
  <div class="group" style="margin-top:14px">${[['gear', 262, 'Paramètres', '/settings'], ['help', 200, 'Aide et FAQ', '/faq']]
    .map(([ic, h, l, p]) => `<button class="row" data-a="nav" data-v="${p}">${tintIcon(ic, h)}<span class="t"><b>${l}</b></span>${chev()}</button>`).join('')}</div>`;
};
VIEWS.goals = () => `${navbar('Objectifs', '/profile')}
  <div class="section" style="margin-top:6px">Objectif quotidien</div>
  <div class="seg" role="radiogroup">${[2, 3, 5].map((n) => `<button role="radio" aria-checked="${S.dailyGoal === n}" data-a="dailyGoal" data-v="${n}" class="${S.dailyGoal === n ? 'on' : ''}">${n} mots</button>`).join('')}</div>
  <p class="sub">Environ ${S.dailyGoal * 2} à ${S.dailyGoal * 3} minutes par jour.</p>
  <div class="section">Pourquoi tu apprends</div>
  <div class="choices">${GOALS.map((g) => `<button class="choice ${S.goal === g.id ? 'sel' : ''}" data-a="goalSet" data-v="${g.id}">${icon(GOAL_ICON[g.id], 22)}<span>${g.label}</span>${S.goal === g.id ? `<span class="end">${icon('checkCircle', 22)}</span>` : ''}</button>`).join('')}</div>`;

let ST = { range: 7 };
VIEWS.stats = () => {
  const n = ST.range, pts = [];
  for (let i = n - 1; i >= 0; i--) { const d = new Date(Date.now() - i * DAY); pts.push({ d, xp: (S.days[dayKey(d)] || {}).xp || 0 }); }
  const max = Math.max(50, ...pts.map((p) => p.xp)), W = 340, H = 160, bw = (W - 20) / n;
  const bars = pts.map((p, i) => { const h = Math.max(4, (p.xp / max) * (H - 40)); return `<rect x="${(10 + i * bw + bw * 0.18).toFixed(1)}" y="${(H - 22 - h).toFixed(1)}" width="${(bw * 0.64).toFixed(1)}" height="${h.toFixed(1)}" rx="${Math.min(6, bw * 0.3).toFixed(1)}" fill="${p.xp ? 'var(--brand)' : 'var(--surface-2)'}"/>`; }).join('');
  const labels = pts.map((p, i) => (n === 7 || i % 5 === 0 || i === n - 1) ? `<text x="${(10 + i * bw + bw / 2).toFixed(1)}" y="${H - 4}" text-anchor="middle" font-size="11" font-weight="700" fill="var(--ink-2)">${n === 7 ? ['D', 'L', 'M', 'M', 'J', 'V', 'S'][p.d.getDay()] : p.d.getDate()}</text>` : '').join('');
  const acc = S.total ? Math.round((S.correct / S.total) * 100) : null, sum = pts.reduce((s, p) => s + p.xp, 0);
  return `${navbar('Statistiques', '/profile')}
  <div class="seg" role="tablist"><button role="tab" aria-selected="${n === 7}" data-a="range" data-v="7" class="${n === 7 ? 'on' : ''}">7 jours</button><button role="tab" aria-selected="${n === 30}" data-a="range" data-v="30" class="${n === 30 ? 'on' : ''}">30 jours</button></div>
  <div class="tile"><div style="display:flex;justify-content:space-between;align-items:baseline"><b>XP gagnés</b><span class="muted" style="font-weight:700">${sum} XP</span></div>
    <svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="XP gagnés par jour">${bars}${labels}</svg></div>
  <div class="kpis"><div class="kpi" style="--c:var(--brand)">${icon('dico', 22)}<b>${wordsLearned()}</b><span>mots appris</span></div>
    <div class="kpi" style="--c:var(--success)">${icon('target', 22)}<b>${acc == null ? '–' : acc + ' %'}</b><span>de réussite</span></div>
    <div class="kpi" style="--c:var(--streak)">${icon('flame', 22)}<b>${S.best}</b><span>meilleure série</span></div></div>
  <div class="section">Par domaine</div>
  <div class="tile">${CATS.map((c) => {
    const all = TECH_VOCABULARY.filter((w) => w.category === c), got = all.filter((w) => S.learned[w.id]).length;
    return `<div class="dom"><div class="h"><span class="badge-ic" style="width:32px;height:32px;border-radius:10px;${hueStyle(CAT[c][1])}">${icon(CAT[c][0], 18)}</span>${esc(c)}<span>${got}/${all.length}</span></div><div class="bar" style="height:8px"><i style="width:${(got / all.length) * 100}%"></i></div></div>`;
  }).join('')}</div>`;
};

VIEWS.badges = () => `${navbar('Badges', '/profile')}
  <p class="sub" style="margin-bottom:20px">${S.badges.length} sur ${BADGES.length} débloqués. Chaque badge récompense une habitude d’apprentissage.</p>
  <div class="medals">${BADGES.map((b) => { const on = S.badges.includes(b.id); return `<div class="md ${on ? '' : 'off'}" style="${hueStyle(b.h)}"><div class="disc">${icon(on ? b.ic : 'lock', 30)}</div><b>${esc(b.name)}</b><small>${esc(b.desc)}</small></div>`; }).join('')}</div>`;

VIEWS.settings = () => {
  const sw = (key, on, label, ic, h) => `<div class="row">${tintIcon(ic, h)}<span class="t"><b>${label}</b></span><button class="switch ${on ? 'on' : ''}" role="switch" aria-checked="${on}" aria-label="${label}" data-a="toggle" data-v="${key}"></button></div>`;
  return `${navbar('Paramètres', '/profile')}
  <div class="section" style="margin-top:6px">Préférences</div>
  <div class="group">${sw('dark', isDark(), 'Mode sombre', 'moon', 262)}${sw('sound', S.settings.sound, 'Sons', 'bell', 75)}${sw('autoSpeak', S.settings.autoSpeak, 'Prononciation automatique', 'speaker', 237)}
    <button class="row" data-a="nav" data-v="/goals">${tintIcon('target', 152)}<span class="t"><b>Objectif quotidien</b><small>${S.dailyGoal} mots par jour</small></span>${chev()}</button></div>
  <div class="section">Mes données</div>
  <div class="group"><button class="row" data-a="nav" data-v="/backup">${tintIcon('save', 200)}<span class="t"><b>Sauvegarde</b><small>Copier ou restaurer ma progression</small></span>${chev()}</button>
    ${isStandalone() ? '' : `<button class="row" data-a="install">${tintIcon('download', 290)}<span class="t"><b>Installer l’application</b><small>Écran d’accueil et hors ligne</small></span>${chev()}</button>`}
    <button class="row" data-a="reset">${tintIcon('trash', 25)}<span class="t"><b class="danger-t">Supprimer toutes mes données</b><small>Profil, XP et mots appris sur cet appareil</small></span></button></div>
  <div class="section">À propos</div>
  <div class="group"><a class="row" href="privacy.html">${tintIcon('shield', 152)}<span class="t"><b>Politique de confidentialité</b></span>${chev()}</a>
    <a class="row" href="terms.html">${tintIcon('file', 237)}<span class="t"><b>Conditions d’utilisation</b></span>${chev()}</a>
    <button class="row" data-a="nav" data-v="/faq">${tintIcon('help', 200)}<span class="t"><b>Aide et FAQ</b></span>${chev()}</button></div>
  <p class="version">TechLingo 1.0 · Tes données restent sur cet appareil.<br>Icônes Lucide (licence ISC).</p>`;
};

const backupCode = () => btoa(unescape(encodeURIComponent(JSON.stringify(S))));
VIEWS.backup = () => `${navbar('Sauvegarde', S.onboarded ? '/settings' : '/setup')}
  ${S.onboarded ? `<div class="tile"><b>Mon code de sauvegarde</b><p class="sub" style="margin-top:4px">Garde ce code dans une note ou un email pour retrouver ta progression sur un autre téléphone.</p>
    <textarea class="input" readonly rows="4" id="bkOut" aria-label="Code de sauvegarde" style="margin-top:12px">${esc(backupCode())}</textarea>
    <div class="btn-row"><button class="btn sm" data-a="copyBackup">${icon('copy', 18)} Copier</button><button class="btn ghost sm" data-a="shareBackup">${icon('share', 18)} Partager</button></div></div>` : ''}
  <div class="tile" style="margin-top:14px"><b>Restaurer une sauvegarde</b><p class="sub" style="margin-top:4px">Colle ici un code TechLingo.</p>
    <textarea class="input" rows="4" id="bkIn" placeholder="Colle ton code ici" aria-label="Code à restaurer" style="margin-top:12px"></textarea>
    <button class="btn" style="margin-top:12px" data-a="restoreBackup">Restaurer</button></div>`;
async function copyBackup() {
  try { await navigator.clipboard.writeText(backupCode()); toast('Code copié', 'check'); }
  catch (e) { const el = $('#bkOut'); if (el) { el.focus(); el.select(); } toast('Sélectionne et copie le code', 'copy'); }
}
async function shareBackup() {
  try { if (navigator.share) await navigator.share({ title: 'Sauvegarde TechLingo', text: backupCode() }); else await copyBackup(); }
  catch (e) { /* partage annulé */ }
}
function restoreBackup() {
  const raw = ($('#bkIn').value || '').trim();
  try {
    const o = JSON.parse(decodeURIComponent(escape(atob(raw))));
    if (typeof o !== 'object' || o === null || typeof o.xp !== 'number' || typeof o.learned !== 'object') throw new Error('format');
    S = { ...defaults(), ...o, settings: { ...defaults().settings, ...(o.settings || {}) }, onboarded: true };
    if (!AVATARS.some((a) => a[0] === S.avatar)) S.avatar = 'sky';
    save(); applyTheme(); buzz('success'); toast('Progression restaurée', 'checkCircle');
    navCount = 0; nav('/home', true, 'fade');
  } catch (e) { buzz('error'); toast('Code invalide. Vérifie que tu as tout copié.', 'xCircle'); }
}

let FQ = -1;
VIEWS.faq = () => `${navbar('Aide et FAQ', '/profile')}
  <div class="group faq">${FAQ.map(([q, a], i) => `<div><button class="row" data-a="faq" data-v="${i}" aria-expanded="${FQ === i}"><span class="t"><b>${esc(q)}</b></span>${icon('chev', 20, 'chev')}</button>${FQ === i ? `<p class="faq-a">${esc(a)}</p>` : ''}</div>`).join('')}</div>`;

// =============================================================================
// Carte d'installation : PWA (Android/ordinateur), guide iOS, APK en option
// =============================================================================
const INSTALL_KEY = 'techlingo.installDismissedAt';
const APK_URL = 'download/techlingo-android.apk';
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isAndroid = () => /android/i.test(navigator.userAgent);
let apkAvailable = false;
async function checkApk() {
  if (!/^https?:$/.test(location.protocol)) return;
  try {
    const r = await fetch(APK_URL, { method: 'HEAD', cache: 'no-store' });
    apkAvailable = r.ok && !/text\/html/.test(r.headers.get('content-type') || '');
  } catch (e) { apkAvailable = false; }
}
function installSheet(force = false) {
  if (isStandalone()) { if (force) toast('TechLingo est déjà installé', 'checkCircle'); return; }
  if (!force) { try { if (Date.now() - (+localStorage.getItem(INSTALL_KEY) || 0) < 3 * DAY) return; } catch (e) { /* stockage indisponible */ } }
  let action;
  if (deferredInstall) {
    action = `<button class="btn" data-a="doInstall">${icon('download', 20)} Installer l’application</button>`;
  } else if (isIOS()) {
    action = `<ol class="steps"><li><span>Touche <b>Partager</b> dans Safari</span>${icon('iosShare', 22)}</li>
      <li><span>Choisis <b>Sur l’écran d’accueil</b></span>${icon('plus', 22)}</li><li><span>Touche <b>Ajouter</b></span>${icon('checkCircle', 22)}</li></ol>`;
  } else if (isAndroid()) {
    action = `<ol class="steps"><li><span>Ouvre le menu du navigateur</span>${icon('menu', 22)}</li>
      <li><span>Choisis <b>Installer l’application</b> ou <b>Ajouter à l’écran d’accueil</b></span>${icon('download', 22)}</li></ol>`;
  } else {
    action = `<ol class="steps"><li><span>Clique sur l’icône d’installation dans la barre d’adresse</span>${icon('download', 22)}</li><li><span>Confirme avec <b>Installer</b></span>${icon('checkCircle', 22)}</li></ol>`;
  }
  const apk = isAndroid() && apkAvailable
    ? `<a class="btn ghost" style="margin-top:10px" href="${APK_URL}" download>${icon('phone', 20)} Télécharger l’APK Android</a>
       <p class="note">L’APK s’installe hors Play Store : Android te demandera d’autoriser cette source.</p>` : '';
  $('#sheet-root').innerHTML = `<div class="inst-backdrop" data-a="closeInstall"></div>
    <div class="inst" role="dialog" aria-modal="true" aria-labelledby="instTitle"><div class="grab"></div>
      <div class="head"><img src="icons/icon-192.png" alt=""><div><h2 id="instTitle">Installe TechLingo</h2><p>Ouvre l’app en un geste depuis ton écran d’accueil.</p></div></div>
      <div class="perks"><span>${icon('feather', 16)} Ultra légère</span><span>${icon('wifiOff', 16)} Marche hors ligne</span><span>${icon('lock', 16)} Sans compte en ligne</span></div>
      ${action}${apk}
      <button class="text-btn later" data-a="closeInstall">Plus tard</button></div>`;
  const first = $('.inst .btn, .inst .text-btn'); if (first) first.focus({ preventScroll: true });
}
function closeInstall() {
  try { localStorage.setItem(INSTALL_KEY, String(Date.now())); } catch (e) { /* stockage indisponible */ }
  $('#sheet-root').innerHTML = '';
}

// =============================================================================
// Thème, actions, démarrage
// =============================================================================
function applyTheme() {
  const dark = S.settings.dark == null ? matchMedia('(prefers-color-scheme: dark)').matches : S.settings.dark;
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  $('meta[name="theme-color"]').content = dark ? '#151F2C' : '#F5F8FB';
  try { const SB = cap('StatusBar'); if (SB) { SB.setStyle({ style: dark ? 'DARK' : 'LIGHT' }); SB.setBackgroundColor({ color: dark ? '#151F2C' : '#F5F8FB' }); } } catch (e) { /* web */ }
}
const redraw = () => { pendingDir = 'none'; render(); };

const ACTIONS = {
  nav: (v) => { if (v === '/favs') { D = { q: '', cat: 'fav' }; nav('/dico'); } else nav(v); },
  back: (v) => back(v),
  tab: (v) => { navCount = 0; nav('/' + v, false, 'fade'); buzz(); },
  obNext: () => { if (O.step >= SLIDES.length - 1) nav('/setup'); else obGo(O.step + 1); },
  obSkip: () => nav('/setup'),
  avatar: (v) => { S.avatar = v; save(); buzz(); redraw(); },
  goal: (v) => { S.goal = v; save(); buzz(); redraw(); },
  setupDone: () => { if (!S.name.trim() || !S.goal) return; S.onboarded = true; save(); buzz('success'); navCount = 0; nav('/home', true, 'fade'); },
  goalSet: (v) => { S.goal = v; save(); buzz(); redraw(); },
  dailyGoal: (v) => { S.dailyGoal = +v; save(); buzz(); redraw(); },
  unit: (v) => startUnit(v),
  spin: () => spinWheel(),
  lesson: (v) => startLesson(v),
  lessonNext: () => { L.step++; buzz(); pendingDir = 'fwd'; render(); },
  sel: (v) => { if (L.picked != null) return; L.sel = +v; buzz(); redraw(); },
  check: () => {
    if (L.sel == null || L.picked != null) return;
    L.picked = L.sel; const ok = L.opts[L.picked].ok; S.total++;
    if (ok) { S.correct++; sfx.ok(); buzz('success'); } else { sfx.bad(); buzz('error'); }
    save(); checkBadges(); redraw();
  },
  finishLesson: () => finishLesson(),
  cat: (v) => { D.cat = v; buzz(); redraw(); },
  fav: (v) => { const on = !S.favs.includes(v); S.favs = on ? [...S.favs, v] : S.favs.filter((x) => x !== v); save(); buzz(); toast(on ? 'Ajouté aux favoris' : 'Retiré des favoris', 'bookmark'); redraw(); },
  review: () => startReview(),
  flip: () => { R.flip = !R.flip; buzz(); redraw(); },
  rate: (v) => rate(+v),
  game: (v) => startGame(v),
  gAnswer: (v) => gameAnswer(v),
  gNext: () => { G.i++; G.picked = null; if (G.i >= G.qs.length) endGame(); else { pendingDir = 'fwd'; render(); } },
  mPick: (v) => matchPick(v),
  qaFr: () => { Q.fr = !Q.fr; redraw(); },
  qaMic: () => qaMic(),
  qaDone: () => { markQa(Q.id); redraw(); },
  range: (v) => { ST.range = +v; redraw(); },
  faq: (v) => { FQ = FQ === +v ? -1 : +v; redraw(); },
  toggle: (v) => {
    if (v === 'dark') S.settings.dark = !isDark(); else S.settings[v] = !S.settings[v];
    save(); applyTheme(); buzz(); redraw();
  },
  copyBackup: () => copyBackup(),
  shareBackup: () => shareBackup(),
  restoreBackup: () => restoreBackup(),
  install: () => installSheet(true),
  closeInstall: () => closeInstall(),
  doInstall: async () => {
    if (!deferredInstall) return;
    deferredInstall.prompt();
    const choice = await deferredInstall.userChoice;
    deferredInstall = null; closeInstall();
    if (choice && choice.outcome === 'accepted') toast('Installation en cours', 'download');
    redraw();
  },
  reset: () => {
    if (!confirm('Supprimer ton profil, tes XP et tes mots appris de cet appareil ? Cette action est définitive.')) return;
    S = defaults(); save(); WH = { words: null, rot: 0, spinning: false, result: null }; L = G = R = null; O = { step: 0 }; applyTheme();
    navCount = 0; nav('/onboard', true, 'fade');
  }
};

document.addEventListener('click', (e) => {
  const sp = e.target.closest('[data-speak]');
  if (sp) { e.stopPropagation(); buzz(); speak(sp.dataset.speak); return; }
  const el = e.target.closest('[data-a]');
  if (!el) return;
  const fn = ACTIONS[el.dataset.a];
  if (fn) fn(el.dataset.v);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && $('.inst')) closeInstall();
  if (e.key === 'Enter' && e.target.id === 'nm') e.target.blur();
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.flash')) { e.preventDefault(); ACTIONS.flip(); }
});
document.addEventListener('input', (e) => {
  if (e.target.id === 'dq') { D.q = e.target.value; $('#dicoList').innerHTML = dicoList(); }
  if (e.target.id === 'nm') { S.name = e.target.value.trim().slice(0, 24); save(); const b = $('#setupBtn'); if (b) b.disabled = !(S.name && S.goal); }
});
window.addEventListener('hashchange', render);
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredInstall = e; if ($('.inst')) installSheet(true); else if ((routePath()[0] || 'home') === 'home') redraw(); });
window.addEventListener('appinstalled', () => { deferredInstall = null; closeInstall(); toast('TechLingo est installé', 'checkCircle'); });
document.addEventListener('visibilitychange', () => { if (document.hidden && 'speechSynthesis' in window) speechSynthesis.cancel(); });
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => { if (S.settings.dark == null) { applyTheme(); redraw(); } });

applyTheme();
if (!location.hash || location.hash === '#') location.replace(S.onboarded ? '#/home' : '#/onboard');
pendingDir = 'fade';
render();
checkBadges();

// Écran de chargement : affiché au plus 1,3 s
(function hideBoot() {
  const boot = $('#boot'); if (!boot) return;
  setTimeout(() => { boot.classList.add('out'); setTimeout(() => boot.remove(), 400); }, Math.max(150, 1500 - performance.now()));
  // Carte d'installation proposée à la première visite web
  checkApk().finally(() => setTimeout(() => installSheet(), 2200));
  try { const SS = cap('SplashScreen'); if (SS) SS.hide(); } catch (e) { /* web */ }
})();

// Bouton retour Android
try {
  const A = cap('App');
  if (A) A.addListener('backButton', () => {
    const name = routePath()[0] || 'home';
    if (TABS.some((t) => t.r === name) && name !== 'home') { navCount = 0; nav('/home', false, 'fade'); }
    else if (name === 'home' || name === 'onboard') A.exitApp();
    else if (navCount > 0) { pendingDir = 'back'; navCount--; history.back(); }
    else nav('/home', true, 'back');
  });
} catch (e) { /* web */ }

if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { /* hors ligne indisponible */ }));
}
