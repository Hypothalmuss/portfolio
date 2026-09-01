/**
 * Portfolio visitor counter — Cloudflare Worker
 *
 * Why this exists: the previous counter put a JSONBin *master key* in the
 * page source, so anyone could read, reset or delete the count. Here the
 * write path lives on the server and the browser only ever sees a number.
 *
 * Endpoints
 *   GET  /count  → { count }            read-only, never increments
 *   POST /hit    → { count, counted }   increments at most once per visitor/day
 *
 * Binding required: KV namespace `COUNTER` (see wrangler.toml).
 */

const ALLOWED_ORIGINS = [
  'https://hypothalmuss.github.io',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
];

const KEY_TOTAL = 'total';
const DEDUPE_TTL = 86400; // one visitor counts once per 24h

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(body, origin, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...corsHeaders(origin),
    },
  });
}

/**
 * Stable per-visitor-per-day fingerprint. Hashed so no raw IP is ever stored —
 * the KV entry is an opaque digest that expires within 24h.
 */
async function visitorHash(request) {
  const ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0';
  const ua = request.headers.get('User-Agent') || '';
  const day = new Date().toISOString().slice(0, 10);
  const data = new TextEncoder().encode(`${ip}|${ua}|${day}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)]
    .slice(0, 16)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const { pathname } = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (pathname === '/count' && request.method === 'GET') {
      const count = parseInt((await env.COUNTER.get(KEY_TOTAL)) || '0', 10);
      return json({ count }, origin);
    }

    if (pathname === '/hit' && request.method === 'POST') {
      const seenKey = `seen:${await visitorHash(request)}`;
      const already = await env.COUNTER.get(seenKey);
      let count = parseInt((await env.COUNTER.get(KEY_TOTAL)) || '0', 10);

      if (already) {
        // Returning visitor within the same day — show the number, don't inflate it.
        return json({ count, counted: false }, origin);
      }

      count += 1;
      await Promise.all([
        env.COUNTER.put(KEY_TOTAL, String(count)),
        env.COUNTER.put(seenKey, '1', { expirationTtl: DEDUPE_TTL }),
      ]);
      return json({ count, counted: true }, origin);
    }

    return json({ error: 'Not found' }, origin, 404);
  },
};
