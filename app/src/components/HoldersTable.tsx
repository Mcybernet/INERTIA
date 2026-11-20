"use client";

import { fmtPct, fmtToken } from "@/lib/format";
import type { HolderRow } from "@/lib/types";
import { useI18n } from "./LanguageProvider";
import { Empty, Panel, PanelHeader, Skeleton } from "./ui";

export function HoldersTable({
  rows,
  loading,
  connectedOwner,
}: {
  rows: HolderRow[];
  loading: boolean;
  connectedOwner?: string;
}) {
  const { t } = useI18n();
  return (
    <Panel>
      <PanelHeader
        title={t("Holder")}
        subtitle={t("top token account · Devnet")}
        right={
          <span className="text-[10px] tracking-label text-dim">
            {t("vault · massa · owner · wallet")}
          </span>
        }
      />
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-line">
              {["#", "Owner", "INRT", "% Supply"].map((h) => (
                <th
                  key={h}
                  className="px-3 py-2 text-[9px] font-normal uppercase tracking-label text-dim sm:px-4"
                >
                  {t(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0
              ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-lineSoft">
                    {Array.from({ length: 4 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.map((row, index) => (
                  <tr
                    key={row.tokenAccount}
                    className="border-b border-lineSoft last:border-0"
                  >
                    <td className="mono px-3 py-2.5 sm:px-4 text-[11px] text-dim">
                      {String(index + 1).padStart(2, "0")}
                    </td>
                    <td className="px-3 py-2.5 sm:px-4">
                      <div className="flex items-center gap-2">
                        <a
                          href={`https://explorer.solana.com/address/${row.owner}?cluster=devnet`}
                          target="_blank"
                          rel="noreferrer"
                          className="mono text-[11px] text-fg hover:text-gold"
                        >
                          {row.owner.length > 12
                            ? `${row.owner.slice(0, 4)}…${row.owner.slice(-4)}`
                            : row.owner}
                        </a>
                        {row.label ? (
                          <span className="border border-gold/40 px-1 py-0.5 text-[8px] tracking-label text-gold">
                            {row.label}
                          </span>
                        ) : null}
                        {connectedOwner && row.owner === connectedOwner ? (
                          <span className="border border-line px-1 py-0.5 text-[8px] tracking-label text-muted">
                            {t("KAMU")}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="mono px-3 py-2.5 sm:px-4 text-[11px] text-fg">
                      {fmtToken(row.amount, 2)}
                    </td>
                    <td className="mono px-3 py-2.5 sm:px-4 text-[11px] text-muted">
                      {fmtPct(row.pctBps)}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
        {!loading && rows.length === 0 ? (
          <Empty text={t("Belum ada holder")} />
        ) : null}
      </div>
    </Panel>
  );
}
