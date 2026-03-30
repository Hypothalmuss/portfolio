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


// ── 5. VIDEO — robust preload & fallback ──────────────────────────────────
document.querySelectorAll('.pcard-media video').forEach(video => {
  // Ensure video tries to load on page ready
  if (video.readyState === 0) {
    video.load();
  }

  // Preload more aggressively when card enters viewport
  const card = video.closest('.pcard');
  const videoObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        video.preload = 'auto';
        video.load();
        videoObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  if (card) videoObserver.observe(card);

  // Show a placeholder if video fails to load
  video.addEventListener('error', () => {
    const wrapper = video.closest('.pcard-media');
    if (!wrapper) return;
    if (!wrapper.querySelector('.video-error')) {
      const msg = document.createElement('div');
      msg.className = 'video-error';
      msg.style.cssText = `
        position:absolute; inset:0; z-index:3;
        display:flex; flex-direction:column;
        align-items:center; justify-content:center;
        background:var(--bg-alt);
        font-family:var(--f-mono); font-size:0.75rem;
        color:var(--text-dim); text-align:center; padding:1.5rem;
        gap:0.5rem;
      `;
      msg.innerHTML = `
        <span style="font-size:1.75rem">🎬</span>
        <span>Demo video coming soon</span>
        <span style="font-size:0.65rem;opacity:0.6">Add your .mp4 to assets/videos/</span>
      `;
      wrapper.appendChild(msg);
    }
  });
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
