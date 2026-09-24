/**
 * Cloudflare Worker - SPARTA KOPINKA reverse proxy
 *
 * Menyajikan Google Apps Script web app (SPARTA KOPINKA MAIN) di domain sendiri,
 * mis. https://sparta.kopinka.com — TANPA redirect.
 *
 * Cara kerja:
 *  1. Semua request (GET host page, iframe app uiv=3, RPC google.script.run POST)
 *     diteruskan server-side ke exec URL Google Apps Script.
 *  2. Redirect 302 dari script.google -> script.googleusercontent di-follow otomatis.
 *  3. Response HTML/JS/CSS di-rewrite: URL absolute ke script.google.com on
 *     script.googleusercontent (path /macros/s/<ID>) diganti ke origin Worker.
 *  4. Header keamanan (CSP / X-Frame-Options / content-encoding) disesuaikan
 *     agar halaman bisa disajikan dari domain sendiri.
 *
 * Wajib: session Google pemilik app masih diperlukan (access: MYSELF) — cookie
 *         request browser diteruskan apa adanya. Buka domain sambil login Google
 *         sebagai ADMIN KOPINKA.
 */

const MACROS =
  '/macros/s/AKfycbzOyxDPX0ifsL0A7d0KFrQ7UOqQaw67U8C1RHx0M8rz1q8eRfjShm2yzq3aWP7YRcIs4A';
const UPSTREAM = 'https://script.google.com';

// Preset URL Google yang di-rewrite menjadi origin Worker.
const REWRITE = 'https://script.google.com' + MACROS;             // host page, iframe app, RPC
const REWRITE_ALT = 'https://script.googleusercontent.com' + MACROS; // host setelah redirect 302

const SKIP_HEADERS = new Set([
  'content-security-policy',
  'content-encoding',
  'content-length',
  'transfer-encoding',
  'x-frame-options',
  'x-content-security-policy',
  'x-webkit-csp',
]);

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const ourOrigin = url.origin;

    // Map path di domain kita -> path upstream di script.google.com.
    // '/'            -> host page (exec)
    // '/exec', dst. -> halaman app / RPC, hasil rewrite di bawah
    const path =
      url.pathname === '/'
        ? MACROS + '/exec'
        : url.pathname.startsWith(MACROS)
          ? url.pathname
          : MACROS + url.pathname;

    const upstreamUrl = UPSTREAM + path + url.search;

    const init = {
      method: request.method,
      headers: request.headers,
      redirect: 'follow', // ikuti 302 -> script.googleusercontent.com
    };
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      init.body = request.body;
    }

    let upstream;
    try {
      upstream = await fetch(upstreamUrl, init);
    } catch (e) {
      return new Response('Proxy error: ' + e.message, { status: 502 });
    }

    const contentType = upstream.headers.get('content-type') || '';
    const headers = new Headers();
    upstream.headers.forEach((value, key) => {
      if (!SKIP_HEADERS.has(key.toLowerCase())) headers.set(key, value);
    });
    headers.set('cache-control', 'no-store');

    // Rewrite hanya untuk body teks (HTML app / JS client / CSS).
    const needsRewrite = /text\/html|text\/javascript|application\/javascript|text\/css/.test(contentType);

    if (needsRewrite) {
      let text = await upstream.text();
      text = text.split(REWRITE).join(ourOrigin).split(REWRITE_ALT).join(ourOrigin);

      const enc = new TextEncoder().encode(text);
      headers.set('content-length', String(enc.byteLength));
      headers.set('content-type', contentType.replace(/;?\s*charset=[^;]+/i, '') + '; charset=utf-8');
      return new Response(enc, { status: upstream.status, headers });
    }

    // Body non-teks (trailing slash, woff, dll) — terusan langsung.
    return new Response(upstream.body, { status: upstream.status, headers });
  },
};