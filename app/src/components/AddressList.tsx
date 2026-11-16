"use client";

import { explorerAddress } from "@/lib/nav";
import { CopyButton } from "./CopyButton";
import { useI18n } from "./LanguageProvider";

export type AddressItem = {
  label: string;
  address: string;
  note?: string;
};

export function AddressList({ items }: { items: AddressItem[] }) {
  const { t } = useI18n();
  return (
    <ul className="divide-y divide-lineSoft">
      {items.map((item) => (
        <li
          key={item.label}
          className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
        >
          <div className="min-w-0">
            <div className="text-[9px] uppercase tracking-label text-dim">
              {t(item.label)}
            </div>
            <div className="mono mt-1 break-all text-[10px] text-fg sm:text-[11px]">
              {item.address}
            </div>
            {item.note ? (
              <div className="mt-0.5 text-[9px] text-dim">{item.note}</div>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <CopyButton value={item.address} />
            <a
              href={explorerAddress(item.address)}
              target="_blank"
              rel="noreferrer"
              className="chip py-1"
              aria-label={t("Buka {label} di explorer", {
                label: item.label,
              })}
            >
              {t("Explorer ↗")}
            </a>
          </div>
        </li>
      ))}
    </ul>
  );
}
