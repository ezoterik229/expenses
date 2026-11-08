// Движок упражнений и сессий (урок, повторение, тест)
import { D, P, $, $$, esc, shuffle, haptic, furiHTML, toKana, toRomaji, compareKana, audioOf, play, stopAudio, audioEvents, canRecord, ttsAvailable,
  srsGrade, srsAdd, addXP, loseHeart, hearts, gainHeart, today, save, POS, kata2hira, plural } from './core.js';
import { sfx, burst, mascot, countUp, reduced, hanabi, fireflyTo } from './fx.js';
import { strokeAnim, writePad } from './writing.js';
import { I } from './icons.js';
import { foxSVG } from './art.js';

/* ---------- кнопка аудио с подписью источника ---------- */
export function audioBtn(a, opt = {}) {
  if (!a) return '';
  const avail = a.src || a.tts;
  const id = 'a' + Math.random().toString(36).slice(2, 8);
  AUD[id] = a;
  const badge = a.real ? '<span class="src real">' + I.mic + esc(a.credit) + '</span>' : '<span class="src synth">' + I.synth + esc(a.credit) + '</span>';
  return '<span class="abtn-wrap' + (opt.big ? ' big' : '') + '"><button class="abtn" data-a="' + id + '" aria-label="Слушать"' + (avail ? '' : ' disabled') + '>' + I.speaker + '</button>' +
    (opt.noslow ? '' : '<button class="abtn slow" data-a="' + id + '" data-rate="0.7" aria-label="Медленно">' + I.slow + '</button>') + (opt.nocredit ? '' : badge) + '</span>';
}
export const creditBadge = a => !a ? '' : a.real ? '<span class="src real">' + I.mic + esc(a.credit) + '</span>' : '<span class="src synth">' + I.synth + esc(a.credit) + '</span>';
const AUD = {};
document.addEventListener('click', e => {
  const b = e.target.closest('.abtn'); if (!b) return;
  e.stopPropagation();
  const a = AUD[b.dataset.a]; if (!a) return;
  $$('.abtn.playing').forEach(x => x.classList.remove('playing'));
  b.classList.add('playing');
  play(a, +(b.dataset.rate || 1)).then(ok => {
    b.classList.remove('playing');
    if (!ok) toast(a.src ? 'Не удалось загрузить запись. Проверьте интернет.' : 'Живой записи нет, а японский синтез речи на этом устройстве недоступен.');
  });
});
export const playA = (a, rate) => a && play(a, rate);
export function toast(t) { const d = document.createElement('div'); d.className = 'toast'; d.textContent = t; document.body.appendChild(d); setTimeout(() => d.classList.add('out'), 1800); setTimeout(() => d.remove(), 2200); }

const wordHTML = (w, big) => '<span class="jp' + (big ? ' big' : '') + '">' + (w.f ? furiHTML(w.f, 'all') : esc(w.k)) + '</span>';
const romaji = r => P.set.romaji ? '<div class="romaji">' + esc(toRomaji(r.replace(/〜/g, ''))) + '</div>' : '';

/* ---------- сессия ---------- */
export function runSession(list, opt = {}) {
  return new Promise(resolve => {
    const mode = opt.mode || 'lesson';
    const root = document.createElement('div'); root.className = 'session'; root.innerHTML = `
      <div class="s-top"><button class="s-close" aria-label="Закрыть">${I.close}</button><div class="s-bar"><i></i></div>
      <div class="s-combo"></div>${mode === 'lesson' ? '<div class="s-hearts">' + I.heart + '<b></b></div>' : ''}</div>
      <div class="s-body"></div><div class="s-foot"><div class="s-fb"></div><button class="btn s-check" disabled>Проверить</button></div>`;
    document.body.appendChild(root);
    document.body.classList.add('in-session');
    const body = $('.s-body', root), btn = $('.s-check', root), fb = $('.s-fb', root), foot = $('.s-foot', root);
    const queue = list.slice(); let total = queue.length, doneN = 0, combo = 0, maxCombo = 0, ok = 0, bad = 0, xp = 0, current = null, state = 'answer';
    const t0 = Date.now(); const wrongs = []; const startHearts = hearts();
    const setHearts = () => { const h = $('.s-hearts b', root); if (h) h.textContent = hearts(); };
    setHearts();
    $('.s-close', root).onclick = () => { if (confirm('Выйти? Прогресс урока не сохранится.')) finish(true); };
    function progress() { $('.s-bar i', root).style.width = (doneN / Math.max(1, total) * 100) + '%'; }
    function next() {
      stopAudio(); progress(); fb.className = 's-fb'; fb.innerHTML = ''; foot.classList.remove('ok', 'bad');
      if (!queue.length) return finish(false);
      if (mode === 'lesson' && hearts() <= 0) { noHearts(); return; }
      current = queue.shift(); state = 'answer'; window.__jpCur = current; // для автопроверки
      body.classList.remove('enter'); void body.offsetWidth; body.classList.add('enter');
      body.scrollTop = 0;
      const r = RENDER[current.type](current, body, { ready, answer, setBtn });
      current._r = r || {};
      if (current.info) { setBtn(current.btn || 'Дальше', true); state = 'info'; } else setBtn('Проверить', false);
    }
    function setBtn(t, en) { btn.textContent = t; btn.disabled = !en; }
    function ready(en = true) { if (state === 'answer') btn.disabled = !en; }
    btn.onclick = () => {
      if (state === 'info') { if (current.onNext) current.onNext(); doneN++; next(); return; }
      if (state === 'answer') { const res = current._r.check && current._r.check(); if (res) answer(res); return; }
      if (state === 'shown') { doneN++; next(); }
    };
    function answer(res) {
      if (state !== 'answer') return;
      state = 'shown';
      const key = current.key, day = today();
      if (res.ok) {
        ok++; combo++; maxCombo = Math.max(maxCombo, combo); day.ok++;
        const gain = mode === 'review' ? 1 : 2; xp += gain;
        if (key) srsGrade(key, res.q || (res.near ? 4 : 5));
        sfx.ok(combo); haptic('success');
        const r = btn.getBoundingClientRect(); burst(r.left + r.width / 2, r.top, combo);
        foot.classList.add('ok');
        fb.className = 's-fb show ok'; fb.innerHTML = '<b>' + pickOk(combo) + '</b>' + (res.near ? '<div>' + esc(res.hint) + '</div>' : '') + (res.extra || '');
        if (mode === 'review' && combo % 5 === 0) gainHeart();
      } else {
        bad++; combo = 0; day.bad++;
        if (key) { srsGrade(key, 1); if (!day.wrong.includes(key)) day.wrong.push(key); }
        if (current.errKey) addErr(current.errKey);
        wrongs.push(current);
        sfx.bad(); haptic('error');
        body.classList.remove('shake'); void body.offsetWidth; if (!reduced()) body.classList.add('shake');
        foot.classList.add('bad');
        fb.className = 's-fb show bad';
        fb.innerHTML = '<b>Правильно: </b>' + (res.correct || '') + (res.why ? '<div class="why">' + res.why + '</div>' : '') + (res.extra || '');
        if (mode === 'lesson') { loseHeart(); setHearts(); }
        if (mode !== 'test' && !current.noRetry) { const again = Object.assign({}, current, { _again: true }); delete again._r; queue.push(again); total++; }
      }
      if (opt.adapt) { opt.adapt(current, !!res.ok, queue); total = doneN + 1 + queue.length; }
      const cb = $('.s-combo', root); cb.textContent = combo >= 2 ? '×' + combo : ''; cb.className = 's-combo' + (combo >= 2 ? ' on' : '') + (combo >= 5 ? ' fire' : '');
      save(); setBtn('Дальше', true);
      if (res.autoAudio) playA(res.autoAudio);
    }
    function noHearts() {
      body.innerHTML = '<div class="center"><div class="fox-host" id="nh"></div><h2>Сердечки закончились</h2><p class="hint">Они восстанавливаются: одно за 30 минут. Или пройдите повторение: каждые 5 верных ответов подряд дают сердечко.</p></div>';
      mascot($('#nh', body), 'sad', 'Отдохнём немного?');
      setBtn('Выйти', true); state = 'info'; current = { onNext() { } }; btn.onclick = () => finish(true);
    }
    function finish(aborted) {
      stopAudio();
      if (aborted) { root.remove(); document.body.classList.remove('in-session'); resolve({ aborted: true }); return; }
      const bonus = mode === 'lesson' ? 10 : mode === 'review' ? 3 : 5;
      const hBefore = startHearts;
      const reached = addXP(xp + bonus);
      const acc = Math.round(ok / Math.max(1, ok + bad) * 100), min = Math.max(1, Math.round((Date.now() - t0) / 60000));
      const ev = P._streakEvent; delete P._streakEvent;
      const energy = mode === 'lesson' ? (hearts() - hBefore) * 5 : 0;
      sfx.done();
      foot.classList.remove('ok', 'bad'); fb.className = 's-fb'; fb.innerHTML = '';
      const conf = Array.from({ length: 14 }, (_, i) => '<i style="left:' + (8 + Math.random() * 84) + '%;top:' + (Math.random() * 70) + '%;background:' + ['#ffc83d', '#a77bff', '#f08bd0', '#6ad1ff'][i % 4] + ';transform:rotate(' + (Math.random() * 180) + 'deg);animation-delay:' + (-Math.random() * 2) + 's"></i>').join('');
      body.innerHTML = `<div class="results"><div class="res-hero"><div class="confetti">${conf}</div>${foxSVG('happy', { star: true })}</div>
        <div class="ribbon">${esc(opt.title && opt.title !== 'Урок на сегодня' ? opt.title : 'Урок пройден!')}</div>
        <div class="res-grid"><div>${I.flame}<b>${ev ? '+1 день' : P.streak.n + ' ' + plural(P.streak.n, 'день', 'дня', 'дней')}</b></div><div>${I.gem}<b>+<span class="cu">0</span></b></div><div>${I.bolt}<b>${energy ? energy : '0'}</b></div></div>
        <div class="res-sub"><span>Точность ${acc}%</span><span>${min} мин</span><span>Комбо ×${maxCombo}</span></div>
        ${reached ? '<div class="goal-hit">Дневная цель выполнена!</div>' : ''}
        ${wrongs.length ? '<div class="hint center-t">Ошибки вернутся в повторении чаще: так они запомнятся.</div>' : ''}</div>`;
      $('.s-bar i', root).style.width = '100%';
      countUp($('.cu', body), xp + bonus, 0);
      if (reached) { const r = body.getBoundingClientRect(); fireflyTo(r.width / 2, r.top + 120); }
      if (!reduced()) { const r = body.getBoundingClientRect(); setTimeout(() => burst(r.left + r.width / 2, r.top + 160, 4), 200); }
      if (ev && [7, 30, 100].includes(ev)) setTimeout(() => hanabi('Серия ' + ev + ' дней!'), 500);
      setBtn('Продолжить', true); state = 'info';
      current = { onNext() { } };
      btn.onclick = () => { root.remove(); document.body.classList.remove('in-session'); resolve({ ok, bad, xp: xp + bonus, acc, wrongs }); };
    }
    next();
  });
}
const OKS = ['Верно!', 'Отлично!', 'Правильно!', 'いいね！', 'すごい！', 'Так держать!'];
const pickOk = c => c >= 5 ? c + ' подряд!' : OKS[Math.random() * OKS.length | 0];
function addErr(k) { P.errs = P.errs.filter(x => x.k !== k); P.errs.unshift({ k, t: Date.now() }); P.errs = P.errs.slice(0, 60); }

/* ---------- отрисовщики ---------- */
const RENDER = {};

// карточка-объяснение (теория)
RENDER.info = (ex, el) => {
  el.innerHTML = (ex.title ? '<div class="ex-title">' + esc(ex.title) + '</div>' : '') + '<div class="info">' + ex.html + '</div>';
  $$('[data-anim]', el).forEach(h => strokeAnim(h, h.dataset.anim, { loop: false }));
  $$('[data-write]', el).forEach(h => writePad(h, h.dataset.write, { mode: 'trace' }));
  ex.info = true; ex.btn = ex.btn || 'Дальше';
  if (ex.onShow) ex.onShow(el);
};

// новое слово / карточка
RENDER.wcard = (ex, el, api) => {
  const w = D.w[ex.w], s = w.s && D.s[w.s];
  const a = audioOf({ w: w.id });
  el.innerHTML = `<div class="ex-title">${ex.review ? 'Вспомните перевод' : 'Новое слово'}</div>
   <div class="flip"><div class="flip-in">
    <div class="face front">${wordHTML(w, true)}${romaji(w.r)}<div>${audioBtn(a, { big: true })}</div><div class="hint tap">коснитесь, чтобы перевернуть</div></div>
    <div class="face back">${wordHTML(w)}<div class="kana-r">${esc(w.r)}</div><div class="tr">${esc(w.ru)}</div><div class="pos">${esc(POS[w.p] || '')}</div>
     ${s ? '<div class="exs"><div class="jp">' + furiHTML(s.f) + '</div><div class="ru">' + esc(s.ru) + '</div>' + audioBtn(audioOf({ s: s.id })) + '</div>' : ''}</div>
   </div></div>`;
  const flip = $('.flip', el);
  flip.onclick = e => { if (e.target.closest('.abtn')) return; flip.classList.toggle('on'); if (!ex.review) api.setBtn('Дальше', true); };
  setTimeout(() => playA(a), 250);
  if (!ex.review) { ex.info = true; ex.onNext = () => srsAdd('w:' + w.id); return; }
  // повторение: «знаю / не знаю»
  ex.info = false;
  const foot = el.closest('.session').querySelector('.s-foot');
  const row = document.createElement('div'); row.className = 'kn-row';
  row.innerHTML = '<button class="btn ghost no">Не знаю</button><button class="btn yes">Знаю</button>';
  el.appendChild(row);
  row.querySelector('.yes').onclick = () => { if (!reduced()) flip.classList.add('fly'); api.answer({ ok: true, q: flip.classList.contains('on') ? 4 : 5 }); };
  row.querySelector('.no').onclick = () => { flip.classList.add('on'); api.answer({ ok: false, correct: esc(w.ru), why: '' }); };
  return {};
};

// правило грамматики
RENDER.gcard = (ex, el) => {
  const g = D.g[ex.g];
  const tat = (g.tat || []).slice(0, 3).map(id => D.s[id]).filter(Boolean);
  el.innerHTML = `<div class="ex-title">Грамматика</div><h2 class="g-t">${esc(g.t)}</h2><div class="rule">${esc(g.rule)}</div>
   <div class="g-ex">${g.ex.map(e => '<div class="exs"><div class="jp">' + furiHTML(e.f, 'all') + '</div><div class="ru">' + esc(e.ru) + '</div>' + audioBtn(e.s ? audioOf({ s: e.s }) : audioOf({ text: e.jp })) + '</div>').join('')}</div>
   ${tat.length ? '<div class="sub">Живые примеры от носителей</div>' + tat.map(s => '<div class="exs"><div class="jp">' + furiHTML(s.f) + '</div><div class="ru">' + esc(s.ru) + '</div>' + audioBtn(audioOf({ s: s.id })) + '</div>').join('') : ''}`;
  ex.info = true; ex.btn = 'Понятно'; ex.onNext = () => srsAdd('g:' + g.id);
};

// новый кандзи
RENDER.kcard = (ex, el, api) => {
  const k = D.k[ex.c];
  const words = k.w.map(id => D.w[id]).filter(Boolean).slice(0, 4);
  // латиница под чтениями: пока ученик не знает всю кану, без неё чтения не прочитать
  const ro = s => P.set.romaji && s ? ' <small class="ro">(' + esc(toRomaji(s.replace(/[()（）]/g, '').replace(/、/g, ', '))) + ')</small>' : '';
  el.innerHTML = `<div class="ex-title">Новый иероглиф</div>
   <div class="k-head"><div class="k-anim"></div><div class="k-info"><div class="k-mean">${esc(k.ru)}</div>
    <div class="k-read"><span class="on">он: ${esc(k.on || '—')}${ro(k.on)}</span><span class="kun">кун: ${esc(k.kun || '—')}${ro(k.kun)}</span></div>
    <div class="k-meta">${k.n} ${k.n === 1 ? 'черта' : k.n < 5 ? 'черты' : 'черт'}${k.rad ? ' · ключ ' + esc(k.rad) : ''}${k.parts.length > 1 ? ' · части: ' + k.parts.map(esc).join(' + ') : ''}</div></div></div>
   <div class="k-img">${I.bulb}<span>${esc(k.img || '')}</span></div>
   <div class="sub">Слова</div>${words.map(w => '<div class="wrow">' + wordHTML(w) + '<span class="tr">' + esc(w.ru) + (P.set.romaji ? '<small class="ro"> · ' + esc(toRomaji(w.r.replace(/〜/g, ''))) + '</small>' : '') + '</span>' + audioBtn(audioOf({ w: w.id }), { nocredit: true }) + '</div>').join('')}
   <div class="sub">Нажмите на знак, чтобы повторить анимацию. Дальше попробуете написать сами.</div>`;
  strokeAnim($('.k-anim', el), k.c);
  ex.info = true; ex.btn = 'Написать';
};

// кана: знакомство
RENDER.kana = (ex, el) => {
  const ch = ex.ch, k = D.ka[kata2hira(ch)] || {};
  el.innerHTML = `<div class="ex-title">${/[゠-ヿ]/.test(ch) ? 'Катакана' : 'Хирагана'}</div><div class="k-anim kana-anim"></div>
   <div class="kana-ro">${esc(k.ro || '')}</div><div>${audioBtn(audioOf({ kana: ch }), { big: true })}</div><div class="hint">Нажмите на знак, чтобы снова увидеть порядок черт.</div>`;
  strokeAnim($('.k-anim', el), ch);
  setTimeout(() => playA(audioOf({ kana: ch })), 300);
  ex.info = true;
};

// выбор варианта
RENDER.mc = (ex, el, api) => {
  // карточка вопроса: динамик + текст (как в макете)
  let head;
  if (ex.audio) head = '<div class="pcard">' + audioBtn(ex.audio, { nocredit: true }) + '<div class="grow">' + (ex.prompt || '<span class="hint">Нажмите, чтобы послушать ещё раз</span>') + '</div></div><div class="center-t">' + creditBadge(ex.audio) + '</div>';
  else if (ex.prompt && ex.after) head = '<div class="pcard">' + audioBtn(ex.after, { nocredit: true, noslow: true }) + '<div class="grow">' + ex.prompt + '</div></div>';
  else head = ex.prompt ? '<div class="pcard center-p">' + ex.prompt + '</div>' : '';
  el.innerHTML = `<div class="ex-title">${esc(ex.title || 'Выберите ответ')}</div>${head}
    <div class="opts${ex.grid ? ' grid' : ''}">${ex.opts.map((o, i) => '<button class="opt" data-i="' + i + '">' + o.html + '</button>').join('')}</div>`;
  if (ex.audio && ex.autoplay !== false) setTimeout(() => playA(ex.audio), 300);
  let sel = -1;
  $$('.opt', el).forEach(b => b.onclick = () => { if (b.closest('.session').querySelector('.s-fb.show')) return; $$('.opt', el).forEach(x => x.classList.remove('sel')); b.classList.add('sel'); sel = +b.dataset.i; sfx.tap(); api.ready(); });
  return {
    check() {
      const o = ex.opts[sel], right = ex.opts.findIndex(x => x.ok);
      $$('.opt', el)[right].classList.add('right'); if (!o.ok) $$('.opt', el)[sel].classList.add('wrong');
      return { ok: !!o.ok, correct: ex.opts[right].html, why: ex.why, autoAudio: ex.after };
    }
  };
};

// собери предложение
RENDER.build = (ex, el, api) => {
  // над невыученными кандзи в блоках показываем чтение
  const bh = (t, i) => ex.bf && ex.bf[i] ? furiHTML(ex.bf[i]) : esc(t);
  const blocks = shuffle(ex.blocks.map((t, i) => ({ t, i, h: bh(t, i) })).concat((ex.extra || []).map(t => ({ t, i: -1, h: esc(t) }))));
  el.innerHTML = `<div class="ex-title">Соберите предложение</div><div class="pcard center-p"><span class="ru-prompt">${esc(ex.ru)}</span></div>${ex.audio && ex.listen ? '<div class="pa">' + audioBtn(ex.audio) + '</div>' : ''}
    <div class="b-ans"></div><div class="b-pool">${blocks.map((b, j) => '<button class="blk" data-j="' + j + '">' + b.h + '</button>').join('')}</div>`;
  if (ex.audio && ex.listen) setTimeout(() => playA(ex.audio), 300);
  const ans = $('.b-ans', el), pool = $('.b-pool', el); const chosen = [];
  pool.onclick = e => { const b = e.target.closest('.blk'); if (!b || b.classList.contains('used')) return; b.classList.add('used'); chosen.push(+b.dataset.j); draw(); sfx.tap(); };
  ans.onclick = e => { const b = e.target.closest('.blk'); if (!b) return; const j = +b.dataset.j; chosen.splice(chosen.indexOf(j), 1); $('.blk[data-j="' + j + '"]', pool).classList.remove('used'); draw(); };
  function draw() { ans.innerHTML = chosen.map(j => '<button class="blk in" data-j="' + j + '">' + blocks[j].h + '</button>').join(''); api.ready(chosen.length > 0); }
  return {
    check() {
      const got = chosen.map(j => blocks[j].t).join(''), want = ex.blocks.join('');
      const okk = got === want;
      return { ok: okk, correct: '<span class="jp">' + ex.blocks.map((t, i) => bh(t, i)).join(' ') + '</span>', why: okk ? '' : ex.why, autoAudio: ex.audio };
    }
  };
};

// напиши каной (ромадзи превращаются в кану)
RENDER.type = (ex, el, api) => {
  const kata = ex.kata;
  el.innerHTML = `<div class="ex-title">${kata ? 'Напишите катаканой' : 'Напишите хираганой'}</div><div class="prompt">${ex.prompt}</div>
   ${ex.audio ? '<div class="pa">' + audioBtn(ex.audio) + '</div>' : ''}
   <input class="kin" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${kata ? 'латиницей: ko-hi- → コーヒー' : 'латиницей: neko → ねこ'}">
   <div class="hint">Можно печатать латиницей или японской клавиатурой. «n» в конце превращается в ん при проверке.${kata ? ' Долгий звук ー — это дефис «-».' : ''}</div>`;
  if (ex.audio && ex.autoplay) setTimeout(() => playA(ex.audio), 300);
  const inp = $('.kin', el);
  inp.addEventListener('input', () => { const v = toKana(inp.value, kata); if (v !== inp.value) inp.value = v; api.ready(inp.value.trim().length > 0); });
  inp.addEventListener('keydown', e => { if (e.key === 'Enter' && inp.value.trim()) { e.preventDefault(); el.closest('.session').querySelector('.s-check').click(); } });
  setTimeout(() => inp.focus(), 200);
  return {
    check() {
      const given = toKana(inp.value, kata, true); inp.value = given; inp.blur();
      const r = compareKana(given, ex.want);
      if (r.ok) return { ok: true, near: r.near, hint: r.hint, autoAudio: ex.audio, extra: ex.show ? '<div class="jp">' + ex.show + '</div>' : '' };
      const g = r.g || '', at = r.at || 0;
      const diff = '<span class="jp">' + esc(g.slice(0, at)) + '<mark>' + esc(g.slice(at, at + 1) || '…') + '</mark>' + esc(g.slice(at + 1)) + '</span>';
      return { ok: false, correct: '<span class="jp">' + esc(ex.want) + '</span>' + (ex.show ? ' (' + ex.show + ')' : ''), why: 'Вы написали: ' + diff + '. Ошибка начинается с выделенного знака.' + (ex.why ? ' ' + ex.why : ''), autoAudio: ex.audio };
    }
  };
};

// частица / пропуск
RENDER.particle = (ex, el, api) => {
  const s = ex.sf ? furiHTML(ex.sf, 'all') : esc(ex.s);
  el.innerHTML = `<div class="ex-title">Выберите, что вставить</div><div class="prompt jp sent">${s.replace('＿', '<span class="gap">？</span>')}</div>
    <div class="opts row">${ex.opts.map((o, i) => '<button class="opt" data-i="' + i + '"><span class="jp">' + esc(o) + '</span></button>').join('')}</div>`;
  let sel = -1;
  $$('.opt', el).forEach(b => b.onclick = () => { if (el.closest('.session').querySelector('.s-fb.show')) return; $$('.opt', el).forEach(x => x.classList.remove('sel')); b.classList.add('sel'); sel = +b.dataset.i; const gp = $('.gap', el); if (gp) gp.textContent = ex.opts[sel]; sfx.tap(); api.ready(); });
  return {
    check() {
      const okk = ex.opts[sel] === ex.a; const ri = ex.opts.indexOf(ex.a);
      $$('.opt', el)[ri].classList.add('right'); if (!okk) $$('.opt', el)[sel].classList.add('wrong');
      return { ok: okk, correct: '<span class="jp">' + esc(ex.a) + '</span>', why: esc(ex.why || '') };
    }
  };
};

// найди и исправь ошибку
RENDER.fix = (ex, el, api) => {
  el.innerHTML = `<div class="ex-title">Найдите ошибку</div><div class="hint">Нажмите на неправильную часть, потом выберите исправление.</div>
   <div class="b-ans fixrow">${ex.b.map((t, i) => '<button class="blk" data-i="' + i + '">' + esc(t) + '</button>').join('')}</div><div class="opts row fixopts"></div>`;
  let step = 0, sel = -1;
  $('.fixrow', el).onclick = e => {
    const b = e.target.closest('.blk'); if (!b || step > 1) return;
    $$('.fixrow .blk', el).forEach(x => x.classList.remove('sel')); b.classList.add('sel'); sfx.tap();
    const i = +b.dataset.i;
    if (i !== ex.e) { step = 9; api.answer({ ok: false, correct: '<span class="jp">' + esc(ex.b[ex.e]) + '</span> → <span class="jp">' + esc(ex.a) + '</span>', why: esc(ex.why) }); return; }
    step = 1;
    $('.fixopts', el).innerHTML = ex.o.map((o, j) => '<button class="opt" data-j="' + j + '"><span class="jp">' + esc(o) + '</span></button>').join('');
    $$('.fixopts .opt', el).forEach(o => o.onclick = () => { if (step !== 1) return; $$('.fixopts .opt', el).forEach(x => x.classList.remove('sel')); o.classList.add('sel'); sel = +o.dataset.j; api.ready(); });
  };
  return {
    check() {
      step = 2; const okk = ex.o[sel] === ex.a;
      return { ok: okk, correct: '<span class="jp">' + esc(ex.a) + '</span>', why: esc(ex.why) };
    }
  };
};

// письмо знака
RENDER.write = (ex, el, api) => {
  el.innerHTML = `<div class="ex-title">${ex.mode === 'memory' ? 'Напишите по памяти' : ex.mode === 'hint' ? 'Напишите, подсказка только для следующей черты' : 'Обведите по порядку черт'}</div>
   <div class="prompt">${ex.prompt || ''}</div><div class="wp"></div>
   <div class="w-tools"><button class="btn ghost sm w-show">Показать порядок</button><button class="btn ghost sm w-reset">Заново</button></div><div class="w-demo"></div>`;
  let errors = 0, finished = false;
  const pad = writePad($('.wp', el), ex.ch, { mode: ex.mode || 'trace', onDone: e => { errors = e; finished = true; api.ready(); el.closest('.session').querySelector('.s-check').click(); } });
  $('.w-reset', el).onclick = () => { pad.reset(); finished = false; api.ready(false); };
  $('.w-show', el).onclick = () => { const d = $('.w-demo', el); d.classList.add('on'); strokeAnim(d, ex.ch, { speed: 1.4 }); };
  return {
    check() {
      if (!finished) return null;
      const q = errors === 0 ? 5 : errors <= 2 ? 4 : 2;
      return q >= 3 ? { ok: true, q, extra: errors ? '<div>Ошибок в чертах: ' + errors + '</div>' : '<div>Без единой ошибки!</div>' } : { ok: false, q, correct: '<span class="jp big">' + esc(ex.ch) + '</span>', why: 'Ошибок в чертах: ' + errors + '. Посмотрите анимацию и попробуйте ещё раз.' };
    }
  };
};

// повтор за диктором: запись и сравнение волн
RENDER.speak = (ex, el, api) => {
  const a = ex.audio;
  el.innerHTML = `<div class="ex-title">Повторите за диктором</div><div class="prompt jp sent">${ex.html || ''}</div><div class="ru">${esc(ex.ru || '')}</div>
   <div class="pa">${audioBtn(a, { big: true })}</div>
   ${canRecord() ? '<button class="rec" aria-label="Записать"><span></span></button><div class="hint rec-h">Нажмите и говорите, нажмите ещё раз, чтобы остановить. Запись остаётся только на вашем телефоне.</div><div class="waves"></div>' : '<div class="hint">В этом окне Telegram запись голоса недоступна. Произнесите фразу вслух несколько раз.</div>'}`;
  setTimeout(() => playA(a), 300);
  ex.info = !canRecord(); ex.btn = 'Дальше';
  if (!canRecord()) return;
  let rec = null, chunks = [], stream = null, analyser = null, raf = 0;
  const btnR = $('.rec', el), waves = $('.waves', el);
  btnR.onclick = async () => {
    if (rec) { rec.stop(); return; }
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e) { toast('Нет доступа к микрофону'); return; }
    chunks = []; rec = new MediaRecorder(stream); rec.ondataavailable = e => chunks.push(e.data);
    const ac = new (window.AudioContext || window.webkitAudioContext)(); const srcN = ac.createMediaStreamSource(stream); analyser = ac.createAnalyser(); analyser.fftSize = 256; srcN.connect(analyser);
    const bars = Array.from({ length: 24 }, () => document.createElement('i')); waves.innerHTML = '<div class="live"></div>'; bars.forEach(b => waves.firstChild.appendChild(b));
    const buf = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => { analyser.getByteFrequencyData(buf); bars.forEach((b, i) => b.style.height = (4 + buf[i * 2] / 4) + 'px'); raf = requestAnimationFrame(tick); }; tick();
    btnR.classList.add('on');
    rec.onstop = async () => {
      cancelAnimationFrame(raf); btnR.classList.remove('on'); stream.getTracks().forEach(t => t.stop()); rec = null;
      const blob = new Blob(chunks, { type: chunks[0] && chunks[0].type || 'audio/webm' });
      const mine = URL.createObjectURL(blob);
      waves.innerHTML = '<div class="wv"><span>Диктор</span><canvas class="w-ref"></canvas></div><div class="wv"><span>Вы</span><canvas class="w-me"></canvas></div><button class="btn ghost sm play-me">▶ Моя запись</button>';
      drawWave($('.w-me', waves), await blob.arrayBuffer(), '#d9472b');
      if (a.src) fetch(a.src).then(r => r.arrayBuffer()).then(b => drawWave($('.w-ref', waves), b, '#2f6db5')).catch(() => { });
      $('.play-me', waves).onclick = () => new Audio(mine).play();
      api.ready(true);
    };
    setTimeout(() => rec && rec.state === 'recording' && rec.stop(), 8000);
    rec.start();
  };
  return { check() { return { ok: true, q: 4 }; } };
};
async function drawWave(cv, buf, color) {
  try {
    const ac = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, 44100, 44100);
    const ab = await ac.decodeAudioData(buf.slice ? buf.slice(0) : buf);
    const data = ab.getChannelData(0), W = cv.width = cv.clientWidth * devicePixelRatio, H = cv.height = 48 * devicePixelRatio, c = cv.getContext('2d');
    // обрезаем тишину по краям, чтобы волны было удобно сравнивать
    let a = 0, b = data.length - 1; while (a < b && Math.abs(data[a]) < 0.02) a++; while (b > a && Math.abs(data[b]) < 0.02) b--;
    const step = Math.max(1, Math.floor((b - a) / W)); c.fillStyle = color;
    for (let x = 0; x < W; x++) { let m = 0; for (let i = 0; i < step; i++) m = Math.max(m, Math.abs(data[a + x * step + i] || 0)); const h = Math.max(1, m * H); c.fillRect(x, (H - h) / 2, 1, h); }
  } catch (e) { }
}

// ответ на вопрос интервьюера
RENDER.qa = (ex, el, api) => {
  const q = ex.qa, me = P.me || {};
  const a = q.s ? audioOf({ s: q.s }) : audioOf({ text: q.q });
  // если вопрос нечем озвучить, текст показываем сразу
  const hide = ex.mock && (a.real || ttsAvailable());
  el.innerHTML = `<div class="ex-title">${ex.mock ? 'Вопрос ' + ex.n + ' из ' + ex.of : 'Ответьте на вопрос'}</div>
   ${ex.mock ? '<div class="interviewer"><div class="sensei"></div><div class="lantern"></div></div>' : ''}
   <div class="pa">${audioBtn(a, { big: true })}</div>
   <div class="prompt jp sent qtext ${hide ? 'hidden' : ''}">${furiHTML(q.qf, 'all')}</div>${hide ? '<button class="btn ghost sm show-q">Показать текст вопроса</button>' : ex.mock ? '' : '<div class="ru">' + esc(q.ru) + '</div>'}
   <textarea class="kin qa-in" rows="2" placeholder="Ответ латиницей или японской клавиатурой"></textarea>
   <div class="hint">Пример: watashi ha arekkusu desu → わたしはあれっくすです</div>`;
  setTimeout(() => playA(a), 400);
  const sb = $('.show-q', el); if (sb) sb.onclick = () => { $('.qtext', el).classList.remove('hidden'); sb.remove(); };
  const inp = $('.qa-in', el);
  inp.addEventListener('input', () => { const v = toKana(inp.value); if (v !== inp.value) inp.value = v; api.ready(inp.value.trim().length > 1); });
  return {
    check() {
      inp.value = toKana(inp.value, false, true);
      const txt = inp.value;
      const okk = q.need.every(n => new RegExp(n).test(txt + kata2hira(txt)));
      const models = q.a.map(m => '<div class="exs"><div class="jp">' + furiHTML(fillTpl(m.f, me), 'all') + '</div><div class="ru">' + esc(fillTpl(m.ru, me)) + '</div></div>').join('');
      ex.result = { q: q.id, ok: okk, txt };
      return okk ? { ok: true, extra: '<div class="sub">Образцы ответа</div>' + models + (q.tip ? '<div class="hint">' + esc(q.tip) + '</div>' : '') }
        : { ok: false, correct: '', why: 'В ответе не хватает ключевой части. ' + esc(q.tip || ''), extra: models };
    }
  };
};
export function fillTpl(s, me) {
  const ru = { job: 'job_ru', reason: 'reason_ru', hobby: 'hobby_ru' };
  return String(s || '').replace(/\{([a-z_]+)\}/g, (m, k) => {
    if (me[k]) return me[k];
    const f = D.interview.intro.fields.find(x => x.id === k || ru[x.id] === k);
    if (!f) return m;
    if (f.opts) { const o = f.opts.find(o => o[0] === me[f.id]) || f.opts[0]; return k.endsWith('_ru') ? o[1] : o[0]; }
    return f.def;
  });
}
