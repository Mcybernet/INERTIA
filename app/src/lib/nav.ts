export type NavItem = {
  href: string;
  label: string;
  short: string;
};

/** Urutan navigasi utama. `/` adalah Overview. */
export const NAV: NavItem[] = [
  { href: "/", label: "Overview", short: "OVR" },
  { href: "/trade", label: "Trade", short: "TRD" },
  { href: "/activity", label: "Activity", short: "ACT" },
  { href: "/mass", label: "Mass", short: "MSS" },
  { href: "/holders", label: "Holders", short: "HLD" },
  { href: "/tokenomics", label: "Tokenomics", short: "TKN" },
  { href: "/docs", label: "Docs", short: "DOC" },
];

export const EXPLORER = "https://explorer.solana.com";
export const FAUCET = "https://faucet.solana.com";
export const REPO = "https://github.com/Mcybernet/INERTIA";

export function explorerAddress(address: string): string {
  return `${EXPLORER}/address/${address}?cluster=devnet`;
}

export function explorerTx(signature: string): string {
  return `${EXPLORER}/tx/${signature}?cluster=devnet`;
}
