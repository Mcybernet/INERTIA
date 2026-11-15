"use client";

import { useMemo } from "react";
import { ActivityTable } from "@/components/ActivityTable";
import { useData } from "@/components/DataProvider";
import { PageIntro, StatCard, StatGrid } from "@/components/PageIntro";
import { sumVolume } from "@/lib/candles";
import { fmtDateTime, fmtSolNumber } from "@/lib/format";

export function ActivityView() {
  const { history, events, progress } = useData();

  const stats = useMemo(() => {
    let buys = 0;
    let sells = 0;
    let mass = 0;
    let seedTs = 0;
    for (const event of events) {
      if (event.kind === "buy") buys += 1;
      else if (event.kind === "sell") sells += 1;
      else if (event.kind === "mass") mass += 1;
      else if (event.kind === "seed" && !seedTs) seedTs = event.timestamp;
    }
    return { buys, sells, mass, seedTs, volume: sumVolume(events) };
  }, [events]);

  return (
    <>
      <PageIntro
        kicker="Activity · on-chain"
        title="Semua event pool, langsung dari log program"
        description="Tidak ada indexer. Setiap baris berasal dari log SwapEvent, SeedEvent, atau AddMassEvent yang dibaca langsung dari RPC Devnet."
        right={
          <span className="border border-line px-2 py-1 text-[9px] uppercase tracking-label text-dim">
            {progress
              ? `${events.length} event · ${progress.done}/${progress.total} tx`
              : `${events.length} event tersimpan`}
          </span>
        }
      />

      {progress ? (
        <div
          className="mb-3 border border-line bg-ink-1 px-4 py-2 text-[10px] text-dim"
          role="status"
          aria-live="polite"
        >
          <span className="uppercase tracking-label text-gold">
            Memuat riwayat ·{" "}
          </span>
          {progress.done} dari {progress.total} transaksi dibaca. Tabel terisi
          bertahap karena RPC publik hanya mengizinkan satu{" "}
          <span className="mono">getTransaction</span> per ±1,2 detik.
        </div>
      ) : null}

      <StatGrid>
        <StatCard
          label="Total event"
          value={String(events.length)}
          sub={stats.seedTs ? `seed ${fmtDateTime(stats.seedTs)}` : "sejak launch"}
        />
        <StatCard
          label="Beli / Jual"
          value={`${stats.buys} / ${stats.sells}`}
          sub="jumlah transaksi, bukan volume"
        />
        <StatCard
          label="Volume swap"
          value={`${fmtSolNumber(stats.volume, true)} SOL`}
          sub="akumulasi solUser"
          accent
        />
        <StatCard
          label="add_mass"
          value={String(stats.mass)}
          sub="penambahan likuiditas permanen"
        />
      </StatGrid>

      {history.error ? (
        <div className="mb-3 border border-line bg-ink-1 px-4 py-2 text-[10px] text-dim">
          <span className="uppercase tracking-label text-gold">
            Riwayat tertunda ·{" "}
          </span>
          {history.error}. Tabel memakai cache terakhir; refresh otomatis
          mencoba lagi.
        </div>
      ) : null}

      <ActivityTable
        events={events}
        loading={history.loading}
        rows={40}
        filterable
        scroll={false}
      />

      <p className="mt-3 text-[10px] leading-relaxed text-dim">
        Cache riwayat disimpan 3 menit di browser lalu diperbarui secara
        inkremental. RPC publik Devnet membatasi <span className="mono">getTransaction</span>,
        jadi jumlah event bisa lebih sedikit dari total transaksi pool.
      </p>
    </>
  );
}
