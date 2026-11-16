"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "./LanguageProvider";

export function CopyButton({
  value,
  label,
}: {
  value: string;
  label?: string;
}) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  const idle = label ?? t("Salin");
  return (
    <button
      type="button"
      onClick={() => void copy()}
      aria-label={`${copied ? t("Tersalin") : idle}: ${value}`}
      className={`chip py-1 ${copied ? "chip-active" : ""}`}
    >
      {copied ? t("Tersalin") : idle}
    </button>
  );
}
