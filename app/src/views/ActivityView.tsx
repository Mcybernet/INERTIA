"use client";

import { useMemo } from "react";
import { ActivityTable } from "@/components/ActivityTable";
import { useData } from "@/components/DataProvider";
import { useI18n } from "@/components/LanguageProvider";
import { PageIntro, StatCard, StatGrid } from "@/components/PageIntro";
import { sumVolume } from "@/lib/candles";
import { fmtDateTime, fmtSolNumber } from "@/lib/format";

export function ActivityView() {
  const { history, events, progress } = useData();
  const { t } = useI18n();

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
        title={t("Semua event pool, langsung dari log program")}
        description={t(
          "Tidak ada indexer. Setiap baris berasal dari log SwapEvent, SeedEvent, atau AddMassEvent yang dibaca langsung dari RPC Devnet.",
        )}
        right={
          <span className="border border-line px-2 py-1 text-[9px] uppercase tracking-label text-dim">
            {progress
              ? t("{n} event · {done}/{total} tx", {
                  n: events.length,
                  done: progress.done,
                  total: progress.total,
                })
              : t("{n} event tersimpan", { n: events.length })}
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
            {t("Memuat riwayat · ")}
          </span>
          {t(
            "{done} dari {total} transaksi dibaca. Tabel terisi bertahap karena RPC publik hanya mengizinkan satu getTransaction per ±1,2 detik.",
            { done: progress.done, total: progress.total },
          )}
        </div>
      ) : null}

      <StatGrid>
        <StatCard
          label={t("Total event")}
          value={String(events.length)}
          sub={
            stats.seedTs
              ? t("seed {time}", { time: fmtDateTime(stats.seedTs) })
              : t("sejak launch")
          }
        />
        <StatCard
          label={t("Beli / Jual")}
          value={`${stats.buys} / ${stats.sells}`}
          sub={t("jumlah transaksi, bukan volume")}
        />
        <StatCard
          label={t("Volume swap")}
          value={`${fmtSolNumber(stats.volume, true)} SOL`}
          sub={t("akumulasi solUser")}
          accent
        />
        <StatCard
          label="add_mass"
          value={String(stats.mass)}
          sub={t("penambahan likuiditas permanen")}
        />
      </StatGrid>

      {history.error ? (
        <div className="mb-3 border border-line bg-ink-1 px-4 py-2 text-[10px] text-dim">
          <span className="uppercase tracking-label text-gold">
            {t("Riwayat tertunda · ")}
          </span>
          {t(
            "{err}. Tabel memakai cache terakhir; refresh otomatis mencoba lagi.",
            { err: history.error },
          )}
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
        {t(
          "Cache riwayat disimpan 3 menit di browser lalu diperbarui secara inkremental. RPC publik Devnet membatasi getTransaction, jadi jumlah event bisa lebih sedikit dari total transaksi pool.",
        )}
      </p>
    </>
  );
}
