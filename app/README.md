# INERTIA app — dashboard + wallet trade (Devnet)

Next.js 14 + TypeScript + Tailwind. Semua data diambil dari Devnet lewat route
handler internal (`/api/pool`, `/api/history`, `/api/holders`), transaksi
ditandatangani di wallet pengguna.

## Jalankan

```bash
cd app
npm install
cp .env.example .env.local   # opsional, default ke api.devnet.solana.com
npm run dev                  # http://localhost:3000
npm run build                # validasi produksi
```

`INERTIA_ALLOW_NON_DEVNET=1` hanya untuk debug lokal; default menolak RPC
non-Devnet.

RPC publik `api.devnet.solana.com` membatasi `getTokenLargestAccounts`, jadi
tabel holder otomatis memakai fallback (vault + owner + wallet dari event).
Isi `NEXT_PUBLIC_RPC_URL` dengan RPC Devnet pribadi (Helius/QuickNode) kalau
ingin daftar top-20 penuh.

## Isi

| Path | Fungsi |
|---|---|
| `src/lib/pool.ts` | decode `PoolState` (offset 8..272) + turunan PDA |
| `src/lib/math.ts` | mirror `quote_buy` / `quote_sell` / slippage |
| `src/lib/tx.ts` | builder instruksi `swap` + ATA idempotent |
| `src/lib/events.ts` | parser log `SwapEvent`, `MassAdded`, `PoolSeeded` |
| `src/lib/server/*` | baca pool, riwayat, holder dari RPC (cache pendek) |
| `src/components/PriceChart.tsx` | lightweight-charts (candle + volume) |
| `src/components/TradePanel.tsx` | buy/sell, slippage, quote, status tx |

## Catatan

- Mint authority sudah dicabut → nama/simbol/logo di-hardcode di UI.
- Fee 0,30% masuk `fee_vault`; `add_mass` butuh fee vault ≥ 1 SOL + rent.
- Jangan pernah memasukkan private key/seed phrase ke app atau repo.
