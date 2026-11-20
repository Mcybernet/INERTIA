"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { NAV } from "@/lib/nav";
import { shortAddr } from "@/lib/format";
import { POOL_LABEL } from "@/lib/constants";
import { useData } from "./DataProvider";
import { useI18n } from "./LanguageProvider";
import { WalletDrawer } from "./WalletDrawer";

/** `usePathname()` bisa menyertakan basePath GitHub Pages. */
function normalize(pathname: string): string {
  const clean = pathname.replace(/^\/INERTIA(?=\/|$)/, "");
  return clean.replace(/\/+$/, "") || "/";
}

/** Switcher bahasa dipakai di header desktop dan di menu mobile. */
function LangSwitch({ className }: { className: string }) {
  const { lang, setLang, t } = useI18n();
  return (
    <div
      role="group"
      aria-label={t("Ganti bahasa")}
      className={`items-stretch border border-line ${className}`}
    >
      {(["id", "en"] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          className={`px-1.5 text-[9px] uppercase tracking-label transition-colors ${
            lang === code ? "bg-gold/10 text-gold" : "text-dim hover:text-fg"
          }`}
        >
          {code}
        </button>
      ))}
    </div>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const active = normalize(pathname ?? "/");
  const { pool, refreshing, refreshAll } = useData();
  const { lang, t } = useI18n();
  const { publicKey } = useWallet();
  const [open, setOpen] = useState(false);
  const [navClosing, setNavClosing] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const navClosingRef = useRef(false);
  const navTimerRef = useRef<number | null>(null);
  const closeWallet = useCallback(() => setWalletOpen(false), []);

  const requestCloseNav = useCallback(() => {
    if (navClosingRef.current) return;
    navClosingRef.current = true;
    setNavClosing(true);
    navTimerRef.current = window.setTimeout(() => {
      setOpen(false);
      setNavClosing(false);
      navClosingRef.current = false;
    }, 180);
  }, []);

  const toggleNav = useCallback(() => {
    if (open) requestCloseNav();
    else setOpen(true);
  }, [open, requestCloseNav]);

  useEffect(() => {
    setOpen(false);
    setNavClosing(false);
    navClosingRef.current = false;
    setWalletOpen(false);
  }, [pathname]);

  useEffect(() => {
    return () => {
      if (navTimerRef.current !== null) window.clearTimeout(navTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        requestCloseNav();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, requestCloseNav]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink">
      <div className="mx-auto flex h-14 max-w-[1480px] items-center gap-3 px-4 lg:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5"
          aria-label="INERTIA · Overview"
        >
          <img
            src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/inertia-logo.png`}
            alt=""
            width={24}
            height={24}
            className="h-6 w-6 shrink-0"
            decoding="async"
          />
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

          <LangSwitch className="hidden h-[34px] sm:flex" />

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

          <button
            type="button"
            onClick={() => setWalletOpen(true)}
            aria-label={t("Buka dompet")}
            title={
              publicKey ? `${t("Dompet")} ${shortAddr(publicKey.toBase58(), 4)}` : t("Buka dompet")
            }
            className="btn btn-ghost h-[34px] px-2 sm:px-2.5"
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
              aria-hidden="true"
              className="h-4 w-4 sm:hidden"
            >
              <path d="M2.5 6.5h13a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2Z" />
              <path d="M2.5 6.5v-2h10" />
              <path d="M12.5 11.5h5" />
            </svg>
            <span className="hidden sm:inline">{t("Dompet")}</span>
          </button>

          <WalletMultiButton />

          <button
            type="button"
            onClick={toggleNav}
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
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label={t("Tutup navigasi")}
            onClick={requestCloseNav}
            className={`absolute inset-0 bg-ink/80 ${
              navClosing
                ? "motion-safe:animate-fadeOut"
                : "motion-safe:animate-fadeIn"
            }`}
          />

          <nav
            id="nav-mobile"
            aria-label={t("Navigasi utama mobile")}
            className={`absolute left-0 top-0 flex h-full w-1/2 flex-col overflow-y-auto border-r border-line bg-ink-1 ${
              navClosing
                ? "motion-safe:animate-navOut"
                : "motion-safe:animate-navIn"
            }`}
          >
            <ul className="grid grid-cols-1 gap-px bg-line">
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
            <div className="mt-auto flex flex-col gap-2 border-t border-line px-4 py-3 text-[9px] uppercase tracking-label text-dim">
              <span>{t("Solana Devnet · tanpa bonding curve")}</span>
              <span className="mono">{t("fee 0,30% → massa")}</span>
              <LangSwitch className="flex h-7" />
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
        </div>
      ) : null}

      {walletOpen ? <WalletDrawer onClose={closeWallet} /> : null}
    </header>
  );
}
