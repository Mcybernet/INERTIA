export type PoolSnapshot = {
  mint: string;
  programId: string;
  pool: string;
  authority: string;
  tokenVault: string;
  solVault: string;
  feeVault: string;
  massReserveVault: string;
  vaultAuthority: string;
  reserveAuthority: string;
  tokenReserve: string;
  solReserve: string;
  feeBps: number;
  seeded: boolean;
  launchSlot: string;
  launchTs: number;
  lastMassTs: number;
  totalMassSol: string;
  totalMassToken: string;
  massInterval: number;
  priceScaled: string;
  supply: string;
  vaults: {
    tokenAmount: string;
    massReserveAmount: string;
    feeVaultSol: number;
    solVaultLamports: number;
  };
  fetchedAt: number;
};

export type TradeEvent = {
  kind: "buy" | "sell";
  sig: string;
  wallet: string;
  tokenAmount: string;
  solAmount: string;
  solUser: string;
  fee: string;
  priceAfter: string;
  reserveToken: string;
  reserveSol: string;
  timestamp: number;
  slot?: number;
};

export type SeedEvent = {
  kind: "seed";
  sig: string;
  tokenAmount: string;
  solAmount: string;
  priceAfter: string;
  timestamp: number;
  slot?: number;
};

export type MassEvent = {
  kind: "mass";
  sig: string;
  caller: string;
  tokenAmount: string;
  solAmount: string;
  priceAfter: string;
  reserveToken: string;
  reserveSol: string;
  timestamp: number;
  slot?: number;
};

export type HistoryEvent = TradeEvent | SeedEvent | MassEvent;

export type HolderRow = {
  tokenAccount: string;
  owner: string;
  amount: string;
  pctBps: number;
  label?: string;
};

export type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  /** Jumlah swap di bucket ini (seed/mass tidak dihitung). */
  trades: number;
  /** Jumlah `add_mass` di bucket ini. */
  mass: number;
  /** Bucket tanpa transaksi: diisi flat memakai close sebelumnya. */
  synthetic: boolean;
  /** Bucket yang memuat transaksi seed/launch. */
  launch?: boolean;
};
