import { MINT } from "../constants";
import { derivePdas } from "../pool";
import type { HistoryEvent } from "../types";
import { extractEvents, type RawTx } from "../events";
import { getConnection, requestFailed, sleep } from "./connection";

type Cache = { at: number; events: HistoryEvent[]; sigs?: string[] };

/**
 * RPC publik Devnet membatasi `getTransaction` per panggilan/waktu, dan web3
 * mengirim `getTransactions` sebagai batch JSON-RPC (langsung 429). Jadi
 * transaksi diambil satu per satu dengan jeda ±1,1 detik (terukur aman).
 */
const TX_GAP_MS = 1_200;
const MAX_ATTEMPTS = 3;
const TTL_MS = 30_000;
const FRESH_STORAGE_MS = 3 * 60_000;
const STALE_MS = 6 * 60 * 60_000;
const MAX_EVENTS = 600;
const MAX_FETCH = 40;
const STORAGE_KEY = "inrt:history:v3";

let cache: Cache | null = null;
let lastGood: Cache | null = null;
let pending: Promise<HistoryEvent[]> | null = null;

function dedupeSort(events: HistoryEvent[]): HistoryEvent[] {
  const seen = new Set<string>();
  const unique = events.filter((event) => {
    const key = `${event.sig}:${event.kind}:${event.timestamp}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  unique.sort((a, b) => a.timestamp - b.timestamp);
  return unique.slice(-MAX_EVENTS);
}

function readStorage(): Cache | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Cache;
    if (!parsed || !Array.isArray(parsed.events) || typeof parsed.at !== "number") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeStorage(entry: Cache) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
  } catch {
    /* storage penuh/private mode — abaikan */
  }
}

type SigInfo = { signature: string; slot: number; blockTime?: number | null };

async function fetchOne(sig: SigInfo, attempt = 1): Promise<RawTx | null> {
  const connection = getConnection();
  try {
    const tx = await connection.getTransaction(sig.signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });
    if (!tx) return null;
    return {
      signature: sig.signature,
      slot: tx.slot ?? sig.slot,
      blockTime: tx.blockTime ?? sig.blockTime,
      meta: tx.meta
        ? { logMessages: tx.meta.logMessages, err: tx.meta.err }
        : null,
    };
  } catch (error) {
    if (attempt >= MAX_ATTEMPTS || !requestFailed(error)) throw error;
    await sleep(2_500 * attempt + Math.random() * 500);
    return fetchOne(sig, attempt + 1);
  }
}

export function loadHistory(
  limit = 100,
  force = false,
): Promise<HistoryEvent[]> {
  // Dashboard dan tabel holder sama-sama butuh riwayat; satukan supaya RPC
  // tidak dibanjiri dua rangkaian permintaan paralel.
  if (pending) return pending;
  const run = runHistory(limit, force);
  pending = run;
  const clear = () => {
    if (pending === run) pending = null;
  };
  run.then(clear, clear);
  return run;
}

async function runHistory(
  limit = 100,
  force = false,
): Promise<HistoryEvent[]> {
  if (!force && cache && Date.now() - cache.at < TTL_MS) return cache.events;

  if (!lastGood) {
    const stored = readStorage();
    if (stored && Date.now() - stored.at < STALE_MS) lastGood = stored;
  }

  // Muat ulang halaman dalam 3 menit: langsung pakai cache browser tanpa
  // memanggil getTransaction lagi (RPC publik sangat membatasi metode ini).
  if (!force && lastGood && Date.now() - lastGood.at < FRESH_STORAGE_MS) {
    cache = { at: lastGood.at, events: lastGood.events, sigs: lastGood.sigs };
    return lastGood.events;
  }

  // Kunjungan pertama: beri jeda singkat supaya tidak bertabrakan dengan
  // getAccountInfo/getTokenSupply yang dipanggil dashboard bersamaan.
  if (!lastGood) await sleep(1_200);

  const connection = getConnection();
  const pdas = derivePdas(MINT);
  const bounded = Math.min(Math.max(limit, 1), MAX_FETCH);

  let signatures;
  try {
    signatures = await connection.getSignaturesForAddress(
      pdas.pool,
      { limit: bounded },
      "confirmed",
    );
  } catch (error) {
    if (lastGood) return lastGood.events;
    throw error;
  }

  const valid: SigInfo[] = signatures
    .filter((sig) => !sig.err)
    .map((sig) => ({
      signature: sig.signature,
      slot: sig.slot,
      blockTime: sig.blockTime,
    }));

  // Refresh inkremental: signature terbaru datang lebih dulu, berhenti di
  // signature yang sudah tercakup cache. Tanpa ini polling 45 detik akan
  // mengambil ulang seluruh riwayat dan memicu 429.
  const covered = new Set(lastGood?.sigs ?? []);
  let targets = valid;
  if (covered.size > 0) {
    const fresh: SigInfo[] = [];
    for (const sig of valid) {
      if (covered.has(sig.signature)) break;
      fresh.push(sig);
    }
    targets = fresh;
  }

  if (targets.length === 0 && lastGood) {
    const entry: Cache = {
      at: Date.now(),
      events: lastGood.events,
      sigs: [...covered],
    };
    cache = entry;
    lastGood = entry;
    writeStorage(entry);
    return entry.events;
  }

  const collected: HistoryEvent[] = [];
  const fetchedSigs: string[] = [];
  let failures = 0;

  for (let index = 0; index < targets.length; index += 1) {
    const target = targets[index]!;
    try {
      const raw = await fetchOne(target);
      fetchedSigs.push(target.signature);
      if (raw) collected.push(...extractEvents([raw]));
    } catch {
      failures += 1;
    }
    if (index < targets.length - 1) await sleep(TX_GAP_MS);
  }

  if (collected.length === 0 && failures > 0 && lastGood) {
    return lastGood.events;
  }

  // Gabungkan dengan cache lama supaya chart tidak kosong saat RPC membatasi
  // sebagian permintaan.
  const merged = dedupeSort([...(lastGood?.events ?? []), ...collected]);
  const sigs = [...fetchedSigs, ...covered].slice(0, MAX_EVENTS);
  const result: Cache = { at: Date.now(), events: merged, sigs };
  cache = result;
  lastGood = result;
  writeStorage(result);
  return merged;
}
