<p align="center">
  <img src="assets/inertia-logo.png" alt="Logo token INERTIA (INRT)" width="120" height="120" />
</p>

# INERTIA — `INRT`

Token Devnet-only tanpa bonding curve: likuiditas lahir langsung di pool
constant-product, fee 0,30% dikembalikan ke massa pool lewat `add_mass`.
Tidak ada instruksi tarik likuiditas, tidak ada LP token, tidak ada burn.

> **Scope: Devnet saja.** Skrip di repo ini menolak RPC non-Devnet kecuali
> `INERTIA_ALLOW_NON_DEVNET=1` di-set secara sadar.

**Web live (Devnet):** https://mcybernet.github.io/INERTIA/

## Dokumen

| File | Isi |
|---|---|
| `IDENTITY_INERTIA.md` | nama, ticker, logo (Center of Mass), warna |
| `TOKENOMICS_INERTIA.md` | supply 50 jt, alokasi, tier, matematika fee |
| `NEXT_PROJECT_POOL_LAUNCH.md` | rencana peluncuran pool & parameter awal |
| `PROGRAM_SPEC_MASS.md` | spesifikasi program `inertia_mass` (akun, instruksi, event, test matrix) |

## Struktur repo

```
programs/inertia_mass/      program Anchor (lib.rs, state, math, instructions)
programs/inertia_mass/tests/test_pool.rs   test LiteSVM (in-process)
tools/devnet/               CLI Rust `inertia-devnet` (init/seed/swap/reserve/status)
app/                        dashboard Next.js + wallet buy/sell (Devnet)
scripts/devnet.sh           wrapper build/deploy/mint/init/seed + guard Devnet
target/deploy/              hasil build (di-gitignore)
```

Program ID: `8nxgCR4TW9K7zh5hb9ntW5dKRFumbdL4BxaaR1oWn86o`
Keypair deploy: `target/deploy/inertia_mass-keypair.json` (di luar git)
Keypair mint v1: `~/.config/solana/keys/inrt-mint.json` (di luar git)
Keypair mint v2: `~/.config/solana/keys/inrt-mint-v2.json` (di luar git)

## Wallet

| Peran | Address | File |
|---|---|---|
| Payer / penandatangan (Devnet-only) | `Gb6zQbxTvh65TSx8aQ6gqYCtrfPnribiqxBgo73yxKgt` | `~/.config/solana/keys/inrt-devnet-payer.json` |
| Pemilik proyek (tidak menandatangani) | `86RAJdtpYWeq9vmcpYNzLCVdcFpC5vacwFfdDrXPa24C` | — |

- SOL untuk deploy/seed harus ada di **payer**. Deploy, `init`, dan `seed`
  ditandatangani payer; setelah deploy, upgrade authority dipindah ke pemilik
  proyek dengan `scripts/devnet.sh set-authority`.
- Alokasi token non-pool (treasury, tim, komunitas, ekosistem) dikirim ke
  address pemilik; Mass Reserve tetap di vault milik PDA program.
- Private key tidak pernah diminta, ditampilkan, atau di-commit. Cek dengan
  `scripts/devnet.sh wallets`.

## Devnet — pool v1 (legacy, 14 Nov 2026)

| Item | Address / nilai |
|---|---|
| Program `inertia_mass` | `8nxgCR4TW9K7zh5hb9ntW5dKRFumbdL4BxaaR1oWn86o` |
| Upgrade authority | `86RAJdtpYWeq9vmcpYNzLCVdcFpC5vacwFfdDrXPa24C` |
| Mint `INRT` v1 (legacy) | `GEovdGGfR75dLdYS5LABHR6sGf9s72fqDNkkaj9RDE4H` |
| Mint `INRT` v2 (aktif di app) | `D6AQTpVJdWpBMb6i1cMFit58rtgCiTPNXpFNQGJoC7Q6` |
| Pool v1 (legacy) | `HobKvgdzXw4TPmR4XiUg45HVB2jqXuUXnDpuHqZdcPCM` |
| Token vault | `HcmXidwTkTGRFTvJAx4bCj7Ebs5gJZmJVNakvBnpPJff` |
| SOL vault | `9ymSmLaEgas8329MWfLomRPEvpurxPsGCJLPYxqkcUcy` |
| Fee vault | `4cU949bkmQquiVGpAgfFFTRmqoqpvT3ErYLSWtbbcREH` |
| Mass Reserve vault | `nCbjXjTZbqj9GyJogUeaweh3K5MKWfYCKRGjatPMroH` |
| ATA owner | `7b4cYnPTtxYsFe9Z4mUHPMZDBy6h3VvwPwaAME9Jq5ts` |
| Harga awal | `0,000005 SOL/INRT` (FDV 250 SOL) |
| Likuiditas | 4,8 SOL + 960.000 INRT |
| Mass Reserve | 10.000.000 INRT |
| Owner | 39.040.000 INRT |

Peluncuran v1 memakai opsi C, jadi pool aktif hanya 960.000 dari alokasi pool
9,6 jt. Sisa **8,64 jt INRT** tidak masuk likuiditas (tidak ada top-up) dan ikut
dikirim ke owner: 30,4 jt alokasi + 8,64 jt sisa pool = 39,04 jt. Tidak ada burn.
Jalur `add_mass` sudah terbukti di rehearsal lokal
(`scripts/rehearsal_local.sh`).

## Mint v2 + metadata on-chain (15 Nov 2026)

Mint v1 tidak bisa diberi metadata Metaplex karena `mintAuthority` sudah `null`
permanen. Mint v2 dibuat dengan supply yang sama plus metadata on-chain:

| Item | Address / nilai |
|---|---|
| Mint | `D6AQTpVJdWpBMb6i1cMFit58rtgCiTPNXpFNQGJoC7Q6` |
| Metadata PDA | `C3XvK38dvjpzvWouiWBrPVz35tJG1Qr3c8iMAGF7EWkx` |
| Name / symbol | `INERTIA` / `INRT` |
| URI metadata | `https://cdn.jsdelivr.net/gh/Mcybernet/INERTIA@main/assets/inertia.json` |
| Update authority | `Gb6zQbxTvh65TSx8aQ6gqYCtrfPnribiqxBgo73yxKgt` |
| Seller fee / mutable | 0 bps / `true` |
| Supply / decimals | 50.000.000 / 6 |
| Mint authority | `null` (dicabut) |
| Freeze authority | `null` |

### Pool v2 live (17 Nov 2026)

| Item | Address / nilai |
|---|---|
| Pool | `6Da5fRHLjzErcjGsqHzjEc4tp15Mkp9A3grJwJtsk3oV` |
| Token vault | `EkEChvJiCKhE46mSCAaLwkMFFef5dhwk6J8QrkK2JdgG` |
| SOL vault | `A6c6u8gjGjv3jMPvTuBpg7hAnhZL1ao1mCf7nQJ9FrCP` |
| Fee vault | `BrWU8kApyf4xhqRz5zoCce9rczsVESDdruSvt2XK3exN` |
| Mass Reserve vault | `5N5CsAhPqgcpHQqorcv19P5bCquFigA9N7HmrhyjZQCA` |
| ATA owner | `Eno3Lpj4C7fwXHa6X1LQSkLPLVZrigs4xPcr2J9oLj1L` |
| Harga awal | `0,000005 SOL/INRT` |
| Likuiditas | 4,8 SOL + 960.000 INRT |
| Mass Reserve | 9.600.000 INRT |
| Owner | 39.040.000 INRT |
| Sisa operasional (payer) | 400.000 INRT |

Pool di-seed `4,8 SOL + 960.000 INRT` (harga awal `0,000005 SOL/INRT`);
Mass Reserve diisi 9,6 jt INRT; 39,04 jt INRT dikirim ke ATA owner; 400 rb
INRT tetap di payer untuk operasional. `app/` sekarang menunjuk mint/pool v2
secara default, tanpa env tambahan.
`add_mass` belum dijalankan karena `fee_vault` masih di bawah 1 SOL
(saat ini ±0,0009 SOL); jalur ini sudah terbukti di rehearsal lokal.

## Frontend (`app/`)

Dashboard 7 halaman + trade wallet (Next.js 14, TypeScript, Tailwind,
lightweight-charts, wallet adapter). Tema flat: radius 0, border tipis, aksen
emas `#E0A64B`.

Live: **https://mcybernet.github.io/INERTIA/**

| Route | Isi |
|---|---|
| `/` | Overview: statistik pool, chart, aktivitas terbaru, panel trade |
| `/trade` | Chart besar, beli/jual, posisi & riwayat wallet |
| `/activity` | Semua event on-chain + filter + muat lebih |
| `/mass` | Status Mass Reserve, fee vault, aturan `add_mass` |
| `/holders` | Distribusi token account + tier |
| `/tokenomics` | Alokasi, fee, vesting, kebijakan massa |
| `/docs` | Panduan wallet/faucet, alamat on-chain, FAQ |

```bash
cd app
npm install --legacy-peer-deps
npm run dev      # http://localhost:3000 (tanpa basePath)
npm run build    # static export -> app/out (aset berprefix /INERTIA)
npx serve out    # buka http://localhost:3000/INERTIA/
```

- Situs statis: data pool/riwayat/holder dibaca langsung dari RPC Devnet di
  browser (tanpa API route), transaksi `swap` ditandatangani wallet pengguna.
- Satu `DataProvider` di root layout: pindah halaman tidak memicu ulang polling.
- Riwayat dibaca satu transaksi per satu dengan jeda ±1,2 detik (batas RPC
  publik Devnet), dirender bertahap (tabel & chart tumbuh, progres `n/total`),
  lalu di-cache di `localStorage` agar kunjungan berikutnya instan.
- `basePath` ditentukan dari fase build: `next build` selalu `/INERTIA`
  (GitHub Pages project site), `next dev` di root. Deploy script menolak push
  bila aset tidak berprefix.
- `NEXT_PUBLIC_RPC_URL` boleh diisi RPC Devnet pribadi. Guard menolak endpoint
  non-Devnet kecuali `INERTIA_ALLOW_NON_DEVNET=1`.
- Mint authority sudah dicabut, jadi nama/simbol/logo di-hardcode di UI.
- Dua bahasa (ID/EN) lewat tombol di header; pilihan disimpan di
  `localStorage` (`inrt:lang`). Kamus ada di `app/src/lib/i18n.ts`
  (kunci teks Indonesia, fallback ke teks asli bila belum diterjemahkan).
- Chart memakai WIB, default 4J, candle terakhir di tengah. Header menampilkan
  perubahan 24 jam dengan label `24J`/`24h`; selama riwayat belum 24 jam,
  labelnya memakai rentang yang benar-benar diukur (mis. `3,7J`/`3.7h`) dan
  tooltip menjelaskan bahwa angkanya sejak launch. Legend OHLC mengikuti
  crosshair dan menampilkan persen perubahan candle tersebut (close vs previous
  close).
- Tabel aktivitas di `/activity` memakai pagination 10 baris per halaman, jadi
  hanya 10 baris DOM yang dirender meskipun riwayatnya panjang.
- `getTokenLargestAccounts` dilewati di RPC publik (selalu 429); tabel holder
  memakai fallback vault pool, Mass Reserve, owner, dan wallet dari event.
- Deploy ke GitHub Pages lewat `scripts/deploy-pages.sh` (build statis lalu push
  ke branch `gh-pages` + `gh api --method POST repos/Mcybernet/INERTIA/pages/builds`).

## Toolchain

- Rust `1.100.0`, Anchor CLI `1.2.2`, Solana platform-tools `v1.57`
- `litesvm 0.18.2` untuk test (pin Agave 4.3.2), sedangkan CLI memakai
  `solana-rpc-client 4.3.0`. Karena pin keduanya berbeda, `tools/` punya
  workspace sendiri (`exclude = ["tools"]` di `Cargo.toml`).

## Alur Devnet

```bash
bash scripts/devnet.sh build          # anchor build -> target/deploy/inertia_mass.so
bash scripts/devnet.sh wallets        # cek address + saldo payer/owner
bash scripts/devnet.sh deploy         # solana program deploy (keypair program eksplisit)
bash scripts/devnet.sh set-authority  # upgrade authority program -> wallet owner
bash scripts/devnet.sh balance
bash scripts/devnet.sh mint 50000000  # supply 50 jt, decimals 6, mint authority dicabut
bash scripts/devnet.sh init <MINT>    # fee 30 bps, interval 60 s
bash scripts/devnet.sh seed <MINT> 48 9600000
bash scripts/devnet.sh status <MINT>
bash scripts/devnet.sh buy  <MINT> 0.5
bash scripts/devnet.sh sell <MINT> 1000
bash scripts/devnet.sh reserve <MINT> 10000000  # isi Mass Reserve (vault milik PDA)
bash scripts/devnet.sh add-mass <MINT> 1        # butuh fee_vault >= 1 SOL + rent
```

`add_mass` hanya bisa jalan kalau dua syarat terpenuhi: Mass Reserve berisi
token (isi dengan `reserve`) dan `fee_vault` punya minimal
`MIN_MASS_SOL` (1 SOL) di atas rent. Di Devnet volumenya kecil, jadi fee vault
bisa disimulasikan dengan transfer SOL biasa ke alamat `fee_vault` yang
dicetak `status`.

Opsi seed (dipilih setelah biaya deploy diketahui):

| Opsi | SOL | Token | Catatan |
|---|---:|---:|---|
| A | 48 | 9.600.000 | parameter produksi (FDV 250 SOL) |
| B | sisa saldo − 1 SOL | SOL × 200.000 | memaksimalkan modal yang ada |
| C | 4,8 | 960.000 | rehearsal murah |

Tidak ada top-up likuiditas: salah seed = mint baru + pool baru.

## Test

Test berjalan di LiteSVM dan membutuhkan `.so` hasil `anchor build`
(`include_bytes!` ke `target/deploy/inertia_mass.so`).

```bash
cargo test                     # di root (workspace program)
bash scripts/devnet.sh build   # wajib sebelum test pertama
```

Matrix yang diuji ada di `PROGRAM_SPEC_MASS.md` §13 (25 skenario, termasuk
fuzz 10.000 iterasi dan replay event ke parser frontend).

## Aturan aman

- Jangan pernah meminta atau menyimpan private key/seed phrase di repo.
- `target/`, `keys/`, `*.key`, `keypair*.json` di-gitignore.
- Fee hanya masuk ke `fee_vault`; `add_mass` memindahkannya ke `sol_vault`
  dengan tambahan token dari Mass Reserve, sehingga harga tidak bergerak
  lebih dari 0,5%.
