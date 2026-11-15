import type { Metadata } from "next";
import { TradeView } from "@/views/TradeView";

export const metadata: Metadata = {
  title: "Trade — beli & jual INRT",
  description:
    "Beli atau jual INRT terhadap pool constant-product di Solana Devnet. Fee 0,30% masuk fee vault, bukan reserve.",
  alternates: { canonical: "/trade/" },
};

export default function Page() {
  return <TradeView />;
}
