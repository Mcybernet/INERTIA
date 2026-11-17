# TODO — Next Steps INERTIA

Diperbarui: 17 November 2026
Status: **pool v3 live di Devnet**; web live memakai mint/pool v3, dua bahasa
(ID/EN). Sisa pekerjaan: keeper `add_mass` (menunggu fee vault >= 1 SOL) dan
operasional repo.

## Status ringkas

| Item | Kondisi |
| --- | --- |
| Web live | https://mcybernet.github.io/INERTIA/ (mint/pool **v3**) |
| Mint v3 | `7NbE5QHNRUFYL97ZB2meYrYgLvJrMBJ685AsgNwhbksN` - 50 jt INRT, authority `null`, metadata + logo aktif |
| Pool v3 | `GQxQApjSusModYFu5XCaS6CmquVmkxVX4cVeVvssDB2m` - live, seed 0,0288 SOL + 10 jt INRT |
| Mint/pool v2 | legacy: `D6AQTpVJdWpBMb6i1cMFit58rtgCiTPNXpFNQGJoC7Q6` / `6Da5fRHLjzErcjGsqHzjEc4tp15Mkp9A3grJwJtsk3oV` |
| Mint v1 | legacy: `GEovdGGfR75dLdYS5LABHR6sGf9s72fqDNkkaj9RDE4H`, tanpa metadata |
| Burn | 400.000 INRT v2 milik payer sudah dibakar; ATA v1/v2 ditutup |
| Burn v1 owner | 39.040.000 INRT v1 di `86RAJ…a24C` masih ada, hanya bisa dibakar user dari Phantom |
| Payer Devnet | `Gb6zQbxTvh65TSx8aQ6gqYCtrfPnribiqxBgo73yxKgt` = 0,005 SOL (sisa sudah dikirim ke owner) |
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
- [x] Legend menampilkan persen perubahan candle yang di-hover (close vs open), warna up/down.
- [ ] Timeframe terakhir disimpan di `localStorage` (`inrt:tf`).

### FE-9 · Versi English
- [x] Kamus ID→EN di `src/lib/i18n.ts` dengan fallback ke teks Indonesia.
- [x] `LanguageProvider` + `useI18n()`; pilihan bahasa disimpan di `localStorage` (`inrt:lang`).
- [x] Tombol `ID`/`EN` di header; `document.documentElement.lang` ikut berubah.
- [x] Format angka/tanggal mengikuti locale (`id-ID` / `en-US`), termasuk jam chart.
- [x] Semua halaman & komponen diterjemahkan; em dash `—` dihapus dari UI.
- [x] Playwright: 7 halaman EN tanpa sisa kata Indonesia, switch dua arah, 360–1280 tanpa overflow.

### FE-10 · Metrik persen chart (P0, selesai)

**Keputusan final (17 Nov 2026, revisi): header = candle berjalan.**
- Header = persen perubahan **candle berjalan** (`close` vs `open`) pada timeframe aktif, sama persis dengan Δ di legend. Tidak ada label periode (`24J`, `3,7J`, `sejak launch`) di sebelah harga.
- Keputusan konvensi 24 jam (live `c35348c`) **digantikan** oleh aturan ini karena pengguna meminta header mengikuti angka Δ realtime. Angka header sekarang berubah saat ganti timeframe.
- Legend OHLC = perubahan candle yang di-hover terhadap close candle sebelumnya (`close vs open`; ekuivalen karena `open` = prev close). Tanpa hover, legend memakai candle terakhir sehingga angkanya sama dengan header.
- Format: tanda `-` untuk turun, `+` untuk naik, nol `0,00%` tanpa tanda; warna up/down, nol muted.
- Candle flat (tanpa trade) diberi catatan `belum ada trade` / `no trades` supaya tidak terlihat rusak.
- Metrik "sejak event pertama" tetap ada di `MarketPanel` Overview; tidak diduplikasi di chart.

**Checklist implementasi (selesai, live `c35348c` + revisi header):**
- [x] Tambah `fmtSignedPct(pct)` di `format.ts` (menerima persen, bukan bps; nol `0,00%`, tanda `+`/`-`).
- [x] Hapus `changeFromEvents`/`DAY_SECONDS`/label window dari `PriceChart.tsx`; header pakai `last.close` vs `last.open`.
- [x] Tooltip header dan legend memakai kunci yang sama (`Perubahan candle (close vs open)`); kunci i18n 24 jam/window dihapus.
- [x] `npx tsc --noEmit`, `check-i18n.cjs`, `npm run build`, uji lokal: header = Δ default, berubah antar timeframe, tanpa label periode, `1H`/`1Mgg` tetap disabled.
- [x] Deploy `gh-pages`, verifikasi live, commit sumber ke `main`.

### FE-11 · Logo header & pagination activity (selesai)
- [x] Ganti SVG di anchor `aria-label="INERTIA · Overview"` dengan `assets/inertia-logo.png` (disalin ke `app/public/inertia-logo.png`, `<img>` 24x24, `alt=""` karena link sudah punya label).
- [x] `/activity`: pagination 10 baris per halaman, tombol Sebelumnya/Berikutnya, indikator halaman, hanya 10 `<tr>` di DOM.
- [x] Uji dengan 25 event sintetis: 3 halaman (10/10/5), tombol disabled di ujung, kembali ke halaman sebelumnya tetap benar.
- [x] Catatan legacy v1 `GEov…RDE4H`: metadata Metaplex tidak ada dan mint authority sudah null, jadi Phantom selalu menampilkan `Token Tidak Diketahui`. Tidak bisa diperbaiki dari web; solusinya sembunyikan atau burn/close ATA v1 dari wallet pengguna.

### FE-8 · Verifikasi rilis frontend
- [x] `npx tsc --noEmit` bersih; build statis 11 route sukses.
- [x] Playwright desktop 1440×900 & mobile 390×844: 0 console error, 0 request ≥400, overflow 0.
- [x] Render progresif terukur: event pertama ±4 dtk, tabel penuh ±13 dtk, selesai ±39 dtk (27 tx).
- [x] `scripts/deploy-pages.sh` + `gh api --method POST repos/Mcybernet/INERTIA/pages/builds` (gh-pages `8af34da`).
- [x] Cek live 7 halaman: status 200, chart canvas render, harga on-chain, trade panel muncul, wallet button ada.
- [x] Rilis i18n: gh-pages `d2fc7e3`, chart centering + legend delta + tombol bahasa.

### Catatan insiden deploy
Build yang dijalankan dari WSL/git-bash tidak meneruskan `GITHUB_PAGES` ke npm
Windows → aset tanpa `/INERTIA` → seluruh halaman 404. Sekarang basePath
ditentukan dari fase build dan deploy script menolak push bila aset tidak
berprefix.

---

## 2. On-chain — pool v2 live (17 Nov 2026)

- [x] Top-up `Gb6z…xKgt` +4 SOL Devnet (saldo jadi 4,955 SOL).
- [x] `scripts/devnet.sh init D6AQ…C7Q6` → pool `6Da5…k3oV`.
- [x] `scripts/devnet.sh seed D6AQ…C7Q6 4.8 960000` → 4,8 SOL + 960 rb INRT.
- [x] `scripts/devnet.sh reserve D6AQ…C7Q6 9600000` → Mass Reserve 9,6 jt INRT.
- [x] Distribusi owner 39,04 jt ke ATA `Eno3…Lj1L`; sisa 400 rb di payer.
- [x] Uji on-chain: beli 0,01 SOL lalu jual kembali (fee vault ±0,00095 SOL).
- [x] Kirim 0,01 SOL ke wallet owner agar ATA-nya bisa dipakai di Phantom.
- [x] Cutover default `app/` ke v2, rebuild, deploy `gh-pages` `1595cbf`, verifikasi live.
- [x] Update `README.md` + `app/README.md` dengan alamat v2.

## 3. Operasional & repo

- [ ] Keeper `add_mass` (setelah fee vault ≥ 1 SOL) + cron/systemd + log.
- [ ] RPC privat (Helius/QuickNode) → holder top-20 + `NEXT_PUBLIC_ENABLE_LARGEST_ACCOUNTS=1`.
- [ ] `gh repo edit`: homepage = URL live, topics (`solana`, `anchor`, `devnet`, `token`, `nextjs`).
- [ ] `LICENSE` MIT.
- [ ] Dokumentasikan status v1→v2 di README.

## 4. Lab Mass Well (2D mock → 3D dummy)

Tujuan: memilih representasi "Mass Well" untuk `/mass`. 2D adalah kandidat
rilis; 3D hanya eksperimen sekali pakai dan tidak boleh masuk produksi tanpa
keputusan akhir.

### Fase 0 · Keputusan (blocking)
- [ ] Pilih sumber `three` untuk lab: CDN (tanpa menyentuh `app/`) atau devDependency.
- [ ] Pilih cakupan dummy: state sekarang + 1 state terisi, atau simulasi 60 hari / 40 `add_mass`.

### Fase 1 · Kontrak data & fixture
- [ ] Definisikan kontrak: kapasitas 10.000.000 INRT, `used = initial - reserve`, `feeVaultSol`, ambang 1 SOL + rent, daftar event `{ts, sol, token}`.
- [ ] Buat fixture JSON: state 0%, 12% (3 mass), 60% (fee siap), 100%; plus timeline bila opsi 60 hari dipilih.
- [ ] Tetapkan aturan visual: radius 0, border 1px, emas hanya aksen, tanpa gradient/glow/partikel, animasi hanya opacity/translasi, hormati `prefers-reduced-motion`.

### Fase 2 · Mock 2D (baseline, kandidat rilis)
- [ ] `lab/mass-well-2d.html` statis (SVG + CSS, tanpa library).
- [ ] Empat state: `At Rest` (0%), sebagian, fee siap, setelah `add_mass`.
- [ ] Desktop vertikal, mobile horizontal; label, nominal, tooltip, fokus keyboard.
- [ ] A11y: `role="progressbar"`/ringkasan teks; tanpa console error; tanpa overflow 360–1440.

### Fase 3 · Lab 3D dummy (eksperimen)
- [ ] `lab/mass-well-3d.html`, `three` dimuat lazy; tidak menyentuh `app/`.
- [ ] Kamera ortografis, material unlit/flat, edge 1px; tanpa bloom, partikel, auto-rotate.
- [ ] Slider waktu + tombol state; default state 0% (bukan state penuh).
- [ ] Fallback `prefers-reduced-motion` / WebGL tidak tersedia.
- [ ] Catat FPS 390×844 dan ukuran bundle `three` (gzip) untuk bahan keputusan.

### Fase 4 · Evaluasi & keputusan
- [ ] Bandingkan 2D vs 3D dengan data identik: terbaca tanpa label, kejelasan state, konsistensi identitas.
- [ ] Putuskan: pasang 2D ke `/mass`, buang 3D, atau lanjut 3D dengan data nyata.
- [ ] Bila 2D dipasang: ganti bar "Masuk pool lewat add_mass" di `/mass`, tambah versi ringkas di Overview, update kamus ID/EN.
- [ ] Bila 3D diadopsi: tentukan route, kebijakan bundle, fallback, dan ukur ulang performa produksi.

## 5. Ditunda

- [ ] Prototipe 3D "Mass Well" (three.js). Status: **disetujui sebagai lab dummy** (lihat §4), bukan fitur produksi; belum ada dependensi `three` atau kode 3D di repo.

## Definition of done hari ini

Frontend dianggap selesai bila FE-1 sampai FE-6 lulus verifikasi Playwright dan
sudah ter-deploy ke https://mcybernet.github.io/INERTIA/ tanpa regresi chart 1J.
