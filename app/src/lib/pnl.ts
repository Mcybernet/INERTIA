import type { TradeEvent } from "./types";

/**
 * `price_scaled` memakai 1e15 SOL per token utuh. Konversi lamports per unit
 * dasar token ke `price_scaled`:
 * (lamports / 1e9) / (unit / 1e6) * 1e15 = lamports * 1e12 / unit.
 */
const LAMPORT_UNIT_PRICE = 1_000_000_000_000n;

type Lot = { qty: bigint; costLamports: bigint };

export type PortfolioPnl = {
  trades: number;
  buys: number;
  sells: number;
  /** INRT bersih yang berasal dari swap, dalam unit dasar (6 desimal). */
  swapQty: bigint;
  /** Total modal lot yang masih tersisa, dalam lamports. */
  costLamports: bigint;
  avgCostScaled: bigint | null;
  realizedLamports: bigint;
  unrealizedLamports: bigint | null;
  /** Nilai saldo ATA pada harga terkini, dalam lamports. */
  valueLamports: bigint;
  pct: number | null;
  /** Saldo ATA yang tidak punya lot pembelian, dalam unit dasar. */
  noCostQty: bigint;
  /** Token terjual yang tidak punya lot pembelian, dalam unit dasar. */
  soldNoCostQty: bigint;
};

/** Harga eksekusi satu event: SOL dibayar/diterima per INRT, scale 1e15. */
export function tradePriceScaled(event: TradeEvent): bigint | null {
  const qty = BigInt(event.tokenAmount);
  if (qty <= 0n) return null;
  return (BigInt(event.solUser) * LAMPORT_UNIT_PRICE) / qty;
}

function priceFromLot(costLamports: bigint, qty: bigint): bigint | null {
  if (qty <= 0n) return null;
  return (costLamports * LAMPORT_UNIT_PRICE) / qty;
}

/**
 * P/L portofolio dari event swap wallet yang bersangkutan.
 *
 * - `sol_user` buy adalah SOL yang benar-benar dibayar, sudah termasuk fee.
 * - `sol_user` sell adalah SOL yang benar-benar diterima, sudah setelah fee.
 * - Lot dicocokkan FIFO. Token yang dijual tanpa lot pembelian tidak dihitung
 *   sebagai P/L, supaya alokasi atau transfer tidak menghasilkan angka palsu.
 * - `ataQty` hanya dipakai untuk nilai portofolio dan penanda selisih, bukan
 *   untuk membangun modal.
 */
export function computePortfolioPnl(
  events: readonly TradeEvent[],
  currentPriceScaled: bigint,
  ataQty: bigint,
): PortfolioPnl {
  const sorted = [...events].sort(
    (a, b) => a.timestamp - b.timestamp || a.sig.localeCompare(b.sig),
  );

  const lots: Lot[] = [];
  let realizedLamports = 0n;
  let soldNoCostQty = 0n;
  let buys = 0;
  let sells = 0;

  for (const event of sorted) {
    const qty = BigInt(event.tokenAmount);
    const sol = BigInt(event.solUser);
    if (qty <= 0n || sol < 0n) continue;

    if (event.kind === "buy") {
      lots.push({ qty, costLamports: sol });
      buys += 1;
      continue;
    }

    sells += 1;
    let need = qty;
    let matchedQty = 0n;
    let costUsed = 0n;

    while (need > 0n && lots.length > 0) {
      const lot = lots[0];
      const take = need < lot.qty ? need : lot.qty;
      const portion = (lot.costLamports * take) / lot.qty;

      costUsed += portion;
      matchedQty += take;
      need -= take;
      lot.qty -= take;
      lot.costLamports -= portion;

      if (lot.qty === 0n) lots.shift();
    }

    const noCostQty = qty - matchedQty;
    soldNoCostQty += noCostQty;
    // Proses penjualan tanpa lot diabaikan, jadi tidak menyumbang P/L.
    const matchedProceeds =
      noCostQty > 0n ? (sol * matchedQty) / qty : sol;
    realizedLamports += matchedProceeds - costUsed;
  }

  let swapQty = 0n;
  let costLamports = 0n;
  for (const lot of lots) {
    swapQty += lot.qty;
    costLamports += lot.costLamports;
  }

  const avgCostScaled = priceFromLot(costLamports, swapQty);
  const hasPrice = currentPriceScaled > 0n;
  const unrealizedLamports =
    avgCostScaled !== null && hasPrice
      ? ((currentPriceScaled - avgCostScaled) * swapQty) /
        LAMPORT_UNIT_PRICE
      : null;

  const pct =
    avgCostScaled !== null && avgCostScaled > 0n && hasPrice
      ? Number(
          (currentPriceScaled * 10_000n) / avgCostScaled - 10_000n,
        ) / 100
      : null;

  const valueLamports = hasPrice
    ? (currentPriceScaled * ataQty) / LAMPORT_UNIT_PRICE
    : 0n;

  return {
    trades: sorted.length,
    buys,
    sells,
    swapQty,
    costLamports,
    avgCostScaled,
    realizedLamports,
    unrealizedLamports,
    valueLamports,
    pct,
    noCostQty: ataQty > swapQty ? ataQty - swapQty : 0n,
    soldNoCostQty,
  };
}
