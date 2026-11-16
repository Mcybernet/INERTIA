import { MINT } from "../constants";
import { derivePdas } from "../pool";
import type { HistoryEvent, SeedEvent } from "../types";
import { extractEvents, type RawTx } from "../events";
import { getConnection, requestFailed, sleep } from "./connection";

type Cache = { at: number; events: HistoryEvent[]; sigs?: string[] };
type LaunchCache = { at: number; event: SeedEvent | null };

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
// Key per mint: saat cutover ke pool v2, riwayat v1 tidak tercampur.
const STORAGE_KEY = `inrt:history:v4:${MINT.toBase58()}`;
const LAUNCH_KEY = `inrt:launch:v1:${MINT.toBase58()}`;
/** Hasil negatif (tidak ada seed) dicoba ulang setelah 1 jam. */
const LAUNCH_RETRY_MS = 60 * 60_000;

let cache: Cache | null = null;
let lastGood: Cache | null = null;
let pending: Promise<HistoryEvent[]> | null = null;

let launchMemory: SeedEvent | null = null;
let launchResolved = false;
let launchPending: Promise<SeedEvent | null> | null = null;

export type HistoryProgress = { done: number; total: number };
type HistoryListener = (events: HistoryEvent[], progress: HistoryProgress) => void;
const listeners = new Set<HistoryListener>();

/** Dipakai UI untuk menampilkan event yang sudah masuk sebelum fetch selesai. */
export function subscribeHistory(fn: HistoryListener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit(events: HistoryEvent[], progress: HistoryProgress) {
  for (const fn of listeners) fn(events, progress);
}

/** Riwayat yang sudah ada di memori/disk, tanpa memicu permintaan RPC. */
export function getCachedHistory(): HistoryEvent[] {
  if (cache) return withLaunch(cache.events, launchMemory ?? readLaunch());
  if (lastGood) return withLaunch(lastGood.events, launchMemory ?? readLaunch());
  const stored = readStorage();
  if (stored && Date.now() - stored.at < STALE_MS) {
    lastGood = stored;
    return withLaunch(stored.events, launchMemory ?? readLaunch());
  }
  return [];
}

function dedupeSort(events: HistoryEvent[]): HistoryEvent[] {
  const seen = new Set<string>();
  const unique = events.filter((event) => {
    const key = `${event.sig}:${event.kind}:${event.timestamp}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  unique.sort((a, b) => a.timestamp - b.timestamp);
  const kept = unique.slice(-MAX_EVENTS);
  // Seed adalah event paling tua; jangan ikut terpotong saat riwayat panjang.
  const seed = unique.find((event) => event.kind === "seed");
  if (seed && !kept.includes(seed)) kept.unshift(seed);
  return kept;
}

function withLaunch(
  events: HistoryEvent[],
  launch: SeedEvent | null,
): HistoryEvent[] {
  if (!launch) return events;
  if (events.some((event) => event.kind === "seed" && event.sig === launch.sig)) {
    return events;
  }
  return dedupeSort([launch, ...events]);
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

function readLaunchEntry(): LaunchCache | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LAUNCH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LaunchCache;
    if (!parsed || typeof parsed.at !== "number") return null;
    if (parsed.event === null && Date.now() - parsed.at > LAUNCH_RETRY_MS) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function readLaunch(): SeedEvent | null {
  return readLaunchEntry()?.event ?? null;
}

function writeLaunch(event: SeedEvent | null) {
  if (typeof window === "undefined") return;
  try {
    const entry: LaunchCache = { at: Date.now(), event };
    window.localStorage.setItem(LAUNCH_KEY, JSON.stringify(entry));
  } catch {
    /* storage penuh/private mode — abaikan */
  }
}

/**
 * Seed/launch biasanya sudah keluar dari 40 signature terbaru. Ambil sekali
 * dari signature paling tua, lalu simpan di localStorage supaya chart tetap
 * punya titik awal tanpa memanggil RPC setiap polling.
 */
async function fetchLaunch(): Promise<SeedEvent | null> {
  try {
    const connection = getConnection();
    const pdas = derivePdas(MINT);
    let before: string | undefined;
    let oldest: SigInfo[] = [];

    // Paginate sampai halaman paling tua. Pool Devnet jauh di bawah 1.000 tx,
    // jadi normalnya cukup satu permintaan.
    for (let page = 0; page < 4; page += 1) {
      const batch = await connection.getSignaturesForAddress(
        pdas.pool,
        { limit: 1_000, before },
        "confirmed",
      );
      if (batch.length === 0) break;
      const candidates = [...batch]
        .reverse()
        .filter((sig) => !sig.err)
        .slice(0, 8)
        .map((sig) => ({
          signature: sig.signature,
          slot: sig.slot,
          blockTime: sig.blockTime,
        }));
      if (candidates.length > 0) oldest = candidates;
      if (batch.length < 1_000) break;
      before = batch[batch.length - 1]!.signature;
      await sleep(TX_GAP_MS);
    }

    // Transaksi paling tua biasanya `create_pool` (event PoolInitialized),
    // seed menyusul satu-dua transaksi setelahnya. Pindai beberapa tx pertama
    // dan berhenti begitu SeedEvent ditemukan.
    for (const candidate of oldest) {
      const raw = await fetchOne(candidate);
      if (raw) {
        const seed = extractEvents([raw]).find(
          (event): event is SeedEvent => event.kind === "seed",
        );
        if (seed) return seed;
      }
      await sleep(TX_GAP_MS);
    }
    return null;
  } catch {
    return null;
  }
}

async function loadLaunch(): Promise<SeedEvent | null> {
  if (launchResolved) return launchMemory;
  if (launchPending) return launchPending;

  const stored = readLaunchEntry();
  if (stored) {
    launchMemory = stored.event;
    launchResolved = true;
    return stored.event;
  }

  launchPending = fetchLaunch().then((event) => {
    launchMemory = event;
    launchResolved = true;
    writeLaunch(event);
    launchPending = null;
    return event;
  });
  return launchPending;
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
  // Seed diambil paralel dengan signature terbaru; hasilnya di-cache di
  // localStorage sehingga kunjungan berikutnya tidak menambah permintaan RPC.
  const launchPromise = loadLaunch();

  if (!force && cache && Date.now() - cache.at < TTL_MS) {
    return withLaunch(cache.events, await launchPromise);
  }

  if (!lastGood) {
    const stored = readStorage();
    if (stored && Date.now() - stored.at < STALE_MS) lastGood = stored;
  }

  // Muat ulang halaman dalam 3 menit: langsung pakai cache browser tanpa
  // memanggil getTransaction lagi (RPC publik sangat membatasi metode ini).
  if (!force && lastGood && Date.now() - lastGood.at < FRESH_STORAGE_MS) {
    const events = withLaunch(lastGood.events, await launchPromise);
    cache = { at: lastGood.at, events, sigs: lastGood.sigs };
    return events;
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
    if (lastGood) return withLaunch(lastGood.events, await launchPromise);
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

  const launch = await launchPromise;

  if (targets.length === 0 && lastGood) {
    const events = withLaunch(lastGood.events, launch);
    const entry: Cache = {
      at: Date.now(),
      events,
      sigs: [...covered],
    };
    cache = entry;
    lastGood = entry;
    writeStorage(entry);
    return events;
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
    // Tampilkan hasil bertahap: pengguna melihat chart/aktivitas tumbuh,
    // bukan layar kosong selama ±20 detik pada kunjungan pertama.
    if (collected.length > 0) {
      emit(
        withLaunch(
          dedupeSort([...(lastGood?.events ?? []), ...collected]),
          launch,
        ),
        {
          done: index + 1,
          total: targets.length,
        },
      );
    }
    if (index < targets.length - 1) await sleep(TX_GAP_MS);
  }

  if (collected.length === 0 && failures > 0 && lastGood) {
    return withLaunch(lastGood.events, launch);
  }

  // Gabungkan dengan cache lama supaya chart tidak kosong saat RPC membatasi
  // sebagian permintaan.
  const merged = withLaunch(
    dedupeSort([...(lastGood?.events ?? []), ...collected]),
    launch,
  );
  const sigs = [...fetchedSigs, ...covered].slice(0, MAX_EVENTS);
  const result: Cache = { at: Date.now(), events: merged, sigs };
  cache = result;
  lastGood = result;
  writeStorage(result);
  emit(merged, { done: targets.length, total: targets.length });
  return merged;
}
