import type { Metadata } from "next";
import { OverviewView } from "@/views/OverviewView";

export const metadata: Metadata = {
  title: "INERTIA — INRT · pool Devnet tanpa bonding curve",
  description:
    "Dashboard INERTIA (INRT): harga, likuiditas, candle, aktivitas on-chain, holder, dan Mass Reserve di Solana Devnet.",
  alternates: { canonical: "/" },
};

export default function Page() {
  return <OverviewView />;
}
