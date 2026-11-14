use anchor_lang::prelude::*;
use anchor_lang::system_program::{self, Transfer};
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer as TokenTransfer};

use crate::constants::{MASS_CAP_BPS, MASS_RATIO_TOL_BPS, MIN_MASS_SOL, RENT_EXEMPT_MIN};
use crate::error::MassError;
use crate::events::MassAdded;
use crate::math::{mass_token_needed, price_drift_bps};
use crate::state::{
    PoolState, FEE_VAULT_SEED, POOL_SEED, RESERVE_AUTH_SEED, VAULT_AUTH_SEED,
};

#[derive(Accounts)]
pub struct AddMass<'info> {
    #[account(mut)]
    pub caller: Signer<'info>,

    #[account(
        mut,
        seeds = [POOL_SEED, pool.mint.as_ref()],
        bump = pool.bump,
        constraint = pool.seeded @ MassError::NotSeeded,
    )]
    pub pool: Account<'info, PoolState>,

    #[account(constraint = mint.key() == pool.mint @ MassError::InvalidMint)]
    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        address = pool.token_vault @ MassError::InvalidVault,
        constraint = token_vault.owner == vault_authority.key() @ MassError::InvalidVault,
    )]
    pub token_vault: Account<'info, TokenAccount>,

    /// CHECK: PDA pemilik token vault.
    #[account(seeds = [VAULT_AUTH_SEED, pool.key().as_ref()], bump = pool.vault_auth_bump)]
    pub vault_authority: UncheckedAccount<'info>,

    #[account(mut, address = pool.sol_vault @ MassError::InvalidVault)]
    pub sol_vault: SystemAccount<'info>,

    #[account(
        mut,
        seeds = [FEE_VAULT_SEED, pool.key().as_ref()],
        bump,
        address = pool.fee_vault @ MassError::InvalidVault,
    )]
    pub fee_vault: SystemAccount<'info>,

    #[account(
        mut,
        address = pool.mass_reserve_vault @ MassError::InvalidVault,
        constraint = mass_reserve_vault.owner == reserve_authority.key() @ MassError::InvalidVault,
    )]
    pub mass_reserve_vault: Account<'info, TokenAccount>,

    /// CHECK: PDA pemilik Mass Reserve.
    #[account(seeds = [RESERVE_AUTH_SEED, pool.key().as_ref()], bump = pool.reserve_auth_bump)]
    pub reserve_authority: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<AddMass>, amount_sol: u64, max_token_in: u64) -> Result<()> {
    let clock = Clock::get()?;
    let pool = &mut ctx.accounts.pool;

    let now = clock.unix_timestamp;
    require!(
        now.saturating_sub(pool.last_mass_ts) >= pool.mass_interval,
        MassError::MassIntervalNotElapsed
    );

    let claimable = ctx
        .accounts
        .fee_vault
        .lamports()
        .saturating_sub(RENT_EXEMPT_MIN);
    require!(amount_sol >= MIN_MASS_SOL, MassError::InsufficientFeeVault);
    require!(amount_sol <= claimable, MassError::InsufficientFeeVault);

    let mass_balance = ctx.accounts.mass_reserve_vault.amount;
    let token_needed = mass_token_needed(amount_sol, pool.token_reserve, pool.sol_reserve)?;
    require!(token_needed <= max_token_in, MassError::SlippageExceeded);
    require!(
        token_needed <= mass_balance,
        MassError::InsufficientMassReserve
    );

    let cap = (mass_balance as u128)
        .checked_mul(MASS_CAP_BPS as u128)
        .ok_or_else(|| error!(MassError::MathOverflow))?
        / 10_000;
    let cap = u64::try_from(cap).map_err(|_| error!(MassError::MathOverflow))?;
    require!(token_needed <= cap, MassError::MassCapExceeded);

    let price_before = pool.price_scaled()?;
    let token_after = pool
        .token_reserve
        .checked_add(token_needed)
        .ok_or_else(|| error!(MassError::MathOverflow))?;
    let sol_after = pool
        .sol_reserve
        .checked_add(amount_sol)
        .ok_or_else(|| error!(MassError::MathOverflow))?;
    let price_after = PoolState::price_of(token_after, sol_after)?;
    let drift = price_drift_bps(price_before, price_after)?;
    require!(drift <= MASS_RATIO_TOL_BPS, MassError::RatioDriftExceeded);

    let pool_key = pool.key();

    // SOL: fee_vault -> sol_vault
    let fee_bump = [ctx.bumps.fee_vault];
    let fee_seeds: &[&[u8]] = &[FEE_VAULT_SEED, pool_key.as_ref(), &fee_bump];
    system_program::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.key(),
            Transfer {
                from: ctx.accounts.fee_vault.to_account_info(),
                to: ctx.accounts.sol_vault.to_account_info(),
            },
            &[fee_seeds],
        ),
        amount_sol,
    )?;

    // Token: mass_reserve_vault -> token_vault
    let reserve_bump = [pool.reserve_auth_bump];
    let reserve_seeds: &[&[u8]] = &[RESERVE_AUTH_SEED, pool_key.as_ref(), &reserve_bump];
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.key(),
            TokenTransfer {
                from: ctx.accounts.mass_reserve_vault.to_account_info(),
                to: ctx.accounts.token_vault.to_account_info(),
                authority: ctx.accounts.reserve_authority.to_account_info(),
            },
            &[reserve_seeds],
        ),
        token_needed,
    )?;

    pool.token_reserve = token_after;
    pool.sol_reserve = sol_after;
    pool.last_mass_ts = now;
    pool.total_mass_sol = pool
        .total_mass_sol
        .checked_add(amount_sol)
        .ok_or_else(|| error!(MassError::MathOverflow))?;
    pool.total_mass_token = pool
        .total_mass_token
        .checked_add(token_needed)
        .ok_or_else(|| error!(MassError::MathOverflow))?;

    emit!(MassAdded {
        pool: pool_key,
        caller: ctx.accounts.caller.key(),
        sol_amount: amount_sol,
        token_amount: token_needed,
        price_after,
        reserve_token: pool.token_reserve,
        reserve_sol: pool.sol_reserve,
        total_mass_sol: pool.total_mass_sol,
        total_mass_token: pool.total_mass_token,
        timestamp: now,
    });

    Ok(())
}
