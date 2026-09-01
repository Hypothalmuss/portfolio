# Portfolio — Mohamed Nadim Touil

Robotics software engineering portfolio, hosted on GitHub Pages at
**<https://hypothalmuss.github.io/portfolio/>**

Static HTML, CSS and vanilla JS — no build step, no framework, no dependencies.
Edit a file, commit, push; Pages deploys it.

## Structure

```
index.html              Home — hero, about, experience, education, projects, contact
projects/
  go2.html              Go2 quadruped — autonomous exploration & mapping
  tog-sim.html          Vision-guided high-speed pick & place cell
  ur3e.html             UR3e pick-and-place cell
  cartpole.html         CartPole Goes Brrr — reinforcement learning
style.css               Design tokens + home page styles
project.css             Project detail page styles (loaded only on those pages)
script.js               Nav, scroll reveal, lazy video playback
visitor.js              Greeting toast + global visitor counter
github-activity.js      Pulls live repo data from the GitHub API
worker/                 Cloudflare Worker backing the visitor counter
compress-media.sh       Re-encodes videos for the web and makes poster frames
assets/
  videos/               Demo clips, H.264, long side capped at 1280px
  posters/              Poster frame per video, so cards paint before playback
  images/               Profile photo and diagrams
  docs/                 CV (PDF)
```

## The visitor counter

The counter is real and global, backed by a Cloudflare Worker with a KV store.
**No API key lives in this repository** — the browser can only read a number,
and the increment happens server-side, deduped to one count per visitor per day.

**The counter is live.** It runs on Cloudflare's edge network — nothing needs to
be running on your machine. See [`worker/README.md`](worker/README.md) to
redeploy after a change.

> **Note:** a previous version of this site hardcoded a JSONBin *master key* in
> `Visitor.js`. That key is public in this repository's git history and should be
> treated as compromised — rotate or delete it in your JSONBin account.

## Live GitHub data

`github-activity.js` fills any element marked `data-gh-repo="<repo>"` with that
repository's real language, star count and last-push date, so the site updates
itself whenever you push. One API call serves a whole page, cached in
`sessionStorage` for 30 minutes.

```html
<p data-gh-repo="tog-sim">
  Last push <strong data-gh="updated">recently</strong>
</p>
```

Available fields: `data-gh="language"`, `data-gh="stars"`, `data-gh="updated"`.
If GitHub rate-limits (60 requests/hour per IP, unauthenticated), the hardcoded
fallback text in the HTML stands.

## Adding a video

Drop the file in `assets/videos/`, then:

```bash
./compress-media.sh
```

It re-encodes everything to H.264 at CRF 30 with the long side capped at 1280px,
adds `+faststart` for streaming playback, and writes a poster frame per clip into
`assets/posters/`. Requires `ffmpeg` on PATH.

Reference it with a poster so the card paints immediately:

```html
<video controls preload="none" playsinline muted poster="assets/posters/name.jpg">
  <source src="assets/videos/name.mp4" type="video/mp4" />
</video>
```

Add `autoplay loop` for a silent looping demo — `script.js` plays those only
while they are on screen and pauses them when they scroll away.

## Local preview

```bash
python -m http.server 8000
```

Then open <http://127.0.0.1:8000>. The counter's `ALLOWED_ORIGINS` in the worker
already includes `localhost:8000`.
