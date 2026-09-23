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

# deploy
cmd /c "clasp push -f"
cmd /c "clasp deploy -i AKfycbws7Fcy7EmojeV0lFGcqsNf2sY45gwlp8GvcuFDJJTsAPD5WuoUIVp8V7oXRjp3QaOa3g -d deploy-test"
```

Setara dengan `npm run deploy` (butuh clasp global; `node_modules` tidak diinstal).

## Catatan teknis

- Runtime: Google Apps Script V8. File: `Code.gs`, `Index.html`, `appsscript.json`.
- JANGAN ubah ID/sheet/fungsi internal hanya untuk mengubah label tampilan.
- Jaga kesimbangan string HTML pada render kartu/tabel; assignment tidak boleh berada di tengah konkatenasi string (menyebabkan `Invalid left-hand side in assignment`).
