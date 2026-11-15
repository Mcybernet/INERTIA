# INERTIA app — dashboard multi-halaman + wallet trade (Devnet)

Next.js 14 + TypeScript + Tailwind. Situs **statis** (tanpa server): semua data
diambil langsung dari RPC Devnet di browser, transaksi ditandatangani di wallet
pengguna.

- Live: **https://mcybernet.github.io/INERTIA/**
- Deploy otomatis lewat `scripts/deploy-pages.sh` (push build statis ke branch
  `gh-pages`; tidak butuh scope `workflow` pada token git).

## Halaman

| Route | Isi |
|---|---|
| `/` | Overview: statistik pool, chart, 8 aktivitas terbaru, panel trade |
| `/trade` | Chart besar, panel beli/jual, posisi wallet, riwayat wallet |
| `/activity` | Semua event on-chain + filter + muat lebih |
| `/mass` | Status Mass Reserve, fee vault, aturan `add_mass` |
| `/holders` | Distribusi token account, label vault/reserve/owner, tier |
| `/tokenomics` | Alokasi, fee, vesting, kebijakan Mass Reserve |
| `/docs` | Panduan wallet/faucet, alamat on-chain, FAQ |

Navigasi memakai satu `DataProvider` di root layout, jadi pindah halaman tidak
memicu ulang polling dari nol.


## Jalankan

```bash
cd app
npm install --legacy-peer-deps
cp .env.example .env.local   # opsional, default ke api.devnet.solana.com
npm run dev                  # http://localhost:3000
npm run build                # static export -> app/out
npx serve out                # pratinjau hasil build
```

Guard Devnet: app menolak RPC non-Devnet kecuali `INERTIA_ALLOW_NON_DEVNET=1`
di-set saat build (hanya untuk debug lokal).

### Konfigurasi alamat

Default = peluncuran **v1**. Untuk cutover ke pool v2 cukup isi env ini saat
build (tanpa menyentuh kode):

| Env | Fungsi |
|---|---|
| `NEXT_PUBLIC_MINT` | mint INRT yang dipakai UI |
| `NEXT_PUBLIC_POOL` | override alamat pool (opsional) |
| `NEXT_PUBLIC_OWNER` / `NEXT_PUBLIC_OWNER_ATA` | akun owner untuk label holder |
| `NEXT_PUBLIC_POOL_LABEL` | label kecil di header (`v1`, `v2`, …) |
| `NEXT_PUBLIC_RPC_URL` | RPC Devnet (default `api.devnet.solana.com`) |

RPC publik `api.devnet.solana.com` membatasi `getTokenLargestAccounts` dan
`getTransaction`. Riwayat diambil satu transaksi per satu dengan jeda ±1,2 detik
(refresh inkremental), lalu **dirender bertahap**: setiap tx yang selesai
langsung menambah baris tabel dan candle chart, sementara footer menampilkan
progres `n/total`. Hasil akhir di-cache di `localStorage` (`inrt:history:v3`)
supaya kunjungan berikutnya instan. Tabel holder otomatis memakai fallback
(vault + reserve + owner + wallet dari event); isi `NEXT_PUBLIC_RPC_URL` dengan
RPC Devnet pribadi dan `NEXT_PUBLIC_ENABLE_LARGEST_ACCOUNTS=1` kalau ingin
daftar top-20 penuh.

## Isi

| Path | Fungsi |
|---|---|
| `src/lib/pool.ts` | decode `PoolState` (offset 8..272) + turunan PDA |
| `src/lib/math.ts` | mirror `quote_buy` / `quote_sell` / slippage |
| `src/lib/tx.ts` | builder instruksi `swap` + ATA idempotent |
| `src/lib/events.ts` | parser log `SwapEvent`, `MassAdded`, `PoolSeeded` |
| `src/lib/data/*` | baca pool, riwayat, holder dari RPC (cache + retry + progres) |
| `src/lib/tokenomics.ts` | alokasi, fee, tier, vesting (dokumen v1.1) |
| `src/components/DataProvider.tsx` | context data bersama untuk semua halaman |
| `src/components/PriceChart.tsx` | lightweight-charts (candle + volume) |
| `src/components/TradePanel.tsx` | buy/sell, slippage, quote, status tx |
| `src/views/*` | isi tiap route |

## Catatan

- Mint authority sudah dicabut → nama/simbol/logo di-hardcode di UI.
- Fee 0,30% masuk `fee_vault`; `add_mass` butuh fee vault ≥ 1 SOL + rent.
- Jangan pernah memasukkan private key/seed phrase ke app atau repo.
