use anchor_lang::prelude::*;
use anchor_lang::system_program::{self, Transfer};

use crate::constants::RENT_EXEMPT_MIN;
use crate::error::MassError;
use crate::events::LiquidityRefunded;
use crate::state::{PoolState, POOL_SEED, SOL_VAULT_SEED};

/// Mengembalikan SOL dari sol_vault ke alamat tertentu.
/// Hanya `pool.authority` yang bisa memanggil. Rent vault sengaja ditinggalkan
/// agar akun PDA tetap alive dan instruksi lain tidak panic.
#[derive(Accounts)]
pub struct RefundLiquidity<'info> {
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [POOL_SEED, pool.mint.as_ref()],
        bump = pool.bump,
        constraint = authority.key() == pool.authority @ MassError::Unauthorized,
    )]
    pub pool: Account<'info, PoolState>,

    #[account(
        mut,
        seeds = [SOL_VAULT_SEED, pool.key().as_ref()],
        bump,
        address = pool.sol_vault @ MassError::InvalidVault,
    )]
    pub sol_vault: SystemAccount<'info>,

    /// CHECK: alamat tujuan, tidak dibaca sebagai tipe akun tertentu.
    #[account(mut)]
    pub destination: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<RefundLiquidity>, amount_lamports: u64) -> Result<()> {
    require!(amount_lamports > 0, MassError::ZeroAmount);

    let pool = &mut ctx.accounts.pool;

    let spendable = ctx
        .accounts
        .sol_vault
        .lamports()
        .checked_sub(RENT_EXEMPT_MIN)
        .ok_or_else(|| error!(MassError::InsufficientVaultLamports))?;
    require!(
        amount_lamports <= spendable,
        MassError::InsufficientVaultLamports
    );
    require!(
        amount_lamports <= pool.sol_reserve,
        MassError::InsufficientVaultLamports
    );

    let pool_key = pool.key();
    let bump = [ctx.bumps.sol_vault];
    let seeds: &[&[u8]] = &[SOL_VAULT_SEED, pool_key.as_ref(), &bump];

    system_program::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.key(),
            Transfer {
                from: ctx.accounts.sol_vault.to_account_info(),
                to: ctx.accounts.destination.to_account_info(),
            },
            &[seeds],
        ),
        amount_lamports,
    )?;

    pool.sol_reserve = pool
        .sol_reserve
        .checked_sub(amount_lamports)
        .ok_or_else(|| error!(MassError::MathOverflow))?;
    if pool.sol_reserve == 0 {
        // Reserve habis: swap/add_mass akan mengembalikan NotSeeded,
        // bukan membagi dengan nol.
        pool.seeded = false;
    }

    emit!(LiquidityRefunded {
        pool: pool_key,
        authority: ctx.accounts.authority.key(),
        destination: ctx.accounts.destination.key(),
        amount_lamports,
        reserve_sol_after: pool.sol_reserve,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
