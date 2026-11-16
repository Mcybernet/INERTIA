"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { setFormatLang } from "@/lib/format";
import { translate, type Lang } from "@/lib/i18n";

type Vars = Record<string, string | number>;

type LanguageValue = {
  lang: Lang;
  setLang: (next: Lang) => void;
  t: (text: string, vars?: Vars) => string;
};

const LanguageContext = createContext<LanguageValue | null>(null);

const STORAGE_KEY = "inrt:lang";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("id");

  // Angka dan tanggal memakai locale modul, jadi disamakan sebelum anak
  // komponen dirender.
  setFormatLang(lang);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "id" || saved === "en") setLangState(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Mode privat bisa menolak localStorage; pilihan tetap berlaku di tab.
    }
  }, []);

  const t = useCallback(
    (text: string, vars?: Vars) => translate(lang, text, vars),
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useI18n(): LanguageValue {
  const value = useContext(LanguageContext);
  if (!value) {
    throw new Error("useI18n harus dipakai di dalam LanguageProvider");
  }
  return value;
}
