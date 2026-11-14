import { priceToSol } from "./price";
import type { Candle, HistoryEvent, TradeEvent } from "./types";

export const TIMEFRAMES = [
  { label: "1M", seconds: 60 },
  { label: "5M", seconds: 300 },
  { label: "15M", seconds: 900 },
  { label: "1J", seconds: 3600 },
] as const;

export type TimeframeSeconds = (typeof TIMEFRAMES)[number]["seconds"];

export function tradeVolumeSol(event: TradeEvent): number {
  return Number(BigInt(event.solUser)) / 1e9;
}

/**
 * Bucket event menjadi candle. Seed dipakai sebagai titik awal kalau belum ada
 * trade, supaya chart tidak kosong setelah pool dibuat.
 */
export function buildCandles(
  events: HistoryEvent[],
  timeframe: number,
): Candle[] {
  const trades = events.filter(
    (e): e is TradeEvent => e.kind === "buy" || e.kind === "sell",
  );
  const candles = new Map<number, Candle>();

  const push = (time: number, price: number, volume: number) => {
    const bucket = Math.floor(time / timeframe) * timeframe;
    const existing = candles.get(bucket);
    if (!existing) {
      candles.set(bucket, {
        time: bucket,
        open: price,
        high: price,
        low: price,
        close: price,
        volume,
      });
      return;
    }
    existing.high = Math.max(existing.high, price);
    existing.low = Math.min(existing.low, price);
    existing.close = price;
    existing.volume += volume;
  };

  // Titik awal selalu dari seed supaya chart punya kontinuitas sejak launch.
  const seed = events.find((e) => e.kind === "seed");
  if (seed) {
    push(seed.timestamp, priceToSol(seed.priceAfter), 0);
  }

  for (const trade of trades) {
    push(
      trade.timestamp,
      priceToSol(trade.priceAfter),
      tradeVolumeSol(trade),
    );
  }
  return [...candles.values()].sort((a, b) => a.time - b.time);
}

export function sumVolume(events: HistoryEvent[]): number {
  return events.reduce((acc, e) => {
    if (e.kind === "buy" || e.kind === "sell") {
      return acc + Number(BigInt(e.solUser)) / 1e9;
    }
    return acc;
  }, 0);
}
