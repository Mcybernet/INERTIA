"use client";

import Link from "next/link";
import { useI18n } from "./LanguageProvider";

const PAGES = [
  {
    n: "01",
    label: "Transaksi",
    title: "Trade",
    text: "Beli atau jual terhadap pool, lengkap dengan quote dan slippage.",
    href: "/trade",
  },
  {
    n: "02",
    label: "Likuiditas",
    title: "Mass",
    text: "Reserve, aturan add_mass, dan riwayat massa.",
    href: "/mass",
  },
  {
    n: "03",
    label: "Distribusi",
    title: "Holders",
    text: "Pemegang INRT, tier, dan wallet terbesar.",
    href: "/holders",
  },
  {
    n: "04",
    label: "Kebijakan",
    title: "Tokenomics",
    text: "Supply, alokasi, fee, dan kebijakan massa.",
    href: "/tokenomics",
  },
  {
    n: "05",
    label: "Panduan",
    title: "Docs",
    text: "Cara mulai, wallet Devnet, dan verifikasi on-chain.",
    href: "/docs",
  },
];

export function PageMap() {
  const { t } = useI18n();
  return (
    <>
      <div className="mt-4 flex items-baseline justify-between gap-3">
        <span className="label">{t("Jelajahi")}</span>
        <span className="text-[9px] uppercase tracking-label text-dim">
          {t("{n} halaman", { n: PAGES.length })}
        </span>
      </div>
      <div className="mt-2 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-5">
        {PAGES.map((page) => (
          <Link
            key={page.href}
            href={page.href}
            className="group flex flex-col bg-ink-1 px-4 py-3 transition-colors hover:bg-ink-2"
          >
            <div className="flex items-center justify-between gap-2 text-[9px] uppercase tracking-label text-dim">
              <span>{t(page.label)}</span>
              <span className="mono">{page.n}</span>
            </div>
            <div className="mt-1.5 text-[12px] uppercase tracking-label text-fg group-hover:text-gold">
              {page.title}
            </div>
            <p className="mt-1.5 text-[10px] leading-relaxed text-muted">
              {t(page.text)}
            </p>
            <span className="mt-2 text-[9px] uppercase tracking-label text-dim group-hover:text-gold">
              {t("Buka →")}
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}
