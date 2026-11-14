use anchor_lang::prelude::*;
use anchor_lang::system_program::{self, Transfer};
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::constants::*;
use crate::error::MassError;
use crate::events::PoolInitialized;
use crate::state::{PoolState, FEE_VAULT_SEED, POOL_SEED, RESERVE_AUTH_SEED, SOL_VAULT_SEED, VAULT_AUTH_SEED};

#[derive(Accounts)]
pub struct InitializePool<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(constraint = mint.decimals == TOKEN_DECIMALS @ MassError::InvalidMintDecimals)]
    pub mint: Account<'info, Mint>,

    #[account(
        init,
        payer = authority,
        space = PoolState::SPACE,
        seeds = [POOL_SEED, mint.key().as_ref()],
        bump
    )]
    pub pool: Account<'info, PoolState>,

    /// CHECK: PDA penandatangan token vault, tidak menyimpan data.
    #[account(seeds = [VAULT_AUTH_SEED, pool.key().as_ref()], bump)]
    pub vault_authority: UncheckedAccount<'info>,

    /// CHECK: PDA penandatangan Mass Reserve, tidak menyimpan data.
    #[account(seeds = [RESERVE_AUTH_SEED, pool.key().as_ref()], bump)]
    pub reserve_authority: UncheckedAccount<'info>,

    #[account(
        init,
        payer = authority,
        associated_token::mint = mint,
        associated_token::authority = vault_authority,
    )]
    pub token_vault: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = authority,
        associated_token::mint = mint,
        associated_token::authority = reserve_authority,
    )]
    pub mass_reserve_vault: Account<'info, TokenAccount>,

    #[account(mut, seeds = [SOL_VAULT_SEED, pool.key().as_ref()], bump)]
    pub sol_vault: SystemAccount<'info>,

    #[account(mut, seeds = [FEE_VAULT_SEED, pool.key().as_ref()], bump)]
    pub fee_vault: SystemAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializePool>, fee_bps: u16, mass_interval: i64) -> Result<()> {
    require!(fee_bps <= MAX_FEE_BPS, MassError::InvalidFeeBps);
    require!(mass_interval > 0, MassError::InvalidInterval);

    let pool = &mut ctx.accounts.pool;
    pool.authority = ctx.accounts.authority.key();
    pool.mint = ctx.accounts.mint.key();
    pool.token_vault = ctx.accounts.token_vault.key();
    pool.sol_vault = ctx.accounts.sol_vault.key();
    pool.fee_vault = ctx.accounts.fee_vault.key();
    pool.mass_reserve_vault = ctx.accounts.mass_reserve_vault.key();
    pool.token_reserve = 0;
    pool.sol_reserve = 0;
    pool.fee_bps = fee_bps;
    pool.seeded = false;
    pool.bump = ctx.bumps.pool;
    pool.vault_auth_bump = ctx.bumps.vault_authority;
    pool.reserve_auth_bump = ctx.bumps.reserve_authority;
    pool.padding = [0u8; 2];
    pool.launch_slot = 0;
    pool.launch_ts = 0;
    pool.last_mass_ts = 0;
    pool.total_mass_sol = 0;
    pool.total_mass_token = 0;
    pool.mass_interval = mass_interval;

    // Dana rent untuk dua akun system 0-byte. Bukan bagian dari reserve pool.
    for vault in [&ctx.accounts.sol_vault, &ctx.accounts.fee_vault] {
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.key(),
                Transfer {
                    from: ctx.accounts.authority.to_account_info(),
                    to: vault.to_account_info(),
                },
            ),
            RENT_EXEMPT_MIN,
        )?;
    }

    emit!(PoolInitialized {
        pool: pool.key(),
        mint: pool.mint,
        authority: pool.authority,
        fee_bps,
        mass_interval,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
