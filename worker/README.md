# Portfolio visitor counter (Cloudflare Worker)

Replaces the old JSONBin counter, which exposed a **master API key** in public
page source and therefore let anyone read, reset or delete the count.

Here the browser can only ever *read a number*. The increment happens on
Cloudflare's edge, and each visitor is counted at most once per 24 hours
(deduped by a salted SHA-256 of IP + user-agent + date — no raw IP is stored,
and the entry self-expires).

## Status — deployed

Live at **https://portfolio-counter.nadimtouil.workers.dev**, bound to the KV
namespace `COUNTER` (`3050bdd3dc564947a77b367ea508a0e0`). The URL is already set
as `COUNTER_API` in [`../visitor.js`](../visitor.js).

## Redeploying after a change

```bash
cd worker
wrangler deploy
```

If `wrangler login` has expired, run it again first. No other setup is needed —
`wrangler.toml` already carries the KV binding.

## Deploying from scratch (new account)

```bash
wrangler login
wrangler kv namespace create COUNTER   # paste the id into wrangler.toml
wrangler deploy                        # prints the Worker URL
```

A `workers.dev` subdomain must exist on the account before the first deploy;
Cloudflare prompts for one, and its certificate can take several minutes to
provision before the URL responds.

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
