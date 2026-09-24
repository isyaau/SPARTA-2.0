# AGENTS.md - SPARTA KOPINKA

## Aturan rilis otomatis (WAJIB setiap ada perubahan)

Setiap kali membuat perubahan kode pada project ini, WAJIB langsung:

1. Bump versi (patch) di semua tempat berikut agar sama:
   - `Code.gs` -> `var APP_VERSION = 'x.y.z';`
   - `Index.html` -> `<div ... id="login-version">vX.Y.Z</div>`
   - `Index.html` -> `<small ...>vX.Y.Z</small>` (footer sidebar)
2. Validasi sintaks HTML/JS sebelum commit:
   `$c = Get-Content -Raw "Index.html"; $m = [regex]::Matches($c, '(?s)<script>(.*?)</script>'); $i=0; foreach($x in $m){ $i++; $x.Groups[1].Value | Out-File -Encoding utf8 "$env:TEMP\chk$i.js" }; node --check "$env:TEMP\chk1.js"; node --check "$env:TEMP\chk2.js"`
3. Commit dengan format pesan: `vX.Y.Z: <ringkasan perubahan>`
4. Push ke `origin main`
5. Deploy ke Apps Script (web app test)

Tidak perlu menunggu diminta lagi; lakukan semuanya sampai deploy selesai.

## Perintah

Jalankan clasp lewat `cmd /c` (PowerShell execution policy memblokir `clasp.ps1`).

```powershell
# commit + push
git add -A
git commit -m "vX.Y.Z: ringkasan"
git push origin main

# deploy (proyek aktif = copy workbook; .clasp.json sudah diarahkan ke scriptId proyek tersebut)
cmd /c "clasp push -f"
cmd /c "clasp deploy -d v2.0.24"
```

Setara dengan `npm run deploy` (butuh clasp global; `node_modules` tidak diinstal).

## Keadaan terakhir (v2.0.24)

- Target deploy = **proyek salinan** (scriptId `1dcgyO1KVaynzlDxXrLA5UqLLBx9KI5o-iMP9d3mjylclcoR0kTaTkD1h` di `.clasp.json`). Deployment lama `AKfycbyAL4...` sudah dihapus; release v2.0.24 dibuat deployment baru `AKfycbzY4u5... @20`. Deployment read-only @HEAD `AKfycbw3Ax...` menjalankan kode terbaru juga.
- **Menu Laporan Voucher Anggota** (v2.0.24): halaman rekap voucher per anggota (NoAnggota/Nama/NIP/Kelompok + jumlah used/active/expire/active+expire + nilai rupiah used/active/expired) dari mirror sheet voucher anggota + master anggota eksternal; filter cari & kelompok, pager, export XLSX/CSV, cetak. Backend `getLaporanVoucherAnggota` + `statusVoucherRekap_` — status diawali `expir` dipetakan ke expired.
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
