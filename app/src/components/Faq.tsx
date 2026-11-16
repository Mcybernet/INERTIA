"use client";

import { useI18n } from "./LanguageProvider";
import { Panel, PanelHeader } from "./ui";

const ITEMS = [
  {
    q: "Kenapa harga kadang tidak bergerak?",
    a: "Harga hanya berubah saat ada swap. Jam tanpa transaksi tetap digambar sebagai candle flat, jadi grafik tidak bolong. Itu bukan tanda chart rusak.",
  },
  {
    q: "Siapa yang bisa menarik likuiditas?",
    a: "Tidak ada instruksi withdraw di program. Token hanya keluar dari Mass Reserve lewat add_mass, dan itu menambah likuiditas pool, bukan menguranginya.",
  },
  {
    q: "Ke mana fee 0,30% pergi?",
    a: "Fee dipotong dari input, disimpan di fee vault terpisah, lalu dipakai keeper untuk add_mass setelah mencapai 1 SOL + rent. Owner tidak bisa mengambilnya langsung.",
  },
  {
    q: "Apakah ini mainnet?",
    a: "Bukan. Semua alamat di halaman ini ada di Solana Devnet. INRT tidak punya nilai dan tidak dijual.",
  },
];

export function Faq() {
  const { t } = useI18n();
  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader
        title={t("Pertanyaan singkat")}
        subtitle={t("4 hal")}
      />
      <div className="flex-1">
        {ITEMS.map((item) => (
          <details
            key={item.q}
            className="group border-b border-lineSoft last:border-0"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[11px] leading-snug text-fg transition-colors hover:text-gold [&::-webkit-details-marker]:hidden">
              {t(item.q)}
              <span className="mono shrink-0 text-gold group-open:hidden">
                +
              </span>
              <span className="mono hidden shrink-0 text-gold group-open:inline">
                −
              </span>
            </summary>
            <p className="px-4 pb-3 text-[10px] leading-relaxed text-muted">
              {t(item.a)}
            </p>
          </details>
        ))}
      </div>
    </Panel>
  );
}
