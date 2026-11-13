# Next Project — Direct Pool Launch Playbook

> **Status:** REVISED v0.3 — keputusan inti terkunci; implementasi di `PROGRAM_SPEC_MASS.md`.
> **Tanggal:** 2026-11-14
> **Konteks:** proyek **INERTIA (`INRT`)**, tanpa bonding curve, langsung pool dari genesis.
> **Scope:** **Devnet saja. Mainnet di luar scope.**
> **Budget likuiditas:** 50 SOL (Devnet SOL, untuk menguji angka production).
> **Sumber angka resmi:** `TOKENOMICS_INERTIA.md`. **Brand:** `IDENTITY_INERTIA.md`.
> **Cara pakai:** copy file ini ke repo proyek baru, ubah label `PROPOSED` → `DECIDED` setelah disepakati, dan buang bagian yang tidak relevan.

---

## 1. Ringkasan keputusan yang harus diambil

Tanpa curve, tidak ada lagi mesin yang otomatis mengubah pembeli menjadi likuiditas. Semua keputusan di bawah ini harus diambil **sebelum** launch, karena tidak ada fase penjualan yang bisa menyesuaikan diri.

| # | Keputusan | Status | Rekomendasi awal |
|---|---|---|---|
| D1 | AMM internal vs eksternal | **DECIDED** | Pool internal; mainnet tidak direncanakan |
| D2 | Total supply | **DECIDED** | 50.000.000 |
| D3 | Harga awal (P0) | **DECIDED** | 5e-6 SOL/token |
| D4 | Token ke pool | **DECIDED** | 9.600.000 (19,2%) |
| D5 | SOL ke pool | **DECIDED** | 48 SOL |
| D6 | Buffer operasional | **DECIDED** | 2 SOL |
| D7 | LP token | **DECIDED** | Tidak diterbitkan — tidak ada instruksi penarikan |
| D8 | Fee | **DECIDED** | 0,30%, 100% ke massa |
| D9 | Anti-snipe | **DECIDED** | Tidak ada batas beli — risiko snipe diterima |
| D10 | Data chart | **DECIDED** | Event program (pool internal) |
| D11 | Multisig & monitoring | **DECIDED** | Dev key; monitoring opsional untuk Devnet |
| D12 | Upgrade authority | **DECIDED** | **Simpan dev key** selama Devnet |

---

## 2. Budget 50 SOL

### Alokasi

| Pos | Jumlah | Catatan |
|---|---|---|
| Seed pool | **48,0 SOL** | Ini yang menentukan kedalaman pasar |
| Rent akun | 0,1 SOL | Mint, token account, pool state, metadata |
| Buffer fee/ops | 0,9 SOL | Priority fee + testing + darurat |
| Cadangan | 1,0 SOL | Jangan dipakai kecuali perlu |
| **Total** | **50,0 SOL** | |

Di Solana, rent akun sangat murah (±0,002 SOL per token account). Jadi hampir seluruh budget memang bisa masuk ke pool. Jangan menyimpan buffer besar-besaran — buffer besar berarti pool makin tipis.

### Arti 48 SOL secara praktis

Dampak harga beli terhadap pool 48 SOL (constant product, sebelum fee):

| Beli | Dampak harga |
|---|---|
| 0,5 SOL | 2,1% |
| 1 SOL | 4,2% |
| 5 SOL | 21,9% |
| 10 SOL | 46,0% |
| 25 SOL | 131,3% |

**Kesimpulan jujur: 50 SOL itu tipis.** Satu pembeli 5 SOL sudah menggeser harga 22%. Ini bukan angka yang bisa diakali dengan memilih harga awal — kedalaman hanya ditentukan sisi SOL, bukan harga. Konsekuensinya:

- **Tidak ada anti-snipe.** Pembeli besar bisa masuk kapan saja. Ini risiko yang diterima, bukan bug.
- Chart akan bergerak tajam di hari-hari awal. Itu wajar, bukan bug.
- Jangan pasang ekspektasi "harga stabil" di minggu pertama.

---

## 3. Harga awal dan supply

Rumusnya:

```
seed_sol = token_di_pool × P0
```

Karena SOL dikunci di 48, memilih P0 otomatis menentukan jumlah token dan FDV:

| P0 (SOL/token) | Token di pool | FDV (supply 50 jt) | Karakter |
|---|---|---|---|
| 1e-6 | 48.000.000 | 50 SOL | Murah, 96% supply di pool — tidak realistis |
| 2,5e-6 | 19.200.000 | 125 SOL | FDV sangat rendah, supply pool besar |
| **5e-6** | **9.600.000** | **250 SOL** | **Seimbang (rekomendasi)** |
| 1e-5 | 4.800.000 | 500 SOL | Hemat token, FDV terlihat tinggi |

Catatan penting: **dampak harga untuk setiap baris di atas identik**, karena sisi SOL-nya sama. Yang berubah hanya FDV dan berapa persen supply yang beredar di pool. Jadi pilih P0 berdasarkan cerita FDV, bukan berdasarkan "kedalaman".

### Alokasi final (supply 50 jt, P0 5e-6)

| Alokasi | Jumlah | % | Catatan |
|---|---|---|---|
| **Pool — The Mass** | 9.600.000 | 19,2% | Terkunci permanen, tanpa instruksi penarikan |
| **Mass Reserve** | 10.000.000 | 20,0% | Hanya boleh masuk pool lewat `add_mass` |
| Treasury | 9.400.000 | 18,8% | Multisig 2-of-3, cliff 6 bln + linear 24 bln |
| Tim | 8.000.000 | 16,0% | Cliff 6 bln + linear 24 bln |
| Komunitas / airdrop | 8.000.000 | 16,0% | 12 bln, berbasis milestone |
| Ekosistem / partnership | 5.000.000 | 10,0% | Multisig, 12 bln |
| **Total** | **50.000.000** | **100%** | |

Tidak ada burn di genesis. Supply on-chain tetap 50.000.000 supaya FDV 250 SOL berlaku persis.

Detail vesting, gerbang Mass II, dan cap unlock 3%/bulan ada di `TOKENOMICS_INERTIA.md` §3.

---

## 4. Pilihan AMM

### Opsi A — Pool internal (program sendiri)

**Kelebihan**
- Event program bisa dibaca langsung → chart, Activity, dan holder tetap satu sumber (pola yang sudah dipakai KALYTH).
- Fee dan aturan sepenuhnya milik proyek.
- Tidak ada LP token → narasi "likuiditas tidak bisa ditarik siapa pun, termasuk tim" kuat dan bisa dibuktikan on-chain.
- Tidak butuh indexer di fase awal.

**Kekurangan**
- Kode AMM harus ditulis dan diuji: constant product, fee, slippage guard, akun vault.
- Tanpa budget audit, risiko bug lebih tinggi.
- Lebih banyak pekerjaan sebelum launch.

### Opsi B — AMM eksternal (Raydium CPMM / Meteora)

**Kelebihan**
- Kode AMM sudah teruji dan diaudit.
- Launch lebih cepat, risiko smart contract lebih rendah.

**Kekurangan**
- Chart, Activity, dan holder butuh **indexer sejak hari pertama**.
- LP token ada dan harus dikunci atau dibakar → tambahan keputusan dan alat.
- Fee dan mekanisme mengikuti pihak lain.

### Rekomendasi

- **Devnet (scope proyek ini):** pool internal. Tujuannya membangun pipeline data dan UX yang mulus, sekaligus latihan angka.
- **Mainnet:** di luar scope. Opsi A/B di atas disimpan hanya sebagai referensi kalau arah proyek berubah; jangan dianggap rencana.

---

## 5. Desain pool internal (kalau Opsi A)

### State

```
PoolState {
  authority: Pubkey,          // hanya untuk metadata; tidak punya instruksi admin
  mint: Pubkey,
  token_vault: Pubkey,
  sol_vault: Pubkey,
  fee_vault: Pubkey,          // SOL fee, terpisah dari reserve
  mass_reserve_vault: Pubkey, // token Mass Reserve, hanya untuk add_mass
  token_reserve: u64,
  sol_reserve: u64,
  fee_bps: u16,               // 30 = 0,30%, immutable
  launch_slot: u64,
  launch_ts: i64,
  last_mass_ts: i64,
  total_mass_sol: u64,
  total_mass_token: u64,
  seeded: bool,
  bump: u8,
  vault_auth_bump: u8,
}
```

Tanpa field `sold_supply`, tanpa `status`, tanpa `graduation`, tanpa `locked` yang bisa diubah. Tidak ada state machine. Layout lengkap dan urutan byte ada di `PROGRAM_SPEC_MASS.md` §4.

### Instruksi

| Instruksi | Fungsi |
|---|---|
| `initialize_pool` | Buat vault + set fee. Tidak menerima dana. |
| `seed_liquidity` | Sekali saja: set reserve, catat `launch_slot`, tandai `seeded`. |
| `swap` | Beli/jual dengan slippage guard dan deadline. |
| `add_mass` | Permissionless: pasangkan SOL fee + token reserve ke pool pada rasio saat ini. |

Tidak ada `collect_fee`, tidak ada `withdraw`, tidak ada `set_fee`, tidak ada `close`. Fee tidak pernah diambil dari reserve pool — fee hidup di `fee_vault` sampai dipanggil `add_mass`.

### Matematika

```
k = token_reserve × sol_reserve

# beli dengan dy SOL (gross)
fee     = dy × fee_bps / 10_000
dy_net  = dy − fee
out     = token_reserve × dy_net / (sol_reserve + dy_net)

# jual dengan dx token
gross   = sol_reserve × dx / (token_reserve + dx)
fee     = gross × fee_bps / 10_000
net     = gross − fee
```

Guard wajib:
- `out >= min_out` (beli) dan `net >= min_out` (jual).
- Tolak `amount_in == 0` dan hasil nol.
- `deadline` belum lewat.
- Cek overflow pakai `u128` untuk perkalian.
- Verifikasi vault benar-benar milik pool, bukan akun yang dikirim penyerang.
- Bandingkan saldo vault dengan reserve di state setelah transfer.

### Event

```
SwapEvent {
  wallet,
  direction: buy | sell,
  token_amount: u64,
  sol_amount: u64,      // delta reserve
  sol_user: u64,        // SOL dibayar / diterima user
  fee: u64,
  price_after: u64,     // PRICE_SCALE = 1e15
  reserve_token: u64,
  reserve_sol: u64,
  timestamp: i64,
}
```

Bentuk event sengaja dibuat mirip `ActivityRecord` yang sudah ada supaya frontend bisa memakai ulang parser, candle builder, dan halaman Activity. Field lengkap dan event lain ada di `PROGRAM_SPEC_MASS.md` §7.

Tidak ada batas beli. Siapa pun boleh membeli berapa pun dalam satu transaksi. Konsekuensinya sudah dicatat di §2 dan §8.

---

## 6. Data & frontend

Tanpa curve, dashboard berubah bentuk. Yang hilang: progress "terjual %", sumbu supply, area kurva. Yang muncul: harga, likuiditas, volume, FDV.

| Komponen | Dengan curve (KALYTH) | Tanpa curve |
|---|---|---|
| Chart utama | area kurva + marker eksekusi | candle + garis likuiditas |
| Sumbu X | supply terjual | waktu |
| Activity | parse BUY/SELL kurva | parse `SwapEvent` |
| Progress bar | % cap | tidak ada |
| Holder/tier | tetap | tetap, tidak berubah |
| Sumber data | signature `STATE_ADDRESS` | signature pool / indexer |

Kalau memakai pool internal, pola `history.ts` sekarang bisa dipakai ulang hampir utuh: ganti sumber signature dan decoder instruksi, sisanya (cache, concurrency, candle bucketing) tetap.

Kalau memakai AMM eksternal, siapkan dari awal:
- Webhook/indexer (mis. Helius) → simpan swap ke DB.
- Endpoint API untuk chart & activity.
- Fallback polling kalau indexer telat.

### Kontinuitas candle

Tanpa curve, seam migrasi hilang — sumber gap terbesar ikut hilang. Tapi "tidak ada gap" tetap punya syarat.

| Sumber gap | Ada di skema tanpa curve? | Penanganan |
|---|---|---|
| Migrasi curve → pool | Tidak | — |
| Seed awal terbaca sebagai trade | Ya, kalau parser salah | Kecualikan `seed_liquidity`, render sebagai marker |
| Harga rata-rata vs harga marginal | Ya | Simpan `price_after` di event, jangan pakai SOL/token |
| Tambah likuiditas beda rasio | Ya, kalau diizinkan | Hanya tambah di rasio saat ini |
| Fee ditarik dari reserve | Tidak | Fee hidup di vault terpisah; reserve pool tidak pernah dikurangi untuk fee |
| Swap terlewat (indexer) | Ya, hanya AMM eksternal | Backfill + dedupe per signature |
| Decimals salah | Ya | Baca dari mint, jangan hardcode |
| Harga tampil sebelum pool live | Ya | Jangan render harga sebelum seed |

Aturan intinya: kalau data lengkap dan harga yang dipakai adalah **harga marginal setelah swap**, maka `open` setiap candle sama dengan `close` candle sebelumnya. Gerakan besar dalam satu candle adalah trade nyata, bukan gap — mitigasinya ekonomi (max buy, kedalaman), bukan mengubah data chart.

---

## 7. LP: kunci atau bakar?

| Model | Trust | Kontrol | Cocok untuk |
|---|---|---|---|
| **Tanpa LP token** (pool internal, `locked: true`) | Tinggi — tidak ada yang bisa menarik | Hilang permanen | Rekomendasi v1 |
| LP token dibakar | Tinggi, bisa diverifikasi | Hilang permanen | AMM eksternal |
| LP token dikunci | Sedang — tergantung kredibilitas lock | Kembali setelah lock habis | Butuh fleksibilitas |
| LP dipegang treasury | Rendah — rawan dituduh rug | Penuh | Hindari |

Untuk proyek pertama dengan 50 SOL, pilih **tanpa LP token**. Sederhana, jujur, dan tidak ada alat lock yang perlu diaudit.

---

## 8. Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Snipe di blok pertama | Harga didorong, holder awal dirugikan | **Diterima.** Tidak ada batas beli. Mitigasi hanya timing launch dan komunikasi |
| Pool tipis (48 SOL) | Volatilitas ekstrem | Ekspektasi jelas, top-up dari revenue, monitoring |
| Harga awal salah | FDV tidak masuk akal | Uji beberapa skenario sebelum seed |
| Bug AMM | Dana pool hilang | Test menyeluruh; di Devnet dampaknya hanya SOL test |
| Indexer telat (AMM eksternal) | Chart kosong/lambat | Fallback polling, cache |
| Persepsi LP | Kepercayaan turun | Tanpa LP token / burn, tunjukkan on-chain |
| Supply overhang | Harga tertekan jangka panjang | Vesting tim, alokasi treasury jelas |

---

## 9. Checklist Devnet

### Sebelum
- [ ] Total supply, P0, dan alokasi final (tidak berubah lagi).
- [ ] Program di-deploy ke Devnet, semua test lulus.
- [ ] `initialize_pool` + `seed_liquidity` sudah di-dry-run.
- [ ] Frontend membaca pool dan menampilkan harga dengan benar.
- [ ] Dev key disimpan aman — ini satu-satunya kunci yang bisa memperbaiki program.
- [ ] Alert opsional; untuk Devnet cukup cek manual.

### Hari seed
- [ ] Seed dalam satu transaksi, verifikasi `k` dan harga on-chain.
- [ ] Swap pertama berhasil, harga sesuai hitungan.
- [ ] Chart, Activity, dan holder terisi.
- [ ] Cek tidak ada akun pool yang bisa ditarik.
- [ ] Catat alamat pool dan signature seed untuk dokumentasi test.

### Setelah
- [ ] Pantau beberapa hari pertama untuk memastikan data chart benar.
- [ ] Evaluasi apakah `add_mass` berjalan sesuai rasio.
- [ ] Catat hasil: volume, fee, holder, likuiditas — sebagai baseline test, bukan laporan publik.

---

## 10. Kalau 50 SOL terasa kurang

1. **Turunkan FDV, perbesar supply di pool.** Kedalaman tetap 48 SOL, tapi harga per token lebih murah sehingga pembeli kecil tidak langsung menggeser harga secara persentase yang sama. (Dampak harga tetap sama untuk SOL yang sama — yang berubah hanya persepsi nilai.)
2. **Launch lewat launchpad / dynamic curve** (Meteora DBC, Raydium LaunchLab). Ini sebenarnya curve, tapi masalah bootstrapping likuiditas diselesaikan pihak lain. Bukan "tanpa curve" murni.
3. **Top-up bertahap.** Seed 40 SOL, sisihkan 8 SOL untuk ditambahkan setelah 30 hari. Awal tetap tipis dan tanpa batas beli, jadi hanya cocok kalau kamu siap dengan volatilitasnya.
4. **Cari co-liquidity provider.** Partner yang menyediakan sisi SOL dengan bagi hasil fee. Butuh perjanjian dan transparansi.
5. **Tunda launch, kumpulkan dana.** Paling tidak keren, tapi paling aman.

---

## 11. Pertanyaan terbuka

Scope: **Devnet saja.** Keputusan besar sudah dikunci di `TOKENOMICS_INERTIA.md` §8 — termasuk upgrade authority (simpan dev key), cap Mass Reserve (5%), dan mainnet (di luar scope).

Yang tersisa hanya hal kecil yang tidak menghalangi build:

- [ ] **Utility holder v1.1:** diskon fee berbasis tier masuk atau tidak?
- [ ] **Nama program on-chain:** `nebula_mass`, `inertia_mass`, atau lain.
- [ ] **Tanggal seed Devnet:** TBD. Ini bukan public launch, cukup kapan test sudah siap.

Catatan kejujuran: jangan menulis "tidak bisa diubah selamanya" selama dev key masih memegang upgrade authority. Kalimat yang benar: *"Tidak ada instruksi penarikan. Program masih dapat di-upgrade selama fase Devnet."*

---

## 12. Operasional

Program tidak butuh admin, tapi tetap butuh manusia yang memantau. Karena scope-nya Devnet, semua di bawah ini **opsional** — dipakai kalau kamu ingin menguji alur operasional, bukan kewajiban produksi.

### 12.1 Keeper `add_mass`

`add_mass` **permissionless** — siapa pun boleh memanggil. Keeper hanyalah kemudahan, bukan otoritas. Kalau keeper mati, mekanisme tidak berhenti; hanya tidak ada yang rutin memanggilnya.

| Item | Nilai |
|---|---|
| Frekuensi cek | setiap 24 jam |
| Syarat panggil | fee vault ≥ 1 SOL **dan** ≥ 7 hari sejak `last_mass_ts` |
| Batas per panggilan | 5% dari sisa Mass Reserve (dikunci) |
| Rasio | harga marginal saat itu, toleransi 0,5% |
| Signer | wallet biasa; tidak perlu akses khusus |

Keeper cukup menjalankan skrip sekali sehari: baca `PoolState`, kalau syarat terpenuhi kirim `add_mass`, lalu catat signature. Kalau transaksi gagal karena slippage rasio, jangan retry membabi buta — hitung ulang rasio dari state terbaru.

Yang **tidak** boleh dilakukan keeper: memilih rasio yang menguntungkan diri sendiri, menambahkan SOL di luar fee vault, atau memakai token di luar Mass Reserve. Ketiganya ditolak program.

Untuk Devnet, `add_mass` sulit terpicu secara alami: fee 0,3% berarti butuh ±333 SOL volume untuk mengumpulkan 1 SOL. Kirim 1 SOL manual ke `fee_vault` saat ingin menguji alurnya. Itu terhitung sebagai massa dan tidak merugikan siapa pun.

### 12.2 Monitoring

| Sinyal | Ambang awal | Aksi |
|---|---|---|
| `sol_reserve` turun | > 20% dalam 1 jam | Cek apakah penjualan organik atau panic; siapkan komunikasi |
| Swap tunggal | > 5 SOL | Catat wallet, cek pola (snipe / wash / panic) |
| Fee vault | ≥ 5 SOL | Jadwalkan `add_mass` lebih awal dari jadwal |
| Mass Reserve tersisa | < 20% | Evaluasi ulang target Mass; jangan janji Mass III |
| Error rate frontend / RPC | > 5% dalam 5 menit | Ganti RPC, tampilkan status |
| Candle lag | > 2 menit | Cek parser event dan signature polling |
| Program upgrade | ada tx upgrade | Wajar di Devnet; catat kalau bukan kamu yang melakukannya |

Dashboard minimum: reserve, harga, volume 24 jam, jumlah holder, fee tertunda, sisa reserve.

### 12.3 Incident response

Tidak ada `pause`. Itu konsekuensi desain, bukan kelalaian. Yang bisa dilakukan saat insiden:

| Insiden | Tindakan |
|---|---|
| Bug ditemukan, dana belum hilang | Hentikan frontend, umumkan, perbaiki lewat upgrade (jika authority masih ada) |
| Bug dieksploitasi | Hentikan frontend, catat on-chain evidence; tanpa pause, dana pool Devnet tidak bisa diselamatkan — anggap ini latihan memahami batas desain |
| Upgrade authority bocor | Rotasi key, lalu upgrade dengan authority baru; di Devnet tidak ada dana nyata yang perlu diselamatkan |
| RPC down | Ganti endpoint, fallback ke RPC kedua; chart boleh kosong sementara, jangan tampilkan harga palsu |
| Keeper mati | Tidak ada dampak likuiditas; siapa pun bisa memanggil `add_mass` secara manual |
| Salah seed | Tidak ada undo. Satu-satunya jalan: mint baru + pool baru, dan komunikasikan sebagai relaunch |

Karena tidak ada pause, **satu-satunya jaring pengaman adalah upgrade authority**. Di Devnet itu cukup, dan itulah alasan kunci disimpan.

### 12.4 Runbook hari seed (Devnet)

**T-7**
- [ ] Program di-deploy ke Devnet, semua test di `PROGRAM_SPEC_MASS.md` §13 lulus.
- [ ] Mint dibuat dengan decimals 6, total 50.000.000 token ke dev wallet.
- [ ] Metadata dibuat dan di-host permanen (Arweave/IPFS), bukan URL lokal.
- [ ] `initialize_pool` dijalankan; alamat pool, vault, dan Mass Reserve dicatat.
- [ ] Transfer **10.000.000 token** ke `mass_reserve_vault` (ATA dari `reserve_authority`).
- [ ] **Revoke mint authority** setelah supply lengkap — tidak ada inflasi.
- [ ] Frontend menunjuk ke alamat pool baru, bukan pool lama.
- [ ] Opsional: alert dan dashboard aktif.

**T-1**
- [ ] Dry-run penuh di Devnet: init → seed → swap beli → swap jual → `add_mass`.
- [ ] Untuk menguji `add_mass`, kirim 1 SOL manual ke `fee_vault` (volume 0,3% butuh ±333 SOL untuk mencapai 1 SOL fee).
- [ ] Cek `k` naik setelah swap, harga sesuai hitungan, event terbaca frontend.
- [ ] Siapkan tx seed yang sudah ditandatangani (kalau memungkinkan) atau skrip satu perintah.
- [ ] Pastikan tidak ada wallet lain yang memegang authority mint.

**Hari seed (T-0)**
1. Kirim `seed_liquidity` dalam satu transaksi. Verifikasi `token_reserve`, `sol_reserve`, `launch_slot`.
2. Cek `k` dan harga on-chain: `P = sol_reserve / (token_reserve × 1000)`.
3. Swap kecil (0,05 SOL) dari wallet terpisah. Cek output, harga setelah, event.
4. Buka frontend. Pastikan chart mulai dari marker seed, bukan candle palsu.
5. Catat alamat pool + link explorer. Bagikan ke tester kalau perlu — tidak ada pengumuman publik.

**T+1 jam**
- [ ] Cek tidak ada error transaksi berulang.
- [ ] Cek fee vault terisi dan `add_mass` belum perlu dipanggil.
- [ ] Catat harga, reserve, dan jumlah holder sebagai baseline.

**T+24 jam**
- [ ] Evaluasi apakah chart dan Activity konsisten setelah 24 jam.
- [ ] Catat hasil test: volume, fee, reserve, holder.
- [ ] Putuskan apakah perlu top-up likuiditas (lihat §10).

---

## 13. Lampiran — rumus cepat

```
# harga
P = sol_reserve / token_reserve

# token keluar untuk dy SOL (setelah fee)
out = token_reserve × dy_net / (sol_reserve + dy_net)

# dampak harga beli (sebelum fee)
impact = (1 + dy / sol_reserve)² − 1

# seed
sol_seed = token_seed × P0

# FDV
FDV = P0 × total_supply
```

Contoh verifikasi baseline:
```
token_seed = 9.600.000
P0         = 0,000005
sol_seed   = 9.600.000 × 0,000005 = 48 SOL  ✓
FDV        = 0,000005 × 50.000.000 = 250 SOL
```
