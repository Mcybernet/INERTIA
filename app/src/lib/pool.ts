import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import {
  MINT,
  PRICE_SCALE,
  PROGRAM_ID,
  SEEDS,
} from "./constants";

export type Pdas = {
  pool: PublicKey;
  vaultAuthority: PublicKey;
  reserveAuthority: PublicKey;
  tokenVault: PublicKey;
  massReserveVault: PublicKey;
  solVault: PublicKey;
  feeVault: PublicKey;
};

function seedBytes(seed: string): Uint8Array {
  return new TextEncoder().encode(seed);
}

function pda(seed: string, pool: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [seedBytes(seed), pool.toBytes()],
    PROGRAM_ID,
  )[0];
}

/** Turunan alamat yang sama dengan CLI `inertia-devnet`. */
export function derivePdas(mint: PublicKey = MINT): Pdas {
  const pool = PublicKey.findProgramAddressSync(
    [seedBytes(SEEDS.pool), mint.toBytes()],
    PROGRAM_ID,
  )[0];
  const vaultAuthority = pda(SEEDS.vaultAuth, pool);
  const reserveAuthority = pda(SEEDS.reserveAuth, pool);
  return {
    pool,
    vaultAuthority,
    reserveAuthority,
    tokenVault: getAssociatedTokenAddressSync(mint, vaultAuthority, true),
    massReserveVault: getAssociatedTokenAddressSync(
      mint,
      reserveAuthority,
      true,
    ),
    solVault: pda(SEEDS.solVault, pool),
    feeVault: pda(SEEDS.feeVault, pool),
  };
}

/** Decode payload `PoolState` (8 byte discriminator + 264 byte). */
export function decodePoolState(data: Uint8Array): {
  authority: PublicKey;
  mint: PublicKey;
  tokenVault: PublicKey;
  solVault: PublicKey;
  feeVault: PublicKey;
  massReserveVault: PublicKey;
  tokenReserve: bigint;
  solReserve: bigint;
  feeBps: number;
  seeded: boolean;
  bump: number;
  vaultAuthBump: number;
  reserveAuthBump: number;
  launchSlot: bigint;
  launchTs: number;
  lastMassTs: number;
  totalMassSol: bigint;
  totalMassToken: bigint;
  massInterval: number;
} {
  if (data.length < 8 + 264) {
    throw new Error(`data pool terlalu pendek: ${data.length} byte`);
  }
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const pk = (offset: number) => new PublicKey(data.slice(offset, offset + 32));
  const u64 = (offset: number) => view.getBigUint64(offset, true);
  const i64 = (offset: number) => Number(view.getBigInt64(offset, true));

  return {
    authority: pk(8),
    mint: pk(40),
    tokenVault: pk(72),
    solVault: pk(104),
    feeVault: pk(136),
    massReserveVault: pk(168),
    tokenReserve: u64(200),
    solReserve: u64(208),
    feeBps: view.getUint16(216, true),
    seeded: view.getUint8(218) === 1,
    bump: view.getUint8(219),
    vaultAuthBump: view.getUint8(220),
    reserveAuthBump: view.getUint8(221),
    launchSlot: u64(224),
    launchTs: i64(232),
    lastMassTs: i64(240),
    totalMassSol: u64(248),
    totalMassToken: u64(256),
    massInterval: i64(264),
  };
}

export function priceOf(tokenReserve: bigint, solReserve: bigint): bigint {
  if (tokenReserve === 0n || solReserve === 0n) return 0n;
  return (solReserve * PRICE_SCALE) / (tokenReserve * 1000n);
}
