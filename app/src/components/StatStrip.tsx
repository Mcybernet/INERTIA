import { SUPPLY_RAW } from "@/lib/constants";
import {
  fmtPrice,
  fmtSolLamports,
  fmtSolNumber,
  fmtTokenInt,
} from "@/lib/format";
import { fdvSol } from "@/lib/price";
import type { PoolSnapshot } from "@/lib/types";
import { Skeleton } from "./ui";

function Cell({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-ink-1 px-4 py-3">
      <div className="label">{label}</div>
      <div
        className={`mono mt-1.5 truncate text-[17px] leading-none ${
          accent ? "text-gold" : "text-fg"
        }`}
        title={value}
      >
        {value}
      </div>
      <div className="mt-1.5 truncate text-[10px] text-dim">{sub}</div>
    </div>
  );
}

export function StatStrip({ snapshot }: { snapshot: PoolSnapshot | null }) {
  if (!snapshot) {
    return (
      <div className="mt-3 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-ink-1 px-4 py-3">
            <Skeleton className="w-16" />
            <div className="mt-3">
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="mt-2">
              <Skeleton className="w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const solReserve = BigInt(snapshot.solReserve);
  const liquidity = (Number(solReserve) / 1e9) * 2;
  const fdv = fdvSol(snapshot.priceScaled, BigInt(snapshot.supply));

  return (
    <div className="mt-3 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-3 xl:grid-cols-6">
      <Cell
        label="Harga"
        value={`${fmtPrice(snapshot.priceScaled)} SOL`}
        sub="per INRT · constant product"
        accent
      />
      <Cell
        label="FDV"
        value={`${fmtSolNumber(fdv)} SOL`}
        sub={`supply ${fmtTokenInt(SUPPLY_RAW)} INRT`}
      />
      <Cell
        label="Likuiditas"
        value={`${fmtSolNumber(liquidity)} SOL`}
        sub={`${fmtSolLamports(solReserve)} SOL di pool`}
      />
      <Cell
        label="Mass Reserve"
        value={`${fmtTokenInt(snapshot.vaults.massReserveAmount)} INRT`}
        sub={`${fmtSolLamports(snapshot.totalMassSol)} SOL sudah ditambahkan`}
      />
      <Cell
        label="Fee Vault"
        value={`${fmtSolLamports(snapshot.vaults.feeVaultSol)} SOL`}
        sub={`fee ${snapshot.feeBps} bps → massa`}
      />
      <Cell
        label="Supply"
        value={`${fmtTokenInt(snapshot.supply)} INRT`}
        sub="mint authority revoked"
      />
    </div>
  );
}
