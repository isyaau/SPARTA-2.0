/**
 * Cloudflare Worker - SPARTA KOPINKA landing page gateway
 *
 * Menyajikan halaman brand SPARTA KOPINKA di domain sendiri (sparta.kopinka.com)
 * dengan tombol "Buka Aplikasi" yang mengarah ke web app Google Apps Script:
 *   https://script.google.com/macros/s/AKfycbzOyxDPX0.../exec
 *
 * CATATAN (penting — terverifikasi via headless Chrome 24/09/2026):
 *  - iframe-embed GAS DIBLOKIR: response /exec mengirim `X-Frame-Options: SAMEORIGIN`
 *    + CSP `frame-ancestors 'self'`; browser menolak menampilkan app dalam iframe
 *    di domain non-Google ("Refused to display ... because it set 'X-Frame-Options'").
 *  - reverse-proxy penuh juga ditolak oleh client mae Google
 *    ("posting uri is not valid: <origin non-Google>") karena google.script.run
 *    hanya valid dari origin script.google.com.
 *  Karenanya Worker ini berperan sebagai gateway/halaman pembuka, bukan proxy/iframe.
 */

const APP_URL =
  'https://script.google.com/macros/s/AKfycbzOyxDPX0ifsL0A7d0KFrQ7UOqQaw67U8C1RHx0M8rz1q8eRfjShm2yzq3aWP7YRcIs4A/exec';

const APP_VERSION = 'v2.0.33';

const PAGE = `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SPARTA KOPINKA</title>
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<style>
  :root{--red:#dc2626;--red-dark:#991b1b;--dark:#1f2937;--muted:#6b7280;}
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{height:100%}
  body{font-family:"Segoe UI",system-ui,-apple-system,Arial,sans-serif;background:radial-gradient(1200px 600px at 80% -10%,#7f1d1d 0%,#450a0a 45%,#1f130f 100%);color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px}
  .card{max-width:420px;width:100%;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:20px;padding:44px 36px;text-align:center;backdrop-filter:blur(6px);box-shadow:0 30px 60px rgba(0,0,0,.45)}
  .logo{width:76px;height:76px;border-radius:18px;background:linear-gradient(135deg,#ef4444,#991b1b);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:38px;font-weight:800;box-shadow:0 12px 28px rgba(220,38,38,.45)}
  h1{font-size:26px;letter-spacing:.5px}
  .sub{color:#fecaca;margin:8px 0 26px;font-size:14px}
  .btn{display:inline-block;width:100%;padding:14px 20px;border-radius:12px;background:linear-gradient(135deg,#ef4444,#b91c1c);color:#fff;text-decoration:none;font-size:16px;font-weight:700;letter-spacing:.4px;transition:transform .12s ease,box-shadow .12s ease;box-shadow:0 10px 24px rgba(220,38,38,.4)}
  .btn:hover{transform:translateY(-2px);box-shadow:0 14px 30px rgba(220,38,38,.55)}
  .btn:active{transform:translateY(0)}
  .foot{margin-top:26px;color:rgba(255,255,255,.55);font-size:12px}
</style>
</head>
<body>
  <div class="card">
    <div class="logo">S</div>
    <h1>SPARTA KOPINKA</h1>
    <p class="sub">Aplikasi Voucher &amp; Piutang — silakan masuk untuk melanjutkan</p>
    <a class="btn" href="${APP_URL}" target="_blank" rel="noopener">Buka Aplikasi</a>
    <div class="foot">${APP_VERSION} &middot; Kopinka</div>
  </div>
</body>
</html>`;

const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#dc2626"/><text x="16" y="22" font-family="Arial,sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="white">S</text></svg>`;

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === '/favicon.ico' || url.pathname === '/favicon.svg') {
      return new Response(ICON_SVG, {
        headers: {
          'content-type': 'image/svg+xml',
          'cache-control': 'public, max-age=86400',
        },
      });
    }

    return new Response(PAGE, {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-cache',
      },
    });
  },
};