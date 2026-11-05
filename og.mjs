// Génère l'image de partage (og:image) 1200×630 au moment du build.
// Le téléphone vient de phone.js ; le texte est rendu avec la police Nunito (npm).
// Usage : node og.mjs [fichier de sortie]   (défaut : public/og.png)
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createRequire } from 'node:module';
import { Resvg } from '@resvg/resvg-js';

const out = process.argv[2] || 'public/og.png';
const require = createRequire(import.meta.url);

// Polices Nunito (fichiers TTF du paquet @expo-google-fonts/nunito)
const fontDir = dirname(require.resolve('@expo-google-fonts/nunito/package.json'));
const fontFiles = [];
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/Nunito_(600SemiBold|800ExtraBold|900Black)\.ttf$/.test(f)) fontFiles.push(p);
  }
})(fontDir);
if (fontFiles.length < 3) throw new Error('Polices Nunito introuvables dans ' + fontDir);

// Téléphone (même dessin que sur la page)
const window = {};
new Function('window', readFileSync(new URL('./phone.js', import.meta.url), 'utf8'))(window);
const phone = window.FonKidPhone.svg('rouge', { uid: 'og' })
  .replace('<svg ', '<svg x="640" y="72" width="540" height="489" ');

const INK = '#1F2430', RED = '#E5483B', MUTED = '#4A5262';
const title = (y, text, color) =>
  `<text x="64" y="${y}" font-family="Nunito" font-weight="900" font-size="58" letter-spacing="-0.6" fill="${color}">${text}</text>`;
const sub = (y, text) =>
  `<text x="64" y="${y}" font-family="Nunito" font-weight="600" font-size="26" fill="${MUTED}">${text}</text>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="bg" gradientUnits="userSpaceOnUse" cx="960" cy="252" r="840"
      gradientTransform="translate(960 252) scale(1 0.675) translate(-960 -252)">
      <stop offset="0" stop-color="#FFE3CF"/><stop offset="0.65" stop-color="#FBF6EE"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="#FBF6EE"/>
  <rect width="1200" height="630" fill="url(#bg)"/>

  <g transform="translate(64 66) scale(0.6875)">
    <circle cx="32" cy="32" r="30" fill="${RED}"/>
    <path d="M15 27c0-5 4-8 9-8h16c5 0 9 3 9 8l-1 4c-.5 2-2 3-4 3h-5c-2 0-3-1-3.5-3l-.5-2H29l-.5 2c-.5 2-1.5 3-3.5 3h-5c-2 0-3.5-1-4-3z" fill="#fff"/>
    <rect x="22" y="38" width="20" height="10" rx="4" fill="#fff" opacity=".9"/>
  </g>
  <text x="118" y="100" font-family="Nunito" font-weight="900" font-size="36" letter-spacing="-0.5" fill="${INK}">FonKid</text>

  ${title(190, 'Le premier', INK)}
  ${title(251, 'téléphone de vos', INK)}
  ${title(312, 'enfants.', INK)}
  ${title(373, 'Sans écran.', RED)}

  ${sub(432, 'Ils appellent leurs copains et leurs')}
  ${sub(466, 'grands-parents. Vous choisissez qui, et quand.')}

  <rect x="64" y="500" width="286" height="58" rx="29" fill="${INK}"/>
  <text x="207" y="537" text-anchor="middle" font-family="Nunito" font-weight="800" font-size="24" fill="#FFFFFF">Réservation gratuite</text>

  ${phone}
</svg>`;

const png = new Resvg(svg, {
  fitTo: { mode: 'width', value: 1200 },
  font: { fontFiles, loadSystemFonts: false, defaultFontFamily: 'Nunito' },
}).render().asPng();
writeFileSync(out, png);
console.log(`${out} : ${(png.length / 1024).toFixed(0)} Ko`);
