/* ============================================================
   Tablas para Juli — app.js
   ============================================================ */
'use strict';

/* ── Constants ─────────────────────────────────────────── */
const TABLES      = [2, 3, 4, 5, 6, 7, 8, 9];
const MULTIPLIERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const QUIZ_ROUNDS = 10;

const COLOR = {
  2: { color: '#f7971e', bg: '#f7971e22' },
  3: { color: '#21d4fd', bg: '#21d4fd22' },
  4: { color: '#b721ff', bg: '#b721ff22' },
  5: { color: '#26de81', bg: '#26de8122' },
  6: { color: '#fd3a69', bg: '#fd3a6922' },
  7: { color: '#ffd200', bg: '#ffd20022' },
  8: { color: '#4ecdc4', bg: '#4ecdc422' },
  9: { color: '#ff6b35', bg: '#ff6b3522' },
};

/* ── iOS detection ──────────────────────────────────────── */
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/* ── DOM refs ───────────────────────────────────────────── */
const splash         = document.getElementById('splash');
const splashBtn      = document.getElementById('splash-btn');
const appEl          = document.getElementById('app');
const muteBtn        = document.getElementById('mute-btn');
const muteIcon       = document.getElementById('mute-icon');
const container      = document.getElementById('tables-container');
const canvasEl       = document.getElementById('canvas-overlay');
const ctx            = canvasEl.getContext('2d');
const quizBtn        = document.getElementById('quiz-btn');
const quizModal      = document.getElementById('quiz-modal');
const quizClose      = document.getElementById('quiz-close');
const navPrev        = document.getElementById('nav-prev');
const navNext        = document.getElementById('nav-next');
const scrollDotsEl   = document.getElementById('scroll-dots');
const qBadge         = document.getElementById('q-badge');
const qQuestion      = document.getElementById('q-question');
const quizOptionsEl  = document.getElementById('quiz-options');
const qFeedback      = document.getElementById('quiz-feedback');
const qFbIcon        = document.getElementById('q-fb-icon');
const qFbText        = document.getElementById('q-fb-text');
const qCorrectEl     = document.getElementById('q-correct');
const qTotalEl       = document.getElementById('q-total');
const quizProgressFill = document.getElementById('quiz-progress-fill');
const quizStarsRow   = document.getElementById('quiz-stars-row');
const voiceBtn       = document.getElementById('voice-btn');
const voiceStatus    = document.getElementById('voice-status');

/* ── State ──────────────────────────────────────────────── */
let muted         = false;
let activeRow     = null;
let currentDotIdx = 0;
let quizRound     = 0;
let quizCorrect   = 0;
let quizAnswered  = false;

/* ── Speech ─────────────────────────────────────────────── */
const synth = window.speechSynthesis;

function unlockSpeech() {
  if (!synth) return;
  const u = new SpeechSynthesisUtterance(' ');
  u.volume = 0;
  u.lang   = 'es-ES';
  synth.speak(u);
}

function speak(text) {
  if (!synth || muted) return;
  const doSpeak = () => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang  = 'es-ES';
    u.rate  = 0.95;
    u.pitch = 1.1;
    synth.speak(u);
  };
  synth.cancel();
  if (isIOS) {
    setTimeout(doSpeak, 80);
  } else {
    doSpeak();
  }
}

/* ── Mute button ────────────────────────────────────────── */
muteBtn.addEventListener('click', () => {
  muted = !muted;
  muteIcon.textContent = muted ? '🔇' : '🔊';
  muteBtn.classList.toggle('muted', muted);
  if (muted) synth.cancel();
});

/* ── Build DOM — tables ─────────────────────────────────── */
function buildTables() {
  TABLES.forEach((t, idx) => {
    const { color, bg } = COLOR[t];

    const wrapper = document.createElement('div');
    wrapper.className = 'table-wrapper';
    wrapper.dataset.tableIdx = idx;

    const title = document.createElement('div');
    title.className  = 'table-title';
    title.id         = `title-${t}`;
    title.textContent = `Tabla del ${t}`;
    title.style.color   = color;
    title.style.setProperty('--tc-color', color);
    title.style.setProperty('--tc-bg', bg);

    const starsEl = document.createElement('div');
    starsEl.className = 'table-stars';
    starsEl.id        = `stars-${t}`;
    renderTableStars(t, starsEl);

    const tbl  = document.createElement('table');
    const tbody = document.createElement('tbody');

    MULTIPLIERS.forEach(m => {
      const tr = document.createElement('tr');
      tr.className         = 'mul-row';
      tr.dataset.table     = t;
      tr.dataset.mult      = m;
      tr.dataset.tcColor   = color;
      tr.dataset.tcBg      = bg;
      tr.style.setProperty('--tc-color', color);
      tr.style.setProperty('--tc-bg',    bg);

      const td1 = document.createElement('td');
      td1.textContent = `${t} × ${m} =`;

      const td2 = document.createElement('td');
      td2.textContent = t * m;

      tr.appendChild(td1);
      tr.appendChild(td2);
      tbody.appendChild(tr);

      /* hover (desktop) */
      tr.addEventListener('mouseenter', () => onEnter(tr));
      tr.addEventListener('mouseleave', clearAll);

      /* touch (mobile / iOS) */
      tr.addEventListener('touchend', e => {
        e.preventDefault();
        if (activeRow === tr) { clearAll(); return; }
        onEnter(tr);
      }, { passive: false });
    });

    tbl.appendChild(tbody);
    wrapper.appendChild(title);
    wrapper.appendChild(starsEl);
    wrapper.appendChild(tbl);
    container.appendChild(wrapper);
  });
}

/* ── Canvas resize ──────────────────────────────────────── */
function resizeCanvas() {
  canvasEl.width  = window.innerWidth;
  canvasEl.height = window.innerHeight;
}
window.addEventListener('resize', () => { resizeCanvas(); if (activeRow) drawLines(activeRow); });
window.addEventListener('scroll', () => { if (activeRow) drawLines(activeRow); }, { passive: true });
container.addEventListener('scroll', () => { if (activeRow) drawLines(activeRow); }, { passive: true });
resizeCanvas();

/* ── Row interaction ────────────────────────────────────── */
function clearAll() {
  ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
  document.querySelectorAll('tr.mul-row').forEach(r => {
    r.classList.remove('is-source', 'is-cross');
  });
  document.querySelectorAll('.table-title.glowing').forEach(el => {
    el.classList.remove('glowing');
  });
  activeRow = null;
}

function onEnter(row) {
  clearAll();
  activeRow = row;

  const sourceTable = parseInt(row.dataset.table, 10);
  const sourceMult  = parseInt(row.dataset.mult,  10);
  const result      = sourceTable * sourceMult;

  row.classList.add('is-source');

  const titleEl = document.getElementById(`title-${sourceTable}`);
  if (titleEl) titleEl.classList.add('glowing');

  /* find the commutative partner (swap table & multiplier) */
  const crossRows = document.querySelectorAll(
    `tr.mul-row[data-table="${sourceMult}"][data-mult="${sourceTable}"]`
  );
  crossRows.forEach(r => {
    if (r !== row) r.classList.add('is-cross');
  });

  drawLines(row);
  speak(`${sourceTable} por ${sourceMult} igual a ${result}`);
}

/* ── Canvas — draw bezier lines ────────────────────────────── */
function drawLines(row) {
  ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
  const sourceTable = parseInt(row.dataset.table, 10);
  const sourceMult  = parseInt(row.dataset.mult,  10);

  const crossRows = document.querySelectorAll(
    `tr.mul-row[data-table="${sourceMult}"][data-mult="${sourceTable}"]`
  );

  crossRows.forEach(crossRow => {
    if (crossRow === row) return;

    const r1 = row.getBoundingClientRect();
    const r2 = crossRow.getBoundingClientRect();

    const x1 = r1.right;
    const y1 = (r1.top + r1.bottom) / 2;
    const x2 = r2.left;
    const y2 = (r2.top + r2.bottom) / 2;
    const cx = (x1 + x2) / 2;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.bezierCurveTo(cx, y1, cx, y2, x2, y2);
    ctx.strokeStyle = row.dataset.tcColor || '#f7971e';
    ctx.lineWidth   = 2;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    /* dots at endpoints */
    [[x1, y1], [x2, y2]].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = row.dataset.tcColor || '#f7971e';
      ctx.fill();
    });
  });
}

/* ── localStorage helpers ───────────────────────────────── */
function getTableData(t) {
  try {
    return JSON.parse(localStorage.getItem(`quiz_t${t}`)) || { c: 0, n: 0 };
  } catch (_) {
    return { c: 0, n: 0 };
  }
}

function saveTableData(t, data) {
  localStorage.setItem(`quiz_t${t}`, JSON.stringify(data));
}

function getStars(t) {
  const d = getTableData(t);
  if (d.n < 3) return -1;          /* not enough data */
  const pct = d.c / d.n;
  if (pct >= 0.90) return 3;
  if (pct >= 0.60) return 2;
  if (pct >= 0.30) return 1;
  return 0;
}

function renderTableStars(t, el) {
  const s = getStars(t);
  if (s < 0) { el.textContent = ''; return; }
  const { color } = COLOR[t];
  el.innerHTML = '';
  for (let i = 1; i <= 3; i++) {
    const span = document.createElement('span');
    span.textContent = i <= s ? '★' : '☆';
    span.style.color = i <= s ? color : '#444';
    el.appendChild(span);
  }
}

function refreshAllStars() {
  TABLES.forEach(t => {
    const el = document.getElementById(`stars-${t}`);
    if (el) renderTableStars(t, el);
  });
}

/* ── Scroll navigation ──────────────────────────────────── */
const tableWrappers = () => Array.from(container.querySelectorAll('.table-wrapper'));

function buildScrollDots() {
  scrollDotsEl.innerHTML = '';
  TABLES.forEach((_, idx) => {
    const dot = document.createElement('button');
    dot.className   = `scroll-dot${idx === 0 ? ' active' : ''}`;
    dot.dataset.idx = idx;
    dot.setAttribute('aria-label', `Tabla del ${TABLES[idx]}`);
    dot.addEventListener('click', () => scrollToTable(idx));
    scrollDotsEl.appendChild(dot);
  });
  updateNavButtons();
}

function scrollToTable(idx) {
  const wrappers = tableWrappers();
  if (!wrappers[idx]) return;
  wrappers[idx].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  currentDotIdx = idx;
  updateDots();
  updateNavButtons();
}

function updateDots() {
  scrollDotsEl.querySelectorAll('.scroll-dot').forEach((d, i) => {
    d.classList.toggle('active', i === currentDotIdx);
  });
}

function updateNavButtons() {
  navPrev.disabled = currentDotIdx <= 0;
  navNext.disabled = currentDotIdx >= TABLES.length - 1;
}

/* sync dot on user scroll */
container.addEventListener('scroll', () => {
  const wrappers = tableWrappers();
  if (!wrappers.length) return;
  const center = container.scrollLeft + container.clientWidth / 2;
  let closest = 0;
  let closestDist = Infinity;
  wrappers.forEach((w, i) => {
    const wCenter = w.offsetLeft + w.offsetWidth / 2;
    const dist = Math.abs(center - wCenter);
    if (dist < closestDist) { closestDist = dist; closest = i; }
  });
  if (closest !== currentDotIdx) {
    currentDotIdx = closest;
    updateDots();
    updateNavButtons();
  }
}, { passive: true });

navPrev.addEventListener('click', () => { if (currentDotIdx > 0) scrollToTable(currentDotIdx - 1); });
navNext.addEventListener('click', () => { if (currentDotIdx < TABLES.length - 1) scrollToTable(currentDotIdx + 1); });

/* ── Quiz ───────────────────────────────────────────────── */
function generateOptions(correct, tableNum) {
  const options = new Set([correct]);
  /* plausible distractors near correct value */
  const candidates = [];
  TABLES.forEach(t => {
    MULTIPLIERS.forEach(m => {
      const v = t * m;
      if (v !== correct && v >= 1 && v <= 90) candidates.push(v);
    });
  });
  /* sort by proximity */
  candidates.sort((a, b) => Math.abs(a - correct) - Math.abs(b - correct));
  for (const c of candidates) {
    if (options.size === 4) break;
    options.add(c);
  }
  return shuffle([...options]);
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function renderQuizStarsRow(highlightTable) {
  quizStarsRow.innerHTML = '';
  TABLES.forEach(t => {
    const item = document.createElement('div');
    item.className = 'quiz-star-item';
    if (t === highlightTable) item.style.opacity = '1';
    else item.style.opacity = '0.6';

    const label = document.createElement('span');
    label.textContent = `×${t}`;
    label.style.color = COLOR[t].color;

    const stars = document.createElement('span');
    stars.className = 'stars';
    const s = getStars(t);
    stars.textContent = s < 0 ? '·' : ('★'.repeat(s) + '☆'.repeat(3 - s));
    stars.style.color = s > 0 ? COLOR[t].color : '#444';

    item.appendChild(label);
    item.appendChild(stars);
    quizStarsRow.appendChild(item);
  });
}

function nextQuizQuestion() {
  if (quizRound >= QUIZ_ROUNDS) { showQuizEnd(); return; }

  quizAnswered = false;
  const t = TABLES[Math.floor(Math.random() * TABLES.length)];
  const m = MULTIPLIERS[Math.floor(Math.random() * MULTIPLIERS.length)];
  const correct = t * m;

  /* update progress */
  quizProgressFill.style.width = `${(quizRound / QUIZ_ROUNDS) * 100}%`;
  qBadge.textContent = `Tabla del ${t}`;
  qBadge.style.background = COLOR[t].bg;
  qBadge.style.color       = COLOR[t].color;
  qQuestion.textContent   = `${t} × ${m} = ?`;

  /* hide feedback */
  qFeedback.classList.add('quiz-fb-hidden');

  /* build options */
  quizOptionsEl.innerHTML = '';
  const options = generateOptions(correct, t);
  options.forEach(val => {
    const btn = document.createElement('button');
    btn.className   = 'quiz-option';
    btn.textContent = val;
    btn.addEventListener('click', () => answerQuiz(btn, val, correct, t));
    btn.addEventListener('touchend', e => {
      e.preventDefault();
      answerQuiz(btn, val, correct, t);
    }, { passive: false });
    quizOptionsEl.appendChild(btn);
  });

  renderQuizStarsRow(t);

  /* stash current question data on DOM */
  quizOptionsEl.dataset.correct   = correct;
  quizOptionsEl.dataset.tableNum  = t;
}

function answerQuiz(btn, chosen, correct, tableNum) {
  if (quizAnswered) return;
  quizAnswered = true;

  quizRound++;
  const isCorrect = chosen === correct;
  if (isCorrect) quizCorrect++;

  qCorrectEl.textContent = quizCorrect;
  qTotalEl.textContent   = quizRound;

  /* update localStorage */
  const data = getTableData(tableNum);
  data.n++;
  if (isCorrect) data.c++;
  saveTableData(tableNum, data);

  /* mark buttons */
  quizOptionsEl.querySelectorAll('.quiz-option').forEach(b => {
    b.setAttribute('disabled', true);
    if (parseInt(b.textContent, 10) === correct) b.classList.add('correct');
  });
  if (!isCorrect) btn.classList.add('wrong');

  /* feedback */
  qFbIcon.textContent = isCorrect ? '✅' : '❌';
  qFbText.textContent = isCorrect
    ? '¡Correcto!'
    : `La respuesta era ${correct}`;
  qFeedback.style.color = isCorrect ? '#26de81' : '#ff5961';
  qFeedback.classList.remove('quiz-fb-hidden');

  /* refresh stars display */
  renderQuizStarsRow(tableNum);
  refreshAllStars();

  /* advance */
  const delay = isCorrect ? 1100 : 1800;
  setTimeout(nextQuizQuestion, delay);
}

function showQuizEnd() {
  quizProgressFill.style.width = '100%';
  qBadge.textContent   = 'Resultado';
  qBadge.style.background = '#ffffff10';
  qBadge.style.color      = '#aaa';
  qQuestion.textContent = `${quizCorrect} / ${QUIZ_ROUNDS} correctas 🎉`;
  quizOptionsEl.innerHTML = '';

  const restart = document.createElement('button');
  restart.className   = 'quiz-option';
  restart.textContent = 'Jugar de nuevo 🔄';
  restart.style.gridColumn = '1 / -1';
  restart.style.fontSize   = '1rem';
  restart.style.padding    = '16px';
  restart.addEventListener('click', startQuiz);
  restart.addEventListener('touchend', e => { e.preventDefault(); startQuiz(); }, { passive: false });
  quizOptionsEl.appendChild(restart);

  qFeedback.classList.add('quiz-fb-hidden');
  renderQuizStarsRow(null);
}

function startQuiz() {
  quizRound   = 0;
  quizCorrect = 0;
  qCorrectEl.textContent = 0;
  qTotalEl.textContent   = 0;
  nextQuizQuestion();
}

/* open / close quiz */
quizBtn.addEventListener('click', openQuiz);
quizBtn.addEventListener('touchend', e => { e.preventDefault(); openQuiz(); }, { passive: false });

quizClose.addEventListener('click', closeQuiz);
quizClose.addEventListener('touchend', e => { e.preventDefault(); closeQuiz(); }, { passive: false });

quizModal.addEventListener('click', e => { if (e.target === quizModal) closeQuiz(); });

function openQuiz() {
  quizModal.classList.remove('quiz-hidden');
  startQuiz();
}

function closeQuiz() {
  quizModal.classList.add('quiz-hidden');
}

/* ── Splash → App ───────────────────────────────────────── */
splashBtn.addEventListener('click', () => {
  unlockSpeech();

  splash.classList.add('hidden');
  appEl.classList.remove('app-hidden');
  appEl.classList.add('app-visible');

  /* stagger table entrance */
  const wrappers = tableWrappers();
  wrappers.forEach((w, i) => {
    setTimeout(() => w.classList.add('visible'), i * 80);
  });

  buildScrollDots();
  setTimeout(initOnboarding, TABLES.length * 80 + 300);
});

/* ── Init ───────────────────────────────────────────────── */
buildTables();

/* ── Onboarding ─────────────────────────────────────────── */
function initOnboarding() {
  if (localStorage.getItem('juli-onboarding-done')) return;

  const onbEl     = document.getElementById('onboarding');
  const spotlight = document.getElementById('onb-spotlight');
  const bubble    = document.getElementById('onb-bubble');
  const textEl    = document.getElementById('onb-text');
  const nextBtn   = document.getElementById('onb-next');
  const skipBtn   = document.getElementById('onb-skip');
  const dotsEl    = document.getElementById('onb-dots');

  const STEPS = [
    {
      selector: '#tables-container',
      text:     'Aquí están todas las tablas del 2 al 9 🎨',
      padding:  4,
      radius:   '12px',
    },
    {
      selector: 'tr.mul-row',
      text:     'Toca una fila para ver su pareja conmutativa y escucharla 🔊',
      padding:  3,
      radius:   '8px',
    },
    {
      selector: '#voice-btn',
      text:     '¡Pregúntame una tabla con tu voz! Di: "¿Cuánto es 7 por 8?" 🎤',
      padding:  8,
      radius:   '50%',
    },
    {
      selector: '#quiz-btn',
      text:     'Pon a prueba lo que sabes con el Quiz 🏆',
      padding:  8,
      radius:   '50px',
    },
    {
      selector: null,
      text:     '¡Todo listo Julieta! ¿Empezamos? 🚀',
      final:    true,
    },
  ];

  let currentStep = 0;

  /* build dots */
  STEPS.forEach(() => {
    const dot = document.createElement('span');
    dot.className = 'onb-dot';
    dotsEl.appendChild(dot);
  });

  function updateDots(idx) {
    dotsEl.querySelectorAll('.onb-dot').forEach((d, i) => {
      d.classList.toggle('active', i === idx);
    });
  }

  function triggerAnim(isFinal) {
    bubble.classList.remove('onb-step-enter');
    if (isFinal) bubble.classList.add('onb-final');
    else         bubble.classList.remove('onb-final');
    void bubble.offsetWidth; /* force reflow to restart animation */
    bubble.classList.add('onb-step-enter');
  }

  function positionBubble(spotRect) {
    const GAP  = 14;
    const winW = window.innerWidth;
    const winH = window.innerHeight;
    const bW   = Math.min(290, winW - 24);
    const tCX  = spotRect.left + spotRect.width / 2;

    const left      = Math.max(12, Math.min(tCX - bW / 2, winW - bW - 12));
    const arrowOff  = Math.max(12, Math.min(tCX - left - 11, bW - 34));
    bubble.style.setProperty('--arrow-offset', arrowOff + 'px');

    const spaceBelow = winH - spotRect.bottom - GAP;
    const spaceAbove = spotRect.top - GAP;
    let top, arrowDir;

    if (spaceBelow >= 130 || spaceBelow >= spaceAbove) {
      top      = spotRect.bottom + GAP;
      arrowDir = 'up';
    } else {
      top      = Math.max(12, spotRect.top - GAP - 130);
      arrowDir = 'down';
    }

    bubble.style.top         = top  + 'px';
    bubble.style.left        = left + 'px';
    bubble.style.width       = bW   + 'px';
    bubble.dataset.arrow     = arrowDir;
  }

  function showStep(idx) {
    const s = STEPS[idx];
    textEl.textContent = s.text;
    updateDots(idx);

    if (s.final) {
      spotlight.style.opacity = '0';
      bubble.style.top        = '';
      bubble.style.left       = '';
      bubble.style.width      = '';
      bubble.removeAttribute('data-arrow');
      triggerAnim(true);
      nextBtn.textContent   = '¡Vamos! 🚀';
      skipBtn.style.display = 'none';
      return;
    }

    spotlight.style.opacity = '1';
    nextBtn.textContent     = 'Siguiente →';
    skipBtn.style.display   = '';

    const el = document.querySelector(s.selector);
    if (!el) { showStep(idx + 1); return; }

    const rect = el.getBoundingClientRect();
    const pad  = s.padding ?? 6;

    /* clamp spotlight to viewport */
    const sTop  = Math.max(0, rect.top    - pad);
    const sLeft = Math.max(0, rect.left   - pad);
    const sW    = Math.min(window.innerWidth  - sLeft, rect.width  + pad * 2);
    const sH    = Math.min(window.innerHeight - sTop,  rect.height + pad * 2);

    spotlight.style.top          = sTop  + 'px';
    spotlight.style.left         = sLeft + 'px';
    spotlight.style.width        = sW    + 'px';
    spotlight.style.height       = sH    + 'px';
    spotlight.style.borderRadius = s.radius || '8px';

    positionBubble({ top: sTop, left: sLeft, bottom: sTop + sH, width: sW, height: sH });
    triggerAnim(false);
  }

  function finish() {
    localStorage.setItem('juli-onboarding-done', '1');
    onbEl.classList.add('onboarding-hidden');
  }

  nextBtn.addEventListener('click', () => {
    currentStep++;
    if (currentStep >= STEPS.length) { finish(); return; }
    showStep(currentStep);
  });

  skipBtn.addEventListener('click', finish);

  nextBtn.addEventListener('touchend', e => { e.preventDefault(); nextBtn.click(); }, { passive: false });
  skipBtn.addEventListener('touchend', e => { e.preventDefault(); skipBtn.click(); }, { passive: false });

  onbEl.classList.remove('onboarding-hidden');
  showStep(0);
}

/* ── PWA: Service Worker + Install prompt ──────────────────── */
(function initPWA() {
  /* Register service worker */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/tablas-para-juli/sw.js')
        .catch(err => console.warn('SW registration failed:', err));
    });
  }

  /* Install prompt */
  const banner = document.getElementById('install-banner');
  const btn    = document.getElementById('install-btn');
  if (!banner || !btn) return;

  let deferredPrompt = null;

  function showBanner() {
    banner.classList.add('install-visible');
  }

  function hideBanner() {
    banner.classList.remove('install-visible');
  }

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    showBanner();
  });

  btn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    if (outcome === 'accepted') hideBanner();
  });

  btn.addEventListener('touchend', e => { e.preventDefault(); btn.click(); }, { passive: false });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    hideBanner();
  });
}());

/* ── Voice Recognition ──────────────────────────────────── */
(function initVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

  /* Hide button on unsupported browsers */
  if (!SR) {
    if (voiceBtn) voiceBtn.style.display = 'none';
    return;
  }

  /* Spanish number words → integers (1–10 covers all table multipliers) */
  const WORD_NUM = {
    'cero': 0, 'un': 1, 'uno': 1, 'una': 1,
    'dos': 2, 'tres': 3, 'cuatro': 4, 'cinco': 5,
    'seis': 6, 'siete': 7, 'ocho': 8, 'nueve': 9, 'diez': 10,
  };

  function normalise(text) {
    return text
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  /* strip accents */
      .replace(/[¿?¡!.,;:]/g, '');
  }

  function toNumber(token) {
    const n = parseInt(token, 10);
    if (!isNaN(n)) return n;
    return Object.prototype.hasOwnProperty.call(WORD_NUM, token) ? WORD_NUM[token] : null;
  }

  /* Build a regex that matches any digit or Spanish number word */
  const numTokens = Object.keys(WORD_NUM).concat(['\\d+']).join('|');
  const MULT_RE   = new RegExp(
    `(${numTokens})\\s+(?:multiplicado\\s+por|por|x)\\s+(${numTokens})`
  );

  function parseMultiplication(transcript) {
    const text  = normalise(transcript);
    const match = text.match(MULT_RE);
    if (!match) return null;
    const a = toNumber(match[1]);
    const b = toNumber(match[2]);
    if (a === null || b === null) return null;
    return { a, b };
  }

  /* Status badge helpers */
  let statusTimer = null;
  function showStatus(msg, persist) {
    voiceStatus.textContent = msg;
    voiceStatus.classList.add('visible');
    clearTimeout(statusTimer);
    if (!persist) statusTimer = setTimeout(() => voiceStatus.classList.remove('visible'), 2800);
  }
  function hideStatus() {
    clearTimeout(statusTimer);
    voiceStatus.classList.remove('visible');
  }

  let recognition = null;
  let isListening = false;

  function setListening(val) {
    isListening = val;
    voiceBtn.classList.toggle('listening', val);
    voiceBtn.setAttribute('aria-label', val ? 'Escuchando… (toca para parar)' : 'Activar reconocimiento de voz');
    voiceBtn.title = val ? 'Escuchando…' : 'Activar voz';
    if (val) {
      showStatus('🎤 Escuchando…', true);
    } else {
      hideStatus();
    }
  }

  function buildRecognition() {
    const rec       = new SR();
    rec.lang            = 'es-ES';
    rec.continuous      = false;
    rec.interimResults  = false;
    rec.maxAlternatives = 5;

    rec.onstart = () => setListening(true);
    rec.onend   = () => setListening(false);
    rec.onerror = (e) => {
      setListening(false);
      if (e.error === 'not-allowed') {
        showStatus('⚠️ Permiso de micrófono denegado');
      } else if (e.error !== 'aborted' && e.error !== 'no-speech') {
        showStatus('⚠️ Error de reconocimiento');
      }
    };

    rec.onresult = (e) => {
      /* Try all alternatives until one parses */
      const alternatives = Array.from(e.results[0]).map(alt => alt.transcript);
      let parsed = null;
      for (const transcript of alternatives) {
        parsed = parseMultiplication(transcript);
        if (parsed) break;
      }

      if (!parsed) {
        speak('No entendí, intenta decir: siete por ocho');
        showStatus('❓ No entendí — di por ejemplo "7 por 8"');
        return;
      }

      const { a, b } = parsed;
      const result   = a * b;
      speak(`${a} por ${b} es igual a ${result}`);
      showStatus(`${a} × ${b} = ${result}`);
    };

    return rec;
  }

  voiceBtn.addEventListener('click', () => {
    if (isListening) {
      recognition && recognition.stop();
      return;
    }
    recognition = buildRecognition();
    try {
      recognition.start();
    } catch (_) {
      setListening(false);
    }
  });

  voiceBtn.addEventListener('touchend', e => {
    e.preventDefault();
    voiceBtn.click();
  }, { passive: false });
}());
