"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ActivityTable } from "@/components/ActivityTable";
import { useData } from "@/components/DataProvider";
import { Faq } from "@/components/Faq";
import { useI18n } from "@/components/LanguageProvider";
import { MarketPanel } from "@/components/MarketPanel";
import { MassReserveBand } from "@/components/MassReserveBand";
import { OnChainPanel } from "@/components/OnChainPanel";
import { PageMap } from "@/components/PageMap";
import { StatStrip } from "@/components/StatStrip";
import { PageIntro } from "@/components/PageIntro";
import { Panel } from "@/components/ui";

const PriceChart = dynamic(() => import("@/components/PriceChart"), {
  ssr: false,
  loading: () => <div className="panel h-[420px]" />,
});

const PRINCIPLES = [
  {
    kicker: "01 · Mekanisme",
    title: "Tanpa bonding curve",
    text: "Harga dibentuk constant-product di pool internal. Tidak ada kurva yang naik sesuai jadwal, tidak ada harga yang dijanjikan.",
    href: "/tokenomics",
    cta: "Baca tokenomics",
  },
  {
    kicker: "02 · Likuiditas",
    title: "Tidak bisa ditarik",
    text: "Tidak ada instruksi withdraw. Token hanya bisa keluar dari Mass Reserve lewat add_mass, dan itu menambah likuiditas permanen.",
    href: "/mass",
    cta: "Lihat Mass Reserve",
  },
  {
    kicker: "03 · Fee",
    title: "Fee kembali ke massa",
    text: "Setiap swap menyisihkan 0,30% ke fee vault terpisah. Fee itu dibelanjakan lewat add_mass, bukan diambil owner.",
    href: "/mass",
    cta: "Cara kerja fee",
  },
] as const;

export function OverviewView() {
  const { pool, history, events, progress } = useData();
  const { t } = useI18n();

  return (
    <>
      <PageIntro
        kicker="Overview · Devnet"
        title={t("The Mass · likuiditas yang tidak bisa ditarik")}
        description={t(
          "Harga dibentuk constant-product di pool internal. Tidak ada bonding curve, tidak ada instruksi withdraw: satu-satunya jalan token keluar dari Mass Reserve adalah add_mass.",
        )}
        right={
          <div className="flex flex-wrap gap-2">
            <Link href="/trade#buy" className="btn btn-gold">
              {t("Beli INRT")}
            </Link>
            <Link href="/docs" className="btn btn-ghost">
              {t("Cara kerja")}
            </Link>
          </div>
        }
      />

      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 border border-line bg-ink-1 px-4 py-2 text-[10px]">
        <span className="uppercase tracking-label text-gold">Devnet</span>
        <span className="text-muted">
          {t("Token ini tidak punya nilai. Jangan kirim SOL mainnet.")}
        </span>
        <Link
          href="/docs"
          className="ml-auto uppercase tracking-label text-dim hover:text-gold"
        >
          {t("Cara mulai →")}
        </Link>
      </div>

      {pool.error ? (
        <div className="mb-3 border border-down/40 bg-ink-1 px-4 py-3 text-[11px] text-down">
          <span className="uppercase tracking-label">RPC error · </span>
          {pool.error}
          <span className="mt-1 block text-[10px] text-dim">
            {t(
              "Devnet RPC publik bisa membatasi laju. Coba refresh beberapa saat lagi.",
            )}
          </span>
        </div>
      ) : null}

      {history.error ? (
        <div className="mb-3 border border-line bg-ink-1 px-4 py-2 text-[10px] text-dim">
          <span className="uppercase tracking-label text-gold">
            {t("Riwayat tertunda · ")}
          </span>
          {t(
            "RPC publik sedang membatasi permintaan. Chart dan aktivitas memakai data terakhir yang tersimpan; refresh otomatis akan mencoba lagi.",
          )}
        </div>
      ) : null}

      <StatStrip snapshot={pool.data} />

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_350px] xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-3">
          <PriceChart
            events={events}
            loading={history.loading}
            progress={progress}
          />
        </div>
        <div className="flex flex-col gap-3">
          {pool.data ? (
            <MarketPanel snapshot={pool.data} events={events} />
          ) : (
            <Panel className="h-[420px] animate-pulseSoft" />
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {pool.data ? (
            <MassReserveBand snapshot={pool.data} events={events} />
          ) : (
            <Panel className="h-[260px] animate-pulseSoft" />
          )}
        </div>
        {pool.data ? (
          <OnChainPanel snapshot={pool.data} />
        ) : (
          <Panel className="animate-pulseSoft" />
        )}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <ActivityTable
            events={events}
            loading={history.loading}
            rows={8}
            subtitle={
              progress
                ? t("memuat {done}/{total} tx · 8 terbaru", {
                    done: progress.done,
                    total: progress.total,
                  })
                : t("8 event terbaru")
            }
          />
          <div className="mt-2 flex justify-end">
            <Link
              href="/activity"
              className="text-[10px] uppercase tracking-label text-dim hover:text-gold"
            >
              {t("Semua aktivitas →")}
            </Link>
          </div>
        </div>
        <Faq />
      </div>

      <section className="panel mt-3">
        <div className="border-b border-line px-4 py-5">
          <div className="label">{t("Prinsip")}</div>
          <p className="mt-2 max-w-[56ch] text-[18px] leading-snug text-fg">
            {t(
              "Tidak ada tombol withdraw. Itu bukan fitur yang belum dibuat. Itu desain.",
            )}
          </p>
          <Link
            href="/mass"
            className="mt-3 inline-block text-[10px] uppercase tracking-label text-gold hover:underline"
          >
            {t("Lihat mekanismenya →")}
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-px bg-line md:grid-cols-3">
          {PRINCIPLES.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group bg-ink-1 px-4 py-4 transition-colors duration-150 hover:bg-ink-2"
            >
              <div className="label">{t(item.kicker)}</div>
              <h2 className="mt-2 text-[12px] uppercase tracking-label text-fg group-hover:text-gold">
                {t(item.title)}
              </h2>
              <p className="mt-2 text-[10px] leading-relaxed text-muted">
                {t(item.text)}
              </p>
              <span className="mt-3 inline-block text-[9px] uppercase tracking-label text-dim group-hover:text-gold">
                {t(item.cta)} →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <PageMap />
    </>
  );
}
