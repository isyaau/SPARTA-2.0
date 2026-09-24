# AGENTS.md - SPARTA KOPINKA

## Aturan rilis otomatis (WAJIB setiap ada perubahan)

Setiap kali membuat perubahan kode pada project ini, WAJIB langsung:

1. Bump versi (patch) di semua tempat berikut agar sama:
   - `Code.gs` -> `var APP_VERSION = 'x.y.z';`
   - `Index.html` -> `<div ... id="login-version">vX.Y.Z</div>`
   - `Index.html` -> `<small ...>vX.Y.Z</small>` (footer sidebar)
2. Validasi sintaks HTML/JS sebelum commit:
   `$c = Get-Content -Raw "Index.html"; $m = [regex]::Matches($c, '(?s)<script>(.*?)</script>'); $i=0; foreach($x in $m){ $i++; $x.Groups[1].Value | Out-File -Encoding utf8 "$env:TEMP\chk$i.js" }; Get-ChildItem "$env:TEMP\chk*.js" | ForEach-Object { node --check $_.FullName }`
3. Commit dengan format pesan: `vX.Y.Z: <ringkasan perubahan>`
4. Push ke `origin main`
5. Deploy ke Apps Script (web app test)
6. Deploy Worker (sinkronkan asset aplikasi `sparta.kopinka.com`):
   `Copy-Item -Force Index.html cloudflare\public\index.html`
   `cmd /c "wrangler deploy"` (dari folder `cloudflare`)

Tidak perlu menunggu diminta lagi; lakukan semuanya sampai deploy selesai.

## Perintah

Jalankan clasp lewat `cmd /c` (PowerShell execution policy memblokir `clasp.ps1`).

```powershell
# commit + push
git add -A
git commit -m "vX.Y.Z: ringkasan"
git push origin main

# deploy (proyek aktif = SPARTA MAIN; .clasp.json sudah diarahkan ke scriptId proyek tersebut)
cmd /c "clasp push -f"
cmd /c "clasp deploy -i AKfycbzOyxDPX0ifsL0A7d0KFrQ7UOqQaw67U8C1RHx0M8rz1q8eRfjShm2yzq3aWP7YRcIs4A -d v2.0.35"

# deploy worker + sinkronisasi asset aplikasi (Index.html -> public/index.html)
Copy-Item -Force Index.html cloudflare\public\index.html
cmd /c "wrangler deploy"   # jalankan dari folder cloudflare
```

Setara dengan `npm run deploy` (butuh clasp global; `node_modules` tidak diinstal).

## Keadaan terakhir (v2.0.38)

- **Bridge HIDUP end-to-end** (v2.0.38): `/api` → OAuth refresh-token `administrator@kopinka.com` → `script.projects.run` → fungsi GAS berjalan nyata (login teruji: `{"message":"Username tidak terdaftar.","ok":false}`); sheet Users = 20 baris. Tiga syarat setup mode B yang TERTULIS tapi WAJIB ada (tanpanya `run()` gagal cryptic `We're sorry, a server error occurred while reading from storage. Error code NOT_FOUND.`):
  1. **OAuth Client ID "Desktop app"** + consent scopes `script.scriptapp script.projects spreadsheets drive` (redirect `http://localhost`, `access_type=offline&prompt=consent`) → `refresh_token`; `wrangler secret put GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET/GOOGLE_REFRESH_TOKEN`.
  2. **Enable API di GCP project pemilik OAuth client**: Apps Script API **+ Google Sheets API + Google Drive API** (bila Sheets/Drive off → 403 `SERVICE_DISABLED`).
  3. **Deployment jenis "API executable" di proyek Apps Script** (Deploy → New deployment → **API executable**; Execute as: *Me*; Who has access: *Only myself*). TANPA deployment API executable ini, `script.projects.run` (via scriptId & deploymentId web-app) selalu gagal NOT_FOUND di atas. Setelah dibuat, `run()` via scriptId langsung bekerja.
  (Selama diagnosis, identitas diverifikasi: project.get 200, `parentId`=SPARTA MAIN, owner=token pemakai; Web-app deployments saja TIDAK cukup.)

- **Aplikasi di-host penuh di `sparta.kopinka.com` + bridge Apps Script Execution API** (v2.0.35): Worker menyajikan aplikasi (copy `Index.html` = `cloudflare/public/index.html` + `assets` wrangler) langsung di domain sendiri; di `Index.html` ada **Runtime Bridge** yang mengganti `google.script.run` → `fetch POST /api` (aktif hanya saat host bukan `script.google.com`; jalur GAS asli tetap native). Worker `/api` → OAuth2 → `script.projects.run` dengan `devMode:false` (versi deployment terbaru, sama dgn /exec). **Dua mode kredensial** (prioritas SA bila ada): (A) SA JSON → secret `GOOGLE_SA_JSON` (JWT RS256); (B) user OAuth → secret `GOOGLE_REFRESH_TOKEN`+`GOOGLE_CLIENT_ID`+`GOOGLE_CLIENT_SECRET` (grant refresh_token, TANPA SA/key — jalur aman bila org memblokir `iam.disableServiceAccountKeyCreation`). **Setup 1x (mode B)**: (a) GCP: konsen OAuth (External, akun di-test user) + buat **OAuth Client ID "Desktop app"**; (b) buka URL auth dgn scopes `script.scriptapp script.projects spreadsheets drive`, `access_type=offline&prompt=consent`; (c) tukar `code` (redirect `http://localhost`) jadi `refresh_token`; (d) `wrangler secret put` ketiganya lalu `wrangler deploy`. CATATAN refresh token 7 hari expire bila consent screen masih **Testing** — publikasikan ke **In production** (internal) / set **Internal** bila Workspace. Uji: `Invoke-WebRequest https://sparta.kopinka.com/api -Method Post -Body '{"fn":"<fungsi ringan>","args":[]}'`.

- **Kode siap eksekusi detached** (bagian dari v2.0.35): konstanta `SPARTA_MAIN_ID = '1AJ5C-sKWympMrCJssqd-ahid3P6MAhy572T11_83GH8'`; `getSpreadsheet_()` & semua `getActiveSpreadsheet()` dialihkan ke `ssMain_()` (pakai active bila ada, fallback `openById(SPARTA_MAIN_ID)`); `localSpreadsheetId_()` fallback ke `SPARTA_MAIN_ID`. Setara saat dijalankan via menu editor/web app bound maupun Execution API.
- **Web app bisa diakses siapa saja (login aplikasi), + dulu landing page gateway** (v2.0.33) `appsscript.json` `webapp.access` = `ANYONE_ANONYMOUS` (tidak perlu login Google, cukup login aplikasi SPARTA; `executeAs` tetap `USER_DEPLOYING`). `cloudflare/worker.js` + `wrangler.toml` (custom domain `sparta.kopinka.com`) menyajikan **landing page brand SPARTA** dgn tombol "Buka Aplikasi" → exec url GAS `AKfycbzOyxDPX0...`, + favicon. JANGAN coba reverse-proxy/iframe penuh lagi — sudah dibuktikan via headless Chrome & perbandingan deployment:
- iframe-embed/exec-url GAS kirim `X-Frame-Options SAMEORIGIN` (+ CSP `frame-ancestors 'self'`) hingga browser menolak frame ("Refused to display ... X-Frame-Options");
- reverse-proxy penuh ditolak client mae ("posting uri is not valid");
- header anti-frame hanya ada di **deployment baru**: deployment lama (contoh iframe Sikontak `AKfycbwDio...`, sikontak-proyek @9) TIDAK mengirim header tsb → bisa di-iframe; manifest (`webapp.executeAs/access`) identik, jadi TIDAK ada setting yang bisa mematikan header — kebijakan server Google oleh umur deployment.

- **Alihkan ke sumber & target MAIN** (v2.0.32): source data dipindah dari dev ke **MyKopinka MAIN** (`19E5XHDmDdozgqOuonxxINZSxdJzlOq54pBQPK8lijrE`; voucher/piutang/data/notif anggota) dan **HRIS MAIN** (`1cmW56ti-flwoHLp_hG4P2stbMQ2ZwR-u6XgXWTVKd28`; voucher/piutang/data/notif karyawan) di konstanta `Code.gs` (VOUCHER_/PIUTANG_/DATA_/NOTIF_*); target deploy `.clasp.json` = proyek **SPARTA MAIN** (`1Xsg8Dqo6sXaiYyRp2_vyLo0HspFI27X27RVRsONRSf7C_jNuPhpw4Txa`, sebelumnya berisi kode lama v1.6.x — sudah ditimpa v2.0.32), deployment baru `AKfycbzOyxDPX0...` @77.
- **Audit Redeem: rekap selisih per kode voucher** (v2.0.31): kartu baru `Rekap Selisih Per Kode Voucher (temuan data)` memecah selisih per-voucher — kode/identitas/nama/status/bulan terbit + jenis selisih (Used tanpa mutasi, multi mutasi, nominal tidak sama, status tidak konsisten, mutasi tanpa voucher), nilai voucher vs total redeem + selisih Rp (positif/negatif), TOTAL di footer; baris `Nominal tidak sama` ikut diexport. Backend `getAuditRedeem`.
- **Audit Redeem: rekap per bulan kini attach balik ke bulan terbit** (v2.0.30): baris redeem di-attach ke bulan voucher terbit via kode voucher (`bulanKey_(v.AktifMulai)`); mutasi tanpa voucher induk tetap dihitung pada bulan transaksinya — voucher yang diperpanjang jadi tidak menimbulkan selisih palsu. Label kolom tabel jadi `Redeem (lembar/Rp)`.
- **Tema senada merah** (v2.0.29): override CSS menetralkan sisa warna biru bawaan Bootstrap ke palet merah (`--primary:#dc2626`) — `text/bg/border-primary`, `btn-primary/outline-primary/info`, link, pagination, fokus input/select, checkbox, dropdown aktif.
- **Laporan Voucher, Wajib Belanja, dan Audit Redeem untuk Anggota & Karyawan** (v2.0.28): ketiga menu punya toggle `Anggota | Karyawan` (parameter `kind`). Backend memilih sumber mirror `karyawan`/`anggota` (voucher & mutasi) dan master (anggota eksternal / `readDataKaryawan_`); label kolom menyesuaikan (NoAnggota→NIP, Kelompok→Unit, kolom NIP→Bagian). `getLaporanVoucherAnggota`, `getLaporanWajibBelanja`, `getAuditRedeem` menerima `data.kind`.

- **Menu Audit Data Redeem** (v2.0.27): pembanding voucher berstatus `Used` (sheet Voucher) vs baris log redeem (sheet Mutasi) via kode voucher — kartu ringkasan (Used/Mutasi/Selisih), rekap per bulan, daftar **Used tanpa log mutasi**, **mutasi tanpa voucher induk**, **status tidak konsisten**, dan **multi mutasi**; export XLSX/CSV. Backend `getAuditRedeem`.

- **Menu Laporan Program Wajib Belanja Anggota** (v2.0.26): rekap bulanan (No/Bulan + Diterbitkan & Redeem & Sisa dalam lembar+Rp + persentase realisasi, baris TOTAL) dari sheet voucher anggota (bulan terbit = `AktifMulai`) dan sheet mutasi anggota (redeem di-attach kembali ke bulan penerbitan via `KodeVoucher`; bila kode tidak ketemu, masuk ke bulan redeem); detail per outlet (`Toko` mutasi) nominal + jmlh voucher dengan baris TOTAL, "Data update" = tanggal terakhir redeem/ hari ini; filter tahun, export XLSX (2 sheet)/CSV, cetak. Backend `getLaporanWajibBelanja`.
- **Menu Laporan Voucher Anggota** (v2.0.25): halaman rekap voucher per anggota (NoAnggota/Nama/NIP/Kelompok + jumlah used/active/expire/active+expire + nilai rupiah used/active/expired) dari mirror sheet voucher anggota + master anggota eksternal; filter cari & kelompok, pager, export XLSX/CSV, cetak. Backend `getLaporanVoucherAnggota` + `statusVoucherRekap_` — **expired dihitung dari `ExpDate` < tanggal hari ini (bukan kolom Status)**, format tanggal ISO `yyyy-MM-dd` atau `dd/MM/yyyy` via `parseDateStr_`; Status `Used` tetap prioritas (used), sisanya active.
- Target deploy = **SPARTA MAIN** (scriptId `1Xsg8Dqo6sXaiYyRp2_vyLo0HspFI27X27RVRsONRSf7C_jNuPhpw4Txa` di `.clasp.json`), sebelumnya proyek salinan `1dcgyO1KV...`. Deployment stabil `AKfycbzOyxDPX0...` @77 (v2.0.32); deployment @HEAD `AKfycbwhx0IopbWxEXpZjcYHN4FvN0h_0l4SeEIszCmt3zh4` menjalankan kode terbaru juga. Deployment lama dev (`AKfycbzY4u5...`, `AKfycbw3Ax...`) tetap ada di proyek salinan.
- Jalur cepat **Advanced Sheets service** aktif (`probeApi:true`); konteks web app TIDAK punya `script.external_request`, jadi UrlFetchApp TIDAK dipakai — semua baca/tulis external & mirror lewat `Sheets.*`. `sheetsApiFetch_()` adalah wrapper ke `Sheets.Spreadsheets.Values.get/append/batchUpdate`.
- **Cache voucher eksternal format kompak** `{h, v}` (`voucherCacheDecode_`, `patchVoucherCacheCompact_`); format lama array-objek dikonversi ke kompak saat patch. Isolasi hanya key `voucher_<id>_<sheet>`; cache lain tetap array-objek. Hit memaksa decode+normalisasi ulang (sesiRead ~1,2s tak turun; yang menang: patchCache 2970→1832ms).
- **Batch tulis mirror lokal**: `mirrorBatchBegin_`/`mirrorBatchPush_`/`mirrorBatchCommit_` menggabungkan semua tulis `Sheets.*` ke workbook SPARTA (voucher mirror cell via `mirrorSetCellsBulk_`, piutang & mutasi append via `mirrorAppendRows_`) menjadi **1 `Values.batchUpdate`** di akhir `redeemVoucher` (dengan fallback `setColBatch_`/`setValues` dan commit pengaman di `finally`). Bila batch tidak aktif (probe false), tiap fungsi memakai jalur lamanya sendiri.
- Cache voucher eksternal & semua cache mirror TTL 12 jam (`43200`) — termasuk `patchMirrorCacheStatus_` (sebelumnya 300).
- setupWarmTrigger: WAJIB dijalankan sekali di editor proyek aktif agar cache tidak dingin (baca dingin dari sheet besar masih 20-30 detik; loadDashboard dingin terukur ~32s).
- Los/test: 2 redeem berturut-turut di incognito (footer versi), seg dari F12; server ±11-13s, patchCache 1,8-2,3s.

## Catatan teknis

- Runtime: Google Apps Script V8. File: `Code.gs`, `Index.html`, `appsscript.json`.
- JANGAN ubah ID/sheet/fungsi internal hanya untuk mengubah label tampilan.
- Jaga kesimbangan string HTML pada render kartu/tabel; assignment tidak boleh berada di tengah konkatenasi string (menyebabkan `Invalid left-hand side in assignment`).
