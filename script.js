/* ══════════════════════════════════════════
   script.js
══════════════════════════════════════════ */

// ── 1. NAVBAR scroll state + active link ──────────────────────────────────
const navbar  = document.getElementById('navbar');
const allSecs = document.querySelectorAll('section[id], header[id]');
const navAs   = document.querySelectorAll('.nav-links a');

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


// ── 2. MOBILE MENU ────────────────────────────────────────────────────────
const toggle = document.getElementById('navToggle');
const menu   = document.getElementById('navLinks');

toggle.addEventListener('click', () => menu.classList.toggle('open'));
menu.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => menu.classList.remove('open'))
);


// ── 3. SMOOTH SCROLL ──────────────────────────────────────────────────────
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


// ── 4. SCROLL REVEAL ──────────────────────────────────────────────────────
const revealEls = document.querySelectorAll('.reveal, .pcard, .tl');

// Stagger project cards
document.querySelectorAll('.projects-list > *').forEach((el, i) => {
  el.style.transitionDelay = `${i * 80}ms`;
});

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.07, rootMargin: '0px 0px -30px 0px' });

revealEls.forEach(el => observer.observe(el));


// ── 5. VIDEO ─ lazy playback, poster until needed ───────────────────
// Every video carries a poster frame, so nothing needs to download until it is
// either on screen (autoplay clips) or the visitor presses play (controls clips).
document.querySelectorAll('video[poster]').forEach(video => {
  const autoplays = video.hasAttribute('autoplay');

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!autoplays) return;
      // Looping demo clips play only while visible — saves bandwidth and CPU.
      if (entry.isIntersecting) {
        video.play().catch(() => { /* autoplay blocked — poster stands */ });
      } else {
        video.pause();
      }
    });
  }, { threshold: 0.25 });

  io.observe(video);

  // If a source is missing or fails, leave the poster in place rather than a
  // broken player, and drop the controls so it reads as an image.
  video.addEventListener('error', () => {
    video.removeAttribute('controls');
    video.classList.add('video-fallback');
  }, true);
});


// ── 6. HERO ENTRANCE ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const order = [
    '.hero-heading',
    '.hero-descriptor',
    '.hero-stats',
    '.hero-actions',
    '.hero-socials',
    '.github-notice',
    '.hero-photo-block'
  ];
  order.forEach((sel, i) => {
    const el = document.querySelector(sel);
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(16px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    setTimeout(() => {
      el.style.opacity = '';
      el.style.transform = '';
    }, 80 + i * 100);
  });
});
