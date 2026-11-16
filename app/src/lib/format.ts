export type FormatLang = "id" | "en";

/** Placeholder netral untuk nilai yang belum ada. */
export const EMPTY = "-";

let formatLang: FormatLang = "id";

/** Dipanggil provider bahasa sebelum render, supaya angka ikut bahasa aktif. */
export function setFormatLang(next: FormatLang): void {
  formatLang = next;
}

export function getFormatLocale(): string {
  return formatLang === "en" ? "en-US" : "id-ID";
}

const numberCache = new Map<string, Intl.NumberFormat>();

function nf(options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = `${formatLang}:${JSON.stringify(options)}`;
  let formatter = numberCache.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(getFormatLocale(), options);
    numberCache.set(key, formatter);
  }
  return formatter;
}

const dateCache = new Map<string, Intl.DateTimeFormat>();

function df(
  locale: string,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  const key = `${locale}:${JSON.stringify(options)}`;
  let formatter = dateCache.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, options);
    dateCache.set(key, formatter);
  }
  return formatter;
}

export function fmtToken(raw: bigint | string, frac = 2): string {
  const value = Number(BigInt(raw)) / 1e6;
  if (frac === 0) return nf({ maximumFractionDigits: 0 }).format(value);
  return nf({
    minimumFractionDigits: Math.min(frac, 2),
    maximumFractionDigits: frac,
  }).format(value);
}

export function fmtTokenInt(raw: bigint | string): string {
  return nf({ maximumFractionDigits: 0 }).format(Number(BigInt(raw)) / 1e6);
}

export function fmtSolLamports(lamports: bigint | string | number): string {
  const sol = Number(lamports) / 1e9;
  if (!Number.isFinite(sol)) return EMPTY;
  if (sol !== 0 && Math.abs(sol) < 0.01) {
    return nf({
      minimumFractionDigits: 6,
      maximumFractionDigits: 9,
    }).format(sol);
  }
  return nf({
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(sol);
}

export function fmtSolNumber(sol: number, fine = false): string {
  if (!Number.isFinite(sol)) return EMPTY;
  if (fine || Math.abs(sol) < 0.001) {
    return nf({
      minimumFractionDigits: 6,
      maximumFractionDigits: 9,
    }).format(sol);
  }
  if (Math.abs(sol) < 1) {
    return nf({
      minimumFractionDigits: 4,
      maximumFractionDigits: 6,
    }).format(sol);
  }
  return nf({
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(sol);
}

/** Harga SOL per token dari nilai price_scaled (1e15). */
export function fmtPrice(scaled: bigint | string): string {
  const value = Number(BigInt(scaled)) / 1e15;
  if (value === 0) return EMPTY;
  const digits = value < 0.001 ? 9 : value < 1 ? 6 : 4;
  return nf({
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function fmtPct(bps: number, frac = 2): string {
  return `${nf({
    minimumFractionDigits: 0,
    maximumFractionDigits: frac,
  }).format(bps / 100)}%`;
}

/**
 * Persen bertanda untuk perubahan harga. Menerima persen (bukan basis points).
 * Nol selalu `0,00%` tanpa tanda; turun memakai `-`, naik memakai `+`.
 */
export function fmtSignedPct(pct: number, frac = 2): string {
  const safe = Number.isFinite(pct) ? pct : 0;
  const abs = Math.abs(safe);
  const rounded = Number(abs.toFixed(frac));
  const body = nf({
    minimumFractionDigits: frac,
    maximumFractionDigits: frac,
  }).format(rounded);

  if (rounded === 0) return `${body}%`;
  return `${safe > 0 ? "+" : "-"}${body}%`;
}

export function fmtBps(bps: number): string {
  return `${nf({ maximumFractionDigits: 0 }).format(bps)} bps`;
}

export function shortAddr(address: string, n = 4): string {
  if (!address) return EMPTY;
  if (address.length <= n * 2 + 3) return address;
  return `${address.slice(0, n)}…${address.slice(-n)}`;
}

export function fmtTime(timestamp: number): string {
  if (!timestamp) return EMPTY;
  const d = new Date(timestamp * 1000);
  return d.toLocaleTimeString(getFormatLocale(), {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function fmtDateTime(timestamp: number): string {
  if (!timestamp) return EMPTY;
  return new Date(timestamp * 1000).toLocaleString(getFormatLocale(), {
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

function wibDayFmt(): Intl.DateTimeFormat {
  return df(getFormatLocale(), {
    timeZone: WIB_TZ,
    day: "2-digit",
    month: "short",
  });
}

export function fmtWibClock(timestamp: number): string {
  if (!timestamp) return EMPTY;
  return wibClockFmt.format(new Date(timestamp * 1000));
}

export function fmtWibDay(timestamp: number): string {
  if (!timestamp) return EMPTY;
  return wibDayFmt().format(new Date(timestamp * 1000));
}

export function fmtWibDateTime(timestamp: number): string {
  if (!timestamp) return EMPTY;
  const date = new Date(timestamp * 1000);
  return `${wibDayFmt().format(date)} ${wibClockFmt.format(date)} WIB`;
}

export function fmtAgo(timestamp: number, now = Date.now() / 1000): string {
  if (!timestamp) return EMPTY;
  const diff = Math.max(0, Math.floor(now - timestamp));
  const en = formatLang === "en";
  const suffix = en ? "ago" : "lalu";
  if (diff < 60) return `${diff}s ${suffix}`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ${suffix}`;
  if (diff < 86_400) return `${Math.floor(diff / 3600)}${en ? "h" : "j"} ${suffix}`;
  return `${Math.floor(diff / 86_400)}${en ? "d" : "h"} ${suffix}`;
}

export function fmtCompact(value: number): string {
  if (!Number.isFinite(value)) return EMPTY;
  return nf({
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}
