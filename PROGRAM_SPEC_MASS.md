# Program Spec — The Mass (INERTIA)

> **Status:** DRAFT v1.1 — siap diterjemahkan ke Anchor.
> **Tanggal:** 2026-11-14
> **Program:** pool constant-product tanpa curve, tanpa instruksi penarikan.
> **Terkait:** `TOKENOMICS_INERTIA.md` (angka), `IDENTITY_INERTIA.md` (brand), `NEXT_PROJECT_POOL_LAUNCH.md` (playbook).
> **Scope:** **Solana Devnet saja. Mainnet di luar scope.**

---

## 1. Scope

### Yang dibangun

- Pool likuiditas constant-product untuk satu mint.
- Empat instruksi: `initialize_pool`, `seed_liquidity`, `swap`, `add_mass`.
- Fee 0,30% yang **tidak pernah** diambil dari reserve pool, tapi ditampung di `fee_vault` dan dikembalikan ke pool lewat `add_mass`.
- Tidak ada batas beli. Snipe diterima sebagai risiko, bukan dicegah program.

### Yang sengaja tidak ada

| Tidak ada | Alasan |
|---|---|
| `withdraw` / `close` | Likuiditas tidak boleh bisa keluar, termasuk oleh tim |
| LP token | Tidak ada klaim yang bisa dipindahkan |
| `set_fee` | Fee immutable setelah init; menghindari perubahan sepihak |
| Pause | Tidak ada tombol yang bisa membekukan dana holder |
| State machine / graduation | Pool lahir sudah final |
| `collect_fee` | Fee tidak pernah masuk reserve, jadi tidak ada yang perlu ditarik |
| Admin instruction apa pun | `authority` hanya metadata, tidak dipakai untuk otorisasi |

Konsekuensi: satu-satunya jalur perubahan perilaku adalah **upgrade program**. Karena scope-nya Devnet, kunci upgrade disimpan di dev key dan tidak ada klaim immutable (lihat `TOKENOMICS_INERTIA.md` §12).

---

## 2. Konstanta & parameter

| Konstanta | Nilai | Catatan |
|---|---|---|
| `TOKEN_DECIMALS` | 6 | Dibaca dari mint, bukan hardcode |
| `SOL_DECIMALS` | 9 | Tetap |
| `DECIMAL_ADJ` | 1_000 | `10^(9-6)` |
| `PRICE_SCALE` | 1e15 | Skala harga di state/event |
| `FEE_BPS` | 30 | 0,30% |
| `MAX_FEE_BPS` | 1_000 | Batas sanity saat init |
| `MASS_INTERVAL_SECONDS` | 604_800 | 7 hari |
| `MIN_MASS_SOL` | 1_000_000_000 | 1 SOL |
| `MASS_CAP_BPS` | 500 | 5% sisa Mass Reserve per panggilan |
| `MASS_RATIO_TOL_BPS` | 50 | 0,5% toleransi rasio |
| `RENT_EXEMPT_MIN` | 890_880 | lamports minimum akun 0-byte |

Parameter launch INERTIA:

| Parameter | Nilai |
|---|---|
| Total supply | 50.000.000 token |
| Pool seed | 9.600.000 token + 48 SOL |
| Mass Reserve | 10.000.000 token |
| Harga awal | 0,000005 SOL/token |
| FDV | 250 SOL |

---

## 3. Peta akun & PDA

| Akun | Seed | Owner | Isi |
|---|---|---|---|
| `PoolState` | `["pool", mint]` | Program | State pool |
| `vault_authority` | `["vault_auth", pool]` | — (PDA) | Penandatangan token vault |
| `reserve_authority` | `["reserve_auth", pool]` | — (PDA) | Penandatangan Mass Reserve |
| `token_vault` | ATA(`vault_authority`, mint) | Token Program | Token pool |
| `mass_reserve_vault` | ATA(`reserve_authority`, mint) | Token Program | Token Mass Reserve |
| `sol_vault` | `["sol_vault", pool]` | System Program | SOL pool |
| `fee_vault` | `["fee_vault", pool]` | System Program | SOL fee tertunda |

Kenapa dua authority token terpisah: ATA bersifat deterministik per `(owner, mint)`. Kalau `token_vault` dan `mass_reserve_vault` dimiliki PDA yang sama, alamatnya akan identik. `vault_authority` dan `reserve_authority` memisahkannya.

`sol_vault` dan `fee_vault` adalah akun system 0-byte. Program dapat mendebitnya dengan `invoke_signed` karena PDA menandatangani. Keduanya wajib selalu menyimpan `RENT_EXEMPT_MIN`.

---

## 4. Layout `PoolState`

Ukuran setelah discriminator 8 byte:

| Offset | Field | Tipe | Ukuran |
|---:|---|---|---:|
| 0 | `authority` | Pubkey | 32 |
| 32 | `mint` | Pubkey | 32 |
| 64 | `token_vault` | Pubkey | 32 |
| 96 | `sol_vault` | Pubkey | 32 |
| 128 | `fee_vault` | Pubkey | 32 |
| 160 | `mass_reserve_vault` | Pubkey | 32 |
| 192 | `token_reserve` | u64 | 8 |
| 200 | `sol_reserve` | u64 | 8 |
| 208 | `fee_bps` | u16 | 2 |
| 210 | `launch_slot` | u64 | 8 |
| 218 | `launch_ts` | i64 | 8 |
| 226 | `last_mass_ts` | i64 | 8 |
| 234 | `total_mass_sol` | u64 | 8 |
| 242 | `total_mass_token` | u64 | 8 |
| 250 | `seeded` | bool | 1 |
| 251 | `bump` | u8 | 1 |
| 252 | `vault_auth_bump` | u8 | 1 |
| 253 | `padding` | [u8; 3] | 3 |

`SPACE = 8 + 256 = 264` byte.

Catatan:

- `authority` disimpan untuk transparansi dan ditampilkan di UI. **Tidak ada instruksi yang membacanya untuk otorisasi.**
- `token_reserve` dan `sol_reserve` adalah sumber kebenaran. Saldo vault diverifikasi, bukan dijadikan sumber utama, supaya donasi ke vault tidak menggeser harga secara tak terduga.
- `padding` disediakan agar penambahan field kecil tidak mengubah ukuran akun.

---

## 5. Instruksi

### 5.1 `initialize_pool`

**Args:** `fee_bps: u16`

**Akun:**

| Akun | Mutability | Constraint |
|---|---|---|
| `authority` | signer, writable | Pembayar |
| `mint` | readonly | `decimals == 6` |
| `pool` | writable, init | PDA `["pool", mint]` |
| `vault_authority` | readonly | PDA `["vault_auth", pool]` |
| `reserve_authority` | readonly | PDA `["reserve_auth", pool]` |
| `token_vault` | writable, init | ATA(`vault_authority`, mint) |
| `mass_reserve_vault` | writable, init | ATA(`reserve_authority`, mint) |
| `sol_vault` | writable | PDA `["sol_vault", pool]`, system-owned, 0 data |
| `fee_vault` | writable | PDA `["fee_vault", pool]`, system-owned, 0 data |
| `system_program`, `token_program`, `associated_token_program` | readonly | — |

**Validasi:** `fee_bps <= MAX_FEE_BPS`, `mint.decimals == 6`, semua PDA cocok.

**Efek:** buat `PoolState`, ATA, dan dua akun system. Isi `authority`, `mint`, alamat vault, `fee_bps`, `seeded = false`, `last_mass_ts = 0`, bump. `sol_vault` dan `fee_vault` didanai `RENT_EXEMPT_MIN` oleh `authority` agar valid sebagai akun system — ini bukan dana pool dan tidak dihitung sebagai reserve.

**Event:** `PoolInitialized`.

---

### 5.2 `seed_liquidity`

**Args:** `token_amount: u64`, `sol_amount: u64`

**Akun:**

| Akun | Mutability | Constraint |
|---|---|---|
| `authority` | signer, writable | Penyedia SOL |
| `pool` | writable | `seeded == false` |
| `mint` | readonly | Sama dengan `pool.mint` |
| `authority_token_account` | writable | Milik `authority`, mint sama |
| `token_vault` | writable | Sama dengan `pool.token_vault` |
| `sol_vault` | writable | Sama dengan `pool.sol_vault`, system-owned |
| `token_program`, `system_program` | readonly | — |

**Validasi:**

- `!pool.seeded`
- `token_amount > 0`, `sol_amount > 0`
- `authority_token_account.amount >= token_amount`
- `authority` punya lamports cukup
- Setelah transfer: `token_vault.amount == token_amount` dan `sol_vault.lamports == sol_amount + RENT_EXEMPT_MIN`

**Efek:** transfer token dan SOL, set `token_reserve`, `sol_reserve`, `launch_slot = Clock.slot`, `launch_ts = Clock.unix_timestamp`, `last_mass_ts = Clock.unix_timestamp`, `seeded = true`.

**Event:** `PoolSeeded` dengan `price_scaled` awal. Seed **bukan trade** dan tidak boleh muncul sebagai candle — frontend merendernya sebagai marker.

---

### 5.3 `swap`

**Args:** `direction: Direction`, `amount_in: u64`, `min_amount_out: u64`, `deadline: i64`

`Direction` = `Buy | Sell`.

**Akun:**

| Akun | Mutability | Constraint |
|---|---|---|
| `trader` | signer, writable | — |
| `pool` | writable | `seeded == true` |
| `mint` | readonly | `pool.mint` |
| `trader_token_account` | writable | Milik `trader`, mint sama |
| `token_vault` | writable | `pool.token_vault` |
| `sol_vault` | writable | `pool.sol_vault` |
| `fee_vault` | writable | `pool.fee_vault` |
| `vault_authority` | readonly | PDA `["vault_auth", pool]` |
| `token_program`, `system_program` | readonly | — |

**Guard bersama:** `Clock.unix_timestamp <= deadline`, `pool.seeded`.

**Beli:**

```
fee      = amount_in * fee_bps / 10_000          // floor
dy_net   = amount_in - fee
out      = token_reserve * dy_net / (sol_reserve + dy_net)   // floor

require out > 0
require out >= min_amount_out
require out <= token_reserve
```

Transfer: `trader → fee_vault` sebesar `fee`; `trader → sol_vault` sebesar `dy_net`; `token_vault → trader` sebesar `out` (ditandatangani `vault_authority`).

State: `sol_reserve += dy_net`, `token_reserve -= out`.

**Jual:**

```
gross    = sol_reserve * amount_in / (token_reserve + amount_in)   // floor
fee      = gross * fee_bps / 10_000                                // floor
net      = gross - fee

require amount_in > 0
require gross > 0
require net > 0
require net >= min_amount_out
require gross <= sol_reserve
```

Transfer: `trader → token_vault` sebesar `amount_in`; `sol_vault → trader` sebesar `net`; `sol_vault → fee_vault` sebesar `fee`.

State: `token_reserve += amount_in`, `sol_reserve -= gross`.

Tidak ada batas ukuran untuk beli maupun jual.

**Event:** `SwapEvent`.

---

### 5.4 `add_mass`

Permissionless. Siapa pun boleh memanggil selama syarat terpenuhi.

**Args:** `amount_sol: u64`, `max_token_in: u64`

**Akun:**

| Akun | Mutability | Constraint |
|---|---|---|
| `caller` | signer, writable | Hanya membayar fee tx |
| `pool` | writable | `seeded == true` |
| `mint` | readonly | `pool.mint` |
| `token_vault` | writable | `pool.token_vault` |
| `sol_vault` | writable | `pool.sol_vault` |
| `fee_vault` | writable | `pool.fee_vault` |
| `mass_reserve_vault` | writable | `pool.mass_reserve_vault` |
| `reserve_authority` | readonly | PDA `["reserve_auth", pool]` |
| `vault_authority` | readonly | PDA `["vault_auth", pool]` |
| `token_program`, `system_program` | readonly | — |

**Validasi:**

```
now           = Clock.unix_timestamp
claimable     = fee_vault.lamports - RENT_EXEMPT_MIN
mass_balance  = mass_reserve_vault.amount

require now - last_mass_ts >= MASS_INTERVAL_SECONDS
require amount_sol >= MIN_MASS_SOL
require amount_sol <= claimable

token_needed  = ceil_div(amount_sol * token_reserve, sol_reserve)
require token_needed > 0
require token_needed <= max_token_in
require token_needed <= mass_balance
require token_needed <= mass_balance * MASS_CAP_BPS / 10_000
```

**Cek rasio setelah eksekusi:**

```
price_before = price(pool)
price_after  = price(reserve + delta)
require abs(price_after - price_before) * 10_000 <= price_before * MASS_RATIO_TOL_BPS
```

Karena pembulatan memakai `ceil`, harga boleh bergeser turun sangat sedikit — dalam 0,5%.

**Efek:** `fee_vault → sol_vault` sebesar `amount_sol`; `mass_reserve_vault → token_vault` sebesar `token_needed`; update reserve, `last_mass_ts = now`, `total_mass_sol += amount_sol`, `total_mass_token += token_needed`.

**Event:** `MassAdded`.

**Catatan keamanan:** `amount_sol` tidak boleh melebihi `claimable`. Siapa pun **bisa** mentransfer SOL langsung ke `fee_vault` — akun system bisa menerima lamports tanpa izin. Donasi itu terhitung sebagai massa pada `add_mass` berikutnya. Ini tidak berbahaya (hanya memperdalam pool, tidak memberi keuntungan langsung ke pendonasi) dan berguna untuk menguji `add_mass` di Devnet. Yang tidak ada di v1 adalah instruksi untuk menambah likuiditas langsung ke `sol_vault`/`token_vault` di luar rasio.

**Catatan pengujian Devnet:** dengan fee 0,3%, butuh volume ±333 SOL untuk mengumpulkan 1 SOL fee. Untuk menguji `add_mass`, kirim 1 SOL langsung ke `fee_vault`. Interval 7 hari tetap berlaku; lihat §14 untuk opsi menjadikannya parameter init.

---

## 6. Matematika & pembulatan

```
price_scaled = sol_reserve * PRICE_SCALE / (token_reserve * DECIMAL_ADJ)

k = token_reserve * sol_reserve        // u128
```

Aturan:

1. Semua perkalian dilakukan di `u128`, pembagian terakhir di-floor kecuali `token_needed` di `add_mass` (ceil).
2. Tidak ada pembagian dengan nol: `sol_reserve > 0` dan `token_reserve > 0` dijamin sejak seed.
3. Arah pembulatan selalu menguntungkan pool atau netral:
   - beli: token keluar di-floor → user tidak bisa mendapat token gratis dari pembulatan.
   - jual: SOL keluar di-floor → sama.
   - `add_mass`: token masuk di-ceil → reserve tidak berkurang karena pembulatan.
4. `price_scaled` dihitung dari reserve **setelah** instruksi, bukan dari harga rata-rata trade. Ini yang membuat candle `open` = `close` sebelumnya.
5. Semua downcast `u128 → u64` memakai `try_into` dan error `MathOverflow` jika gagal.

Contoh verifikasi seed:

```
token_reserve = 9_600_000 * 1e6 = 9_600_000_000_000
sol_reserve   = 48 * 1e9        = 48_000_000_000
price_scaled  = 48e9 * 1e15 / (9.6e12 * 1e3) = 5e9
```

`5e9 / 1e15 = 0,000005 SOL` ✓

---

## 7. Event

```rust
#[event]
pub struct PoolInitialized {
    pub pool: Pubkey,
    pub mint: Pubkey,
    pub authority: Pubkey,
    pub fee_bps: u16,
    pub timestamp: i64,
}

#[event]
pub struct PoolSeeded {
    pub pool: Pubkey,
    pub token_amount: u64,
    pub sol_amount: u64,
    pub price_scaled: u64,
    pub launch_slot: u64,
    pub timestamp: i64,
}

#[event]
pub struct SwapEvent {
    pub pool: Pubkey,
    pub wallet: Pubkey,
    pub direction: u8,       // 0 = buy, 1 = sell
    pub token_amount: u64,   // beli: token keluar pool; jual: token masuk pool
    pub sol_amount: u64,     // perubahan reserve: beli +net, jual −gross
    pub sol_user: u64,       // beli: SOL dibayar; jual: SOL diterima
    pub fee: u64,
    pub price_after: u64,    // PRICE_SCALE = 1e15
    pub reserve_token: u64,
    pub reserve_sol: u64,
    pub timestamp: i64,
}

#[event]
pub struct MassAdded {
    pub pool: Pubkey,
    pub caller: Pubkey,
    pub sol_amount: u64,
    pub token_amount: u64,
    pub price_after: u64,
    pub reserve_token: u64,
    pub reserve_sol: u64,
    pub total_mass_sol: u64,
    pub total_mass_token: u64,
    pub timestamp: i64,
}
```

Bentuk ini sengaja dekat dengan `ActivityRecord` yang sudah dipakai frontend KALYTH, supaya parser, candle builder, dan halaman Activity bisa dipakai ulang dengan perubahan minimal.

Aturan parser:

- `PoolSeeded` → marker, **bukan** candle.
- `SwapEvent` → candle, memakai `price_after` dan `timestamp`.
- `MassAdded` → marker likuiditas, **bukan** candle (harga tidak berubah).
- `PoolInitialized` → metadata saja.

---

## 8. Error

```rust
#[error_code]
pub enum MassError {
    #[msg("fee_bps melebihi batas")]            InvalidFeeBps,
    #[msg("pool sudah di-seed")]                AlreadySeeded,
    #[msg("pool belum di-seed")]                NotSeeded,
    #[msg("jumlah tidak boleh nol")]            ZeroAmount,
    #[msg("output di bawah minimum")]           SlippageExceeded,
    #[msg("transaksi kedaluwarsa")]             DeadlinePassed,
    #[msg("fee vault tidak cukup")]             InsufficientFeeVault,
    #[msg("interval add_mass belum lewat")]     MassIntervalNotElapsed,
    #[msg("melebihi cap Mass Reserve")]         MassCapExceeded,
    #[msg("Mass Reserve tidak cukup")]          InsufficientMassReserve,
    #[msg("rasio bergeser terlalu jauh")]       RatioDriftExceeded,
    #[msg("akun vault tidak cocok")]            InvalidVault,
    #[msg("mint tidak cocok")]                  InvalidMint,
    #[msg("matematika overflow")]               MathOverflow,
    #[msg("arah swap tidak valid")]             InvalidDirection,
    #[msg("desimal mint bukan 6")]              InvalidMintDecimals,
}
```

Tidak ada error `Unauthorized` karena tidak ada instruksi ber-otorisasi.

---

## 9. Invariant

Diperiksa di akhir setiap instruksi (di test, dan sebagian sebagai `require` runtime):

| # | Invariant |
|---|---|
| I1 | `token_vault.amount >= pool.token_reserve` |
| I2 | `sol_vault.lamports >= pool.sol_reserve + RENT_EXEMPT_MIN` |
| I3 | `pool.token_reserve > 0 && pool.sol_reserve > 0` setelah seed |
| I4 | `price_scaled` di event sama dengan hasil hitung dari reserve |
| I5 | `seeded` hanya berubah `false → true`, tidak pernah sebaliknya |
| I6 | `fee_bps` tidak berubah setelah init |
| I7 | `mass_reserve_vault.amount` hanya berkurang lewat `add_mass` |
| I8 | `fee_vault.lamports` hanya berkurang lewat `add_mass` |
| I9 | `k_after >= k_before − (token_reserve + amount_in)` untuk jual (toleransi pembulatan) |
| I10 | Tidak ada instruksi yang mentransfer token/SOL keluar selain ke `trader` atau ke vault lain milik pool |

I9 ditulis longgar karena pembulatan floor pada jual secara matematis bisa menurunkan `k` sebesar paling banyak `token_reserve + amount_in`. Dalam test, delta relatif harus `< 1e-9`.

---

## 10. Validasi akun

Checklist Anchor:

- `pool` = PDA `["pool", pool.mint]`; `pool.bump` cocok.
- `pool.mint == mint.key()`.
- `pool.token_vault == token_vault.key()`, `pool.sol_vault == sol_vault.key()`, `pool.fee_vault == fee_vault.key()`, `pool.mass_reserve_vault == mass_reserve_vault.key()`.
- `token_vault.owner == token_program`, `token_vault.mint == mint`, `token_vault` dimiliki `vault_authority`.
- `mass_reserve_vault` dimiliki `reserve_authority` (bukan `vault_authority`).
- `sol_vault.owner == system_program`, data kosong.
- `fee_vault.owner == system_program`, data kosong.
- `trader_token_account.owner == trader`, `mint == pool.mint`.
- `vault_authority` dan `reserve_authority` = PDA yang diharapkan; bump disimpan.
- Semua akun vault **tidak** boleh sama satu sama lain.
- `mint.decimals == 6`; `mint` bukan mint token-2022 dengan extension yang tidak didukung (v1 hanya Token Program klasik).

---

## 11. Keamanan

| Risiko | Mitigasi |
|---|---|
| Vault palsu dikirim penyerang | Semua vault dibandingkan dengan alamat di `PoolState` |
| Donasi ke vault menggeser harga | Reserve dibaca dari state, bukan saldo mentah; donasi tidak dikreditkan |
| Reentrancy | Tidak ada CPI ke program eksternal selain Token & System |
| Pembulatan menguntungkan user | Arah floor/ceil eksplisit, diuji |
| Overflow | `u128` untuk semua perkalian, `checked_*` untuk penjumlahan |
| Front-running `add_mass` | Rasio dijaga; tidak ada keuntungan dari menyisipkan trade sebelum/sesudah |
| Snipe | **Tidak dimitigasi.** Tidak ada batas beli; risiko diterima dan dikomunikasikan |
| Bug tanpa audit | TVL dibatasi 48 SOL dan hanya berisi SOL Devnet — tidak ada dana nyata |
| Upgrade jahat | Diterima sebagai konsekuensi Devnet: dev key bisa mengganti program |
| Token-2022 | Ditolak di v1 |

Yang **tidak** dilindungi desain:

- Kekalahan economics karena pool tipis.
- Holder yang menjual besar dan menggeser harga.
- Kehilangan dev key: program tidak bisa di-upgrade lagi (di Devnet hanya berarti harus relaunch).
- Serangan sosial di luar rantai.

---

## 12. Parameter awal Devnet

| Parameter | Nilai |
|---|---|
| Network | Devnet |
| Program | `nebula_mass` (nama kerja) |
| Mint decimals | 6 |
| Total supply | 50.000.000 |
| Token seed | 9.600.000 |
| SOL seed | 48 |
| Mass Reserve | 10.000.000 |
| Fee | 30 bps |
| Upgrade authority | Dev key — disimpan (Devnet only) |
| Batas beli | Tidak ada |
| Interval `add_mass` | 7 hari |
| Cap `add_mass` | 5% reserve (dikunci) |

Fase pengujian:

1. **Realistis** — parameter di atas. Untuk uji UX, chart, dan tier.
2. **Stress** — mint baru, pool 500 SOL. Untuk uji presisi, overflow, dan performa.
3. **Tanpa mint authority** — mint authority dicabut, tetapi upgrade authority tetap dipegang dev key sesuai keputusan Devnet. Pastikan swap dan `add_mass` tetap jalan.

Yang tidak boleh berubah antar fase: **layout `PoolState`**.

---

## 13. Test matrix

| # | Test | Harapan |
|---:|---|---|
| 1 | Init dengan `fee_bps = 30` | Sukses, state benar, ATA dibuat |
| 2 | Init dengan `fee_bps = 1_001` | `InvalidFeeBps` |
| 3 | Init dengan mint decimals 9 | `InvalidMintDecimals` |
| 4 | Seed sekali | Sukses, reserve = args, `seeded = true` |
| 5 | Seed dua kali | `AlreadySeeded` |
| 6 | Seed dengan token 0 | `ZeroAmount` |
| 7 | Swap sebelum seed | `NotSeeded` |
| 8 | Beli 5,5 SOL dalam satu transaksi | Sukses — tidak ada batas beli |
| 9 | Beli dengan `min_out` terlalu tinggi | `SlippageExceeded` |
| 10 | Beli melewati `deadline` | `DeadlinePassed` |
| 11 | Jual seluruh token hasil beli | Sukses, `k` dalam toleransi |
| 12 | Jual lebih dari saldo | Gagal di level token program |
| 13 | Jual dengan `min_out` terlalu tinggi | `SlippageExceeded` |
| 14 | `add_mass` sebelum 7 hari | `MassIntervalNotElapsed` |
| 15 | `add_mass` dengan fee vault < 1 SOL | `InsufficientFeeVault` |
| 16 | `add_mass` melebihi 5% reserve | `MassCapExceeded` |
| 17 | `add_mass` dengan `max_token_in` kecil | `SlippageExceeded` |
| 18 | `add_mass` sukses | Harga berubah < 0,5%, event benar |
| 19 | `add_mass` dipanggil wallet acak | Sukses (permissionless) |
| 20 | Serangan: kirim vault palsu | `InvalidVault` |
| 21 | Serangan: donasi ke `sol_vault` | Harga tidak berubah |
| 22 | Cek ukuran `PoolState` | 264 byte |
| 23 | Fuzz beli/jual acak 10.000 iterasi | Tidak ada overflow, `k` tidak turun di luar toleransi |
| 24 | Replay event ke parser frontend | Candle kontinu, seed bukan candle |
| 25 | Revoke mint authority lalu swap | Tetap sukses |

Test 18 dan 23 wajib memakai properti, bukan hanya contoh tetap.

---

## 14. Yang masih terbuka

- [x] **Upgrade authority:** dev key disimpan selama Devnet.
- [x] **Cap Mass Reserve:** 5% (`MASS_CAP_BPS = 500`).
- [x] **Mainnet:** di luar scope.
- [ ] **Diskon fee berbasis tier (v1.1):** menambah pembacaan saldo di `swap`; belum masuk v1.
- [ ] **Nama program on-chain:** `nebula_mass`, `inertia_mass`, atau lain.
- [ ] **Apakah `sol_user` dan `fee` cukup untuk Activity**, atau perlu field tambahan untuk UI.
- [ ] **Interval `add_mass`:** hardcode 7 hari, atau jadikan parameter `initialize_pool` supaya Devnet bisa 60 detik?
- [ ] **Tanggal seed Devnet:** TBD — bukan public launch.
