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
}) {
  const { t } = useI18n();
  const [filter, setFilter] = useState<KindFilter>(initialFilter);
  const [visible, setVisible] = useState(rows);

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
  const shown = list.slice(0, visible);

  function changeFilter(next: KindFilter) {
    setFilter(next);
    setVisible(rows);
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
        <table className="w-full border-collapse text-left">
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
        {!loading && list.length === 0 ? <Empty text={t(emptyText)} /> : null}
      </div>

      {list.length > 0 ? (
        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-2 text-[9px] uppercase tracking-label text-dim">
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
        </footer>
      ) : null}
    </Panel>
  );
}
