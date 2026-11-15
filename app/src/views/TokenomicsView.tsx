import Link from "next/link";
import { PageIntro, StatCard, StatGrid } from "@/components/PageIntro";
import { Panel, PanelHeader } from "@/components/ui";
import { fmtSolLamports, fmtTokenInt } from "@/lib/format";
import { MASS_CAP_BPS, MASS_RATIO_TOL_BPS, MIN_MASS_SOL } from "@/lib/constants";
import {
  ALLOCATIONS,
  LAUNCH,
  TIER_RATES,
  TOTAL_SUPPLY_RAW,
  VESTING,
} from "@/lib/tokenomics";

export function TokenomicsView() {
  return (
    <>
      <PageIntro
        kicker="Tokenomics · v1.1"
        title="50 juta INRT, tanpa burn, tanpa curve"
        description="Supply tetap dan seluruh fee kembali ke likuiditas. Alokasi di bawah adalah keputusan final; yang belum on-chain adalah diskon tier."
      />

      <StatGrid>
        <StatCard
          label="Total supply"
          value={`${fmtTokenInt(TOTAL_SUPPLY_RAW)} INRT`}
          sub="fixed · mint authority null"
        />
        <StatCard
          label="Harga awal (P0)"
          value={`${LAUNCH.priceSol} SOL`}
          sub={`${LAUNCH.poolToken} INRT di pool`}
          accent
        />
        <StatCard
          label="FDV saat launch"
          value={`${LAUNCH.fdvSol} SOL`}
          sub={`market cap pool ${LAUNCH.marketCapSol} SOL`}
        />
        <StatCard
          label="Fee swap"
          value="0,30%"
          sub="100% ke massa, 0% treasury"
        />
      </StatGrid>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel>
          <PanelHeader
            title="Alokasi"
            subtitle="6 kategori, total 100%"
            right={
              <span className="mono text-[10px] text-dim">
                {fmtTokenInt(TOTAL_SUPPLY_RAW)} INRT
              </span>
            }
          />
          <div className="divide-y divide-lineSoft">
            {ALLOCATIONS.map((item) => {
              const pct = Number((item.raw * 10_000n) / TOTAL_SUPPLY_RAW) / 100;
              return (
                <div key={item.name} className="px-4 py-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="flex items-center gap-2 text-[11px] text-fg">
                      {item.name}
                      {item.locked ? (
                        <span className="border border-gold/40 px-1 py-0.5 text-[8px] uppercase tracking-label text-gold">
                          terkunci
                        </span>
                      ) : null}
                    </span>
                    <span className="mono text-[11px] text-muted">
                      {fmtTokenInt(item.raw)} · {item.pct}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full border border-line bg-ink">
                    <div
                      className={item.locked ? "h-full bg-gold" : "h-full bg-muted"}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-[10px] text-dim">{item.note}</p>
                </div>
              );
            })}
          </div>
        </Panel>

        <div className="flex flex-col gap-3">
          <Panel>
            <PanelHeader title="Ke mana fee pergi" subtitle="per swap" />
            <div className="divide-y divide-lineSoft text-[11px] text-muted">
              <div className="flex justify-between px-4 py-2.5">
                <span>Dipotong dari input</span>
                <span className="mono text-fg">0,30%</span>
              </div>
              <div className="flex justify-between px-4 py-2.5">
                <span>Masuk fee vault</span>
                <span className="mono text-fg">100%</span>
              </div>
              <div className="flex justify-between px-4 py-2.5">
                <span>Ke treasury</span>
                <span className="mono text-fg">0%</span>
              </div>
              <div className="flex justify-between px-4 py-2.5">
                <span>Mengurangi reserve pool</span>
                <span className="mono text-fg">tidak</span>
              </div>
            </div>
            <p className="border-t border-line px-4 py-3 text-[10px] leading-relaxed text-dim">
              Fee menambah konstanta <span className="mono">k</span> sedikit
              setiap swap. Likuiditas tumbuh tanpa mencetak token baru.
            </p>
          </Panel>

          <Panel>
            <PanelHeader title="Tidak ada burn" subtitle="keputusan v1" />
            <p className="px-4 py-3 text-[10px] leading-relaxed text-muted">
              Tidak ada instruksi burn, tidak ada deflasi pura-pura. Nilai
              datang dari kedalaman likuiditas dan fee yang kembali ke pool,
              bukan dari supply yang menyusut.
            </p>
          </Panel>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Panel>
          <PanelHeader
            title="Tier holder"
            subtitle="rencana diskon fee"
            right={
              <span className="border border-line px-1.5 py-0.5 text-[8px] uppercase tracking-label text-dim">
                belum aktif
              </span>
            }
          />
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                {["Tier", "Supply", "Fee"].map((head) => (
                  <th
                    key={head}
                    className="px-4 py-2 text-[9px] font-normal uppercase tracking-label text-dim"
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIER_RATES.map((tier) => (
                <tr key={tier.name} className="border-b border-lineSoft last:border-0">
                  <td className="px-4 py-2.5 text-[10px] uppercase tracking-label text-fg">
                    {tier.name}
                  </td>
                  <td className="mono px-4 py-2.5 text-[10px] text-muted">
                    {tier.range}
                  </td>
                  <td className="mono px-4 py-2.5 text-[10px]">
                    <span className={tier.active ? "text-fg" : "text-dim"}>
                      {tier.fee}
                    </span>
                    {tier.active ? null : (
                      <span className="ml-1 text-[8px] text-dim">*</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-line px-4 py-2.5 text-[9px] leading-relaxed text-dim">
            * Diskon tier belum diimplementasikan: program v1 memakai fee tetap
            30 bps dan tidak bisa diubah. Tier saat ini hanya label status.
          </p>
        </Panel>

        <Panel>
          <PanelHeader title="Vesting & peredaran" subtitle="batas maksimum" />
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                {["Waktu", "Beredar", "% supply"].map((head) => (
                  <th
                    key={head}
                    className="px-4 py-2 text-[9px] font-normal uppercase tracking-label text-dim"
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {VESTING.map((row) => (
                <tr key={row.time} className="border-b border-lineSoft last:border-0">
                  <td className="px-4 py-2.5 text-[10px] text-muted">{row.time}</td>
                  <td className="mono px-4 py-2.5 text-[10px] text-fg">
                    {row.circulating}
                  </td>
                  <td className="mono px-4 py-2.5 text-[10px] text-muted">
                    {row.pct}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-line px-4 py-2.5 text-[9px] leading-relaxed text-dim">
            Gerbang Mass II: token treasury/tim tidak masuk peredaran sebelum
            pool mencapai 100 SOL. Cap unlock 1.500.000 token per bulan.
          </p>
        </Panel>
      </div>

      <section id="mass" className="mt-3 scroll-mt-20">
        <Panel>
          <PanelHeader
            title="Kebijakan Mass Reserve"
            subtitle="20% supply"
            right={
              <Link href="/mass" className="chip py-1">
                Status live →
              </Link>
            }
          />
          <div className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Alokasi awal"
              value="10.000.000 INRT"
              sub="hanya untuk add_mass"
            />
            <StatCard
              label="Minimum per panggilan"
              value={`${fmtSolLamports(MIN_MASS_SOL)} SOL`}
              sub="dari fee vault"
            />
            <StatCard
              label="Maksimum per panggilan"
              value={`${MASS_CAP_BPS / 100}% sisa reserve`}
              sub="500.000 INRT di awal"
            />
            <StatCard
              label="Toleransi rasio"
              value={`${MASS_RATIO_TOL_BPS} bps`}
              sub="harga tidak bergeser > 0,5%"
            />
          </div>
        </Panel>
      </section>
    </>
  );
}
