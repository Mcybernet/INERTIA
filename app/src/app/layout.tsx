import type { Metadata, Viewport } from "next";
import "@solana/wallet-adapter-react-ui/styles.css";
import "./globals.css";
import { Providers } from "./providers";
import { DataProvider } from "@/components/DataProvider";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MobileTradeBar } from "@/components/MobileTradeBar";

const TITLE = "INERTIA — INRT";
const DESCRIPTION =
  "Dashboard pool INERTIA (INRT) di Solana Devnet. Constant-product, fee 0,30% kembali ke massa pool.";
const LOGO =
  "https://cdn.jsdelivr.net/gh/Mcybernet/INERTIA@main/assets/inertia-logo.png";

export const metadata: Metadata = {
  metadataBase: new URL("https://mcybernet.github.io/INERTIA"),
  title: {
    default: TITLE,
    template: "%s · INERTIA",
  },
  description: DESCRIPTION,
  applicationName: "INERTIA",
  manifest: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/manifest.webmanifest`,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    siteName: "INERTIA",
    type: "website",
    locale: "id_ID",
    images: [{ url: LOGO, width: 930, height: 930, alt: "INERTIA (INRT)" }],
  },
  twitter: {
    card: "summary",
    title: TITLE,
    description: DESCRIPTION,
    images: [LOGO],
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0C",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>
        <Providers>
          <DataProvider>
            <div className="flex min-h-screen flex-col">
              <SiteHeader />
              <main className="mx-auto w-full max-w-[1480px] flex-1 px-4 pb-24 pt-4 lg:px-6 lg:pb-10">
                {children}
              </main>
              <SiteFooter />
              <div className="h-12 lg:hidden" aria-hidden />
              <MobileTradeBar />
            </div>
          </DataProvider>
        </Providers>
      </body>
    </html>
  );
}
