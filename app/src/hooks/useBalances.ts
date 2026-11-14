"use client";

import { useCallback, useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { MINT } from "@/lib/constants";

export type Balances = {
  sol: number;
  token: bigint;
  loading: boolean;
};

const EMPTY: Balances = { sol: 0, token: 0n, loading: false };

export function useBalances(): Balances & { refresh: () => void } {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [state, setState] = useState<Balances>(EMPTY);

  const load = useCallback(async () => {
    if (!publicKey) {
      setState(EMPTY);
      return;
    }
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const ata = getAssociatedTokenAddressSync(MINT, publicKey);
      const [lamports, tokenBalance] = await Promise.all([
        connection.getBalance(publicKey, "confirmed"),
        connection.getTokenAccountBalance(ata, "confirmed").catch(() => null),
      ]);
      setState({
        sol: lamports / 1e9,
        token: tokenBalance ? BigInt(tokenBalance.value.amount) : 0n,
        loading: false,
      });
    } catch {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [connection, publicKey]);

  useEffect(() => {
    void load();
    if (!publicKey) return;
    const timer = setInterval(() => void load(), 30_000);
    return () => clearInterval(timer);
  }, [load, publicKey]);

  return { ...state, refresh: load };
}
