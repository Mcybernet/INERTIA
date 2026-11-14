"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ColorType,
  CrosshairMode,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { buildCandles, TIMEFRAMES } from "@/lib/candles";
import { fmtPct, fmtPrice, fmtSolNumber } from "@/lib/format";
import type { HistoryEvent } from "@/lib/types";

const UP = "#4FA57A";
const DOWN = "#C76A6A";

export default function PriceChart({
  events,
  loading,
}: {
  events: HistoryEvent[];
  loading: boolean;
}) {
  const [timeframe, setTimeframe] = useState<number>(300);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  const candles = useMemo(
    () => buildCandles(events, timeframe),
    [events, timeframe],
  );

  const last = candles.length > 0 ? candles[candles.length - 1] : null;
  const first = candles.length > 0 ? candles[0] : null;
  const change =
    last && first && first.open > 0
      ? ((last.close - first.open) / first.open) * 100
      : 0;
  const volume = candles.reduce((acc, c) => acc + c.volume, 0);
  const up = change >= 0;

  useEffect(() => {
    if (!wrapRef.current) return;
    const chart = createChart(wrapRef.current, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "#0E0E11" },
        textColor: "#8A8A96",
        fontFamily:
          'JetBrains Mono, IBM Plex Mono, ui-monospace, Menlo, monospace',
        fontSize: 10,
      },
      grid: {
        vertLines: { color: "#1A1A20" },
        horzLines: { color: "#1A1A20" },
      },
      rightPriceScale: {
        borderColor: "#25252D",
        scaleMargins: { top: 0.08, bottom: 0.24 },
      },
      timeScale: {
        borderColor: "#25252D",
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 2,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "#3A3A44", labelBackgroundColor: "#E0A64B" },
        horzLine: { color: "#3A3A44", labelBackgroundColor: "#E0A64B" },
      },
      localization: {
        locale: "id-ID",
        priceFormatter: (value: number) =>
          value.toLocaleString("id-ID", {
            minimumFractionDigits: 9,
            maximumFractionDigits: 9,
          }),
      },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: UP,
      downColor: DOWN,
      wickUpColor: UP,
      wickDownColor: DOWN,
      borderVisible: false,
      priceFormat: { type: "price", precision: 9, minMove: 0.000000001 },
    });

    const volumeSeries = chart.addHistogramSeries({
      priceScaleId: "",
      priceFormat: { type: "volume" },
      lastValueVisible: false,
      priceLineVisible: false,
    });
    chart.priceScale("").applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 },
    });

    chartRef.current = chart;
    candleRef.current = candleSeries;
    volumeRef.current = volumeSeries;

    return () => {
      chart.remove();
      chartRef.current = null;
      candleRef.current = null;
      volumeRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!candleRef.current || !volumeRef.current || !chartRef.current) return;
    candleRef.current.setData(
      candles.map((c) => ({
        time: c.time as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })),
    );
    volumeRef.current.setData(
      candles.map((c) => ({
        time: c.time as UTCTimestamp,
        value: c.volume,
        color: c.close >= c.open ? "rgba(79,165,122,0.35)" : "rgba(199,106,106,0.35)",
      })),
    );
    chartRef.current.timeScale().fitContent();
  }, [candles]);

  return (
    <section className="panel">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line px-4 py-3">
        <div>
          <div className="label">Harga INRT / SOL</div>
          <div className="mt-1.5 flex flex-wrap items-baseline gap-3">
            <span className="mono text-[22px] leading-none text-fg">
              {last ? `${fmtPrice(String(Math.round(last.close * 1e15)))} SOL` : "—"}
            </span>
            <span
              className={`mono text-[11px] ${up ? "text-up" : "text-down"}`}
            >
              {change >= 0 ? "+" : ""}
              {fmtPct(Math.round(Math.abs(change) * 100))}
            </span>
            <span className="text-[10px] text-dim">
              dalam {TIMEFRAMES.find((t) => t.seconds === timeframe)?.label}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-px bg-line p-px">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.seconds}
                type="button"
                onClick={() => setTimeframe(tf.seconds)}
                className={`px-2.5 py-1 text-[10px] tracking-label transition-colors ${
                  timeframe === tf.seconds
                    ? "bg-gold/10 text-gold"
                    : "bg-ink-1 text-muted hover:text-fg"
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
          <div className="mono text-[10px] text-dim">
            VOL {fmtSolNumber(volume, true)} SOL
          </div>
        </div>
      </header>

      <div className="relative">
        <div ref={wrapRef} className="h-[300px] w-full md:h-[360px]" />
        {!loading && candles.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-label text-dim">
            Belum ada candle — swap pertama akan muncul di sini
          </div>
        ) : null}
        {loading && candles.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-label text-dim">
            Memuat candle…
          </div>
        ) : null}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-2 text-[9px] uppercase tracking-label text-dim">
        <span>Sumber: log SwapEvent dari pool · {candles.length} candle</span>
        <span>Fee 0,30% tidak masuk reserve · k naik tipis</span>
      </footer>
    </section>
  );
}
