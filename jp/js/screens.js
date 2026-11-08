// Экраны: Главная, Уроки, Практика, Рейтинг, Профиль (+ собеседование, входной тест)
import { D, P, tg, $, $$, esc, shuffle, sample, pick, furiHTML, audioOf, play, save, hearts, due, level, srs, srsAdd, today, ymd, addDays,
  exportProgress, importProgress, resetProgress, plural, kata2hira, hira2kata, toKana, haptic, pushCloud, ttsAvailable, canRecord, addXP } from './core.js';
import { runSession, audioBtn, toast, fillTpl } from './ex.js';
import * as G from './gen.js';
import { mascot, countUp, stamp, reduced, sfx, burst } from './fx.js';
import { strokeAnim, writePad } from './writing.js';
import { I, IMG, lessonIcon } from './icons.js';
import { foxSVG, sceneParts, heroArt } from './art.js';

export const view = () => $('#view');
let go = () => { };
export function setGo(fn) { go = fn; }
let refreshFn = () => { };
export const refresh = () => refreshFn();
const userName = () => { try { return (tg && tg.initDataUnsafe && tg.initDataUnsafe.user && tg.initDataUnsafe.user.first_name) || ''; } catch (e) { return ''; } };
const fmt = n => Number(n).toLocaleString('ru-RU');

/* ---------- открытость уроков ---------- */
export function isOpen(l) {
  if (P.done[l.id]) return true;
  const u = l.unit, i = u.lessons.indexOf(l);
  if (u.st === 0) return true;
  if (u.st === 1) return i === 0 || !!P.done[u.lessons[i - 1].id];
  if (u.st === 2) {
    if (i > 0) return !!P.done[u.lessons[i - 1].id];
    const prev = D.course.units[D.course.units.indexOf(u) - 1];
    return prev.st !== 2 || !!P.done[prev.lessons[prev.lessons.length - 1].id];
  }
  if (u.st === 3) return D.lessons.filter(x => x.unit.st === 2 && x.kind === 'test' && P.done[x.id]).length >= 7;
  return false;
}
const unitDone = u => u.lessons.filter(l => P.done[l.id]).length;
const unitOpen = u => u.lessons.some(isOpen);
function moduleTitle(u) {
  if (u.st === 2) return 'Модуль ' + u.id.slice(1) + '. ' + D.course.units_n5[u.id.slice(1)];
  return u.t;
}
const STAGE_NAME = ['Этап 0 · Собеседование', 'Этап 1 · Письменность', 'Этап 2 · Курс N5', 'Этап 3 · Сложные уровни'];
function currentUnit() {
  const v = P.viewUnit && D.course.units.find(u => u.id === P.viewUnit);
  if (v) return v;
  const n = G.nextLesson();
  return n ? n.unit : D.course.units[D.course.units.length - 1];
}
// иконки модулей нарисованы ChatGPT: img/mod-<модуль>.webp
const moduleIcon = u => IMG('mod-' + u.id, 'modic');

/* ---------- запуск уроков ---------- */
export async function startLesson(l) {
  if (!isOpen(l)) { toast('Сначала пройдите предыдущие уроки'); return; }
  if (l.kind === 'intro') return introScreen();
  let list;
  if (l.kind === 'qa') list = G.qaExercises(l.qa);
  else if (l.kind === 'phrases') list = G.phraseExercises();
  else if (l.kind === 'mock') return mockInterview();
  else list = G.lessonExercises(l);
  if (!list.length) { toast('В этом уроке пока нет заданий'); return; }
  const r = await runSession(list, { title: 'Урок пройден!', mode: l.kind === 'test' ? 'test' : 'lesson' });
  if (r.aborted) return refresh();
  if (l.kind !== 'test' || r.acc >= 70) { P.done[l.id] = Date.now(); today().ls = (today().ls || 0) + 1; save(); }
  else toast('Нужно 70% верных ответов. Повторите модуль и попробуйте ещё раз.');
  if (r.acc === 100 && r.ok >= 8) unlockAch('perfect');
  afterSession();
}
export async function startToday() {
  const t = G.todayExercises();
  if (!t.list.length) { toast('На сегодня всё пройдено!'); return; }
  const r = await runSession(t.list, { title: 'Урок пройден!', mode: 'lesson' });
  if (r.aborted) return refresh();
  if (t.lesson && r.acc >= 50) P.done[t.lesson.id] = Date.now();
  today().ls = (today().ls || 0) + 1;
  save(); afterSession();
}
function afterSession() { checkAch(); refresh(); pushCloud(); }

/* ---------- верхняя панель ---------- */
function topbar() {
  return `<div class="tb">
    <button class="ava" id="tbAva" aria-label="Профиль">${foxSVG('happy')}<i class="dot"></i></button>
    <button class="stat flame" id="tbFlame">${I.flame}<b>${P.streak.n}</b></button>
    <button class="stat gem" id="tbGem">${I.gem}<b>${fmt(P.xp)}</b></button>
    <button class="stat bolt" id="tbBolt">${I.bolt}<b>${hearts() * 5}</b></button>
    <button class="plus" id="tbPlus" aria-label="Пополнить энергию">${I.plus}</button></div>`;
}
function bindTop() {
  const a = $('#tbAva'); if (!a) return;
  a.onclick = () => go('me');
  $('#tbFlame').onclick = () => sheet('<h3>Серия дней</h3>' + streakCard() + '<p class="hint">Занимайтесь каждый день, чтобы огонёк рос. Каждые 7 дней подряд дают заморозку: она спасёт серию, если пропустите день.</p>');
  $('#tbGem').onclick = () => sheet('<h3>Кристаллы</h3><p>Кристаллы — это ваш опыт (XP). Их дают за верные ответы, уроки, задания и сундуки модулей.</p><p class="hint">Всего: ' + fmt(P.xp) + '. Сегодня: ' + today().xp + ' из цели ' + P.goal + '.</p>');
  const energy = () => sheet(`<h3>Энергия</h3><p>${I.bolt} Энергия: <b>${hearts() * 5} из 25</b>. Каждая ошибка в уроке стоит 5 энергии.</p>
    <p>Как восстановить:</p><ul><li>сама: +5 каждые 30 минут;</li><li>в «Практике»: каждые 5 верных ответов подряд дают +5.</li></ul><button class="btn" id="toPr">${I.target} В практику</button>`);
  $('#tbBolt').onclick = energy; $('#tbPlus').onclick = () => { energy(); const b = $('#toPr'); if (b) b.onclick = () => { closeSheet(); go('practice'); }; };
}

/* ---------- Главная ---------- */
export function homeScreen() {
  refreshFn = homeScreen;
  const u = currentUnit(), n = u.lessons.length, dn = unitDone(u);
  const t = today(), giftReady = t.xp >= P.goal && !(P.gift || {})[ymd()];
  view().innerHTML = topbar() + `
    <div class="hero-card"><img class="hero-img" src="img/hero-${u.id}.webp" onerror="this.onerror=null;this.src='img/hero-default.webp'" alt="">
      <button class="hc-sel" id="hcSel">${I.home} Японский · N5 ${I.chevD}</button>
      <h2>${esc(moduleTitle(u))}</h2><div class="hc-sub">${dn} / ${n} ${plural(n, 'урок', 'урока', 'уроков')}</div>
      <div class="bar"><i style="width:${dn / n * 100}%"></i></div>
      <button class="hc-go" id="hcGo" aria-label="Все модули">${I.chevR}</button></div>
    <div class="path-wrap" id="pathWrap"></div>`;
  bindTop();
  $('#hcSel').onclick = moduleSelector;
  $('#hcGo').onclick = () => go('lessons');
  drawPath($('#pathWrap'), u, giftReady);
}
function drawPath(wrap, u, giftReady) {
  const W = wrap.clientWidth || 360, cx = W / 2;
  const OFF = [0, -95, -30, -85, 15, 80, 20, -60, 10, 75, -20, -90, 30];
  const scale = Math.min(1, (W - 120) / 240);
  const nextGlobal = G.nextLesson(), lessons = u.lessons;
  let cur = lessons.find(l => !P.done[l.id] && isOpen(l)) || null;
  const pts = []; let y = 70;
  lessons.forEach((l, i) => {
    const isCur = cur && l.id === cur.id;
    // у верха пути узлы ближе к центру, чтобы не заходить под кнопки «Забрать» и «Задания»
    const near = (isCur ? y + 30 : y) < 230 ? 0.3 : 1;
    pts.push({ l, x: cx + OFF[i % OFF.length] * scale * near, y, cur: isCur });
    y += isCur ? 150 : 104;
  });
  const chestY = y + 6; pts.push({ chest: true, x: cx + (OFF[lessons.length % OFF.length] || -40) * scale, y: chestY });
  const H = chestY + 150;
  const curIdx = cur ? lessons.indexOf(cur) : -1;
  const pct = Math.min(1, today().xp / P.goal), R = 56, C = 2 * Math.PI * R;
  let nodes = '';
  pts.forEach((p, i) => {
    if (p.chest) {
      const allDone = lessons.every(l => P.done[l.id]), claimed = (P.chest || {})[u.id];
      nodes += `<button class="pnode chest${allDone && !claimed ? ' open' : ' lock'}" id="chestBtn" style="left:${p.x}px;top:${p.y}px"><span class="pn-disc">${I.chest}</span></button>`;
      return;
    }
    const l = p.l, done = !!P.done[l.id], open = isOpen(l);
    const state = p.cur ? 'cur' : done ? 'done' : open ? 'open' : 'lock';
    const icon = state === 'lock' && i <= curIdx + 2 ? I.lock : lessonIcon(l);
    const base = state === 'cur' ? 'btn-active' : state === 'done' ? 'btn-done' : 'btn-locked';
    nodes += `<button class="pnode ${state}" data-l="${l.id}" style="left:${p.x}px;top:${p.y}px" aria-label="${esc(l.t)}">` +
      `<span class="pn-disc">` +
      (p.cur ? `<svg class="pn-ring" viewBox="0 0 124 124"><circle class="t" cx="62" cy="62" r="${R}"/><circle class="v" cx="62" cy="62" r="${R}" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - Math.max(.04, pct))}"/></svg>` : '') +
      `<img class="pn-base" src="img/${base}.webp" alt="" draggable="false"><span class="pn-ic">${state === 'done' && l.kind !== 'test' ? I.check : icon}</span></span>` +
      (p.cur ? `<span class="pn-lbl">${esc(shortTitle(l))}</span>` : '') + '</button>';
  });
  // пунктирная тропинка между узлами
  let d = 'M' + pts[0].x + ' ' + pts[0].y;
  for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], my = (a.y + b.y) / 2; d += ` C${a.x} ${my} ${b.x} ${my} ${b.x} ${b.y}`; }
  const petals = Array.from({ length: 9 }, () => `<i class="petal" style="left:${10 + Math.random() * 85}%;top:${Math.random() * H * .8}px;animation-delay:${-Math.random() * 9}s;animation-duration:${8 + Math.random() * 6}s"></i>`).join('');
  wrap.style.height = H + 'px';
  // фон модуля нарисован ChatGPT: img/bg-<модуль>.webp, если его нет — общий фон
  wrap.innerHTML = `<div class="scene"><img class="scene-bg" src="img/bg-${u.id}.webp" onerror="this.onerror=null;this.src='img/bg-default.webp'" alt="">${petals}</div>
    <svg class="path-line" width="${W}" height="${H}"><path d="${d}"/></svg>
    <button class="fbtn gift${giftReady ? ' ready' : ''}" id="fGift" style="left:16px;top:24px">${I.gift}<span>Забрать</span></button>
    <button class="fbtn tasks" id="fTasks" style="right:16px;top:24px">${I.calendar}<span>Задания</span>${tasksLeft() ? '<i class="badge">' + tasksLeft() + '</i>' : ''}</button>
    ${nodes}`;
  $$('.pnode[data-l]', wrap).forEach(b => b.onclick = () => {
    const l = D.lessonById[b.dataset.l];
    if (b.classList.contains('cur') && nextGlobal && l.id === nextGlobal.id) startToday(); else startLesson(l);
  });
  $('#chestBtn').onclick = () => openChest(u);
  $('#fGift').onclick = claimGift;
  $('#fTasks').onclick = tasksSheet;
  const here = $('.pnode.cur', wrap); if (here && here.offsetTop > innerHeight * .7) setTimeout(() => here.scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' }), 250);
}
const shortTitle = l => l.t.replace(/^(Хирагана|Катакана): /, '');
function moduleSelector() {
  const units = D.course.units;
  sheet('<h3>Модули</h3><div class="sel-list">' + units.map(u => modCard(u)).join('') + '</div>' +
    `<button class="mod" id="toExp"><span class="mi">${I.wallet}</span><span class="mt"><b>Расходы</b><small>Перейти в учёт расходов</small></span><span class="chev">${I.chevR}</span></button>`);
  $$('.sheet .mod[data-u]').forEach(b => b.onclick = () => { P.viewUnit = b.dataset.u; save(); closeSheet(); go('home'); });
  $('#toExp').onclick = toExpenses;
}
export const toExpenses = () => { location.href = '../?stay=1' + location.hash; };
function modCard(u) {
  const n = u.lessons.length, dn = unitDone(u), open = unitOpen(u), cur = currentUnit() === u;
  return `<button class="mod${cur ? ' cur' : ''}${dn === n ? ' done' : ''}${open ? '' : ' locked'}" data-u="${u.id}"><span class="mi">${moduleIcon(u)}</span>
    <span class="mt"><b>${esc(moduleTitle(u))}</b><small>${dn} / ${n} ${plural(n, 'урок', 'урока', 'уроков')}</small><div class="bar"><i style="width:${dn / n * 100}%"></i></div></span><span class="chev">${I.chevR}</span></button>`;
}
function openChest(u) {
  P.chest = P.chest || {};
  if (P.chest[u.id]) { toast('Сундук этого модуля уже открыт'); return; }
  if (!u.lessons.every(l => P.done[l.id])) { toast('Пройдите все уроки модуля, чтобы открыть сундук'); return; }
  P.chest[u.id] = Date.now(); if (P.viewUnit === u.id) P.viewUnit = null; addXP(30); save(); sfx.done(); haptic('success');
  const b = $('#chestBtn').getBoundingClientRect(); burst(b.left + b.width / 2, b.top + 20, 5);
  sheet(`<div class="center"><div style="width:110px;margin:0 auto">${I.chest}</div><h3>Сундук открыт!</h3><p>${I.gem} +30 кристаллов</p></div>`);
  refresh();
}
function claimGift() {
  P.gift = P.gift || {};
  const t = today();
  if (P.gift[ymd()]) { toast('Сегодняшняя награда уже получена. Приходите завтра!'); return; }
  if (t.xp < P.goal) { sheet(`<h3>Награда дня</h3><p>Наберите дневную цель, и подарок откроется.</p><div class="bar"><i style="width:${Math.min(100, t.xp / P.goal * 100)}%"></i></div><p class="hint">${t.xp} из ${P.goal} кристаллов сегодня</p>`); return; }
  P.gift[ymd()] = 1; addXP(15); save(); sfx.done(); haptic('success');
  const b = $('#fGift').getBoundingClientRect(); burst(b.left + b.width / 2, b.top + 20, 4);
  toast('+15 кристаллов!'); refresh();
}
function tasksList() {
  const t = today();
  return [
    { ic: I.bookFill, t: 'Пройти урок', v: Math.min(1, t.ls || 0), of: 1 },
    { ic: I.check, t: 'Ответить верно 15 раз', v: Math.min(15, t.ok), of: 15 },
    { ic: I.gem, t: 'Выполнить дневную цель', v: Math.min(P.goal, t.xp), of: P.goal }
  ];
}
const tasksLeft = () => tasksList().filter(x => x.v < x.of).length;
function tasksSheet() {
  sheet('<h3>Задания на сегодня</h3>' + tasksList().map(x => `<div class="task${x.v >= x.of ? ' done' : ''}"><span class="ti">${x.ic}</span><div class="tt"><b>${x.t}</b><div class="bar"><i style="width:${x.v / x.of * 100}%"></i></div></div><small>${x.v}/${x.of}</small></div>`).join('') +
    '<p class="hint">Выполните все три, и сундук «Забрать» тоже откроется: он зависит от дневной цели.</p>');
}

/* ---------- Уроки (дашборд + модули) ---------- */
function streakCard() {
  const d0 = new Date(); const dow = (d0.getDay() + 6) % 7;
  const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((n, i) => { const d = addDays(ymd(), i - dow); const on = (P.log[d] || {}).xp > 0; return `<div><i class="${on ? 'on' : ''}${i === dow ? ' today' : ''}">${on ? I.check : ''}</i>${n}</div>`; }).join('');
  return `<div class="card"><div class="streak-h">${I.flame}${P.streak.n} ${plural(P.streak.n, 'день', 'дня', 'дней')} подряд</div><div class="week">${days}</div></div>`;
}
export function lessonsScreen() {
  refreshFn = lessonsScreen;
  const u = currentUnit(), n = u.lessons.length, dn = unitDone(u);
  const plan = G.todayPlan(), tasks = plan.rev.length ? 3 : 2;
  const name = userName();
  let html = topbar() + `<div class="welcome-card"><div><h2>${name ? 'Добро пожаловать, ' + esc(name) + '!' : 'Добро пожаловать!'}</h2><div class="hint">Продолжай учить японский!</div></div>${foxSVG('happy')}</div>
    ${streakCard()}
    <div class="card prog-card"><div style="flex:1"><h3 style="margin:0">Твой прогресс</h3><div class="hint">N5 · ${esc(moduleTitle(u).split('.')[0])}</div><div class="hint" style="color:var(--text)">${dn} / ${n} ${plural(n, 'урок', 'урока', 'уроков')}</div><div class="bar"><i style="width:${dn / n * 100}%"></i></div></div>${I.shield('N5')}</div>
    <div class="card plan-card" id="planGo"><div style="flex:1"><h3 style="margin:0">Сегодня в плане</h3><div class="hint">${tasks} ${plural(tasks, 'задание', 'задания', 'заданий')} · ~10 мин</div></div><span class="go">${I.play}</span></div>`;
  html += `<div class="hero-card page-hero"><img class="hero-img" src="img/hero-lessons.webp" onerror="this.remove()" alt=""><h2>Все модули</h2><div class="hc-sub">Курс N5 · ${D.course.units.length} модулей</div></div>`;
  let st = -1;
  for (const un of D.course.units) {
    if (un.st !== st) { st = un.st; html += '<div class="stage-h">' + STAGE_NAME[st] + '</div>'; }
    html += modCard(un);
  }
  view().innerHTML = html;
  bindTop();
  $('#planGo').onclick = startToday;
  $$('.mod[data-u]').forEach(b => b.onclick = () => {
    const un = D.course.units.find(x => x.id === b.dataset.u);
    if (un.id === 'i') { go('practice', 'talk'); return; }
    if (!unitOpen(un)) { toast('Модуль откроется, когда пройдёте предыдущие'); return; }
    P.viewUnit = un.id; save(); go('home');
  });
}

/* ---------- Практика ---------- */
export function practiceScreen(section) {
  refreshFn = () => practiceScreen(section);
  if (section) return REVIEW[section]();
  const cnt = p => due(p).length, total = due().length;
  const learned = p => Object.keys(P.srs).filter(k => k.startsWith(p)).length;
  const old = Object.entries(P.srs).sort((a, b) => a[1][5] - b[1][5]).slice(0, 1)[0];
  view().innerHTML = topbar() + `<div class="hero-card page-hero"><img class="hero-img" src="img/hero-practice.webp" onerror="this.remove()" alt=""><h2>Практика</h2><div class="hc-sub">Повторение, тренировки и собеседование</div></div>
    <div class="card due-card"><div class="due-n" id="dueN">0</div><div class="hint">к повторению сегодня</div>
    <button class="btn" id="quick">${I.repeat} Быстрое повторение · 5 мин</button>
    ${old && Date.now() - old[1][5] > 5 * 864e5 ? '<div class="hint" style="margin-top:10px">Давно не повторялось: ' + esc(keyLabel(old[0])) + '</div>' : ''}</div>
    <div class="rev-grid">
      <button class="rev-tile wide accent" data-s="talk"><span class="rg big">${IMG('mod-i', 'modic')}</span><span><b>Собеседование</b><small>самопредставление, вопросы, пробное собеседование</small></span></button>
      ${revTile('words', IMG('mod-u1', 'modic'), 'Слова', cnt('w:'), learned('w:'))}
      ${revTile('kana', IMG('mod-h', 'modic'), 'Хирагана и катакана', cnt('h:') + cnt('t:'), learned('h:') + learned('t:'))}
      ${revTile('kanji', IMG('mod-kb', 'modic'), 'Кандзи', cnt('k:'), learned('k:'))}
      ${revTile('grammar', IMG('mod-u10', 'modic'), 'Грамматика', cnt('g:'), learned('g:'))}
      <button class="rev-tile wide" data-s="audio"><span class="rg">${I.headphones}</span><span><b>Аудио</b><small>${D.sentences.length} фраз от носителей · диктант · повтор за диктором</small></span></button>
    </div>`;
  bindTop();
  countUp($('#dueN'), total, 0);
  $('#quick').onclick = quickReview;
  $$('.rev-tile').forEach(t => t.onclick = () => go('practice', t.dataset.s));
}
const revTile = (s, g, t, d, l) => `<button class="rev-tile" data-s="${s}"><span class="rg">${g}</span><b>${t}</b><small>${d !== '' ? (d ? '<em>' + d + ' сегодня</em> · ' : '') : ''}${typeof l === 'number' ? 'изучено ' + l : l}</small></button>`;
const keyLabel = k => { const t = k[0], id = k.slice(2); if (t === 'w' && D.w[id]) return D.w[id].k + ' — ' + D.w[id].ru; if (t === 'k' && D.k[id]) return id + ' — ' + D.k[id].ru; if (t === 'g' && D.g[id]) return D.g[id].t; if (t === 'h') return id; if (t === 't') return hira2kata(id); return k; };
async function quickReview() {
  let list = G.reviewMix(12);
  if (list.length < 6) { const extra = Object.keys(P.srs).sort((a, b) => P.srs[a][5] - P.srs[b][5]).slice(0, 10).map(G.fromKey).filter(Boolean); list = list.concat(extra).slice(0, 12); }
  if (!list.length) { toast('Пока нечего повторять: пройдите первый урок'); return; }
  await runSession(list, { title: 'Повторение пройдено!', mode: 'review' }); afterSession();
}
async function train(list, title) { list = list.filter(Boolean); if (!list.length) { toast('Пока нечего тренировать'); return; } await runSession(list, { title: 'Тренировка пройдена!', mode: 'review' }); afterSession(); }

const sub = t => topbar() + '<div class="subhead"><button class="back" id="back" aria-label="Назад">' + I.back + '</button><h2>' + t + '</h2></div>';
function bindBack() { bindTop(); $('#back').onclick = () => go('practice'); if (tg && tg.BackButton) { tg.BackButton.show(); tg.BackButton.onClick(backOnce); } }
function backOnce() { tg.BackButton.offClick(backOnce); tg.BackButton.hide(); go('practice'); }

const REVIEW = {};
REVIEW.words = () => {
  const f = P._wf || (P._wf = { u: 0, lv: 'all' });
  const list = D.vocab.filter(w => (!f.u || w.u === f.u) && (f.lv === 'all' || level('w:' + w.id) === f.lv) && (f.lv !== 'all' || srs('w:' + w.id)));
  view().innerHTML = sub('Слова') + `<div class="chips">${['all', 'new', 'learning', 'known', 'hard'].map(x => '<button class="chip' + (f.lv === x ? ' on' : '') + '" data-lv="' + x + '">' + { all: 'изученные', new: 'новые', learning: 'учу', known: 'знаю', hard: 'сложные' }[x] + '</button>').join('')}</div>
    <div class="chips">${[0, ...Object.keys(D.course.units_n5).map(Number)].map(u => '<button class="chip' + (f.u === u ? ' on' : '') + '" data-u="' + u + '">' + (u ? u + '. ' + D.course.units_n5[u] : 'все темы') + '</button>').join('')}</div>
    <div class="row-btns"><button class="btn sm" id="wDue">Повторить (${due('w:').length})</button><button class="btn ghost sm" id="wCards">${I.cards} Карточки</button><button class="btn ghost sm" id="wHard">Только сложные</button></div>
    <div class="wlist">${list.slice(0, 300).map(w => '<div class="wrow lv-' + level('w:' + w.id) + '"><i class="dot"></i><span class="jp">' + (w.f ? furiHTML(w.f, 'all') : esc(w.k)) + '</span><span class="tr">' + esc(w.ru) + '</span>' + audioBtn(audioOf({ w: w.id }), { nocredit: true, noslow: true }) + '</div>').join('') || '<div class="hint">Здесь появятся слова из пройденных уроков.</div>'}</div>`;
  bindBack();
  $$('[data-lv]').forEach(b => b.onclick = () => { f.lv = b.dataset.lv; REVIEW.words(); });
  $$('[data-u]').forEach(b => b.onclick = () => { f.u = +b.dataset.u; REVIEW.words(); });
  $('#wDue').onclick = () => train(due('w:').slice(0, 15).map(G.fromKey), 'Слова');
  $('#wCards').onclick = () => train(sample(list.filter(w => srs('w:' + w.id)), 15).map(w => ({ type: 'wcard', w: w.id, review: true, key: 'w:' + w.id })), 'Карточки');
  $('#wHard').onclick = () => train(Object.keys(P.srs).filter(k => k.startsWith('w:') && level(k) === 'hard').slice(0, 15).map(G.fromKey), 'Сложные слова');
};
REVIEW.kana = () => {
  const sc = P._ks || 'h';
  const L = D.kana.list, ch = k => sc === 'k' ? k.kt : k.h, key = k => (sc === 'k' ? 't:' : 'h:') + k.h;
  const cell = k => '<button class="kcell lv-' + level(key(k)) + '" data-h="' + k.h + '"><b>' + ch(k) + '</b><small>' + k.ro + '</small></button>';
  view().innerHTML = sub('Хирагана и катакана') + `<div class="chips"><button class="chip${sc === 'h' ? ' on' : ''}" data-sc="h">хирагана</button><button class="chip${sc === 'k' ? ' on' : ''}" data-sc="k">катакана</button></div>
    <div class="tr-grid">
      <button class="btn ghost" data-t="k2r">знак → звук</button><button class="btn ghost" data-t="r2k">звук → знак</button>
      <button class="btn ghost" data-t="lis">на слух</button><button class="btn ghost" data-t="wr">письмо</button>
      <button class="btn ghost" data-t="sim">похожие знаки</button><button class="btn ghost" data-t="dk">゛ и ゜</button>
      <button class="btn ghost" data-t="yo">ゃ ゅ ょ</button><button class="btn ghost" data-t="ex">っ и долгие</button></div>
    <div class="ktable">${L.filter(k => k.g === 'b').map(cell).join('')}</div><div class="sub">Звонкие</div><div class="ktable">${L.filter(k => k.g === 'd').map(cell).join('')}</div><div class="sub">Слияния</div><div class="ktable y">${L.filter(k => k.g === 'y').map(cell).join('')}</div>`;
  bindBack();
  $$('[data-sc]').forEach(b => b.onclick = () => { P._ks = b.dataset.sc; REVIEW.kana(); });
  $$('.kcell').forEach(b => b.onclick = () => kanaSheet(sc === 'k' ? hira2kata(b.dataset.h) : b.dataset.h));
  const basic = L.filter(k => k.g === 'b'), studied = L.filter(k => srs(key(k)));
  const base = studied.length >= 4 ? studied : basic.slice(0, 15);
  const T = {
    k2r: () => sample(base, 12).map(k => G.kanaToRo(ch(k), L.filter(x => x.g === k.g))),
    r2k: () => sample(base, 12).map(k => G.roToKana(ch(k), L.filter(x => x.g === k.g), sc)),
    lis: () => sample(base, 12).map(k => G.listenKana(ch(k), L.filter(x => x.g === k.g), sc)),
    wr: () => sample(base.filter(k => D.strokes[ch(k)]), 6).map(k => ({ type: 'write', ch: ch(k), mode: srs(key(k)) && level(key(k)) === 'known' ? 'memory' : 'hint', key: key(k), prompt: k.ro })),
    sim: () => shuffle(D.kana.sim.filter(g => sc === 'k' ? /[゠-ヿ]/.test(g[0]) : /[぀-ゟ]/.test(g[0]))).concat(shuffle(D.kana.sim)).slice(0, 10).map(G.kanaSimilar),
    dk: () => sample(L.filter(k => k.g === 'd'), 12).map(k => pick([G.kanaToRo, (c, p) => G.listenKana(c, p, sc)])(ch(k), L.filter(x => x.g === 'd'))),
    yo: () => sample(L.filter(k => k.g === 'y'), 12).map(k => G.kanaToRo(ch(k), L.filter(x => x.g === 'y'))),
    ex: () => G.kanaExtraLesson(sc)
  };
  $$('[data-t]').forEach(b => b.onclick = () => train(T[b.dataset.t](), b.textContent));
};
function kanaSheet(c) {
  const k = D.ka[kata2hira(c)];
  sheet(`<div class="sheet-k"><div class="k-anim kana-anim"></div><div><div class="kana-ro">${esc(k.ro)}</div>${audioBtn(audioOf({ kana: c }), { big: true })}</div></div><div class="wp"></div>`);
  strokeAnim($('.sheet .k-anim'), c); setTimeout(() => play(audioOf({ kana: c })), 200);
  if (D.strokes[c]) writePad($('.sheet .wp'), c, { mode: 'trace' });
}
REVIEW.kanji = () => {
  const key = c => 'k:' + c;
  view().innerHTML = sub('Кандзи') + `<div class="tr-grid">
     <button class="btn ghost" data-t="due">к повторению (${due('k:').length})</button><button class="btn ghost" data-t="mean">значение</button>
     <button class="btn ghost" data-t="read">чтение в словах</button><button class="btn ghost" data-t="wr">письмо по памяти</button>
     <button class="btn ghost" data-t="sim">похожие знаки</button><button class="btn ghost" data-t="basics">как писать: правила</button></div>
    <div class="kgrid">${D.kanji.list.map(k => '<button class="kj lv-' + level(key(k.c)) + '" data-c="' + k.c + '"><b>' + k.c + '</b><small>' + esc(k.ru.split(/[;,]/)[0]) + '</small></button>').join('')}</div>`;
  bindBack();
  $$('.kj').forEach(b => b.onclick = () => kanjiSheet(b.dataset.c));
  const known = D.kanji.list.filter(k => srs(key(k.c)));
  const base = known.length >= 4 ? known : D.kanji.list.slice(0, 15);
  const T = {
    due: () => due('k:').slice(0, 12).map(G.fromKey),
    mean: () => sample(base, 12).map(k => G.kanjiMeaning(k.c)),
    read: () => sample(base, 12).map(k => { const w = k.w.map(id => D.w[id]).find(x => x && x.k.length > 1); return w ? G.kanjiReading(k.c, w) : G.kanjiMeaning(k.c); }),
    wr: () => sample(base, 6).map(k => ({ type: 'write', ch: k.c, mode: 'memory', key: key(k.c), prompt: '<span class="ru-prompt">' + esc(k.ru) + '</span>' })),
    sim: () => shuffle(D.kanji.sim).slice(0, 10).map(G.kanjiSimilar),
    basics: () => G.kanjiBasics()
  };
  $$('[data-t]').forEach(b => b.onclick = () => train(T[b.dataset.t](), b.textContent));
};
export function kanjiSheet(c) {
  const k = D.k[c];
  const words = k.w.map(id => D.w[id]).filter(Boolean);
  const sents = (k.s || []).map(id => D.s[id]).filter(Boolean).slice(0, 2);
  sheet(`<div class="sheet-k"><div class="k-anim"></div><div class="k-info"><div class="k-mean">${esc(k.ru)}</div><div class="k-read"><span class="on">он: ${esc(k.on || '—')}</span><span class="kun">кун: ${esc(k.kun || '—')}</span></div>
     <div class="k-meta">${k.n} черт${k.rad ? ' · ключ ' + esc(k.rad) : ''}${k.parts.length > 1 ? ' · ' + k.parts.map(esc).join(' + ') : ''}</div></div></div>
     <div class="k-img">${I.bulb}<span>${esc(k.img || '')}</span></div>
     ${words.map(w => '<div class="wrow"><span class="jp">' + (w.f ? furiHTML(w.f, 'all') : esc(w.k)) + '</span><span class="tr">' + esc(w.ru) + '</span>' + audioBtn(audioOf({ w: w.id }), { nocredit: true, noslow: true }) + '</div>').join('')}
     ${sents.map(s => '<div class="exs"><div class="jp">' + furiHTML(s.f, 'all') + '</div><div class="ru">' + esc(s.ru) + '</div>' + audioBtn(audioOf({ s: s.id })) + '</div>').join('')}
     <div class="sub">Напишите сами</div><div class="wp"></div>`);
  strokeAnim($('.sheet .k-anim'), c);
  writePad($('.sheet .wp'), c, { mode: 'hint', onDone: e => { srsAdd('k:' + c); toast(e ? 'Готово, ошибок: ' + e : 'Без ошибок!'); } });
}
REVIEW.grammar = () => {
  const learned = D.grammar.filter(g => srs('g:' + g.id));
  const errs = P.errs.filter(e => D.g[e.k.split(':')[0]]);
  view().innerHTML = sub('Грамматика') + `<div class="tr-grid">
     <button class="btn ghost" data-t="p">выбери частицу</button><button class="btn ghost" data-t="f">исправь ошибку</button>
     <button class="btn ghost" data-t="b">собери предложение</button><button class="btn ghost" data-t="e">мои ошибки (${errs.length})</button></div>
    <div class="glist">${D.grammar.map(g => '<button class="grow-item' + (srs('g:' + g.id) ? ' on' : '') + '" data-g="' + g.id + '"><b>' + esc(g.t) + '</b><small>модуль ' + g.u + (srs('g:' + g.id) ? ' · пройдено' : '') + '</small></button>').join('')}</div>`;
  bindBack();
  const base = learned.length ? learned : D.grammar.slice(0, 4);
  const qs = t => shuffle(base.flatMap(g => G.grammarQs(g).filter((q, i) => g.q[i].t === t))).slice(0, 10);
  const T = { p: () => qs('p'), f: () => qs('f'), b: () => qs('b'), e: () => errs.slice(0, 12).map(e => { const [gid, i] = e.k.split(':'); return G.grammarQs(D.g[gid])[+i]; }) };
  $$('[data-t]').forEach(b => b.onclick = () => train(T[b.dataset.t](), b.textContent));
  $$('[data-g]').forEach(b => b.onclick = () => grammarSheet(b.dataset.g));
};
function grammarSheet(id) {
  const g = D.g[id];
  sheet(`<h3>${esc(g.t)}</h3><div class="rule">${esc(g.rule)}</div>${g.ex.map(e => '<div class="exs"><div class="jp">' + furiHTML(e.f, 'all') + '</div><div class="ru">' + esc(e.ru) + '</div>' + audioBtn(e.s ? audioOf({ s: e.s }) : audioOf({ text: e.jp })) + '</div>').join('')}
    ${(g.tat || []).slice(0, 5).map(i => D.s[i]).filter(Boolean).map(s => '<div class="exs"><div class="jp">' + furiHTML(s.f) + '</div><div class="ru">' + esc(s.ru) + '</div>' + audioBtn(audioOf({ s: s.id })) + '</div>').join('')}
    <button class="btn" id="gTrain" style="width:100%;margin-top:8px">Тренировать</button>`);
  $('#gTrain').onclick = () => { closeSheet(); train([G.gCard(id), ...G.grammarQs(g)], g.t); };
}
REVIEW.audio = () => {
  const learnedW = new Set(Object.keys(P.srs).filter(k => k.startsWith('w:')).map(k => k.slice(2)));
  let pool = D.sentences.filter(s => s.lv >= 0.75 && s.bk === 0 && (learnedW.size < 20 || s.w.some(w => learnedW.has(w))));
  if (pool.length < 10) pool = D.sentences.filter(s => s.lv >= 0.75 && s.bk === 0);
  view().innerHTML = sub('Аудио') + `<p class="hint">Все фразы озвучены носителями языка (Tatoeba). У каждой записи указан автор и лицензия.</p>
    <div class="tr-grid"><button class="btn ghost" data-t="tr">послушай → перевод</button><button class="btn ghost" data-t="jp">что прозвучало</button>
    <button class="btn ghost" data-t="dic">диктант хираганой</button><button class="btn ghost" data-t="sh">повтор за диктором${canRecord() ? '' : ' (без записи)'}</button>
    <button class="btn ghost" data-t="w">слова на слух</button></div>
    <div class="hint">${ttsAvailable() ? '' : 'Синтез японской речи на этом устройстве недоступен, поэтому слова без живой записи звучать не будут.'}</div>`;
  bindBack();
  const T = {
    tr: () => sample(pool, 10).map(s => G.sListen(s, pool)),
    jp: () => sample(pool, 10).map(G.sListenJP),
    dic: () => sample(pool.filter(s => s.jp.length <= 10), 6).map(G.sDictation),
    sh: () => sample(pool.filter(s => s.jp.length <= 16), 6).map(G.sSpeak),
    w: () => sample(D.vocab.filter(w => w.a && (learnedW.size < 10 || learnedW.has(w.id))), 12).map(w => G.wordMC(w, 'au'))
  };
  $$('[data-t]').forEach(b => b.onclick = () => train(T[b.dataset.t](), b.textContent));
};

/* ---------- собеседование (раздел практики) ---------- */
REVIEW.talk = () => {
  const me = P.me || {}, u = D.course.units.find(x => x.id === 'i');
  const lines = D.interview.intro.lines.map(l => '<div class="exs"><div class="jp">' + furiHTML(fillTpl(l.f, me), 'all') + '</div><div class="ru">' + esc(fillTpl(l.ru, me)) + '</div>' + audioBtn(l.s ? audioOf({ s: l.s }) : audioOf({ text: fillTpl(l.jp, me) })) + '</div>').join('');
  const last = P.mock[P.mock.length - 1];
  const LI = { intro: I.user, qa: I.kana('話'), phrases: I.info, mock: I.mic };
  view().innerHTML = sub('Собеседование') + `<div class="talk-hero"><div class="interviewer"><div class="sensei"></div><div class="lantern"></div></div><div><h2>Собеседование в языковую школу</h2><p class="hint">Этап 0 открыт сразу и идёт параллельно с курсом.</p></div></div>
    <div class="lessons-list">${u.lessons.map(l => '<button class="lrow' + (P.done[l.id] ? ' done' : '') + '" data-l="' + l.id + '"><span class="li">' + (P.done[l.id] ? I.check : LI[l.kind] || I.star) + '</span><b>' + esc(l.t) + '</b><small>' + (l.kind === 'mock' && last ? last.score + '%' : '') + '</small></button>').join('')}</div>
    <div class="card"><h3>Ваше самопредставление</h3><div class="hint">Заполните о себе, и приложение составит речь.</div><div class="form" id="meForm">${D.interview.intro.fields.map(f => f.opts ?
      '<label>' + esc(f.label) + '<select data-f="' + f.id + '">' + f.opts.map(o => '<option value="' + esc(o[0]) + '"' + (me[f.id] === o[0] ? ' selected' : '') + '>' + esc(o[1]) + '</option>').join('') + '</select></label>' :
      '<label>' + esc(f.label) + '<input data-f="' + f.id + '" value="' + esc(me[f.id] || '') + '" placeholder="' + esc(f.ph) + '"></label>').join('')}</div>
      <div class="hint">Имя и город пишите катаканой. Можно латиницей: arekkusu → アレックス.</div>
      <div class="intro-lines">${lines}</div></div>
    <div class="card ai"><h3>Собеседование с ИИ</h3><p>Живой разговор: бот играет преподавателя школы, задаёт вопросы по-японски, а в конце разбирает ошибки и ставит оценку.</p><p>Закройте приложение и напишите боту: <b>собеседование</b>.</p><button class="btn ghost" id="toBot">Перейти в чат</button></div>`;
  bindBack();
  $$('#meForm [data-f]').forEach(inp => inp.addEventListener('change', () => {
    let v = inp.value;
    if (inp.tagName === 'INPUT' && inp.dataset.f !== 'age' && /[a-z]/i.test(v)) v = hira2kata(toKana(v, false, true));
    P.me = P.me || {}; P.me[inp.dataset.f] = v; save(); REVIEW.talk();
  }));
  $$('.lrow').forEach(b => b.onclick = () => startLesson(D.lessonById[b.dataset.l]));
  $('#toBot').onclick = () => { if (tg) tg.close(); else toast('Откройте чат с ботом в Telegram'); };
};
async function introScreen() {
  if (!P.me || !P.me.name) { go('practice', 'talk'); toast('Сначала заполните данные о себе'); return; }
  const r = await runSession(G.introExercises(), { title: 'Урок пройден!', mode: 'lesson' });
  if (!r.aborted) { P.done['i-intro'] = Date.now(); save(); }
  afterSession();
}
async function mockInterview() {
  const list = G.mockExercises();
  const r = await runSession([{ type: 'info', title: 'Пробное собеседование', html: '<div class="interviewer big"><div class="sensei"></div><div class="lantern"></div></div><p>Преподаватель задаст 10 вопросов голосом. Текст вопроса скрыт, но его можно открыть. Отвечайте полными предложениями.</p><p class="hint">Не расслышали? Нажмите кнопку медленного воспроизведения. На собеседовании так же можно попросить: もう一度お願いします。</p>', btn: 'Начать' }, ...list], { title: 'Собеседование окончено', mode: 'test' });
  if (r.aborted) return refresh();
  const score = Math.round(r.ok / list.length * 100);
  P.mock.push({ t: Date.now(), score }); P.done['i-mock'] = Date.now(); save();
  unlockAch('mock');
  const bad = list.filter(x => x.result && !x.result.ok);
  sheet(`<h3>Разбор собеседования</h3><div class="score-big">${score}%</div><p>${score >= 80 ? 'Отлично! Вы готовы.' : score >= 50 ? 'Хорошо, но есть что подтянуть.' : 'Нужно ещё потренироваться. Пройдите уроки с вопросами.'}</p>
    ${bad.length ? '<div class="sub">Над чем поработать</div>' + bad.map(x => '<div class="exs"><div class="jp">' + furiHTML(x.qa.qf, 'all') + '</div><div class="ru">' + esc(x.qa.ru) + '</div><div class="hint">Ваш ответ: ' + esc(x.result.txt || '—') + '</div><div class="jp">' + furiHTML(fillTpl(x.qa.a[0].f, P.me || {}), 'all') + '</div></div>').join('') : ''}
    <p class="hint">Для живой практики напишите боту «собеседование».</p>`);
  afterSession();
}

/* ---------- Рейтинг ---------- */
const RANKS = [[0, 'Новичок', '初心者'], [150, 'Ученик', '生徒'], [500, 'Знаток каны', 'かな名人'], [1200, 'Сэмпай', '先輩'], [2500, 'Мастер N5', '達人'], [5000, 'Сэнсэй', '先生']];
const rankOf = xp => { let i = 0; while (i + 1 < RANKS.length && xp >= RANKS[i + 1][0]) i++; return i; };
const ACH = [
  ['first', '初', 'Первый урок'], ['perfect', '完', 'Урок без ошибок'], ['streak7', '七', '7 дней подряд'], ['streak30', '月', '30 дней подряд'], ['streak100', '百', '100 дней подряд'],
  ['words50', '語', '50 слов'], ['words200', '詞', '200 слов'], ['kana_h', 'あ', 'Вся хирагана'], ['kana_k', 'ア', 'Вся катакана'],
  ['kanji25', '字', '25 кандзи'], ['kanji103', '漢', 'Все кандзи N5'], ['mock', '面', 'Пробное собеседование'], ['xp1000', '千', '1000 XP']];
export function unlockAch(id) { if (P.ach[id]) return; P.ach[id] = Date.now(); save(); const a = ACH.find(x => x[0] === id); if (a) setTimeout(() => stamp(a[2], a[1]), 400); }
export function checkAch() {
  const n = p => Object.keys(P.srs).filter(k => k.startsWith(p)).length;
  if (Object.keys(P.done).length) unlockAch('first');
  if (P.streak.n >= 7) unlockAch('streak7'); if (P.streak.n >= 30) unlockAch('streak30'); if (P.streak.n >= 100) unlockAch('streak100');
  if (n('w:') >= 50) unlockAch('words50'); if (n('w:') >= 200) unlockAch('words200');
  if (n('h:') >= 46) unlockAch('kana_h'); if (n('t:') >= 46) unlockAch('kana_k');
  if (n('k:') >= 25) unlockAch('kanji25'); if (n('k:') >= 103) unlockAch('kanji103');
  if (P.xp >= 1000) unlockAch('xp1000');
}
function weekStats() {
  const days = Array.from({ length: 7 }, (_, i) => addDays(ymd(), i - 6));
  const log = days.map(d => P.log[d] || { xp: 0, ok: 0, bad: 0, wrong: [] });
  const xp = log.reduce((s, x) => s + x.xp, 0), ok = log.reduce((s, x) => s + x.ok, 0), bad = log.reduce((s, x) => s + x.bad, 0);
  const weak = Object.entries(P.srs).filter(([k, v]) => v[4] >= 1).sort((a, b) => b[1][4] - a[1][4] || a[1][0] - b[1][0]).slice(0, 6).map(([k]) => k);
  const mastered = Object.entries(P.srs).filter(([k, v]) => v[1] >= 7).length;
  const upcoming = D.lessons.filter(l => !P.done[l.id] && l.unit.st >= 1).slice(0, 4);
  return { days, log, xp, ok, bad, weak, mastered, upcoming };
}
function weeklyCard() {
  const w = weekStats(); const max = Math.max(1, ...w.log.map(x => x.xp));
  return `<div class="card weekly"><h3>Итог недели</h3>
    <div class="bars7">${w.log.map((x, i) => '<div><i style="height:' + (4 + x.xp / max * 66) + 'px"></i><span>' + ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'][new Date(w.days[i] + 'T12:00').getDay()] + '</span></div>').join('')}</div>
    <p><b>${w.xp} XP</b> · верно ${w.ok}, ошибок ${w.bad} · закреплено надолго: ${w.mastered}</p>
    ${w.weak.length ? '<p><b>Слабые места:</b> ' + w.weak.map(k => esc(keyLabel(k))).join('; ') + '</p>' : ''}
    ${w.upcoming.length ? '<p><b>План на неделю:</b> ' + w.upcoming.map(l => esc(moduleTitle(l.unit).replace(/\.\s.*/, '') + ' — ' + l.t)).join('; ') + '</p>' : ''}</div>`;
}
export function ratingScreen() {
  refreshFn = ratingScreen;
  const ri = rankOf(P.xp), r = RANKS[ri], nx = RANKS[ri + 1];
  const n = p => Object.keys(P.srs).filter(k => k.startsWith(p)).length;
  view().innerHTML = topbar() + `<div class="hero-card page-hero"><img class="hero-img" src="img/hero-rating.webp" onerror="this.remove()" alt=""><h2>Рейтинг</h2><div class="hc-sub">Звания, рекорды и печати ханко</div></div>
    <div class="card rank-card">${I.shield(r[2].length <= 2 ? r[2] : 'N5')}<div class="rank-name">${r[1]}</div><div class="rank-jp">${r[2]}</div>
      ${nx ? `<div class="bar" style="margin:12px 8px 4px"><i style="width:${(P.xp - r[0]) / (nx[0] - r[0]) * 100}%"></i></div><div class="hint">до звания «${nx[1]}»: ${nx[0] - P.xp} кристаллов</div>` : '<div class="hint">Высшее звание!</div>'}</div>
    <div class="stats4"><div>${I.flame}<span><b>${P.streak.best}</b><span>лучшая серия</span></span></div><div>${I.gem}<span><b>${fmt(P.xp)}</b><span>кристаллов</span></span></div>
      <div>${IMG('mod-u1', 'modic')}<span><b>${n('w:')}</b><span>слов</span></span></div><div>${IMG('mod-kb', 'modic')}<span><b>${n('k:')}</b><span>кандзи</span></span></div></div>
    ${weeklyCard()}
    <div class="card"><h3>Печати ханко</h3><div class="passport">${ACH.map(a => '<div class="hk' + (P.ach[a[0]] ? ' got' : '') + '"><div class="hanko sm"><span>' + a[1] + '</span></div><small>' + esc(a[2]) + '</small></div>').join('')}</div></div>
    <div class="card"><h3>Звания</h3>${RANKS.map((x, i) => '<div class="task' + (i <= ri ? ' done' : '') + '"><span class="ti">' + (i <= ri ? I.check : I.lock) + '</span><div class="tt"><b>' + x[1] + '</b> <span class="jp hint">' + x[2] + '</span></div><small>' + fmt(x[0]) + '</small></div>').join('')}</div>`;
  bindTop();
}

/* ---------- Профиль ---------- */
export function meScreen() {
  refreshFn = meScreen;
  const s = P.set, ri = rankOf(P.xp);
  const name = userName() || (P.me && P.me.name) || 'Ученик';
  view().innerHTML = topbar() + `<div class="hero-card page-hero"><img class="hero-img" src="img/hero-profile.webp" onerror="this.remove()" alt=""><div class="prof-head"><span class="ava">${foxSVG('happy')}<i class="dot"></i></span><div><h2>${esc(name)}</h2><div class="hc-sub">${RANKS[ri][1]} · ${RANKS[ri][2]}</div></div></div></div>
    ${P.streak.freeze ? '<div class="card frost-card">' + I.snow + '<span>Заморозок серии: ' + P.streak.freeze + '. Если пропустите день, серия не сгорит.</span></div>' : ''}
    <div class="card settings"><h3>Настройки</h3>
      <label>Дневная цель<select id="sGoal">${[20, 30, 50, 80].map(g => '<option' + (P.goal === g ? ' selected' : '') + '>' + g + '</option>').join('')}</select></label>
      <label>Ромадзи на карточках<input type="checkbox" id="sRo"${s.romaji ? ' checked' : ''}></label>
      <label>Фуригана<select id="sFuri"><option value="all"${s.furi === 'all' ? ' selected' : ''}>над всеми кандзи</option><option value="unknown"${s.furi === 'unknown' ? ' selected' : ''}>над невыученными</option><option value="none"${s.furi === 'none' ? ' selected' : ''}>без фуриганы</option></select></label>
      <label>Анимации<select id="sMo"><option value="auto"${s.motion === 'auto' ? ' selected' : ''}>как в системе</option><option value="less"${s.motion === 'less' ? ' selected' : ''}>меньше</option><option value="full"${s.motion === 'full' ? ' selected' : ''}>все</option></select></label>
      <label>Громкость эффектов<input type="range" id="sVol" min="0" max="1" step="0.1" value="${s.sound}"></label>
      <div class="hint" style="margin-top:8px">Напоминание о занятии: напишите боту, например, «напоминай про японский в 19:00».</div></div>
    <button class="mod" id="toExp"><span class="mi">${I.wallet}</span><span class="mt"><b>Расходы</b><small>Перейти в учёт расходов</small></span><span class="chev">${I.chevR}</span></button>
    <button class="mod" id="sTest"><span class="mi">${I.repeat}</span><span class="mt"><b>Пройти входной тест заново</b><small>Определит, что вы уже знаете</small></span><span class="chev">${I.chevR}</span></button>
    <div class="row-btns"><button class="btn ghost sm" id="sExp">Резервная копия</button><button class="btn ghost sm" id="sImp">Восстановить</button><button class="btn ghost sm danger" id="sReset">Сбросить</button></div>
    <div class="hint">Прогресс хранится в Telegram (облако бота) и на телефоне. Голосовые записи никуда не отправляются.</div>
    <div class="credits-link"><a href="#" id="toCredits">Источники аудио и данных</a></div>`;
  bindTop();
  const bind = (id, fn) => $(id).addEventListener('change', e => { fn(e.target); save(); });
  bind('#sGoal', t => P.goal = +t.value); bind('#sRo', t => s.romaji = t.checked); bind('#sFuri', t => s.furi = t.value);
  bind('#sMo', t => { s.motion = t.value; document.documentElement.classList.toggle('less-motion', reduced()); });
  bind('#sVol', t => { s.sound = +t.value; sfx.ok(1); });
  $('#toExp').onclick = toExpenses;
  $('#sTest').onclick = () => placementFlow(true);
  $('#sExp').onclick = () => { const code = exportProgress(); sheet('<h3>Резервная копия</h3><p class="hint">Скопируйте этот код и сохраните, например, в «Избранном» Telegram.</p><textarea class="code" readonly>' + code + '</textarea><button class="btn" id="cp" style="width:100%">Скопировать</button>'); $('#cp').onclick = () => { navigator.clipboard && navigator.clipboard.writeText(code).then(() => toast('Скопировано')); $('.code').select(); }; };
  $('#sImp').onclick = () => { sheet('<h3>Восстановить</h3><textarea class="code" id="impT" placeholder="Вставьте код копии"></textarea><button class="btn" id="impB" style="width:100%">Восстановить</button>'); $('#impB').onclick = () => { try { importProgress($('#impT').value); closeSheet(); toast('Прогресс восстановлен'); meScreen(); } catch (e) { toast('Код не подошёл'); } }; };
  $('#sReset').onclick = () => { if (confirm('Удалить весь прогресс японского? Расходы не затронутся.')) { resetProgress(); location.reload(); } };
  $('#toCredits').onclick = e => { e.preventDefault(); credits(); };
}
export function credits() {
  const sp = {}; D.sentences.forEach(s => { sp[s.sp] = s.lic; });
  sheet(`<h3>Источники</h3>
    <p><b>Фразы с аудио:</b> <a href="https://tatoeba.org" target="_blank">Tatoeba</a>. Тексты под CC BY 2.0 FR, записи носителей: ${Object.entries(sp).map(([u, l]) => esc(u) + ' (' + esc(l) + ')').join(', ')}. Переводы на русский — участники Tatoeba.</p>
    <p><b>Произношение слов и каны:</b> <a href="https://lingualibre.org" target="_blank">Lingua Libre</a> на Wikimedia Commons, CC BY 4.0 / CC0. Автор указан у каждой записи.</p>
    <p><b>Порядок черт:</b> <a href="https://kanjivg.tagaini.net" target="_blank">KanjiVG</a> © Ulrich Apel, CC BY-SA 3.0.</p>
    <p><b>Синтезированный голос</b> помечен значком робота. Он звучит, только если для слова нет живой записи и телефон умеет говорить по-японски.</p>
    <p class="hint">Слова, грамматика, объяснения и примеры без живой записи составлены для этого приложения. Если найдёте неточность, покажите преподавателю или носителю.</p>`);
}

/* ---------- нижний лист ---------- */
export function sheet(html) {
  closeSheet();
  const d = document.createElement('div'); d.className = 'sheet-wrap';
  d.innerHTML = '<div class="sheet"><button class="sheet-x" aria-label="Закрыть">' + I.close + '</button>' + html + '</div>';
  document.body.appendChild(d);
  d.onclick = e => { if (e.target === d) closeSheet(); };
  $('.sheet-x', d).onclick = closeSheet;
  requestAnimationFrame(() => d.classList.add('on'));
}
export function closeSheet() { $$('.sheet-wrap').forEach(x => x.remove()); }

/* ---------- приветствие и входной тест ---------- */
export function welcome() {
  view().innerHTML = `<div class="center welcome"><img class="welcome-img" src="img/hero-welcome.webp" onerror="this.remove()" alt=""><div class="fox-host" id="wf"></div><h1>ようこそ！</h1><p>Я лисёнок Кицу, твой учитель японского. Сначала короткий тест (5–7 минут): он найдёт, что ты уже знаешь, и сразу отметит это пройденным.</p>
    <button class="btn" id="wTest">Пройти входной тест</button><button class="btn ghost" id="wZero">Начать с нуля</button>
    <p class="hint">Тест можно пройти заново в профиле.</p></div>`;
  mascot($('#wf'), 'happy', 'はじめまして！');
  $('#wTest').onclick = () => placementFlow(false);
  $('#wZero').onclick = () => { P.placed = true; save(); go('home'); };
}
export async function placementFlow(again) {
  const p = G.placement();
  const r = await runSession([{ type: 'info', title: 'Входной тест', html: '<p>Вопросы подстраиваются под вас: верно — сложнее, ошибка — проще. Если не знаете ответ, выбирайте «Не знаю», это нормально.</p>', btn: 'Начать' }, ...p.list], { title: 'Тест пройден!', mode: 'test', adapt: p.adapt });
  if (r.aborted) { if (!P.placed) welcome(); return; }
  G.applyPlacement(p.res);
  const b = p.res.blocks, names = { h: 'Хирагана', k: 'Катакана', v: 'Слова' };
  const lvTxt = (id, L) => id === 'v' ? (L < 0 ? 'начнём с первых слов' : 'знакомы модули 1–' + (L + 1)) : L < 0 ? 'учим с начала' : L >= 4 ? 'знаете полностью' : L >= 2 ? 'знаете основу' : 'знаете часть';
  const gKnown = Object.entries(p.res.g).filter(([, ok]) => ok).map(([id]) => D.g[id].t.split(' — ')[0]);
  P.viewUnit = null; save();
  go('home');
  setTimeout(() => sheet(`<h3>Результат</h3>${Object.keys(names).map(id => '<p><b>' + names[id] + ':</b> ' + lvTxt(id, b[id].pass) + '</p>').join('')}
    <p><b>Грамматика:</b> ${gKnown.length ? 'знаете ' + gKnown.map(esc).join(', ') : 'начнём с основ'}.</p><p><b>Аудирование:</b> ${p.res.listen}/3.</p>
    <p class="hint">Известное отмечено пройденным и добавлено в повторение. Нажмите на светящийся урок, чтобы начать.</p>`), 700);
}
