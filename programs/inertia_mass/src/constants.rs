/// Token selalu 6 desimal; SOL 9 desimal.
pub const TOKEN_DECIMALS: u8 = 6;
pub const DECIMAL_ADJ: u64 = 1_000; // 10^(9-6)

/// Skala harga di state/event: 1e15.
pub const PRICE_SCALE: u64 = 1_000_000_000_000_000;

/// Fee default Devnet: 30 bps = 0,30%.
pub const DEFAULT_FEE_BPS: u16 = 30;
pub const MAX_FEE_BPS: u16 = 1_000;

/// Interval `add_mass` default (7 hari). Bisa di-override lewat `initialize_pool`
/// agar Devnet memakai interval pendek (contoh 60 detik).
pub const MASS_INTERVAL_SECONDS: i64 = 604_800;

/// Minimal SOL yang boleh masuk per `add_mass`: 1 SOL.
pub const MIN_MASS_SOL: u64 = 1_000_000_000;

/// Cap per panggilan: 5% dari saldo Mass Reserve.
pub const MASS_CAP_BPS: u64 = 500;

/// Toleransi pergeseran harga `add_mass`: 0,5%.
pub const MASS_RATIO_TOL_BPS: u64 = 50;

/// Rent-exempt minimum untuk akun system 0-byte.
pub const RENT_EXEMPT_MIN: u64 = 890_880;
