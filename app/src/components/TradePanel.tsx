"use client";

import { useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import {
  DEFAULT_SLIPPAGE_BPS,
  SLIPPAGE_OPTIONS,
  SUPPLY_RAW,
  TX_DEADLINE_SECONDS,
  tierFor,
} from "@/lib/constants";
import { fmtSolNumber, fmtToken, fmtPct } from "@/lib/format";
import { getPoolSnapshot } from "@/lib/data";
import {
  priceImpactBps,
  quoteBuy,
  quoteSell,
  withSlippage,
} from "@/lib/math";
import type { PoolSnapshot } from "@/lib/types";
import { buildSwapTransaction, explorerTx } from "@/lib/tx";
import { formatUnitsInput, parseUnits } from "@/lib/units";
import { useBalances } from "@/hooks/useBalances";
import { Panel } from "./ui";

type Side = "buy" | "sell";

type Notice = {
  kind: "ok" | "err";
  text: string;
  sig?: string;
};

function friendlyError(message: string): string {
  if (/user rejected|rejected the request|User rejected/i.test(message)) {
    return "Transaksi dibatalkan di wallet.";
  }
  if (/insufficient (funds|lamports)|0x1\b/i.test(message)) {
    return "Saldo tidak cukup untuk nominal + fee + sewa ATA.";
  }
  if (/slippage|SlippageExceeded/i.test(message)) {
    return "Harga bergerak melewati slippage. Coba lagi atau naikkan slippage.";
  }
  if (/blockhash not found|BlockhashNotFound/i.test(message)) {
    return "Blockhash kedaluwarsa. Coba lagi.";
  }
  return message.length > 240 ? `${message.slice(0, 240)}…` : message;
}

function DetailRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2">
      <span className="text-[10px] uppercase tracking-label text-dim">
        {label}
      </span>
      <span
        className={`mono text-[11px] ${strong ? "text-gold" : "text-fg"}`}
      >
        {value}
      </span>
    </div>
  );
}

export function TradePanel({
  snapshot,
  onDone,
  initialSide = "buy",
}: {
  snapshot: PoolSnapshot;
  onDone: () => void;
  initialSide?: Side;
}) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const balances = useBalances();

  const [side, setSide] = useState<Side>(initialSide);
  const [amount, setAmount] = useState("");
  const [slippage, setSlippage] = useState<number>(DEFAULT_SLIPPAGE_BPS);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const math = useMemo(() => {
    const tokenReserve = BigInt(snapshot.tokenReserve);
    const solReserve = BigInt(snapshot.solReserve);
    const amountIn = parseUnits(amount, side === "buy" ? 9 : 6);
    if (!amountIn || amountIn <= 0n) return null;

    if (side === "buy") {
      const quote = quoteBuy(tokenReserve, solReserve, snapshot.feeBps, amountIn);
      if (!quote) return null;
      return {
        amountIn,
        out: quote.out,
        fee: quote.fee,
        net: quote.netIn,
        minOut: withSlippage(quote.out, slippage),
        impact: priceImpactBps("buy", amountIn, tokenReserve, solReserve),
      };
    }
    const quote = quoteSell(tokenReserve, solReserve, snapshot.feeBps, amountIn);
    if (!quote) return null;
    return {
      amountIn,
      out: quote.net,
      fee: quote.fee,
      net: quote.gross,
      minOut: withSlippage(quote.net, slippage),
      impact: priceImpactBps("sell", amountIn, tokenReserve, solReserve),
    };
  }, [amount, side, slippage, snapshot]);

  const tier = tierFor(Number((balances.token * 10_000n) / SUPPLY_RAW));
  const feePercent = `${(snapshot.feeBps / 100).toLocaleString("id-ID", {
    minimumFractionDigits: 2,
  })}%`;

  const insufficient =
    side === "buy"
      ? math !== null && balances.sol < fmtAmountSol(math.amountIn) + 0.005
      : math !== null && balances.token < math.amountIn;

  const canSubmit =
    publicKey !== null &&
    math !== null &&
    !busy &&
    !insufficient &&
    balances.sol > 0.001 &&
    (side === "buy" || balances.token >= math.amountIn);

  function setMax() {
    if (side === "buy") {
      const max = Math.max(0, balances.sol - 0.01);
      const floored = Math.floor(max * 10_000) / 10_000;
      setAmount(floored > 0 ? floored.toFixed(4) : "");
    } else {
      setAmount(
        balances.token > 0n
          ? formatUnitsInput(balances.token, 6)
          : "",
      );
    }
    setNotice(null);
  }

  async function submit() {
    if (!publicKey || !math) return;
    setBusy(true);
    setNotice(null);
    try {
      const fresh = (await getPoolSnapshot(true)) as PoolSnapshot & {
        error?: string;
      };
      if (fresh.error) {
        throw new Error(fresh.error ?? "gagal memuat state pool terbaru");
      }

      const tokenReserve = BigInt(fresh.tokenReserve);
      const solReserve = BigInt(fresh.solReserve);
      let out: bigint;
      if (side === "buy") {
        const q = quoteBuy(
          tokenReserve,
          solReserve,
          fresh.feeBps,
          math.amountIn,
        );
        if (!q) throw new Error("quote beli tidak tersedia pada state terbaru");
        out = q.out;
      } else {
        const q = quoteSell(
          tokenReserve,
          solReserve,
          fresh.feeBps,
          math.amountIn,
        );
        if (!q) throw new Error("quote jual tidak tersedia pada state terbaru");
        out = q.net;
      }

      const tx = buildSwapTransaction({
        trader: publicKey,
        direction: side,
        amountIn: math.amountIn,
        minAmountOut: withSlippage(out, slippage),
        deadline: Math.floor(Date.now() / 1000) + TX_DEADLINE_SECONDS,
        pool: fresh,
      });

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");
      tx.feePayer = publicKey;
      tx.recentBlockhash = blockhash;

      const signature = await sendTransaction(tx, connection, {
        skipPreflight: false,
        maxRetries: 3,
      });
      const confirmation = await connection.confirmTransaction(
        { signature, blockhash, lastValidBlockHeight },
        "confirmed",
      );
      if (confirmation.value.err) {
        throw new Error(
          `transaksi gagal: ${JSON.stringify(confirmation.value.err)}`,
        );
      }

      setNotice({
        kind: "ok",
        text:
          side === "buy"
            ? `Beli ${fmtSolNumber(Number(math.amountIn) / 1e9, true)} SOL berhasil dikonfirmasi.`
            : `Jual ${fmtToken(math.amountIn, 6)} INRT berhasil dikonfirmasi.`,
        sig: signature,
      });
      setAmount("");
      balances.refresh();
      onDone();
    } catch (err) {
      setNotice({
        kind: "err",
        text: friendlyError(
          err instanceof Error ? err.message : String(err),
        ),
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel>
      <div className="grid grid-cols-2 border-b border-line">
        {(["buy", "sell"] as Side[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setSide(s);
              setAmount("");
              setNotice(null);
            }}
            className={`h-11 text-[11px] uppercase tracking-label transition-colors ${
              side === s
                ? s === "buy"
                  ? "border-b-2 border-up text-up"
                  : "border-b-2 border-down text-down"
                : "border-b-2 border-transparent text-muted hover:text-fg"
            }`}
          >
            {s === "buy" ? "Beli" : "Jual"}
          </button>
        ))}
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="label">
            {side === "buy" ? "Bayar dengan SOL" : "Jual INRT"}
          </span>
          <button
            type="button"
            onClick={setMax}
            className="mono text-[10px] text-muted hover:text-gold"
            title="Pakai saldo maksimum"
          >
            {side === "buy"
              ? `${fmtSolNumber(balances.sol)} SOL`
              : `${fmtToken(balances.token, 2)} INRT`}{" "}
            · MAX
          </button>
        </div>

        <div className="relative">
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setNotice(null);
            }}
            placeholder="0.00"
            className="input pr-16"
            aria-label={
              side === "buy" ? "Jumlah SOL" : "Jumlah token INRT"
            }
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] tracking-label text-muted">
            {side === "buy" ? "SOL" : "INRT"}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {(side === "buy"
            ? [
                { label: "0,01", value: "0.01" },
                { label: "0,05", value: "0.05" },
                { label: "0,1", value: "0.1" },
                { label: "0,5", value: "0.5" },
              ]
            : [
                { label: "25%", value: 25 },
                { label: "50%", value: 50 },
                { label: "75%", value: 75 },
                { label: "100%", value: 100 },
              ]
          ).map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                setNotice(null);
                if (side === "buy") {
                  setAmount(item.value as string);
                } else {
                  const pct = BigInt(item.value as number);
                  const raw = (balances.token * pct) / 100n;
                  setAmount(raw > 0n ? formatUnitsInput(raw, 6) : "");
                }
              }}
              className="chip py-1.5 text-center"
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="divide-y divide-lineSoft border border-lineSoft">
          <DetailRow
            label="Kamu bayar"
            value={
              math
                ? side === "buy"
                  ? `${fmtSolNumber(Number(math.amountIn) / 1e9, true)} SOL`
                  : `${fmtToken(math.amountIn, 6)} INRT`
                : "—"
            }
          />
          <DetailRow
            label="Kamu terima (estimasi)"
            value={
              math
                ? side === "buy"
                  ? `${fmtToken(math.out, 2)} INRT`
                  : `${fmtSolNumber(Number(math.out) / 1e9, true)} SOL`
                : "—"
            }
            strong
          />
          <DetailRow
            label={`Fee ${feePercent}`}
            value={
              math ? `${fmtSolNumber(Number(math.fee) / 1e9, true)} SOL` : "—"
            }
          />
          <DetailRow
            label="Price impact"
            value={math ? fmtPct(math.impact) : "—"}
          />
          <DetailRow
            label={`Min. diterima (slip ${fmtPct(slippage, 1)})`}
            value={
              math
                ? side === "buy"
                  ? `${fmtToken(math.minOut, 2)} INRT`
                  : `${fmtSolNumber(Number(math.minOut) / 1e9, true)} SOL`
                : "—"
            }
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="label">Slippage</span>
          <div className="flex gap-1.5">
            {SLIPPAGE_OPTIONS.map((bps) => (
              <button
                key={bps}
                type="button"
                onClick={() => setSlippage(bps)}
                className={`chip py-1 ${
                  slippage === bps ? "chip-active" : ""
                }`}
              >
                {fmtPct(bps, 1)}
              </button>
            ))}
          </div>
        </div>

        {publicKey ? (
          <div className="flex items-center justify-between border border-lineSoft px-3 py-2">
            <span className="text-[9px] uppercase tracking-label text-dim">
              Tier wallet
            </span>
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] uppercase tracking-label"
                style={{ color: tier.color }}
              >
                {tier.name}
              </span>
              <span className="mono text-[10px] text-dim">
                {fmtPct(
                  Number((balances.token * 10_000n) / SUPPLY_RAW),
                  3,
                )}
              </span>
            </div>
          </div>
        ) : null}

        {insufficient ? (
          <p className="border border-down/40 px-3 py-2 text-[10px] leading-relaxed text-down">
            Saldo tidak cukup. Sisakan SOL untuk fee jaringan dan sewa ATA
            (sekitar 0,003 SOL).
          </p>
        ) : null}

        {notice ? (
          <div
            className={`border px-3 py-2 text-[10px] leading-relaxed ${
              notice.kind === "ok"
                ? "border-up/40 text-up"
                : "border-down/40 text-down"
            }`}
          >
            <p>{notice.text}</p>
            {notice.sig ? (
              <a
                href={explorerTx(notice.sig)}
                target="_blank"
                rel="noreferrer"
                className="mono mt-1 inline-block underline decoration-dotted hover:text-gold"
              >
                {notice.sig.slice(0, 20)}… ↗
              </a>
            ) : null}
          </div>
        ) : null}

        {publicKey ? (
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className={`btn h-11 w-full ${
              side === "buy" ? "btn-up" : "btn-down"
            }`}
          >
            {busy
              ? "Memproses…"
              : side === "buy"
                ? "Beli INRT"
                : "Jual INRT"}
          </button>
        ) : (
          <WalletMultiButton className="w-full" />
        )}

        <p className="text-[9px] leading-relaxed text-dim">
          Devnet only. Transaksi ditandatangani di wallet kamu; app tidak pernah
          meminta private key. Fee 0,30% masuk fee vault, bukan reserve.
        </p>
      </div>
    </Panel>
  );
}

function fmtAmountSol(raw: bigint): number {
  return Number(raw) / 1e9;
}
