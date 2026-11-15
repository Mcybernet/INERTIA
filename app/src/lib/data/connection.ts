import { Connection } from "@solana/web3.js";
import { RPC_URL } from "../constants";

let cached: Connection | null = null;

/** Guard: jangan pernah menyentuh mainnet dari app ini. */
export function assertDevnet(url: string) {
  if (process.env.INERTIA_ALLOW_NON_DEVNET === "1") return;
  const ok =
    url.includes("devnet") ||
    url.includes("127.0.0.1") ||
    url.includes("localhost");
  if (!ok) {
    throw new Error(
      "RPC non-Devnet diblokir. Set INERTIA_ALLOW_NON_DEVNET=1 hanya jika benar-benar sadar.",
    );
  }
}

export function getConnection(): Connection {
  assertDevnet(RPC_URL);
  if (!cached) {
    cached = new Connection(RPC_URL, {
      commitment: "confirmed",
      // Retry 429 ditangani sendiri supaya batch riwayat bisa dipecah kecil.
      disableRetryOnRateLimit: true,
    });
  }
  return cached;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function requestFailed(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /429|too many requests|rate limit|failed to get/i.test(message);
}
