use crate::error::MassError;
use anchor_lang::prelude::*;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct BuyQuote {
    pub fee: u64,
    pub net_in: u64,
    pub out: u64,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct SellQuote {
    pub gross: u64,
    pub fee: u64,
    pub net: u64,
}

fn overflow() -> anchor_lang::error::Error {
    error!(MassError::MathOverflow)
}

pub fn u128_to_u64(value: u128) -> Result<u64> {
    u64::try_from(value).map_err(|_| overflow())
}

pub fn ceil_div_u128(a: u128, b: u128) -> Result<u128> {
    if b == 0 {
        return Err(overflow());
    }
    Ok(a / b + if a % b == 0 { 0 } else { 1 })
}

/// Beli: SOL masuk, token keluar. Semua pembulatan floor, menguntungkan pool.
pub fn quote_buy(
    token_reserve: u64,
    sol_reserve: u64,
    fee_bps: u16,
    amount_in: u64,
) -> Result<BuyQuote> {
    if amount_in == 0 {
        return Err(error!(MassError::ZeroAmount));
    }
    let fee = u128_to_u64(
        (amount_in as u128)
            .checked_mul(fee_bps as u128)
            .ok_or_else(overflow)?
            / 10_000,
    )?;
    let net_in = amount_in.checked_sub(fee).ok_or_else(overflow)?;
    if net_in == 0 {
        return Err(error!(MassError::ZeroAmount));
    }
    let den = (sol_reserve as u128)
        .checked_add(net_in as u128)
        .ok_or_else(overflow)?;
    let out = u128_to_u64(
        (token_reserve as u128)
            .checked_mul(net_in as u128)
            .ok_or_else(overflow)?
            / den,
    )?;
    if out == 0 {
        return Err(error!(MassError::ZeroAmount));
    }
    if out > token_reserve {
        return Err(overflow());
    }
    Ok(BuyQuote { fee, net_in, out })
}

/// Jual: token masuk, SOL keluar. Gross dan net di-floor.
pub fn quote_sell(
    token_reserve: u64,
    sol_reserve: u64,
    fee_bps: u16,
    amount_in: u64,
) -> Result<SellQuote> {
    if amount_in == 0 {
        return Err(error!(MassError::ZeroAmount));
    }
    let den = (token_reserve as u128)
        .checked_add(amount_in as u128)
        .ok_or_else(overflow)?;
    let gross = u128_to_u64(
        (sol_reserve as u128)
            .checked_mul(amount_in as u128)
            .ok_or_else(overflow)?
            / den,
    )?;
    if gross == 0 {
        return Err(error!(MassError::ZeroAmount));
    }
    if gross > sol_reserve {
        return Err(overflow());
    }
    let fee = u128_to_u64((gross as u128).checked_mul(fee_bps as u128).ok_or_else(overflow)? / 10_000)?;
    let net = gross.checked_sub(fee).ok_or_else(overflow)?;
    if net == 0 {
        return Err(error!(MassError::ZeroAmount));
    }
    Ok(SellQuote { gross, fee, net })
}

/// Token yang harus masuk pool saat `add_mass`, dibulatkan ke atas.
pub fn mass_token_needed(amount_sol: u64, token_reserve: u64, sol_reserve: u64) -> Result<u64> {
    if sol_reserve == 0 || token_reserve == 0 {
        return Err(error!(MassError::NotSeeded));
    }
    let num = (amount_sol as u128)
        .checked_mul(token_reserve as u128)
        .ok_or_else(overflow)?;
    let needed = ceil_div_u128(num, sol_reserve as u128)?;
    let needed = u128_to_u64(needed)?;
    if needed == 0 {
        return Err(error!(MassError::ZeroAmount));
    }
    Ok(needed)
}

/// Selisih harga relatif dalam bps (dibulatkan ke atas agar konservatif).
pub fn price_drift_bps(before: u64, after: u64) -> Result<u64> {
    if before == 0 {
        return Err(error!(MassError::MathOverflow));
    }
    let diff = before.abs_diff(after) as u128;
    u128_to_u64(
        diff.checked_mul(10_000)
            .ok_or_else(overflow)?
            .checked_add(before as u128 - 1)
            .ok_or_else(overflow)?
            / before as u128,
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    const TOKEN_RESERVE: u64 = 9_600_000_000_000; // 9,6 jt token (6 desimal)
    const SOL_RESERVE: u64 = 48_000_000_000; // 48 SOL

    #[test]
    fn seed_price_is_five_micro_sol() {
        let price = (SOL_RESERVE as u128) * 1_000_000_000_000_000u128
            / ((TOKEN_RESERVE as u128) * 1_000u128);
        assert_eq!(price, 5_000_000_000);
    }

    #[test]
    fn buy_5_5_sol_has_no_cap() {
        let q = quote_buy(TOKEN_RESERVE, SOL_RESERVE, 30, 5_500_000_000).unwrap();
        assert_eq!(q.fee, 16_500_000);
        assert_eq!(q.net_in, 5_483_500_000);
        assert!(q.out > 0 && q.out < TOKEN_RESERVE);
    }

    #[test]
    fn buy_then_sell_round_trip_never_profits() {
        let buy = quote_buy(TOKEN_RESERVE, SOL_RESERVE, 30, 1_000_000_000).unwrap();
        let token_after = TOKEN_RESERVE - buy.out;
        let sol_after = SOL_RESERVE + buy.net_in;
        let sell = quote_sell(token_after, sol_after, 30, buy.out).unwrap();
        assert!(sell.net < 1_000_000_000);
    }

    #[test]
    fn sell_full_supply_of_bought_tokens_stays_positive() {
        let buy = quote_buy(TOKEN_RESERVE, SOL_RESERVE, 30, 100_000_000_000).unwrap();
        let sell = quote_sell(TOKEN_RESERVE - buy.out, SOL_RESERVE + buy.net_in, 30, buy.out)
            .unwrap();
        assert!(sell.gross <= SOL_RESERVE + buy.net_in);
        assert!(sell.gross > sell.fee);
    }

    #[test]
    fn mass_token_needed_rounds_up() {
        let needed = mass_token_needed(1_000_000_000, TOKEN_RESERVE, SOL_RESERVE).unwrap();
        assert_eq!(needed, 200_000_000_000); // 200.000 token
        // pembulatan: 3 lamports SOL -> ceil, bukan 0
        let tiny = mass_token_needed(3, 9_600_000_000_001, SOL_RESERVE).unwrap();
        assert!(tiny >= 1);
    }

    #[test]
    fn mass_drift_is_tiny() {
        let needed = mass_token_needed(1_000_000_000, TOKEN_RESERVE, SOL_RESERVE).unwrap();
        let before = 5_000_000_000u64;
        let token_after = TOKEN_RESERVE + needed;
        let sol_after = SOL_RESERVE + 1_000_000_000;
        let after = (sol_after as u128) * 1_000_000_000_000_000u128
            / ((token_after as u128) * 1_000u128);
        let drift = price_drift_bps(before, after as u64).unwrap();
        assert!(drift <= 50, "drift {}", drift);
    }

    #[test]
    fn zero_and_overflow_guards() {
        assert!(quote_buy(TOKEN_RESERVE, SOL_RESERVE, 30, 0).is_err());
        assert!(quote_sell(TOKEN_RESERVE, SOL_RESERVE, 30, 0).is_err());
        assert!(mass_token_needed(1, 0, SOL_RESERVE).is_err());
    }
}
