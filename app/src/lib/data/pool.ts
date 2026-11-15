import type { PublicKey } from "@solana/web3.js";
import { MINT, PROGRAM_ID, SUPPLY_RAW } from "../constants";
import { decodePoolState, derivePdas, priceOf } from "../pool";
import type { PoolSnapshot } from "../types";
import { getConnection } from "./connection";

type Cache = { at: number; data: PoolSnapshot };
let cache: Cache | null = null;
const TTL_MS = 10_000;

async function tokenAmount(address: PublicKey): Promise<string> {
  const connection = getConnection();
  try {
    const balance = await connection.getTokenAccountBalance(address, "confirmed");
    return balance.value.amount;
  } catch {
    return "0";
  }
}

export async function loadPoolSnapshot(force = false): Promise<PoolSnapshot> {
  if (!force && cache && Date.now() - cache.at < TTL_MS) return cache.data;

  const connection = getConnection();
  const pdas = derivePdas(MINT);
  const info = await connection.getAccountInfo(pdas.pool, "confirmed");
  if (!info) {
    throw new Error(`akun pool tidak ditemukan: ${pdas.pool.toBase58()}`);
  }
  if (!info.owner.equals(PROGRAM_ID)) {
    throw new Error("akun pool bukan milik program inertia_mass");
  }

  const pool = decodePoolState(info.data);

  // Hanya dua panggilan tambahan: saldo Mass Reserve dan fee vault.
  // Supply dan reserve pool dibaca dari state (mint authority sudah dicabut).
  const [vaultMass, feeLamports] = await Promise.all([
    tokenAmount(pdas.massReserveVault),
    connection.getBalance(pdas.feeVault, "confirmed"),
  ]);

  const priceScaled = priceOf(pool.tokenReserve, pool.solReserve);

  const snapshot: PoolSnapshot = {
    mint: MINT.toBase58(),
    programId: PROGRAM_ID.toBase58(),
    pool: pdas.pool.toBase58(),
    authority: pool.authority.toBase58(),
    tokenVault: pdas.tokenVault.toBase58(),
    solVault: pdas.solVault.toBase58(),
    feeVault: pdas.feeVault.toBase58(),
    massReserveVault: pdas.massReserveVault.toBase58(),
    vaultAuthority: pdas.vaultAuthority.toBase58(),
    reserveAuthority: pdas.reserveAuthority.toBase58(),
    tokenReserve: pool.tokenReserve.toString(),
    solReserve: pool.solReserve.toString(),
    feeBps: pool.feeBps,
    seeded: pool.seeded,
    launchSlot: pool.launchSlot.toString(),
    launchTs: pool.launchTs,
    lastMassTs: pool.lastMassTs,
    totalMassSol: pool.totalMassSol.toString(),
    totalMassToken: pool.totalMassToken.toString(),
    massInterval: pool.massInterval,
    priceScaled: priceScaled.toString(),
    supply: SUPPLY_RAW.toString(),
    vaults: {
      tokenAmount: pool.tokenReserve.toString(),
      massReserveAmount: vaultMass,
      feeVaultSol: feeLamports,
      solVaultLamports: Number(pool.solReserve),
    },
    fetchedAt: Date.now(),
  };

  cache = { at: Date.now(), data: snapshot };
  return snapshot;
}
