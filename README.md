# INERTIA — `INRT`

Token Devnet-only tanpa bonding curve: likuiditas lahir langsung di pool
constant-product, fee 0,30% dikembalikan ke massa pool lewat `add_mass`.
Tidak ada instruksi tarik likuiditas, tidak ada LP token, tidak ada burn.

> **Scope: Devnet saja.** Skrip di repo ini menolak RPC non-Devnet kecuali
> `INERTIA_ALLOW_NON_DEVNET=1` di-set secara sadar.

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
scripts/devnet.sh           wrapper build/deploy/mint/init/seed + guard Devnet
target/deploy/              hasil build (di-gitignore)
```

Program ID: `8nxgCR4TW9K7zh5hb9ntW5dKRFumbdL4BxaaR1oWn86o`
Keypair deploy: `target/deploy/inertia_mass-keypair.json` (di luar git)
Keypair mint: `~/.config/solana/keys/inrt-mint.json` (di luar git)

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

## Toolchain

- Rust `1.100.0`, Anchor CLI `1.2.2`, Solana platform-tools `v1.57`
- `litesvm 0.18.2` untuk test (pin Agave 4.3.2), sedangkan CLI memakai
  `solana-rpc-client 4.3.0`. Karena pin keduanya berbeda, `tools/` punya
  workspace sendiri (`exclude = ["tools"]` di `Cargo.toml`).

## Alur Devnet

```bash
bash scripts/devnet.sh build          # anchor build -> target/deploy/inertia_mass.so
bash scripts/devnet.sh wallets        # cek address + saldo payer/owner
bash scripts/devnet.sh deploy         # anchor deploy --provider.cluster devnet
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
