"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useBalances } from "@/hooks/useBalances";
import { MINT } from "@/lib/constants";
import {
  EMPTY,
  fmtPrice,
  fmtSignedPct,
  fmtSolNumber,
  fmtToken,
  fmtWibDateTime,
  shortAddr,
} from "@/lib/format";
import { computePortfolioPnl, tradePriceScaled } from "@/lib/pnl";
import type { TradeEvent } from "@/lib/types";
import { CopyButton } from "./CopyButton";
import { useData } from "./DataProvider";
import { useI18n } from "./LanguageProvider";
import { Empty } from "./ui";

const explorerAddress = (address: string) =>
  `https://explorer.solana.com/address/${address}?cluster=devnet`;
const explorerTx = (signature: string) =>
  `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
const lamportsToSol = (lamports: bigint) => Number(lamports) / 1e9;

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-ink px-3 py-2">
      <dt className="label">{label}</dt>
      <dd className="mono mt-1 text-[11px] text-fg">{value}</dd>
    </div>
  );
}

export function WalletDrawer({ onClose }: { onClose: () => void }) {
  const { publicKey, disconnect } = useWallet();
  const { pool, events, progress } = useData();
  const { t } = useI18n();
  const balances = useBalances();
  const [tab, setTab] = useState<"token" | "activity">("token");
  const panelRef = useRef<HTMLDivElement>(null);

  const wallet = publicKey?.toBase58() ?? null;
  const trades = useMemo(
    () =>
      events.filter(
        (event): event is TradeEvent =>
          (event.kind === "buy" || event.kind === "sell") &&
          event.wallet === wallet,
      ),
    [events, wallet],
  );

  const priceScaled = BigInt(pool.data?.priceScaled ?? "0");
  const pnl = useMemo(
    () => computePortfolioPnl(trades, priceScaled, balances.token),
    [trades, priceScaled, balances.token],
  );

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusables = () =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );

    focusables()[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, [onClose]);

  const hasPrice = priceScaled > 0n;
  const pct = pnl.pct === null ? EMPTY : fmtSignedPct(pnl.pct);
  const pctClass = (pnl.pct ?? 0) > 0 ? "text-gold" : "text-muted";
  const mismatch = pnl.noCostQty > 0n || pnl.swapQty > balances.token;

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label={t("Dompet INERTIA")}
    >
      <button
        type="button"
        aria-label={t("Tutup dompet")}
        onClick={onClose}
        className="absolute inset-0 bg-ink/85"
      />

      <div
        ref={panelRef}
        className="absolute right-0 top-0 flex h-full w-full max-w-[430px] flex-col border-l border-line bg-ink"
      >
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
          <div className="flex items-center gap-2">
            <h2 className="text-[11px] uppercase tracking-label text-fg">
              {t("Dompet")}
            </h2>
            <span className="border border-gold/50 px-1.5 py-0.5 text-[8px] uppercase tracking-label text-gold">
              Devnet
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("Tutup dompet")}
            className="btn btn-ghost h-8 px-2.5"
          >
            <span aria-hidden>✕</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          {!publicKey ? (
            <div className="space-y-4 p-4">
              <p className="text-[11px] leading-relaxed text-muted">
                {t("Hubungkan wallet untuk melihat portofolio")}
              </p>
              <WalletMultiButton className="w-full" />
              <p className="text-[9px] leading-relaxed text-dim">
                {t("Kunci tetap di wallet kamu. Situs ini tidak menyimpannya.")}
              </p>
            </div>
          ) : (
            <>
              <section className="border-b border-line px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="label">{t("Alamat wallet")}</p>
                    <p
                      className="mono mt-1 truncate text-[12px] text-fg"
                      title={wallet ?? ""}
                    >
                      {shortAddr(wallet ?? "", 6)}
                    </p>
                  </div>
                  <CopyButton value={wallet ?? ""} label={t("Salin alamat")} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={explorerAddress(wallet ?? "")}
                    target="_blank"
                    rel="noreferrer"
                    className="chip py-1"
                  >
                    {t("Lihat di Explorer")}
                  </a>
                  <button
                    type="button"
                    onClick={() => void disconnect()}
                    className="chip py-1"
                  >
                    {t("Putuskan")}
                  </button>
                </div>
              </section>

              <section className="border-b border-line px-4 py-4">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="label">{t("Nilai portofolio")}</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[9px] uppercase tracking-label text-dim">
                      P/L
                    </span>
                    <span className={`mono text-[11px] ${pctClass}`}>{pct}</span>
                  </div>
                </div>
                <p className="mono mt-1 text-[20px] text-fg">
                  {hasPrice
                    ? `${fmtSolNumber(lamportsToSol(pnl.valueLamports), true)} SOL`
                    : EMPTY}
                </p>

                <dl className="mt-4 grid grid-cols-2 gap-px bg-line">
                  <StatRow
                    label={t("Modal")}
                    value={`${fmtSolNumber(lamportsToSol(pnl.costLamports), true)} SOL`}
                  />
                  <StatRow
                    label={t("Harga beli rata-rata")}
                    value={
                      pnl.avgCostScaled === null
                        ? EMPTY
                        : fmtPrice(pnl.avgCostScaled)
                    }
                  />
                  <StatRow
                    label={t("Harga sekarang")}
                    value={hasPrice ? fmtPrice(priceScaled) : EMPTY}
                  />
                  <StatRow label={t("Jumlah swap")} value={String(pnl.trades)} />
                </dl>

                <div className="mt-3 space-y-1 border-t border-lineSoft pt-3 text-[10px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-dim">{t("Realisasi")}</span>
                    <span className="mono text-fg">
                      {`${fmtSolNumber(lamportsToSol(pnl.realizedLamports), true)} SOL`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-dim">{t("Belum realisasi")}</span>
                    <span className="mono text-fg">
                      {pnl.unrealizedLamports === null
                        ? EMPTY
                        : `${fmtSolNumber(lamportsToSol(pnl.unrealizedLamports), true)} SOL`}
                    </span>
                  </div>
                </div>

                <p className="mt-3 text-[9px] leading-relaxed text-dim">
                  {t("Termasuk fee 0,30%")} ·{" "}
                  {t("Berdasarkan {n} swap terakhir", { n: pnl.trades })}
                  {progress ? ` · ${t("Memuat data on-chain")}` : ""}
                </p>
                {mismatch ? (
                  <p className="mt-2 border border-line px-2 py-1.5 text-[9px] leading-relaxed text-goldDim">
                    {t("Ada transfer di luar swap, angka P/L perkiraan")}
                  </p>
                ) : null}
              </section>

              <div className="flex shrink-0 border-b border-line">
                {(["token", "activity"] as const).map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTab(id)}
                    aria-pressed={tab === id}
                    className={`flex-1 px-3 py-2 text-[10px] uppercase tracking-label transition-colors ${
                      tab === id
                        ? "border-b-2 border-gold text-gold"
                        : "text-dim hover:text-fg"
                    }`}
                  >
                    {id === "token" ? t("Token") : t("Aktivitas")}
                  </button>
                ))}
              </div>

              {tab === "token" ? (
                <section className="p-4">
                  <div className="space-y-px bg-line">
                    <div className="flex items-center justify-between gap-2 bg-ink px-3 py-3">
                      <span className="label">{t("Saldo INRT")}</span>
                      <span className="mono text-[12px] text-fg">
                        {fmtToken(balances.token, 6)} INRT
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 bg-ink px-3 py-3">
                      <span className="label">{t("Saldo SOL")}</span>
                      <span className="mono text-[12px] text-fg">
                        {fmtSolNumber(balances.sol)} SOL
                      </span>
                    </div>
                  </div>
                  {balances.loading ? (
                    <p className="mt-3 text-[9px] uppercase tracking-label text-dim">
                      {t("Memuat data on-chain")}
                    </p>
                  ) : null}
                  <div className="mt-3">
                    <a
                      href={explorerAddress(MINT.toBase58())}
                      target="_blank"
                      rel="noreferrer"
                      className="chip py-1"
                    >
                      {t("Lihat di Explorer")}
                    </a>
                  </div>
                </section>
              ) : (
                <section className="p-4">
                  {trades.length === 0 ? (
                    <Empty text={t("Belum ada swap dari wallet ini.")} />
                  ) : (
                    <ul className="divide-y divide-lineSoft border border-line">
                      {trades
                        .slice(-20)
                        .reverse()
                        .map((event) => {
                          const price = tradePriceScaled(event);
                          return (
                            <li key={event.sig} className="px-3 py-2">
                              <div className="flex items-center justify-between gap-2">
                                <span
                                  className={`text-[10px] uppercase tracking-label ${
                                    event.kind === "buy" ? "text-gold" : "text-muted"
                                  }`}
                                >
                                  {event.kind === "buy" ? t("Beli") : t("Jual")}
                                </span>
                                <span className="mono text-[9px] text-dim">
                                  {fmtWibDateTime(event.timestamp)}
                                </span>
                              </div>
                              <div className="mt-1 flex items-center justify-between gap-2">
                                <span className="mono text-[11px] text-fg">
                                  {fmtToken(event.tokenAmount, 6)} INRT
                                </span>
                                <span className="mono text-[10px] text-muted">
                                  {fmtSolNumber(
                                    lamportsToSol(BigInt(event.solUser)),
                                    true,
                                  )}{" "}
                                  SOL
                                </span>
                              </div>
                              <div className="mt-1 flex items-center justify-between gap-2">
                                <span className="text-[9px] text-dim">
                                  {t("Harga eksekusi")}{" "}
                                  {price === null ? EMPTY : fmtPrice(price)}
                                </span>
                                <a
                                  href={explorerTx(event.sig)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[9px] uppercase tracking-label text-goldDim hover:text-gold"
                                >
                                  EXPLORER
                                </a>
                              </div>
                            </li>
                          );
                        })}
                    </ul>
                  )}
                  <div className="mt-3">
                    <Link href="/activity" onClick={onClose} className="chip py-1">
                      {t("Lihat semua aktivitas")}
                    </Link>
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        <footer className="shrink-0 border-t border-line px-4 py-3 text-[9px] leading-relaxed text-dim">
          {t("Kunci tetap di wallet kamu. Situs ini tidak menyimpannya.")}
        </footer>
      </div>
    </div>
  );
}
