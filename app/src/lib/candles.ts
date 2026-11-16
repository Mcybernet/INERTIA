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

/** Bar maksimum yang digambar; rentang lebih panjang dipotong ke bagian terbaru. */
const MAX_FILLED_BARS = 5_000;

/**
 * Bucket event menjadi candle. Seed dipakai sebagai titik awal kalau belum ada
 * trade, supaya chart tidak kosong setelah pool dibuat.
 *
 * Bucket yang tidak punya transaksi tetap diisi candle flat (harga terakhir,
 * volume 0) sampai jam sekarang. Tanpa ini chart bolong dan candle hanya
 * muncul di jam yang kebetulan ada swap.
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

  const sorted = [...candles.values()].sort((a, b) => a.time - b.time);
  if (sorted.length === 0) return sorted;

  const start = sorted[0].time;
  const now = Math.floor(Date.now() / 1000 / timeframe) * timeframe;
  const end = Math.max(sorted[sorted.length - 1].time, now);
  // Kalau rentang terlalu panjang, pertahankan hanya bagian terbaru supaya
  // chart tetap kontinu tanpa membuat puluhan ribu bar.
  const from = Math.max(start, end - (MAX_FILLED_BARS - 1) * timeframe);

  let index = 0;
  let prevClose = sorted[0].close;
  for (let i = 0; i < sorted.length; i += 1) {
    if (sorted[i]!.time < from) {
      prevClose = sorted[i]!.close;
    } else {
      index = i;
      break;
    }
  }

  // Isi setiap bucket yang kosong dengan candle flat memakai close terakhir.
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
