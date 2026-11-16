"use client";

import { MIN_MASS_SOL, RENT_EXEMPT_MIN } from "@/lib/constants";
import { fmtAgo, fmtPct, fmtSolLamports, fmtTokenInt } from "@/lib/format";
import type { PoolSnapshot } from "@/lib/types";
import { useI18n } from "./LanguageProvider";
import { Panel, PanelHeader } from "./ui";

function LinkRow({
  label,
  address,
}: {
  label: string;
  address: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5">
      <span className="text-[9px] uppercase tracking-label text-dim">
        {label}
      </span>
      <a
        href={`https://explorer.solana.com/address/${address}?cluster=devnet`}
        target="_blank"
        rel="noreferrer"
        className="mono text-[10px] text-muted hover:text-gold"
        title={address}
      >
        {address.slice(0, 4)}…{address.slice(-4)} ↗
      </a>
    </div>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5">
      <span className="text-[9px] uppercase tracking-label text-dim">
        {label}
      </span>
      <span
        className={`mono text-[11px] ${accent ? "text-gold" : "text-fg"}`}
      >
        {value}
      </span>
    </div>
  );
}

export function PoolPanel({ snapshot }: { snapshot: PoolSnapshot }) {
  const { t } = useI18n();
  const tokenReserve = BigInt(snapshot.tokenReserve);
  const solReserve = BigInt(snapshot.solReserve);
  const k = tokenReserve * solReserve;
  const feeSol = BigInt(snapshot.vaults.feeVaultSol);
  const massReady = feeSol >= MIN_MASS_SOL + RENT_EXEMPT_MIN;
  const massEver = BigInt(snapshot.totalMassSol) > 0n;

  return (
    <Panel>
      <PanelHeader
        title={t("Pool")}
        subtitle={t("constant product")}
        right={
          <span
            className={`border px-1.5 py-0.5 text-[9px] tracking-label ${
              massReady
                ? "border-gold/50 text-gold"
                : "border-line text-muted"
            }`}
            title={t("Butuh fee vault ≥ 1 SOL + rent")}
          >
            {massReady ? t("MASS SIAP") : t("MASS MENUNGGU")}
          </span>
        }
      />
      <div className="divide-y divide-lineSoft">
        <Row
          label={t("Fee swap")}
          value={t("{pct} → massa", { pct: fmtPct(snapshot.feeBps, 2) })}
          accent
        />
        <Row label={t("Launch slot")} value={snapshot.launchSlot} />
        <Row
          label={t("SOL reserve")}
          value={`${fmtSolLamports(solReserve)} SOL`}
        />
        <Row
          label={t("Token reserve")}
          value={`${fmtTokenInt(tokenReserve)} INRT`}
        />
        <Row label={t("Invariant k")} value={Number(k).toExponential(6)} />
        <Row
          label={t("Interval massa")}
          value={t("{n} detik", { n: snapshot.massInterval })}
        />
        <Row
          label={t("Mass terakhir")}
          value={massEver ? fmtAgo(snapshot.lastMassTs) : t("belum pernah")}
        />
        <Row
          label={t("Total massa")}
          value={`${fmtSolLamports(snapshot.totalMassSol)} SOL / ${fmtTokenInt(
            snapshot.totalMassToken,
          )} INRT`}
        />
        <LinkRow label="Mint" address={snapshot.mint} />
        <LinkRow label="Pool" address={snapshot.pool} />
        <LinkRow label={t("Token vault")} address={snapshot.tokenVault} />
        <LinkRow label={t("SOL vault")} address={snapshot.solVault} />
        <LinkRow label={t("Fee vault")} address={snapshot.feeVault} />
        <LinkRow
          label={t("Mass reserve")}
          address={snapshot.massReserveVault}
        />
      </div>
    </Panel>
  );
}
