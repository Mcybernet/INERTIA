use anchor_lang::prelude::*;
use anchor_lang::system_program::{self, Transfer};
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer as TokenTransfer};

use crate::error::MassError;
use crate::events::SwapEvent;
use crate::math::{quote_buy, quote_sell};
use crate::state::{
    Direction, PoolState, POOL_SEED, SOL_VAULT_SEED, VAULT_AUTH_SEED,
};

#[derive(Accounts)]
pub struct Swap<'info> {
    #[account(mut)]
    pub trader: Signer<'info>,

    #[account(
        mut,
        seeds = [POOL_SEED, pool.mint.as_ref()],
        bump = pool.bump,
        constraint = pool.seeded @ MassError::NotSeeded,
    )]
    pub pool: Account<'info, PoolState>,

    #[account(constraint = mint.key() == pool.mint @ MassError::InvalidMint)]
    pub mint: Account<'info, Mint>,

    #[account(mut, token::mint = mint, token::authority = trader)]
    pub trader_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        address = pool.token_vault @ MassError::InvalidVault,
        constraint = token_vault.owner == vault_authority.key() @ MassError::InvalidVault,
    )]
    pub token_vault: Account<'info, TokenAccount>,

    /// CHECK: PDA pemilik token vault.
    #[account(seeds = [VAULT_AUTH_SEED, pool.key().as_ref()], bump = pool.vault_auth_bump)]
    pub vault_authority: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [SOL_VAULT_SEED, pool.key().as_ref()],
        bump,
        address = pool.sol_vault @ MassError::InvalidVault,
    )]
    pub sol_vault: SystemAccount<'info>,

    #[account(mut, address = pool.fee_vault @ MassError::InvalidVault)]
    pub fee_vault: SystemAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<Swap>,
    direction: Direction,
    amount_in: u64,
    min_amount_out: u64,
    deadline: i64,
) -> Result<()> {
    let clock = Clock::get()?;
    require!(
        deadline == 0 || clock.unix_timestamp <= deadline,
        MassError::DeadlinePassed
    );
    require!(amount_in > 0, MassError::ZeroAmount);

    let pool = &mut ctx.accounts.pool;

    match direction {
        Direction::Buy => {
            let q = quote_buy(pool.token_reserve, pool.sol_reserve, pool.fee_bps, amount_in)?;
            require!(q.out >= min_amount_out, MassError::SlippageExceeded);

            // SOL: trader -> fee_vault (fee) dan trader -> sol_vault (net)
            if q.fee > 0 {
                system_program::transfer(
                    CpiContext::new(
                        ctx.accounts.system_program.key(),
                        Transfer {
                            from: ctx.accounts.trader.to_account_info(),
                            to: ctx.accounts.fee_vault.to_account_info(),
                        },
                    ),
                    q.fee,
                )?;
            }
            system_program::transfer(
                CpiContext::new(
                    ctx.accounts.system_program.key(),
                    Transfer {
                        from: ctx.accounts.trader.to_account_info(),
                        to: ctx.accounts.sol_vault.to_account_info(),
                    },
                ),
                q.net_in,
            )?;

            // Token: token_vault -> trader, ditandatangani vault_authority.
            let pool_key = pool.key();
            let bump = [pool.vault_auth_bump];
            let seeds: &[&[u8]] = &[VAULT_AUTH_SEED, pool_key.as_ref(), &bump];
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.key(),
                    TokenTransfer {
                        from: ctx.accounts.token_vault.to_account_info(),
                        to: ctx.accounts.trader_token_account.to_account_info(),
                        authority: ctx.accounts.vault_authority.to_account_info(),
                    },
                    &[seeds],
                ),
                q.out,
            )?;

            pool.token_reserve = pool
                .token_reserve
                .checked_sub(q.out)
                .ok_or_else(|| error!(MassError::MathOverflow))?;
            pool.sol_reserve = pool
                .sol_reserve
                .checked_add(q.net_in)
                .ok_or_else(|| error!(MassError::MathOverflow))?;

            emit!(SwapEvent {
                pool: pool_key,
                wallet: ctx.accounts.trader.key(),
                direction: Direction::Buy.as_u8(),
                token_amount: q.out,
                sol_amount: q.net_in,
                sol_user: amount_in,
                fee: q.fee,
                price_after: pool.price_scaled()?,
                reserve_token: pool.token_reserve,
                reserve_sol: pool.sol_reserve,
                timestamp: clock.unix_timestamp,
            });
        }
        Direction::Sell => {
            let q = quote_sell(pool.token_reserve, pool.sol_reserve, pool.fee_bps, amount_in)?;
            require!(q.net >= min_amount_out, MassError::SlippageExceeded);

            // Token: trader -> token_vault
            token::transfer(
                CpiContext::new(
                    ctx.accounts.token_program.key(),
                    TokenTransfer {
                        from: ctx.accounts.trader_token_account.to_account_info(),
                        to: ctx.accounts.token_vault.to_account_info(),
                        authority: ctx.accounts.trader.to_account_info(),
                    },
                ),
                amount_in,
            )?;

            let pool_key = pool.key();
            let bump = [ctx.bumps.sol_vault];
            let seeds: &[&[u8]] = &[SOL_VAULT_SEED, pool_key.as_ref(), &bump];

            // SOL: sol_vault -> trader (net)
            system_program::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.system_program.key(),
                    Transfer {
                        from: ctx.accounts.sol_vault.to_account_info(),
                        to: ctx.accounts.trader.to_account_info(),
                    },
                    &[seeds],
                ),
                q.net,
            )?;
            // SOL: sol_vault -> fee_vault (fee)
            if q.fee > 0 {
                system_program::transfer(
                    CpiContext::new_with_signer(
                        ctx.accounts.system_program.key(),
                        Transfer {
                            from: ctx.accounts.sol_vault.to_account_info(),
                            to: ctx.accounts.fee_vault.to_account_info(),
                        },
                        &[seeds],
                    ),
                    q.fee,
                )?;
            }

            pool.token_reserve = pool
                .token_reserve
                .checked_add(amount_in)
                .ok_or_else(|| error!(MassError::MathOverflow))?;
            pool.sol_reserve = pool
                .sol_reserve
                .checked_sub(q.gross)
                .ok_or_else(|| error!(MassError::MathOverflow))?;

            emit!(SwapEvent {
                pool: pool_key,
                wallet: ctx.accounts.trader.key(),
                direction: Direction::Sell.as_u8(),
                token_amount: amount_in,
                sol_amount: q.gross,
                sol_user: q.net,
                fee: q.fee,
                price_after: pool.price_scaled()?,
                reserve_token: pool.token_reserve,
                reserve_sol: pool.sol_reserve,
                timestamp: clock.unix_timestamp,
            });
        }
    }

    Ok(())
}
