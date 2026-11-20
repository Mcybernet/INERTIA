import { priceToSol } from "./price";
import type { Candle, HistoryEvent, TradeEvent } from "./types";

/**
 * Chart memakai WIB (Asia/Jakarta), bukan UTC bawaan lightweight-charts.
 * Bucket digeser +7 jam supaya 1J mulai 00:00 WIB, 4J jatuh di 00/04/08/12/
 * 16/20 WIB, dan 1H mulai tengah malam WIB.
 */
const WIB_OFFSET_SECONDS = 7 * 3600;

/** Senin 00:00 WIB pertama pada epoch (1970-01-05 00:00 WIB). */
const WEEK_ANCHOR = 4 * 86_400 - WIB_OFFSET_SECONDS;

export const TIMEFRAMES = [
  { label: "1M", seconds: 60, axis: "time", minSpan: 0 },
  { label: "5M", seconds: 300, axis: "time", minSpan: 0 },
  { label: "15M", seconds: 900, axis: "time", minSpan: 0 },
  { label: "1J", seconds: 3600, axis: "time", minSpan: 0 },
  { label: "4J", seconds: 14_400, axis: "time", minSpan: 0 },
  { label: "1H", seconds: 86_400, axis: "day", minSpan: 0 },
  { label: "1Mgg", seconds: 604_800, axis: "week", minSpan: 0 },
] as const;

export type Timeframe = (typeof TIMEFRAMES)[number];
export type TimeframeSeconds = Timeframe["seconds"];

/** Default chart: 4J, supaya candle launch masih masuk di layar. */
export const DEFAULT_TIMEFRAME = 14_400;

/** Batas bar per timeframe. 1.500 × 4J = ±250 hari. */
export const MAX_FILLED_BARS = 1_500;

export function tradeVolumeSol(event: TradeEvent): number {
  return Number(BigInt(event.solUser)) / 1e9;
}

/** Awal bucket untuk sebuah timestamp, sudah dialign ke WIB. */
export function bucketStart(timestamp: number, timeframe: number): number {
  if (timeframe >= 604_800) {
    // 1Mgg mulai Senin 00:00 WIB.
    return (
      Math.floor((timestamp - WEEK_ANCHOR) / timeframe) * timeframe +
      WEEK_ANCHOR
    );
  }
  return (
    Math.floor((timestamp + WIB_OFFSET_SECONDS) / timeframe) * timeframe -
    WIB_OFFSET_SECONDS
  );
}

/** Timestamp event paling awal — dipakai sebagai penanda launch. */
export function launchTimestamp(events: HistoryEvent[]): number | null {
  let min = Infinity;
  for (const event of events) {
    if (event.timestamp > 0 && event.timestamp < min) min = event.timestamp;
  }
  return Number.isFinite(min) ? min : null;
}

function eventPrice(event: HistoryEvent): number {
  return priceToSol(event.priceAfter);
}

function eventVolume(event: HistoryEvent): number {
  return event.kind === "buy" || event.kind === "sell"
    ? tradeVolumeSol(event)
    : 0;
}

/**
 * Bucket event menjadi candle OHLC.
 *
 * - `open` selalu close candle sebelumnya, jadi tidak ada gap lompatan saat
 *   trade pertama di bucket baru lebih tinggi/rendah.
 * - high/low memasukkan `open` supaya OHLC tetap valid.
 * - seed dan `add_mass` ikut sebagai titik harga (volume 0).
 * - bucket kosong diisi flat sampai bucket sekarang, maksimal
 *   `MAX_FILLED_BARS` bar terbaru.
 */
export function buildCandles(
  events: HistoryEvent[],
  timeframe: number,
): Candle[] {
  const ordered = events
    .filter((event) => event.timestamp > 0)
    .sort(
      (a, b) =>
        a.timestamp - b.timestamp ||
        (a.slot ?? 0) - (b.slot ?? 0) ||
        a.sig.localeCompare(b.sig),
    );

  const candles = new Map<number, Candle>();
  let lastClose: number | null = null;

  for (const event of ordered) {
    const price = eventPrice(event);
    const bucket = bucketStart(event.timestamp, timeframe);
    const isTrade = event.kind === "buy" || event.kind === "sell";
    const volume = eventVolume(event);
    const existing = candles.get(bucket);

    if (!existing) {
      const open = lastClose ?? price;
      const candle: Candle = {
        time: bucket,
        open,
        high: Math.max(open, price),
        low: Math.min(open, price),
        close: price,
        volume,
        trades: isTrade ? 1 : 0,
        mass: event.kind === "mass" ? 1 : 0,
        synthetic: false,
      };
      if (event.kind === "seed") candle.launch = true;
      candles.set(bucket, candle);
    } else {
      existing.high = Math.max(existing.high, price);
      existing.low = Math.min(existing.low, price);
      existing.close = price;
      existing.volume += volume;
      if (isTrade) existing.trades += 1;
      if (event.kind === "mass") existing.mass += 1;
      if (event.kind === "seed") existing.launch = true;
    }

    lastClose = price;
  }

  const sorted = [...candles.values()].sort((a, b) => a.time - b.time);
  if (sorted.length === 0) return sorted;

  const start = sorted[0]!.time;
  const nowBucket = bucketStart(Math.floor(Date.now() / 1000), timeframe);
  const end = Math.max(sorted[sorted.length - 1]!.time, nowBucket);
  const from = Math.max(start, end - (MAX_FILLED_BARS - 1) * timeframe);

  let index = 0;
  let prevClose = sorted[0]!.open;
  while (index < sorted.length && sorted[index]!.time < from) {
    prevClose = sorted[index]!.close;
    index += 1;
  }

  // Isi bucket tanpa trade dengan candle flat supaya chart tetap kontinu.
  const filled: Candle[] = [];
  for (let time = from; time <= end; time += timeframe) {
    const existing = sorted[index];
    if (existing && existing.time === time) {
      filled.push(existing);
      prevClose = existing.close;
      index += 1;
      continue;
    }
    filled.push({
      time,
      open: prevClose,
      high: prevClose,
      low: prevClose,
      close: prevClose,
      volume: 0,
      trades: 0,
      mass: 0,
      synthetic: true,
    });
  }
  return filled;
}

export function sumVolume(events: HistoryEvent[]): number {
  return events.reduce((acc, e) => {
    if (e.kind === "buy" || e.kind === "sell") {
      return acc + Number(BigInt(e.solUser)) / 1e9;
    }
    return acc;
  }, 0);
}
