import type { Metadata } from "next";
import { DocsView } from "@/views/DocsView";

export const metadata: Metadata = {
  title: "Docs · cara memakai INERTIA",
  description:
    "Panduan Devnet: wallet, faucet SOL, cara beli INRT, alamat program, aturan Mass Reserve, dan FAQ.",
  alternates: { canonical: "/docs/" },
};

export default function Page() {
  return <DocsView />;
}
