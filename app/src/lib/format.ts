const id = "id-ID";

const intFmt = new Intl.NumberFormat(id, { maximumFractionDigits: 0 });

const solFmt = new Intl.NumberFormat(id, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});

const solFineFmt = new Intl.NumberFormat(id, {
  minimumFractionDigits: 6,
  maximumFractionDigits: 9,
});

export function fmtToken(raw: bigint | string, frac = 2): string {
  const value = Number(BigInt(raw)) / 1e6;
  if (frac === 0) return intFmt.format(value);
  return new Intl.NumberFormat(id, {
    minimumFractionDigits: Math.min(frac, 2),
    maximumFractionDigits: frac,
  }).format(value);
}

export function fmtTokenInt(raw: bigint | string): string {
  return intFmt.format(Number(BigInt(raw)) / 1e6);
}

export function fmtSolLamports(lamports: bigint | string | number): string {
  const sol = Number(lamports) / 1e9;
  if (!Number.isFinite(sol)) return "—";
  if (sol !== 0 && Math.abs(sol) < 0.01) {
    return new Intl.NumberFormat(id, {
      minimumFractionDigits: 6,
      maximumFractionDigits: 9,
    }).format(sol);
  }
  return solFmt.format(sol);
}

export function fmtSolNumber(sol: number, fine = false): string {
  if (!Number.isFinite(sol)) return "—";
  if (fine || Math.abs(sol) < 0.001) return solFineFmt.format(sol);
  if (Math.abs(sol) < 1) {
    return new Intl.NumberFormat(id, {
      minimumFractionDigits: 4,
      maximumFractionDigits: 6,
    }).format(sol);
  }
  return solFmt.format(sol);
}

/** Harga SOL per token dari nilai price_scaled (1e15). */
export function fmtPrice(scaled: bigint | string): string {
  const value = Number(BigInt(scaled)) / 1e15;
  if (value === 0) return "—";
  const digits = value < 0.001 ? 9 : value < 1 ? 6 : 4;
  return new Intl.NumberFormat(id, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function fmtPct(bps: number, frac = 2): string {
  return `${new Intl.NumberFormat(id, {
    minimumFractionDigits: 0,
    maximumFractionDigits: frac,
  }).format(bps / 100)}%`;
}

export function fmtBps(bps: number): string {
  return `${new Intl.NumberFormat(id, { maximumFractionDigits: 0 }).format(bps)} bps`;
}

export function shortAddr(address: string, n = 4): string {
  if (!address) return "—";
  if (address.length <= n * 2 + 3) return address;
  return `${address.slice(0, n)}…${address.slice(-n)}`;
}

export function fmtTime(timestamp: number): string {
  if (!timestamp) return "—";
  const d = new Date(timestamp * 1000);
  return d.toLocaleTimeString(id, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function fmtDateTime(timestamp: number): string {
  if (!timestamp) return "—";
  return new Date(timestamp * 1000).toLocaleString(id, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Waktu chart selalu WIB (Asia/Jakarta), bukan zona waktu perangkat. Tabel
 * aktivitas tetap memakai waktu lokal lewat `fmtTime`/`fmtDateTime`.
 */
const WIB_TZ = "Asia/Jakarta";

const wibClockFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: WIB_TZ,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const wibDayFmt = new Intl.DateTimeFormat("id-ID", {
  timeZone: WIB_TZ,
  day: "2-digit",
  month: "short",
});

export function fmtWibClock(timestamp: number): string {
  if (!timestamp) return "—";
  return wibClockFmt.format(new Date(timestamp * 1000));
}

export function fmtWibDay(timestamp: number): string {
  if (!timestamp) return "—";
  return wibDayFmt.format(new Date(timestamp * 1000));
}

export function fmtWibDateTime(timestamp: number): string {
  if (!timestamp) return "—";
  const date = new Date(timestamp * 1000);
  return `${wibDayFmt.format(date)} ${wibClockFmt.format(date)} WIB`;
}

export function fmtAgo(timestamp: number, now = Date.now() / 1000): string {
  if (!timestamp) return "—";
  const diff = Math.max(0, Math.floor(now - timestamp));
  if (diff < 60) return `${diff}s lalu`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m lalu`;
  if (diff < 86_400) return `${Math.floor(diff / 3600)}j lalu`;
  return `${Math.floor(diff / 86_400)}h lalu`;
}

export function fmtCompact(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(id, {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}
