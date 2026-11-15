"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePolling } from "@/hooks/usePolling";
import { getHistory, getHolders, getPoolSnapshot } from "@/lib/data";
import { subscribeHistory } from "@/lib/data/history";
import type { HolderRow, HistoryEvent, PoolSnapshot } from "@/lib/types";

type Poll<T> = {
  data: T | null;
  error: string | null;
  loading: boolean;
  refresh: (force?: boolean) => Promise<void>;
};

export type HistoryProgress = { done: number; total: number };

type DataValue = {
  pool: Poll<PoolSnapshot>;
  history: Poll<HistoryEvent[]>;
  holders: Poll<HolderRow[]>;
  /** Event yang sudah tersedia, termasuk hasil fetch bertahap. */
  events: HistoryEvent[];
  progress: HistoryProgress | null;
  refreshing: boolean;
  refreshAll: () => Promise<void>;
};

const DataContext = createContext<DataValue | null>(null);

/**
 * Satu sumber data untuk semua halaman. Provider hidup di root layout,
 * jadi pindah halaman tidak memicu ulang polling dari nol.
 */
export function DataProvider({ children }: { children: ReactNode }) {
  const pool = usePolling(getPoolSnapshot, 20_000);
  const history = usePolling(getHistory, 45_000);
  const holders = usePolling(getHolders, 120_000);
  const [refreshing, setRefreshing] = useState(false);
  const [partial, setPartial] = useState<HistoryEvent[] | null>(null);
  const [progress, setProgress] = useState<HistoryProgress | null>(null);

  const { refresh: refreshPool } = pool;
  const { refresh: refreshHistory } = history;
  const { refresh: refreshHolders } = holders;

  useEffect(() => {
    return subscribeHistory((events, state) => {
      setPartial(events);
      setProgress(state.done < state.total ? state : null);
    });
  }, []);

  const events = useMemo(() => {
    if (history.data && history.data.length > 0) return history.data;
    return partial ?? [];
  }, [history.data, partial]);

  // Holder fallback butuh riwayat untuk menemukan wallet yang pernah swap.
  // Setelah riwayat pertama selesai, segarkan holder sekali.
  const lastHistoryCount = useRef(0);
  useEffect(() => {
    const count = history.data?.length ?? 0;
    if (count > 0 && lastHistoryCount.current === 0) {
      lastHistoryCount.current = count;
      void refreshHolders(true);
    }
  }, [history.data, refreshHolders]);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refreshPool(true),
        refreshHistory(true),
        refreshHolders(true),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [refreshPool, refreshHistory, refreshHolders]);

  const value = useMemo(
    () => ({
      pool,
      history,
      holders,
      events,
      progress,
      refreshing,
      refreshAll,
    }),
    [pool, history, holders, events, progress, refreshing, refreshAll],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataValue {
  const value = useContext(DataContext);
  if (!value) throw new Error("useData harus dipakai di dalam DataProvider");
  return value;
}
