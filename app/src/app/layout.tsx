import type { Metadata } from "next";
import "@solana/wallet-adapter-react-ui/styles.css";
import "./globals.css";
import { Providers } from "./providers";

const TITLE = "INERTIA — INRT";
const DESCRIPTION =
  "Dashboard pool INERTIA (INRT) di Solana Devnet. Constant-product, fee 0,30% kembali ke massa pool.";
const LOGO =
  "https://cdn.jsdelivr.net/gh/Mcybernet/INERTIA@main/assets/inertia-logo.png";

export const metadata: Metadata = {
  metadataBase: new URL("https://mcybernet.github.io/INERTIA"),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: "INERTIA",
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    siteName: "INERTIA",
    type: "website",
    images: [{ url: LOGO, width: 512, height: 512, alt: "INERTIA (INRT)" }],
  },
  twitter: {
    card: "summary",
    title: TITLE,
    description: DESCRIPTION,
    images: [LOGO],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
