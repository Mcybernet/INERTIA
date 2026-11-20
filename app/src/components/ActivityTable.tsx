"use client";

import { useMemo, useState } from "react";
import { EMPTY, fmtSolNumber, fmtTime, fmtToken } from "@/lib/format";
import type { HistoryEvent } from "@/lib/types";
import { useI18n } from "./LanguageProvider";
import { Empty, Panel, PanelHeader, Skeleton } from "./ui";

type KindFilter = "all" | HistoryEvent["kind"];

const FILTERS: { id: KindFilter; label: string }[] = [
  { id: "all", label: "Semua" },
  { id: "buy", label: "Beli" },
  { id: "sell", label: "Jual" },
  { id: "mass", label: "Massa" },
  { id: "seed", label: "Seed" },
];

function badge(kind: HistoryEvent["kind"]) {
  switch (kind) {
    case "buy":
      return { label: "BELI", cls: "border-up/50 text-up" };
    case "sell":
      return { label: "JUAL", cls: "border-down/50 text-down" };
    case "mass":
      return { label: "MASSA", cls: "border-gold/50 text-gold" };
    default:
      return { label: "SEED", cls: "border-line text-muted" };
  }
}

/** Satu metrik di kartu mobile: tabel 6 kolom tidak muat di layar 360px. */
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] uppercase tracking-label text-dim">{label}</p>
      <p className="mono mt-1 truncate text-[11px] text-fg">{value}</p>
    </div>
  );
}

export function ActivityTable({
  events,
  loading,
  rows = 30,
  filterable = false,
  initialFilter = "all",
  title = "Aktivitas",
  subtitle,
  emptyText = "Belum ada aktivitas swap",
  scroll = true,
  pageSize,
}: {
  events: HistoryEvent[];
  loading: boolean;
  rows?: number;
  filterable?: boolean;
  initialFilter?: KindFilter;
  title?: string;
  subtitle?: string;
  emptyText?: string;
  scroll?: boolean;
  /** Bila diisi, tabel memakai pagination dan hanya merender `pageSize` baris. */
  pageSize?: number;
}) {
  const { t } = useI18n();
  const [filter, setFilter] = useState<KindFilter>(initialFilter);
  const [visible, setVisible] = useState(rows);
  const [page, setPage] = useState(0);

  const counts = useMemo(() => {
    const map: Record<KindFilter, number> = {
      all: events.length,
      buy: 0,
      sell: 0,
      mass: 0,
      seed: 0,
    };
    for (const event of events) map[event.kind] += 1;
    return map;
  }, [events]);

  const filtered = useMemo(
    () => (filter === "all" ? events : events.filter((e) => e.kind === filter)),
    [events, filter],
  );
  const list = useMemo(() => [...filtered].reverse(), [filtered]);
  const pageCount = pageSize ? Math.max(1, Math.ceil(list.length / pageSize)) : 1;
  const safePage = pageSize ? Math.min(page, pageCount - 1) : 0;
  const shown = pageSize
    ? list.slice(safePage * pageSize, safePage * pageSize + pageSize)
    : list.slice(0, visible);

  function changeFilter(next: KindFilter) {
    setFilter(next);
    setVisible(rows);
    setPage(0);
  }

  return (
    <Panel>
      <PanelHeader
        title={t(title)}
        subtitle={subtitle ?? t("{n} event on-chain", { n: events.length })}
        right={
          filterable ? (
            <div className="flex flex-wrap gap-1">
              {FILTERS.map((item) => {
                const isActive = filter === item.id;
                const count = counts[item.id];
                if (item.id !== "all" && count === 0 && !isActive) return null;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => changeFilter(item.id)}
                    aria-pressed={isActive}
                    className={`chip py-1 ${
                      isActive ? "chip-active" : ""
                    }`}
                  >
                    {t(item.label)}
                    <span className="ml-1.5 text-[9px] opacity-70">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <span className="text-[10px] tracking-label text-dim">
              {t("SWAP · MASSA · SEED")}
            </span>
          )
        }
      />

      <div className={scroll ? "max-h-[420px] overflow-auto" : "overflow-x-auto"}>
        <table className="hidden w-full border-collapse text-left sm:table">
          <thead className="sticky top-0 z-10 bg-ink-1">
            <tr className="border-b border-line">
              {["Waktu", "Tipe", "INRT", "SOL", "Harga", "Wallet"].map((h) => (
                <th
                  key={h}
                  className="px-3 py-2 text-[9px] font-normal uppercase tracking-label text-dim"
                >
                  {t(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && list.length === 0
              ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-lineSoft">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-3 py-3">
                        <Skeleton className="w-14" />
                      </td>
                    ))}
                  </tr>
                ))
              : shown.map((event) => {
                  const b = badge(event.kind);
                  const wallet =
                    event.kind === "seed"
                      ? EMPTY
                      : event.kind === "mass"
                        ? event.caller
                        : event.wallet;
                  const solAmount =
                    event.kind === "buy" || event.kind === "sell"
                      ? event.solUser
                      : event.solAmount;
                  return (
                    <tr
                      key={`${event.sig}-${event.kind}-${event.timestamp}`}
                      className="border-b border-lineSoft last:border-0"
                    >
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <a
                          href={`https://explorer.solana.com/tx/${event.sig}?cluster=devnet`}
                          target="_blank"
                          rel="noreferrer"
                          className="mono text-[11px] text-muted hover:text-gold"
                          title={event.sig}
                        >
                          {fmtTime(event.timestamp)}
                        </a>
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`border px-1.5 py-0.5 text-[9px] tracking-label ${b.cls}`}
                        >
                          {t(b.label)}
                        </span>
                      </td>
                      <td className="mono whitespace-nowrap px-3 py-2.5 text-[11px] text-fg">
                        {fmtToken(event.tokenAmount, 2)}
                      </td>
                      <td className="mono whitespace-nowrap px-3 py-2.5 text-[11px] text-muted">
                        {fmtSolNumber(Number(BigInt(solAmount)) / 1e9, true)}
                      </td>
                      <td className="mono whitespace-nowrap px-3 py-2.5 text-[11px] text-muted">
                        {fmtSolNumber(
                          Number(BigInt(event.priceAfter)) / 1e15,
                          true,
                        )}
                      </td>
                      <td className="mono whitespace-nowrap px-3 py-2.5 text-[11px] text-dim">
                        {wallet === EMPTY ? (
                          EMPTY
                        ) : (
                          <a
                            href={`https://explorer.solana.com/address/${wallet}?cluster=devnet`}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:text-gold"
                          >
                            {wallet.slice(0, 4)}…{wallet.slice(-4)}
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>

        <div className="divide-y divide-lineSoft sm:hidden">
          {loading && list.length === 0
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2 px-4 py-3">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))
            : shown.map((event) => {
                const b = badge(event.kind);
                const wallet =
                  event.kind === "seed"
                    ? EMPTY
                    : event.kind === "mass"
                      ? event.caller
                      : event.wallet;
                const solAmount =
                  event.kind === "buy" || event.kind === "sell"
                    ? event.solUser
                    : event.solAmount;
                return (
                  <article key={`${event.sig}-${event.kind}-${event.timestamp}`} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <a
                          href={`https://explorer.solana.com/tx/${event.sig}?cluster=devnet`}
                          target="_blank"
                          rel="noreferrer"
                          className="mono shrink-0 text-[11px] text-muted hover:text-gold"
                          title={event.sig}
                        >
                          {fmtTime(event.timestamp)}
                        </a>
                        <span
                          className={`shrink-0 border px-1.5 py-0.5 text-[9px] tracking-label ${b.cls}`}
                        >
                          {t(b.label)}
                        </span>
                      </div>
                      {wallet === EMPTY ? (
                        <span className="mono shrink-0 text-[9px] text-dim">
                          {EMPTY}
                        </span>
                      ) : (
                        <a
                          href={`https://explorer.solana.com/address/${wallet}?cluster=devnet`}
                          target="_blank"
                          rel="noreferrer"
                          className="mono shrink-0 text-[9px] text-dim hover:text-gold"
                        >
                          {wallet.slice(0, 4)}…{wallet.slice(-4)}
                        </a>
                      )}
                    </div>
                    <div className="mt-2.5 grid grid-cols-3 gap-3">
                      <Metric label={t("INRT")} value={fmtToken(event.tokenAmount, 2)} />
                      <Metric
                        label={t("SOL")}
                        value={fmtSolNumber(Number(BigInt(solAmount)) / 1e9, true)}
                      />
                      <Metric
                        label={t("Harga")}
                        value={fmtSolNumber(
                          Number(BigInt(event.priceAfter)) / 1e15,
                          true,
                        )}
                      />
                    </div>
                  </article>
                );
              })}
        </div>

        {!loading && list.length === 0 ? <Empty text={t(emptyText)} /> : null}
      </div>

      {list.length > 0 ? (
        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-2 text-[9px] uppercase tracking-label text-dim">
          {pageSize ? (
            <>
              <span aria-live="polite">
                {t("Menampilkan {from}-{to} dari {total} event", {
                  from: safePage * pageSize + 1,
                  to: safePage * pageSize + shown.length,
                  total: list.length,
                })}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPage(Math.max(0, safePage - 1))}
                  disabled={safePage === 0}
                  className="chip py-1 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {t("Sebelumnya")}
                </button>
                <span className="px-1">
                  {t("Halaman {page} dari {total}", {
                    page: safePage + 1,
                    total: pageCount,
                  })}
                </span>
                <button
                  type="button"
                  onClick={() => setPage(Math.min(pageCount - 1, safePage + 1))}
                  disabled={safePage >= pageCount - 1}
                  className="chip py-1 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {t("Berikutnya")}
                </button>
              </div>
            </>
          ) : (
            <>
              <span>
                {t("Menampilkan {shown} dari {total} event", {
                  shown: shown.length,
                  total: list.length,
                })}
              </span>
              {visible < list.length ? (
                <button
                  type="button"
                  onClick={() => setVisible((v) => v + rows)}
                  className="chip py-1"
                >
                  {t("Muat lebih")}
                </button>
              ) : (
                <span>{t("Semua event termuat")}</span>
              )}
            </>
          )}
        </footer>
      ) : null}
    </Panel>
  );
}
