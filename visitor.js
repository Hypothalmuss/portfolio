/* ══════════════════════════════════════════════════════════
   visitor.js — greeting toast + real global visitor counter

   The counter is backed by a Cloudflare Worker (see worker/README.md).
   No API key lives in this file: the browser can only read a number,
   and the increment happens server-side, deduped per visitor per day.

   SETUP: deploy the worker, then paste its URL into COUNTER_API below.
   Until then the counter degrades quietly to a local-only number.
══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─── Counter backend ───────────────────────────────────
     After `wrangler deploy`, replace this with your Worker URL, e.g.
     'https://portfolio-counter.nadim.workers.dev'
  ──────────────────────────────────────────────────────── */
  const COUNTER_API = '';

  const GREETINGS = [
    { emoji: '👋', head: 'Welcome!',                    sub: 'Thanks for stopping by. Feel free to look around.' },
    { emoji: '🤖', head: 'Welcome back!',               sub: 'Good to see you again. Something catch your eye?' },
    { emoji: '😄', head: 'You again!',                  sub: "Third time's the charm. Are you recruiting? I hope so." },
    { emoji: '🏠', head: 'Welcome home.',               sub: 'You visit more than I do. Grab a coffee, stay a while.' },
    { emoji: '🕵️', head: 'Still here?',                 sub: "Five visits. I respect the dedication. Let's just talk already." },
    { emoji: '🔩', head: "You're basically a robot.",   sub: 'Consistent. Precise. Unstoppable. Just like my code.' },
    { emoji: '🚀', head: 'Visit #7. Legend.',           sub: 'At this point just send me an email. You know where to find it.' },
    { emoji: '🤝', head: "We're basically colleagues.", sub: 'Hire me already — you clearly like what you see.' },
  ];

  const TOAST_MS = 7000;

  /* ════════════════════════════════════════════════════════
     1. LOCAL VISIT COUNT (drives which greeting shows)
  ════════════════════════════════════════════════════════ */
  let visits = 1;
  try {
    visits = parseInt(localStorage.getItem('nt_visits') || '0', 10) + 1;
    localStorage.setItem('nt_visits', String(visits));
  } catch (_) { /* private mode — default to 1 */ }

  /* ════════════════════════════════════════════════════════
     2. GREETING TOAST
  ════════════════════════════════════════════════════════ */
  function showToast() {
    const toast = document.getElementById('visitor-toast');
    if (!toast) return;

    const g = GREETINGS[Math.min(visits - 1, GREETINGS.length - 1)];
    const emojiEl  = document.getElementById('toast-emoji');
    const headEl   = document.getElementById('toast-headline');
    const subEl    = document.getElementById('toast-sub');
    const closeBtn = document.getElementById('toast-close');
    const bar      = toast.querySelector('.toast-progress');

    if (emojiEl) emojiEl.textContent = g.emoji;
    if (headEl)  headEl.textContent  = g.head;
    if (subEl)   subEl.textContent   = g.sub;

    toast.style.display = 'block';
    requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('toast-show')));

    if (bar) {
      bar.style.transition = 'none';
      bar.style.transform  = 'scaleX(1)';
      requestAnimationFrame(() => requestAnimationFrame(() => {
        bar.style.transition = `transform ${TOAST_MS}ms linear`;
        bar.style.transform  = 'scaleX(0)';
      }));
    }

    let timer = setTimeout(dismiss, TOAST_MS);
    if (closeBtn) closeBtn.addEventListener('click', () => { clearTimeout(timer); dismiss(); });

    toast.addEventListener('mouseenter', () => {
      clearTimeout(timer);
      if (bar) bar.style.transition = 'none';
    });
    toast.addEventListener('mouseleave', () => {
      const remaining = TOAST_MS * 0.35;
      if (bar) {
        bar.style.transition = `transform ${remaining}ms linear`;
        bar.style.transform  = 'scaleX(0)';
      }
      timer = setTimeout(dismiss, remaining);
    });
  }

  function dismiss() {
    const toast = document.getElementById('visitor-toast');
    if (!toast) return;
    toast.classList.remove('toast-show');
    toast.classList.add('toast-hide');
    setTimeout(() => { toast.style.display = 'none'; }, 500);
  }

  /* ════════════════════════════════════════════════════════
     3. GLOBAL COUNTER
  ════════════════════════════════════════════════════════ */
  const targets = () => [
    document.getElementById('hero-visitor-count'),
    document.getElementById('footer-visitor-count'),
  ].filter(Boolean);

  /* Count up to the value rather than snapping — reads as a live readout. */
  function animateTo(n) {
    const els = targets();
    if (!els.length) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || n < 2) {
      els.forEach((el) => { el.textContent = n.toLocaleString(); el.classList.add('count-loaded'); });
      return;
    }

    const DURATION = 900;
    const start = performance.now();
    const from = 0;

    function frame(now) {
      const t = Math.min((now - start) / DURATION, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      const value = Math.round(from + (n - from) * eased);
      els.forEach((el) => { el.textContent = value.toLocaleString(); });
      if (t < 1) requestAnimationFrame(frame);
      else els.forEach((el) => el.classList.add('count-loaded'));
    }
    requestAnimationFrame(frame);
  }

  function setFallback() {
    targets().forEach((el) => { el.textContent = '—'; el.classList.add('count-loaded'); });
  }

  async function runCounter() {
    if (!COUNTER_API) { setFallback(); return; }

    /* One visit per browser session — a page-to-page click is the same visit. */
    let alreadyThisSession = false;
    try { alreadyThisSession = sessionStorage.getItem('nt_hit') === '1'; } catch (_) {}

    const url    = COUNTER_API.replace(/\/$/, '') + (alreadyThisSession ? '/count' : '/hit');
    const method = alreadyThisSession ? 'GET' : 'POST';

    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if (typeof data.count !== 'number') throw new Error('bad payload');

      try { sessionStorage.setItem('nt_hit', '1'); } catch (_) {}
      animateTo(data.count);
    } catch (err) {
      console.warn('[visitor] counter unavailable:', err.message);
      setFallback();
    }
  }

  /* ════════════════════════════════════════════════════════
     4. INIT
  ════════════════════════════════════════════════════════ */
  function init() {
    // Toast fires after the page entrance animation settles.
    if (document.getElementById('visitor-toast')) setTimeout(showToast, 1400);
    runCounter();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
