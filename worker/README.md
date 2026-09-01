# Portfolio visitor counter (Cloudflare Worker)

Replaces the old JSONBin counter, which exposed a **master API key** in public
page source and therefore let anyone read, reset or delete the count.

Here the browser can only ever *read a number*. The increment happens on
Cloudflare's edge, and each visitor is counted at most once per 24 hours
(deduped by a salted SHA-256 of IP + user-agent + date — no raw IP is stored,
and the entry self-expires).

## Deploy — about 3 minutes

```bash
cd worker
npm install -g wrangler       # once
wrangler login                # opens the browser

wrangler kv namespace create COUNTER
# → copy the printed id into wrangler.toml, replacing PASTE_YOUR_KV_NAMESPACE_ID_HERE

wrangler deploy
```

`wrangler deploy` prints your Worker URL, e.g.
`https://portfolio-counter.<your-subdomain>.workers.dev`

Put that URL into [`../visitor.js`](../visitor.js) as `COUNTER_API`, then commit.

## Seeding a starting number

If you want the counter to continue from a previous total rather than zero:

```bash
wrangler kv key put --binding COUNTER total "1234" --remote
```

## Endpoints

| Method | Path     | Returns              | Notes                              |
| ------ | -------- | -------------------- | ---------------------------------- |
| `GET`  | `/count` | `{ count }`          | Read-only, never increments        |
| `POST` | `/hit`   | `{ count, counted }` | `counted: false` = already seen today |

CORS is restricted to the origins listed in `ALLOWED_ORIGINS` in
[`src/index.js`](src/index.js). Add your custom domain there if you get one.

## Free tier

Workers: 100,000 requests/day. KV: 100,000 reads/day, 1,000 writes/day.
Because of the 24h dedupe, one visitor costs one write — a portfolio will not
come close to the limits.
