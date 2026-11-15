# INERTIA app — dashboard + wallet trade (Devnet)

Next.js 14 + TypeScript + Tailwind. Situs **statis** (tanpa server): semua data
diambil langsung dari RPC Devnet di browser, transaksi ditandatangani di wallet
pengguna.

- Live: **https://mcybernet.github.io/INERTIA/**
- Deploy otomatis lewat `scripts/deploy-pages.sh` (push build statis ke branch
  `gh-pages`; tidak butuh scope `workflow` pada token git).

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

RPC publik `api.devnet.solana.com` membatasi `getTokenLargestAccounts` dan
`getTransaction`. Riwayat diambil satu transaksi per satu dengan jeda ±1,1 detik
(refresh inkremental), di-cache di `localStorage` supaya chart tetap terisi.
Tabel holder otomatis memakai fallback (vault + owner + wallet dari event); isi
`NEXT_PUBLIC_RPC_URL` dengan RPC Devnet pribadi dan
`NEXT_PUBLIC_ENABLE_LARGEST_ACCOUNTS=1` kalau ingin daftar top-20 penuh.

## Isi

| Path | Fungsi |
|---|---|
| `src/lib/pool.ts` | decode `PoolState` (offset 8..272) + turunan PDA |
| `src/lib/math.ts` | mirror `quote_buy` / `quote_sell` / slippage |
| `src/lib/tx.ts` | builder instruksi `swap` + ATA idempotent |
| `src/lib/events.ts` | parser log `SwapEvent`, `MassAdded`, `PoolSeeded` |
| `src/lib/data/*` | baca pool, riwayat, holder dari RPC (cache + retry) |
| `src/components/PriceChart.tsx` | lightweight-charts (candle + volume) |
| `src/components/TradePanel.tsx` | buy/sell, slippage, quote, status tx |

## Catatan

- Mint authority sudah dicabut → nama/simbol/logo di-hardcode di UI.
- Fee 0,30% masuk `fee_vault`; `add_mass` butuh fee vault ≥ 1 SOL + rent.
- Jangan pernah memasukkan private key/seed phrase ke app atau repo.
