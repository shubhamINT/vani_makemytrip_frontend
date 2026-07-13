(function () {
  'use strict';

  /* Derive widget base URL from this script's own location,
     or override via data-src="https://..." on the <script> tag. */
  var BASE = (function () {
    var scripts = document.getElementsByTagName('script');
    var self = scripts[scripts.length - 1];
    return self.getAttribute('data-src') || self.src.replace(/\/embed\.js(\?.*)?$/, '') || '';
  })();

  /* ── Container (sized dynamically) ── */
  var el = document.createElement('div');
  el.id = 'vaani-widget-container';
  el.style.cssText = [
    'position: fixed',
    'bottom: 0',
    'right: 0',
    'z-index: 2147483647',
    'width: 80px',
    'height: 80px',
    'overflow: hidden',
    'transition: width 0.3s ease, height 0.3s ease, border-radius 0.3s ease',
    'background: #111c3d',
    'border-radius: 40px 0 0 0',
  ].join(';');

  /* Loading orb (removed once widget signals ready) */
  var orb = document.createElement('div');
  orb.id = 'vaani-loading-orb';
  orb.style.cssText = [
    'position: absolute',
    'inset: 10px',
    'border-radius: 50%',
    'background: radial-gradient(circle at 35% 30%, #2d6be1, #1b4298 70%)',
    'box-shadow: 0 0 0 6px rgba(45, 107, 225, 0.12), 0 0 30px -4px rgba(45, 107, 225, 0.5)',
    'animation: vaani-breathe 2s ease-in-out infinite',
  ].join(';');

  /* Inject keyframes dynamically */
  var style = document.createElement('style');
  style.textContent =
    '@keyframes vaani-breathe {' +
    '0%,100%{transform:scale(0.92);opacity:0.85}' +
    '50%{transform:scale(1.04);opacity:1}' +
    '}' +
    '@keyframes vaani-fade-out{' +
    'to{opacity:0;transform:scale(0.6)}' +
    '}';
  document.head.appendChild(style);

  el.appendChild(orb);
  document.body.appendChild(el);

  /* ── Iframe ── */
  var iframe = document.createElement('iframe');
  iframe.src = BASE + '/';
  iframe.setAttribute('allow', 'microphone; autoplay');
  iframe.style.cssText = [
    'width: 100%',
    'height: 100%',
    'border: 0',
    'background: transparent',
    'display: block',
  ].join(';');
  iframe.title = 'Vaani Voice Assistant';
  el.appendChild(iframe);

  /* ── Size presets ── */
  var SIZES = {
    collapsed: { w: 80, h: 80, r: '40px 0 0 0' },
    open: { w: 436, h: 780, r: '16px 16px 0 0' },
  };

  function resize(mode) {
    var s = SIZES[mode] || SIZES.collapsed;
    el.style.width = s.w + 'px';
    el.style.height = s.h + 'px';
    el.style.borderRadius = s.r;
  }

  /* ── Listen for widget messages ── */
  window.addEventListener('message', function (event) {
    if (!event.data || typeof event.data !== 'object') return;
    switch (event.data.type) {
      case 'vani:ready':
        orb.style.animation = 'vaani-fade-out 0.25s ease forwards';
        setTimeout(function () { if (orb.parentNode) orb.parentNode.removeChild(orb); }, 250);
        el.style.background = 'transparent';
        break;
      case 'vani:resize':
        resize(event.data.mode);
        break;
    }
  });
})();
