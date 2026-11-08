// Генерация упражнений: уроки, повторения, тесты
import { D, P, esc, shuffle, sample, pick, uniq, furiHTML, audioOf, kata2hira, hira2kata, toRomaji, srs, srsAdd, due, level, save } from './core.js';
import { fillTpl } from './ex.js';

const W = id => D.w[id];

/* ---------- что ученик уже знает ---------- */
// Кана и слова считаются известными, как только попали в повторение; кандзи — после первого верного ответа.
export function learner() {
  const keys = Object.keys(P.srs);
  const hira = new Set(keys.filter(k => k.startsWith('h:')).map(k => k.slice(2)));
  const kata = new Set(keys.filter(k => k.startsWith('t:')).map(k => hira2kata(k.slice(2))));
  const kanji = new Set(keys.filter(k => k.startsWith('k:') && P.srs[k][3] >= 1).map(k => k.slice(2)));
  const words = new Set(keys.filter(k => k.startsWith('w:')).map(k => k.slice(2)));
  const hUnit = D.course.units.find(u => u.id === 'h');
  const kanaStage = !hUnit.lessons.every(l => P.done[l.id]);
  return { hira, kata, kanji, words, kanaStage };
}
// слово можно прочитать только известной каной (для этапа каны)
const SMALL = 'ゃゅょっャュョッー';
export function readableKana(w, L, extra) {
  const r = w.r.replace(/〜/g, '');
  if (!r || w.p === 'exp' || w.p === 'ctr' || r.length < 2 || r.length > 6) return false;
  return [...r].every(ch => SMALL.includes(ch) ? true : (L.hira.has(ch) || L.kata.has(ch) || (extra && extra.has(ch))));
}
export function kanaWordMC(w) {
  const ds = distract(w, 3, 'ru');
  return { type: 'mc', key: 'w:' + w.id, title: 'Прочитайте слово', prompt: '<span class="jp big">' + esc(w.r.replace(/〜/g, '')) + '</span>', opts: shuffle([w, ...ds]).map(x => ({ ok: x.id === w.id, html: esc(x.ru) })), after: audioOf({ w: w.id }) };
}
// фраза подходит, если почти все её слова уже изучены (или изучаются сейчас)
function knownShare(s, L, extra) { if (!s.w.length) return 0; return s.w.filter(id => L.words.has(id) || (extra && extra.has(id))).length / s.w.length; }
// повторение старого: сначала то, что пора повторить, потом давно не встречавшееся, включая самые первые слова
export function oldWordReview(n, exclude = new Set()) {
  const L = learner(), now = Date.now();
  const ids = [...L.words].filter(id => W(id) && !exclude.has(id) && !W(id).k.includes('〜'));
  if (!ids.length) return [];
  const dueIds = ids.filter(id => P.srs['w:' + id][2] <= now);
  const oldest = ids.slice().sort((a, b) => P.srs['w:' + a][5] - P.srs['w:' + b][5]);
  const early = ids.filter(id => W(id).u <= 2);
  const pickIds = uniq([...shuffle(dueIds).slice(0, Math.ceil(n / 2)), ...(early.length ? [pick(early)] : []), ...oldest]).slice(0, n);
  return pickIds.map((id, i) => { const w = W(id); return [wordMC(w, 'au'), wordMC(w, 'rj'), wordType(w), wordMC(w, 'jr')][i % 4]; }).filter(x => !(x.type === 'type' && W(x.key.slice(2)).r.length > 7));
}
// выученные кандзи «в деле»: чтение слова с этим знаком или живая фраза с ним
export function kanjiInUse(n) {
  const L = learner(); if (!L.kanji.size) return [];
  const out = [];
  for (const c of shuffle([...L.kanji]).slice(0, n)) {
    const w = (D.k[c].w || []).map(W).find(x => x && x.k.length > 1 && L.words.has(x.id)) || (D.k[c].w || []).map(W).find(x => x && x.k.length > 1);
    const s = D.sentences.find(s => s.kj && s.kj.includes(c) && goodS(s) && knownShare(s, L) >= 0.6 && s.jp.length <= 16);
    if (s && Math.random() < 0.5) out.push(sListen(s)); else if (w) out.push(kanjiReading(c, w));
  }
  return out;
}
const isKataWord = w => /[゠-ヿ]/.test(w.r);
const wHTML = w => '<span class="jp big">' + (w.f ? furiHTML(w.f) : esc(w.k)) + '</span>';
const cleanR = r => r.replace(/〜/g, '');

/* ---------- слова ---------- */
function distract(w, n = 3, field = 'ru') {
  const same = D.vocab.filter(x => x.id !== w.id && x[field] !== w[field] && !x.k.includes('〜'));
  const pref = same.filter(x => x.u === w.u && x.p === w.p);
  const pool = uniq(shuffle(pref).concat(shuffle(same.filter(x => x.p === w.p)), shuffle(same)));
  const out = [], seen = new Set([w[field]]);
  for (const x of pool) { if (!seen.has(x[field])) { seen.add(x[field]); out.push(x); } if (out.length >= n) break; }
  return out;
}
export function wordMC(w, dir) {
  dir = dir || pick(['jr', 'rj', 'au']);
  const ds = distract(w, 3, dir === 'rj' ? 'k' : 'ru');
  const opts = shuffle([w, ...ds]).map(x => ({ ok: x.id === w.id, html: dir === 'rj' ? '<span class="jp">' + (x.f ? furiHTML(x.f) : esc(x.k)) + '</span>' : esc(x.ru) }));
  if (dir === 'jr') return { type: 'mc', key: 'w:' + w.id, title: 'Выбери правильный перевод', prompt: wHTML(w), opts, after: audioOf({ w: w.id }) };
  if (dir === 'rj') return { type: 'mc', key: 'w:' + w.id, title: 'Как сказать по-японски?', prompt: '<div class="ru-prompt">' + esc(w.ru) + '</div>', opts, after: audioOf({ w: w.id }) };
  return { type: 'mc', key: 'w:' + w.id, title: 'Послушайте и выберите перевод', audio: audioOf({ w: w.id }), opts };
}
export function wordType(w) {
  const kata = isKataWord(w) && !/[぀-ゟ]/.test(w.r);
  return { type: 'type', key: 'w:' + w.id, kata, prompt: '<div class="ru-prompt">' + esc(w.ru) + '</div>', want: cleanR(w.r), show: w.f ? furiHTML(w.f, 'all') : esc(w.k), audio: audioOf({ w: w.id }) };
}
export function wordListenType(w) { const t = wordType(w); t.prompt = 'Напишите услышанное слово'; t.autoplay = true; t.show = (w.f ? furiHTML(w.f, 'all') : esc(w.k)) + ' — ' + esc(w.ru); return t; }

/* ---------- фразы ---------- */
const goodS = s => s.lv >= 0.75 && s.bk === 0;
function sentencesFor(wids, n, maxLen = 20) {
  const set = new Set(wids), L = learner();
  const cand = D.sentences.filter(s => goodS(s) && s.jp.length <= maxLen && s.w.some(x => set.has(x)));
  // сначала фразы из уже знакомых слов; с выученными кандзи — в приоритете
  const score = s => knownShare(s, L, set) * 2 + (s.kj && [...s.kj].some(c => L.kanji.has(c)) ? 0.5 : 0) + Math.random() * 0.3;
  return cand.filter(s => knownShare(s, L, set) >= 0.6).sort((a, b) => score(b) - score(a)).slice(0, n);
}
export function sBuild(s, listen) { return { type: 'build', key: null, ru: s.ru, blocks: s.ch, bf: s.cf, audio: audioOf({ s: s.id }), listen }; }
export function sListen(s, pool) {
  const others = sample((pool || D.sentences).filter(x => x.id !== s.id && Math.abs(x.jp.length - s.jp.length) <= 6 && x.ru !== s.ru), 3);
  return { type: 'mc', title: 'Послушайте и выберите перевод', audio: audioOf({ s: s.id }), opts: shuffle([s, ...others]).map(x => ({ ok: x.id === s.id, html: esc(x.ru) })), after: null, why: '<div class="jp">' + furiHTML(s.f, 'all') + '</div>' };
}
export function sListenJP(s) {
  const others = sample(D.sentences.filter(x => x.id !== s.id && goodS(x) && Math.abs(x.jp.length - s.jp.length) <= 4), 3);
  return { type: 'mc', title: 'Что прозвучало?', audio: audioOf({ s: s.id }), opts: shuffle([s, ...others]).map(x => ({ ok: x.id === s.id, html: '<span class="jp">' + furiHTML(x.f) + '</span>' })), why: esc(s.ru) };
}
export function sDictation(s) {
  const want = kata2hira(furiHTMLReading(s.f)).replace(/[。、？！?!]/g, '');
  return { type: 'type', kata: false, prompt: 'Диктант: напишите хираганой то, что услышали', audio: audioOf({ s: s.id }), autoplay: true, want, show: furiHTML(s.f, 'all') + ' — ' + esc(s.ru) };
}
function furiHTMLReading(f) { return f.replace(/\[([^\]|]+)((?:\|[^\]|]*)+)\]/g, (m, b, r) => r.split('|').join('')); }
export function sSpeak(s) { return { type: 'speak', audio: audioOf({ s: s.id }), html: furiHTML(s.f, 'all'), ru: s.ru }; }

/* ---------- грамматика ---------- */
export function grammarQs(g) {
  return g.q.map((q, i) => {
    const base = { key: 'g:' + g.id, errKey: g.id + ':' + i };
    if (q.t === 'p') return { ...base, type: 'particle', s: q.s, sf: q.sf, opts: shuffle(q.o), a: q.a, why: q.why };
    if (q.t === 'f') return { ...base, type: 'fix', b: q.b, e: q.e, o: shuffle(q.o), a: q.a, why: q.why };
    return { ...base, type: 'build', ru: q.ru, blocks: q.b, bf: q.bf, audio: audioOf({ text: q.b.join('') }), why: '' };
  });
}
export const gCard = id => ({ type: 'gcard', g: id });

/* ---------- кандзи ---------- */
export function kanjiSet(c, full = true) {
  const k = D.k[c], out = [];
  if (full) out.push({ type: 'kcard', c, onNext: () => srsAdd('k:' + c) });
  out.push({ type: 'write', ch: c, mode: full ? 'trace' : 'memory', key: 'k:' + c, prompt: '<span class="ru-prompt">' + esc(k.ru) + '</span>' });
  out.push(kanjiMeaning(c));
  const w = k.w.map(W).find(x => x && x.k.length > 1);
  if (w) out.push(kanjiReading(c, w));
  return out;
}
export function kanjiMeaning(c) {
  const k = D.k[c], ds = sample(D.kanji.list.filter(x => x.c !== c && x.ru !== k.ru), 3);
  return { type: 'mc', key: 'k:' + c, title: 'Что значит этот знак?', prompt: '<span class="jp huge">' + c + '</span>', opts: shuffle([k, ...ds]).map(x => ({ ok: x.c === c, html: esc(x.ru) })), grid: true };
}
export function kanjiReading(c, w) {
  const ds = sample(D.vocab.filter(x => x.id !== w.id && x.r !== w.r && x.r.length >= w.r.length - 1 && x.r.length <= w.r.length + 2 && !x.k.includes('〜')), 3);
  return { type: 'mc', key: 'k:' + c, title: 'Как читается слово?', prompt: '<span class="jp big">' + esc(w.k) + '</span><div class="hint">' + esc(w.ru) + '</div>', opts: shuffle([w, ...ds]).map(x => ({ ok: x.id === w.id, html: '<span class="jp">' + esc(x.r) + '</span>' })), after: audioOf({ w: w.id }), grid: true };
}
export function kanjiSimilar(group) {
  const c = pick(group), k = D.k[c];
  if (!k) return null;
  return { type: 'mc', key: 'k:' + c, title: 'Похожие знаки: найдите «' + k.ru + '»', prompt: '', opts: shuffle(group).map(x => ({ ok: x === c, html: '<span class="jp huge">' + x + '</span>' })), grid: true, why: group.map(x => x + ' — ' + (D.k[x] ? D.k[x].ru : '')).join(', ') };
}

/* ---------- кана ---------- */
const KEYK = ch => (/[゠-ヿ]/.test(ch) ? 't:' : 'h:') + kata2hira(ch);
export const kanaChar = (k, script) => script === 'k' ? k.kt : k.h;
export function kanaToRo(ch, pool) {
  const k = D.ka[kata2hira(ch)], ds = sample(pool.filter(x => x.ro !== k.ro), 3);
  return { type: 'mc', key: KEYK(ch), title: 'Как читается знак?', prompt: '<span class="jp huge">' + ch + '</span>', opts: shuffle([k, ...ds]).map(x => ({ ok: x.ro === k.ro, html: esc(x.ro) })), grid: true, after: audioOf({ kana: ch }) };
}
export function roToKana(ch, pool, script) {
  const k = D.ka[kata2hira(ch)], ds = sample(pool.filter(x => x.ro !== k.ro), 3);
  return { type: 'mc', key: KEYK(ch), title: 'Найдите знак «' + k.ro + '»', prompt: '', opts: shuffle([k, ...ds]).map(x => ({ ok: x.ro === k.ro, html: '<span class="jp huge">' + kanaChar(x, script) + '</span>' })), grid: true, after: audioOf({ kana: ch }) };
}
export function listenKana(ch, pool, script) {
  const k = D.ka[kata2hira(ch)], ds = sample(pool.filter(x => x.ro !== k.ro), 3);
  return { type: 'mc', key: KEYK(ch), title: 'Послушайте и выберите знак', audio: audioOf({ kana: ch }), opts: shuffle([k, ...ds]).map(x => ({ ok: x.ro === k.ro, html: '<span class="jp huge">' + kanaChar(x, script) + '</span>' })), grid: true };
}
export function kanaSimilar(group) {
  const c = pick(group), k = D.ka[kata2hira(c)];
  return { type: 'mc', key: KEYK(c), title: 'Похожие знаки: где «' + (k ? k.ro : '') + '»?', audio: audioOf({ kana: c }), opts: shuffle(group).map(x => ({ ok: x === c, html: '<span class="jp huge">' + x + '</span>' })), grid: true, why: group.map(x => x + ' — ' + ((D.ka[kata2hira(x)] || {}).ro || '')).join(', ') };
}
function kanaPool(lesson) {
  const L = D.kana.list.filter(k => lesson.g === 'd' ? k.g === 'd' : lesson.g === 'y' ? k.g === 'y' : k.g === 'b' && lesson.rows.includes(k.row));
  return L;
}
export function kanaLesson(lesson) {
  const script = lesson.script, chars = kanaPool(lesson), all = D.kana.list.filter(k => k.g === (lesson.g || 'b'));
  const out = [];
  // урок рассчитан на 10–15 минут: одна проверка на группу из трёх знаков, письмо не больше 5 знаков
  chars.forEach((k, i) => {
    const ch = kanaChar(k, script);
    out.push({ type: 'kana', ch, onNext: () => srsAdd(KEYK(ch)) });
    if (i % 3 === 2 || i === chars.length - 1) out.push(kanaToRo(kanaChar(pick(chars.slice(Math.max(0, i - 2), i + 1)), script), all));
  });
  if (lesson.g !== 'y') sample(chars.filter(k => D.strokes[kanaChar(k, script)]), 5).forEach(k => out.push({ type: 'write', ch: kanaChar(k, script), mode: 'trace', key: KEYK(kanaChar(k, script)), prompt: k.ro }));
  shuffle(chars).slice(0, 3).forEach(k => out.push(listenKana(kanaChar(k, script), all, script)));
  shuffle(chars).slice(0, 3).forEach(k => out.push(roToKana(kanaChar(k, script), all, script)));
  // настоящие слова только из уже известных знаков (плюс знаки этого урока)
  const L = learner(), extra = new Set(chars.map(k => kanaChar(k, script)));
  const isKataScript = script === 'k';
  const words = D.vocab.filter(w => readableKana(w, L, extra) && (isKataScript ? /[゠-ヿ]/.test(w.r) : !/[゠-ヿ]/.test(w.r)) && [...w.r].some(ch => extra.has(ch)));
  const ws = sample(words, 3);
  ws.forEach((w, i) => out.push(i < 2 ? kanaWordMC(w) : { ...wordListenType(w), show: esc(w.r) + ' — ' + esc(w.ru) }));
  return out;
}
export function kanaExtraLesson(script) {
  const K = script === 'k';
  const conv = s => K ? hira2kata(s) : s;
  const pairs = K ? [['ベッド', 'ベド'], ['コーヒー', 'コヒ'], ['ケーキ', 'ケキ'], ['サッカー', 'サカー'], ['スーパー', 'スパー']] : [['きって', 'きて'], ['おばあさん', 'おばさん'], ['がっこう', 'がこう'], ['ちょっと', 'ちょと'], ['おかあさん', 'おかさん'], ['ゆうめい', 'ゆめい']];
  const words = pairs.map(p => D.vocab.find(w => w.r === p[0])).filter(Boolean);
  const out = [{ type: 'info', title: K ? 'Катакана: ッ и ー' : 'Хирагана: っ и долгие гласные', html: K ?
    '<p>Маленькая <b class="jp">ッ</b> удваивает следующую согласную: <span class="jp">ベッド</span> (беддо).</p><p>В катакане долгий звук пишется чертой <b class="jp">ー</b>: <span class="jp">コーヒー</span> (ко̄хӣ), <span class="jp">ケーキ</span>. На вертикальном письме черта тоже вертикальная.</p>' :
    '<p>Маленькая <b class="jp">っ</b> — это пауза-удвоение следующей согласной: <span class="jp">きって</span> (киттэ, «марка»), <span class="jp">がっこう</span> (гакко̄, «школа»).</p><p>Долгие гласные в хирагане пишутся добавлением гласной: <span class="jp">おかあさん</span>, <span class="jp">おにいさん</span>, <span class="jp">くうき</span>. Долгое «о» почти всегда пишется через <b class="jp">う</b>: <span class="jp">がっこう</span>, <span class="jp">ゆうめい</span>; долгое «э» — через <b class="jp">い</b>: <span class="jp">せんせい</span>.</p><p>Долгота меняет смысл: <span class="jp">おばさん</span> «тётя» и <span class="jp">おばあさん</span> «бабушка».</p>' }];
  words.forEach(w => { out.push(wordListenType(w)); });
  pairs.forEach(([a, b]) => out.push({ type: 'mc', title: 'Как пишется правильно?', prompt: '', audio: D.vocab.find(w => w.r === a) ? audioOf({ w: D.vocab.find(w => w.r === a).id }) : audioOf({ text: a }), opts: shuffle([{ ok: true, html: '<span class="jp big">' + a + '</span>' }, { ok: false, html: '<span class="jp big">' + b + '</span>' }]), grid: true }));
  return out;
}

/* ---------- урок пути ---------- */
export function lessonExercises(lesson) {
  if (lesson.kind === 'kana') return kanaLesson(lesson);
  if (lesson.kind === 'kana-x') return kanaExtraLesson(lesson.script);
  if (lesson.kind === 'kanji-basics') return kanjiBasics();
  if (lesson.kind === 'test') return unitTest(+lesson.unit.id.slice(1));
  if (lesson.kind.startsWith('x-')) return advanced(lesson.kind);
  const ws = lesson.w.map(W).filter(Boolean), out = [];
  const first = ws.slice(0, 4), second = ws.slice(4);
  // разминка: закрепляем уже пройденные слова (включая самые первые) и выученные кандзи
  const warm = [...oldWordReview(3, new Set(lesson.w)), ...kanjiInUse(1)];
  if (warm.length) { out.push({ type: 'info', title: 'Разминка', html: '<p>Сначала вспомним то, что уже проходили.</p>' }); out.push(...warm); }
  first.forEach(w => out.push({ type: 'wcard', w: w.id }));
  sample(first, 3).forEach((w, i) => out.push(wordMC(w, ['jr', 'au', 'rj'][i])));
  if (lesson.g[0]) { out.push(gCard(lesson.g[0])); grammarQs(D.g[lesson.g[0]]).forEach(q => out.push(q)); }
  second.forEach(w => out.push({ type: 'wcard', w: w.id }));
  sample(second, 3).forEach((w, i) => out.push(wordMC(w, ['rj', 'jr', 'au'][i])));
  (lesson.k || []).filter(c => !srs('k:' + c)).slice(0, 2).forEach(c => kanjiSet(c).slice(0, 2).forEach(x => out.push(x)));
  sample(ws.filter(w => !w.k.includes('〜') && w.p !== 'exp' && w.r.length <= 6), 2).forEach(w => out.push(wordType(w)));
  sentencesFor(lesson.w, 2).forEach((s, i) => out.push(i ? sListen(s) : sBuild(s)));
  // в конце ещё пара старых слов вперемешку с новыми
  out.push(...oldWordReview(2, new Set(lesson.w)));
  return out;
}

/* ---------- урок на сегодня ---------- */
export function nextLesson() {
  // по порядку: сначала кана (если не пройдена), параллельно этап 0; далее этапы 2 и 3
  const order = D.lessons.filter(l => l.unit.st >= 1);
  return order.find(l => !P.done[l.id]) || null;
}
export function nextInterview() { return D.lessons.filter(l => l.unit.st === 0).find(l => !P.done[l.id]) || null; }
export function reviewMix(n = 8) {
  let keys = shuffle(due().slice(0, 40)).slice(0, n);
  // если к повторению мало, добавляем то, что давно не встречалось (в том числе самые первые слова и знаки)
  if (keys.length < n) {
    const old = Object.keys(P.srs).filter(k => !keys.includes(k)).sort((a, b) => P.srs[a][5] - P.srs[b][5]).slice(0, (n - keys.length) * 2);
    keys = keys.concat(shuffle(old).slice(0, n - keys.length));
  }
  const out = [];
  for (const key of keys) { const x = fromKey(key); if (x) out.push(x); }
  return out;
}
export function newKanjiToday(n = 3) {
  // 3–5 новых знаков в день: по порядку юнитов, только для уже открытых юнитов
  const openUnits = new Set(D.lessons.filter(l => P.done[l.id] && l.unit.st === 2).map(l => +l.unit.id.slice(1)));
  const maxU = Math.max(1, ...openUnits) + 1;
  return D.kanji.list.filter(k => k.u <= maxU && !srs('k:' + k.c)).slice(0, n).map(k => k.c);
}
export function fromKey(key) {
  const [t, id] = [key.slice(0, 1), key.slice(2)];
  if (t === 'w' && W(id)) { const w = W(id), lv = level(key); return lv === 'learning' || lv === 'hard' ? pick([wordMC(w, 'au'), wordMC(w, 'rj'), wordType(w)]) : pick([wordMC(w), { type: 'wcard', w: id, review: true, key }]); }
  if (t === 'k' && D.k[id]) return pick([kanjiMeaning(id), { type: 'write', ch: id, mode: 'memory', key, prompt: '<span class="ru-prompt">' + esc(D.k[id].ru) + '</span>' }]);
  if (t === 'h' || t === 't') { const ch = t === 't' ? hira2kata(id) : id; const pool = D.kana.list.filter(k => k.g === (D.ka[id] || {}).g); return pick([kanaToRo(ch, pool), listenKana(ch, pool, t === 't' ? 'k' : 'h')]); }
  if (t === 'g' && D.g[id]) return pick(grammarQs(D.g[id]));
  return null;
}
export function todayPlan() {
  const lesson = nextLesson(), L = learner();
  // урок на 10–15 минут: у урока N5 своя разминка, поэтому отдельное повторение не добавляем;
  // на этапе каны — короткое повторение знаков
  const rev = reviewMix(lesson && lesson.kind === 'lesson' ? 0 : L.kanaStage ? 3 : 6);
  const kj = newKanjiToday(2).filter(c => !(lesson && (lesson.k || []).includes(c)));
  return { rev, lesson, kanji: kj };
}
export function todayExercises() {
  const plan = todayPlan(), out = [];
  if (plan.rev.length) { out.push({ type: 'info', title: 'Разминка', html: '<p>Сначала повторим то, что пора освежить: ' + plan.rev.length + ' ' + (plan.rev.length < 5 ? 'задания' : 'заданий') + '.</p>' }); out.push(...plan.rev); }
  if (plan.lesson) { out.push({ type: 'info', title: 'Новое', html: '<p>' + esc(plan.lesson.unit.t) + ': ' + esc(plan.lesson.t) + '</p>' }); out.push(...lessonExercises(plan.lesson)); }
  // новые кандзи дня: карточка и письмо
  plan.kanji.forEach(c => out.push(...kanjiSet(c).slice(0, 2)));
  // мини-проверка только если урока нет (в уроке уже есть свои проверки)
  if (!plan.lesson) {
    const L = learner();
    const fresh = L.kanaStage ? sample(D.vocab.filter(w => readableKana(w, L) && !/[゠-ヿ]/.test(w.r)), 2).map(w => kanaWordMC(w))
      : oldWordReview(2);
    fresh.forEach(x => out.push({ ...x, noRetry: true }));
  }
  return { list: out, lesson: plan.lesson, kanji: plan.kanji };
}

/* ---------- проверка юнита ---------- */
export function unitTest(u) {
  const ws = D.vocab.filter(w => w.u === u && !w.k.includes('〜'));
  const gs = D.grammar.filter(g => g.u === u);
  const out = [];
  sample(ws, 5).forEach((w, i) => out.push(i % 2 ? wordMC(w, 'au') : wordMC(w, 'rj')));
  sample(ws.filter(w => w.r.length <= 6 && w.p !== 'exp'), 2).forEach(w => out.push(wordType(w)));
  gs.forEach(g => out.push(pick(grammarQs(g))));
  D.kanji.list.filter(k => k.u === u).slice(0, 2).forEach(k => out.push(kanjiMeaning(k.c)));
  sentencesFor(ws.map(w => w.id), 2).forEach(s => out.push(sListen(s)));
  return shuffle(out).map(x => ({ ...x, noRetry: true }));
}

/* ---------- сложные уровни ---------- */
export function advanced(kind) {
  const pool = D.sentences.filter(s => s.lv >= 0.6);
  if (kind === 'x-build') return sample(pool.filter(s => s.ch.length >= 4 && s.ch.length <= 8), 8).map(s => sBuild(s, true));
  if (kind === 'x-listen') return sample(pool.filter(s => s.jp.length >= 10), 8).map(s => sListen(s, pool));
  if (kind === 'x-read') return sample(pool.filter(s => s.jp.length >= 8 && s.jp.length <= 24), 8).map(s => {
    const others = sample(pool.filter(x => x.id !== s.id), 3);
    return { type: 'mc', title: 'Прочитайте без подсказок', prompt: '<span class="jp sent">' + furiHTML(s.f, 'none') + '</span>', opts: shuffle([s, ...others]).map(x => ({ ok: x.id === s.id, html: esc(x.ru) })), after: audioOf({ s: s.id }), why: '<span class="jp">' + furiHTML(s.f, 'all') + '</span>' };
  });
  return sample(D.sentences.filter(s => goodS(s) && s.jp.length <= 12), 6).map(s => ({ type: 'type', prompt: '<div class="ru-prompt">' + esc(s.ru) + '</div>', want: kata2hira(furiHTMLReading(s.f)).replace(/[。、？！?!]/g, ''), show: furiHTML(s.f, 'all'), audio: audioOf({ s: s.id }) }));
}

/* ---------- теория письма кандзи (по руководству) ---------- */
export function kanjiBasics() {
  const card = (title, html) => ({ type: 'info', title, html });
  return [
    card('Зачем учить кандзи', '<p>Японский текст состоит из трёх письменностей. Кандзи несут смысл слов, хирагана показывает грамматику, катакана пишет заимствования.</p><ul><li><b>Нет пробелов.</b> Сравните: <span class="jp">わたしはにほんごをべんきょうしています</span> и <span class="jp">私は日本語を勉強しています</span>.</li><li><b>Омонимы.</b> <span class="jp">はし</span> — мост (<span class="jp">橋</span>) или палочки (<span class="jp">箸</span>).</li><li><b>Всё вокруг</b>: вывески, меню, расписания.</li><li><b>JLPT N5</b>: около 100 знаков. Здесь их 103.</li></ul><p>Учим по 3–5 знаков в день, вместе со словами.</p>'),
    card('Из чего состоит знак', '<p><b>Черта</b> — одно движение кисти. <b>Ключ</b> (部首) часто подсказывает смысл: <span class="jp">氵</span> «вода» в <span class="jp">海 泳 洗</span>, <span class="jp">木</span> «дерево» в <span class="jp">林 森 校</span>. <b>Компоненты</b> — части знака: <span class="jp">休</span> = <span class="jp">亻</span> (человек) + <span class="jp">木</span> (дерево): человек отдыхает у дерева.</p><div class="anim-row"><div class="mini-anim" data-anim="休"></div></div>'),
    card('Виды черт', '<table class="kt"><tr><td>Ёко (горизонталь)</td><td>слева направо: <span class="jp">一</span></td></tr><tr><td>Татэ (вертикаль)</td><td>сверху вниз</td></tr><tr><td><b>Томэ</b></td><td>чёткая остановка: <span class="jp">十</span></td></tr><tr><td><b>Хане</b></td><td>крючок в конце: <span class="jp">小 水</span></td></tr><tr><td><b>Харай</b></td><td>росчерк, сужается: <span class="jp">人 大</span></td></tr><tr><td>Оре</td><td>излом: <span class="jp">口 日</span></td></tr><tr><td>Тэн</td><td>точка: <span class="jp">小</span></td></tr></table><p class="hint">В проверке письма приложение рисует харай с сужением, а томэ с чёткой остановкой.</p><div class="anim-row"><div class="mini-anim" data-anim="小"></div><div class="mini-anim" data-anim="人"></div></div>'),
    card('Правила 1–3', '<p><b>1. Сверху вниз:</b> <span class="jp">三</span>. <b>2. Слева направо:</b> <span class="jp">川</span>. <b>3. Горизонталь перед вертикалью,</b> если они пересекаются: <span class="jp">十</span>, <span class="jp">土</span>.</p><div class="anim-row"><div class="mini-anim" data-anim="三"></div><div class="mini-anim" data-anim="川"></div><div class="mini-anim" data-anim="十"></div></div>'),
    card('Правила 4–6', '<p><b>4. Центр перед боковыми:</b> <span class="jp">小</span>, <span class="jp">水</span>. <b>5. Внешнее перед внутренним, замыкающая черта последней:</b> <span class="jp">日</span>, <span class="jp">国</span>. <b>6. Пронзающая черта последней:</b> <span class="jp">中</span>, <span class="jp">女</span>.</p><div class="anim-row"><div class="mini-anim" data-anim="水"></div><div class="mini-anim" data-anim="国"></div><div class="mini-anim" data-anim="中"></div></div>'),
    card('Правила 7–9', '<p><b>7. Левая диагональ перед правой:</b> <span class="jp">人</span>, <span class="jp">大</span>. <b>8. Точки и мелкие черты часто в конце</b> (но не всегда). <b>9. Исключения:</b> в <span class="jp">右</span> сначала диагональ, в <span class="jp">左</span> сначала горизонталь. Сравните:</p><div class="anim-row"><div class="mini-anim" data-anim="右"></div><div class="mini-anim" data-anim="左"></div><div class="mini-anim" data-anim="大"></div></div><p class="hint">Сомневаетесь — смотрите анимацию, не угадывайте.</p>'),
    card('Чтения', '<p><b>Онъёми</b> — китайское чтение, чаще в словах из нескольких знаков: <span class="jp">山</span> → サン. <b>Кунъёми</b> — японское, для отдельных слов: <span class="jp">山</span> → やま. <b>Окуригана</b> — хирагана после знака: <span class="jp">食べる</span>, <span class="jp">高い</span>.</p><p>Учите чтения вместе со словами, а не столбиком.</p>'),
    card('Типичные ошибки', '<ul><li>Учить только глазами, не пробуя писать.</li><li>Пропускать порядок черт.</li><li>Зубрить онъёми и кунъёми без слов.</li><li>Путать похожие знаки: <span class="jp">日/目/白</span>, <span class="jp">人/入/八</span>, <span class="jp">土/士</span>.</li><li>Пытаться выучить сотню знаков за неделю.</li></ul>'),
    card('Мини-задание: 日 月 山 川 人', '<p>Сейчас напишете пять знаков. Проговаривайте порядок черт. Потом они появятся в повторении по памяти.</p>'),
    ...['日', '月', '山', '川', '人'].flatMap(c => [{ type: 'write', ch: c, mode: 'trace', key: 'k:' + c, prompt: '<span class="ru-prompt">' + esc(D.k[c].ru) + '</span>', onNext: () => srsAdd('k:' + c) }])
  ];
}

/* ---------- собеседование ---------- */
export function introExercises() {
  const me = P.me || {}, out = [];
  for (const line of D.interview.intro.lines) {
    const text = fillTpl(line.jp, me);
    out.push({ type: 'speak', audio: line.s ? audioOf({ s: line.s }) : audioOf({ text }), html: furiHTML(fillTpl(line.f, me), 'all'), ru: fillTpl(line.ru, me) + (line.note ? ' · ' + fillTpl(line.note, me) : '') });
  }
  const full = D.interview.intro.lines.map(l => fillTpl(l.jp, me));
  out.push({ type: 'build', ru: 'Соберите начало самопредставления', blocks: full.slice(0, 4), audio: audioOf({ text: full.slice(0, 4).join('') }) });
  out.push({ type: 'build', ru: 'Соберите конец самопредставления', blocks: full.slice(4), audio: audioOf({ text: full.slice(4).join('') }) });
  return out;
}
export function qaExercises(ids) {
  const out = [];
  ids.forEach(id => {
    const q = D.qa[id], others = sample(D.interview.qa.filter(x => x.id !== id), 3);
    out.push({ type: 'mc', title: 'Что спрашивает преподаватель?', audio: q.s ? audioOf({ s: q.s }) : audioOf({ text: q.q }), opts: shuffle([q, ...others]).map(x => ({ ok: x.id === id, html: esc(x.ru) })), why: '<span class="jp">' + furiHTML(q.qf, 'all') + '</span>' });
    out.push({ type: 'qa', qa: q });
    const m = q.a[0]; const txt = fillTpl(m.jp, P.me || {});
    out.push({ type: 'speak', audio: audioOf({ text: txt }), html: furiHTML(fillTpl(m.f, P.me || {}), 'all'), ru: fillTpl(m.ru, P.me || {}) });
  });
  return out;
}
export function phraseExercises() {
  const ph = D.interview.phrases, out = [];
  ph.forEach(p => {
    const others = sample(ph.filter(x => x !== p), 3);
    out.push({ type: 'mc', title: 'Как сказать по-японски?', prompt: '<div class="ru-prompt">' + esc(p.ru) + '</div>', opts: shuffle([p, ...others]).map(x => ({ ok: x === p, html: '<span class="jp">' + furiHTML(x.f, 'all') + '</span>' })), after: p.s ? audioOf({ s: p.s }) : audioOf({ text: p.jp }), why: esc(p.tip || '') });
  });
  sample(ph, 4).forEach(p => out.push({ type: 'speak', audio: p.s ? audioOf({ s: p.s }) : audioOf({ text: p.jp }), html: furiHTML(p.f, 'all'), ru: p.ru }));
  return out;
}
export function mockExercises() {
  const ids = D.interview.mock;
  return ids.map((id, i) => ({ type: 'qa', qa: D.qa[id], mock: true, n: i + 1, of: ids.length, noRetry: true }));
}

/* ---------- входной тест (адаптивный) ---------- */
export function placement() {
  const H = D.kana.list;
  const rowsLv = [['あ', 'か', 'さ', 'た'], ['な', 'は', 'ま', 'や'], ['ら', 'わ']];
  const kanaLv = script => [0, 1, 2].map(i => () => { const k = pick(H.filter(x => x.g === 'b' && rowsLv[i].includes(x.row))); return kanaToRo(kanaChar(k, script), H.filter(x => x.g === 'b')); })
    .concat([() => { const k = pick(H.filter(x => x.g === 'd')); return kanaToRo(kanaChar(k, script), H.filter(x => x.g === 'd')); }, () => { const k = pick(H.filter(x => x.g === 'y')); return kanaToRo(kanaChar(k, script), H.filter(x => x.g === 'y')); }]);
  const vocabLv = [1, 2, 3, 4, 5, 6].map(u => () => wordMC(pick(D.vocab.filter(w => w.u === u && !w.k.includes('〜') && w.p !== 'exp')), 'jr'));
  const gIds = ['g101', 'g104', 'g103', 'g201', 'g105', 'g503', 'g301', 'g401', 'g402', 'g204', 'g501', 'g601'];
  const blocks = [
    { id: 'h', name: 'Хирагана', lv: kanaLv('h'), start: 1 },
    { id: 'k', name: 'Катакана', lv: kanaLv('k'), start: 1 },
    { id: 'v', name: 'Слова', lv: vocabLv, start: 1 }
  ];
  const st = Object.fromEntries(blocks.map(b => [b.id, { pass: -1, fail: b.lv.length, asked: 0 }]));
  const res = { blocks: st, g: {}, listen: 0 };
  const probe = b => { const s = st[b.id]; const L = Math.floor((s.pass + s.fail + 1) / 2); if (L <= s.pass || L >= s.fail || s.asked >= 4) return null; const x = b.lv[L](); x._pl = { b: b.id, L }; x.noRetry = true; x.key = null; x.opts && x.opts.push({ ok: false, html: 'Не знаю', idk: true }); s.asked++; return x; };
  const gq = id => { const g = D.g[id]; const q = g.q.find(x => x.t === 'p') || g.q[0]; const x = grammarQs(g)[g.q.indexOf(q)]; x._pl = { g: id }; x.key = null; x.noRetry = true; return x; };
  const first = [probe(blocks[0])];
  let gIdx = 0, gWrongRow = 0, phase = 0;
  const adapt = (cur, ok, queue) => {
    const pl = cur._pl; if (!pl) return;
    if (pl.b) {
      const s = st[pl.b]; if (ok) s.pass = Math.max(s.pass, pl.L); else s.fail = Math.min(s.fail, pl.L);
      const b = blocks.find(x => x.id === pl.b); const nx = probe(b);
      if (nx) { queue.unshift(nx); return; }
      const bi = blocks.indexOf(b);
      if (bi + 1 < blocks.length) { const n2 = probe(blocks[bi + 1]); if (n2) { queue.unshift(n2); return; } }
      queue.unshift(gq(gIds[gIdx++])); return;
    }
    if (pl.g) {
      res.g[pl.g] = ok; gWrongRow = ok ? 0 : gWrongRow + 1;
      if (gIdx < gIds.length && gWrongRow < 3) { queue.unshift(gq(gIds[gIdx++])); return; }
      // аудирование
      const w = pick(D.vocab.filter(x => x.u <= 2 && x.a)); const x = wordMC(w, 'au'); x.key = null; x.noRetry = true; x._pl = { l: 1 }; queue.unshift(x); return;
    }
    if (pl.l) {
      if (ok) res.listen++;
      if (pl.l < 3 && ok) {
        const s = pick(D.sentences.filter(s => goodS(s) && s.jp.length <= 10)); const x = sListen(s); x.noRetry = true; x._pl = { l: pl.l + 1 }; queue.unshift(x);
      }
    }
  };
  return { list: first, adapt, res };
}
export function applyPlacement(res) {
  const lv = id => res.blocks[id].pass; // -1 ничего; 0..4
  const markKana = (script, L) => {
    const prefix = script === 'h' ? 'h' : 'k';
    const lessonsByLv = [[prefix + '-r0', prefix + '-r2'], [prefix + '-r4', prefix + '-r6'], [prefix + '-r8', prefix + '-x'], [prefix + '-d'], [prefix + '-y']];
    for (let i = 0; i <= L; i++) lessonsByLv[i].forEach(id => { if (D.lessonById[id]) { P.done[id] = Date.now(); const l = D.lessonById[id]; if (l.kind === 'kana') kanaPoolKeys(l).forEach(k => srsAdd(k, true)); } });
  };
  markKana('h', lv('h')); markKana('k', lv('k'));
  const vu = lv('v') + 1; // юниты 1..vu известны
  D.vocab.filter(w => w.u <= vu && !w.k.includes('〜')).forEach(w => srsAdd('w:' + w.id, true));
  Object.entries(res.g).forEach(([id, ok]) => { if (ok) srsAdd('g:' + id, true); });
  for (const l of D.lessons) if (l.kind === 'lesson') {
    const u = +l.unit.id.slice(1);
    if (u <= vu && l.g.every(g => res.g[g] || !(g in res.g) && u < vu)) P.done[l.id] = Date.now();
  }
  P.placed = true; save();
}
function kanaPoolKeys(l) { return D.kana.list.filter(k => l.g === 'd' ? k.g === 'd' : l.g === 'y' ? k.g === 'y' : k.g === 'b' && l.rows.includes(k.row)).map(k => (l.script === 'k' ? 't:' : 'h:') + k.h); }
