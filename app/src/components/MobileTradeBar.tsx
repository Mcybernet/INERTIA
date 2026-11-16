"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "./LanguageProvider";

/** Akses cepat beli/jual di mobile: selalu terjangkau, tanpa scroll. */
export function MobileTradeBar() {
  const pathname = usePathname();
  const { t } = useI18n();
  const path = (pathname ?? "").replace(/^\/INERTIA(?=\/|$)/, "");
  if (path.startsWith("/trade")) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-2 gap-px border-t border-line bg-line pb-[env(safe-area-inset-bottom)] lg:hidden">
      <Link
        href="/trade#buy"
        className="flex h-12 items-center justify-center bg-ink text-[11px] uppercase tracking-label text-up"
      >
        {t("Beli INRT")}
      </Link>
      <Link
        href="/trade#sell"
        className="flex h-12 items-center justify-center bg-ink text-[11px] uppercase tracking-label text-down"
      >
        {t("Jual INRT")}
      </Link>
    </div>
  );
}
