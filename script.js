/* ══════════════════════════════════════════
   script.js
══════════════════════════════════════════ */

// ── 1. NAVBAR scroll state + active link ────────────────────────────────────
const navbar   = document.getElementById('navbar');
const allSecs  = document.querySelectorAll('section[id], header[id]');
const navAs    = document.querySelectorAll('.nav-links a');

function syncNav() {
  navbar.classList.toggle('scrolled', window.scrollY > 24);

  let current = '';
  allSecs.forEach(s => {
    if (window.scrollY >= s.offsetTop - 90) current = s.id;
  });
  navAs.forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === `#${current}`);
  });
}
window.addEventListener('scroll', syncNav, { passive: true });
syncNav();


// ── 2. MOBILE MENU ──────────────────────────────────────────────────────────
const toggle = document.getElementById('navToggle');
const menu   = document.getElementById('navLinks');

toggle.addEventListener('click', () => menu.classList.toggle('open'));
menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => menu.classList.remove('open')));


// ── 3. SMOOTH SCROLL ────────────────────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    window.scrollTo({
      top: target.getBoundingClientRect().top + window.scrollY - navbar.offsetHeight - 8,
      behavior: 'smooth'
    });
  });
});


// ── 4. SCROLL REVEAL ────────────────────────────────────────────────────────
const revealEls = document.querySelectorAll('.reveal, .pcard, .scol, .tl');

// Stagger siblings inside grid containers
['.stack-grid', '.projects-list'].forEach(sel => {
  document.querySelectorAll(`${sel} > *`).forEach((el, i) => {
    el.style.transitionDelay = `${i * 70}ms`;
  });
});

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });

revealEls.forEach(el => observer.observe(el));


// ── 5. SKILL BARS — animate width when column visible ───────────────────────
// (handled purely by CSS: .scol.visible .sbar-fill { width: var(--w) })


// ── 6. VIDEO — preload on hover ─────────────────────────────────────────────
document.querySelectorAll('.pcard-media video').forEach(v => {
  v.closest('.pcard').addEventListener('mouseenter', () => {
    if (v.preload === 'none') { v.preload = 'metadata'; v.load(); }
  }, { once: true });
});


// ── 7. HERO ENTRANCE ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const order = [
    '.hero-status', '.hero-heading', '.hero-descriptor',
    '.hero-stats', '.hero-actions', '.hero-socials',
    '.hero-photo-block'
  ];
  order.forEach((sel, i) => {
    const el = document.querySelector(sel);
    if (!el) return;
    el.style.cssText = 'opacity:0; transform:translateY(16px); transition: opacity 0.5s ease, transform 0.5s ease;';
    setTimeout(() => el.style.cssText = 'transition: opacity 0.5s ease, transform 0.5s ease;', 100 + i * 100);
  });
});
