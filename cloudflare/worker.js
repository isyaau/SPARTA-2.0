/**
 * Cloudflare Worker - SPARTA KOPINKA app host + Apps Script HTTP bridge
 *
 * Domain: sparta.kopinka.com
 *
 * Aplikasi di-host LANGSUNG di domain sendiri (static assets: public/index.html =
 * salinan Index.html). Semua panggilan `google.script.run` di frontend dialihkan
 * oleh "Runtime Bridge" (dalam Index.html) ke `POST /api`, lalu Worker ini:
 *   1. Mengirim POST ke URL web app Apps Script `/exec` dengan body
 *      { secret, fn, args } (lihat fungsi `doPost` di Code.gs).
 *   2. Web app berjalan sebagai USER_DEPLOYING (akun pemilik deployment), jadi
 *      tidak perlu OAuth/Execution API/refresh token.
 *   3. Mengembalikan { response } atau { error }.
 *
 * KEAMANAN:
 *   - Web app bersifat ANYONE_ANONYMOUS sehingga URL /exec dapat diakses publik,
 *     tetapi setiap permintaan wajib menyertakan secret `SPARTA_BRIDGE_SECRET`
 *     yang diverifikasi di Code.gs (SHA-256 base64).
 *   - Panggilan fungsi internal (akhiran "_"), doGet/doPost/bukaAplikasi ditolak.
 *
 * SETUP (sekali):
 *   - `wrangler secret put SPARTA_BRIDGE_SECRET` (harus sama dengan hash di Code.gs)
 *   - `wrangler secret put SPARTA_SYNC_SECRET` (untuk /sync-mutasi-karyawan)
 *
 * CATATAN: jalur Execution API (script.projects.run) TIDAK dipakai lagi karena
 * akun ini selalu mendapat 403 "The caller does not have permission", dan
 * refresh token user OAuth expire/revoked secara berkala.
 */

const WEBAPP_URL =
  'https://script.google.com/macros/s/AKfycbzOyxDPX0ifsL0A7d0KFrQ7UOqQaw67U8C1RHx0M8rz1q8eRfjShm2yzq3aWP7YRcIs4A/exec';

async function runScript(fn, args, env) {
  const secret = String(env.SPARTA_BRIDGE_SECRET || '');
  if (!secret) {
    return { error: { message: 'Secret SPARTA_BRIDGE_SECRET belum diset di Worker.' } };
  }
  let res;
  try {
    res = await fetch(WEBAPP_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ secret: secret, fn: fn, args: args || [] }),
      redirect: 'follow',
    });
  } catch (e) {
    return { error: { message: 'Gagal menghubungi Apps Script: ' + String((e && e.message) || e) } };
  }
  const text = await res.text();
  let j = null;
  try {
    j = JSON.parse(text);
  } catch (e) {
    j = null;
  }
  if (!j) {
    const cuplikan = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);
    return {
      error: {
        message: 'Respons Apps Script bukan JSON (HTTP ' + res.status + '): ' + cuplikan,
      },
    };
  }
  if (j.error) {
    return {
      error: {
        message: String(j.error.message || 'Script error'),
        errorType: j.error.errorType || '',
        stack: j.error.stack || '',
      },
    };
  }
  return { response: typeof j.response !== 'undefined' ? j.response : null };
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

function validSyncSecret(request, env) {
  const expected = String(env.SPARTA_SYNC_SECRET || '');
  const authorization = String(request.headers.get('authorization') || '');
  return !!expected && authorization === 'Bearer ' + expected;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/sync-mutasi-karyawan') {
      if (request.method !== 'POST') return json({ error: { message: 'Method not allowed' } }, 405);
      if (!validSyncSecret(request, env)) return json({ error: { message: 'Unauthorized' } }, 401);
      return json(await runScript('sinkronisasiMutasiKaryawan', [{ secret: env.SPARTA_SYNC_SECRET }], env));
    }

    if (url.pathname.startsWith('/api')) {
      if (request.method !== 'POST') return json({ error: { message: 'Method not allowed' } }, 405);
      let body = {};
      try {
        body = await request.json();
      } catch (e) {
        body = {};
      }
      const fn = typeof body.fn === 'string' ? body.fn : '';
      if (!fn) return json({ error: { message: 'fn wajib diisi' } }, 400);
      if (fn === 'sinkronisasiMutasiKaryawan') {
        return json({ error: { message: 'Gunakan endpoint sinkronisasi terproteksi.' } }, 403);
      }
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
