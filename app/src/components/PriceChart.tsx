"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ColorType,
  CrosshairMode,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type MouseEventParams,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";
import {
  bucketStart,
  buildCandles,
  DEFAULT_TIMEFRAME,
  launchTimestamp,
  MAX_FILLED_BARS,
  TIMEFRAMES,
  type Timeframe,
} from "@/lib/candles";
import {
  EMPTY,
  fmtSignedPct,
  fmtPrice,
  fmtSolNumber,
  fmtWibClock,
  fmtWibDateTime,
  fmtWibDay,
  getFormatLocale,
} from "@/lib/format";
import type { Candle, HistoryEvent } from "@/lib/types";
import { useI18n } from "./LanguageProvider";

const UP = "#4FA57A";
const DOWN = "#C76A6A";

type IdleWindow = Window & {
  requestIdleCallback?: (
    callback: () => void,
    options?: { timeout?: number },
  ) => number;
  cancelIdleCallback?: (handle: number) => void;
};

function candlePrice(value: number): string {
  return fmtPrice(String(Math.round(value * 1e15)));
}

function timeframeReady(timeframe: Timeframe, spanSeconds: number): boolean {
  return timeframe.minSpan === 0 || spanSeconds >= timeframe.minSpan;
}

function timeframeHint(
  timeframe: Timeframe,
  spanSeconds: number,
  t: (text: string, vars?: Record<string, string | number>) => string,
): string {
  const need = Math.round(timeframe.minSpan / 86_400);
  const have = (Math.max(0, spanSeconds) / 86_400).toLocaleString(
    getFormatLocale(),
    { maximumFractionDigits: 1 },
  );
  return t(
    "{label} · butuh riwayat {need} hari (sekarang {have} hari)",
    { label: t(timeframe.label), need, have },
  );
}

function OhlcItem({
  label,
  value,
  tone = "text-fg",
}: {
  label: string;
  value: number;
  tone?: string;
}) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="text-[9px] uppercase tracking-label text-dim">
        {label}
      </span>
      <span className={`mono text-[10px] ${tone}`}>{candlePrice(value)}</span>
    </span>
  );
}

export default function PriceChart({
  events,
  loading,
  progress,
  heightClass = "h-[300px] md:h-[360px]",
}: {
  events: HistoryEvent[];
  loading: boolean;
  progress?: { done: number; total: number } | null;
  heightClass?: string;
}) {
  const { lang, t } = useI18n();
  const [timeframe, setTimeframe] = useState<number>(DEFAULT_TIMEFRAME);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [candlesTf, setCandlesTf] = useState<number>(DEFAULT_TIMEFRAME);
  const [pending, setPending] = useState<number | null>(null);
  const [slowPending, setSlowPending] = useState(false);
  const [hover, setHover] = useState<Candle | null>(null);
  const [scrollNonce, setScrollNonce] = useState(0);

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const cacheRef = useRef<Map<number, { token: string; candles: Candle[] }>>(
    new Map(),
  );
  const guardRef = useRef(0);
  const scrollStartTfRef = useRef<number | null>(null);
  const lastTfRef = useRef<number | null>(null);
  const userMovedRef = useRef(false);
  const timeframeRef = useRef(timeframe);
  timeframeRef.current = timeframe;

  const eventsToken = useMemo(() => {
    const last = events[events.length - 1];
    return `${events.length}:${last?.timestamp ?? 0}:${last?.sig ?? ""}`;
  }, [events]);

  const launchTs = useMemo(() => launchTimestamp(events), [events]);
  const latestTs = useMemo(() => {
    let max = 0;
    for (const event of events) {
      if (event.timestamp > max) max = event.timestamp;
    }
    return max;
  }, [events]);
  const spanSeconds =
    launchTs && latestTs ? Math.max(0, latestTs - launchTs) : 0;

  const compute = useCallback(
    (tf: number): Candle[] => {
      const cached = cacheRef.current.get(tf);
      if (cached && cached.token === eventsToken) return cached.candles;
      const built = buildCandles(events, tf);
      cacheRef.current.set(tf, { token: eventsToken, candles: built });
      return built;
    },
    [events, eventsToken],
  );

  // Bangun candle di luar render urgent, lalu tampilkan. Data lama tetap
  // terlihat selama timeframe baru disiapkan (tidak ada layar kosong).
  useEffect(() => {
    const cached = cacheRef.current.get(timeframe);
    if (cached && cached.token === eventsToken) {
      setCandles(cached.candles);
      setCandlesTf(timeframe);
      setPending(null);
      return;
    }

    setPending(timeframe);
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      const built = compute(timeframe);
      if (cancelled) return;
      setCandles(built);
      setCandlesTf(timeframe);
      setPending(null);
    }, 40);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [compute, eventsToken, timeframe]);

  // Loading hanya muncul kalau prosesnya benar-benar lama, supaya switch yang
  // cepat tidak berkedip.
  useEffect(() => {
    if (pending === null) {
      setSlowPending(false);
      return;
    }
    const timer = window.setTimeout(() => setSlowPending(true), 180);
    return () => window.clearTimeout(timer);
  }, [pending]);

  // Precompute timeframe lain saat browser idle: switch berikutnya instan.
  useEffect(() => {
    const targets = TIMEFRAMES.filter((tf) =>
      timeframeReady(tf, spanSeconds),
    )
      .map((tf) => tf.seconds)
      .filter((seconds) => seconds !== timeframe);
    if (targets.length === 0) return;

    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      for (const tf of targets) {
        const cached = cacheRef.current.get(tf);
        if (!cached || cached.token !== eventsToken) compute(tf);
      }
    };

    const win = window as IdleWindow;
    if (typeof win.requestIdleCallback === "function") {
      const handle = win.requestIdleCallback(run, { timeout: 2_500 });
      return () => {
        cancelled = true;
        win.cancelIdleCallback?.(handle);
      };
    }
    const timer = window.setTimeout(run, 900);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [compute, eventsToken, spanSeconds, timeframe]);

  const last = candles.length > 0 ? candles[candles.length - 1]! : null;
  const shown = hover ?? last;
  // Header memakai perubahan candle berjalan (close vs open) pada timeframe
  // aktif, sama persis dengan Δ di legend.
  const change =
    last && last.open > 0 ? ((last.close - last.open) / last.open) * 100 : 0;
  const changeTone =
    change > 0 ? "text-up" : change < 0 ? "text-down" : "text-dim";
  const shownChange =
    shown && shown.open > 0
      ? ((shown.close - shown.open) / shown.open) * 100
      : 0;
  const shownTone =
    shownChange > 0
      ? "text-up"
      : shownChange < 0
        ? "text-down"
        : "text-dim";
  const volume = candles.reduce((acc, candle) => acc + candle.volume, 0);

  const candleByTime = useMemo(() => {
    const map = new Map<number, Candle>();
    for (const candle of candles) map.set(candle.time, candle);
    return map;
  }, [candles]);

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
        tickMarkFormatter: (time: Time) => {
          const ts = Number(time);
          if (!Number.isFinite(ts)) return null;
          const tf = timeframeRef.current;
          if (tf >= 86_400) return fmtWibDay(ts);
          if (tf >= 14_400) return `${fmtWibDay(ts)} ${fmtWibClock(ts)}`;
          return fmtWibClock(ts);
        },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "#3A3A44", labelBackgroundColor: "#E0A64B" },
        horzLine: { color: "#3A3A44", labelBackgroundColor: "#E0A64B" },
      },
      localization: {
        locale: lang === "en" ? "en-US" : "id-ID",
        timeFormatter: (time: Time) => {
          const ts = Number(time);
          return Number.isFinite(ts) ? fmtWibDateTime(ts) : "";
        },
        priceFormatter: (value: number) =>
          value.toLocaleString(getFormatLocale(), {
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

  // Locale chart (angka & tanggal) mengikuti bahasa aktif.
  useEffect(() => {
    chartRef.current?.applyOptions({
      localization: { locale: lang === "en" ? "en-US" : "id-ID" },
    });
  }, [lang]);

  // Crosshair: legend OHLC mengikuti candle yang ditunjuk, lalu kembali ke
  // candle terakhir saat pointer keluar.
  useEffect(() => {
    const chart = chartRef.current;
    const series = candleRef.current;
    if (!chart || !series) return;

    const handler = (param: MouseEventParams) => {
      if (typeof param.time !== "number" || !param.point) {
        setHover(null);
        return;
      }
      const data = param.seriesData.get(series);
      if (!data || !("open" in data)) {
        setHover(null);
        return;
      }
      setHover(candleByTime.get(param.time) ?? null);
    };

    chart.subscribeCrosshairMove(handler);
    return () => chart.unsubscribeCrosshairMove(handler);
  }, [candleByTime]);

  // Setelah pengguna menggeser/zoom chart, jangan paksa fokus ke tengah lagi
  // sampai halaman di-refresh atau timeframe diganti.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const mark = () => {
      userMovedRef.current = true;
    };
    el.addEventListener("pointerdown", mark);
    el.addEventListener("wheel", mark, { passive: true });
    el.addEventListener("touchstart", mark, { passive: true });
    return () => {
      el.removeEventListener("pointerdown", mark);
      el.removeEventListener("wheel", mark);
      el.removeEventListener("touchstart", mark);
    };
  }, []);

  useEffect(() => {
    if (candlesTf !== timeframe) return;
    if (!candleRef.current || !volumeRef.current || !chartRef.current) return;

    candleRef.current.setData(
      candles.map((candle) => ({
        time: candle.time as UTCTimestamp,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      })),
    );
    volumeRef.current.setData(
      candles.map((candle) => ({
        time: candle.time as UTCTimestamp,
        value: candle.volume,
        color:
          candle.close >= candle.open
            ? "rgba(79,165,122,0.35)"
            : "rgba(199,106,106,0.35)",
      })),
    );

    const launch = candles.find((candle) => candle.launch);
    candleRef.current.setMarkers(
      launch
        ? [
            {
              time: launch.time as UTCTimestamp,
              position: "belowBar",
              color: "#E0A64B",
              shape: "arrowUp",
              text: "LAUNCH",
            },
          ]
        : [],
    );

    const timeScale = chartRef.current.timeScale();
    const count = candles.length;
    const firstLoad = lastTfRef.current === null;
    const tfChanged = lastTfRef.current !== candlesTf;
    const width = wrapRef.current?.clientWidth ?? 640;

    let spacing = timeScale.options().barSpacing;
    if (count > 0 && (firstLoad || tfChanged)) {
      const slots = Math.max(count + 4, Math.round(width / 22));
      spacing = Math.max(4, Math.min(22, width / slots));
      timeScale.applyOptions({ barSpacing: spacing });
    }

    const visible = Math.max(12, width / spacing);
    const center = count - 1;

    if (scrollStartTfRef.current === candlesTf && count > 0) {
      scrollStartTfRef.current = null;
      const startVisible = Math.max(12, Math.min(count, Math.floor(width / 8)));
      timeScale.setVisibleLogicalRange({ from: -0.5, to: startVisible - 0.5 });
    } else if (count > 0 && (firstLoad || tfChanged || !userMovedRef.current)) {
      // Default: candle terakhir di tengah layar (termasuk saat refresh),
      // dengan ruang kosong seimbang di kiri dan kanan. `rightOffset`
      // harus cukup besar agar lightweight-charts mengizinkan ruang kanan.
      timeScale.applyOptions({ rightOffset: Math.ceil(visible / 2) + 2 });
      timeScale.setVisibleLogicalRange({
        from: center - visible / 2,
        to: center + visible / 2,
      });
    }

    if (count > 0) lastTfRef.current = candlesTf;
  }, [candles, candlesTf, timeframe, scrollNonce]);

  const selectTimeframe = (tf: Timeframe) => {
    if (tf.seconds === timeframe || pending !== null) return;
    if (!timeframeReady(tf, spanSeconds)) return;

    // Cooldown kecil supaya klik beruntun tidak memicu beberapa build.
    const now = Date.now();
    if (now - guardRef.current < 140) return;
    guardRef.current = now;

    scrollStartTfRef.current = null;
    userMovedRef.current = false;
    setHover(null);
    setTimeframe(tf.seconds);
  };

  const goToLaunch = () => {
    if (!launchTs || candles.length === 0) return;
    const launchBucket = bucketStart(launchTs, timeframe);

    if (candles[0]!.time <= launchBucket) {
      userMovedRef.current = true;
      scrollStartTfRef.current = candlesTf;
      setScrollNonce((value) => value + 1);
      return;
    }

    // Timeframe kecil sudah terpotong: pilih timeframe terkecil yang masih
    // memuat candle launch, supaya detailnya tetap sebaik mungkin.
    const target = TIMEFRAMES.filter((tf) =>
      timeframeReady(tf, spanSeconds),
    )
      .filter(
        (tf) =>
          Math.ceil(spanSeconds / tf.seconds) + 1 <= MAX_FILLED_BARS,
      )
      .sort((a, b) => a.seconds - b.seconds)[0];

    if (target && target.seconds !== timeframe) {
      userMovedRef.current = true;
      scrollStartTfRef.current = target.seconds;
      setHover(null);
      setTimeframe(target.seconds);
    }
  };

  const empty = candles.length === 0;
  const initializing = empty && events.length > 0;
  const pendingLabel = pending
    ? TIMEFRAMES.find((tf) => tf.seconds === pending)?.label
    : null;

  return (
    <section className="panel">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line px-4 py-3">
        <div>
          <div className="label">{t("Harga INRT / SOL")}</div>
          <div className="mt-1.5 flex flex-wrap items-baseline gap-3">
            <span className="mono text-[22px] leading-none text-fg">
              {last ? `${candlePrice(last.close)} SOL` : EMPTY}
            </span>
            <span
              className={`mono text-[11px] ${changeTone}`}
              title={t("Perubahan candle (close vs open)")}
            >
              {last ? fmtSignedPct(change) : EMPTY}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-px bg-line p-px">
            {TIMEFRAMES.map((tf) => {
              const ready = timeframeReady(tf, spanSeconds);
              const active = timeframe === tf.seconds;
              return (
                <button
                  key={tf.seconds}
                  type="button"
                  disabled={!ready || pending !== null}
                  title={
                    ready
                      ? t("{label} · bucket WIB", { label: t(tf.label) })
                      : timeframeHint(tf, spanSeconds, t)
                  }
                  onClick={() => selectTimeframe(tf)}
                  className={`px-2.5 py-1 text-[10px] tracking-label transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    active
                      ? "bg-gold/10 text-gold"
                      : "bg-ink-1 text-muted enabled:hover:text-fg"
                  }`}
                >
                  {t(tf.label)}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="mono text-dim">
              VOL {fmtSolNumber(volume, true)} SOL
            </span>
            <button
              type="button"
              onClick={goToLaunch}
              disabled={!launchTs || empty || pending !== null}
              title={t("Pindah ke candle pertama sejak pool dibuat")}
              className="uppercase tracking-label text-dim transition-colors hover:text-gold disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("Sejak launch")}
            </button>
          </div>
        </div>
      </header>

      {shown ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-line px-4 py-2">
          <span className="label">{fmtWibDateTime(shown.time)}</span>
          <OhlcItem label="O" value={shown.open} />
          <OhlcItem label="H" value={shown.high} tone="text-up" />
          <OhlcItem label="L" value={shown.low} tone="text-down" />
          <OhlcItem
            label="C"
            value={shown.close}
            tone={shown.close >= shown.open ? "text-up" : "text-down"}
          />
          <span
            className="flex items-baseline gap-1.5"
            title={t("Perubahan candle (close vs open)")}
          >
            <span className="text-[9px] uppercase tracking-label text-dim">
              Δ
            </span>
            <span
              className={`mono text-[10px] ${shownTone}`}
            >
              {fmtSignedPct(shownChange)}
            </span>
          </span>
          <span className="flex items-baseline gap-1.5">
            <span className="text-[9px] uppercase tracking-label text-dim">
              V
            </span>
            <span className="mono text-[10px] text-fg">
              {fmtSolNumber(shown.volume, true)} SOL
            </span>
          </span>
          <span className="text-[9px] uppercase tracking-label text-dim">
            {shown.trades > 0
              ? t("{n} trade", { n: shown.trades })
              : t("belum ada trade")}
            {shown.mass > 0 ? ` · ${shown.mass} mass` : ""}
            {shown.launch ? " · launch" : ""}
          </span>
        </div>
      ) : null}

      <div className="relative">
        <div ref={wrapRef} className={`w-full ${heightClass}`} />
        {slowPending ? (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center px-4 py-2">
            <span className="border border-line bg-ink-1 px-3 py-1 text-[10px] uppercase tracking-label text-gold">
              {t("Menyiapkan candle {label}…", {
                label: pendingLabel ? t(pendingLabel) : "",
              })}
            </span>
          </div>
        ) : null}
        {!loading && empty && !initializing ? (
          <div className="absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-label text-dim">
            {t("Belum ada candle · swap pertama akan muncul di sini")}
          </div>
        ) : null}
        {loading && empty ? (
          <div className="absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-label text-dim">
            {t("Memuat candle…")}
          </div>
        ) : null}
        {initializing ? (
          <div className="absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-label text-dim">
            {t("Menyiapkan candle…")}
          </div>
        ) : null}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-2 text-[9px] uppercase tracking-label text-dim">
        <span title={t("Bucket tanpa transaksi tetap digambar sebagai candle flat")}>
          {t("Waktu WIB · {n} candle · {m} flat", {
            n: candles.length,
            m: candles.filter((candle) => candle.synthetic).length,
          })}
        </span>
        {progress ? (
          <span className="text-gold">
            {t("Memuat riwayat {done}/{total} tx", {
              done: progress.done,
              total: progress.total,
            })}
          </span>
        ) : (
          <span>{t("Fee 0,30% tidak masuk reserve · k naik tipis")}</span>
        )}
      </footer>
    </section>
  );
}
