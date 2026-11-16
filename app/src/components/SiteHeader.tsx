"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { NAV } from "@/lib/nav";
import { shortAddr } from "@/lib/format";
import { POOL_LABEL } from "@/lib/constants";
import { useData } from "./DataProvider";
import { useI18n } from "./LanguageProvider";
import { Logo } from "./Logo";

/** `usePathname()` bisa menyertakan basePath GitHub Pages. */
function normalize(pathname: string): string {
  const clean = pathname.replace(/^\/INERTIA(?=\/|$)/, "");
  return clean.replace(/\/+$/, "") || "/";
}

export function SiteHeader() {
  const pathname = usePathname();
  const active = normalize(pathname ?? "/");
  const { pool, refreshing, refreshAll } = useData();
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink">
      <div className="mx-auto flex h-14 max-w-[1480px] items-center gap-3 px-4 lg:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5"
          aria-label="INERTIA · Overview"
        >
          <Logo size={24} />
          <span className="text-[12px] font-medium tracking-[0.24em] text-fg">
            INERTIA
          </span>
          <span className="hidden text-[9px] tracking-label text-dim sm:inline">
            INRT
          </span>
        </Link>

        <span className="hidden border border-gold/50 px-1.5 py-0.5 text-[8px] uppercase tracking-label text-gold sm:inline">
          Devnet
        </span>
        <span className="hidden border border-line px-1.5 py-0.5 text-[8px] uppercase tracking-label text-dim lg:inline">
          {POOL_LABEL}
        </span>

        <nav
          aria-label={t("Navigasi utama")}
          className="ml-2 hidden h-14 items-stretch lg:flex"
        >
          {NAV.map((item) => {
            const isActive =
              item.href === "/" ? active === "/" : active === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center border-b-2 px-3 text-[10px] uppercase tracking-label transition-colors ${
                  isActive
                    ? "border-gold text-gold"
                    : "border-transparent text-muted hover:text-fg"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          {pool.data ? (
            <a
              href={`https://explorer.solana.com/address/${pool.data.pool}?cluster=devnet`}
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-2 border border-line px-2 py-1.5 text-[10px] tracking-label text-muted transition-colors hover:border-gold hover:text-gold xl:flex"
              title={t("Pool di Solana Explorer")}
            >
              <span className="h-1 w-1 bg-up" />
              POOL {shortAddr(pool.data.pool, 4)}
            </a>
          ) : null}

          <span className="hidden text-[10px] tracking-label text-dim lg:inline">
            {pool.data?.fetchedAt
              ? `SYNC ${new Date(pool.data.fetchedAt).toLocaleTimeString(
                  lang === "en" ? "en-US" : "id-ID",
                )}`
              : "SYNC"}
          </span>

          <div
            role="group"
            aria-label={t("Ganti bahasa")}
            className="flex h-[34px] items-stretch border border-line"
          >
            {(["id", "en"] as const).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setLang(code)}
                aria-pressed={lang === code}
                className={`px-1.5 text-[9px] uppercase tracking-label transition-colors ${
                  lang === code
                    ? "bg-gold/10 text-gold"
                    : "text-dim hover:text-fg"
                }`}
              >
                {code}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => void refreshAll()}
            disabled={refreshing}
            aria-label={t("Muat ulang data on-chain")}
            title={t("Muat ulang data")}
            className="btn btn-ghost hidden h-[34px] px-2.5 sm:inline-flex"
          >
            <span className={refreshing ? "animate-pulseSoft" : ""}>↻</span>
          </button>

          <WalletMultiButton />

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? t("Tutup navigasi") : t("Buka navigasi")}
            aria-expanded={open}
            aria-controls="nav-mobile"
            className="btn btn-ghost h-[34px] px-2.5 lg:hidden"
          >
            <span aria-hidden>{open ? "✕" : "☰"}</span>
          </button>
        </div>
      </div>

      {open ? (
        <nav
          id="nav-mobile"
          aria-label={t("Navigasi utama mobile")}
          className="border-t border-line bg-ink-1 lg:hidden"
        >
          <ul className="grid grid-cols-2 gap-px bg-line">
            {NAV.map((item) => {
              const isActive =
                item.href === "/" ? active === "/" : active === item.href;
              return (
                <li key={item.href} className="bg-ink-1">
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex h-11 items-center justify-between px-4 text-[10px] uppercase tracking-label ${
                      isActive ? "text-gold" : "text-muted"
                    }`}
                  >
                    {item.label}
                    <span className="mono text-[9px] text-dim">
                      {item.short}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-2 text-[9px] uppercase tracking-label text-dim">
            <span>{t("Solana Devnet · tanpa bonding curve")}</span>
            <span className="mono">{t("fee 0,30% → massa")}</span>
            <button
              type="button"
              onClick={() => void refreshAll()}
              disabled={refreshing}
              className="chip py-1 normal-case tracking-normal"
            >
              {refreshing ? t("Memuat…") : t("Muat ulang data")}
            </button>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
