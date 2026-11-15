"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { ActivityTable } from "@/components/ActivityTable";
import { HoldersTable } from "@/components/HoldersTable";
import { PoolPanel } from "@/components/PoolPanel";
import { StatStrip } from "@/components/StatStrip";
import { TopBar } from "@/components/TopBar";
import { TradePanel } from "@/components/TradePanel";
import { Panel } from "@/components/ui";
import { usePolling } from "@/hooks/usePolling";
import { PROGRAM_ID } from "@/lib/constants";
import { getHistory, getHolders, getPoolSnapshot } from "@/lib/data";

const PriceChart = dynamic(() => import("@/components/PriceChart"), {
  ssr: false,
  loading: () => <div className="panel h-[420px]" />,
});

export default function Home() {
  const pool = usePolling(getPoolSnapshot, 20_000);
  const history = usePolling(getHistory, 45_000);
  const holders = usePolling(getHolders, 120_000);
  const { publicKey } = useWallet();
  const [refreshing, setRefreshing] = useState(false);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        pool.refresh(true),
        history.refresh(true),
        holders.refresh(true),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [pool.refresh, history.refresh, holders.refresh]);

  return (
    <div className="min-h-screen">
      <TopBar
        poolAddress={pool.data?.pool}
        updatedAt={pool.data?.fetchedAt}
        refreshing={refreshing}
        onRefresh={refreshAll}
      />

      <main className="mx-auto max-w-[1480px] px-4 pb-14 pt-3 lg:px-6">
        {pool.error ? (
          <div className="mb-3 border border-down/40 bg-ink-1 px-4 py-3 text-[11px] text-down">
            <span className="uppercase tracking-label">RPC error · </span>
            {pool.error}
            <span className="mt-1 block text-[10px] text-dim">
              Devnet RPC publik bisa membatasi laju. Coba refresh beberapa saat
              lagi.
            </span>
          </div>
        ) : null}

        {history.error ? (
          <div className="mb-3 border border-line bg-ink-1 px-4 py-2 text-[10px] text-dim">
            <span className="uppercase tracking-label text-gold">
              Riwayat tertunda ·{" "}
            </span>
            RPC publik sedang membatasi permintaan. Chart dan aktivitas memakai
            data terakhir yang tersimpan; refresh otomatis akan mencoba lagi.
          </div>
        ) : null}

        <StatStrip snapshot={pool.data} />

        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_350px] xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="flex min-w-0 flex-col gap-3">
            <PriceChart
              events={history.data ?? []}
              loading={history.loading}
            />
            <ActivityTable
              events={history.data ?? []}
              loading={history.loading}
            />
            <HoldersTable
              rows={holders.data ?? []}
              loading={holders.loading}
              connectedOwner={publicKey?.toBase58()}
            />
          </div>

          <div className="flex flex-col gap-3">
            {pool.data ? (
              <TradePanel snapshot={pool.data} onDone={refreshAll} />
            ) : (
              <Panel className="h-[420px] animate-pulseSoft" />
            )}
            {pool.data ? <PoolPanel snapshot={pool.data} /> : null}
          </div>
        </div>

        <footer className="mt-6 flex flex-col gap-2 border-t border-line pt-4 text-[9px] uppercase tracking-label text-dim sm:flex-row sm:items-center sm:justify-between">
          <span>
            INERTIA · INRT · Solana Devnet · tanpa bonding curve · fee 0,30% ke
            massa
          </span>
          <span className="mono normal-case tracking-normal">
            program {PROGRAM_ID.toBase58().slice(0, 6)}…
            {PROGRAM_ID.toBase58().slice(-6)}
          </span>
        </footer>
      </main>
    </div>
  );
}
