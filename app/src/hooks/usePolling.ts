"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type PollingLoader<T> = (force: boolean) => Promise<T>;

/** Polling loader async dengan force-refresh. */
export function usePolling<T>(loader: PollingLoader<T>, intervalMs: number) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  const load = useCallback(
    async (force = false) => {
      try {
        const json = await loader(force);
        if (mounted.current) {
          setData(json);
          setError(null);
          setLoading(false);
        }
      } catch (err) {
        if (mounted.current) {
          setError(err instanceof Error ? err.message : String(err));
          setLoading(false);
        }
      }
    },
    [loader],
  );

  useEffect(() => {
    mounted.current = true;
    void load();
    const timer = setInterval(() => void load(), intervalMs);
    return () => {
      mounted.current = false;
      clearInterval(timer);
    };
  }, [load, intervalMs]);

  return { data, error, loading, refresh: load };
}
