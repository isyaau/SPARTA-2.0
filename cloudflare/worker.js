/**
 * Cloudflare Worker - SPARTA KOPINKA app host + Apps Script Execution API bridge
 *
 * Domain: sparta.kopinka.com
 *
 * Aplikasi di-host LANGSUNG di domain sendiri (static assets: public/index.html =
 * salinan Index.html). Semua panggilan `google.script.run` di frontend dialihkan
 * oleh "Runtime Bridge" (dalam Index.html) ke `POST /api`, lalu Worker ini:
 *   1. Membuat OAuth2 token dari service account (JWT RS256, client_email/private_key
 *      dari secret `GOOGLE_SA_JSON`).
 *   2. Memanggil Apps Script Execution API `script.projects.run` dengan
 *      { function, parameters, devMode: false } (menjalankan versi deployment
 *      terbaru — sama dengan yang diakses via URL /exec).
 *   3. Mengembalikan { response } atau { error }. 
 *
 * SYARAT (setup satu kali, lihat AGENTS.md):
 *   - Service account dibuat di Google Cloud + Apps Script API diaktifkan.
 *   - SA ditambah sebagai EDITOR di proyek Apps Script SPARTA MAIN
 *     (script.id `1Xsg8Dqo6sXaiYyRp2_vyLo0HspFI27X27RVRsONRSf7C_jNuPhpw4Txa`).
 *   - SA diberi akses edit ke 3 workbook: SPARTA MAIN, MyKopinka MAIN, HRIS MAIN.
 *   - `wrangler secret put GOOGLE_SA_JSON` dengan isi file key JSON service account.
 */

const SCRIPT_ID = '1Xsg8Dqo6sXaiYyRp2_vyLo0HspFI27X27RVRsONRSf7C_jNuPhpw4Txa';
const SCRIPT_RUN_URL = 'https://script.googleapis.com/v1/scripts/' + SCRIPT_ID + ':run';
const TOKEN_URI = 'https://oauth2.googleapis.com/token';
const SCOPES =
  'https://www.googleapis.com/auth/script.projects ' +
  'https://www.googleapis.com/auth/script.scriptapp ' +
  'https://www.googleapis.com/auth/script.external_request ' +
  'https://www.googleapis.com/auth/spreadsheets ' +
  'https://www.googleapis.com/auth/drive';

let tokenCache = { at: '', exp: 0 };

function base64urlBytes(u8) {
  let s = '';
  for (let i = 0; i < u8.length; i += 0x8000) {
    s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  }
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64url(str) {
  return base64urlBytes(new TextEncoder().encode(str));
}

async function importKey(pem) {
  const b64 = pem
    .replace(/-----BEGIN [^-]+-----/g, '')
    .replace(/-----END [^-]+-----/g, '')
    .replace(/\s+/g, '');
  const der = Uint8Array.from(atob(b64), function (c) { return c.charCodeAt(0); });
  return crypto.subtle.importKey(
    'pkcs8',
    der.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
}

async function getAccessToken(env) {
  if (tokenCache.at && tokenCache.exp > Math.floor(Date.now() / 1000) + 60) {
    return tokenCache.at;
  }
  const sa = JSON.parse(env.GOOGLE_SA_JSON);
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT', kid: sa.private_key_id };
  const claims = {
    iss: sa.client_email,
    sub: sa.client_email,
    aud: sa.token_uri || TOKEN_URI,
    iat: now,
    exp: now + 3600,
    scope: SCOPES,
  };
  const signingInput = base64url(JSON.stringify(header)) + '.' + base64url(JSON.stringify(claims));
  const key = await importKey(sa.private_key);
  const sig = await crypto.subtle.sign(
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(signingInput)
  );
  const jwt = signingInput + '.' + base64urlBytes(new Uint8Array(sig));

  const res = await fetch(sa.token_uri || TOKEN_URI, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }).toString(),
  });
  if (!res.ok) {
    throw new Error('Token exchange gagal HTTP ' + res.status + ': ' + (await res.text()));
  }
  const tj = await res.json();
  tokenCache = { at: tj.access_token, exp: now + (tj.expires_in || 3600) };
  return tokenCache.at;
}

async function runScript(fn, args, env) {
  const token = await getAccessToken(env);
  const res = await fetch(SCRIPT_RUN_URL, {
    method: 'POST',
    headers: {
      authorization: 'Bearer ' + token,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ function: fn, parameters: args || [], devMode: false }),
  });
  const text = await res.text();
  let j = null;
  try { j = JSON.parse(text); } catch (e) { j = null; }
  if (!res.ok) {
    const msg = (j && j.error && (j.error.message || j.error.status + ' ' + j.error.code)) || 'HTTP ' + res.status;
    return { error: { message: String(msg), http: res.status } };
  }
  if (j && j.error) {
    const d = (j.error.details && j.error.details[0]) || {};
    const stack = (d.scriptStackTraceElements || [])
      .map(function (x) { return x.function + '@' + (x.lineNumber || '?'); })
      .join(' -> ');
    return { error: { message: String(j.error.message || d.errorMessage || 'Script error'), errorType: d.errorType || '', stack: stack } };
  }
  return { response: j && typeof j.response !== 'undefined' ? j.response : null };
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api')) {
      if (request.method !== 'POST') return json({ error: { message: 'Method not allowed' } }, 405);
      let body = {};
      try { body = await request.json(); } catch (e) { body = {}; }
      const fn = typeof body.fn === 'string' ? body.fn : '';
      if (!fn) return json({ error: { message: 'fn wajib diisi' } }, 400);
      const args = Array.isArray(body.args) ? body.args : [];
      try {
        const out = await runScript(fn, args, env);
        return json(out, 200);
      } catch (e) {
        return json({ error: { message: String((e && e.message) || e) } }, 200);
      }
    }

    // Static assets: public/index.html (aplikasi), public/favicon.svg, dsb.
    if (env.ASSETS) {
      const a = await env.ASSETS.fetch(request);
      if (a && a.status < 500) return a;
    }

    return new Response('SPARTA KOPINKA', { status: 200 });
  },
};