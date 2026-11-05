/* FonKid — logique de la page : langues, coques, réservation, questionnaire, partage */
(function () {
  'use strict';

  var SB_URL = 'https://srcvnqfgtazupuzwznrr.supabase.co';
  var SB_KEY = 'sb_publishable_YUwom0kvnMbpn8Rpug1FaA_1H35zkY_';
  var I18N = window.FK_I18N, CANTONS = window.FK_CANTONS, P = window.FonKidPhone;
  var LANGS = ['fr', 'de', 'en'];
  var LOCAL = /^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/.test(location.hostname) || location.protocol === 'file:';

  var state = { lang: 'fr', style: 'rouge', reservationId: null };

  var SWATCH_BG = {
    edelweiss: 'radial-gradient(circle at 30% 32%, #fff 0 3px, transparent 3.6px), radial-gradient(circle at 68% 66%, #fff 0 2.6px, transparent 3.2px), #2F8A68',
    vache: 'radial-gradient(circle at 30% 35%, #2B2B2B 0 6px, transparent 6.6px), radial-gradient(circle at 72% 70%, #2B2B2B 0 5px, transparent 5.6px), #FBFAF6',
    etoiles: 'radial-gradient(circle at 30% 30%, #F4C542 0 2.6px, transparent 3.2px), radial-gradient(circle at 68% 62%, #F4C542 0 2px, transparent 2.6px), radial-gradient(circle at 60% 25%, #fff 0 1px, transparent 1.5px), #1F3B6E',
    vintage: 'radial-gradient(circle, #F7F1E3 0 6px, #C9B996 6.5px 8px, #E9DFC8 8.5px)',
    perso: 'conic-gradient(#E5483B, #F4B731, #2F8A68, #4AA3DF, #A88BDD, #E5483B)'
  };

  // Pays déduit du fuseau horaire de l'appareil (plus fiable que la langue du navigateur :
  // beaucoup de Suisses romands ont un navigateur réglé en « français (France) »).
  var TZ_COUNTRY = { 'Europe/Zurich': 'CH', 'Europe/Paris': 'FR', 'Europe/Berlin': 'DE', 'Europe/Busingen': 'DE', 'Europe/Vienna': 'AT',
    'Europe/Brussels': 'BE', 'Europe/Luxembourg': 'LU', 'Europe/Rome': 'IT' };
  var KNOWN = ['CH', 'FR', 'DE', 'AT', 'BE', 'LU', 'IT'];

  // Numéros d'urgence affichés dans la FAQ selon le pays choisi
  var EMERGENCY = {
    CH: [['112', 'all'], ['117', 'police'], ['118', 'fire'], ['144', 'medical']],
    FR: [['112', 'all'], ['15', 'medical'], ['17', 'police'], ['18', 'fire']],
    DE: [['112', 'all'], ['110', 'police']],
    AT: [['112', 'all'], ['122', 'fire'], ['133', 'police'], ['144', 'medical']],
    BE: [['112', 'all'], ['101', 'police']],
    LU: [['112', 'all'], ['113', 'police']],
    IT: [['112', 'all'], ['113', 'police'], ['115', 'fire'], ['118', 'medical']]
  };

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function t(key) { var d = I18N[state.lang]; return (d && d[key] !== undefined) ? d[key] : (I18N.fr[key] || ''); }
  function dict() { return I18N[state.lang]; }
  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* stockage indisponible */ } }
  function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function sread(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function swrite(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* ignore */ } }

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    var b = new Uint8Array(16); (window.crypto || window.msCrypto).getRandomValues(b);
    b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
    var h = Array.prototype.map.call(b, function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
    return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
  }

  /* ---------- Source de trafic (pour l'étude de marché) ---------- */
  function captureSource() {
    var q = new URLSearchParams(location.search), parts = [];
    ['ref', 'src', 'utm_source', 'utm_medium', 'utm_campaign'].forEach(function (k) {
      var v = q.get(k); if (v) parts.push(k + '=' + v.slice(0, 40));
    });
    if (parts.length) swrite('fk-src', parts.join('|').slice(0, 120));
    if (document.referrer) {
      try {
        var h = new URL(document.referrer).hostname;
        if (h && h !== location.hostname) swrite('fk-ref', h.slice(0, 120));
      } catch (e) { /* ignore */ }
    }
  }

  /* ---------- Visites : une ligne par session, sans cookie ni adresse IP ---------- */
  function trackView() {
    if (LOCAL || sread('fk-seen')) return;
    swrite('fk-seen', '1');
    insert('fonkid_visits', {
      lang: state.lang,
      source: sread('fk-src') || null,
      referrer: sread('fk-ref') || null,
      country: guessCountry(),
      mobile: window.matchMedia ? window.matchMedia('(max-width: 640px)').matches : null
    }).catch(function () { /* statistiques facultatives */ });
  }

  function insert(table, row) {
    return fetch(SB_URL + '/rest/v1/' + table, {
      method: 'POST',
      headers: { apikey: SB_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(row)
    }).then(function (r) {
      if (!r.ok) return r.text().then(function (txt) { throw new Error('HTTP ' + r.status + ' ' + txt); });
    });
  }

  /* ---------- Langues ---------- */
  function detectLang() {
    var q = new URLSearchParams(location.search).get('lang');
    if (q && LANGS.indexOf(q) > -1) return q;
    var saved = read('fk-lang');
    if (saved && LANGS.indexOf(saved) > -1) return saved;
    var list = navigator.languages || [navigator.language || 'fr'];
    for (var i = 0; i < list.length; i++) {
      var l = (list[i] || '').slice(0, 2).toLowerCase();
      if (LANGS.indexOf(l) > -1) return l;
    }
    return 'fr';
  }

  function applyLang(lang) {
    state.lang = lang;
    document.documentElement.lang = lang;
    document.title = t('meta.title');
    var md = $('meta[name="description"]'); if (md) md.setAttribute('content', t('meta.desc'));
    $all('[data-i18n]').forEach(function (el) { el.textContent = t(el.getAttribute('data-i18n')); });
    $all('[data-i18n-html]').forEach(function (el) { el.innerHTML = t(el.getAttribute('data-i18n-html')); });
    $all('[data-i18n-ph]').forEach(function (el) { el.setAttribute('placeholder', t(el.getAttribute('data-i18n-ph'))); });
    $all('.lang button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === lang)); });
    buildSwatches();
    updateStyleUI();
    buildCountries();
    buildSurvey();
    updateShare();
  }

  /* ---------- Coques ---------- */
  function buildSwatches() {
    var box = $('#swatches'), names = dict().styles;
    box.innerHTML = '';
    P.ORDER.forEach(function (id) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'swatch sw-' + id;
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', String(id === state.style));
      b.setAttribute('aria-label', names[id]);
      b.title = names[id];
      b.style.background = SWATCH_BG[id] || P.STYLES[id].shell;
      b.addEventListener('click', function () { selectStyle(id); });
      box.appendChild(b);
    });
  }

  function selectStyle(id) {
    state.style = id;
    store('fk-style', id);
    $all('.swatch').forEach(function (b, i) { b.setAttribute('aria-checked', String(P.ORDER[i] === id)); });
    renderHero();
    updateStyleUI();
  }

  function renderHero() {
    $('#hero-phone').innerHTML = P.svg(state.style, { uid: 'hero', ring: true, title: 'FonKid · ' + dict().styles[state.style] });
  }

  function updateStyleUI() {
    var name = dict().styles[state.style];
    var extra = state.style === 'perso' ? t('picker.perso') : state.style === 'vintage' ? t('picker.vintage') : t('picker.extra');
    $('#picker-caption').innerHTML = '<b></b> · <span></span>';
    $('#picker-caption b').textContent = name;
    $('#picker-caption span').textContent = extra;
    $('#style-name').textContent = name;
    $('#style-dot').style.background = SWATCH_BG[state.style] || P.STYLES[state.style].shell;
  }

  /* ---------- Formulaire de réservation ---------- */
  function buildCountries() {
    var sel = $('#country'), cur = sel.value || guessCountry();
    sel.innerHTML = '';
    dict().countries.forEach(function (c) {
      var o = document.createElement('option'); o.value = c[0]; o.textContent = c[1]; sel.appendChild(o);
    });
    sel.value = cur;
    var cs = $('#canton');
    if (cs.options.length <= 1) {
      CANTONS.forEach(function (c) {
        var o = document.createElement('option'); o.value = c[0]; o.textContent = c[0] + ' – ' + c[1]; cs.appendChild(o);
      });
    }
    onCountry();
  }

  function guessCountry() {
    var langs = navigator.languages || [navigator.language || ''];
    var regions = langs.map(function (l) { return ((l || '').split('-')[1] || '').toUpperCase(); });
    if (regions.indexOf('CH') > -1) return 'CH';            // langue « …-CH » : visiteur suisse
    var tz = '';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { /* ancien navigateur */ }
    if (TZ_COUNTRY[tz]) return TZ_COUNTRY[tz];               // sinon le fuseau horaire de l'appareil
    if (KNOWN.indexOf(regions[0]) > -1) return regions[0];
    return tz ? 'XX' : 'CH';
  }

  function onCountry() {
    var ch = $('#country').value === 'CH';
    $('#canton-field').classList.toggle('hidden', !ch);
    $('#region-field').classList.toggle('hidden', ch);
    updateEmergency();
  }

  function updateEmergency() {
    var el = $('[data-i18n="faq.4.a"]'); if (!el) return;
    var c = $('#country').value || 'CH', list = EMERGENCY[c];
    var nums = (list || [['112', 'all']]).map(function (n) { return n[0] + ' (' + t('emerg.' + n[1]) + ')'; }).join(', ');
    if (!list) nums += ' ' + t('emerg.other');
    var name = list ? (dict().countries.filter(function (x) { return x[0] === c; })[0] || [c, c])[1] : t('emerg.elsewhere');
    el.textContent = t('faq.4.a').replace('{c}', name).replace('{n}', nums);
  }

  function setBusy(btn, busy, labelKey) {
    btn.disabled = busy;
    btn.textContent = busy ? t('form.sending') : t(labelKey);
  }

  function onReserve(e) {
    e.preventDefault();
    var f = e.target, err = $('#form-error'), btn = $('#reserve-btn');
    err.textContent = '';
    var email = (f.email.value || '').trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 254) { err.textContent = t('form.err.email'); f.email.focus(); return; }
    if (!f.consent.checked) { err.textContent = t('form.err.consent'); f.consent.focus(); return; }

    if (f.company.value) { showSurvey(); return; } // robot : on ne l'enregistre pas

    var country = f.country.value || 'CH';
    var region = country === 'CH' ? (f.canton.value || '') : (f.region.value || '').trim();
    var phones = parseInt((f.querySelector('input[name="phones"]:checked') || {}).value || '1', 10);
    var row = {
      id: uuid(),
      email: email,
      first_name: (f.first_name.value || '').trim().slice(0, 80) || null,
      country: country,
      region: region ? region.slice(0, 80) : null,
      phones: phones,
      style: state.style,
      lang: state.lang,
      consent: true,
      source: sread('fk-src') || null,
      referrer: sread('fk-ref') || null
    };
    setBusy(btn, true, 'form.submit');
    insert('fonkid_reservations', row).then(function () {
      state.reservationId = row.id;
      swrite('fk-res', row.id);
      showSurvey();
    }).catch(function () {
      err.textContent = t('form.err.network');
    }).then(function () { setBusy(btn, false, 'form.submit'); });
  }

  function showSurvey() {
    $('#reserve-form').classList.add('hidden');
    $('#survey-form').classList.remove('hidden');
    $('#reserver').scrollIntoView({ behavior: 'smooth', block: 'start' });
    var h = $('#survey-form h2'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  }

  /* ---------- Questionnaire ---------- */
  function chipGroup(boxId, name, items, multi) {
    var box = document.getElementById(boxId);
    var checked = $all('input:checked', box).map(function (i) { return i.value; });
    box.innerHTML = '';
    items.forEach(function (it) {
      var l = document.createElement('label'); l.className = 'chip';
      var i = document.createElement('input'); i.type = multi ? 'checkbox' : 'radio'; i.name = name; i.value = it[0];
      if (checked.indexOf(it[0]) > -1) i.checked = true;
      var s = document.createElement('span'); s.textContent = it[1];
      l.appendChild(i); l.appendChild(s); box.appendChild(l);
    });
  }

  function buildSurvey() {
    var d = dict();
    chipGroup('q-ages', 'kids_ages', d.ages, true);
    chipGroup('q-device', 'current_device', d.device, false);
    chipGroup('q-plan', 'smartphone_plan', d.plan, false);
    chipGroup('q-price', 'fair_price', d.price, false);
    chipGroup('q-langs', 'pen_pal_langs', d.langs, true);
    chipGroup('q-top', 'top_features', d.top, true);
    chipGroup('q-when', 'purchase_when', d.when, false);
    var yn = [['yes', t('yn.yes')], ['maybe', t('yn.maybe')], ['no', t('yn.no')]];
    $all('[data-yn]').forEach(function (box) {
      var name = box.getAttribute('data-yn');
      if (!box.id) box.id = 'yn-' + name;
      chipGroup(box.id, name, yn, false);
    });
    limitTop();
    togglePenPalLangs();
  }

  function limitTop() {
    var boxes = $all('#q-top input');
    var n = boxes.filter(function (i) { return i.checked; }).length;
    boxes.forEach(function (i) { i.disabled = !i.checked && n >= 3; });
  }

  function togglePenPalLangs() {
    var v = ($('input[name="opt_pen_pal"]:checked') || {}).value;
    $('#langs-field').classList.toggle('hidden', !(v === 'yes' || v === 'maybe'));
  }

  function vals(name) { return $all('input[name="' + name + '"]:checked').map(function (i) { return i.value; }); }
  function val(name) { var i = $('input[name="' + name + '"]:checked'); return i ? i.value : null; }

  function onSurvey(e) {
    e.preventDefault();
    var err = $('#survey-error'), btn = $('#survey-btn');
    err.textContent = '';
    var resId = state.reservationId || sread('fk-res');
    var penPal = val('opt_pen_pal');
    var row = {
      reservation_id: resId,
      kids_ages: vals('kids_ages'),
      current_device: val('current_device'),
      smartphone_plan: val('smartphone_plan'),
      fair_price: val('fair_price'),
      opt_calls: val('opt_calls'),
      opt_custom_shell: val('opt_custom_shell'),
      opt_pen_pal: penPal,
      pen_pal_langs: (penPal === 'yes' || penPal === 'maybe') ? vals('pen_pal_langs') : [],
      top_features: vals('top_features').slice(0, 3),
      purchase_when: val('purchase_when'),
      message: ($('#survey-form textarea').value || '').trim().slice(0, 2000) || null,
      lang: state.lang
    };
    ['kids_ages', 'pen_pal_langs', 'top_features'].forEach(function (k) { if (!row[k].length) row[k] = null; });
    var answered = Object.keys(row).some(function (k) { return k !== 'reservation_id' && k !== 'lang' && row[k]; });
    if (!resId || !answered) { showThanks(); return; }
    setBusy(btn, true, 'survey.submit');
    insert('fonkid_survey', row).then(showThanks).catch(function () {
      err.textContent = t('form.err.network');
    }).then(function () { setBusy(btn, false, 'survey.submit'); });
  }

  function showThanks() {
    $('#survey-form').classList.add('hidden');
    $('#thanks').classList.remove('hidden');
    $('#thanks-phone').innerHTML = P.svg(state.style, { uid: 'thanks', ring: true });
    $('#reserver').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ---------- Partage ---------- */
  function shareUrl(ref) { return location.origin + location.pathname + '?ref=' + ref + (state.lang !== 'fr' ? '&lang=' + state.lang : ''); }
  function updateShare() {
    var wa = $('#share-wa');
    if (wa) wa.href = 'https://wa.me/?text=' + encodeURIComponent(t('share.text') + shareUrl('wa'));
  }
  function onCopy() {
    var url = shareUrl('lien'), btn = $('#share-copy');
    function done() { btn.textContent = t('thanks.copied'); setTimeout(function () { btn.textContent = t('thanks.copy'); }, 2200); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done, function () { window.prompt('', url); });
    } else { window.prompt('', url); }
  }

  /* ---------- Démarrage ---------- */
  function init() {
    captureSource();
    var saved = read('fk-style');
    if (saved && P.STYLES[saved]) state.style = saved;
    renderHero();

    var mini = $('#mini-lineup');
    if (mini) mini.innerHTML = ['vache', 'etoiles', 'perso', 'soleil'].map(function (id) { return P.svg(id, { uid: 'mini' + id }); }).join('');
    var vin = $('#vintage-phone');
    if (vin) vin.innerHTML = P.svg('vintage', { uid: 'vin' });

    applyLang(detectLang());

    $all('.lang button').forEach(function (b) {
      b.addEventListener('click', function () { var l = b.getAttribute('data-lang'); store('fk-lang', l); applyLang(l); });
    });
    $('#country').addEventListener('change', onCountry);
    $('#reserve-form').addEventListener('submit', onReserve);
    $('#survey-form').addEventListener('submit', onSurvey);
    $('#survey-skip').addEventListener('click', showThanks);
    $('#survey-form').addEventListener('change', function (e) {
      if (e.target.name === 'top_features') limitTop();
      if (e.target.name === 'opt_pen_pal') togglePenPalLangs();
    });
    $('#share-copy').addEventListener('click', onCopy);
    var y = $('#year'); if (y) y.textContent = String(new Date().getFullYear());
    stickyCta();
    trackView();
  }

  function stickyCta() {
    var bar = $('#sticky-cta'), heroCta = $('.hero-actions'), form = $('#reserver');
    if (!bar || !heroCta || !form || !('IntersectionObserver' in window)) return;
    var vis = { hero: true, form: false };
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { vis[e.target === form ? 'form' : 'hero'] = e.isIntersecting; });
      var on = !vis.hero && !vis.form;
      bar.classList.toggle('on', on);
      bar.setAttribute('aria-hidden', on ? 'false' : 'true');
      bar.querySelector('a').setAttribute('tabindex', on ? '0' : '-1');
    });
    io.observe(heroCta); io.observe(form);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
