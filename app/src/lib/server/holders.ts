import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import {
  KNOWN_ACCOUNTS,
  MINT,
  OWNER_ADDRESS,
  OWNER_ATA,
  SUPPLY_RAW,
} from "../constants";
import { derivePdas } from "../pool";
import type { HolderRow } from "../types";
import { getConnection } from "./connection";
import { loadHistory } from "./history";

type Cache = { at: number; rows: HolderRow[] };
let cache: Cache | null = null;
let largestDisabledUntil = 0;
const TTL_MS = 60_000;

type Candidate = {
  address: PublicKey;
  owner: string;
  label?: string;
};

export async function loadHolders(force = false): Promise<HolderRow[]> {
  if (!force && cache && Date.now() - cache.at < TTL_MS) return cache.rows;

  const total = await totalSupply();

  // Jalur utama: RPC yang mendukung getTokenLargestAccounts. Di RPC publik
  // metode ini sering 429, jadi dinonaktifkan 5 menit setelah gagal.
  let rows: HolderRow[] = [];
  if (Date.now() >= largestDisabledUntil) {
    try {
      rows = await topHolders(total);
    } catch {
      largestDisabledUntil = Date.now() + 5 * 60_000;
      rows = [];
    }
  }

  // Fallback Devnet publik (sering 429): vault + owner + wallet dari event.
  if (rows.length === 0) {
    rows = await knownHolders(total);
  }

  rows = rows
    .filter((row) => BigInt(row.amount) > 0n)
    .sort((a, b) => (BigInt(b.amount) > BigInt(a.amount) ? 1 : -1))
    .slice(0, 20);

  cache = { at: Date.now(), rows };
  return rows;
}

async function totalSupply(): Promise<bigint> {
  try {
    const supply = await getConnection().getTokenSupply(MINT, "confirmed");
    return BigInt(supply.value.amount);
  } catch {
    return SUPPLY_RAW;
  }
}

async function topHolders(total: bigint): Promise<HolderRow[]> {
  const connection = getConnection();
  const largest = await connection.getTokenLargestAccounts(MINT, "confirmed");
  if (largest.value.length === 0) return [];

  const infos = await connection.getMultipleAccountsInfo(
    largest.value.map((item) => item.address),
    "confirmed",
  );

  const rows: HolderRow[] = [];
  infos.forEach((info, index) => {
    const fallback = largest.value[index];
    const tokenAccount = fallback?.address.toBase58() ?? "—";
    if (!info || info.data.length < 72) return;

    const owner = new PublicKey(info.data.subarray(32, 64)).toBase58();
    const amount = readAmount(info.data).toString();
    rows.push({
      tokenAccount,
      owner,
      amount,
      pctBps: pctBps(amount, total),
      label: KNOWN_ACCOUNTS[owner] ?? KNOWN_ACCOUNTS[tokenAccount],
    });
  });
  return rows;
}

async function knownHolders(total: bigint): Promise<HolderRow[]> {
  const connection = getConnection();
  const pdas = derivePdas(MINT);

  const candidates: Candidate[] = [
    {
      address: pdas.tokenVault,
      owner: pdas.pool.toBase58(),
      label: "POOL VAULT",
    },
    {
      address: pdas.massReserveVault,
      owner: pdas.reserveAuthority.toBase58(),
      label: "MASS RESERVE",
    },
    {
      address: new PublicKey(OWNER_ATA),
      owner: OWNER_ADDRESS,
      label: "OWNER",
    },
  ];

  // Tambahkan wallet yang pernah swap (dari event on-chain).
  try {
    const events = await loadHistory(100);
    const seen = new Set<string>();
    for (const event of events) {
      if (event.kind !== "buy" && event.kind !== "sell") continue;
      if (seen.has(event.wallet)) continue;
      seen.add(event.wallet);
      candidates.push({
        address: getAssociatedTokenAddressSync(
          MINT,
          new PublicKey(event.wallet),
        ),
        owner: event.wallet,
        label: KNOWN_ACCOUNTS[event.wallet],
      });
    }
  } catch {
    /* event opsional */
  }

  const unique = new Map<string, Candidate>();
  for (const candidate of candidates) {
    unique.set(candidate.address.toBase58(), candidate);
  }
  const list = [...unique.values()];

  try {
    const infos = await connection.getMultipleAccountsInfo(
      list.map((item) => item.address),
      "confirmed",
    );
    return list.map((candidate, index) => {
      const info = infos[index];
      const amount =
        info && info.data.length >= 72 ? readAmount(info.data).toString() : "0";
      return {
        tokenAccount: candidate.address.toBase58(),
        owner: candidate.owner,
        amount,
        pctBps: pctBps(amount, total),
        label: candidate.label,
      };
    });
  } catch {
    // Terakhir: satu per satu lewat metode yang berbeda.
    const rows: HolderRow[] = [];
    for (const candidate of list) {
      let amount = "0";
      try {
        const balance = await connection.getTokenAccountBalance(
          candidate.address,
          "confirmed",
        );
        amount = balance.value.amount;
      } catch {
        /* lewati */
      }
      rows.push({
        tokenAccount: candidate.address.toBase58(),
        owner: candidate.owner,
        amount,
        pctBps: pctBps(amount, total),
        label: candidate.label,
      });
    }
    return rows;
  }
}

function readAmount(data: Uint8Array): bigint {
  const view = new DataView(data.buffer, data.byteOffset + 64, 8);
  return view.getBigUint64(0, true);
}

function pctBps(amount: string, total: bigint): number {
  if (total === 0n) return 0;
  return Number((BigInt(amount) * 10_000n) / total);
}
