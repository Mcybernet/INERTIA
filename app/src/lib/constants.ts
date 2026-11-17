import { PublicKey } from "@solana/web3.js";

/** Program `inertia_mass` di Devnet. */
export const PROGRAM_ID = new PublicKey(
  "8nxgCR4TW9K7zh5hb9ntW5dKRFumbdL4BxaaR1oWn86o",
);

/**
 * Alamat default = peluncuran v2 (cutover 17 Nov 2026). Env
 * `NEXT_PUBLIC_MINT`, `NEXT_PUBLIC_POOL`, dan `NEXT_PUBLIC_OWNER_ATA`
 * tetap bisa menimpa tanpa mengubah kode.
 */
const DEFAULT_MINT = "7NbE5QHNRUFYL97ZB2meYrYgLvJrMBJ685AsgNwhbksN";
const DEFAULT_POOL = "GQxQApjSusModYFu5XCaS6CmquVmkxVX4cVeVvssDB2m";
const DEFAULT_OWNER = "86RAJdtpYWeq9vmcpYNzLCVdcFpC5vacwFfdDrXPa24C";
const DEFAULT_OWNER_ATA = "2v9BXJACuRSNv9BZRVxbUjV9UrJgtwjCmmQyCnLHoSGT";

function env(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value.trim() : fallback;
}

/** Mint INRT Devnet (decimals 6, mint authority revoked). */
export const MINT = new PublicKey(env("NEXT_PUBLIC_MINT", DEFAULT_MINT));

/** Override alamat pool kalau state tidak diturunkan dari mint (opsional). */
export const POOL_OVERRIDE: PublicKey | null = env("NEXT_PUBLIC_POOL", DEFAULT_POOL)
  ? new PublicKey(env("NEXT_PUBLIC_POOL", DEFAULT_POOL))
  : null;

/** Label generasi peluncuran yang sedang dipakai UI. */
export const POOL_LABEL = env("NEXT_PUBLIC_POOL_LABEL", "v3");

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
export const OWNER_ADDRESS = env("NEXT_PUBLIC_OWNER", DEFAULT_OWNER);
export const OWNER_ATA = env("NEXT_PUBLIC_OWNER_ATA", DEFAULT_OWNER_ATA);
export const KNOWN_ACCOUNTS: Record<string, string> = {
  // v3 (aktif)
  "FxCrcCCtbqoELnVrjpxmd93j3p3J8UDEMtz4uH999AH1": "POOL VAULT",
  "Gcoc9k9PkV6SFxW1hs2Km4NVqwwnJu5YQd6XpR23Vquf": "MASS RESERVE",
  "2v9BXJACuRSNv9BZRVxbUjV9UrJgtwjCmmQyCnLHoSGT": "OWNER",
  // v2 (legacy)
  "EkEChvJiCKhE46mSCAaLwkMFFef5dhwk6J8QrkK2JdgG": "POOL VAULT",
  "5N5CsAhPqgcpHQqorcv19P5bCquFigA9N7HmrhyjZQCA": "MASS RESERVE",
  "Eno3Lpj4C7fwXHa6X1LQSkLPLVZrigs4xPcr2J9oLj1L": "OWNER",
  // v1 (legacy, tetap dikenali di riwayat lama)
  "HobKvgdzXw4TPmR4XiUg45HVB2jqXuUXnDpuHqZdcPCM": "POOL VAULT",
  "HcmXidwTkTGRFTvJAx4bCj7Ebs5gJZmJVNakvBnpPJff": "POOL VAULT",
  "nCbjXjTZbqj9GyJogUeaweh3K5MKWfYCKRGjatPMroH": "MASS RESERVE",
  "7b4cYnPTtxYsFe9Z4mUHPMZDBy6h3VvwPwaAME9Jq5ts": "OWNER",
  "86RAJdtpYWeq9vmcpYNzLCVdcFpC5vacwFfdDrXPa24C": "OWNER",
};

/** Batas `add_mass`: minimal 1 SOL, maksimal 5% sisa Mass Reserve. */
export const MIN_MASS_SOL = 1_000_000_000n;
export const MASS_CAP_BPS = 500;
export const MASS_RATIO_TOL_BPS = 50;

/** Alokasi Mass Reserve di launch v3 (9.600.000 INRT). */
export const MASS_RESERVE_SUPPLY_RAW = 9_600_000n * TOKEN_UNIT;

/** Rent minimum saat membuat ATA. */
export const RENT_EXEMPT_MIN = 890_880n;

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
