/* FonKid — illustration vectorielle du téléphone et de ses coques.
   fonkidSVG(styleId, { uid, ring }) renvoie le code SVG d'un téléphone habillé. */
(function (global) {
  'use strict';

  var STYLES = {
    rouge:     { shell: '#E5483B', dark: '#B7352A', cord: '#B7352A', face: '#FFF8EE', key: '#F3E7D6', ink: '#3A2A22' },
    glacier:   { shell: '#4AA3DF', dark: '#2B7DB6', cord: '#2B7DB6', face: '#F5FBFF', key: '#E1EEF7', ink: '#1F3346' },
    sapin:     { shell: '#2F8A68', dark: '#1E6A4E', cord: '#1E6A4E', face: '#F6FBF7', key: '#E2EFE7', ink: '#1B3328' },
    soleil:    { shell: '#F4B731', dark: '#CC8F12', cord: '#CC8F12', face: '#FFFBF0', key: '#F5EAD0', ink: '#3B2C10' },
    lilas:     { shell: '#A88BDD', dark: '#8065BC', cord: '#8065BC', face: '#FBF8FF', key: '#ECE4F8', ink: '#2E2442' },
    nuit:      { shell: '#2A3344', dark: '#171D29', cord: '#171D29', face: '#EEF1F5', key: '#DCE2EA', ink: '#1A2130' },
    edelweiss: { shell: '#2F8A68', dark: '#1E6A4E', cord: '#1E6A4E', face: '#F6FBF7', key: '#E2EFE7', ink: '#1B3328', pattern: 'edelweiss' },
    vache:     { shell: '#FBFAF6', dark: '#D9D5CA', cord: '#3A3A3A', face: '#FFFFFF', key: '#EFEDE6', ink: '#2B2B2B', pattern: 'vache', wave: '#3A3A3A' },
    etoiles:   { shell: '#1F3B6E', dark: '#132650', cord: '#132650', face: '#F3F6FC', key: '#DFE6F3', ink: '#152443', pattern: 'etoiles' },
    vintage:   { shell: '#E9DFC8', dark: '#C9B996', cord: '#B9A67D', face: '#F7F1E3', key: '#E7DCC3', ink: '#4A3B22', rotary: true, wave: '#A8936A' },
    perso:     { shell: '#FFFFFF', dark: '#DEDBD3', cord: '#F08A3E', face: '#FFFFFF', key: '#F1EFEA', ink: '#2B2B2B', pattern: 'dessin', wave: '#F08A3E' }
  };

  var ORDER = ['rouge', 'glacier', 'sapin', 'soleil', 'lilas', 'nuit', 'edelweiss', 'vache', 'etoiles', 'vintage', 'perso'];

  var BASE = 'M122,150 L298,150 Q316,150 320,167 L360,312 Q364,330 346,330 L74,330 Q56,330 60,312 L100,167 Q104,150 122,150 Z';
  var HANDSET = 'M110,98 L310,98 C326,98 338,106 336,120 L332,136 C330,144 324,148 314,148 L282,148 C272,148 268,142 266,136 L262,126 L158,126 L154,136 C152,142 148,148 138,148 L106,148 C96,148 90,144 88,136 L84,120 C82,106 94,98 110,98 Z';

  function cordPath() {
    // Cordon en spirale : cycloïde le long d'un axe, puis petite queue vers le socle.
    var p0 = [88, 144], p1 = [44, 296];
    var dx = p1[0] - p0[0], dy = p1[1] - p0[1];
    var len = Math.sqrt(dx * dx + dy * dy);
    var d = [dx / len, dy / len], n = [-d[1], d[0]];
    var loops = 12, R = 7, steps = 420, pts = [];
    for (var i = 0; i <= steps; i++) {
      var t = i / steps, th = 2 * Math.PI * loops * t;
      var gx = p0[0] + dx * t, gy = p0[1] + dy * t;
      var ox = R * Math.cos(th) * n[0] + R * 0.85 * Math.sin(th) * d[0];
      var oy = R * Math.cos(th) * n[1] + R * 0.85 * Math.sin(th) * d[1];
      pts.push((i ? 'L' : 'M') + (gx + ox - R * n[0]).toFixed(1) + ',' + (gy + oy - R * n[1]).toFixed(1));
    }
    return pts.join(' ') + ' Q40,316 64,308';
  }
  var CORD = cordPath();

  function star(cx, cy, R, r) {
    var s = '';
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? r : R;
      s += (i ? 'L' : 'M') + (cx + rad * Math.cos(a)).toFixed(1) + ',' + (cy + rad * Math.sin(a)).toFixed(1);
    }
    return s + 'Z';
  }

  function flower(x, y, s) {
    var out = '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">';
    for (var k = 0; k < 6; k++) {
      out += '<ellipse cx="0" cy="-5.2" rx="2.5" ry="5" fill="#FFFFFF" transform="rotate(' + k * 60 + ')"/>';
    }
    return out + '<circle r="2.6" fill="#F4C542"/></g>';
  }

  function patternDefs(kind, u) {
    if (kind === 'edelweiss') {
      return '<pattern id="pat-' + u + '" width="46" height="46" patternUnits="userSpaceOnUse">' +
        flower(12, 12, 1) + flower(35, 33, 0.8) + '</pattern>';
    }
    if (kind === 'vache') {
      return '<pattern id="pat-' + u + '" width="120" height="110" patternUnits="userSpaceOnUse">' +
        '<path fill="#2B2B2B" d="M18,14 C30,4 52,10 50,26 C48,40 30,44 20,36 C10,30 8,22 18,14 Z"/>' +
        '<path fill="#2B2B2B" d="M78,40 C92,30 112,42 106,58 C100,74 80,72 72,62 C66,54 68,46 78,40 Z"/>' +
        '<path fill="#2B2B2B" d="M30,72 C40,64 58,70 56,84 C54,98 36,100 28,92 C22,86 22,78 30,72 Z"/></pattern>';
    }
    if (kind === 'etoiles') {
      return '<pattern id="pat-' + u + '" width="40" height="40" patternUnits="userSpaceOnUse">' +
        '<path fill="#F4C542" d="' + star(10, 10, 5.2, 2.2) + '"/>' +
        '<path fill="#F4C542" d="' + star(30, 28, 3.6, 1.5) + '"/>' +
        '<circle cx="31" cy="8" r="1.1" fill="#FFFFFF" opacity=".75"/><circle cx="8" cy="31" r="1.1" fill="#FFFFFF" opacity=".75"/></pattern>';
    }
    return '';
  }

  function drawing() {
    // « Coque perso » : un dessin d'enfant imprimé sur la coque.
    var c = 'fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="3.6"';
    return '<g>' +
      // soleil
      '<circle cx="114" cy="206" r="8" ' + c + ' stroke="#F4B731"/>' +
      '<path ' + c + ' stroke="#F4B731" d="M114,191 v-4 M114,221 v4 M99,206 h-4 M129,206 h4 M103,195 l-3,-3 M125,217 l3,3 M125,195 l3,-3 M103,217 l-3,3"/>' +
      // cœur
      '<path ' + c + ' stroke="#E5483B" d="M108,258 c-7,-9 -19,-2 -12,9 l12,12 l12,-12 c7,-11 -5,-18 -12,-9 z"/>' +
      // maison
      '<path ' + c + ' stroke="#4AA3DF" d="M296,214 l14,-14 l14,14 M300,210 v18 h20 v-18 M307,228 v-9 h6 v9"/>' +
      // arc-en-ciel
      '<path ' + c + ' stroke="#A88BDD" d="M296,284 a18,18 0 0 1 36,0"/>' +
      '<path ' + c + ' stroke="#2F8A68" d="M302,284 a12,12 0 0 1 24,0"/>' +
      '<path ' + c + ' stroke="#F08A3E" d="M308,284 a6,6 0 0 1 12,0"/>' +
      // petit nuage sur le haut du socle
      '<path ' + c + ' stroke="#4AA3DF" d="M190,166 q2,-8 10,-6 q4,-8 12,-2 q8,-2 8,8 z"/>' +
      // gribouillis étoiles sur le combiné
      '<path ' + c + ' stroke="#F08A3E" d="' + star(132, 112, 7, 3) + '"/>' +
      '<path ' + c + ' stroke="#4AA3DF" d="M196,112 c4,-8 12,-8 16,0 c4,8 12,8 16,0"/>' +
      '<path ' + c + ' stroke="#E5483B" d="M288,106 c-5,-6 -14,-1 -9,6 l9,9 l9,-9 c5,-7 -4,-12 -9,-6 z"/>' +
      '</g>';
  }

  var AVATARS = [
    { bg: '#FDE2A7', skin: '#F2C9A5', hair: '#7A4B2A' },
    { bg: '#CDE7F5', skin: '#E3B48F', hair: '#2E2420' },
    { bg: '#D6F0DF', skin: '#B9825F', hair: '#1E1A17' },
    { bg: '#F7D6E8', skin: '#F4D3BA', hair: '#D69A3A' }
  ];

  function keypad(s, u) {
    var out = '';
    // 4 touches photo
    var px = [160, 193, 227, 260];
    for (var i = 0; i < 4; i++) {
      var a = AVATARS[i], x = px[i], y = 194;
      out += '<clipPath id="av' + i + '-' + u + '"><circle cx="' + x + '" cy="' + y + '" r="12"/></clipPath>' +
        '<circle cx="' + x + '" cy="' + y + '" r="14" fill="' + s.key + '"/>' +
        '<g clip-path="url(#av' + i + '-' + u + ')"><circle cx="' + x + '" cy="' + y + '" r="12" fill="' + a.bg + '"/>' +
        '<ellipse cx="' + x + '" cy="' + (y + 12) + '" rx="9" ry="7" fill="' + a.hair + '" opacity=".85"/>' +
        '<circle cx="' + x + '" cy="' + (y - 1) + '" r="5.6" fill="' + a.skin + '"/>' +
        '<path d="M' + (x - 5.8) + ',' + (y - 2) + ' q5.8,-7.5 11.6,0 q-2,-3 -5.8,-3.6 q-3.8,.6 -5.8,3.6z" fill="' + a.hair + '"/></g>';
    }
    // clavier 3 x 4
    var keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];
    var kx = [176, 210, 244], ky = [228, 248, 268, 288];
    for (var k = 0; k < 12; k++) {
      var cx = kx[k % 3], cy = ky[Math.floor(k / 3)];
      out += '<circle cx="' + cx + '" cy="' + cy + '" r="8.6" fill="' + s.key + '"/>' +
        '<text x="' + cx + '" y="' + (cy + 3.2) + '" text-anchor="middle" font-family="ui-rounded, Nunito, system-ui, sans-serif" font-size="9" font-weight="800" fill="' + s.ink + '">' + keys[k] + '</text>';
    }
    // colonne droite : voyant, Allô Histoires, Correspondant
    out += '<circle cx="268" cy="226" r="6" fill="#39C16C" opacity=".22"/><circle cx="268" cy="226" r="3.4" fill="#39C16C"/>' +
      '<circle cx="268" cy="252" r="9.6" fill="#F4B731"/>' +
      '<path d="M262,248 q3,-1.6 6,0 v8 q-3,-1.6 -6,0 z M268,248 q3,-1.6 6,0 v8 q-3,-1.6 -6,0 z" fill="#FFFFFF"/>' +
      '<circle cx="268" cy="280" r="9.6" fill="#4AA3DF"/>' +
      '<text x="268" y="283.4" text-anchor="middle" font-family="ui-rounded, Nunito, system-ui, sans-serif" font-size="8.5" font-weight="800" fill="#FFFFFF">Aa</text>';
    // grille du haut-parleur
    for (var r = 0; r < 5; r++) {
      out += '<circle cx="148" cy="' + (228 + r * 15) + '" r="1.7" fill="' + s.ink + '" opacity=".22"/>' +
        '<circle cx="156" cy="' + (235 + r * 15) + '" r="1.7" fill="' + s.ink + '" opacity=".22"/>';
    }
    return out;
  }

  function rotary(s) {
    var out = '<circle cx="210" cy="244" r="58" fill="' + s.key + '" stroke="' + s.dark + '" stroke-width="2"/>';
    for (var i = 0; i < 10; i++) {
      var a = (-60 - i * 27) * Math.PI / 180;
      var x = 210 + 40 * Math.cos(a), y = 244 + 40 * Math.sin(a);
      out += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="8.2" fill="' + s.face + '" stroke="' + s.dark + '" stroke-width="1.2"/>' +
        '<text x="' + x.toFixed(1) + '" y="' + (y + 3).toFixed(1) + '" text-anchor="middle" font-family="Georgia, serif" font-size="8.5" font-weight="700" fill="' + s.ink + '">' + ((i + 1) % 10) + '</text>';
    }
    out += '<circle cx="210" cy="244" r="19" fill="' + s.face + '" stroke="' + s.dark + '" stroke-width="1.2"/>' +
      '<text x="210" y="247.5" text-anchor="middle" font-family="Georgia, serif" font-size="9" font-style="italic" fill="' + s.ink + '">FonKid</text>' +
      '<path d="M258,276 l10,10" stroke="' + s.dark + '" stroke-width="4" stroke-linecap="round"/>';
    return out;
  }

  function fonkidSVG(styleId, opts) {
    opts = opts || {};
    var s = STYLES[styleId] || STYLES.rouge;
    var u = (opts.uid || styleId) + '-' + Math.random().toString(36).slice(2, 7);
    var pat = s.pattern && s.pattern !== 'dessin' ? patternDefs(s.pattern, u) : '';
    var ring = opts.ring ? ' fk-ringing' : '';
    var title = opts.title ? '<title>' + opts.title + '</title>' : '';
    var svg = '<svg class="fk-phone' + ring + '" viewBox="0 0 420 380" xmlns="http://www.w3.org/2000/svg" role="img"' +
      (opts.title ? ' aria-label="' + opts.title + '"' : ' aria-hidden="true"') + '>' + title +
      '<defs>' +
      '<linearGradient id="hl-' + u + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".38"/><stop offset=".55" stop-color="#FFFFFF" stop-opacity="0"/></linearGradient>' +
      '<clipPath id="cb-' + u + '"><path d="' + BASE + '"/></clipPath>' +
      '<clipPath id="ch-' + u + '"><path d="' + HANDSET + '"/></clipPath>' + pat +
      '</defs>' +
      '<ellipse cx="210" cy="340" rx="156" ry="13" fill="#1F2430" opacity=".10"/>' +
      '<path d="' + CORD + '" fill="none" stroke="' + s.cord + '" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>' +
      // socle
      '<path d="' + BASE + '" fill="' + s.shell + '"/>' +
      (pat ? '<path d="' + BASE + '" fill="url(#pat-' + u + ')"/>' : '') +
      (s.pattern === 'dessin' ? '<g clip-path="url(#cb-' + u + ')">' + drawing() + '</g>' : '') +
      '<rect x="40" y="316" width="340" height="20" fill="' + s.dark + '" clip-path="url(#cb-' + u + ')"/>' +
      '<path d="' + BASE + '" fill="url(#hl-' + u + ')"/>' +
      (s.pattern === 'dessin' || s.pattern === 'vache' ? '<path d="' + BASE + '" fill="none" stroke="' + s.dark + '" stroke-width="2"/>' : '') +
      // façade
      '<rect x="136" y="172" width="148" height="142" rx="20" fill="' + s.face + '"/>' +
      '<rect x="136" y="172" width="148" height="142" rx="20" fill="none" stroke="' + s.dark + '" stroke-opacity=".35" stroke-width="1.5"/>' +
      (s.rotary ? rotary(s) : keypad(s, u)) +
      // berceau
      '<rect x="100" y="140" width="52" height="16" rx="6" fill="' + s.dark + '"/>' +
      '<rect x="268" y="140" width="52" height="16" rx="6" fill="' + s.dark + '"/>' +
      // combiné
      '<g class="fk-handset">' +
      '<path d="' + HANDSET + '" fill="' + s.shell + '"/>' +
      (pat ? '<path d="' + HANDSET + '" fill="url(#pat-' + u + ')"/>' : '') +
      '<path d="' + HANDSET + '" fill="url(#hl-' + u + ')"/>' +
      (s.pattern === 'dessin' || s.pattern === 'vache' ? '<path d="' + HANDSET + '" fill="none" stroke="' + s.dark + '" stroke-width="2"/>' : '') +
      '<path d="M112,106 L308,106" stroke="#FFFFFF" stroke-opacity=".45" stroke-width="5" stroke-linecap="round"/>' +
      '</g>' +
      // ondes de sonnerie
      '<g class="fk-waves" fill="none" stroke="' + (s.wave || s.dark) + '" stroke-width="3.2" stroke-linecap="round">' +
      '<path d="M70,108 q-10,-14 2,-28"/><path d="M56,114 q-16,-20 2,-42"/>' +
      '<path d="M350,108 q10,-14 -2,-28"/><path d="M364,114 q16,-20 -2,-42"/></g>' +
      '</svg>';
    return svg;
  }

  global.FonKidPhone = { STYLES: STYLES, ORDER: ORDER, svg: fonkidSVG };
})(window);
