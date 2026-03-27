(function() {
  'use strict';

  // Nav toggle (mobile)
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function() {
      var isOpen = navLinks.classList.toggle('open');
      this.classList.toggle('open');
      this.setAttribute('aria-expanded', isOpen);
      document.body.classList.toggle('menu-open', isOpen);
    });
    navLinks.querySelectorAll('a').forEach(function(a) {
      a.addEventListener('click', function() {
        navLinks.classList.remove('open');
        navToggle.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('menu-open');
      });
    });
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(function(a) {
    a.addEventListener('click', function(e) {
      var href = this.getAttribute('href');
      if (href === '#') return;
      var target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // FAQ accordion
  document.querySelectorAll('.faq-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var item = btn.closest('.faq-item');
      var isOpen = item.classList.contains('faq-open');
      document.querySelectorAll('.faq-item').forEach(function(i) {
        i.classList.remove('faq-open');
        i.querySelector('.faq-btn').setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        item.classList.add('faq-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // Cookie banner + consent
  var cookieKey = 'inkledger_cookie_consent';
  var banner = document.getElementById('cookieBanner');
  var prefs = document.getElementById('cookiePreferences');
  var acceptBtn = document.getElementById('cookieAccept');
  var declineBtn = document.getElementById('cookieDecline');
  var customizeBtn = document.getElementById('cookieCustomize');
  var saveBtn = document.getElementById('cookieSave');
  var acceptAllBtn = document.getElementById('cookieAcceptAll');
  var closeBtn = document.getElementById('cookieClose');
  var analyticsToggle = document.getElementById('cookieAnalytics');
  var cookieManageBtn = document.getElementById('cookieManageBtn');
  var memoryConsent = null;

  function readConsent() {
    try {
      var raw = localStorage.getItem(cookieKey);
      if (!raw) return memoryConsent;
      if (raw === 'accepted') return { analytics: true };
      if (raw === 'declined') return { analytics: false };
      return JSON.parse(raw);
    } catch (e) { return memoryConsent; }
  }

  function writeConsent(consent) {
    memoryConsent = consent;
    try { localStorage.setItem(cookieKey, JSON.stringify(consent)); } catch (e) {}
  }

  function normalizeConsent(consent) {
    return { necessary: true, analytics: !!(consent && consent.analytics) };
  }

  function showBanner() { if (banner) banner.classList.add('is-visible'); }
  function hideBanner() { if (banner) banner.classList.remove('is-visible'); }
  function openPrefs() {
    if (!prefs) return;
    prefs.classList.add('is-open');
    prefs.setAttribute('aria-hidden', 'false');
  }
  function closePrefs() {
    if (!prefs) return;
    prefs.classList.remove('is-open');
    prefs.setAttribute('aria-hidden', 'true');
  }

  function enableConsentScripts(type) {
    var scripts = document.querySelectorAll('script[type="text/plain"][data-consent="' + type + '"]');
    for (var i = 0; i < scripts.length; i++) {
      var oldScript = scripts[i];
      var newScript = document.createElement('script');
      var srcAttr = oldScript.getAttribute('src');
      if (srcAttr) newScript.src = srcAttr;
      if (oldScript.async) newScript.async = true;
      if (oldScript.defer) newScript.defer = true;
      if (!srcAttr) newScript.text = oldScript.text || oldScript.textContent || '';
      oldScript.parentNode.replaceChild(newScript, oldScript);
    }
  }

  function updateAnalytics(consent) {
    var state = consent.analytics ? 'granted' : 'denied';
    document.documentElement.setAttribute('data-consent-analytics', state);
    if (typeof window.CustomEvent === 'function') {
      window.dispatchEvent(new CustomEvent('inkledger:consent', { detail: consent }));
    }
    if (typeof gtag === 'function') {
      gtag('consent', 'update', { analytics_storage: state });
    }
    if (window.dataLayer && typeof window.dataLayer.push === 'function') {
      window.dataLayer.push({ event: 'consent_update', analytics: consent.analytics });
    }
    if (consent.analytics) enableConsentScripts('analytics');
  }

  function applyConsent(consent) {
    var normalized = normalizeConsent(consent);
    writeConsent(normalized);
    if (analyticsToggle) analyticsToggle.checked = normalized.analytics;
    updateAnalytics(normalized);
    closePrefs();
    hideBanner();
  }

  if (banner) {
    var stored = readConsent();
    if (stored) {
      var normalized = normalizeConsent(stored);
      if (analyticsToggle) analyticsToggle.checked = normalized.analytics;
      updateAnalytics(normalized);
      hideBanner();
    } else {
      showBanner();
    }
  }

  if (customizeBtn) customizeBtn.addEventListener('click', function() { openPrefs(); });
  if (closeBtn) closeBtn.addEventListener('click', function() { closePrefs(); });
  if (acceptBtn) acceptBtn.addEventListener('click', function() { applyConsent({ analytics: true }); });
  if (acceptAllBtn) acceptAllBtn.addEventListener('click', function() { applyConsent({ analytics: true }); });
  if (declineBtn) declineBtn.addEventListener('click', function() { applyConsent({ analytics: false }); });
  if (saveBtn) saveBtn.addEventListener('click', function() {
    applyConsent({ analytics: analyticsToggle ? analyticsToggle.checked : false });
  });
  if (cookieManageBtn) cookieManageBtn.addEventListener('click', function() {
    var storedConsent = normalizeConsent(readConsent());
    if (analyticsToggle) analyticsToggle.checked = storedConsent.analytics;
    showBanner();
    openPrefs();
  });

})();
