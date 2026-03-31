/* ══════════════════════════════════════════════════════════
   visitor.js  —  Greeting toast + visitor counter
   
   HOW IT WORKS:
   • Greeting toast  → localStorage (works 100%, no network)
   • Global counter  → JSONBin.io   (free, CORS-friendly)
   
   SETUP (one-time, 2 minutes):
   1. Go to https://jsonbin.io  →  sign up free
   2. Create a new Bin with content:  { "count": 0 }
   3. Copy the Bin ID and paste it as BIN_ID below
   4. Copy your API key and paste it as BIN_API_KEY below
   That's it — the counter will increment on every real visit.
══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─── JSONBin config ────────────────────────────────────
     Replace these two values after creating your free bin.
     Instructions above. Leave as-is to skip the counter.
  ──────────────────────────────────────────────────────── */
  const BIN_ID      = '69cb8f3b856a682189e5f358';      // e.g. '6650abc123def456789'
  const BIN_API_KEY = '$2a$10$D3FbMKIQI8FXpsHILgfHDe66J0FUFCkXEFJFJyAIiLOUIH3i86uk.';      // e.g. '$2a$10$...'
  const COUNTER_ENABLED = BIN_ID !== 'YOUR_BIN_ID_HERE';

  /* ─── Greeting messages ─────────────────────────────────
     Indexed by (localVisits - 1). Last entry is the fallback.
  ──────────────────────────────────────────────────────── */
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

  const TOAST_MS = 7000; // auto-dismiss after 7s

  /* ════════════════════════════════════════════════════════
     1. LOCAL VISIT COUNT  (localStorage — always works)
  ════════════════════════════════════════════════════════ */
  let visits = 1;
  try {
    visits = parseInt(localStorage.getItem('nt_visits') || '0', 10) + 1;
    localStorage.setItem('nt_visits', String(visits));
  } catch (_) { /* private mode — default 1 */ }

  /* ════════════════════════════════════════════════════════
     2. GREETING TOAST
  ════════════════════════════════════════════════════════ */
  function showToast() {
    const toast = document.getElementById('visitor-toast');
    if (!toast) {
      console.warn('[visitor.js] #visitor-toast not found in DOM');
      return;
    }

    const g = GREETINGS[Math.min(visits - 1, GREETINGS.length - 1)];

    const emojiEl = document.getElementById('toast-emoji');
    const headEl  = document.getElementById('toast-headline');
    const subEl   = document.getElementById('toast-sub');
    const closeBtn = document.getElementById('toast-close');
    const bar     = toast.querySelector('.toast-progress');

    if (emojiEl) emojiEl.textContent = g.emoji;
    if (headEl)  headEl.textContent  = g.head;
    if (subEl)   subEl.textContent   = g.sub;

    /* show */
    toast.style.display = 'block';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        toast.classList.add('toast-show');
      });
    });

    /* progress bar drain */
    if (bar) {
      bar.style.transition = 'none';
      bar.style.transform  = 'scaleX(1)';
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          bar.style.transition = `transform ${TOAST_MS}ms linear`;
          bar.style.transform  = 'scaleX(0)';
        });
      });
    }

    /* auto-dismiss */
    let timer = setTimeout(dismiss, TOAST_MS);

    /* manual close */
    if (closeBtn) closeBtn.addEventListener('click', () => { clearTimeout(timer); dismiss(); });

    /* pause on hover */
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
     3. GLOBAL COUNTER  (JSONBin.io — CORS-safe, free)
     
     Flow: GET current count → increment → PUT back → display
  ════════════════════════════════════════════════════════ */
  function setCountUI(n) {
    const fmt = typeof n === 'number' ? n.toLocaleString() : n;
    const h = document.getElementById('hero-visitor-count');
    const f = document.getElementById('footer-visitor-count');
    if (h) { h.textContent = fmt; h.classList.add('count-loaded'); }
    if (f) { f.textContent = fmt; f.classList.add('count-loaded'); }
  }

  async function runCounter() {
    if (!COUNTER_ENABLED) {
      setCountUI('—');
      return;
    }

    const headers = {
      'X-Master-Key': BIN_API_KEY,
      'Content-Type': 'application/json',
      'X-Bin-Versioning': 'false',   // don't keep history — keeps it free
    };
    const base = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

    try {
      /* GET */
      const getRes = await fetch(base + '/latest', { headers });
      if (!getRes.ok) throw new Error('GET failed');
      const getData = await getRes.json();
      const current = (getData.record && getData.record.count) ? getData.record.count : 0;
      const next    = current + 1;

      /* PUT */
      await fetch(base, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ count: next }),
      });

      setCountUI(next);
    } catch (err) {
      console.warn('[visitor.js] Counter error:', err.message);
      setCountUI('—');
    }
  }

  /* ════════════════════════════════════════════════════════
     4. INIT
  ════════════════════════════════════════════════════════ */
  function init() {
    // Toast fires after page entrance animation (~1.4s)
    setTimeout(showToast, 1400);
    // Counter runs in background
    runCounter();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
