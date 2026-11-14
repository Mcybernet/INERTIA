import { fmtSolNumber, fmtTime, fmtToken } from "@/lib/format";
import type { HistoryEvent } from "@/lib/types";
import { Empty, Panel, PanelHeader, Skeleton } from "./ui";

function badge(kind: HistoryEvent["kind"]) {
  switch (kind) {
    case "buy":
      return { label: "BELI", cls: "border-up/50 text-up" };
    case "sell":
      return { label: "JUAL", cls: "border-down/50 text-down" };
    case "mass":
      return { label: "MASSA", cls: "border-gold/50 text-gold" };
    default:
      return { label: "SEED", cls: "border-line text-muted" };
  }
}

export function ActivityTable({
  events,
  loading,
}: {
  events: HistoryEvent[];
  loading: boolean;
}) {
  const rows = [...events].reverse().slice(0, 30);

  return (
    <Panel>
      <PanelHeader
        title="Aktivitas"
        subtitle={`${events.length} event on-chain`}
        right={
          <span className="text-[10px] tracking-label text-dim">
            SWAP · MASSA · SEED
          </span>
        }
      />
      <div className="max-h-[340px] overflow-auto">
        <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 z-10 bg-ink-1">
            <tr className="border-b border-line">
              {["Waktu", "Tipe", "INRT", "SOL", "Harga", "Wallet"].map((h) => (
                <th
                  key={h}
                  className="px-3 py-2 text-[9px] font-normal uppercase tracking-label text-dim"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0
              ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-lineSoft">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-3 py-3">
                        <Skeleton className="w-14" />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.map((event) => {
                  const b = badge(event.kind);
                  const wallet =
                    event.kind === "seed"
                      ? "—"
                      : event.kind === "mass"
                        ? event.caller
                        : event.wallet;
                  const tokenAmount = event.tokenAmount;
                  const solAmount =
                    event.kind === "buy" || event.kind === "sell"
                      ? event.solUser
                      : event.solAmount;
                  return (
                    <tr
                      key={`${event.sig}-${event.kind}-${event.timestamp}`}
                      className="border-b border-lineSoft last:border-0"
                    >
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <a
                          href={`https://explorer.solana.com/tx/${event.sig}?cluster=devnet`}
                          target="_blank"
                          rel="noreferrer"
                          className="mono text-[11px] text-muted hover:text-gold"
                          title={event.sig}
                        >
                          {fmtTime(event.timestamp)}
                        </a>
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`border px-1.5 py-0.5 text-[9px] tracking-label ${b.cls}`}
                        >
                          {b.label}
                        </span>
                      </td>
                      <td className="mono whitespace-nowrap px-3 py-2.5 text-[11px] text-fg">
                        {fmtToken(tokenAmount, 2)}
                      </td>
                      <td className="mono whitespace-nowrap px-3 py-2.5 text-[11px] text-muted">
                        {fmtSolNumber(Number(BigInt(solAmount)) / 1e9, true)}
                      </td>
                      <td className="mono whitespace-nowrap px-3 py-2.5 text-[11px] text-muted">
                        {fmtSolNumber(
                          Number(BigInt(event.priceAfter)) / 1e15,
                          true,
                        )}
                      </td>
                      <td className="mono whitespace-nowrap px-3 py-2.5 text-[11px] text-dim">
                        {wallet === "—" ? (
                          "—"
                        ) : (
                          <a
                            href={`https://explorer.solana.com/address/${wallet}?cluster=devnet`}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:text-gold"
                          >
                            {wallet.slice(0, 4)}…{wallet.slice(-4)}
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
        {!loading && rows.length === 0 ? (
          <Empty text="Belum ada aktivitas swap" />
        ) : null}
      </div>
    </Panel>
  );
}
