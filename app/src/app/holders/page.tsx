import type { Metadata } from "next";
import { HoldersView } from "@/views/HoldersView";

export const metadata: Metadata = {
  title: "Holders · distribusi INRT",
  description:
    "Peringkat token account INRT di Devnet: vault pool, Mass Reserve, owner, dan wallet dengan saldo terbesar.",
  alternates: { canonical: "/holders/" },
};

export default function Page() {
  return <HoldersView />;
}
