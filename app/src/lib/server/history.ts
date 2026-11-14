import { MINT } from "../constants";
import { derivePdas } from "../pool";
import type { HistoryEvent } from "../types";
import { extractEvents, type RawTx } from "../events";
import { getConnection } from "./connection";

type Cache = { at: number; events: HistoryEvent[] };
let cache: Cache | null = null;
const TTL_MS = 45_000;

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export async function loadHistory(
  limit = 200,
  force = false,
): Promise<HistoryEvent[]> {
  if (!force && cache && Date.now() - cache.at < TTL_MS) return cache.events;

  const connection = getConnection();
  const pdas = derivePdas(MINT);

  const signatures = await connection.getSignaturesForAddress(
    pdas.pool,
    { limit: Math.min(Math.max(limit, 1), 1000) },
    "confirmed",
  );
  const valid = signatures.filter((s) => !s.err);

  const events: HistoryEvent[] = [];
  for (const group of chunk(valid, 25)) {
    const txs = await connection.getTransactions(
      group.map((s) => s.signature),
      { commitment: "confirmed", maxSupportedTransactionVersion: 0 },
    );
    const raws: RawTx[] = [];
    txs.forEach((tx, index) => {
      const sig = group[index];
      if (!tx) return;
      raws.push({
        signature: sig.signature,
        slot: tx.slot ?? sig.slot,
        blockTime: tx.blockTime ?? sig.blockTime,
        meta: tx.meta
          ? { logMessages: tx.meta.logMessages, err: tx.meta.err }
          : null,
      });
    });
    events.push(...extractEvents(raws));
  }

  // Dedup (satu tx bisa memuat lebih dari satu event) lalu urutkan waktu.
  const seen = new Set<string>();
  const unique = events.filter((event) => {
    const key = `${event.sig}:${event.kind}:${event.timestamp}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  unique.sort((a, b) => a.timestamp - b.timestamp);

  cache = { at: Date.now(), events: unique };
  return unique;
}
