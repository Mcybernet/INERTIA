export type BuyQuote = { fee: bigint; netIn: bigint; out: bigint };
export type SellQuote = { gross: bigint; fee: bigint; net: bigint };

/** Mirror `math.rs::quote_buy` — semua pembulatan floor. */
export function quoteBuy(
  tokenReserve: bigint,
  solReserve: bigint,
  feeBps: number,
  amountIn: bigint,
): BuyQuote | null {
  if (amountIn <= 0n || tokenReserve <= 0n || solReserve <= 0n) return null;
  const fee = (amountIn * BigInt(feeBps)) / 10_000n;
  const netIn = amountIn - fee;
  if (netIn <= 0n) return null;
  const out = (tokenReserve * netIn) / (solReserve + netIn);
  if (out <= 0n || out > tokenReserve) return null;
  return { fee, netIn, out };
}

/** Mirror `math.rs::quote_sell`. */
export function quoteSell(
  tokenReserve: bigint,
  solReserve: bigint,
  feeBps: number,
  amountIn: bigint,
): SellQuote | null {
  if (amountIn <= 0n || tokenReserve <= 0n || solReserve <= 0n) return null;
  const gross = (solReserve * amountIn) / (tokenReserve + amountIn);
  if (gross <= 0n || gross > solReserve) return null;
  const fee = (gross * BigInt(feeBps)) / 10_000n;
  const net = gross - fee;
  if (net <= 0n) return null;
  return { gross, fee, net };
}

/** Batas minimum output setelah slippage (floor), sama seperti CLI. */
export function withSlippage(out: bigint, slippageBps: number): bigint {
  return (out * BigInt(10_000 - slippageBps)) / 10_000n;
}

/** Perkiraan price impact dalam bps (tanpa fee). */
export function priceImpactBps(
  direction: "buy" | "sell",
  amountIn: bigint,
  tokenReserve: bigint,
  solReserve: bigint,
): number {
  if (direction === "buy") {
    if (solReserve === 0n) return 0;
    return Number((amountIn * 10_000n) / solReserve);
  }
  if (tokenReserve === 0n) return 0;
  return Number((amountIn * 10_000n) / tokenReserve);
}
