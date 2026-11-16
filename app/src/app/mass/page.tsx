import type { Metadata } from "next";
import { MassView } from "@/views/MassView";

export const metadata: Metadata = {
  title: "Mass Reserve · likuiditas permanen",
  description:
    "Status Mass Reserve INERTIA: sisa reserve, fee vault, aturan add_mass, dan riwayat penambahan likuiditas di Devnet.",
  alternates: { canonical: "/mass/" },
};

export default function Page() {
  return <MassView />;
}
