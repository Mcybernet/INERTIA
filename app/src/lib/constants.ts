import { PublicKey } from "@solana/web3.js";

/** Program `inertia_mass` di Devnet. */
export const PROGRAM_ID = new PublicKey(
  "8nxgCR4TW9K7zh5hb9ntW5dKRFumbdL4BxaaR1oWn86o",
);

/** Mint INRT Devnet (decimals 6, mint authority revoked). */
export const MINT = new PublicKey(
  "GEovdGGfR75dLdYS5LABHR6sGf9s72fqDNkkaj9RDE4H",
);

export const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.devnet.solana.com";

export const TOKEN_DECIMALS = 6;
export const SOL_DECIMALS = 9;
export const TOKEN_UNIT = 10n ** 6n;
export const SOL_UNIT = 10n ** 9n;

/** Skala harga di state/event: 1e15. */
export const PRICE_SCALE = 10n ** 15n;

/** 50.000.000 INRT. */
export const SUPPLY_RAW = 50_000_000n * TOKEN_UNIT;

/** Batas slippage UI (bps). */
export const SLIPPAGE_OPTIONS = [50, 100, 200] as const;
export const DEFAULT_SLIPPAGE_BPS = 50;

/** Deadline transaksi (detik). */
export const TX_DEADLINE_SECONDS = 120;

export const SEEDS = {
  pool: "pool",
  vaultAuth: "vault_auth",
  reserveAuth: "reserve_auth",
  solVault: "sol_vault",
  feeVault: "fee_vault",
} as const;

export const TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
);
export const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
);

/** Alamat yang selalu relevan untuk tabel holder. */
export const OWNER_ADDRESS = "86RAJdtpYWeq9vmcpYNzLCVdcFpC5vacwFfdDrXPa24C";
export const OWNER_ATA = "7b4cYnPTtxYsFe9Z4mUHPMZDBy6h3VvwPwaAME9Jq5ts";
export const KNOWN_ACCOUNTS: Record<string, string> = {
  "HobKvgdzXw4TPmR4XiUg45HVB2jqXuUXnDpuHqZdcPCM": "POOL VAULT",
  "HcmXidwTkTGRFTvJAx4bCj7Ebs5gJZmJVNakvBnpPJff": "POOL VAULT",
  "nCbjXjTZbqj9GyJogUeaweh3K5MKWfYCKRGjatPMroH": "MASS RESERVE",
  "7b4cYnPTtxYsFe9Z4mUHPMZDBy6h3VvwPwaAME9Jq5ts": "OWNER",
  "86RAJdtpYWeq9vmcpYNzLCVdcFpC5vacwFfdDrXPa24C": "OWNER",
};

export type Tier = {
  name: string;
  minBps: number;
  color: string;
};

/** Tier dari persentase supply (bps). */
export const TIERS: Tier[] = [
  { name: "INERTIA", minBps: 400, color: "#E0A64B" },
  { name: "MOMENTUM", minBps: 150, color: "#C9A063" },
  { name: "MASS", minBps: 50, color: "#9A9384" },
  { name: "PULL", minBps: 10, color: "#7A7A85" },
  { name: "REST", minBps: 0, color: "#5D5D68" },
];

export function tierFor(bps: number): Tier {
  return TIERS.find((t) => bps >= t.minBps) ?? TIERS[TIERS.length - 1];
}
