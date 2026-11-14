use anchor_lang::prelude::*;

pub mod constants;
pub mod error;
pub mod events;
pub mod instructions;
pub mod math;
pub mod state;

pub use instructions::*;
use state::Direction;

declare_id!("8nxgCR4TW9K7zh5hb9ntW5dKRFumbdL4BxaaR1oWn86o");

#[program]
pub mod inertia_mass {
    use super::*;

    pub fn initialize_pool(
        ctx: Context<InitializePool>,
        fee_bps: u16,
        mass_interval: i64,
    ) -> Result<()> {
        instructions::initialize_pool::handler(ctx, fee_bps, mass_interval)
    }

    pub fn seed_liquidity(
        ctx: Context<SeedLiquidity>,
        token_amount: u64,
        sol_amount: u64,
    ) -> Result<()> {
        instructions::seed_liquidity::handler(ctx, token_amount, sol_amount)
    }

    pub fn swap(
        ctx: Context<Swap>,
        direction: Direction,
        amount_in: u64,
        min_amount_out: u64,
        deadline: i64,
    ) -> Result<()> {
        instructions::swap::handler(ctx, direction, amount_in, min_amount_out, deadline)
    }

    pub fn add_mass(ctx: Context<AddMass>, amount_sol: u64, max_token_in: u64) -> Result<()> {
        instructions::add_mass::handler(ctx, amount_sol, max_token_in)
    }
}
