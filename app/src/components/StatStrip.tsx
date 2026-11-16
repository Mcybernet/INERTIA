"use client";

import { SUPPLY_RAW } from "@/lib/constants";
import {
  fmtPrice,
  fmtSolLamports,
  fmtSolNumber,
  fmtTokenInt,
} from "@/lib/format";
import { fdvSol } from "@/lib/price";
import type { PoolSnapshot } from "@/lib/types";
import { useI18n } from "./LanguageProvider";
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
  const { t } = useI18n();

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
        label={t("Harga")}
        value={`${fmtPrice(snapshot.priceScaled)} SOL`}
        sub={t("per INRT · constant product")}
        accent
      />
      <Cell
        label="FDV"
        value={`${fmtSolNumber(fdv)} SOL`}
        sub={t("supply {n} INRT", { n: fmtTokenInt(SUPPLY_RAW) })}
      />
      <Cell
        label={t("Likuiditas (2 sisi)")}
        value={`${fmtSolNumber(liquidity)} SOL`}
        sub={`${fmtSolLamports(solReserve)} SOL + ${fmtTokenInt(
          snapshot.tokenReserve,
        )} INRT`}
      />
      <Cell
        label={t("Mass Reserve")}
        value={`${fmtTokenInt(snapshot.vaults.massReserveAmount)} INRT`}
        sub={t("{amount} SOL sudah ditambahkan", {
          amount: fmtSolLamports(snapshot.totalMassSol),
        })}
      />
      <Cell
        label={t("Fee Vault")}
        value={`${fmtSolLamports(snapshot.vaults.feeVaultSol)} SOL`}
        sub={t("fee {n} bps → massa", { n: snapshot.feeBps })}
      />
      <Cell
        label={t("Supply")}
        value={`${fmtTokenInt(snapshot.supply)} INRT`}
        sub={t("mint authority revoked")}
      />
    </div>
  );
}
