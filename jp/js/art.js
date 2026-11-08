// Иллюстрации: лисёнок-учитель, ночная сцена пути, картинка модуля. Всё нарисовано в SVG, без файлов.
export function artDefs() {
  if (document.getElementById('art-defs')) return;
  const d = document.createElement('div');
  d.innerHTML = `<svg id="art-defs" width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
    <linearGradient id="a-fur" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e3dafc"/></linearGradient>
    <linearGradient id="a-fur2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3eeff"/><stop offset="1" stop-color="#bfaef0"/></linearGradient>
    <linearGradient id="a-ear" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a87bf2"/><stop offset="1" stop-color="#d9b6ff"/></linearGradient>
    <radialGradient id="a-lens" cx=".35" cy=".35" r=".8"><stop offset="0" stop-color="#d6c2ff"/><stop offset=".45" stop-color="#8a5cf5"/><stop offset="1" stop-color="#3f1fa8"/></radialGradient>
    <linearGradient id="a-scarf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8f63ff"/><stop offset="1" stop-color="#5a2fe0"/></linearGradient>
    <linearGradient id="a-rock" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2d6a"/><stop offset="1" stop-color="#1a1236"/></linearGradient>
    <radialGradient id="a-lamp" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd7a8"/><stop offset=".55" stop-color="#ff8aa8"/><stop offset="1" stop-color="#ff6aa0" stop-opacity="0"/></radialGradient>
    <radialGradient id="a-glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff9ab8" stop-opacity=".55"/><stop offset="1" stop-color="#ff9ab8" stop-opacity="0"/></radialGradient>
    <linearGradient id="a-fuji" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9a6ff"/><stop offset="1" stop-color="#6d55c9"/></linearGradient>
    <linearGradient id="a-hero" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2a1f63" stop-opacity="0"/><stop offset=".45" stop-color="#4b36a8" stop-opacity=".2"/><stop offset="1" stop-color="#8d6cf0" stop-opacity=".7"/></linearGradient>
  </defs></svg>`;
  document.body.appendChild(d.firstChild);
}

/* ---------- лисёнок ---------- */
const EYES = {
  happy: '<path d="M57 68q6.5-7.5 13 0M90 68q6.5-7.5 13 0" stroke="#2b2148" stroke-width="3.4" fill="none" stroke-linecap="round"/>',
  idle: '<g class="fox-eyes"><ellipse class="eye" cx="63.5" cy="67" rx="4.6" ry="5.6" fill="#2b2148"/><ellipse class="eye" cx="96.5" cy="67" rx="4.6" ry="5.6" fill="#2b2148"/><circle cx="65" cy="65" r="1.6" fill="#fff"/><circle cx="98" cy="65" r="1.6" fill="#fff"/></g>',
  sad: '<path d="M57 70q6.5 5 13 0M90 70q6.5 5 13 0" stroke="#2b2148" stroke-width="3.2" fill="none" stroke-linecap="round"/><path d="M58 59l10 3M102 59l-10 3" stroke="#8d7bc7" stroke-width="2.4" stroke-linecap="round"/>',
  sleepy: '<path d="M57 69h13M90 69h13" stroke="#2b2148" stroke-width="3.2" stroke-linecap="round"/>'
};
const MOUTH = {
  happy: '<path d="M73.5 83.5q6.5 8 13 0z" fill="#7a2f57"/><path d="M76.5 86.2q3.5 2.6 7 0" fill="#ff8fb3"/>',
  idle: '<path d="M74 83.5q3 3.2 6 0q3 3.2 6 0" stroke="#2b2148" stroke-width="2" fill="none" stroke-linecap="round"/>',
  sad: '<path d="M75 87q5-4 10 0" stroke="#2b2148" stroke-width="2" fill="none" stroke-linecap="round"/>',
  sleepy: '<path d="M77 84.5q3 2 6 0" stroke="#2b2148" stroke-width="2" fill="none" stroke-linecap="round"/>'
};
// Лисёнок нарисован ChatGPT (img/fox-*.webp); SVG-версия ниже осталась запасной.
const FOX_IMG = { happy: 'fox-happy', idle: 'fox-wave', cheer: 'fox-happy', sad: 'fox-happy', sleepy: 'fox-sleep' };
export function foxSVG(mood = 'happy', opt = {}) {
  const n = opt.star ? 'fox-star' : FOX_IMG[mood] || 'fox-happy';
  return `<img class="fox-svg fox-img m-${mood}" src="img/${n}.webp" alt="" draggable="false">`;
}
export function foxVector(mood = 'happy', opt = {}) {
  const m = EYES[mood] ? mood : 'happy';
  const star = opt.star ? '<g class="fox-star"><path d="M80 98l7.6 15.4 17 2.5-12.3 12 2.9 16.9L80 136.8l-15.2 8 2.9-16.9-12.3-12 17-2.5z" fill="url(#g-gold)" stroke="#e08a12" stroke-width="1.4" stroke-linejoin="round"/><path d="M74 112l3-6" stroke="#fff6c2" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="60" cy="122" rx="8" ry="6.5" fill="url(#a-fur)"/><ellipse cx="100" cy="122" rx="8" ry="6.5" fill="url(#a-fur)"/></g>' : '';
  return `<svg class="fox-svg" viewBox="0 0 160 160" aria-hidden="true">
  <g class="fox-tail"><path d="M104 132c30 2 46-24 36-52-3 16-13 25-27 29z" fill="url(#a-fur2)"/><path d="M140 80c-1 8-4 14-9 18 4 1 8 0 11-3 2-5 1-10-2-15z" fill="#c4a6ff"/></g>
  <g class="fox-body"><ellipse cx="80" cy="122" rx="31" ry="26" fill="url(#a-fur2)"/><path d="M62 112q18 20 36 0q-4 26-18 30q-14-4-18-30z" fill="#fff"/>
   <ellipse cx="67" cy="145" rx="9" ry="6" fill="url(#a-fur)"/><ellipse cx="93" cy="145" rx="9" ry="6" fill="url(#a-fur)"/></g>
  <g class="fox-scarf"><path d="M50 98q30 16 60 0l-2 11q-28 14-56 0z" fill="url(#a-scarf)"/><path d="M93 106l12 20-10 3-8-19z" fill="url(#a-scarf)"/><path d="M56 104q24 9 48 0" stroke="#b79cff" stroke-width="1.5" fill="none" opacity=".6"/></g>
  ${star}
  <g class="fox-head">
   <path class="fox-ear l" d="M45 52 38 10l33 27z" fill="url(#a-fur2)"/><path d="M48.5 45 44 20l19 16z" fill="url(#a-ear)"/>
   <path class="fox-ear r" d="M115 52l7-42-33 27z" fill="url(#a-fur2)"/><path d="M111.5 45 116 20 97 36z" fill="url(#a-ear)"/>
   <path d="M34 72c0-26 20-40 46-40s46 14 46 40c0 6-2 11-5 15l6 6-12-1c-9 7-21 10-35 10s-26-3-35-10l-12 1 6-6c-3-4-5-9-5-15z" fill="url(#a-fur)"/>
   <path d="M44 78q36 30 72 0q-16 8-36 6q-20 2-36-6z" fill="#fff"/>
   <ellipse cx="53" cy="80" rx="7" ry="4" fill="#ff9fc5" opacity=".55"/><ellipse cx="107" cy="80" rx="7" ry="4" fill="#ff9fc5" opacity=".55"/>
   ${EYES[m]}
   <ellipse cx="80" cy="78.5" rx="4" ry="2.8" fill="#2b2148"/>
   ${MOUTH[m]}
   <g class="fox-goggles"><path d="M37 47q43-22 86 0" stroke="#33285c" stroke-width="7" fill="none" stroke-linecap="round"/>
    <circle cx="64" cy="41" r="13" fill="#2a2150"/><circle cx="96" cy="41" r="13" fill="#2a2150"/>
    <circle cx="64" cy="41" r="9.6" fill="url(#a-lens)"/><circle cx="96" cy="41" r="9.6" fill="url(#a-lens)"/>
    <path d="M58 37q3-4 7-4M90 37q3-4 7-4" stroke="#fff" stroke-width="2.2" stroke-linecap="round" fill="none" opacity=".85"/>
    <rect x="76" y="38" width="8" height="5" rx="2" fill="#2a2150"/></g>
  </g>
  <g class="fox-zzz"><text x="122" y="40">z</text><text x="132" y="28">z</text></g>
 </svg>`;
}

/* ---------- ночная сцена за путём ---------- */
const BRANCH = (w = 160) => `<svg viewBox="0 0 160 120" width="${w}" aria-hidden="true"><path d="M160 20C120 28 96 44 70 70 52 88 30 98 4 104" stroke="#2a1838" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M110 36c-6 18-4 34 6 48M76 66c10 8 22 12 36 10" stroke="#2a1838" stroke-width="4" fill="none" stroke-linecap="round"/>
 ${[[132, 24], [118, 34], [100, 46], [84, 60], [66, 74], [48, 88], [112, 60], [118, 82], [96, 76], [140, 40], [30, 96], [126, 52]].map(([x, y], i) => blossom(x, y, 7 + (i % 3) * 2, i)).join('')}</svg>`;
function blossom(x, y, r, i) {
  const c = ['#f7a8d0', '#e98bc6', '#ffc2e0', '#d679c0'][i % 4];
  let p = ''; for (let k = 0; k < 5; k++) { const a = k * 72 * Math.PI / 180; p += `<ellipse cx="${(x + Math.cos(a) * r * .55).toFixed(1)}" cy="${(y + Math.sin(a) * r * .55).toFixed(1)}" rx="${(r * .5).toFixed(1)}" ry="${(r * .38).toFixed(1)}" transform="rotate(${k * 72} ${(x + Math.cos(a) * r * .55).toFixed(1)} ${(y + Math.sin(a) * r * .55).toFixed(1)})" fill="${c}"/>`; }
  return p + `<circle cx="${x}" cy="${y}" r="${(r * .2).toFixed(1)}" fill="#fff0c2"/>`;
}
export const sceneParts = {
  clouds: `<svg viewBox="0 0 400 120" preserveAspectRatio="none" aria-hidden="true"><path d="M0 70q30-30 70-14 20-30 60-12 40-16 60 14 30-6 40 22H0z" fill="#2a1f55" opacity=".55"/><path d="M230 90q20-26 56-12 26-24 62-4 30-10 52 16v30H230z" fill="#2a1f55" opacity=".45"/></svg>`,
  pagoda: `<svg viewBox="0 0 120 220" aria-hidden="true"><g fill="#1f1640"><rect x="57" y="0" width="5" height="34"/>
   <path d="M18 64q42-12 84 0l-10-14q-32-8-64 0z"/><rect x="34" y="64" width="52" height="22"/><path d="M10 100q50-14 100 0l-12-16q-38-9-76 0z"/><rect x="30" y="100" width="60" height="26"/>
   <path d="M4 142q56-16 112 0l-14-18q-42-10-84 0z"/><rect x="26" y="142" width="68" height="30"/><path d="M0 186q60-17 120 0l-16-18q-44-10-88 0z"/><rect x="22" y="186" width="76" height="34"/></g>
   <g fill="#ffb37a" opacity=".55"><rect x="54" y="72" width="12" height="9" rx="1"/><rect x="54" y="150" width="12" height="10" rx="1"/></g></svg>`,
  lantern: `<svg viewBox="0 0 120 200" aria-hidden="true"><circle cx="60" cy="88" r="60" fill="url(#a-glow)"/><g fill="#271c4a">
   <path d="M18 54h84l-14-16H32z"/><path d="M40 38h40l-8-10H48z"/><circle cx="60" cy="24" r="5"/><rect x="30" y="54" width="60" height="8" rx="2"/>
   <rect x="34" y="62" width="10" height="44"/><rect x="76" y="62" width="10" height="44"/><rect x="26" y="104" width="68" height="10" rx="3"/>
   <rect x="48" y="114" width="24" height="56"/><rect x="30" y="168" width="60" height="14" rx="4"/><rect x="22" y="182" width="76" height="14" rx="4"/></g>
   <rect x="44" y="64" width="32" height="40" fill="url(#a-lamp)"/><rect x="48" y="68" width="24" height="32" rx="3" fill="#ffc9a8" opacity=".9"/></svg>`,
  branch: BRANCH,
  rockFox: () => `<div class="rock-fox"><div class="rf-fox">${foxSVG('happy')}</div><svg class="rf-rock" viewBox="0 0 200 80" aria-hidden="true"><path d="M10 80c6-30 30-52 66-56 22-2 40 6 58 2 28-6 52 12 60 54z" fill="url(#a-rock)"/><path d="M40 40q30-14 60-10" stroke="#5a4796" stroke-width="3" fill="none" opacity=".5"/></svg></div>`,
  bushes: `<svg viewBox="0 0 400 90" preserveAspectRatio="none" aria-hidden="true"><path d="M0 90V54q22-30 52-14 16-26 46-10 26-20 54 4 30-22 62 0 24-16 48 6 30-24 66-2 36-20 72 8V90z" fill="#150f2c"/></svg>`,
  hills: `<svg viewBox="0 0 400 140" preserveAspectRatio="none" aria-hidden="true"><path d="M0 140V90L60 40l50 40 70-60 80 70 60-30 80 50v30z" fill="#1d1540" opacity=".7"/></svg>`
};

/* ---------- картинка модуля: Фудзи, тории, сакура ---------- */
export function heroArt() {
  return `<svg class="hero-art" viewBox="0 0 220 120" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
   <rect width="220" height="120" fill="url(#a-hero)"/>
   <circle cx="150" cy="40" r="26" fill="#ffd6f0" opacity=".12"/>
   <path d="M40 120 120 34q10-8 20 0l80 86z" fill="url(#a-fuji)"/>
   <path d="M108 47l12-13q10-8 20 0l12 13-8 6-6-5-7 7-6-7-7 6z" fill="#fff"/>
   <path d="M0 112q60-18 110-6t110-4v18H0z" fill="#3a2a86" opacity=".9"/>
   <g fill="#2b1f62"><path d="M88 70q34-8 68 0v6H88z"/><rect x="94" y="80" width="56" height="4"/><rect x="99" y="76" width="6" height="44"/><rect x="139" y="76" width="6" height="44"/></g>
   <g transform="translate(140,-14) scale(.62)">${BRANCH(160).replace(/<\/?svg[^>]*>/g, '')}</g>
   <g fill="#ffb3d9"><ellipse cx="70" cy="30" rx="3" ry="2" transform="rotate(30 70 30)"/><ellipse cx="190" cy="96" rx="3" ry="2" transform="rotate(-20 190 96)"/><ellipse cx="60" cy="80" rx="2.6" ry="1.8"/></g>
  </svg>`;
}
