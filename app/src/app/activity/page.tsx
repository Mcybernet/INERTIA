import type { Metadata } from "next";
import { ActivityView } from "@/views/ActivityView";

export const metadata: Metadata = {
  title: "Activity · event pool on-chain",
  description:
    "Semua SwapEvent, SeedEvent, dan AddMassEvent pool INERTIA yang dibaca langsung dari RPC Devnet, tanpa indexer.",
  alternates: { canonical: "/activity/" },
};

export default function Page() {
  return <ActivityView />;
}
