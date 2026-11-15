"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ActivityTable } from "@/components/ActivityTable";
import { useData } from "@/components/DataProvider";
import { PoolPanel } from "@/components/PoolPanel";
import { StatStrip } from "@/components/StatStrip";
import { TradePanel } from "@/components/TradePanel";
import { PageIntro } from "@/components/PageIntro";
import { Panel } from "@/components/ui";

const PriceChart = dynamic(() => import("@/components/PriceChart"), {
  ssr: false,
  loading: () => <div className="panel h-[420px]" />,
});

export function OverviewView() {
  const { pool, history, events, progress, refreshAll } = useData();

  return (
    <>
      <PageIntro
        kicker="Overview · Devnet"
        title="The Mass — likuiditas yang tidak bisa ditarik"
        description="Harga dibentuk constant-product di pool internal. Tidak ada bonding curve, tidak ada instruksi withdraw: satu-satunya jalan token keluar dari Mass Reserve adalah add_mass."
        right={
          <Link href="/trade" className="btn btn-gold">
            Beli / Jual INRT
          </Link>
        }
      />

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
          <PriceChart events={events} loading={history.loading} progress={progress} />
          <ActivityTable
            events={events}
            loading={history.loading}
            rows={8}
            subtitle={
              progress
                ? `memuat ${progress.done}/${progress.total} tx · 8 terbaru`
                : "8 event terbaru"
            }
          />
          <div className="flex flex-wrap gap-2">
            <Link href="/activity" className="chip py-2">
              Semua aktivitas →
            </Link>
            <Link href="/holders" className="chip py-2">
              Holder & tier →
            </Link>
            <Link href="/mass" className="chip py-2">
              Mass Reserve →
            </Link>
          </div>
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
    </>
  );
}
