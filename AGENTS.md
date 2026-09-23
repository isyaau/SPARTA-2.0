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
cmd /c "clasp deploy -i AKfycbyAL4LeawoztLWI7ME_UrTSmuHIJTqzuFnkLdxCbKL4jYtbOSPsQPwUr0pc7PpzU8fo -d rilis"
```

Setara dengan `npm run deploy` (butuh clasp global; `node_modules` tidak diinstal).

## Keadaan terakhir (v2.0.13)

- Target deploy = **proyek salinan** (scriptId ada di `.clasp.json`, deployment `AKfycby...`). Deployment lama read-only `AKfycbw4o... @HEAD` menjalankan kode terbaru juga.
- Konteks web app **tidak punya scope `script.external_request`** (`probeApi:false` di seg redeem). Kode otomatis fallback ke `SpreadsheetApp`; probe `sheetsApiProbe_()` mengecek sekali per eksekusi dan otomatis pindah ke jalur Sheets REST bila scope tersedia.
- Cache voucher eksternal TTL 12 jam (`43200`); baca dingin via Sheets REST bila scope ada, atau `SpreadsheetApp` bila tidak.
- **WAJIB jalankan `setupWarmTrigger()` sekali di editor proyek aktif** agar cache tidak dingin (baca dingin bisa 30-40 detik).
- Bump patch versi di `Code.gs` + 2 label di `Index.html` setiap rilis.

## Catatan teknis

- Runtime: Google Apps Script V8. File: `Code.gs`, `Index.html`, `appsscript.json`.
- JANGAN ubah ID/sheet/fungsi internal hanya untuk mengubah label tampilan.
- Jaga kesimbangan string HTML pada render kartu/tabel; assignment tidak boleh berada di tengah konkatenasi string (menyebabkan `Invalid left-hand side in assignment`).
