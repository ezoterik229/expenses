// Ядро: данные, прогресс, интервальные повторения, аудио, ромадзи → кана
export const tg = window.Telegram && window.Telegram.WebApp;
export const D = {};

/* ---------- утилиты ---------- */
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const pick = a => a[Math.random() * a.length | 0];
export const sample = (a, n) => shuffle(a).slice(0, n);
export const uniq = a => [...new Set(a)];
export const sleep = ms => new Promise(r => setTimeout(r, ms));
const pad = n => String(n).padStart(2, '0');
export const ymd = (d = new Date()) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
export const addDays = (s, n) => { const d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() + n); return ymd(d); };
export const DAY = 864e5;
export function haptic(t) { try { tg && tg.HapticFeedback && (t === 'light' ? tg.HapticFeedback.impactOccurred('light') : tg.HapticFeedback.notificationOccurred(t)); } catch (e) { } }
export function plural(n, a, b, c) { const x = n % 10, y = n % 100; return x === 1 && y !== 11 ? a : x >= 2 && x <= 4 && (y < 10 || y >= 20) ? b : c; }

/* ---------- данные ---------- */
export async function loadData() {
  const names = ['course', 'vocab', 'kanji', 'kana', 'grammar', 'sentences', 'interview', 'strokes'];
  const got = await Promise.all(names.map(n => fetch('data/' + n + '.json').then(r => r.json())));
  names.forEach((n, i) => D[n] = got[i]);
  D.w = Object.fromEntries(D.vocab.map(w => [w.id, w]));
  D.s = Object.fromEntries(D.sentences.map(s => [s.id, s]));
  D.g = Object.fromEntries(D.grammar.map(g => [g.id, g]));
  D.k = Object.fromEntries(D.kanji.list.map(k => [k.c, k]));
  D.ka = Object.fromEntries(D.kana.list.map(k => [k.h, k]));
  D.lessons = []; D.lessonById = {};
  for (const u of D.course.units) for (const l of u.lessons) { l.unit = u; D.lessons.push(l); D.lessonById[l.id] = l; }
  D.qa = Object.fromEntries(D.interview.qa.map(q => [q.id, q]));
}

/* ---------- прогресс ---------- */
const DEF = () => ({
  v: 1, t: 0, placed: false, done: {}, srs: {}, xp: 0, goal: 30, log: {},
  streak: { n: 0, last: '', freeze: 0, best: 0 }, hearts: { n: 5, t: Date.now() }, ach: {}, errs: [], me: {}, mock: [],
  set: { romaji: true, furi: 'unknown', motion: 'auto', sound: 0.6, haptic: true, remind: '' }
});
export let P = DEF();
const LS = 'jp_progress';
const cloud = !!(tg && tg.CloudStorage && tg.isVersionAtLeast && tg.isVersionAtLeast('6.9'));
const cGet = keys => new Promise(r => tg.CloudStorage.getItems(keys, (e, v) => r(e ? {} : v || {})));
const cSet = (k, v) => new Promise(r => tg.CloudStorage.setItem(k, v, () => r()));

export async function loadProgress() {
  let local = null;
  try { local = JSON.parse(localStorage.getItem(LS) || 'null'); } catch (e) { }
  let remote = null;
  if (cloud) {
    try {
      const m = await cGet(['jp_meta']);
      const meta = m.jp_meta ? JSON.parse(m.jp_meta) : null;
      if (meta && meta.n && (!local || meta.t > (local.t || 0))) {
        const keys = Array.from({ length: meta.n }, (_, i) => 'jp_' + i);
        const parts = await cGet(keys);
        remote = JSON.parse(keys.map(k => parts[k] || '').join(''));
      }
    } catch (e) { remote = null; }
  }
  const src = remote || local;
  if (src) P = Object.assign(DEF(), src, { set: Object.assign(DEF().set, src.set || {}) });
}
let saveTimer = null, cloudTimer = null;
export function save() {
  P.t = Date.now();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { try { localStorage.setItem(LS, JSON.stringify(P)); } catch (e) { } }, 150);
  if (cloud) { clearTimeout(cloudTimer); cloudTimer = setTimeout(pushCloud, 4000); }
}
export async function pushCloud() {
  if (!cloud) return;
  try {
    const s = JSON.stringify(P), n = Math.ceil(s.length / 4000);
    for (let i = 0; i < n; i++) await cSet('jp_' + i, s.slice(i * 4000, (i + 1) * 4000));
    await cSet('jp_meta', JSON.stringify({ n, t: P.t }));
  } catch (e) { }
}
export function exportProgress() { return btoa(unescape(encodeURIComponent(JSON.stringify(P)))); }
export function importProgress(txt) {
  const o = JSON.parse(decodeURIComponent(escape(atob(txt.trim()))));
  if (!o || !o.srs) throw new Error('bad');
  P = Object.assign(DEF(), o); save(); pushCloud();
}
export function resetProgress() { P = DEF(); save(); pushCloud(); }

/* ---------- дневной журнал, XP, серия, сердечки ---------- */
export function today() {
  const d = ymd();
  if (!P.log[d]) {
    P.log[d] = { xp: 0, ok: 0, bad: 0, nw: 0, wrong: [] };
    const keys = Object.keys(P.log).sort(); while (keys.length > 70) delete P.log[keys.shift()];
  }
  return P.log[d];
}
export function addXP(n) {
  const t = today(); const before = t.xp; t.xp += n; P.xp += n;
  const reached = before < P.goal && t.xp >= P.goal;
  if (t.xp > 0) touchStreak();
  save();
  return reached;
}
export function checkStreak() {
  // вызывается при запуске: пропущенные дни съедают заморозку или обнуляют серию
  const s = P.streak, d = ymd();
  if (!s.last || s.last === d) return null;
  const gap = Math.round((new Date(d + 'T12:00:00') - new Date(s.last + 'T12:00:00')) / DAY);
  if (gap <= 1) return null;
  const missed = gap - 1;
  if (s.freeze >= missed) { s.freeze -= missed; s.last = addDays(d, -1); save(); return 'frozen'; }
  const lost = s.n; s.n = 0; save(); return lost ? 'lost' : null;
}
function touchStreak() {
  const s = P.streak, d = ymd();
  if (s.last === d) return;
  s.n = s.last === addDays(d, -1) ? s.n + 1 : 1;
  s.last = d; s.best = Math.max(s.best, s.n);
  if (s.n % 7 === 0 && s.freeze < 2) s.freeze++;
  P._streakEvent = s.n;
}
export function hearts() {
  const h = P.hearts, per = 30 * 60e3;
  if (h.n < 5) { const add = Math.floor((Date.now() - h.t) / per); if (add > 0) { h.n = Math.min(5, h.n + add); h.t += add * per; } }
  if (h.n >= 5) h.t = Date.now();
  return h.n;
}
export function loseHeart() { hearts(); if (P.hearts.n === 5) P.hearts.t = Date.now(); P.hearts.n = Math.max(0, P.hearts.n - 1); save(); return P.hearts.n; }
export function gainHeart() { hearts(); P.hearts.n = Math.min(5, P.hearts.n + 1); save(); }

/* ---------- интервальные повторения (SM-2) ---------- */
// элемент: [ef, интервал в днях, срок (мс), повторов, ошибок, последний показ]
export const srs = key => P.srs[key];
export function srsAdd(key, known) {
  if (P.srs[key]) return;
  P.srs[key] = known ? [2.5, 4, Date.now() + (1 + Math.random() * 3) * DAY, 2, 0, Date.now()] : [2.5, 0, Date.now() + 10 * 60e3, 0, 0, Date.now()];
  save();
}
export function srsGrade(key, q) {
  let it = P.srs[key] || [2.5, 0, 0, 0, 0, 0];
  let [e, i, , n, l] = it;
  if (q < 3) { n = 0; i = 0; l++; e = Math.max(1.3, e - 0.2); it = [e, i, Date.now() + 10 * 60e3, n, l, Date.now()]; }
  else {
    n++; i = n === 1 ? 1 : n === 2 ? 3 : Math.round(i * e);
    e = Math.max(1.3, e + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
    it = [e, i, Date.now() + i * DAY - 3600e3, n, l, Date.now()];
  }
  P.srs[key] = it; save();
}
export const endOfToday = () => { const d = new Date(); d.setHours(23, 59, 59, 999); return +d; };
export function due(prefix) {
  const lim = endOfToday();
  return Object.entries(P.srs).filter(([k, v]) => (!prefix || k.startsWith(prefix)) && v[2] <= lim).sort((a, b) => a[1][2] - b[1][2]).map(([k]) => k);
}
export function level(key) { const it = P.srs[key]; if (!it) return 'new'; if (it[4] >= 2 && it[1] < 21 || it[0] < 2) return 'hard'; return it[1] >= 7 ? 'known' : 'learning'; }
export const learnedKanji = () => new Set(Object.keys(P.srs).filter(k => k.startsWith('k:') && P.srs[k][3] >= 1).map(k => k.slice(2)));

/* ---------- фуригана ---------- */
export function parseFuri(f) {
  const segs = []; const re = /\[([^\]|]+)((?:\|[^\]|]*)+)\]|([^\[]+)/g; let m;
  while ((m = re.exec(f || ''))) segs.push(m[3] ? [m[3], ''] : [m[1], m[2].split('|').slice(1).join('')]);
  return segs;
}
export function furiHTML(f, mode) {
  mode = mode || P.set.furi;
  const known = mode === 'unknown' ? learnedKanji() : null;
  return parseFuri(f).map(([b, r]) => {
    if (!r || mode === 'none') return esc(b);
    if (known && [...b].every(ch => !/[一-鿿]/.test(ch) || known.has(ch))) return esc(b);
    return '<ruby>' + esc(b) + '<rt>' + esc(r) + '</rt></ruby>';
  }).join('');
}
export const furiReading = f => parseFuri(f).map(([b, r]) => r || b).join('');

/* ---------- кана ↔ ромадзи ---------- */
const R2K = {
  a: 'あ', i: 'い', u: 'う', e: 'え', o: 'お',
  ka: 'か', ki: 'き', ku: 'く', ke: 'け', ko: 'こ', ga: 'が', gi: 'ぎ', gu: 'ぐ', ge: 'げ', go: 'ご',
  sa: 'さ', si: 'し', shi: 'し', su: 'す', se: 'せ', so: 'そ', za: 'ざ', zi: 'じ', ji: 'じ', zu: 'ず', ze: 'ぜ', zo: 'ぞ',
  ta: 'た', ti: 'ち', chi: 'ち', tu: 'つ', tsu: 'つ', te: 'て', to: 'と', da: 'だ', di: 'ぢ', du: 'づ', de: 'で', do: 'ど',
  na: 'な', ni: 'に', nu: 'ぬ', ne: 'ね', no: 'の',
  ha: 'は', hi: 'ひ', hu: 'ふ', fu: 'ふ', he: 'へ', ho: 'ほ', ba: 'ば', bi: 'び', bu: 'ぶ', be: 'べ', bo: 'ぼ', pa: 'ぱ', pi: 'ぴ', pu: 'ぷ', pe: 'ぺ', po: 'ぽ',
  ma: 'ま', mi: 'み', mu: 'む', me: 'め', mo: 'も', ya: 'や', yu: 'ゆ', yo: 'よ',
  ra: 'ら', ri: 'り', ru: 'る', re: 'れ', ro: 'ろ', la: 'ら', li: 'り', lu: 'る', le: 'れ', lo: 'ろ',
  wa: 'わ', wi: 'うぃ', we: 'うぇ', wo: 'を', xn: 'ん',
  fa: 'ふぁ', fi: 'ふぃ', fe: 'ふぇ', fo: 'ふぉ', va: 'ゔぁ', vi: 'ゔぃ', vu: 'ゔ', ve: 'ゔぇ', vo: 'ゔぉ',
  she: 'しぇ', je: 'じぇ', che: 'ちぇ', ti_: 'てぃ', thi: 'てぃ', dhi: 'でぃ', tsa: 'つぁ',
  xa: 'ぁ', xi: 'ぃ', xu: 'ぅ', xe: 'ぇ', xo: 'ぉ', xya: 'ゃ', xyu: 'ゅ', xyo: 'ょ', xtu: 'っ', xtsu: 'っ', ltu: 'っ', ltsu: 'っ',
  '-': 'ー', ',': '、', '.': '。', '?': '？', '!': '！', '~': '〜'
};
const YOON = { ky: 'き', gy: 'ぎ', sh: 'し', sy: 'し', j: 'じ', jy: 'じ', zy: 'じ', ch: 'ち', ty: 'ち', cy: 'ち', dy: 'ぢ', ny: 'に', hy: 'ひ', by: 'び', py: 'ぴ', my: 'み', ry: 'り' };
const SMALL = { a: 'ゃ', u: 'ゅ', o: 'ょ' };
for (const [p, k] of Object.entries(YOON)) for (const [v, s] of Object.entries(SMALL)) if (!R2K[p + v]) R2K[p + v] = k + s;
const MAXK = 4;
// Превращает введённую латиницу в кану. Незаконченный хвост (например «k» или «n») остаётся латиницей,
// пока не станет ясно, что это: «kon» → こn, «konni» → こんに, «minna» → みんな. finalize: хвостовое n → ん.
export function toKana(input, kata, finalize) {
  let s = input.toLowerCase(), out = '', i = 0;
  while (i < s.length) {
    const c = s[i];
    if (!/[a-z'\-,.?!~]/.test(c)) { out += c; i++; continue; }
    if (c === 'n') {
      const n1 = s[i + 1], n2 = s[i + 2];
      if (n1 === undefined) { if (finalize) { out += 'ん'; i++; continue; } out += 'n'; break; }
      if (n1 === "'") { out += 'ん'; i += 2; continue; }
      if (n1 === 'n') {
        if (n2 === undefined) { if (finalize) { out += 'ん'; i += 2; continue; } out += 'nn'; break; }
        if (/[aiueoy]/.test(n2)) { out += 'ん'; i += 1; continue; } // konnichi → こん + に
        out += 'ん'; i += 2; continue;
      }
      if (!/[aiueoy]/.test(n1)) { out += 'ん'; i++; continue; } // n перед согласной
    }
    // удвоенная согласная → っ
    if (i + 1 < s.length && c === s[i + 1] && /[bcdfghjklmpqrstvwxyz]/.test(c)) { out += 'っ'; i++; continue; }
    if (c === 't' && s[i + 1] === 'c' && s[i + 2] === 'h') { out += 'っ'; i++; continue; }
    let hit = false;
    for (let L = MAXK; L >= 1; L--) {
      const chunk = s.slice(i, i + L);
      if (R2K[chunk]) { out += R2K[chunk]; i += L; hit = true; break; }
    }
    if (!hit) { out += s.slice(i); break; }
  }
  return kata ? hira2kata(out) : out;
}
export const hira2kata = s => s.replace(/[ぁ-ゖ]/g, ch => String.fromCharCode(ch.charCodeAt(0) + 0x60));
export const kata2hira = s => s.replace(/[ァ-ヶ]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x60));
const K2R = {}; for (const [r, k] of Object.entries(R2K)) if (!K2R[k] && /^[a-z]+$/.test(r) && !/^(si|ti|tu|hu|zi|di|du|la|li|lu|le|lo|xn|nn|sy|ty|cy|zy|jy)/.test(r)) K2R[k] = r;
Object.assign(K2R, { 'し': 'shi', 'ち': 'chi', 'つ': 'tsu', 'ふ': 'fu', 'じ': 'ji', 'ぢ': 'ji', 'づ': 'zu', 'を': 'o', 'ん': 'n', 'しゃ': 'sha', 'しゅ': 'shu', 'しょ': 'sho', 'ちゃ': 'cha', 'ちゅ': 'chu', 'ちょ': 'cho', 'じゃ': 'ja', 'じゅ': 'ju', 'じょ': 'jo', 'ー': '-' });
export function toRomaji(kana) {
  let s = kata2hira(kana), out = '';
  for (let i = 0; i < s.length; i++) {
    const two = s.slice(i, i + 2);
    if (K2R[two] && /[ゃゅょぁぃぅぇぉ]/.test(s[i + 1] || '')) { out += K2R[two]; i++; continue; }
    if (s[i] === 'っ') { const nx = K2R[s.slice(i + 1, i + 3)] || K2R[s[i + 1]] || ''; out += nx.startsWith('ch') ? 't' : nx[0] || ''; continue; }
    if (s[i] === 'ー') { out += out.slice(-1); continue; }
    if (s[i] === 'は' && /^(は)$/.test(s[i]) && (i === s.length - 1 || s[i + 1] === ' ')) { out += 'wa'; continue; }
    out += K2R[s[i]] != null ? K2R[s[i]] : s[i];
  }
  return out;
}
// Сравнение ответа. Возвращает {ok, near, hint}
export function compareKana(given, want) {
  const clean = x => kata2hira(x).replace(/[。、？！?!.,\s　「」]/g, '').replace(/〜/g, '');
  const g = clean(given), w = clean(want);
  if (g === w) return { ok: true };
  const soft = x => x.replace(/は/g, 'わ').replace(/へ/g, 'え').replace(/を/g, 'お').replace(/づ/g, 'ず').replace(/ぢ/g, 'じ');
  if (soft(g) === soft(w)) return { ok: true, near: true, hint: 'Почти: частицы пишутся は, へ, を, а читаются «ва», «э», «о».' };
  if (/ー/.test(w) && toRomaji(g) === toRomaji(w)) return { ok: true, near: true, hint: 'Почти: в катакане долгий звук пишется чертой ー (на клавиатуре — дефис).' };
  // первое различие
  let i = 0; while (i < g.length && g[i] === w[i]) i++;
  return { ok: false, at: i, g, w };
}

/* ---------- аудио ---------- */
const WM = 'https://upload.wikimedia.org/wikipedia/commons/transcoded/';
export function audioOf(x) {
  // x: {s: id фразы} | {w: id слова} | {kana: 'あ'} | {text: '...'}
  if (x.s && D.s[x.s]) { const s = D.s[x.s]; return { src: 'audio/s/' + s.id + '.mp3', real: true, credit: 'Tatoeba · ' + s.sp + ' · ' + s.lic, link: 'https://tatoeba.org/ru/sentences/show/' + s.id, text: s.jp }; }
  if (x.w && D.w[x.w]) {
    const w = D.w[x.w];
    if (w.a) return { src: WM + w.a[0] + '/' + w.a[0].split('/').pop() + '.mp3', real: true, credit: 'Lingua Libre · ' + w.a[1] + ' · ' + w.a[2], link: 'https://commons.wikimedia.org/wiki/File:' + decodeURIComponent(w.a[0].split('/').pop()), text: w.r };
    if (w.s && D.s[w.s] && D.s[w.s].jp.replace(/[。！？]/g, '') === w.k) return audioOf({ s: w.s });
    return { tts: w.r.replace(/〜/g, ''), real: false, credit: 'синтезированный голос', text: w.r };
  }
  if (x.kana) {
    const h = kata2hira(x.kana), a = D.kana.audio[h];
    if (a) return { src: WM + a[0] + '/' + a[0].split('/').pop() + '.mp3', real: true, credit: 'Lingua Libre · ' + a[1] + ' · ' + a[2], text: h };
    return { tts: h, real: false, credit: 'синтезированный голос', text: h };
  }
  return { tts: x.text, real: false, credit: 'синтезированный голос', text: x.text };
}
let jaVoice = null, ttsReady = false;
function initTTS() {
  if (!('speechSynthesis' in window)) return;
  const pickV = () => { const v = speechSynthesis.getVoices(); jaVoice = v.find(x => /ja[-_]JP/i.test(x.lang)) || v.find(x => /^ja/i.test(x.lang)) || null; ttsReady = true; };
  pickV(); speechSynthesis.onvoiceschanged = pickV;
}
initTTS();
export const ttsAvailable = () => !!jaVoice;
let cur = null;
export const audioEvents = new EventTarget();
export function stopAudio() { if (cur) { try { cur.pause(); } catch (e) { } cur = null; } try { speechSynthesis.cancel(); } catch (e) { } }
export function play(a, rate = 1) {
  stopAudio();
  return new Promise(res => {
    const done = ok => { audioEvents.dispatchEvent(new CustomEvent('end')); res(ok); };
    audioEvents.dispatchEvent(new CustomEvent('start'));
    if (a.src) {
      const el = new Audio(a.src); cur = el;
      el.playbackRate = rate; el.preservesPitch = true; el.volume = 1;
      el.onended = () => done(true);
      el.onerror = () => { if (a.text && jaVoice) speak(a.text, rate).then(done); else done(false); };
      el.play().catch(() => done(false));
    } else if (a.tts && jaVoice) speak(a.tts, rate).then(done);
    else done(false);
  });
}
function speak(text, rate) {
  return new Promise(res => {
    try {
      const u = new SpeechSynthesisUtterance(text); u.lang = 'ja-JP'; if (jaVoice) u.voice = jaVoice; u.rate = 0.9 * rate;
      u.onend = () => res(true); u.onerror = () => res(false); speechSynthesis.speak(u);
    } catch (e) { res(false); }
  });
}
export const canRecord = () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);

/* ---------- части речи и формы глаголов ---------- */
export const POS = { n: 'сущ.', pn: 'местоим.', q: 'вопрос', v5: 'глагол I гр.', v1: 'глагол II гр.', vk: 'глагол 来る', vs: 'сущ. + する', vsi: 'глагол する', ai: 'い-прил.', an: 'な-прил.', adv: 'наречие', exp: 'выражение', ctr: 'суффикс', num: 'число' };
const GODAN = { う: ['い', 'わ', 'って'], く: ['き', 'か', 'いて'], ぐ: ['ぎ', 'が', 'いで'], す: ['し', 'さ', 'して'], つ: ['ち', 'た', 'って'], ぬ: ['に', 'な', 'んで'], ぶ: ['び', 'ば', 'んで'], む: ['み', 'ま', 'んで'], る: ['り', 'ら', 'って'] };
// формы глагола по написанию: {masu, nai, te}
export function verbForms(w) {
  const k = w.k, last = k.slice(-1), stem = k.slice(0, -1);
  if (w.p === 'v1') return { masu: stem + 'ます', nai: stem + 'ない', te: stem + 'て' };
  if (w.p === 'vk') return { masu: '来ます', nai: '来ない', te: '来て' };
  if (w.p === 'vsi') return { masu: 'します', nai: 'しない', te: 'して' };
  if (w.p === 'v5' && GODAN[last]) {
    const [i, a, te] = GODAN[last];
    if (k === '行く') return { masu: '行きます', nai: '行かない', te: '行って' };
    if (k === 'ある') return { masu: 'あります', nai: 'ない', te: 'あって' };
    return { masu: stem + i + 'ます', nai: stem + a + 'ない', te: stem + te };
  }
  return null;
}
