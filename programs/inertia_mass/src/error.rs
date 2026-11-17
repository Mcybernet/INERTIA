use anchor_lang::prelude::*;

#[error_code]
pub enum MassError {
    #[msg("fee_bps melebihi batas")]
    InvalidFeeBps,
    #[msg("interval add_mass tidak valid")]
    InvalidInterval,
    #[msg("pool sudah di-seed")]
    AlreadySeeded,
    #[msg("pool belum di-seed")]
    NotSeeded,
    #[msg("jumlah tidak boleh nol")]
    ZeroAmount,
    #[msg("saldo token tidak cukup")]
    InsufficientTokenAmount,
    #[msg("output di bawah minimum")]
    SlippageExceeded,
    #[msg("transaksi kedaluwarsa")]
    DeadlinePassed,
    #[msg("fee vault tidak cukup")]
    InsufficientFeeVault,
    #[msg("interval add_mass belum lewat")]
    MassIntervalNotElapsed,
    #[msg("melebihi cap Mass Reserve")]
    MassCapExceeded,
    #[msg("Mass Reserve tidak cukup")]
    InsufficientMassReserve,
    #[msg("rasio bergeser terlalu jauh")]
    RatioDriftExceeded,
    #[msg("akun vault tidak cocok")]
    InvalidVault,
    #[msg("mint tidak cocok")]
    InvalidMint,
    #[msg("matematika overflow")]
    MathOverflow,
    #[msg("arah swap tidak valid")]
    InvalidDirection,
    #[msg("desimal mint bukan 6")]
    InvalidMintDecimals,
    #[msg("pemanggil bukan authority pool")]
    Unauthorized,
    #[msg("saldo vault tidak cukup")]
    InsufficientVaultLamports,
}
