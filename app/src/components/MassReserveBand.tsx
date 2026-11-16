"use client";

import Link from "next/link";
import {
  MASS_RESERVE_SUPPLY_RAW,
  MIN_MASS_SOL,
  RENT_EXEMPT_MIN,
} from "@/lib/constants";
import { fmtAgo, fmtPct, fmtSolLamports, fmtTokenInt } from "@/lib/format";
import type { HistoryEvent, PoolSnapshot } from "@/lib/types";
import { Panel, PanelHeader } from "./ui";

const THRESHOLD = MIN_MASS_SOL + RENT_EXEMPT_MIN;

/**
 * Ringkasan Mass Reserve untuk Overview: sisa reserve, yang sudah masuk pool,
 * dan kesiapan fee vault. Sengaja ringkas — detail aturan ada di /mass.
 */
export function MassReserveBand({
  snapshot,
  events,
}: {
  snapshot: PoolSnapshot;
  events: HistoryEvent[];
}) {
  const initial = MASS_RESERVE_SUPPLY_RAW;
  const reserve = BigInt(snapshot.vaults.massReserveAmount);
  const used = reserve < initial ? initial - reserve : 0n;
  const usedBps = Number((used * 10_000n) / initial);
  const usedRatio = Math.min(1, Number(used) / Number(initial));
  const fee = BigInt(snapshot.vaults.feeVaultSol);
  const ready = fee >= THRESHOLD;
  const missing = ready ? 0n : THRESHOLD - fee;
  const massEvents = events.filter((event) => event.kind === "mass").length;
  const everMass = BigInt(snapshot.totalMassSol) > 0n;

  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader
        title="Mass Reserve"
        subtitle="likuiditas permanen"
        right={
          <span
            className={`border px-1.5 py-0.5 text-[8px] uppercase tracking-label ${
              ready ? "border-gold/50 text-gold" : "border-line text-dim"
            }`}
            title="Ambang add_mass: 1 SOL + rent"
          >
            {ready ? "siap add_mass" : "menunggu fee"}
          </span>
        }
      />

      <div className="grid grid-cols-1 gap-px bg-line sm:grid-cols-3">
        <div className="bg-ink-1 px-4 py-3">
          <div className="label">Sisa reserve</div>
          <div className="mono mt-1.5 truncate text-[17px] leading-none text-gold">
            {fmtTokenInt(reserve)} INRT
          </div>
          <div className="mt-1.5 text-[10px] text-dim">
            {fmtPct(usedBps)} dari {fmtTokenInt(initial)} sudah masuk pool
          </div>
        </div>
        <div className="bg-ink-1 px-4 py-3">
          <div className="label">Sudah masuk pool</div>
          <div className="mono mt-1.5 truncate text-[17px] leading-none text-fg">
            {fmtSolLamports(snapshot.totalMassSol)} SOL
          </div>
          <div className="mt-1.5 truncate text-[10px] text-dim">
            {fmtTokenInt(snapshot.totalMassToken)} INRT · {massEvents}{" "}
            add_mass tercatat
          </div>
        </div>
        <div className="bg-ink-1 px-4 py-3">
          <div className="label">Fee vault</div>
          <div className="mono mt-1.5 truncate text-[17px] leading-none text-fg">
            {fmtSolLamports(fee)} SOL
          </div>
          <div className="mt-1.5 truncate text-[10px] text-dim">
            {ready
              ? "cukup untuk add_mass"
              : `kurang ${fmtSolLamports(missing)} SOL`}
          </div>
        </div>
      </div>

      <div className="px-4 py-3">
        <div className="flex items-baseline justify-between gap-3">
          <span className="label">Reserve yang terpakai</span>
          <span className="mono text-[9px] text-dim">
            {fmtTokenInt(used)} / {fmtTokenInt(initial)} INRT
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
        <p className="mt-2 text-[10px] leading-relaxed text-dim">
          Tidak ada instruksi withdraw. Token hanya keluar dari reserve lewat{" "}
          <span className="mono text-muted">add_mass</span>, yang justru
          menambah likuiditas pool.
        </p>
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-2 text-[9px] uppercase tracking-label text-dim">
        <span>
          Mass terakhir: {everMass ? fmtAgo(snapshot.lastMassTs) : "belum pernah"}
        </span>
        <Link href="/mass" className="text-gold hover:underline">
          Aturan & riwayat →
        </Link>
      </div>
    </Panel>
  );
}
