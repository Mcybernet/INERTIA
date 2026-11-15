"use client";

import { useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useData } from "@/components/DataProvider";
import { HoldersTable } from "@/components/HoldersTable";
import { PageIntro, StatCard, StatGrid } from "@/components/PageIntro";
import { Panel, PanelHeader } from "@/components/ui";
import { TIERS } from "@/lib/constants";
import { fmtPct, fmtToken } from "@/lib/format";

export function HoldersView() {
  const { holders } = useData();
  const { publicKey } = useWallet();
  const rows = holders.data ?? [];

  const stats = useMemo(() => {
    const top10 = rows.slice(0, 10).reduce((acc, row) => acc + row.pctBps, 0);
    const labelled = rows.filter((row) => row.label).length;
    return {
      top1: rows[0]?.pctBps ?? 0,
      top10,
      labelled,
    };
  }, [rows]);

  return (
    <>
      <PageIntro
        kicker="Holders · Devnet"
        title="Siapa yang memegang INRT"
        description="Peringkat token account berdasarkan saldo. Vault pool dan Mass Reserve selalu muncul karena keduanya memegang supply, bukan karena dimiliki wallet."
        right={
          <span className="border border-line px-2 py-1 text-[9px] uppercase tracking-label text-dim">
            top {rows.length} akun
          </span>
        }
      />

      <StatGrid>
        <StatCard
          label="Holder teratas"
          value={rows[0] ? fmtPct(stats.top1) : "—"}
          sub={rows[0] ? fmtToken(rows[0].amount, 0) + " INRT" : "memuat…"}
        />
        <StatCard
          label="Top 10 gabungan"
          value={fmtPct(stats.top10)}
          sub="termasuk vault & reserve"
        />
        <StatCard
          label="Akun berlabel"
          value={String(stats.labelled)}
          sub="pool vault · mass reserve · owner"
        />
        <StatCard
          label="Supply beredar"
          value="50.000.000"
          sub="INRT · decimals 6"
          accent
        />
      </StatGrid>

      {holders.error ? (
        <div className="mb-3 border border-line bg-ink-1 px-4 py-2 text-[10px] text-dim">
          <span className="uppercase tracking-label text-gold">
            Holder tertunda ·{" "}
          </span>
          {holders.error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
        <HoldersTable
          rows={rows}
          loading={holders.loading}
          connectedOwner={publicKey?.toBase58()}
        />

        <div className="flex flex-col gap-3">
          <Panel>
            <PanelHeader title="Tier" subtitle="persentase supply" />
            <ul className="divide-y divide-lineSoft">
              {TIERS.map((tier) => (
                <li
                  key={tier.name}
                  className="flex items-center justify-between px-4 py-2.5"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2 w-2"
                      style={{ background: tier.color }}
                      aria-hidden
                    />
                    <span
                      className="text-[10px] uppercase tracking-label"
                      style={{ color: tier.color }}
                    >
                      {tier.name}
                    </span>
                  </span>
                  <span className="mono text-[10px] text-dim">
                    {tier.minBps === 400
                      ? "> 4%"
                      : tier.minBps === 150
                        ? "1,5 – 4%"
                        : tier.minBps === 50
                          ? "0,5 – 1,5%"
                          : tier.minBps === 10
                            ? "0,1 – 0,5%"
                            : "< 0,1%"}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel>
            <PanelHeader title="Catatan data" subtitle="Devnet RPC" />
            <p className="px-4 py-3 text-[10px] leading-relaxed text-muted">
              RPC publik sering menolak{" "}
              <span className="mono">getTokenLargestAccounts</span> (429). Saat
              itu terjadi, tabel memakai fallback: vault pool, Mass Reserve,
              owner, dan wallet yang pernah swap. Untuk daftar lengkap, set{" "}
              <span className="mono">NEXT_PUBLIC_ENABLE_LARGEST_ACCOUNTS=1</span>{" "}
              dengan RPC privat.
            </p>
          </Panel>
        </div>
      </div>
    </>
  );
}
