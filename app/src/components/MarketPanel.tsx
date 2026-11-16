"use client";

import Link from "next/link";
import {
  MASS_RESERVE_SUPPLY_RAW,
  MIN_MASS_SOL,
  POOL_LABEL,
  RENT_EXEMPT_MIN,
} from "@/lib/constants";
import {
  fmtPct,
  fmtPrice,
  fmtSolLamports,
  fmtTokenInt,
  shortAddr,
} from "@/lib/format";
import { priceImpactBps, quoteBuy } from "@/lib/math";
import { explorerAddress } from "@/lib/nav";
import type { HistoryEvent, PoolSnapshot } from "@/lib/types";
import { Panel, PanelHeader, Skeleton } from "./ui";

const THRESHOLD = MIN_MASS_SOL + RENT_EXEMPT_MIN;

/** Ukuran contoh untuk preview quote — kecil supaya price impact tetap wajar. */
const PREVIEW_SOL = 100_000_000n; // 0,1 SOL

const CHECKLIST = [
  "Wallet di jaringan Devnet, bukan Mainnet",
  "Sisakan SOL untuk fee jaringan + sewa ATA",
  "Harga constant-product — tidak ada bonding curve",
];

/**
 * Kartu ringkas untuk halaman depan: state pasar + ajakan transaksi.
 * Sengaja tidak memuat form/quote interaktif supaya Overview tetap halaman
 * penjelasan; transaksi hanya terjadi di /trade.
 */
export function MarketPanel({
  snapshot,
  events,
}: {
  snapshot: PoolSnapshot | null;
  events: HistoryEvent[];
}) {
  if (!snapshot) {
    return (
      <Panel>
        <PanelHeader title="Pasar" subtitle="Devnet" />
        <div className="space-y-3 p-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-16 w-full" />
        </div>
      </Panel>
    );
  }

  const first = events.length > 0 ? events[0] : null;
  const firstPrice = first ? Number(BigInt(first.priceAfter)) / 1e15 : null;
  const currentPrice = Number(BigInt(snapshot.priceScaled)) / 1e15;
  const change =
    firstPrice && firstPrice > 0
      ? ((currentPrice - firstPrice) / firstPrice) * 100
      : null;

  const tokenReserve = BigInt(snapshot.tokenReserve);
  const solReserve = BigInt(snapshot.solReserve);
  const quote = quoteBuy(
    tokenReserve,
    solReserve,
    snapshot.feeBps,
    PREVIEW_SOL,
  );
  const impact = priceImpactBps("buy", PREVIEW_SOL, tokenReserve, solReserve);

  const reserve = BigInt(snapshot.vaults.massReserveAmount);
  const used =
    reserve < MASS_RESERVE_SUPPLY_RAW ? MASS_RESERVE_SUPPLY_RAW - reserve : 0n;
  const usedBps = Number((used * 10_000n) / MASS_RESERVE_SUPPLY_RAW);
  const usedRatio = Math.min(1, Number(used) / Number(MASS_RESERVE_SUPPLY_RAW));
  const fee = BigInt(snapshot.vaults.feeVaultSol);
  const ready = fee >= THRESHOLD;

  return (
    <Panel>
      <PanelHeader
        title="Pasar"
        subtitle="Devnet"
        right={
          <span className="border border-line px-1.5 py-0.5 text-[8px] uppercase tracking-label text-dim">
            {POOL_LABEL}
          </span>
        }
      />

      <div className="border-b border-lineSoft px-4 py-3">
        <div className="label">Harga INRT</div>
        <div className="mt-1.5 flex flex-wrap items-baseline gap-2">
          <span className="mono text-[22px] leading-none text-gold">
            {fmtPrice(snapshot.priceScaled)} SOL
          </span>
          {change !== null ? (
            <span
              className={`mono text-[10px] ${
                change >= 0 ? "text-up" : "text-down"
              }`}
            >
              {change >= 0 ? "+" : ""}
              {fmtPct(Math.round(Math.abs(change) * 100))}
            </span>
          ) : (
            <span className="text-[10px] text-dim">belum ada event</span>
          )}
        </div>
        <div className="mt-1 text-[9px] text-dim">
          {change !== null ? "perubahan sejak event pertama · " : ""}
          rasio reserve, bukan oracle
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px border-b border-lineSoft bg-line">
        <Link
          href="/trade#buy"
          className="flex h-10 items-center justify-center bg-ink-1 text-[10px] uppercase tracking-label text-up transition-colors hover:bg-gold/10 hover:text-gold"
        >
          Beli INRT
        </Link>
        <Link
          href="/trade#sell"
          className="flex h-10 items-center justify-center bg-ink-1 text-[10px] uppercase tracking-label text-down transition-colors hover:bg-down/10"
        >
          Jual INRT
        </Link>
      </div>

      <div className="border-b border-lineSoft px-4 py-3">
        <div className="flex items-baseline justify-between gap-3">
          <span className="label">Preview 0,1 SOL</span>
          <span className="mono text-[11px] text-fg">
            {quote ? `${fmtTokenInt(quote.out)} INRT` : "—"}
          </span>
        </div>
        <div className="mt-1 text-[9px] text-dim">
          fee 0,30% sudah dipotong · impact ±{fmtPct(impact, 2)}
        </div>
      </div>

      <div className="border-b border-lineSoft px-4 py-3">
        <div className="flex items-baseline justify-between gap-3">
          <span className="label">Mass Reserve</span>
          <span className="mono text-[9px] text-dim">
            {fmtPct(usedBps)} terpakai
          </span>
        </div>
        <div
          className="mt-2 h-1.5 w-full border border-line bg-ink"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(usedRatio * 100)}
          aria-label="Mass Reserve yang sudah masuk pool"
        >
          <div
            className="h-full bg-gold"
            style={{ width: `${usedRatio * 100}%` }}
          />
        </div>
        <div className="mt-1.5 flex flex-wrap items-baseline justify-between gap-2 text-[9px] text-dim">
          <span>{fmtTokenInt(reserve)} INRT sisa</span>
          <span className={ready ? "text-gold" : ""}>
            {ready
              ? "fee vault siap add_mass"
              : `fee vault ${fmtSolLamports(fee)} SOL`}
          </span>
        </div>
      </div>

      <ul className="divide-y divide-lineSoft text-[10px]">
        <li className="flex items-center justify-between gap-3 px-4 py-2.5">
          <span className="text-dim">Pool</span>
          <a
            href={explorerAddress(snapshot.pool)}
            target="_blank"
            rel="noreferrer"
            className="mono text-muted hover:text-gold"
            title={snapshot.pool}
          >
            {shortAddr(snapshot.pool, 5)} ↗
          </a>
        </li>
        <li className="flex items-center justify-between gap-3 px-4 py-2.5">
          <span className="text-dim">Fee swap</span>
          <span className="mono text-fg">0,30% → massa</span>
        </li>
      </ul>

      <div className="border-t border-line px-4 py-3">
        <div className="label">Sebelum beli</div>
        <ol className="mt-2 space-y-1.5">
          {CHECKLIST.map((item, index) => (
            <li key={item} className="flex gap-2.5 text-[10px] text-muted">
              <span className="mono text-[9px] text-gold">
                0{index + 1}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      </div>

      <footer className="border-t border-lineSoft px-4 py-2 text-[9px] uppercase tracking-label text-dim">
        ditandatangani wallet kamu · tanpa custodian
      </footer>
    </Panel>
  );
}
