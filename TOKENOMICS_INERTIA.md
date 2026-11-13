# Tokenomics — INERTIA (INRT)

> **Status:** FINAL v1.1 — supply, alokasi, harga, fee, cap, dan scope dikunci.
> **Tanggal:** 2026-11-14
> **Menggantikan:** tabel alokasi contoh di `NEXT_PROJECT_POOL_LAUNCH.md` §3
> **Terkait:** `IDENTITY_INERTIA.md` (brand), `PROGRAM_SPEC_MASS.md` (implementasi)

---

## 1. Ringkasan

| Item | Nilai |
|---|---|
| Nama | INERTIA |
| Ticker | `INRT` |
| Total supply | **50.000.000** (tetap, tanpa inflasi) |
| Decimals | 6 |
| Harga awal | 0,000005 SOL |
| Token di pool saat launch | 9.600.000 (19,2%) |
| SOL di pool saat launch | 48 SOL |
| Market cap saat launch | 48 SOL |
| FDV saat launch | 250 SOL |
| Fee swap | 0,30% |

Sanity check: karena seluruh supply beredar di launch berasal dari pool, market cap = SOL di pool = 48 SOL. Ini normal untuk peluncuran yang sepenuhnya didukung likuiditas.

---

## 2. Alokasi

| Alokasi | Token | % | Status |
|---|---|---|---|
| **Pool — The Mass** | 9.600.000 | 19,2% | Terkunci permanen, tidak ada instruksi penarikan |
| **Mass Reserve** | 10.000.000 | 20,0% | Hanya boleh masuk pool lewat `add_mass` |
| **Treasury** | 9.400.000 | 18,8% | Multisig |
| **Tim** | 8.000.000 | 16,0% | Vesting |
| **Komunitas / airdrop** | 8.000.000 | 16,0% | Bertahap, berbasis milestone |
| **Ekosistem / partnership** | 5.000.000 | 10,0% | Multisig |
| **Total** | **50.000.000** | **100%** | |

> **Catatan Devnet:** kolom Status, vesting, dan multisig adalah parameter untuk kondisi produksi. Di Devnet, token cukup dipegang dev wallet; yang wajib hanya pool 9,6 jt dan Mass Reserve 10 jt di vault masing-masing.

### Kenapa tidak ada burn

1. **Membuat FDV ambigu.** Kalau token dibakar saat genesis, supply on-chain berubah dan angka FDV 250 SOL tidak lagi berlaku.
2. **Mass Reserve butuh token.** Mekanik "fee menjadi massa" butuh token untuk dipasangkan dengan SOL.
3. **Brand tidak membutuhkannya.** Inertia bercerita tentang massa dan berat, bukan pengurangan supply.

Burn bisa ditambahkan nanti lewat governance kalau diperlukan. Untuk v1, seluruh supply punya pekerjaan yang jelas.

---

## 3. Vesting

| Alokasi | Cliff | Durasi | Per bulan |
|---|---|---|---|
| Pool | — | permanen | 0 |
| Mass Reserve | — | hanya untuk `add_mass` | 0 |
| Treasury | 6 bulan | 24 bulan linear | 391.667 |
| Tim | 6 bulan | 24 bulan linear | 333.333 |
| Komunitas | — | 12 bulan linear | 666.667 |
| Ekosistem | — | 12 bulan linear | 416.667 |

Aturan pengaman:

- **Gerbang Mass II.** Tidak ada token tim atau treasury yang masuk peredaran sebelum pool mencapai **100 SOL**. Jadwal di atas adalah batas maksimum, bukan jaminan.
- **Cap 3% per bulan.** Total unlock tidak boleh melebihi 1.500.000 token per bulan. Kelebihan digeser ke bulan berikutnya.
- Treasury dan ekosistem dipegang **multisig 2-of-3**.
- Mass Reserve tidak bisa ditransfer bebas — hanya lewat `add_mass`.
- Tim tidak menerima token sebelum bulan ke-6.

---

## 4. Supply beredar

Angka di bawah adalah **maksimum** jika semua gerbang terpenuhi.

| Waktu | Beredar | % supply |
|---|---|---|
| Launch (M0) | 9.600.000 | 19,2% |
| M6 | ±16.100.000 | 32,2% |
| M12 | ±26.950.000 | 53,9% |
| M24 | ±35.650.000 | 71,3% |
| M30 | 40.000.000 | 80,0% |

Sisa 10 jt adalah Mass Reserve, tidak beredar sampai dipakai untuk menambah massa pool.

Catatan: float awal rendah (19,2%) membuat harga mudah bergerak di awal. Itu disengaja — pool adalah satu-satunya sumber supply saat launch. **Tidak ada batas beli**, jadi pembeli besar bisa menggeser harga kapan saja; risiko itu diterima dan harus dikomunikasikan.

---

## 5. Fee

| Parameter | Nilai |
|---|---|
| Total fee | 0,30% per swap |
| Ke massa pool | 100% |
| Ke treasury | 0% (treasury didanai dari alokasi) |

**Mekanik fee → massa:**

1. Fee masuk ke **fee vault terpisah**, bukan ke reserve pool. Reserve tidak pernah berkurang diam-diam.
2. Secara berkala, `add_mass` memindahkan SOL dari fee vault dan token dari Mass Reserve ke pool.
3. Keduanya masuk pada rasio yang sama → **harga tidak berubah**, pool makin dalam.
4. Setiap penambahan dicatat sebagai `MassAdded` dan bisa diverifikasi on-chain.

Efeknya: volume tinggi menambah berat pool tanpa mengubah harga. Itu inti dari "gaining mass".

---

## 6. Target massa

| Milestone | Likuiditas | Cara |
|---|---|---|
| Mass I | 48 SOL | Seed saat launch |
| Mass II | 100 SOL | Fee + Mass Reserve |
| Mass III | 250 SOL | Fee + Mass Reserve + treasury |

Milestone ini **bukan janji**. Kalau volume rendah, massa bertambah lambat. Yang penting mekanismenya ada dan transparan.

---

## 7. Yang tidak ada di v1

- Tidak ada inflasi atau emission.
- Tidak ada staking reward.
- Tidak ada burn.
- Tidak ada penjualan privat.
- Tidak ada token vesting untuk investor.

Semua supply dari genesis, dan semuanya punya tujuan yang bisa dicek.

---

## 8. Keputusan yang sudah dikunci

| Keputusan | Nilai |
|---|---|
| Total supply | 50.000.000 |
| Harga awal | 0,000005 SOL |
| FDV | 250 SOL |
| Token pool | 9.600.000 |
| SOL pool | 48 |
| Fee | 30 bps, 100% ke massa |
| Burn | Tidak ada |
| LP token | Tidak diterbitkan |
| Vesting tim | Cliff 6, linear 24 |
| Tier | 5 level, lihat `IDENTITY_INERTIA.md` |
| Batas beli | Tidak ada |
| Cap Mass Reserve | 5% per panggilan |
| Upgrade authority | Dev key disimpan selama Devnet |
| Scope | **Devnet saja** — mainnet di luar scope |

### Yang masih terbuka

- [ ] Utility holder v1.1: diskon fee berbasis tier masuk atau tidak? (lihat §10)
- [ ] Nama program on-chain.
- [ ] Tanggal seed Devnet — TBD, dan ini bukan public launch.

---

## 9. Rumus verifikasi

```
market cap launch = token_pool × P0 = 9.600.000 × 0,000005 = 48 SOL
FDV               = total_supply × P0 = 50.000.000 × 0,000005 = 250 SOL
float awal        = 9.600.000 / 50.000.000 = 19,2%
token untuk 1 SOL fee = 1 / P0 = 200.000 token
```

---

## 10. Utility holder

Tanpa utility, INRT hanya spekulasi. Dua lapis yang diusulkan:

**v1 — Governance ringan.**
Holder memegang suara proporsional pada keputusan yang tidak menyentuh dana: kapan `add_mass` dijalankan, apakah target Mass dinaikkan, dan arah penggunaan treasury. Voting tidak mengikat secara on-chain di v1, tapi hasilnya dipublikasikan dan dijalankan oleh multisig.

**v1.1 — Diskon fee berbasis tier.**

| Tier | Fee |
|---|---|
| REST / PULL | 0,30% |
| MASS | 0,28% |
| MOMENTUM | 0,25% |
| INERTIA | 0,20% |

Implementasinya membaca saldo holder saat swap dimulai. Risiko: peminjaman token sesaat untuk mendapat diskon. Karena selisihnya kecil (maksimal 0,10%), nilai eksploitasinya rendah, tapi tetap harus diuji.

**Yang tidak dilakukan:** bagi hasil pendapatan. Itu mendekati sekuritas dan tidak cocok untuk proyek tanpa struktur legal.

---

## 11. Kebijakan Mass Reserve

Agar reserve tidak habis dalam beberapa bulan:

| Aturan | Nilai |
|---|---|
| Maksimum per panggilan | **5%** dari sisa reserve (500.000 token di awal) — dikunci |
| Interval minimum | 7 hari |
| Minimum SOL di fee vault | 1 SOL |
| Rasio | harga marginal saat itu, toleransi 0,5% |
| Pemanggil | siapa saja (permissionless) |

Karena `add_mass` menambah kedua sisi pada rasio yang sama, harga tidak berubah. Yang dibatasi adalah **laju deplesi reserve**, bukan harga.

Kalau reserve habis, massa berhenti tumbuh dari fee. Itu batas alami, bukan kegagalan.

---

## 12. Upgrade authority

**Scope proyek ini Devnet saja. Tidak ada rencana mainnet.**

| Fase | Kebijakan | Konsekuensi |
|---|---|---|
| Devnet | **Upgrade authority dipegang dev key** (diputuskan) | Bug bisa diperbaiki cepat; klaim immutable tidak berlaku dan tidak dipakai |

Karena tidak ada mainnet, tidak ada klaim "terkunci selamanya" yang perlu dipertahankan. Materi tetap harus jujur:

> *"Tidak ada instruksi penarikan. Program masih dapat di-upgrade selama fase Devnet."*

Kalau suatu hari scope berubah — yang saat ini tidak direncanakan — jangan pindah ke mainnet dengan kunci yang sama. Audit, multisig, timelock 48 jam, dan pencabutan authority adalah syarat minimum sebelum ada dana nyata. Itu pekerjaan proyek lain, bukan v1 ini.

---

## 13. Legal & disclaimer

- Landing page dan docs wajib memuat: *"INERTIA is an experimental token. Nothing here is financial advice."*
- Tidak ada janji keuntungan, bagi hasil, atau harga target.
- Kalau suatu hari ada penjualan publik — yang saat ini tidak direncanakan — cek regulasi lokal (Indonesia: Bappebti/OJK) lebih dulu.
- Dokumen ini bukan offering memorandum.

---

## 14. Lampiran — kenapa 50 juta?

Supply itu **angka tampilan, bukan angka ekonomi**. Pada FDV yang sama, mengubah supply tidak mengubah apa pun yang penting: persentase pool, dampak harga, nilai tiap tier, dan nilai airdrop semuanya identik. Yang berubah hanya angka di layar dan harga per token.

Perbandingan pada FDV tetap 250 SOL dan pool 48 SOL:

| Supply | Harga awal | Token di pool | Pool % | Tier 1% | Komunitas 16% |
|---|---|---|---|---|---|
| 10 jt | 2,5e-5 | 1,92 jt | 19,2% | 100.000 | 1,6 jt |
| **50 jt** | **5e-6** | **9,6 jt** | **19,2%** | **500.000** | **8 jt** |
| 100 jt | 2,5e-6 | 19,2 jt | 19,2% | 1 jt | 16 jt |
| 500 jt | 5e-7 | 96 jt | 19,2% | 5 jt | 80 jt |
| 1 miliar | 2,5e-7 | 192 jt | 19,2% | 10 jt | 160 jt |

Semua baris punya ekonomi yang sama. Jadi "50 juta kekecilan" bukan masalah ekonomi — itu masalah **persepsi angka**.

### Kapan 50 jt terasa kecil?

Bukan karena jumlahnya, tapi karena **FDV-nya** kecil. Dengan budget 50 SOL, FDV 250 SOL memang mikro-kapitalisasi. Menaikkan supply ke 1 miliar tidak mengubah itu — hanya membuat harga per token terlihat lebih murah.

### Kalau tetap ingin angka lebih besar

| Pilihan | Efek | Catatan |
|---|---|---|
| Supply 100 jt, FDV 250 SOL | Harga 2,5e-6, pool 19,2 jt | Paling aman; rasio sama, angka 2× |
| Supply 50 jt, FDV 500 SOL | Harga 1e-5, pool 4,8 jt (9,6%) | Float lebih rendah, terlihat lebih "premium" |
| Supply 1 miliar, FDV 250 SOL | Harga 2,5e-7 | Terasa memecoin, tidak cocok dengan brand |

**Rekomendasi:** tetap 50 jt. Brand Inertia bercerita tentang massa dan kelangkaan. Kalau nanti butuh terlihat lebih besar, naikkan FDV lewat likuiditas tambahan — bukan dengan mencetak supply lebih banyak.
