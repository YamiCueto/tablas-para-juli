const TABLES      = [2, 3, 4, 5, 6, 7, 8, 9];
const MULTIPLIERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Accent color per table
const COLOR = {
  2: '#FF6B6B',
  3: '#FF9F43',
  4: '#FECA57',
  5: '#26de81',
  6: '#45aaf2',
  7: '#4b7bec',
  8: '#a55eea',
  9: '#fd9644'
};

// ── Build DOM ────────────────────────────────────────────────────────────────
const container = document.getElementById('tables-container');

TABLES.forEach(t => {
  const wrapper = document.createElement('div');
  wrapper.className = 'table-wrapper';

  const title = document.createElement('div');
  title.className = 'table-title';
  title.textContent = `Tabla × ${t}`;
  title.style.cssText = `
    color: ${COLOR[t]};
    background: ${COLOR[t]}1a;
    border: 1px solid ${COLOR[t]}44;
  `;
  wrapper.appendChild(title);

  const tbl = document.createElement('table');
  tbl.dataset.t = t;

  MULTIPLIERS.forEach(m => {
    const result = t * m;
    const tr = document.createElement('tr');
    tr.className = 'mul-row';
    tr.dataset.result = result;
    tr.dataset.table  = t;
    tr.dataset.mult   = m;
    tr.style.setProperty('--tc-bg', COLOR[t] + '2a');

    const tdOp  = document.createElement('td');
    tdOp.textContent = `${t} × ${m}`;

    const tdRes = document.createElement('td');
    tdRes.textContent = `= ${result}`;

    tr.appendChild(tdOp);
    tr.appendChild(tdRes);
    tbl.appendChild(tr);
  });

  wrapper.appendChild(tbl);
  container.appendChild(wrapper);
});

// ── Canvas ───────────────────────────────────────────────────────────────────
const canvas = document.getElementById('canvas-overlay');
const ctx    = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ── Voz (Web Speech API) ─────────────────────────────────────────────────────
const synth = window.speechSynthesis;
let voiceES = null;

function loadVoice() {
  const voices = synth.getVoices();
  voiceES = voices.find(v => v.lang.startsWith('es')) || voices[0] || null;
}
loadVoice();
synth.addEventListener('voiceschanged', loadVoice);

let lastSpoken = null;

function speak(t, m, result) {
  const text = `${t} por ${m} igual a ${result}`;
  if (text === lastSpoken) return;
  lastSpoken = text;

  synth.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang  = 'es-ES';
  utter.rate  = 0.95;
  utter.pitch = 1.1;
  if (voiceES) utter.voice = voiceES;
  synth.speak(utter);
}

// ── Interaction ──────────────────────────────────────────────────────────────
function clearAll() {
  document.querySelectorAll('tr.mul-row.is-source, tr.mul-row.is-cross').forEach(r => {
    r.classList.remove('is-source', 'is-cross');
  });
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function onEnter(tr) {
  clearAll();

  const result      = +tr.dataset.result;
  const sourceTable = +tr.dataset.table;
  const sourceMult  = +tr.dataset.mult;

  speak(sourceTable, sourceMult, result);

  const matched = [];
  document.querySelectorAll('tr.mul-row').forEach(row => {
    if (+row.dataset.result !== result) return;
    const tbl  = +row.dataset.table;
    const mult = +row.dataset.mult;

    const isSelf  = tbl === sourceTable;
    const isValid = mult >= 2 && mult <= 9;

    if (isSelf) {
      row.classList.add('is-source');
      matched.push({ row, tbl });
    } else if (isValid) {
      row.classList.add('is-cross');
      matched.push({ row, tbl });
    }
  });

  if (matched.length > 1) drawLines(matched);
}

function drawLines(matched) {
  const pts = matched.map(({ row, tbl }) => {
    const r = row.getBoundingClientRect();
    return {
      x: r.left + r.width / 2,
      y: r.top  + r.height / 2,
      color: COLOR[tbl]
    };
  });

  const src = pts[0];

  pts.slice(1).forEach(dst => {
    const grad = ctx.createLinearGradient(src.x, src.y, dst.x, dst.y);
    grad.addColorStop(0, src.color + 'cc');
    grad.addColorStop(1, dst.color + 'cc');

    const mx = (src.x + dst.x) / 2;
    const my = (src.y + dst.y) / 2 - Math.abs(dst.x - src.x) * 0.25;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(src.x, src.y);
    ctx.quadraticCurveTo(mx, my, dst.x, dst.y);
    ctx.strokeStyle = grad;
    ctx.lineWidth   = 2.5;
    ctx.setLineDash([7, 4]);
    ctx.shadowColor = src.color;
    ctx.shadowBlur  = 10;
    ctx.stroke();
    ctx.restore();

    [src, dst].forEach(pt => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
      ctx.fillStyle   = pt.color;
      ctx.shadowColor = pt.color;
      ctx.shadowBlur  = 14;
      ctx.fill();
      ctx.restore();
    });
  });
}

// ── Event listeners ──────────────────────────────────────────────────────────
document.querySelectorAll('tr.mul-row').forEach(tr => {
  tr.addEventListener('mouseenter', () => onEnter(tr));
});

container.addEventListener('mouseleave', () => {
  clearAll();
  synth.cancel();
  lastSpoken = null;
});

window.addEventListener('scroll', () => {
  const active = document.querySelector('tr.mul-row.is-source');
  if (active) onEnter(active);
}, { passive: true });
