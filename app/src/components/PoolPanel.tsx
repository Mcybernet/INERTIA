import { fmtAgo, fmtPct, fmtSolLamports, fmtTokenInt } from "@/lib/format";
import type { PoolSnapshot } from "@/lib/types";
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

const RENT_EXEMPT_MIN = 890_880n;
const MIN_MASS_SOL = 1_000_000_000n;

export function PoolPanel({ snapshot }: { snapshot: PoolSnapshot }) {
  const tokenReserve = BigInt(snapshot.tokenReserve);
  const solReserve = BigInt(snapshot.solReserve);
  const k = tokenReserve * solReserve;
  const feeSol = BigInt(snapshot.vaults.feeVaultSol);
  const massReady = feeSol >= MIN_MASS_SOL + RENT_EXEMPT_MIN;
  const massEver = BigInt(snapshot.totalMassSol) > 0n;

  return (
    <Panel>
      <PanelHeader
        title="Pool"
        subtitle="constant product"
        right={
          <span
            className={`border px-1.5 py-0.5 text-[9px] tracking-label ${
              massReady
                ? "border-gold/50 text-gold"
                : "border-line text-muted"
            }`}
            title="Butuh fee vault ≥ 1 SOL + rent"
          >
            {massReady ? "MASS SIAP" : "MASS MENUNGGU"}
          </span>
        }
      />
      <div className="divide-y divide-lineSoft">
        <Row
          label="Fee swap"
          value={`${fmtPct(snapshot.feeBps, 2)} → massa`}
          accent
        />
        <Row label="Launch slot" value={snapshot.launchSlot} />
        <Row
          label="SOL reserve"
          value={`${fmtSolLamports(solReserve)} SOL`}
        />
        <Row
          label="Token reserve"
          value={`${fmtTokenInt(tokenReserve)} INRT`}
        />
        <Row label="Invariant k" value={Number(k).toExponential(6)} />
        <Row label="Interval massa" value={`${snapshot.massInterval} detik`} />
        <Row
          label="Mass terakhir"
          value={massEver ? fmtAgo(snapshot.lastMassTs) : "belum pernah"}
        />
        <Row
          label="Total massa"
          value={`${fmtSolLamports(snapshot.totalMassSol)} SOL / ${fmtTokenInt(
            snapshot.totalMassToken,
          )} INRT`}
        />
        <LinkRow label="Mint" address={snapshot.mint} />
        <LinkRow label="Pool" address={snapshot.pool} />
        <LinkRow label="Token vault" address={snapshot.tokenVault} />
        <LinkRow label="SOL vault" address={snapshot.solVault} />
        <LinkRow label="Fee vault" address={snapshot.feeVault} />
        <LinkRow
          label="Mass reserve"
          address={snapshot.massReserveVault}
        />
      </div>
    </Panel>
  );
}
