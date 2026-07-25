# Model Replacer Key System

Sistem key generator + expiry buat plugin ModelReplacer. Full Vercel — gak butuh database terpisah, keys disimpan di Vercel Blob.

## Setup

1. Copy folder `api/` dan `public/` ke root project Vercel kamu (bisa project baru, gak perlu digabung ke repo lain).

2. Buat Blob store dari Vercel dashboard: **Project → Storage → Create Database → Blob**. Vercel otomatis inject env var `BLOB_READ_WRITE_TOKEN` ke project — gak perlu diisi manual.

3. Install dependency:
   ```
   npm install
   ```

4. Set 1 env var tambahan di Vercel project settings:
   - `ADMIN_SECRET` — password bebas buat proteksi dashboard admin. Contoh: generate random string panjang.

5. Deploy. File `license-keys.json` di Blob store otomatis dibuat saat key pertama kali di-generate — gak perlu setup manual apapun.

6. Buka dashboard di `https://<project-kamu>.vercel.app/admin.html`, masukin `ADMIN_SECRET`, generate key dari situ.

## Endpoints

| Endpoint | Method | Auth | Fungsi |
|---|---|---|---|
| `/api/validate` | POST | none (dipanggil dari plugin) | cek key valid/expired |
| `/api/generate` | POST | admin | buat key baru + set durasi expired |
| `/api/keys` | GET | admin | list semua key |
| `/api/revoke` | POST | admin | revoke / aktifkan lagi / hapus key |
| `/api/update` | POST | admin | ubah expiry / label |

Admin auth pakai header `x-admin-secret: <ADMIN_SECRET>`.

## Catatan soal Blob storage

Semua key disimpan dalam satu file JSON (`license-keys.json`) yang di-overwrite tiap ada perubahan. Ini cocok buat skala solo-dev / puluhan-ratusan key. Kalau nanti butuh ribuan key dengan banyak admin generate barengan, baru worth pindah ke database beneran — tapi untuk sekarang gak perlu.

## Plugin integration

`ModelReplacer_v3.3.lua` sudah termasuk:
- Persist key lewat `plugin:SetSetting` — user gak perlu input ulang tiap buka Studio
- Auto re-validate ke server tiap buka Studio
- Heartbeat tiap 5 menit re-check ke server — begitu key expired/revoke, plugin otomatis logout balik ke layar key

Tinggal ganti `KEY_API_URL` di baris atas file ke domain Vercel kamu, contoh:
```lua
local KEY_API_URL = "https://model-replacer-keys.vercel.app/api/validate"
```
