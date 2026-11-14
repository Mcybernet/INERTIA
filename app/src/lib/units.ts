/** Parse input desimal (menerima koma atau titik) menjadi unit terkecil. */
export function parseUnits(input: string, decimals: number): bigint | null {
  const value = input.trim().replace(",", ".");
  if (value === "" || value === ".") return null;
  if (!/^\d*\.?\d*$/.test(value)) return null;
  const [whole = "0", frac = ""] = value.split(".");
  const padded = (frac + "0".repeat(decimals)).slice(0, decimals);
  try {
    return BigInt(whole || "0") * 10n ** BigInt(decimals) + BigInt(padded || "0");
  } catch {
    return null;
  }
}

/** Ubah unit terkecil menjadi string input (tanpa nol ekor). */
export function formatUnitsInput(
  raw: bigint,
  decimals: number,
  maxFrac = decimals,
): string {
  const unit = 10n ** BigInt(decimals);
  const whole = raw / unit;
  const frac = raw % unit;
  let fracStr = frac
    .toString()
    .padStart(decimals, "0")
    .replace(/0+$/, "")
    .slice(0, maxFrac);
  return fracStr.length > 0 ? `${whole}.${fracStr}` : whole.toString();
}
