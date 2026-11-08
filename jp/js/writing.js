// Порядок черт (анимация кистью) и письмо пальцем с проверкой.
// Контуры черт: KanjiVG (CC BY-SA 3.0, kanjivg.tagaini.net), система координат 109×109.
import { D, haptic } from './core.js';
import { reduced, sfx, isDark } from './fx.js';

const NS = 'http://www.w3.org/2000/svg';
let measure = null;
function samplePath(d, n = 32) {
  if (!measure) { measure = document.createElementNS(NS, 'svg'); measure.setAttribute('width', '0'); measure.setAttribute('height', '0'); measure.style.position = 'absolute'; document.body.appendChild(measure); }
  const p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); measure.appendChild(p);
  const L = p.getTotalLength(), pts = [];
  for (let i = 0; i < n; i++) { const q = p.getPointAtLength(L * i / (n - 1)); pts.push([q.x, q.y]); }
  p.remove(); return { pts, L };
}
const cache = {};
function strokesOf(ch) {
  if (cache[ch]) return cache[ch];
  const list = (D.strokes[ch] || []).map(d => ({ d, ...samplePath(d) }));
  return (cache[ch] = list);
}
const TYPES = ch => (D.k[ch] && D.k[ch].st) || [];
// окончание черты: харай (сужение), хане (крючок), томэ (остановка)
export function endKind(t) { if (!t) return 'tome'; if (/[㇒㇏㇀㇓㇢]/.test(t)) return 'harai'; if (/[㇚㇟㇂㇁㇙㇗㇆㇌㇠]/.test(t)) return 'hane'; return 'tome'; }

/* ---------- анимация порядка черт ---------- */
export function strokeAnim(host, ch, opt = {}) {
  const list = D.strokes[ch];
  host.innerHTML = '';
  if (!list) { host.innerHTML = '<div class="big-char">' + ch + '</div>'; return { replay() { } }; }
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 109 109'); svg.classList.add('stroke-svg');
  svg.innerHTML = '<g class="grid"><path d="M54.5 0V109M0 54.5H109"/></g><g class="ghost"></g><g class="ink"></g><g class="nums"></g>';
  host.appendChild(svg);
  const ghost = svg.querySelector('.ghost'), ink = svg.querySelector('.ink'), nums = svg.querySelector('.nums');
  const paths = list.map((d, i) => {
    const g = document.createElementNS(NS, 'path'); g.setAttribute('d', d); ghost.appendChild(g);
    const p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); ink.appendChild(p);
    const L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L;
    if (opt.numbers !== false) { const s = samplePath(d, 2).pts[0]; const t = document.createElementNS(NS, 'text'); t.setAttribute('x', s[0] - 4); t.setAttribute('y', s[1] - 2); t.textContent = i + 1; nums.appendChild(t); }
    return { p, L };
  });
  let timer = [];
  function replay() {
    timer.forEach(clearTimeout); timer = [];
    paths.forEach(({ p, L }) => { p.style.transition = 'none'; p.style.strokeDashoffset = L; });
    if (reduced()) { paths.forEach(({ p }) => p.style.strokeDashoffset = 0); return; }
    let t = 120;
    paths.forEach(({ p, L }) => {
      const dur = Math.max(260, L * 9) / (opt.speed || 1);
      timer.push(setTimeout(() => { p.style.transition = 'stroke-dashoffset ' + dur + 'ms cubic-bezier(.45,.05,.4,1)'; p.style.strokeDashoffset = 0; }, t));
      t += dur + 140;
    });
    if (opt.loop) timer.push(setTimeout(replay, t + 1400));
  }
  host.onclick = replay;
  replay();
  return { replay, count: list.length };
}

/* ---------- письмо пальцем ---------- */
// mode: 'trace' — видны все черты; 'hint' — видна только следующая черта; 'memory' — ничего не видно
export function writePad(host, ch, { mode = 'trace', onDone, onStroke } = {}) {
  const ref = strokesOf(ch), types = TYPES(ch);
  if (!ref.length) { host.innerHTML = '<div class="big-char">' + ch + '</div><div class="hint">Для этого знака нет данных о чертах.</div>'; setTimeout(() => onDone && onDone(0), 50); return { reset() { }, setMode() { }, total: 0 }; }
  host.innerHTML = '<div class="pad" data-ch="' + ch + '"><canvas class="pad-base"></canvas><canvas class="pad-live"></canvas><div class="pad-msg"></div></div>';
  const base = host.querySelector('.pad-base'), live = host.querySelector('.pad-live'), msg = host.querySelector('.pad-msg');
  const size = Math.min(host.clientWidth || 300, 320), dpr = devicePixelRatio || 1;
  for (const c of [base, live]) { c.width = c.height = size * dpr; c.style.width = c.style.height = size + 'px'; }
  host.querySelector('.pad').style.width = host.querySelector('.pad').style.height = size + 'px';
  const k = size * dpr / 109, bc = base.getContext('2d'), lc = live.getContext('2d');
  const inkColor = () => '#f5f1ff';
  let idx = 0, errors = 0, done = [], pts = [], drawing = false, missesHere = 0;

  function grid() {
    bc.clearRect(0, 0, base.width, base.height);
    bc.strokeStyle = 'rgba(170,140,255,.18)'; bc.lineWidth = 1 * dpr; bc.setLineDash([4 * dpr, 4 * dpr]);
    bc.beginPath(); bc.moveTo(base.width / 2, 0); bc.lineTo(base.width / 2, base.height); bc.moveTo(0, base.height / 2); bc.lineTo(base.width, base.height / 2); bc.stroke(); bc.setLineDash([]);
    // подсказки
    ref.forEach((s, i) => {
      const show = i >= idx && (mode === 'trace' || (mode === 'hint' && i === idx) || (missesHere >= 2 && i === idx));
      if (!show) return;
      bc.strokeStyle = i === idx ? 'rgba(180,140,255,.55)' : 'rgba(200,180,255,.14)';
      bc.lineWidth = 6 * dpr; bc.lineCap = bc.lineJoin = 'round'; bc.beginPath();
      s.pts.forEach(([x, y], j) => j ? bc.lineTo(x * k, y * k) : bc.moveTo(x * k, y * k)); bc.stroke();
      if (i === idx) { const [x, y] = s.pts[0]; bc.fillStyle = '#f08bd0'; bc.shadowColor = '#f08bd0'; bc.shadowBlur = 8 * dpr; bc.beginPath(); bc.arc(x * k, y * k, 4 * dpr, 0, 7); bc.fill(); bc.shadowBlur = 0; }
    });
    done.forEach(i => brush(bc, ref[i].pts, types[i]));
  }
  // каллиграфическая черта: толще в середине, сужение на харай, крючок на хане
  function brush(c, p, type) {
    const kind = endKind(type), n = p.length;
    c.fillStyle = inkColor();
    for (let i = 0; i < n - 1; i++) {
      const t = i / (n - 1);
      let w = 6.2 * (t < 0.08 ? 0.75 + t * 3 : 1);
      if (kind === 'harai' && t > 0.55) w *= 1 - 0.8 * (t - 0.55) / 0.45;
      if (kind === 'tome' && t > 0.9) w *= 1.08;
      const [x1, y1] = p[i], [x2, y2] = p[i + 1];
      for (let s = 0; s <= 4; s++) { const x = x1 + (x2 - x1) * s / 4, y = y1 + (y2 - y1) * s / 4; c.beginPath(); c.arc(x * k, y * k, w * k / 2, 0, 7); c.fill(); }
    }
  }
  grid();

  const pos = e => { const r = live.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * 109, (e.clientY - r.top) / r.height * 109]; };
  live.addEventListener('pointerdown', e => { if (idx >= ref.length) return; drawing = true; pts = [pos(e)]; live.setPointerCapture(e.pointerId); e.preventDefault(); });
  live.addEventListener('pointermove', e => {
    if (!drawing) return; const p = pos(e); pts.push(p);
    lc.clearRect(0, 0, live.width, live.height); lc.strokeStyle = inkColor(); lc.lineWidth = 5 * dpr; lc.lineCap = lc.lineJoin = 'round';
    lc.beginPath(); pts.forEach(([x, y], j) => j ? lc.lineTo(x * k, y * k) : lc.moveTo(x * k, y * k)); lc.stroke();
  });
  const end = () => { if (!drawing) return; drawing = false; judge(); };
  live.addEventListener('pointerup', end); live.addEventListener('pointercancel', end);

  function resample(p, n = 32) {
    const d = [0]; for (let i = 1; i < p.length; i++) d.push(d[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]));
    const L = d[d.length - 1], out = []; let j = 0;
    for (let i = 0; i < n; i++) { const t = L * i / (n - 1); while (j < d.length - 2 && d[j + 1] < t) j++; const seg = d[j + 1] - d[j] || 1, u = (t - d[j]) / seg; out.push([p[j][0] + (p[j + 1] ? (p[j + 1][0] - p[j][0]) * u : 0), p[j][1] + (p[j + 1] ? (p[j + 1][1] - p[j][1]) * u : 0)]); }
    return { pts: out, L };
  }
  const dist = (a, b) => a.reduce((s, p, i) => s + Math.hypot(p[0] - b[i][0], p[1] - b[i][1]), 0) / a.length;
  function judge() {
    if (pts.length < 2) { lc.clearRect(0, 0, live.width, live.height); return; }
    const u = resample(pts);
    if (u.L < 4) { lc.clearRect(0, 0, live.width, live.height); return; }
    const r = ref[idx], tol = 13 + Math.min(8, r.L / 12);
    const fwd = dist(u.pts, r.pts), back = dist(u.pts, r.pts.slice().reverse());
    const startOk = Math.hypot(u.pts[0][0] - r.pts[0][0], u.pts[0][1] - r.pts[0][1]) < 24;
    if (fwd < tol && startOk) { ok(); return; }
    let why;
    if (back < tol) why = 'Направление наоборот: начинайте от красной точки.';
    else {
      const later = ref.findIndex((s, j) => j > idx && dist(u.pts, s.pts) < 13 + Math.min(8, s.L / 12));
      why = later > 0 ? 'Это черта № ' + (later + 1) + '. Сейчас нужна № ' + (idx + 1) + ': порядок важен.' : 'Не похоже на черту № ' + (idx + 1) + '. Посмотрите на подсказку.';
    }
    bad(why);
  }
  function ok() {
    lc.clearRect(0, 0, live.width, live.height);
    done.push(idx); idx++; missesHere = 0; sfx.tap(); haptic('light');
    grid(); msg.textContent = idx < ref.length ? 'Черта ' + idx + ' из ' + ref.length : '';
    onStroke && onStroke(idx, ref.length);
    if (idx >= ref.length) { host.querySelector('.pad').classList.add('pad-done'); onDone && onDone(errors); }
  }
  function bad(why) {
    errors++; missesHere++; haptic('error');
    live.classList.remove('dissolve'); void live.offsetWidth; live.classList.add('dissolve');
    setTimeout(() => { lc.clearRect(0, 0, live.width, live.height); live.classList.remove('dissolve'); grid(); }, reduced() ? 50 : 650);
    msg.textContent = why;
  }
  return {
    reset() { idx = 0; errors = 0; done = []; missesHere = 0; host.querySelector('.pad').classList.remove('pad-done'); msg.textContent = ''; grid(); },
    setMode(m) { mode = m; grid(); }, get total() { return ref.length; }
  };
}
