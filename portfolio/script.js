(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.add('js-ready');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SVGNS = 'http://www.w3.org/2000/svg';

  /* ---------- Header: scrolled state ---------- */
  var header = document.querySelector('.site-header');
  function onScroll() {
    if (header) header.classList.toggle('scrolled', window.scrollY > 8);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Mobile nav ---------- */
  var menuBtn = document.querySelector('.menu-btn');
  var mobileNav = document.getElementById('mobile-nav');
  function setMenu(open) {
    if (!menuBtn || !mobileNav) return;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    mobileNav.hidden = !open;
  }
  if (menuBtn && mobileNav) {
    menuBtn.addEventListener('click', function () {
      setMenu(menuBtn.getAttribute('aria-expanded') !== 'true');
    });
    mobileNav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setMenu(false);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) setMenu(false);
    });
  }

  /* ---------- Active nav link ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-links a'));
  var sections = navLinks
    .map(function (a) { return document.querySelector(a.getAttribute('href')); })
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = '#' + entry.target.id;
        navLinks.forEach(function (a) {
          a.classList.toggle('active', a.getAttribute('href') === id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { revealer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Copy email ---------- */
  document.querySelectorAll('.copy-btn').forEach(function (btn) {
    var labelEl = btn.querySelector('.copy-label');
    var original = labelEl ? labelEl.textContent : '';
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      var done = function () {
        btn.classList.add('copied');
        if (labelEl) labelEl.textContent = 'Copied!';
        setTimeout(function () {
          btn.classList.remove('copied');
          if (labelEl) labelEl.textContent = original;
        }, 2000);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () {
          window.location.href = 'mailto:' + text;
        });
      } else {
        window.location.href = 'mailto:' + text;
      }
    });
  });

  /* ---------- Certificate lightbox ---------- */
  var lightbox = document.getElementById('lightbox');
  document.querySelectorAll('[data-lightbox]').forEach(function (trigger) {
    trigger.addEventListener('click', function () {
      var src = trigger.getAttribute('data-lightbox');
      if (!lightbox || typeof lightbox.showModal !== 'function') {
        window.open(src, '_blank', 'noopener');
        return;
      }
      var img = lightbox.querySelector('img');
      img.src = src;
      img.alt = trigger.getAttribute('data-lightbox-alt') || '';
      lightbox.showModal();
    });
  });
  if (lightbox) {
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) lightbox.close();
    });
  }

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- Grid-search visual (ProblemSolving) ---------- */
  (function buildGrid() {
    var svg = document.querySelector('.viz-grid');
    if (!svg) return;
    var COLS = 9, ROWS = 6, SIZE = 30, GAP = 4;
    var x0 = (360 - (COLS * (SIZE + GAP) - GAP)) / 2;
    var y0 = (225 - (ROWS * (SIZE + GAP) - GAP)) / 2;
    var path = [
      [1, 1], [2, 1], [3, 1], [4, 1], [4, 2], [3, 2], [2, 2], [1, 2], [1, 3], [1, 4],
      [2, 4], [3, 4], [3, 3], [4, 3], [5, 3], [5, 2], [5, 1], [6, 1], [7, 1], [7, 2],
      [6, 2], [6, 3], [7, 3], [7, 4], [6, 4], [5, 4], [4, 4]
    ];
    var onPath = {};
    path.forEach(function (p) { onPath[p[0] + ',' + p[1]] = true; });
    var blocked = { '2,3': true };

    var cells = svg.querySelector('.cells');
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        var rect = document.createElementNS(SVGNS, 'rect');
        rect.setAttribute('x', x0 + c * (SIZE + GAP));
        rect.setAttribute('y', y0 + r * (SIZE + GAP));
        rect.setAttribute('width', SIZE);
        rect.setAttribute('height', SIZE);
        rect.setAttribute('rx', 6);
        var key = c + ',' + r;
        rect.setAttribute('class', 'cell' + (onPath[key] ? ' target' : blocked[key] ? ' block' : ''));
        cells.appendChild(rect);
      }
    }
    var center = function (p) {
      return [x0 + p[0] * (SIZE + GAP) + SIZE / 2, y0 + p[1] * (SIZE + GAP) + SIZE / 2];
    };
    svg.querySelector('.path').setAttribute('points', path.map(function (p) { return center(p).join(','); }).join(' '));
    var s = center(path[0]), e = center(path[path.length - 1]);
    var start = svg.querySelector('.start'), end = svg.querySelector('.end');
    start.setAttribute('cx', s[0]); start.setAttribute('cy', s[1]);
    end.setAttribute('cx', e[0]); end.setAttribute('cy', e[1]);
  })();

  /* ---------- Hero: a tiny P system ---------- */
  (function pSystem() {
    var svg = document.getElementById('pfig');
    if (!svg) return;
    var layer = svg.querySelector('.objs');
    var stepEl = document.getElementById('pfig-step');
    var sigEl = document.getElementById('pfig-signal');

    var M = {
      skin:    { x: 8,   y: 8,   w: 464, h: 364, parent: null,      children: ['backend', 'ml'] },
      backend: { x: 28,  y: 48,  w: 252, h: 212, parent: 'skin',    children: ['data'] },
      data:    { x: 48,  y: 132, w: 124, h: 108, parent: 'backend', children: [] },
      ml:      { x: 300, y: 48,  w: 152, h: 168, parent: 'skin',    children: [] }
    };
    var R = 15;           // object radius
    var MIN_DIST = 36;    // min distance between object centres

    var objs = [
      { label: 'py',   k: 1, m: 'backend' },
      { label: 'java', k: 1, m: 'backend' },
      { label: 'api',  k: 1, m: 'backend' },
      { label: 'sql',  k: 2, m: 'data' },
      { label: 'pg',   k: 2, m: 'data' },
      { label: 'ml',   k: 3, m: 'ml' },
      { label: 'nn',   k: 3, m: 'ml' },
      { label: 'go',   k: 1, m: 'skin' },
      { label: 'c',    k: 1, m: 'skin' },
      { label: 'js',   k: 1, m: 'skin' },
      { label: 'uml',  k: 3, m: 'skin' },
      { label: 'git',  k: 2, m: 'skin' }
    ];

    objs.forEach(function (o) {
      var g = document.createElementNS(SVGNS, 'g');
      g.setAttribute('class', 'obj k' + o.k);
      var inner = document.createElementNS(SVGNS, 'g');
      inner.setAttribute('class', 'obj-inner');
      var circle = document.createElementNS(SVGNS, 'circle');
      circle.setAttribute('r', R);
      var text = document.createElementNS(SVGNS, 'text');
      text.textContent = o.label;
      inner.appendChild(circle);
      inner.appendChild(text);
      g.appendChild(inner);
      layer.appendChild(g);
      o.el = g; o.inner = inner; o.text = text; o.prime = false;
      o.x = 0; o.y = 0;
    });

    function insideExpanded(px, py, rect, pad) {
      return px > rect.x - pad && px < rect.x + rect.w + pad &&
             py > rect.y - pad && py < rect.y + rect.h + pad;
    }

    function findSpot(o, membraneId) {
      var m = M[membraneId];
      var minX = m.x + R + 9, maxX = m.x + m.w - R - 9;
      var minY = m.y + R + 30, maxY = m.y + m.h - R - 9;
      for (var tries = 0; tries < 80; tries++) {
        var x = minX + Math.random() * (maxX - minX);
        var y = minY + Math.random() * (maxY - minY);
        var ok = m.children.every(function (id) { return !insideExpanded(x, y, M[id], R + 7); });
        if (!ok) continue;
        ok = objs.every(function (other) {
          if (other === o || !other.placed) return true;
          var dx = other.x - x, dy = other.y - y;
          return dx * dx + dy * dy >= MIN_DIST * MIN_DIST;
        });
        if (ok) return { x: x, y: y };
      }
      return null;
    }

    function moveTo(o, spot) {
      o.x = spot.x; o.y = spot.y; o.placed = true;
      o.el.style.transform = 'translate(' + spot.x.toFixed(1) + 'px,' + spot.y.toFixed(1) + 'px)';
    }

    function pop(o) {
      o.inner.classList.remove('pop');
      void o.inner.getBoundingClientRect();
      o.inner.classList.add('pop');
    }

    // Initial placement, without transitions.
    svg.classList.add('no-anim');
    objs.forEach(function (o) {
      var spot = findSpot(o, o.m);
      if (spot) moveTo(o, spot);
    });
    void svg.getBoundingClientRect();
    requestAnimationFrame(function () { svg.classList.remove('no-anim'); });

    var step = 0;
    function shuffle(a) {
      for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    }

    function apply(o) {
      var m = M[o.m];
      var r = Math.random();
      var spot;
      if (r < 0.3) {
        if (m.children.length) {
          var target = m.children[Math.floor(Math.random() * m.children.length)];
          spot = findSpot(o, target);
          if (spot) { o.m = target; moveTo(o, spot); pop(o); return 'INTO ' + target; }
        }
      } else if (r < 0.48) {
        if (m.parent) {
          spot = findSpot(o, m.parent);
          if (spot) { o.m = m.parent; moveTo(o, spot); pop(o); return 'OUT ' + m.parent; }
        }
      } else if (r < 0.64 && o.label.length <= 3) {
        o.prime = !o.prime;
        o.text.textContent = o.label + (o.prime ? '′' : '');
        pop(o);
        return 'REWRITE';
      }
      spot = findSpot(o, o.m);
      if (spot) moveTo(o, spot);
      return 'STAY';
    }

    function tick() {
      step++;
      var picks = shuffle(objs.slice()).slice(0, 3);
      var first = '';
      picks.forEach(function (o, i) {
        var sig = apply(o);
        if (i === 0) first = sig.split(' ')[0] + ' ' + o.label;
      });
      if (stepEl) stepEl.textContent = 'step ' + step;
      if (sigEl) sigEl.textContent = first;
    }

    svg.addEventListener('click', tick);

    if (reduceMotion) return;

    var timer = null;
    var visible = true;
    function start() { if (!timer && visible && !document.hidden) timer = setInterval(tick, 1700); }
    function stop() { clearInterval(timer); timer = null; }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        visible ? start() : stop();
      }).observe(svg);
    }
    document.addEventListener('visibilitychange', function () {
      document.hidden ? stop() : start();
    });
    setTimeout(start, 900);
  })();
})();
