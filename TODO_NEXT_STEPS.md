# TODO — Next Steps INERTIA

Diperbarui: 15 November 2026
Fokus hari ini: **frontend** (`app/`). On-chain ditunda sampai Devnet SOL tersedia.

## Status ringkas

| Item | Kondisi |
| --- | --- |
| Web live | https://mcybernet.github.io/INERTIA/ (masih mint/pool **v1**) |
| Mint v2 | `D6AQTpVJdWpBMb6i1cMFit58rtgCiTPNXpFNQGJoC7Q6` — 50 jt INRT, authority `null` |
| Pool v2 | **belum ada** (butuh seed 4,8 SOL) |
| Payer Devnet | `Gb6zQbxTvh65TSx8aQ6gqYCtrfPnribiqxBgo73yxKgt` = 0,955 SOL (kurang ±3,95) |
| Repo | publik, homepage/topics/LICENSE kosong |

---

## 1. Frontend — dikerjakan hari ini

### FE-1 · Akses jual/beli di mobile
- [x] Bar bawah sticky `Beli INRT` / `Jual INRT` di semua halaman kecuali `/trade`.
- [x] Link `#buy` / `#sell` langsung memilih sisi panel (hash listener).
- [x] Tidak mengubah urutan desktop.
- [x] Verifikasi Playwright 390×844: tradeBar tampil di `/`, hilang di `/trade`, overflow 0.

### FE-2 · Lapisan konfigurasi jaringan (siap cutover v2)
- [x] `NEXT_PUBLIC_MINT`, `NEXT_PUBLIC_POOL`, `NEXT_PUBLIC_OWNER`, `NEXT_PUBLIC_OWNER_ATA` di `src/lib/constants.ts`, fallback v1.
- [x] `KNOWN_ACCOUNTS` memuat alamat v1 + v2 sekaligus; label pool mengikuti `NEXT_PUBLIC_POOL_LABEL`.
- [x] Label generasi (`v1/v2`) di header.
- [x] Build deterministik: `next build` selalu `/INERTIA`, `next dev` di root (tanpa env).
- [x] Cutover v2 = ganti env + rebuild, tanpa edit kode.

### FE-3 · Metadata & share preview
- [x] `metadataBase`, title/description per halaman, canonical ke URL Pages.
- [x] OpenGraph + Twitter card memakai `assets/inertia-logo.png`.
- [x] `manifest.webmanifest`, `robots.txt`, `sitemap.xml`, ikon SVG.
- [x] Cek `view-source` build statis: canonical & manifest basePath-aware.

### FE-4 · Tabel aktivitas
- [x] Filter `Semua / Beli / Jual / Massa / Seed` (client-side, dari cache riwayat).
- [x] Tombol "muat lebih" (8/20/40 → bertahap), reset saat filter diganti.
- [x] Kolom waktu/tipe/token/SOL/harga/wallet konsisten dengan data event.
- [x] Empty state jelas; skeleton hanya saat belum ada event.
- [ ] Kolom tier di tabel aktivitas (dipindah ke halaman Holders).

### FE-5 · Ketahanan & state
- [x] Satu `DataProvider` untuk semua halaman; polling berhenti saat `document.hidden` dan refresh saat tab kembali.
- [x] Refresh global di header (pool + riwayat + holder).
- [x] Skeleton tinggi tetap pada chart, trade panel, dan tabel.
- [ ] Tombol "coba lagi" per panel (pool, riwayat, holders).
- [ ] Banner offline (`navigator.onLine`) terpisah dari banner RPC.

### FE-6 · A11y & detail interaksi
- [x] `aria-label` pada tombol ikon (refresh, menu mobile, copy, progress bar).
- [x] `aria-current` pada nav aktif, `aria-expanded` pada menu mobile.
- [x] Tombol copy untuk mint, pool, program, vault, reserve, owner.
- [x] Progress riwayat diumumkan (`role="status"`, `aria-live="polite"`).
- [ ] Audit kontras `dim` di atas `ink` ≥ 4,5:1 dan `prefers-reduced-motion`.

### FE-7 · Chart
- [x] Default candle 4J, `barSpacing` maks 22 px, `rightOffset` 4.
- [x] Label progres fetch di footer chart (`n/total tx`) tanpa mengubah skala.
- [x] Legend OHLC + volume + jumlah trade; ikut crosshair, kembali ke candle terakhir.
- [x] OHLC kontinu: `open` = close candle sebelumnya, high/low memasukkan open.
- [x] Bucket WIB: 1J mulai 00:00, 4J di 00/04/08/12/16/20, 1Mgg mulai Senin.
- [x] Seed diambil sekali dari signature tertua, disimpan di `inrt:launch:v1:<mint>`.
- [x] Penanda `LAUNCH` + tombol "Sejak launch" (pilih timeframe terkecil yang masih memuat launch).
- [x] Timeframe 1H/1Mgg tampil abu-abu sampai riwayat 7/28 hari.
- [x] Batas 1.500 bar per timeframe + cache per timeframe + precompute saat idle.
- [ ] Timeframe terakhir disimpan di `localStorage` (`inrt:tf`).

### FE-8 · Verifikasi rilis frontend
- [x] `npx tsc --noEmit` bersih; build statis 11 route sukses.
- [x] Playwright desktop 1440×900 & mobile 390×844: 0 console error, 0 request ≥400, overflow 0.
- [x] Render progresif terukur: event pertama ±4 dtk, tabel penuh ±13 dtk, selesai ±39 dtk (27 tx).
- [x] `scripts/deploy-pages.sh` + `gh api --method POST repos/Mcybernet/INERTIA/pages/builds` (gh-pages `8af34da`).
- [x] Cek live 7 halaman: status 200, chart canvas render, harga on-chain, trade panel muncul, wallet button ada.

### Catatan insiden deploy
Build yang dijalankan dari WSL/git-bash tidak meneruskan `GITHUB_PAGES` ke npm
Windows → aset tanpa `/INERTIA` → seluruh halaman 404. Sekarang basePath
ditentukan dari fase build dan deploy script menolak push bila aset tidak
berprefix.

---

## 2. On-chain — setelah Devnet SOL masuk

- [ ] Top-up `Gb6z…xKgt` ±4 SOL Devnet (faucet web login GitHub; `requestAirdrop` 410).
- [ ] `scripts/devnet.sh init D6AQ…C7Q6`
- [ ] `scripts/devnet.sh seed D6AQ…C7Q6 4.8 960000`
- [ ] `scripts/devnet.sh reserve D6AQ…C7Q6 9600000` (Mass Reserve 10 jt)
- [ ] Distribusi owner 39,04 jt ke ATA tujuan.
- [ ] Jalankan FE-2 dengan env v2, rebuild, deploy, verifikasi.
- [ ] Update `README.md` + `app/README.md` dengan alamat v2.

## 3. Operasional & repo

- [ ] Keeper `add_mass` (setelah fee vault ≥ 1 SOL) + cron/systemd + log.
- [ ] RPC privat (Helius/QuickNode) → holder top-20 + `NEXT_PUBLIC_ENABLE_LARGEST_ACCOUNTS=1`.
- [ ] `gh repo edit`: homepage = URL live, topics (`solana`, `anchor`, `devnet`, `token`, `nextjs`).
- [ ] `LICENSE` MIT.
- [ ] Dokumentasikan status v1→v2 di README.

## Definition of done hari ini

Frontend dianggap selesai bila FE-1 sampai FE-6 lulus verifikasi Playwright dan
sudah ter-deploy ke https://mcybernet.github.io/INERTIA/ tanpa regresi chart 1J.
