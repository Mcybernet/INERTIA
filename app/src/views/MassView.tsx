"use client";

import Link from "next/link";
import { ActivityTable } from "@/components/ActivityTable";
import { useData } from "@/components/DataProvider";
import { useI18n } from "@/components/LanguageProvider";
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
  const { t } = useI18n();
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
          label={t("Mass Reserve")}
          value={`${fmtTokenInt(reserve)} INRT`}
          sub={t("{pct} dari {supply} sudah masuk pool", {
            pct: fmtPct(usedBps),
            supply: fmtTokenInt(initial),
          })}
          accent
        />
        <StatCard
          label={t("Total massa")}
          value={`${fmtSolLamports(snapshot.totalMassSol)} SOL`}
          sub={t("{n} INRT ditambahkan", {
            n: fmtTokenInt(snapshot.totalMassToken),
          })}
        />
        <StatCard
          label={t("Fee vault")}
          value={`${fmtSolLamports(fee)} SOL`}
          sub={
            ready ? t("siap dipanggil add_mass") : t("minimum 1 SOL + rent")
          }
        />
        <StatCard
          label={t("Mass terakhir")}
          value={
            BigInt(snapshot.totalMassSol) > 0n
              ? fmtAgo(snapshot.lastMassTs)
              : t("belum pernah")
          }
          sub={t("interval {n} detik", { n: snapshot.massInterval })}
        />
      </StatGrid>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Panel>
          <PanelHeader
            title={t("Reserve terpakai")}
            subtitle={t("9.600.000 INRT awal")}
            right={
              <span className="mono text-[10px] text-dim">
                {fmtTokenInt(used)} INRT
              </span>
            }
          />
          <Bar
            value={Number(used)}
            max={Number(initial)}
            label={t("Masuk pool lewat add_mass")}
            note={t(
              "Mass Reserve tidak punya instruksi withdraw; hanya add_mass yang bisa memindahkannya.",
            )}
            accent
          />
          <Bar
            value={Number(fee)}
            max={Number(THRESHOLD)}
            label={t("Fee vault menuju ambang add_mass")}
            note={t(
              ready
                ? "Ambang = {amount} SOL (1 SOL + rent). Sudah terpenuhi."
                : "Ambang = {amount} SOL (1 SOL + rent). Belum terpenuhi.",
              { amount: fmtSolLamports(THRESHOLD) },
            )}
          />
        </Panel>

        <Panel>
          <PanelHeader
            title={t("Aturan add_mass")}
            subtitle={t("dikunci di program")}
          />
          <ul className="divide-y divide-lineSoft text-[11px] leading-relaxed text-muted">
            <li className="flex justify-between gap-3 px-4 py-2.5">
              <span>{t("Minimum SOL per panggilan")}</span>
              <span className="mono text-fg">1 SOL</span>
            </li>
            <li className="flex justify-between gap-3 px-4 py-2.5">
              <span>{t("Maksimum token per panggilan")}</span>
              <span className="mono text-fg">
                {fmtTokenInt(cap)} INRT
              </span>
            </li>
            <li className="flex justify-between gap-3 px-4 py-2.5">
              <span>{t("Cap dari sisa reserve")}</span>
              <span className="mono text-fg">{fmtPct(MASS_CAP_BPS, 0)}</span>
            </li>
            <li className="flex justify-between gap-3 px-4 py-2.5">
              <span>{t("Toleransi pergeseran harga")}</span>
              <span className="mono text-fg">
                {MASS_RATIO_TOL_BPS} bps
              </span>
            </li>
            <li className="flex justify-between gap-3 px-4 py-2.5">
              <span>{t("Sumber dana")}</span>
              <span className="mono text-fg">fee vault</span>
            </li>
          </ul>
          <div className="border-t border-line px-4 py-3 text-[10px] leading-relaxed text-dim">
            {t(
              "Butuh volume ±333 SOL untuk mengumpulkan 1 SOL fee pada 0,30%. Di Devnet, fee vault bisa diisi langsung untuk menguji keeper.",
            )}{" "}
            <Link href="/tokenomics#mass" className="text-gold hover:underline">
              {t("Detail kebijakan massa →")}
            </Link>
          </div>
        </Panel>
      </div>
    </>
  );
}

export function MassView() {
  const { pool, history, events, progress } = useData();
  const { t } = useI18n();

  return (
    <>
      <PageIntro
        kicker="Mass Reserve · on-chain"
        title={t("Liquidity yang tumbuh, bukan ditarik")}
        description={t(
          "Semua fee swap berakhir di sini. add_mass menukar fee vault menjadi token dari Mass Reserve dan menambahkannya ke pool permanen.",
        )}
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
                ? t("Mass siap")
                : t("Mass menunggu")}
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
          title={t("Riwayat add_mass")}
          subtitle={
            progress
              ? t("event MassEvent · {done}/{total} tx", {
                  done: progress.done,
                  total: progress.total,
                })
              : t("event MassEvent")
          }
          emptyText={t(
            "Belum ada add_mass · fee vault masih di bawah ambang",
          )}
          scroll={false}
        />
      </div>
    </>
  );
}
