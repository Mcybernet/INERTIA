import type { Metadata } from "next";
import { TokenomicsView } from "@/views/TokenomicsView";

export const metadata: Metadata = {
  title: "Tokenomics · alokasi, fee, Mass Reserve",
  description:
    "50.000.000 INRT: alokasi 6 kategori, fee 0,30% ke massa, kebijakan Mass Reserve, tier holder, dan jadwal vesting.",
  alternates: { canonical: "/tokenomics/" },
};

export default function Page() {
  return <TokenomicsView />;
}
