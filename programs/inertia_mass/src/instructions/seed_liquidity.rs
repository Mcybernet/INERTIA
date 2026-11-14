use anchor_lang::prelude::*;
use anchor_lang::system_program::{self, Transfer};
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer as TokenTransfer};

use crate::constants::RENT_EXEMPT_MIN;
use crate::error::MassError;
use crate::events::PoolSeeded;
use crate::state::{PoolState, POOL_SEED, VAULT_AUTH_SEED};

#[derive(Accounts)]
pub struct SeedLiquidity<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [POOL_SEED, pool.mint.as_ref()],
        bump = pool.bump,
        constraint = !pool.seeded @ MassError::AlreadySeeded,
    )]
    pub pool: Account<'info, PoolState>,

    #[account(constraint = mint.key() == pool.mint @ MassError::InvalidMint)]
    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        token::mint = mint,
        token::authority = authority,
    )]
    pub authority_token_account: Account<'info, TokenAccount>,

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

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<SeedLiquidity>, token_amount: u64, sol_amount: u64) -> Result<()> {
    require!(token_amount > 0 && sol_amount > 0, MassError::ZeroAmount);
    require!(
        ctx.accounts.authority_token_account.amount >= token_amount,
        MassError::InsufficientTokenAmount
    );

    // Token: authority -> token_vault
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.key(),
            TokenTransfer {
                from: ctx.accounts.authority_token_account.to_account_info(),
                to: ctx.accounts.token_vault.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        ),
        token_amount,
    )?;

    // SOL: authority -> sol_vault
    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.key(),
            Transfer {
                from: ctx.accounts.authority.to_account_info(),
                to: ctx.accounts.sol_vault.to_account_info(),
            },
        ),
        sol_amount,
    )?;

    ctx.accounts.token_vault.reload()?;

    // Donasi langsung ke vault tidak dihitung sebagai reserve (lihat §11 spec).
    require!(
        ctx.accounts.sol_vault.lamports() >= sol_amount.saturating_add(RENT_EXEMPT_MIN),
        MassError::InvalidVault
    );

    let clock = Clock::get()?;
    let pool = &mut ctx.accounts.pool;
    pool.token_reserve = token_amount;
    pool.sol_reserve = sol_amount;
    pool.launch_slot = clock.slot;
    pool.launch_ts = clock.unix_timestamp;
    pool.last_mass_ts = clock.unix_timestamp;
    pool.seeded = true;

    emit!(PoolSeeded {
        pool: pool.key(),
        token_amount,
        sol_amount,
        price_scaled: pool.price_scaled()?,
        launch_slot: clock.slot,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}
