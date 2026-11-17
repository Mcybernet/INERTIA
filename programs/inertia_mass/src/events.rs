use anchor_lang::prelude::*;

#[event]
pub struct PoolInitialized {
    pub pool: Pubkey,
    pub mint: Pubkey,
    pub authority: Pubkey,
    pub fee_bps: u16,
    pub mass_interval: i64,
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
    /// 0 = buy, 1 = sell
    pub direction: u8,
    /// beli: token keluar pool; jual: token masuk pool
    pub token_amount: u64,
    /// perubahan reserve: beli +net, jual -gross
    pub sol_amount: u64,
    /// beli: SOL dibayar; jual: SOL diterima
    pub sol_user: u64,
    pub fee: u64,
    pub price_after: u64,
    pub reserve_token: u64,
    pub reserve_sol: u64,
    pub timestamp: i64,
}

#[event]
pub struct LiquidityRefunded {
    pub pool: Pubkey,
    pub authority: Pubkey,
    pub destination: Pubkey,
    pub amount_lamports: u64,
    pub reserve_sol_after: u64,
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
