// Эффекты: звуки, лепестки, фейерверк, талисман-лисёнок, счётчики
import { P, $, haptic } from './core.js';
import { foxSVG } from './art.js';

export const reduced = () => P.set.motion === 'less' || (P.set.motion === 'auto' && matchMedia('(prefers-reduced-motion: reduce)').matches);
export const isDark = () => document.documentElement.classList.contains('dark');

/* ---------- мягкие звуки (синтез, без файлов) ---------- */
let ac = null;
function ctx() { if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } } if (ac && ac.state === 'suspended') ac.resume(); return ac; }
function tone(freq, t0, dur, type = 'sine', vol = 0.25) {
  const c = ctx(); if (!c || !P.set.sound) return;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.value = freq;
  const v = vol * P.set.sound, t = c.currentTime + t0;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.05);
}
export const sfx = {
  ok(combo = 1) { const base = 880 * Math.pow(1.06, Math.min(combo, 8)); tone(base, 0, 0.5, 'sine', 0.22); tone(base * 1.5, 0.06, 0.6, 'sine', 0.12); tone(base * 2.01, 0.02, 0.35, 'triangle', 0.05); },
  bad() { tone(330, 0, 0.25, 'sine', 0.12); tone(294, 0.12, 0.3, 'sine', 0.1); },
  tap() { tone(1200, 0, 0.06, 'triangle', 0.05); },
  done() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.6, 'sine', 0.18)); },
  stamp() { tone(110, 0, 0.18, 'square', 0.12); tone(80, 0.02, 0.25, 'sine', 0.25); },
  boom() { tone(60 + Math.random() * 30, 0, 0.5, 'sine', 0.2); }
};

/* ---------- частицы (лепестки / светлячки / конфетти) ---------- */
let pc = null, parts = [], raf = 0;
function canvas() {
  if (pc) return pc;
  pc = document.createElement('canvas'); pc.className = 'fx-canvas';
  document.body.appendChild(pc);
  const fit = () => { pc.width = innerWidth * devicePixelRatio; pc.height = innerHeight * devicePixelRatio; };
  fit(); addEventListener('resize', fit);
  return pc;
}
function loop() {
  const c = pc.getContext('2d'), dpr = devicePixelRatio;
  c.clearRect(0, 0, pc.width, pc.height);
  const now = performance.now();
  parts = parts.filter(p => now - p.t0 < p.life);
  for (const p of parts) {
    const k = (now - p.t0) / p.life;
    p.vy += p.g; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
    c.save(); c.globalAlpha = Math.max(0, 1 - k * k); c.translate(p.x * dpr, p.y * dpr); c.rotate(p.rot);
    if (p.kind === 'petal') {
      c.fillStyle = p.color; c.beginPath(); const s = p.size * dpr;
      c.moveTo(0, -s); c.quadraticCurveTo(s * 0.9, -s * 0.3, 0, s); c.quadraticCurveTo(-s * 0.9, -s * 0.3, 0, -s); c.fill();
    } else if (p.kind === 'fly') {
      const s = p.size * dpr * (0.7 + 0.3 * Math.sin(now / 120 + p.x));
      const gr = c.createRadialGradient(0, 0, 0, 0, 0, s * 3); gr.addColorStop(0, p.color); gr.addColorStop(1, 'rgba(255,240,150,0)');
      c.fillStyle = gr; c.beginPath(); c.arc(0, 0, s * 3, 0, 7); c.fill();
    } else if (p.kind === 'spark') {
      c.fillStyle = p.color; c.beginPath(); c.arc(0, 0, p.size * dpr * (1 - k), 0, 7); c.fill();
    } else { c.fillStyle = p.color; c.fillRect(-p.size * dpr / 2, -p.size * dpr / 4, p.size * dpr, p.size * dpr / 2); }
    c.restore();
  }
  if (parts.length) raf = requestAnimationFrame(loop); else { raf = 0; c.clearRect(0, 0, pc.width, pc.height); }
}
function emit(list) { canvas(); parts.push(...list); if (!raf) raf = requestAnimationFrame(loop); }

const PETALS = ['#f7b7c8', '#f4a3b8', '#fbd3de', '#ffc2d1', '#ef8fa8'];
const FLIES = ['rgba(255,236,140,.95)', 'rgba(220,255,160,.9)', 'rgba(255,210,120,.9)'];
export function burst(x, y, combo = 1) {
  if (reduced()) return;
  const n = Math.min(14 + combo * 6, 60), dark = false, out = [];
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * (3 + combo);
    out.push({ kind: dark ? 'fly' : 'petal', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2, g: dark ? 0.02 : 0.12, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, size: 4 + Math.random() * 4, color: pick(dark ? FLIES : PETALS), t0: performance.now(), life: 900 + Math.random() * 700 });
  }
  if (combo >= 3) for (let i = 0; i < combo * 4; i++) out.push({ kind: 'conf', x, y, vx: (Math.random() - 0.5) * 12, vy: -Math.random() * 10, g: 0.25, rot: 0, vr: 0.3, size: 7, color: pick(['#ffc83d', '#a77bff', '#f08bd0', '#6ad1ff', '#ffffff']), t0: performance.now(), life: 1200 });
  emit(out);
}
export function fireflyTo(x, y) {
  if (reduced()) return;
  emit([{ kind: 'fly', x, y, vx: 0, vy: -2.5, g: -0.01, rot: 0, vr: 0, size: 5, color: FLIES[0], t0: performance.now(), life: 2000 }]);
}
const pick = a => a[Math.random() * a.length | 0];

/* ---------- фейерверк ханаби ---------- */
export function hanabi(text) {
  const layer = document.createElement('div'); layer.className = 'hanabi';
  layer.innerHTML = '<div class="hanabi-city"></div><div class="hanabi-text">' + text + '</div><div class="hanabi-skip">коснитесь, чтобы продолжить</div>';
  document.body.appendChild(layer);
  const close = () => { layer.classList.add('out'); setTimeout(() => layer.remove(), 400); };
  layer.onclick = close;
  if (reduced()) { setTimeout(close, 1800); return; }
  const shots = 6;
  for (let s = 0; s < shots; s++) setTimeout(() => {
    const x = innerWidth * (0.15 + Math.random() * 0.7), y = innerHeight * (0.15 + Math.random() * 0.35), col = pick(['#ffd166', '#ef476f', '#06d6a0', '#8ecae6', '#f7b7c8', '#ffffff']);
    const out = []; for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2, sp = 3 + Math.random() * 1.5; out.push({ kind: 'spark', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 0.05, rot: 0, vr: 0, size: 2.6, color: col, t0: performance.now(), life: 1300 }); }
    emit(out); sfx.boom();
  }, s * 320);
  setTimeout(close, 2600);
}

/* ---------- счётчик XP с прокруткой чисел ---------- */
export function countUp(el, to, from = +el.textContent || 0) {
  if (reduced()) { el.textContent = to; return; }
  const t0 = performance.now(), d = 700;
  const step = t => { const k = Math.min(1, (t - t0) / d); el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}

/* ---------- лисёнок-учитель ---------- */
const MOOD_FACE = { idle: 'idle', happy: 'happy', cheer: 'happy', sad: 'sad', sleepy: 'sleepy' };
const SAY = {
  idle: ['がんばって！ Удачи!', 'Сегодня учим немножко, но каждый день.', 'Нажми «Урок на сегодня», я всё подготовил.', 'いっしょに べんきょう しましょう！'],
  happy: ['すごい！ Отлично!', 'よくできました！', 'Так держать!', 'いいね！'],
  sad: ['だいじょうぶ。Ничего страшного!', 'Ошибки помогают запомнить.', 'Попробуем ещё раз.'],
  cheer: ['Какая серия!', 'Ты в ударе!', 'まだまだ！ Ещё!'],
  sleepy: ['Ты давно не заходил… ねむい…', 'Я соскучился! Давай повторим?']
};
export function mascot(host, mood = 'idle', text) {
  host.classList.add('fox');
  if (!host.querySelector('.fox-svg')) {
    host.innerHTML = '<span class="fox-pic"></span><div class="fox-bubble"></div>';
    host.addEventListener('click', () => { if (!reduced()) { host.classList.remove('wiggle'); void host.offsetWidth; host.classList.add('wiggle'); } haptic('light'); sfx.tap(); say(host, pick(SAY[host.dataset.mood] || SAY.idle)); });
  }
  if (host.dataset.mood !== mood) host.querySelector('.fox-pic').innerHTML = foxSVG(MOOD_FACE[mood] || 'happy');
  host.dataset.mood = mood;
  say(host, text || pick(SAY[mood] || SAY.idle));
}
function say(host, t) { const b = host.querySelector('.fox-bubble'); if (b) { b.textContent = t; b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); } }

/* ---------- переход между экранами: мягкий сдвиг с проявлением ---------- */
// dir: 1 — вперёд (вкладка правее или вглубь), -1 — назад, 0 — без направления
export function swapView(render, dir = 0) {
  if (reduced()) { render(); return; }
  const root = document.documentElement;
  root.dataset.vt = dir > 0 ? 'fwd' : dir < 0 ? 'back' : 'up';
  if (document.startViewTransition) {
    try { document.startViewTransition(() => render()); return; } catch (e) { }
  }
  const v = document.getElementById('view');
  v.classList.remove('v-in'); v.classList.add('v-out');
  setTimeout(() => { render(); v.classList.remove('v-out'); void v.offsetWidth; v.classList.add('v-in'); setTimeout(() => v.classList.remove('v-in'), 360); }, 130);
}

/* ---------- печать ханко ---------- */
export function stamp(title, glyph) {
  const d = document.createElement('div'); d.className = 'stamp-pop';
  d.innerHTML = '<div class="hanko"><span>' + glyph + '</span></div><div class="stamp-title">' + title + '</div><div class="hanabi-skip">коснитесь</div>';
  document.body.appendChild(d); sfx.stamp(); haptic('success');
  const close = () => { d.classList.add('out'); setTimeout(() => d.remove(), 350); };
  d.onclick = close; setTimeout(close, 2200);
}
