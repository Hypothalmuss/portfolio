/* ══════════════════════════════════════════════════════
   visitor.js
   — Greeting toast (localStorage visit count)
   — Global visit counter (CountAPI, free & no signup)
══════════════════════════════════════════════════════ */

(function () {

  /* ── CONFIG ────────────────────────────────────────
     CountAPI namespace + key — unique to your portfolio.
     Format: api.counterapi.dev/v1/<key>/up
     First hit auto-creates the counter.
     Change COUNT_KEY only if you want to reset the count to 0.
  ─────────────────────────────────────────────────── */
  // Using counterapi.dev — free, no signup, CountAPI replacement
  // Your unique key — change ONLY if you want to reset the counter to 0
  const COUNT_KEY = 'nadimtouil-portfolio-v1';

  /* ── GREETING DEFINITIONS ───────────────────────────
     visits = how many times THIS browser has been here.
     Each entry: { emoji, headline, sub }
  ─────────────────────────────────────────────────── */
  const GREETINGS = [
    // 1st visit
    {
      emoji: '👋',
      headline: 'Welcome!',
      sub: 'Thanks for stopping by. Feel free to look around.',
    },
    // 2nd visit
    {
      emoji: '🤖',
      headline: 'Welcome back!',
      sub: 'Good to see you again. Something catch your eye?',
    },
    // 3rd visit
    {
      emoji: '😄',
      headline: 'You again!',
      sub: 'Third time\'s the charm. Are you recruiting? I hope so.',
    },
    // 4th visit
    {
      emoji: '🏠',
      headline: 'Welcome home.',
      sub: 'You visit more than I do. Grab a coffee, stay a while.',
    },
    // 5th visit
    {
      emoji: '🕵️',
      headline: 'Still here?',
      sub: 'Five visits. I respect the dedication. Let\'s just talk already.',
    },
    // 6th visit
    {
      emoji: '🔩',
      headline: 'You\'re basically a robot yourself.',
      sub: 'Consistent. Precise. Unstoppable. Just like my code.',
    },
    // 7th visit
    {
      emoji: '🚀',
      headline: 'Visit #7. Legend.',
      sub: 'At this point just send me an email. mohamednadimtouil@gmail.com',
    },
    // 8th+ fallback
    {
      emoji: '🤝',
      headline: 'We\'re basically colleagues now.',
      sub: 'Hire me already — you clearly like what you see.',
    },
  ];

  /* ── TOAST DISMISS DURATION (ms) ───────────────────
     Toast auto-dismisses after this time.
  ─────────────────────────────────────────────────── */
  const TOAST_DURATION = 6500;

  /* ══════════════════════════════════════════════════
     1. LOCAL VISIT COUNT
     Stored in localStorage so it's per-device/browser.
  ══════════════════════════════════════════════════ */
  let localVisits = 0;
  try {
    localVisits = parseInt(localStorage.getItem('nt_visits') || '0', 10);
    localVisits += 1;
    localStorage.setItem('nt_visits', String(localVisits));
  } catch (e) {
    // localStorage blocked (private browsing etc.) — default to 1
    localVisits = 1;
  }

  /* ══════════════════════════════════════════════════
     2. PICK GREETING
  ══════════════════════════════════════════════════ */
  const idx      = Math.min(localVisits - 1, GREETINGS.length - 1);
  const greeting = GREETINGS[idx];

  /* ══════════════════════════════════════════════════
     3. SHOW TOAST — delayed slightly so page loads first
  ══════════════════════════════════════════════════ */
  function showToast() {
    const toast    = document.getElementById('visitor-toast');
    const emojiEl  = document.getElementById('toast-emoji');
    const headEl   = document.getElementById('toast-headline');
    const subEl    = document.getElementById('toast-sub');
    const closeBtn = document.getElementById('toast-close');
    const progress = toast ? toast.querySelector('.toast-progress') : null;

    if (!toast || !emojiEl || !headEl || !subEl) return;

    emojiEl.textContent = greeting.emoji;
    headEl.textContent  = greeting.headline;
    subEl.textContent   = greeting.sub;

    // Show
    requestAnimationFrame(() => {
      toast.classList.add('toast-show');
    });

    // Animate progress bar drain
    if (progress) {
      progress.style.transition = `transform ${TOAST_DURATION}ms linear`;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          progress.style.transform = 'scaleX(0)';
        });
      });
    }

    // Auto-dismiss
    let dismissTimer = setTimeout(dismissToast, TOAST_DURATION);

    // Manual close
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        clearTimeout(dismissTimer);
        dismissToast();
      });
    }

    // Pause drain on hover
    if (progress) {
      toast.addEventListener('mouseenter', () => {
        progress.style.transition = 'none';
        clearTimeout(dismissTimer);
      });
      toast.addEventListener('mouseleave', () => {
        // Resume with remaining time (simplified: restart full timer)
        progress.style.transition = `transform ${TOAST_DURATION * 0.4}ms linear`;
        progress.style.transform  = 'scaleX(0)';
        dismissTimer = setTimeout(dismissToast, TOAST_DURATION * 0.4);
      });
    }
  }

  function dismissToast() {
    const toast = document.getElementById('visitor-toast');
    if (!toast) return;
    toast.classList.remove('toast-show');
    toast.classList.add('toast-hide');
  }

  /* ══════════════════════════════════════════════════
     4. GLOBAL VISIT COUNTER via counterapi.dev
     Free, no account needed, CountAPI replacement.
     Falls back gracefully if offline / API down.
  ══════════════════════════════════════════════════ */
  function fetchAndDisplayCount() {
    const url = `https://api.counterapi.dev/v1/${COUNT_KEY}/up`;

    fetch(url, { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        const count = (data && (data.count ?? data.value)) ? (data.count ?? data.value) : null;
        if (!count) return;

        const formatted = count.toLocaleString();

        // Hero stat
        const heroEl = document.getElementById('hero-visitor-count');
        if (heroEl) {
          heroEl.textContent = formatted;
          heroEl.classList.add('count-loaded');
        }

        // Footer stat
        const footerEl = document.getElementById('footer-visitor-count');
        if (footerEl) {
          footerEl.textContent = formatted;
          footerEl.classList.add('count-loaded');
        }
      })
      .catch(() => {
        // API unreachable — show nothing rather than error
        const heroEl   = document.getElementById('hero-visitor-count');
        const footerEl = document.getElementById('footer-visitor-count');
        if (heroEl)   heroEl.textContent   = '…';
        if (footerEl) footerEl.textContent = '…';
      });
  }

  /* ══════════════════════════════════════════════════
     5. INIT — wait for DOM then fire both
  ══════════════════════════════════════════════════ */
  function init() {
    // Slight delay so hero entrance animation finishes first
    setTimeout(showToast,          1400);
    // Counter can run immediately
    fetchAndDisplayCount();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
