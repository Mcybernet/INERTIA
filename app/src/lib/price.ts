import { PRICE_SCALE, SUPPLY_RAW } from "./constants";

/** Konversi price_scaled (1e15) ke SOL per token. */
export function priceToSol(scaled: bigint | string): number {
  return Number(BigInt(scaled)) / Number(PRICE_SCALE);
}

export function fdvSol(
  priceScaled: bigint | string,
  supplyRaw: bigint = SUPPLY_RAW,
): number {
  return priceToSol(priceScaled) * (Number(supplyRaw) / 1e6);
}
