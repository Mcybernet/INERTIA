"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Logo } from "./Logo";
import { shortAddr } from "@/lib/format";

export function TopBar({
  poolAddress,
  updatedAt,
  refreshing,
  onRefresh,
}: {
  poolAddress?: string;
  updatedAt?: number;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink">
      <div className="mx-auto flex h-14 max-w-[1480px] items-center justify-between gap-4 px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <Logo size={26} />
          <span className="text-[13px] font-medium tracking-[0.26em] text-fg">
            INERTIA
          </span>
          <span className="hidden text-[10px] tracking-label text-dim sm:inline">
            INRT
          </span>
          <span className="ml-1 border border-gold/50 px-1.5 py-0.5 text-[9px] uppercase tracking-label text-gold">
            Devnet
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {poolAddress ? (
            <a
              href={`https://explorer.solana.com/address/${poolAddress}?cluster=devnet`}
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-2 border border-line px-2 py-1.5 text-[10px] tracking-label text-muted transition-colors hover:border-gold hover:text-gold md:flex"
              title="Pool di Solana Explorer"
            >
              <span className="h-1 w-1 bg-up" />
              POOL {shortAddr(poolAddress, 4)}
            </a>
          ) : null}

          <span className="hidden text-[10px] tracking-label text-dim lg:inline">
            {updatedAt
              ? `SYNC ${new Date(updatedAt).toLocaleTimeString("id-ID")}`
              : "SYNC —"}
          </span>

          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="btn btn-ghost h-[34px] px-3 text-[10px]"
            title="Muat ulang data"
          >
            <span className={refreshing ? "animate-pulseSoft" : ""}>↻</span>
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <WalletMultiButton />
        </div>
      </div>
    </header>
  );
}
