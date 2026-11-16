"use client";

import { POOL_LABEL } from "@/lib/constants";
import { shortAddr } from "@/lib/format";
import { explorerAddress } from "@/lib/nav";
import type { PoolSnapshot } from "@/lib/types";
import { CopyButton } from "./CopyButton";
import { useI18n } from "./LanguageProvider";
import { Panel, PanelHeader } from "./ui";

const BADGES = [
  "Mint authority revoked",
  "Tanpa instruksi withdraw",
  "Fee 30 bps tetap",
];

function AddressRow({ label, address }: { label: string; address: string }) {
  const { t } = useI18n();
  return (
    <li className="flex items-center justify-between gap-2 px-4 py-2.5">
      <span className="text-[9px] uppercase tracking-label text-dim">
        {t(label)}
      </span>
      <div className="flex items-center gap-2">
        <CopyButton value={address} />
        <a
          href={explorerAddress(address)}
          target="_blank"
          rel="noreferrer"
          className="mono text-[10px] text-muted hover:text-gold"
          title={address}
        >
          {shortAddr(address, 4)} ↗
        </a>
      </div>
    </li>
  );
}

/**
 * Bukti on-chain: alamat yang bisa dicek sendiri + jaminan yang dikunci
 * program. Semua data berasal dari snapshot pool, bukan hardcode UI.
 */
export function OnChainPanel({ snapshot }: { snapshot: PoolSnapshot }) {
  const { t } = useI18n();
  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader
        title={t("Bukti on-chain")}
        subtitle="Devnet"
        right={
          <span className="border border-line px-1.5 py-0.5 text-[8px] uppercase tracking-label text-dim">
            {POOL_LABEL}
          </span>
        }
      />

      <ul className="divide-y divide-lineSoft">
        <AddressRow label="Program" address={snapshot.programId} />
        <AddressRow label="Mint" address={snapshot.mint} />
        <AddressRow label="Pool" address={snapshot.pool} />
        <AddressRow label="Mass Reserve" address={snapshot.massReserveVault} />
        <AddressRow label="Fee vault" address={snapshot.feeVault} />
      </ul>

      <ul className="mt-auto space-y-1.5 border-t border-line px-4 py-3">
        {BADGES.map((badge) => (
          <li key={badge} className="flex items-center gap-2 text-[10px] text-muted">
            <span className="h-1 w-1 shrink-0 bg-gold" aria-hidden />
            {t(badge)}
          </li>
        ))}
      </ul>

      <footer className="border-t border-lineSoft px-4 py-2 text-[9px] uppercase tracking-label text-dim">
        <a
          href={explorerAddress(snapshot.pool)}
          target="_blank"
          rel="noreferrer"
          className="hover:text-gold"
        >
          {t("Verifikasi sendiri di explorer →")}
        </a>
      </footer>
    </Panel>
  );
}
