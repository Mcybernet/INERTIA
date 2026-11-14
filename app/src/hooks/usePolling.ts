"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Polling JSON endpoint sederhana dengan force-refresh. */
export function usePolling<T>(path: string, intervalMs: number) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  const load = useCallback(
    async (force = false) => {
      try {
        const url = force
          ? `${path}${path.includes("?") ? "&" : "?"}force=1`
          : path;
        const res = await fetch(url, { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error ?? `HTTP ${res.status}`);
        if (mounted.current) {
          setData(json as T);
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
    [path],
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
