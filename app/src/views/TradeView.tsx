"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { ActivityTable } from "@/components/ActivityTable";
import { useData } from "@/components/DataProvider";
import { PageIntro, StatCard, StatGrid } from "@/components/PageIntro";
import { PoolPanel } from "@/components/PoolPanel";
import { TradePanel } from "@/components/TradePanel";
import { Panel, PanelHeader } from "@/components/ui";
import { useBalances } from "@/hooks/useBalances";
import { SUPPLY_RAW, tierFor } from "@/lib/constants";
import { fmtPct, fmtPrice, fmtSolNumber, fmtToken } from "@/lib/format";
import type { HistoryEvent, PoolSnapshot } from "@/lib/types";

const PriceChart = dynamic(() => import("@/components/PriceChart"), {
  ssr: false,
  loading: () => <div className="panel h-[440px]" />,
});

type Side = "buy" | "sell";

export function TradeView() {
  const { pool, history, events, progress, refreshAll } = useData();
  const [initialSide, setInitialSide] = useState<Side>("buy");
  const [panelKey, setPanelKey] = useState(0);

  // Mobile bar mengarah ke /trade#buy atau /trade#sell.
  useEffect(() => {
    const apply = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash === "buy" || hash === "sell") {
        setInitialSide(hash);
        setPanelKey((k) => k + 1);
      }
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);

  return (
    <>
      <PageIntro
        kicker="Trade · Devnet"
        title="Beli atau jual INRT terhadap pool"
        description="Transaksi ditandatangani di wallet kamu. Fee 0,30% dipotong dari input dan masuk fee vault — reserve pool tidak pernah dipakai untuk fee."
        right={
          <Link href="/docs" className="btn btn-ghost">
            Cara beli →
          </Link>
        }
      />

      {pool.error ? (
        <div className="mb-3 border border-down/40 bg-ink-1 px-4 py-3 text-[11px] text-down">
          <span className="uppercase tracking-label">RPC error · </span>
          {pool.error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-3">
          <PriceChart
            events={events}
            loading={history.loading}
            progress={progress}
            heightClass="h-[340px] md:h-[440px]"
          />
          <WalletHint />
          <WalletActivity events={events} loading={history.loading} />
        </div>

        <div className="flex flex-col gap-3">
          {pool.data ? (
            <TradePanel
              key={panelKey}
              snapshot={pool.data}
              onDone={refreshAll}
              initialSide={initialSide}
            />
          ) : (
            <Panel className="h-[460px] animate-pulseSoft" />
          )}
          {pool.data ? <PositionPanel snapshot={pool.data} /> : null}
        </div>
      </div>

      {pool.data ? (
        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
          <PoolPanel snapshot={pool.data} />
          <Panel>
            <PanelHeader title="Cara kerja" subtitle="constant product" />
            <ol className="divide-y divide-lineSoft text-[11px] leading-relaxed text-muted">
              {[
                "Beli: SOL masuk reserve, token keluar dari vault. Harga naik sedikit.",
                "Jual: token kembali ke vault, SOL keluar reserve. Harga turun sedikit.",
                "Fee 0,30% selalu dipotong lebih dulu dan disimpan di fee vault terpisah.",
                "Fee itu nanti dibelanjakan lewat add_mass untuk menambah likuiditas permanen.",
              ].map((text, index) => (
                <li key={text} className="flex gap-3 px-4 py-3">
                  <span className="mono text-[10px] text-gold">
                    0{index + 1}
                  </span>
                  <span>{text}</span>
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      ) : null}
    </>
  );
}

function WalletHint() {
  const { publicKey } = useWallet();
  if (publicKey) return null;
  return (
    <div className="border border-line bg-ink-1 px-4 py-3 text-[10px] leading-relaxed text-dim">
      <span className="uppercase tracking-label text-gold">
        Wallet belum terhubung ·{" "}
      </span>
      Hubungkan Phantom atau Solflare (mode Devnet) untuk melihat saldo, tier,
      dan riwayat swap kamu.
    </div>
  );
}

function PositionPanel({ snapshot }: { snapshot: PoolSnapshot }) {
  const balances = useBalances();
  const bps = Number((balances.token * 10_000n) / SUPPLY_RAW);
  const tier = tierFor(bps);
  const valueSol =
    (Number(balances.token) / 1e6) *
    (Number(BigInt(snapshot.priceScaled)) / 1e15);

  return (
    <Panel>
      <PanelHeader title="Posisi kamu" subtitle="wallet terhubung" />
      <StatGrid>
        <StatCard
          label="Saldo SOL"
          value={`${fmtSolNumber(balances.sol)} SOL`}
          sub="Devnet"
        />
        <StatCard
          label="Saldo INRT"
          value={`${fmtToken(balances.token, 2)} INRT`}
          sub={`${fmtPct(bps, 3)} supply`}
          accent
        />
        <StatCard
          label="Nilai estimasi"
          value={`${fmtSolNumber(valueSol, true)} SOL`}
          sub={`@ ${fmtPrice(snapshot.priceScaled)} SOL`}
        />
        <StatCard
          label="Tier"
          value={tier.name}
          sub={bps > 0 ? "berdasarkan supply" : "butuh > 0,1% supply"}
        />
      </StatGrid>
    </Panel>
  );
}

function WalletActivity({
  events,
  loading,
}: {
  events: HistoryEvent[];
  loading: boolean;
}) {
  const { publicKey } = useWallet();
  if (!publicKey) return null;

  const owner = publicKey.toBase58();
  const mine = events.filter(
    (event) =>
      (event.kind === "buy" || event.kind === "sell") && event.wallet === owner,
  );

  return (
    <ActivityTable
      events={mine}
      loading={loading}
      rows={10}
      title="Riwayat wallet"
      subtitle={`${mine.length} swap dari wallet ini`}
      emptyText="Belum ada swap dari wallet ini"
      scroll={false}
    />
  );
}
