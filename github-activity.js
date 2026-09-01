/* ══════════════════════════════════════════════════════════
   github-activity.js — pulls live repo data from the GitHub API

   Any element with data-gh-repo="<repo-name>" gets filled in with that
   repository's real language, star count and last-push date. One API call
   serves the whole page (all repos in a single request), cached in
   sessionStorage so navigating between project pages costs nothing.

   Unauthenticated GitHub API allows 60 requests/hour per IP — with the
   cache, a full browse of the site uses exactly one.
══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const USER      = 'Hypothalmuss';
  const CACHE_KEY = 'nt_gh_repos_v1';
  const CACHE_MS  = 30 * 60 * 1000; // 30 minutes

  function relativeDate(iso) {
    const then = new Date(iso);
    const days = Math.floor((Date.now() - then) / 86400000);
    if (days < 1)   return 'today';
    if (days === 1) return 'yesterday';
    if (days < 30)  return `${days} days ago`;
    if (days < 60)  return 'last month';
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    const years = Math.floor(days / 365);
    return years === 1 ? 'last year' : `${years} years ago`;
  }

  async function fetchRepos() {
    try {
      const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null');
      if (cached && Date.now() - cached.at < CACHE_MS) return cached.data;
    } catch (_) { /* fall through to network */ }

    const res = await fetch(
      `https://api.github.com/users/${USER}/repos?per_page=100&sort=pushed`,
      { headers: { Accept: 'application/vnd.github+json' } }
    );
    if (!res.ok) throw new Error('GitHub API ' + res.status);
    const data = await res.json();

    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data }));
    } catch (_) { /* quota or private mode — network each time is fine */ }

    return data;
  }

  function render(repos) {
    const byName = new Map(repos.map((r) => [r.name.toLowerCase(), r]));

    document.querySelectorAll('[data-gh-repo]').forEach((host) => {
      const repo = byName.get(host.dataset.ghRepo.toLowerCase());
      if (!repo) { host.classList.add('gh-unavailable'); return; }

      const set = (sel, value) => {
        const el = host.querySelector(sel);
        if (el && value != null && value !== '') el.textContent = value;
      };

      set('[data-gh="language"]', repo.language);
      set('[data-gh="stars"]',    repo.stargazers_count);
      set('[data-gh="updated"]',  relativeDate(repo.pushed_at));

      // Star chip only earns its place once there's a star to show.
      const starChip = host.querySelector('[data-gh-chip="stars"]');
      if (starChip && !repo.stargazers_count) starChip.hidden = true;

      host.classList.add('gh-live');
    });
  }

  async function init() {
    if (!document.querySelector('[data-gh-repo]')) return;
    try {
      render(await fetchRepos());
    } catch (err) {
      // Rate-limited or offline: the hardcoded fallback text in the HTML stands.
      console.warn('[github-activity]', err.message);
      document.querySelectorAll('[data-gh-repo]').forEach((h) => h.classList.add('gh-unavailable'));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
