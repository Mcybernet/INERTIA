import type { HistoryEvent, MassEvent, SeedEvent, TradeEvent } from "./types";

const SWAP_DISC = [64, 198, 205, 232, 38, 8, 113, 226];
const SEED_DISC = [1, 131, 28, 102, 173, 7, 248, 218];
const MASS_DISC = [148, 205, 244, 128, 72, 162, 134, 191];

function startsWith(data: Uint8Array, disc: number[]): boolean {
  if (data.length < 8) return false;
  for (let i = 0; i < 8; i += 1) {
    if (data[i] !== disc[i]) return false;
  }
  return true;
}

function readU64(data: Uint8Array, offset: number): bigint {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  return view.getBigUint64(offset, true);
}

function readI64(data: Uint8Array, offset: number): number {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  return Number(view.getBigInt64(offset, true));
}

function readAddress(data: Uint8Array, offset: number): string {
  // Base58 tanpa Buffer agar aman di edge/browser.
  const bytes = data.slice(offset, offset + 32);
  return base58Encode(bytes);
}

const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function base58Encode(bytes: Uint8Array): string {
  if (bytes.length === 0) return "";
  let zeros = 0;
  while (zeros < bytes.length && bytes[zeros] === 0) zeros += 1;
  const digits: number[] = [];
  for (let i = zeros; i < bytes.length; i += 1) {
    let carry = bytes[i];
    for (let j = 0; j < digits.length; j += 1) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  let out = "1".repeat(zeros);
  for (let i = digits.length - 1; i >= 0; i -= 1) out += ALPHABET[digits[i]];
  return out;
}

type Parsed =
  | (Omit<TradeEvent, "sig" | "slot"> & { seq: number })
  | (Omit<SeedEvent, "sig" | "slot"> & { seq: number })
  | (Omit<MassEvent, "sig" | "slot"> & { seq: number });

/** Parse satu baris log `Program data: <base64>` milik program kita. */
export function parseLogData(line: string): Parsed | null {
  const prefix = "Program data: ";
  if (!line.startsWith(prefix)) return null;
  let raw: Uint8Array;
  try {
    raw = Uint8Array.from(atob(line.slice(prefix.length)), (c) =>
      c.charCodeAt(0),
    );
  } catch {
    return null;
  }

  if (startsWith(raw, SWAP_DISC) && raw.length >= 137) {
    const direction = raw[72];
    return {
      kind: direction === 0 ? "buy" : "sell",
      wallet: readAddress(raw, 40),
      tokenAmount: readU64(raw, 73).toString(),
      solAmount: readU64(raw, 81).toString(),
      solUser: readU64(raw, 89).toString(),
      fee: readU64(raw, 97).toString(),
      priceAfter: readU64(raw, 105).toString(),
      reserveToken: readU64(raw, 113).toString(),
      reserveSol: readU64(raw, 121).toString(),
      timestamp: readI64(raw, 129),
      seq: 2,
    };
  }

  if (startsWith(raw, SEED_DISC) && raw.length >= 80) {
    return {
      kind: "seed",
      tokenAmount: readU64(raw, 40).toString(),
      solAmount: readU64(raw, 48).toString(),
      priceAfter: readU64(raw, 56).toString(),
      timestamp: readI64(raw, 72),
      seq: 0,
    };
  }

  if (startsWith(raw, MASS_DISC) && raw.length >= 136) {
    return {
      kind: "mass",
      caller: readAddress(raw, 40),
      tokenAmount: readU64(raw, 80).toString(),
      solAmount: readU64(raw, 72).toString(),
      priceAfter: readU64(raw, 88).toString(),
      reserveToken: readU64(raw, 96).toString(),
      reserveSol: readU64(raw, 104).toString(),
      timestamp: readI64(raw, 128),
      seq: 1,
    };
  }

  return null;
}

export type RawTx = {
  signature: string;
  slot: number;
  blockTime?: number | null;
  meta?: { logMessages?: string[] | null; err?: unknown } | null;
};

/** Ekstrak semua event program dari daftar transaksi. */
export function extractEvents(txs: RawTx[]): HistoryEvent[] {
  const out: HistoryEvent[] = [];
  for (const tx of txs) {
    if (!tx.meta || tx.meta.err) continue;
    const logs = tx.meta.logMessages ?? [];
    const found: Parsed[] = [];
    for (const line of logs) {
      const parsed = parseLogData(line);
      if (parsed) found.push(parsed);
    }
    if (found.length === 0) continue;
    found.sort((a, b) => a.seq - b.seq);
    for (const parsed of found) {
      const { seq: _seq, ...event } = parsed;
      out.push({
        ...event,
        sig: tx.signature,
        slot: tx.slot,
        timestamp: event.timestamp || tx.blockTime || 0,
      } as HistoryEvent);
    }
  }
  return out;
}

export const DISCRIMINATORS = { SWAP_DISC, SEED_DISC, MASS_DISC };
