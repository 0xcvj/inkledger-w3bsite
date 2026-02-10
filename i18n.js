(function() {
  'use strict';

  var BASE_URL = 'https://inkledger.app';

  function detectLang() {
    var url = new URL(window.location.href);
    var param = url.searchParams.get('lang');
    if (param) return param.toLowerCase();
    var path = window.location.pathname || '/';
    if (path === '/nl' || path.indexOf('/nl/') === 0) return 'nl';
    return 'en';
  }

  function stripLang(path) {
    if (!path) return '/';
    if (path === '/nl' || path === '/nl/') return '/';
    if (path.indexOf('/nl/') === 0) return path.slice(3) || '/';
    return path;
  }

  function buildLangPath(path, lang) {
    var clean = stripLang(path);
    if (lang === 'nl') {
      return clean === '/' ? '/nl' : '/nl' + clean;
    }
    return clean;
  }

  function setMetaUrls(lang) {
    var canonical = document.querySelector('link[rel="canonical"]');
    var ogUrl = document.querySelector('meta[property="og:url"]');
    var path = buildLangPath(window.location.pathname, lang);
    var url = BASE_URL + path;
    if (canonical) canonical.setAttribute('href', url);
    if (ogUrl) ogUrl.setAttribute('content', url);

    var altEn = document.querySelector('link[rel="alternate"][hreflang="en"]');
    var altNl = document.querySelector('link[rel="alternate"][hreflang="nl"]');
    if (altEn) altEn.setAttribute('href', BASE_URL + buildLangPath(window.location.pathname, 'en'));
    if (altNl) altNl.setAttribute('href', BASE_URL + buildLangPath(window.location.pathname, 'nl'));
  }

  function localizeLinks(lang) {
    document.querySelectorAll('[data-localize-href]').forEach(function(el) {
      var target = el.getAttribute('data-localize-href');
      if (!target) return;
      var href;
      if (lang === 'nl') {
        href = target === '/' ? '/nl' : '/nl' + target;
      } else {
        href = target;
      }
      el.setAttribute('href', href);
    });
  }

  function mergeTranslations(data, page, lang) {
    if (!data || !data[lang]) return null;
    var dict = {};
    if (data[lang].common) Object.assign(dict, data[lang].common);
    if (page && data[lang][page]) Object.assign(dict, data[lang][page]);
    return dict;
  }

  function applyTranslations(dict) {
    if (!dict) return;
    window.__i18n = dict;
    window.t = function(key, fallback) {
      return dict[key] || fallback || null;
    };

    document.querySelectorAll('[data-i18n]').forEach(function(el) {
      var key = el.getAttribute('data-i18n');
      if (!key) return;
      var value = dict[key];
      if (!value) return;
      var attr = el.getAttribute('data-i18n-attr');
      var isHtml = el.hasAttribute('data-i18n-html');
      if (attr) {
        el.setAttribute(attr, value);
      } else if (isHtml) {
        el.innerHTML = value;
      } else {
        el.textContent = value;
      }
    });

    var schema = document.getElementById('schemaData');
    if (schema && dict['index.meta.schema_description']) {
      try {
        var json = JSON.parse(schema.textContent);
        json.description = dict['index.meta.schema_description'];
        schema.textContent = JSON.stringify(json, null, 2);
      } catch (e) {
        // Ignore JSON parse errors.
      }
    }
  }

  function init() {
    var lang = detectLang();
    document.documentElement.setAttribute('lang', lang);
    setMetaUrls(lang);
    localizeLinks(lang);

    window.t = window.t || function(key, fallback) {
      return fallback || null;
    };

    if (lang === 'en') return;

    fetch('/i18n.json')
      .then(function(res) { return res.ok ? res.json() : null; })
      .then(function(data) {
        if (!data) return;
        var page = document.body.getAttribute('data-i18n-page');
        var dict = mergeTranslations(data, page, lang);
        applyTranslations(dict);
      })
      .catch(function() {});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
