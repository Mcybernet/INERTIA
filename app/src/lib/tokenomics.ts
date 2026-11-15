import { SUPPLY_RAW } from "./constants";

export type Allocation = {
  name: string;
  raw: bigint;
  pct: string;
  note: string;
  locked: boolean;
};

/** Alokasi final 50.000.000 INRT (TOKENOMICS_INERTIA.md v1.1). */
export const ALLOCATIONS: Allocation[] = [
  {
    name: "Pool — The Mass",
    raw: 9_600_000n * 1_000_000n,
    pct: "19,2%",
    note: "Terkunci permanen di pool, tanpa instruksi penarikan.",
    locked: true,
  },
  {
    name: "Mass Reserve",
    raw: 10_000_000n * 1_000_000n,
    pct: "20,0%",
    note: "Hanya bisa masuk pool lewat add_mass.",
    locked: true,
  },
  {
    name: "Treasury",
    raw: 9_400_000n * 1_000_000n,
    pct: "18,8%",
    note: "Multisig, tunduk pada gerbang Mass II (pool 100 SOL).",
    locked: false,
  },
  {
    name: "Tim",
    raw: 8_000_000n * 1_000_000n,
    pct: "16,0%",
    note: "Vesting, cap 1.500.000 token per bulan.",
    locked: false,
  },
  {
    name: "Komunitas / airdrop",
    raw: 8_000_000n * 1_000_000n,
    pct: "16,0%",
    note: "Bertahap, berbasis milestone.",
    locked: false,
  },
  {
    name: "Ekosistem / partnership",
    raw: 5_000_000n * 1_000_000n,
    pct: "10,0%",
    note: "Multisig.",
    locked: false,
  },
];

export const TOTAL_SUPPLY_RAW = SUPPLY_RAW;

export const LAUNCH = {
  priceSol: "0,000005",
  poolToken: "9.600.000",
  poolSol: "4,8",
  fdvSol: "250",
  marketCapSol: "48",
  feeBps: 30,
} as const;

export type TierRate = {
  name: string;
  range: string;
  fee: string;
  active: boolean;
};

/**
 * Diskon tier adalah rencana utility holder. Program v1 memakai fee
 * immutable 30 bps, jadi kolom fee ditandai belum aktif di UI.
 */
export const TIER_RATES: TierRate[] = [
  { name: "REST", range: "< 0,1%", fee: "0,30%", active: true },
  { name: "PULL", range: "0,1 – 0,5%", fee: "0,30%", active: true },
  { name: "MASS", range: "0,5 – 1,5%", fee: "0,28%", active: false },
  { name: "MOMENTUM", range: "1,5 – 4%", fee: "0,25%", active: false },
  { name: "INERTIA", range: "> 4%", fee: "0,20%", active: false },
];

export const VESTING = [
  { time: "Launch (M0)", circulating: "9.600.000", pct: "19,2%" },
  { time: "M6", circulating: "±16.100.000", pct: "32,2%" },
  { time: "M12", circulating: "±26.950.000", pct: "53,9%" },
  { time: "M24", circulating: "±35.650.000", pct: "71,3%" },
  { time: "M30", circulating: "40.000.000", pct: "80,0%" },
];
