"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

function tone(value: number | bigint | null): string {
  if (value === null) return "text-muted";
  const positive = typeof value === "bigint" ? value > 0n : value > 0;
  const negative = typeof value === "bigint" ? value < 0n : value < 0;
  if (negative) return "text-down";
  if (positive) return "text-gold";
  return "text-muted";
}

/** Identikon flat dan deterministik, tanpa gambar atau gradien. */
function WalletMark({ address }: { address: string }) {
  const cells = useMemo(() => {
    const chars = Array.from(address).slice(0, 24);
    if (chars.length === 0) return Array.from({ length: 16 }, () => false);
    return Array.from({ length: 16 }, (_, index) => {
      const code = chars[index % chars.length].charCodeAt(0);
      return (code + index * 7) % 4 < 2;
    });
  }, [address]);

  return (
    <div
      className="grid h-10 w-10 shrink-0 grid-cols-4 gap-px border border-line p-1"
      aria-hidden
    >
      {cells.map((on, index) => (
        <span key={index} className={on ? "bg-gold" : "bg-ink-3"} />
      ))}
    </div>
  );
}

function DetailRow({
  label,
  value,
  valueClass = "text-fg",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-lineSoft pb-2 last:border-b-0 last:pb-0">
      <span className="text-[11px] text-muted">{label}</span>
      <span className={`mono text-[12px] ${valueClass}`}>{value}</span>
    </div>
  );
}

export function WalletDrawer({ onClose }: { onClose: () => void }) {
  const { publicKey, disconnect } = useWallet();
  const { pool, events, progress } = useData();
  const { t } = useI18n();
  const balances = useBalances();
  const [tab, setTab] = useState<"token" | "activity">("token");
  const [closing, setClosing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const closingRef = useRef(false);
  const timerRef = useRef<number | null>(null);

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

  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    timerRef.current = window.setTimeout(onClose, 180);
  }, [onClose]);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

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
        requestClose();
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
  }, [requestClose]);

  const hasPrice = priceScaled > 0n;
  const pct = pnl.pct === null ? EMPTY : fmtSignedPct(pnl.pct);
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
        onClick={requestClose}
        className={
          closing
            ? "absolute inset-0 bg-ink/80 motion-safe:animate-fadeOut"
            : "absolute inset-0 bg-ink/80 motion-safe:animate-fadeIn"
        }
      />

      <div
        ref={panelRef}
        className={`absolute right-0 top-0 flex h-full w-full max-w-[440px] flex-col border-l border-line bg-ink ${
          closing
            ? "motion-safe:animate-drawerOut"
            : "motion-safe:animate-drawerIn"
        }`}
      >
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5">
          <div className="flex items-center gap-3">
            <WalletMark address={wallet ?? "INERTIA"} />
            <div>
              <h2 className="text-[12px] uppercase tracking-label text-fg">
                {t("Dompet")}
              </h2>
              <p className="mono mt-0.5 text-[9px] tracking-label text-dim">
                Devnet · INRT
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={requestClose}
            aria-label={t("Tutup dompet")}
            className="btn btn-ghost h-8 px-2.5"
          >
            <span aria-hidden>✕</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          {!publicKey ? (
            <div className="px-5 py-8 motion-safe:animate-riseIn">
              <div className="border border-line border-l-2 border-l-gold bg-ink-1 px-4 py-5">
                <p className="label">{t("Dompet")}</p>
                <p className="mt-3 text-[13px] leading-relaxed text-fg">
                  {t("Hubungkan wallet untuk melihat portofolio")}
                </p>
                <div className="mt-5">
                  <WalletMultiButton className="w-full" />
                </div>
              </div>
              <p className="mt-4 text-[10px] leading-relaxed text-dim">
                {t("Kunci tetap di wallet kamu. Situs ini tidak menyimpannya.")}
              </p>
            </div>
          ) : (
            <>
              <section className="px-5 py-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="label">{t("Alamat wallet")}</p>
                    <p
                      className="mono mt-1.5 break-all text-[12px] leading-relaxed text-fg"
                      title={wallet ?? ""}
                    >
                      {shortAddr(wallet ?? "", 8)}
                    </p>
                  </div>
                  <CopyButton value={wallet ?? ""} label={t("Salin alamat")} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
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

              <section className="px-5 pb-6">
                <div className="border border-line border-l-2 border-l-gold bg-ink-1 px-4 py-5 motion-safe:animate-riseIn">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="label">{t("Nilai portofolio")}</p>
                      <p className="mono mt-2 text-[26px] leading-none tracking-tight text-fg">
                        {hasPrice
                          ? `${fmtSolNumber(lamportsToSol(pnl.valueLamports), true)} SOL`
                          : EMPTY}
                      </p>
                    </div>
                    <span
                      className={`mono shrink-0 border border-line px-2 py-1 text-[12px] ${tone(pnl.pct)}`}
                    >
                      {pct}
                    </span>
                  </div>

                  <div className="mt-6 space-y-2">
                    <DetailRow
                      label={t("Modal")}
                      value={`${fmtSolNumber(lamportsToSol(pnl.costLamports), true)} SOL`}
                    />
                    <DetailRow
                      label={t("Harga beli rata-rata")}
                      value={
                        pnl.avgCostScaled === null
                          ? EMPTY
                          : fmtPrice(pnl.avgCostScaled)
                      }
                    />
                    <DetailRow
                      label={t("Harga sekarang")}
                      value={hasPrice ? fmtPrice(priceScaled) : EMPTY}
                    />
                    <DetailRow
                      label={t("Jumlah swap")}
                      value={String(pnl.trades)}
                    />
                  </div>

                  <div className="mt-5 space-y-2 border-t border-line pt-4">
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-[11px] text-muted">
                        {t("Realisasi")}
                      </span>
                      <span
                        className={`mono text-[12px] ${tone(pnl.realizedLamports)}`}
                      >
                        {`${fmtSolNumber(lamportsToSol(pnl.realizedLamports), true)} SOL`}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-[11px] text-muted">
                        {t("Belum realisasi")}
                      </span>
                      <span
                        className={`mono text-[12px] ${tone(pnl.unrealizedLamports)}`}
                      >
                        {pnl.unrealizedLamports === null
                          ? EMPTY
                          : `${fmtSolNumber(lamportsToSol(pnl.unrealizedLamports), true)} SOL`}
                      </span>
                    </div>
                  </div>

                  <p className="mt-4 text-[9px] leading-relaxed text-dim">
                    {t("Termasuk fee 0,30%")} ·{" "}
                    {t("Berdasarkan {n} swap terakhir", { n: pnl.trades })}
                    {progress ? ` · ${t("Memuat data on-chain")}` : ""}
                  </p>
                  {mismatch ? (
                    <p className="mt-3 border-l-2 border-l-goldDim pl-3 text-[9px] leading-relaxed text-muted">
                      {t("Ada transfer di luar swap, angka P/L perkiraan")}
                    </p>
                  ) : null}
                </div>
              </section>

              <div className="flex gap-6 border-b border-line px-5">
                {(["token", "activity"] as const).map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTab(id)}
                    aria-pressed={tab === id}
                    className={`relative py-3 text-[11px] tracking-label transition-colors duration-150 ${
                      tab === id
                        ? "text-gold after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:bg-gold"
                        : "text-dim hover:text-fg"
                    }`}
                  >
                    {id === "token" ? t("Token") : t("Aktivitas")}
                  </button>
                ))}
              </div>

              {tab === "token" ? (
                <section
                  className="px-5 py-5 motion-safe:animate-riseIn"
                  style={{ animationDelay: "40ms" }}
                >
                  <div className="divide-y divide-lineSoft">
                    <div className="flex items-center justify-between gap-3 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center border border-gold/60 text-[8px] tracking-label text-gold">
                          INRT
                        </span>
                        <span className="text-[11px] text-muted">
                          {t("Saldo INRT")}
                        </span>
                      </div>
                      <span className="mono text-[13px] text-fg">
                        {fmtToken(balances.token, 6)} INRT
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center border border-line text-[8px] tracking-label text-muted">
                          SOL
                        </span>
                        <span className="text-[11px] text-muted">
                          {t("Saldo SOL")}
                        </span>
                      </div>
                      <span className="mono text-[13px] text-fg">
                        {fmtSolNumber(balances.sol)} SOL
                      </span>
                    </div>
                  </div>
                  {balances.loading ? (
                    <p className="mt-3 text-[9px] uppercase tracking-label text-dim">
                      {t("Memuat data on-chain")}
                    </p>
                  ) : null}
                  <div className="mt-5">
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
                <section
                  className="px-5 py-5 motion-safe:animate-riseIn"
                  style={{ animationDelay: "40ms" }}
                >
                  {trades.length === 0 ? (
                    <Empty text={t("Belum ada swap dari wallet ini.")} />
                  ) : (
                    <ul className="divide-y divide-lineSoft">
                      {trades
                        .slice(-20)
                        .reverse()
                        .map((event) => {
                          const price = tradePriceScaled(event);
                          return (
                            <li
                              key={event.sig}
                              className="py-3 transition-colors duration-150 hover:bg-ink-1"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span
                                  className={`text-[10px] uppercase tracking-label ${
                                    event.kind === "buy"
                                      ? "text-gold"
                                      : "text-muted"
                                  }`}
                                >
                                  {event.kind === "buy" ? t("Beli") : t("Jual")}
                                </span>
                                <span className="mono text-[9px] text-dim">
                                  {fmtWibDateTime(event.timestamp)}
                                </span>
                              </div>
                              <div className="mt-1.5 flex items-center justify-between gap-2">
                                <span className="mono text-[12px] text-fg">
                                  {fmtToken(event.tokenAmount, 6)} INRT
                                </span>
                                <span className="mono text-[11px] text-muted">
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
                                  className="text-[9px] uppercase tracking-label text-goldDim transition-colors duration-150 hover:text-gold"
                                >
                                  EXPLORER
                                </a>
                              </div>
                            </li>
                          );
                        })}
                    </ul>
                  )}
                  <div className="mt-5">
                    <Link href="/activity" onClick={requestClose} className="chip py-1">
                      {t("Lihat semua aktivitas")}
                    </Link>
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        <footer className="shrink-0 border-t border-line px-5 py-4 text-[10px] leading-relaxed text-dim">
          {t("Kunci tetap di wallet kamu. Situs ini tidak menyimpannya.")}
        </footer>
      </div>
    </div>
  );
}
