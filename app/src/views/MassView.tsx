"use client";

import Link from "next/link";
import { ActivityTable } from "@/components/ActivityTable";
import { useData } from "@/components/DataProvider";
import { PageIntro, StatCard, StatGrid } from "@/components/PageIntro";
import { Panel, PanelHeader, Skeleton } from "@/components/ui";
import {
  MASS_CAP_BPS,
  MASS_RATIO_TOL_BPS,
  MASS_RESERVE_SUPPLY_RAW,
  MIN_MASS_SOL,
  RENT_EXEMPT_MIN,
} from "@/lib/constants";
import { fmtAgo, fmtPct, fmtSolLamports, fmtTokenInt } from "@/lib/format";
import type { PoolSnapshot } from "@/lib/types";

const THRESHOLD = MIN_MASS_SOL + RENT_EXEMPT_MIN;

function Bar({
  value,
  max,
  label,
  note,
  accent,
}: {
  value: number;
  max: number;
  label: string;
  note: string;
  accent?: boolean;
}) {
  const ratio = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  return (
    <div className="px-4 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="label">{label}</span>
        <span className="mono text-[10px] text-muted">
          {Math.round(ratio * 1000) / 10}%
        </span>
      </div>
      <div
        className="mt-2 h-2 w-full border border-line bg-ink"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(ratio * 100)}
        aria-label={label}
      >
        <div
          className={`h-full ${accent ? "bg-gold" : "bg-muted"}`}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      <div className="mt-1.5 text-[9px] text-dim">{note}</div>
    </div>
  );
}

function MassBody({ snapshot }: { snapshot: PoolSnapshot }) {
  const reserve = BigInt(snapshot.vaults.massReserveAmount);
  const initial = MASS_RESERVE_SUPPLY_RAW;
  const used = reserve < initial ? initial - reserve : 0n;
  const usedBps = Number((used * 10_000n) / initial);
  const cap = (reserve * BigInt(MASS_CAP_BPS)) / 10_000n;
  const fee = BigInt(snapshot.vaults.feeVaultSol);
  const ready = fee >= THRESHOLD;

  return (
    <>
      <StatGrid>
        <StatCard
          label="Mass Reserve"
          value={`${fmtTokenInt(reserve)} INRT`}
          sub={`${fmtPct(usedBps)} dari ${fmtTokenInt(initial)} sudah masuk pool`}
          accent
        />
        <StatCard
          label="Total massa"
          value={`${fmtSolLamports(snapshot.totalMassSol)} SOL`}
          sub={`${fmtTokenInt(snapshot.totalMassToken)} INRT ditambahkan`}
        />
        <StatCard
          label="Fee vault"
          value={`${fmtSolLamports(fee)} SOL`}
          sub={ready ? "siap dipanggil add_mass" : "minimum 1 SOL + rent"}
        />
        <StatCard
          label="Mass terakhir"
          value={
            BigInt(snapshot.totalMassSol) > 0n
              ? fmtAgo(snapshot.lastMassTs)
              : "belum pernah"
          }
          sub={`interval ${snapshot.massInterval} detik`}
        />
      </StatGrid>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Panel>
          <PanelHeader
            title="Reserve terpakai"
            subtitle="10.000.000 INRT awal"
            right={
              <span className="mono text-[10px] text-dim">
                {fmtTokenInt(used)} INRT
              </span>
            }
          />
          <Bar
            value={Number(used)}
            max={Number(initial)}
            label="Masuk pool lewat add_mass"
            note="Mass Reserve tidak punya instruksi withdraw; hanya add_mass yang bisa memindahkannya."
            accent
          />
          <Bar
            value={Number(fee)}
            max={Number(THRESHOLD)}
            label="Fee vault menuju ambang add_mass"
            note={`Ambang = ${fmtSolLamports(THRESHOLD)} SOL (1 SOL + rent). ${
              ready ? "Sudah terpenuhi." : "Belum terpenuhi."
            }`}
          />
        </Panel>

        <Panel>
          <PanelHeader title="Aturan add_mass" subtitle="dikunci di program" />
          <ul className="divide-y divide-lineSoft text-[11px] leading-relaxed text-muted">
            <li className="flex justify-between gap-3 px-4 py-2.5">
              <span>Minimum SOL per panggilan</span>
              <span className="mono text-fg">1 SOL</span>
            </li>
            <li className="flex justify-between gap-3 px-4 py-2.5">
              <span>Maksimum token per panggilan</span>
              <span className="mono text-fg">
                {fmtTokenInt(cap)} INRT
              </span>
            </li>
            <li className="flex justify-between gap-3 px-4 py-2.5">
              <span>Cap dari sisa reserve</span>
              <span className="mono text-fg">{fmtPct(MASS_CAP_BPS, 0)}</span>
            </li>
            <li className="flex justify-between gap-3 px-4 py-2.5">
              <span>Toleransi pergeseran harga</span>
              <span className="mono text-fg">
                {MASS_RATIO_TOL_BPS} bps
              </span>
            </li>
            <li className="flex justify-between gap-3 px-4 py-2.5">
              <span>Sumber dana</span>
              <span className="mono text-fg">fee vault</span>
            </li>
          </ul>
          <div className="border-t border-line px-4 py-3 text-[10px] leading-relaxed text-dim">
            Butuh volume ±333 SOL untuk mengumpulkan 1 SOL fee pada 0,30%. Di
            Devnet, fee vault bisa diisi langsung untuk menguji keeper.{" "}
            <Link href="/tokenomics#mass" className="text-gold hover:underline">
              Detail kebijakan massa →
            </Link>
          </div>
        </Panel>
      </div>
    </>
  );
}

export function MassView() {
  const { pool, history, events, progress } = useData();

  return (
    <>
      <PageIntro
        kicker="Mass Reserve · on-chain"
        title="Liquidity yang tumbuh, bukan ditarik"
        description="Semua fee swap berakhir di sini. add_mass menukar fee vault menjadi token dari Mass Reserve dan menambahkannya ke pool permanen."
        right={
          pool.data ? (
            <span
              className={`border px-2 py-1 text-[9px] uppercase tracking-label ${
                BigInt(pool.data.vaults.feeVaultSol) >= THRESHOLD
                  ? "border-gold/50 text-gold"
                  : "border-line text-muted"
              }`}
            >
              {BigInt(pool.data.vaults.feeVaultSol) >= THRESHOLD
                ? "Mass siap"
                : "Mass menunggu"}
            </span>
          ) : null
        }
      />

      {pool.error ? (
        <div className="mb-3 border border-down/40 bg-ink-1 px-4 py-3 text-[11px] text-down">
          <span className="uppercase tracking-label">RPC error · </span>
          {pool.error}
        </div>
      ) : null}

      {pool.data ? (
        <MassBody snapshot={pool.data} />
      ) : (
        <div className="panel space-y-3 p-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}

      <div className="mt-3">
        <ActivityTable
          events={events}
          loading={history.loading}
          rows={20}
          filterable
          initialFilter="mass"
          title="Riwayat add_mass"
          subtitle={
            progress
              ? `event MassEvent · ${progress.done}/${progress.total} tx`
              : "event MassEvent"
          }
          emptyText="Belum ada add_mass — fee vault masih di bawah ambang"
          scroll={false}
        />
      </div>
    </>
  );
}
