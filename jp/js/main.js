// Запуск приложения и навигация
import { P, tg, $, $$, loadData, loadProgress, checkStreak, save, pushCloud } from './core.js';
import { homeScreen, lessonsScreen, practiceScreen, ratingScreen, meScreen, welcome, setGo, checkAch, closeSheet } from './screens.js';
import { swapView, reduced } from './fx.js';
import { toast } from './ex.js';
import { I, defs } from './icons.js';
import { artDefs } from './art.js';

const SCREENS = { home: homeScreen, lessons: lessonsScreen, practice: practiceScreen, rating: ratingScreen, me: meScreen };
const NAV = [['home', I.home, 'Главная'], ['lessons', I.book, 'Уроки'], ['practice', I.target, 'Практика'], ['rating', I.trophy, 'Рейтинг'], ['me', I.user, 'Профиль']];
let curView = '', curSub = '';
const ORDER = NAV.map(n => n[0]);
function movePill(v) {
  const i = ORDER.indexOf(v), pill = $('.bnav .pill'), btns = $$('.bnav button');
  if (!pill || i < 0 || !btns[i]) return;
  pill.style.width = btns[i].offsetWidth + 'px';
  pill.style.transform = 'translateX(' + btns[i].offsetLeft + 'px)';
}
function go(v, sub) {
  closeSheet();
  if (tg && tg.BackButton && !sub) { try { tg.BackButton.hide(); } catch (e) { } }
  const dir = curView !== v ? Math.sign(ORDER.indexOf(v) - ORDER.indexOf(curView)) : sub ? 1 : curSub ? -1 : 0;
  const render = () => { curView = v; curSub = sub || ''; SCREENS[v](sub); window.scrollTo(0, 0); $$('.bnav button').forEach(b => b.classList.toggle('on', b.dataset.v === v)); };
  movePill(v);
  if (curView) swapView(render, dir); else render();
}
setGo(go);

(async function init() {
  defs(); artDefs();
  document.documentElement.classList.add('dark');
  if (tg) { try { tg.ready(); tg.expand(); tg.setHeaderColor && tg.setHeaderColor('#0e0a1f'); tg.setBackgroundColor && tg.setBackgroundColor('#0e0a1f'); tg.setBottomBarColor && tg.setBottomBarColor('#0e0a1f'); } catch (e) { } }
  try { localStorage.setItem('app_last', 'jp'); } catch (e) { }
  try { await loadData(); }
  catch (e) { $('#view').innerHTML = '<div class="center"><h2>Не удалось загрузить курс</h2><p class="hint">Проверьте интернет и откройте приложение снова.</p></div>'; return; }
  await loadProgress();
  document.documentElement.classList.toggle('less-motion', reduced());
  document.documentElement.classList.toggle('full-motion', P.set.motion === 'full');
  const st = checkStreak();
  const nav = $('.bnav');
  nav.innerHTML = '<i class="pill"></i>' + NAV.map(([v, ic, t]) => '<button data-v="' + v + '">' + ic + '<span>' + t + '</span></button>').join('');
  nav.hidden = false;
  addEventListener('resize', () => movePill(curView));
  $$('.bnav button').forEach(b => b.onclick = () => go(b.dataset.v));
  if (!P.placed) welcome(); else go('home');
  if (st === 'frozen') setTimeout(() => toast('Заморозка сохранила вашу серию'), 600);
  if (st === 'lost') setTimeout(() => toast('Серия прервалась. Начнём новую сегодня!'), 600);
  checkAch();
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') { save(); pushCloud(); } });
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => { });
})();
