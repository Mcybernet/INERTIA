use anchor_lang::prelude::*;

pub const POOL_SEED: &[u8] = b"pool";
pub const VAULT_AUTH_SEED: &[u8] = b"vault_auth";
pub const RESERVE_AUTH_SEED: &[u8] = b"reserve_auth";
pub const SOL_VAULT_SEED: &[u8] = b"sol_vault";
pub const FEE_VAULT_SEED: &[u8] = b"fee_vault";

/// Arah swap. Disimpan sebagai u8 di event (0 = buy, 1 = sell).
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq, Eq)]
pub enum Direction {
    Buy,
    Sell,
}

impl Direction {
    pub fn as_u8(self) -> u8 {
        match self {
            Direction::Buy => 0,
            Direction::Sell => 1,
        }
    }
}

/// State pool. Ukuran payload 264 byte, SPACE = 8 + 264 = 272.
///
/// Field 8-byte sengaja dikelompokkan agar offset tetap rapi; Borsh menulis
/// berurutan sesuai urutan field, bukan alignment.
#[account]
pub struct PoolState {
    pub authority: Pubkey,           // 0..32
    pub mint: Pubkey,                // 32..64
    pub token_vault: Pubkey,         // 64..96
    pub sol_vault: Pubkey,           // 96..128
    pub fee_vault: Pubkey,           // 128..160
    pub mass_reserve_vault: Pubkey,  // 160..192
    pub token_reserve: u64,          // 192..200
    pub sol_reserve: u64,            // 200..208
    pub fee_bps: u16,                // 208..210
    pub seeded: bool,                // 210..211
    pub bump: u8,                    // 211..212
    pub vault_auth_bump: u8,         // 212..213
    pub reserve_auth_bump: u8,       // 213..214
    pub padding: [u8; 2],            // 214..216
    pub launch_slot: u64,            // 216..224
    pub launch_ts: i64,              // 224..232
    pub last_mass_ts: i64,           // 232..240
    pub total_mass_sol: u64,         // 240..248
    pub total_mass_token: u64,       // 248..256
    pub mass_interval: i64,          // 256..264
}

impl PoolState {
    pub const LEN: usize = 264;
    pub const SPACE: usize = 8 + Self::LEN;

    /// Harga dari reserve saat ini, skala 1e15.
    pub fn price_scaled(&self) -> Result<u64> {
        Self::price_of(self.token_reserve, self.sol_reserve)
    }

    pub fn price_of(token_reserve: u64, sol_reserve: u64) -> Result<u64> {
        if token_reserve == 0 || sol_reserve == 0 {
            return Err(error!(crate::error::MassError::NotSeeded));
        }
        let num = (sol_reserve as u128)
            .checked_mul(crate::constants::PRICE_SCALE as u128)
            .ok_or_else(|| error!(crate::error::MassError::MathOverflow))?;
        let den = (token_reserve as u128)
            .checked_mul(crate::constants::DECIMAL_ADJ as u128)
            .ok_or_else(|| error!(crate::error::MassError::MathOverflow))?;
        u64::try_from(num / den).map_err(|_| error!(crate::error::MassError::MathOverflow))
    }
}
