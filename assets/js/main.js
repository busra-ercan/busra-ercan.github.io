(function () {
  'use strict';

  var root = document.documentElement;

  /* ---- tercihleri oku (gizli sekmede erişim hata verebilir) ---- */
  function read(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function write(key, val) {
    try { localStorage.setItem(key, val); } catch (e) { /* önemsiz */ }
  }


  /* ---- sayı biçimi: TR 0,918 / 2.326  ->  EN 0.918 / 2,326 ---- */
  var numNodes = [];
  (function collect() {
    var scope = document.querySelectorAll('.readout .v, .metrics .v, svg .val, svg .ax');
    Array.prototype.forEach.call(scope, function (el) {
      var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
      var n;
      while ((n = walker.nextNode())) {
        if (/\d/.test(n.nodeValue)) numNodes.push({ node: n, tr: n.nodeValue });
      }
    });
  })();

  function groupEn(raw) {
    var parts = raw.replace(/\./g, '').split(',');
    var whole = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.length > 1 ? whole + '.' + parts.slice(1).join('') : whole;
  }
  function toEn(text) {
    // başında rakam olmayan ondalık: ",676" -> ".676"
    text = text.replace(/(^|[^\d]),(\d)/g, '$1.$2');
    return text.replace(/%\s*(\d[\d.,]*)|(\d[\d.,]*)/g, function (m, pct, plain) {
      return pct !== undefined ? groupEn(pct) + '%' : groupEn(plain);
    });
  }
  function applyNumbers(lang) {
    numNodes.forEach(function (rec) {
      rec.node.nodeValue = lang === 'en' ? toEn(rec.tr) : rec.tr;
    });
  }

  /* ---- dil ---- */
  var langBtn = document.getElementById('lang');
  function setLang(lang) {
    root.setAttribute('data-lang', lang);
    root.setAttribute('lang', lang);
    langBtn.textContent = lang === 'tr' ? 'EN' : 'TR';
    langBtn.setAttribute('aria-label', lang === 'tr' ? 'Switch to English' : "Türkçe'ye geç");
    applyNumbers(lang);
  }
  var urlLang = new URLSearchParams(location.search).get('lang');
  setLang(urlLang === 'en' || urlLang === 'tr' ? urlLang : (read('lang') || 'tr'));
  langBtn.addEventListener('click', function () {
    var next = root.getAttribute('data-lang') === 'tr' ? 'en' : 'tr';
    setLang(next);
    write('lang', next);
  });

  /* ---- tema ---- */
  var themeBtn = document.getElementById('theme');
  var stored = read('theme');
  if (stored === 'light' || stored === 'dark') root.setAttribute('data-theme', stored);
  themeBtn.addEventListener('click', function () {
    var dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var current = root.getAttribute('data-theme') || (dark ? 'dark' : 'light');
    var next = current === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    write('theme', next);
  });

  /* ---- grafik ipuçları ---- */
  var tip = document.getElementById('tip');
  var active = null;

  function tipText(el) {
    var en = el.getAttribute('data-tip-en');
    return (root.getAttribute('data-lang') === 'en' && en) ? en : el.getAttribute('data-tip');
  }

  function show(el, x, y) {
    tip.textContent = tipText(el);
    tip.classList.add('on');
    var box = tip.getBoundingClientRect();
    var left = Math.min(Math.max(8, x - box.width / 2), window.innerWidth - box.width - 8);
    var top = y - box.height - 12;
    if (top < 8) top = y + 18;
    tip.style.left = left + 'px';
    tip.style.top = top + 'px';
  }
  function hide() {
    tip.classList.remove('on');
    active = null;
  }

  document.addEventListener('pointermove', function (e) {
    var el = e.target.closest ? e.target.closest('[data-tip]') : null;
    if (el) {
      active = el;
      show(el, e.clientX, e.clientY);
    } else if (active) {
      hide();
    }
  }, { passive: true });

  document.addEventListener('pointerleave', hide);
  window.addEventListener('scroll', function () { if (active) hide(); }, { passive: true });

  /* klavyeyle gezenler için: odaklanılabilir işaretler */
  Array.prototype.forEach.call(document.querySelectorAll('[data-tip]'), function (el) {
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', el.getAttribute('data-tip'));
    el.addEventListener('focus', function () {
      var b = el.getBoundingClientRect();
      show(el, b.left + b.width / 2, b.top);
    });
    el.addEventListener('blur', hide);
  });
})();
