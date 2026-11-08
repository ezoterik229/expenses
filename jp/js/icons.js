// SVG-иконки в стиле макета (вместо эмодзи). Цветные иконки используют общие градиенты из defs().
const S = (body, vb = '0 0 24 24', cls = '') => `<svg class="ic ${cls}" viewBox="${vb}" aria-hidden="true">${body}</svg>`;
const L = (d, extra = '') => `<path d="${d}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"${extra}/>`;

export function defs() {
  if (document.getElementById('ic-defs')) return;
  const d = document.createElement('div');
  d.innerHTML = `<svg id="ic-defs" width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
    <linearGradient id="g-flame" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff5a1f"/><stop offset=".55" stop-color="#ff9a1f"/><stop offset="1" stop-color="#ffd25a"/></linearGradient>
    <linearGradient id="g-flame-in" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffd84d"/><stop offset="1" stop-color="#fff3b0"/></linearGradient>
    <linearGradient id="g-gem" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c9b2ff"/><stop offset="1" stop-color="#7b4dff"/></linearGradient>
    <linearGradient id="g-gem-d" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8f63ff"/><stop offset="1" stop-color="#4b23c8"/></linearGradient>
    <linearGradient id="g-bolt" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff9df0"/><stop offset=".5" stop-color="#c46bff"/><stop offset="1" stop-color="#7c4dff"/></linearGradient>
    <linearGradient id="g-heart" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff7a8c"/><stop offset="1" stop-color="#e5304d"/></linearGradient>
    <linearGradient id="g-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe066"/><stop offset="1" stop-color="#f5a623"/></linearGradient>
    <linearGradient id="g-purple" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a77bff"/><stop offset="1" stop-color="#6a3df0"/></linearGradient>
    <linearGradient id="g-gift" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffc24d"/><stop offset="1" stop-color="#ff8a1f"/></linearGradient>
    <linearGradient id="g-chest" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7d62c9"/><stop offset="1" stop-color="#4a3790"/></linearGradient>
    <linearGradient id="g-shield" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8f63ff"/><stop offset="1" stop-color="#5a2fe0"/></linearGradient>
  </defs></svg>`;
  document.body.appendChild(d.firstChild);
}

export const I = {
  // навигация и интерфейс (контурные)
  home: S('<path d="M4 11.2 12 4.5l8 6.7V19a1.5 1.5 0 0 1-1.5 1.5H15v-5.5H9v5.5H5.5A1.5 1.5 0 0 1 4 19z" fill="currentColor"/>'),
  book: S(L('M12 6.5C10.3 5.2 7.8 4.8 4 5v13c3.8-.2 6.3.3 8 1.5m0-13c1.7-1.3 4.2-1.7 8-1.5v13c-3.8-.2-6.3.3-8 1.5m0-13v13')),
  bookFill: S('<path d="M2.5 6.2c3.8-.6 6.9-.1 9.5 1.6v12.4c-2.6-1.6-5.7-2.1-9.5-1.6zM21.5 6.2c-3.8-.6-6.9-.1-9.5 1.6v12.4c2.6-1.6 5.7-2.1 9.5-1.6z" fill="currentColor"/>'),
  target: S(L('M12 21a9 9 0 1 1 9-9') + L('M12 17a5 5 0 1 1 5-5') + L('M12 12l7-7m-3-.5h3.5V8') + '<circle cx="12" cy="12" r="1.6" fill="currentColor"/>'),
  trophy: S(L('M8 4h8v5a4 4 0 0 1-8 0zM8 6H4.5c0 3 1.5 4.5 3.7 4.8M16 6h3.5c0 3-1.5 4.5-3.7 4.8M12 13v4m-4 3h8m-6-3h4')),
  user: S(L('M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20.5c.8-3.8 3.8-6 7.5-6s6.7 2.2 7.5 6')),
  lock: S('<rect x="5" y="10.5" width="14" height="10" rx="2.6" fill="currentColor"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="currentColor" stroke-width="2.4"/>'),
  headphones: S('<path d="M4 15v-3a8 8 0 0 1 16 0v3" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><rect x="3" y="13.5" width="5" height="7" rx="2.2" fill="currentColor"/><rect x="16" y="13.5" width="5" height="7" rx="2.2" fill="currentColor"/>'),
  star: S('<path d="M12 3.2l2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.5l6-.8z" fill="currentColor" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>'),
  starGold: S('<path d="M12 2.6l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17l-5.6 3 1.1-6.3-4.6-4.4 6.3-.9z" fill="url(#g-gold)" stroke="#e08a12" stroke-width=".8" stroke-linejoin="round"/><path d="M9.6 9.2l1.4-2.7" stroke="#fff6c2" stroke-width="1.3" stroke-linecap="round"/>'),
  mic: S('<rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor"/>' + L('M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21m-3.5 0h7')),
  pen: S(L('M4 20l1-4.5L15.5 5a2.1 2.1 0 0 1 3 3L8 18.5zM13.5 7l3 3')),
  close: S(L('M6 6l12 12M18 6L6 18', ' stroke-width="2.6"')),
  check: S(L('M5 12.5l4.5 4.5L19 7.5', ' stroke-width="2.8"')),
  chevR: S(L('M9 5l7 7-7 7', ' stroke-width="2.6"')),
  chevD: S(L('M6 9l6 6 6-6', ' stroke-width="2.6"')),
  back: S(L('M15 5l-7 7 7 7', ' stroke-width="2.6"')),
  plus: S(L('M12 5v14M5 12h14', ' stroke-width="2.8"')),
  play: S('<path d="M8 5.5v13a1 1 0 0 0 1.5.9l10.2-6.5a1 1 0 0 0 0-1.8L9.5 4.6A1 1 0 0 0 8 5.5z" fill="currentColor"/>'),
  speaker: S('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/>' + L('M15.5 9a4.2 4.2 0 0 1 0 6', ' class="w w1"') + L('M18.2 6.5a8 8 0 0 1 0 11', ' class="w w2"')),
  slow: S('<path d="M4 16c0-3.9 3.1-7 7-7s7 3.1 7 7z" fill="currentColor" opacity=".9"/><circle cx="19.5" cy="13" r="2.2" fill="currentColor"/><path d="M6 16v2.5M15 16v2.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M8 12.5l3 2 3-2" stroke="#1a1333" stroke-width="1.3" fill="none"/>'),
  bulb: S('<path d="M9 18h6m-5 3h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'),
  snow: S(L('M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.5 12 7l2.5-2.5M9.5 19.5 12 17l2.5 2.5')),
  cards: S('<rect x="3.5" y="6" width="12" height="15" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8.5 3h9a2.5 2.5 0 0 1 2.5 2.5V17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'),
  wallet: S('<rect x="3" y="6" width="18" height="13" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 9.5h13a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2H3" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="15.5" cy="12" r="1.2" fill="currentColor"/>'),
  gear: S(L('M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z') + L('M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z')),
  info: S(L('M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5') + '<circle cx="12" cy="7.8" r="1.3" fill="currentColor"/>'),
  repeat: S(L('M17 2.5l3 3-3 3M4 11v-1.5a4 4 0 0 1 4-4h12M7 21.5l-3-3 3-3M20 13v1.5a4 4 0 0 1-4 4H4')),
  synth: S('<rect x="5" y="7" width="14" height="11" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="9.5" cy="12.5" r="1.4" fill="currentColor"/><circle cx="14.5" cy="12.5" r="1.4" fill="currentColor"/>' + L('M12 7V4m-3 0h6')),
  // цветные (как в макете)
  flame: S('<path d="M12.2 2.5c.6 3-1.3 4.6-2.8 6.3C7.6 10.7 6 12.6 6 15.4 6 19 8.7 21.5 12 21.5s6-2.5 6-6.1c0-2.4-1-4.2-2.2-5.6-.3 1.4-1 2.4-2.1 2.9.6-3.7-.1-7.6-1.5-10.2z" fill="url(#g-flame)"/><path d="M12.4 12.2c1.6 1.4 2.6 2.9 2.6 4.6a3 3 0 0 1-6 0c0-1.5.8-2.6 1.9-3.6.2.9.7 1.4 1.3 1.6-.2-1-.2-1.8.2-2.6z" fill="url(#g-flame-in)"/>', '0 0 24 24', 'col'),
  gem: S('<path d="M12 2.5l8 4.6v9.8l-8 4.6-8-4.6V7.1z" fill="url(#g-gem)"/><path d="M12 2.5v9.5l8-4.9zM12 12l-8 4.9 8 4.6z" fill="url(#g-gem-d)" opacity=".85"/><path d="M12 12v9.5l8-4.6z" fill="#5a2fe0" opacity=".55"/><path d="M7.2 7.6l3.3-1.9" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".8"/>', '0 0 24 24', 'col'),
  bolt: S('<path d="M13.8 2.2 5 13.6h6l-1.5 8.2 9.5-12.2h-6.2z" fill="url(#g-bolt)" stroke="#e7a8ff" stroke-width=".6" stroke-linejoin="round"/>', '0 0 24 24', 'col'),
  heart: S('<path d="M12 20.5S3.5 15.3 3.5 9.2A4.6 4.6 0 0 1 12 6.9a4.6 4.6 0 0 1 8.5 2.3c0 6.1-8.5 11.3-8.5 11.3z" fill="url(#g-heart)"/><path d="M7 8.6a2.4 2.4 0 0 1 2.2-1.3" stroke="#ffd0d7" stroke-width="1.3" stroke-linecap="round" fill="none"/>', '0 0 24 24', 'col'),
  gift: S('<rect x="3.5" y="10" width="17" height="11" rx="2" fill="url(#g-gift)"/><rect x="2.5" y="7" width="19" height="4.5" rx="1.6" fill="#ffd36b"/><rect x="10.5" y="7" width="3" height="14" fill="#8b5cf6"/><path d="M12 7c-1.2-2.8-4.6-4-5.6-2.2-.9 1.7 2.4 2.4 5.6 2.2zm0 0c1.2-2.8 4.6-4 5.6-2.2.9 1.7-2.4 2.4-5.6 2.2z" fill="#a77bff" stroke="#7c4dff" stroke-width=".8"/>', '0 0 24 24', 'col'),
  calendar: S('<rect x="3" y="5" width="18" height="16" rx="3.5" fill="#efeaff"/><rect x="3" y="5" width="18" height="5" rx="2.5" fill="#b7a4ff"/><rect x="7" y="2.8" width="2.4" height="4.6" rx="1.2" fill="#4b3a8a"/><rect x="14.6" y="2.8" width="2.4" height="4.6" rx="1.2" fill="#4b3a8a"/><path d="M8.2 15l2.6 2.6 5-5" stroke="#3a2a7a" stroke-width="2.3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>', '0 0 24 24', 'col'),
  chest: S('<path d="M3 11h18v8.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="url(#g-chest)"/><path d="M3 11V9a6 6 0 0 1 6-6h6a6 6 0 0 1 6 6v2z" fill="#8c73d6"/><path d="M3 11h18" stroke="#f0b443" stroke-width="2"/><path d="M8 3.3V21.5M16 3.3V21.5" stroke="#f0b443" stroke-width="1.6" opacity=".9"/><rect x="9.6" y="9.2" width="4.8" height="5.6" rx="1.2" fill="#ffd76a" stroke="#c98a14" stroke-width=".8"/><circle cx="12" cy="11.6" r=".9" fill="#5a3a12"/>', '0 0 24 24', 'col'),
  shield: (t = 'N5') => `<svg class="ic col shield" viewBox="0 0 48 52" aria-hidden="true"><path d="M24 2 44 9.5v14.5c0 13-8.5 22-20 26C12.5 46 4 37 4 24V9.5z" fill="url(#g-shield)" stroke="#b79cff" stroke-width="2"/><path d="M24 7.5 39 13v11c0 10-6.4 17-15 20.2C15.4 41 9 34 9 24V13z" fill="none" stroke="#c9b2ff" stroke-width="1.2" opacity=".55"/><text x="24" y="31" text-anchor="middle" font-family="Nunito,system-ui" font-weight="900" font-size="16" fill="#fff">${t}</text></svg>`,
  kana: t => `<svg class="ic glyph" viewBox="0 0 24 24" aria-hidden="true"><text x="12" y="18.2" text-anchor="middle" font-size="17" font-weight="700" fill="currentColor" font-family="'M PLUS Rounded 1c','Hiragino Maru Gothic ProN','Noto Sans JP',sans-serif">${t}</text></svg>`,
  torii: S('<path d="M2.5 5.5q9.5-2.6 19 0v2.3h-19z" fill="currentColor"/><rect x="4.5" y="9.6" width="15" height="1.8" rx=".6" fill="currentColor"/><rect x="6" y="7.5" width="2.2" height="14" rx=".6" fill="currentColor"/><rect x="15.8" y="7.5" width="2.2" height="14" rx=".6" fill="currentColor"/>')
};
// Картинки, нарисованные ChatGPT (лежат в img/). Перекрывают SVG-версии выше.
export const IMG = (n, cls = '') => `<img class="ic img ${cls}" src="img/${n}.webp" alt="" draggable="false">`;
Object.assign(I, {
  flame: IMG('ic-flame'), gem: IMG('ic-gem'), bolt: IMG('ic-bolt'), heart: IMG('ic-heart'), gift: IMG('ic-gift'),
  calendar: IMG('ic-calendar'), chest: IMG('ic-chest'), starGold: IMG('ic-star'), shield: () => IMG('ic-shield', 'shield')
});
// светлые иконки
export const WI = n => IMG('wi-' + n, 'wi');
Object.assign(I, {
  home: WI('home'), book: WI('book'), bookFill: WI('book'), target: WI('target'), trophy: WI('trophy'), user: WI('user'),
  lock: WI('lock'), headphones: WI('headphones'), star: WI('star'), mic: WI('mic'), pen: WI('brush'), check: WI('check'),
  speaker: WI('speaker'), slow: WI('snail'), play: WI('play'), cards: WI('cards'), speech: WI('speech'),
  wallet: WI('wallet'), repeat: WI('repeat'), bulb: WI('bulb'), snow: WI('snow'), synth: WI('robot'), plus: WI('plus'),
  gear: WI('gear'), info: WI('info'), crown: WI('crown')
});
// иконка урока на карте по типу
export function lessonIcon(l) {
  const k = l.kind;
  if (k === 'lesson') return (l.g && l.g.length) ? I.kana('文') : I.bookFill;
  if (k === 'test') return I.star;
  if (k === 'kana') return I.kana(l.script === 'k' ? 'ア' : 'あ');
  if (k === 'kana-x') return I.kana('っ');
  if (k === 'kanji-basics') return I.pen;
  if (k === 'qa' || k === 'mock' || k === 'intro' || k === 'phrases') return k === 'mock' ? I.mic : k === 'intro' ? I.user : I.speech;
  if (k === 'x-listen') return I.headphones;
  if (k === 'x-read') return I.bookFill;
  if (k === 'x-write') return I.pen;
  return I.star;
}
